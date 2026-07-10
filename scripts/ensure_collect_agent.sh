#!/usr/bin/env bash
# Ensure a curve-capable collect agent is listening for this checkout.
# Chunk 22/23 permanent path: ARK / DeskOps need /v1/curve/refresh on :8767.
#
# Replaces stale Desktop agents (v0.1.0, no curve APIs) that block the default port.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO="${WHINFELL_TC_ROOT:-$(cd "$SCRIPT_DIR/.." && pwd)}"
PORT="${WHINFELL_COLLECT_PORT:-8767}"
BIND="${WHINFELL_COLLECT_BIND:-127.0.0.1}"
LOG="${WHINFELL_COLLECT_LOG:-/tmp/whinfell_collect_agent.log}"
HEALTH_URL="http://${BIND}:${PORT}/health"
CURVE_URL="http://${BIND}:${PORT}/v1/curve/status"

cd "$REPO"

agent_supports_curve() {
  local health curve
  health="$(curl -sf --max-time 2 "$HEALTH_URL" 2>/dev/null || true)"
  if [[ -z "$health" ]]; then
    return 1
  fi
  # Prefer explicit curve endpoint (old agents return {"error":"not_found"}).
  curve="$(curl -sf --max-time 2 "$CURVE_URL" 2>/dev/null || true)"
  if [[ -z "$curve" ]]; then
    return 1
  fi
  if echo "$curve" | python3 -c 'import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get("ok") is True or d.get("BTN26") is not None or d.get("path") else 1)' 2>/dev/null; then
    # Also require agent repo matches this checkout when reported.
    local repo_reported
    repo_reported="$(echo "$health" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("repo") or "")' 2>/dev/null || true)"
    if [[ -n "$repo_reported" && "$repo_reported" != "$REPO" ]]; then
      echo "ensure_collect_agent: wrong repo on :$PORT ($repo_reported) — will replace with $REPO"
      return 1
    fi
    return 0
  fi
  return 1
}

stop_listener_on_port() {
  local pids
  pids="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -z "$pids" ]]; then
    return 0
  fi
  echo "ensure_collect_agent: stopping stale listener(s) on :$PORT → $pids"
  # shellcheck disable=SC2086
  kill $pids 2>/dev/null || true
  sleep 0.4
  pids="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    # shellcheck disable=SC2086
    kill -9 $pids 2>/dev/null || true
    sleep 0.2
  fi
}

if agent_supports_curve; then
  ver="$(curl -sf --max-time 2 "$HEALTH_URL" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("version",""))' 2>/dev/null || true)"
  echo "ensure_collect_agent: ok :$PORT version=${ver:-unknown} repo=$REPO"
  exit 0
fi

echo "ensure_collect_agent: no curve-capable agent on :$PORT — starting from $REPO"
stop_listener_on_port

nohup python3 "$REPO/scripts/whinfell_collect_agent.py" --port "$PORT" --bind "$BIND" \
  >"$LOG" 2>&1 &
echo $! > /tmp/whinfell_collect_agent.pid

for _ in 1 2 3 4 5 6 7 8 9 10; do
  if agent_supports_curve; then
    ver="$(curl -sf --max-time 2 "$HEALTH_URL" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("version",""))' 2>/dev/null || true)"
    echo "ensure_collect_agent: started :$PORT version=${ver:-unknown}"
    echo "ensure_collect_agent: log=$LOG"
    exit 0
  fi
  sleep 0.3
done

echo "ensure_collect_agent: FAIL — agent did not expose /v1/curve/status on :$PORT" >&2
echo "ensure_collect_agent: last log lines:" >&2
tail -n 30 "$LOG" 2>/dev/null || true
exit 1
