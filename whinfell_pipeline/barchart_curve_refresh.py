"""Convert latest Barchart futures watchlist CSV → barchart_curve_history.json.

Permanent Chunk 22 path. Used by:
  - scripts/refresh_barchart_curve_from_watchlist.py (CLI)
  - run_auto_download.py after barchart_futures_intraday fetch
  - scripts/whinfell_collect_agent.py  POST /v1/curve/refresh
  - scripts/sync_live_desk_data.sh / morning_auto_collect.sh

The Ark serves data/barchart/v1/barchart_curve_history.json only after this
file is written — panels never fetch CSVs directly.
"""

from __future__ import annotations

import csv
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

MODULE_VERSION = "1.1.0-chunk23"

REPO_ROOT = Path(__file__).resolve().parents[1]
DROP_DEFAULT = Path.home() / "Downloads" / "whinfell_drop"

DEFAULT_DESTS = (
    REPO_ROOT / "data" / "barchart" / "v1" / "barchart_curve_history.json",
    REPO_ROOT / "docs" / "data" / "barchart" / "v1" / "barchart_curve_history.json",
    REPO_ROOT / "dist" / "data" / "barchart" / "v1" / "barchart_curve_history.json",
    REPO_ROOT / "dist" / "data" / "barchart" / "barchart_curve_history.json",
)

CONTRACT_RE = re.compile(r"^([A-Z0-9]+)([FGHJKMNQUVXZ])(\d{2})$", re.I)
DATE_IN_NAME = re.compile(r"(\d{2})-(\d{2})-(\d{4})")
DATE_COMPACT = re.compile(r"(\d{4})(\d{2})(\d{2})")

# Newest + BTN26-bearing watchlist wins.
CSV_GLOBS = (
    "watchlist-wtm-futures-daily-intraday*.csv",
    "watchlist-wtm-canonical-universe-intraday*.csv",
    "futures_intraday_*.csv",
    "watchlist*intraday*.csv",
)


class CurveRefreshError(RuntimeError):
    """Raised when no usable watchlist CSV or parse fails."""


def _safe_float(val: Any) -> float | None:
    if val is None:
        return None
    s = str(val).strip().replace(",", "").replace("%", "")
    if not s or s.upper() in {"N/A", "—", "-", "NA"}:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def trade_date_from_path(path: Path) -> str:
    m = DATE_IN_NAME.search(path.name)
    if m:
        mm, dd, yyyy = m.group(1), m.group(2), m.group(3)
        return f"{yyyy}-{mm}-{dd}"
    m2 = DATE_COMPACT.search(path.name)
    if m2:
        return f"{m2.group(1)}-{m2.group(2)}-{m2.group(3)}"
    return datetime.now().date().isoformat()


def parse_watchlist_rows(path: Path) -> dict[str, dict[str, Any]]:
    trade_date = trade_date_from_path(path)
    out: dict[str, dict[str, Any]] = {}
    with path.open(encoding="utf-8", errors="replace", newline="") as fh:
        reader = csv.DictReader(fh)
        if not reader.fieldnames:
            raise CurveRefreshError(f"empty or unreadable CSV: {path}")
        for row in reader:
            sym = (row.get("Symbol") or row.get("symbol") or "").strip().upper()
            if not sym or not CONTRACT_RE.match(sym):
                continue
            if sym.startswith("DOWNLOADED"):
                continue
            close = _safe_float(row.get("Latest") or row.get("Close") or row.get("Last"))
            if close is None or close <= 0:
                continue
            out[sym] = {
                "close": close,
                "change": _safe_float(row.get("Change")),
                "pct_change": _safe_float(
                    str(row.get("%Change") or row.get("PctChange") or "").replace("%", "")
                ),
                "high": _safe_float(row.get("High")),
                "low": _safe_float(row.get("Low")),
                "volume": _safe_float(row.get("Volume")),
                "date": trade_date,
            }
    if not out:
        raise CurveRefreshError(f"no futures contract rows in {path}")
    return out


def score_csv(path: Path) -> tuple[float, dict[str, dict[str, Any]] | None]:
    """Higher score = better candidate.

    Chunk 23: rank BTN26-bearing files by **mtime only** (newest wins).
    Price is a sanity gate (>20k), never a ranking factor — otherwise an older
    high print can beat a newer ~63k quote and leave the curve stale.
    """
    try:
        quotes = parse_watchlist_rows(path)
    except (CurveRefreshError, OSError, UnicodeError, csv.Error):
        return (-1.0, None)
    mtime = path.stat().st_mtime
    btn = quotes.get("BTN26")
    btn_px = float(btn["close"]) if btn else 0.0
    # Tier 1: live BTN26 present (price sanity only).
    if btn and btn_px > 20000:
        return (1e15 + mtime + min(len(quotes), 500) * 1e-6, quotes)
    # Tier 2: any parseable futures watchlist (no BTN26) — still usable for non-BTC.
    return (mtime + min(len(quotes), 500) * 1e-6, quotes)


def find_latest_watchlist_csv(
    explicit: Path | None = None,
    drop: Path | None = None,
) -> tuple[Path, dict[str, dict[str, Any]]]:
    if explicit is not None:
        path = Path(explicit).expanduser()
        if not path.is_file():
            raise CurveRefreshError(f"missing csv: {path}")
        quotes = parse_watchlist_rows(path)
        return path, quotes

    drop_dir = Path(drop or DROP_DEFAULT).expanduser()
    candidates: list[Path] = []
    if drop_dir.is_dir():
        for pat in CSV_GLOBS:
            candidates.extend(drop_dir.glob(pat))
        # Also nested (archive) but only top-level drop preferred via mtime score.
        for pat in CSV_GLOBS:
            candidates.extend(drop_dir.rglob(pat))

    # De-dupe
    seen: set[str] = set()
    unique: list[Path] = []
    for p in candidates:
        key = str(p.resolve())
        if key in seen:
            continue
        seen.add(key)
        if p.is_file():
            unique.append(p)

    if not unique:
        raise CurveRefreshError(
            f"no watchlist/intraday CSV in {drop_dir}. "
            "Run: python3 run_auto_download.py fetch --id barchart_futures_intraday"
        )

    best_path: Path | None = None
    best_quotes: dict[str, dict[str, Any]] | None = None
    best_score = -1.0
    for path in unique:
        sc, quotes = score_csv(path)
        if quotes is None:
            continue
        if sc > best_score:
            best_score = sc
            best_path = path
            best_quotes = quotes

    if best_path is None or best_quotes is None:
        raise CurveRefreshError(f"no parseable futures CSV in {drop_dir}")
    return best_path, best_quotes


def contract_meta(sym: str) -> dict[str, str]:
    m = CONTRACT_RE.match(sym)
    if not m:
        return {
            "contract_root": sym[:2],
            "month_code": "",
            "year": "",
            "contract_type_bucket": "futures",
        }
    root, month, year = m.group(1).upper(), m.group(2).upper(), m.group(3)
    if root == "BT":
        bucket = "btc-futures-curves"
    elif root in {"TA", "ETH", "MET"}:
        bucket = "eth-micro-curves"
    else:
        bucket = "futures-curves"
    return {
        "contract_root": root,
        "month_code": month,
        "year": f"20{year}" if len(year) == 2 else year,
        "contract_type_bucket": bucket,
    }


def point_from_quote(q: dict[str, Any]) -> dict[str, Any]:
    pt: dict[str, Any] = {"close": q["close"], "date": q["date"]}
    for k in ("change", "pct_change", "high", "low", "volume"):
        if q.get(k) is not None:
            pt[k] = q[k]
    return pt


def upsert_records(
    existing: list[dict[str, Any]],
    quotes: dict[str, dict[str, Any]],
    *,
    source_file: str,
) -> list[dict[str, Any]]:
    by_sym: dict[str, dict[str, Any]] = {}
    for rec in existing:
        sym = str(rec.get("raw_symbol") or "").upper()
        if sym:
            by_sym[sym] = rec

    for sym, q in quotes.items():
        pt = point_from_quote(q)
        rec = by_sym.get(sym)
        if rec is None:
            rec = {
                "raw_symbol": sym,
                "canonical_id": f"barchart_contract_{sym.lower()}",
                "bucket": "curve",
                "source_system": "barchart",
                "fetch_mode": "watchlist_live_refresh",
                "vendor_format": "barchart_watchlist",
                "instrument_class": "futures",
                "pricing_mode": "exchange_traded",
                "contract_meta": contract_meta(sym),
                "spread_meta": {},
                "field_map_version": "1.0.0",
                "points": [],
            }
            by_sym[sym] = rec
        points = list(rec.get("points") or [])
        replaced = False
        for i, old in enumerate(points):
            if str(old.get("date") or "") == pt["date"]:
                points[i] = {**old, **pt}
                replaced = True
                break
        if not replaced:
            points.append(pt)
        points.sort(key=lambda p: str(p.get("date") or ""))
        rec["points"] = points
        rec["latest"] = dict(points[-1])
        rec["row_count"] = len(points)
        rec["fetch_mode"] = "watchlist_live_refresh"
        rec["source_file"] = source_file
        rec["contract_meta"] = rec.get("contract_meta") or contract_meta(sym)

    return sorted(by_sym.values(), key=lambda r: str(r.get("raw_symbol") or ""))


def load_existing(path: Path) -> list[dict[str, Any]]:
    if not path.is_file():
        return []
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    recs = payload.get("records")
    return list(recs) if isinstance(recs, list) else []


def write_curve_atomic(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.parent / f".{path.name}.tmp"
    tmp.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    tmp.replace(path)


def refresh_barchart_curve(
    *,
    csv_path: Path | None = None,
    drop: Path | None = None,
    base: Path | None = None,
    dests: list[Path] | None = None,
    repo_root: Path | None = None,
) -> dict[str, Any]:
    """Rebuild curve history from the best available watchlist CSV.

    Returns a result dict (never raises for CLI-friendly agent use when wrapped).
    """
    root = Path(repo_root) if repo_root else REPO_ROOT
    base_path = Path(base) if base else root / "data" / "barchart" / "v1" / "barchart_curve_history.json"
    dest_list = list(dests) if dests is not None else [
        root / "data" / "barchart" / "v1" / "barchart_curve_history.json",
        root / "docs" / "data" / "barchart" / "v1" / "barchart_curve_history.json",
        root / "dist" / "data" / "barchart" / "v1" / "barchart_curve_history.json",
        root / "dist" / "data" / "barchart" / "barchart_curve_history.json",
    ]

    path, quotes = find_latest_watchlist_csv(csv_path, drop)
    existing = load_existing(base_path)
    records = upsert_records(existing, quotes, source_file=str(path))
    as_of = datetime.now(timezone.utc).isoformat()
    trade_date = next(iter(quotes.values()))["date"]
    max_date = max((str(q["date"]) for q in quotes.values()), default=trade_date)
    btn = quotes.get("BTN26") or {}

    payload = {
        "version": "1.0.0",
        "bucket": "curve",
        "as_of": as_of,
        "symbol_count": len(records),
        "refresh": {
            "mode": "watchlist_live_refresh",
            "module_version": MODULE_VERSION,
            "source_csv": str(path),
            "quote_count": len(quotes),
            "trade_date": trade_date,
            "max_quote_date": max_date,
            "refreshed_at": as_of,
            "btn26_close": btn.get("close"),
        },
        "records": records,
    }

    written: list[str] = []
    for dest in dest_list:
        write_curve_atomic(dest, payload)
        written.append(str(dest))

    # Post-write verify: disk latest must match the selected watchlist quote.
    verified_btn: float | None = None
    try:
        disk = json.loads(base_path.read_text(encoding="utf-8"))
        for rec in disk.get("records") or []:
            if str(rec.get("raw_symbol") or "").upper() == "BTN26":
                verified_btn = (rec.get("latest") or {}).get("close")
                break
    except (OSError, json.JSONDecodeError, TypeError):
        verified_btn = None

    expected_btn = btn.get("close")
    if expected_btn is not None and verified_btn is not None:
        if abs(float(verified_btn) - float(expected_btn)) > 0.01:
            raise CurveRefreshError(
                f"post-write BTN26 mismatch: disk={verified_btn} csv={expected_btn} path={base_path}"
            )

    return {
        "ok": True,
        "module_version": MODULE_VERSION,
        "source_csv": str(path),
        "as_of": as_of,
        "max_quote_date": max_date,
        "trade_date": trade_date,
        "quote_symbols": len(quotes),
        "curve_records": len(records),
        "BTN26_close": expected_btn,
        "BTN26_date": btn.get("date"),
        "BTN26_verified": verified_btn,
        "written": written,
        "payload_preview": {
            "as_of": as_of,
            "symbol_count": len(records),
            "BTN26": btn or None,
        },
    }


def main(argv: list[str] | None = None) -> int:
    import argparse

    ap = argparse.ArgumentParser(
        description="Refresh barchart_curve_history.json from latest Barchart watchlist CSV",
    )
    ap.add_argument("--csv", type=Path, default=None)
    ap.add_argument("--drop", type=Path, default=None)
    ap.add_argument("--base", type=Path, default=None)
    ap.add_argument("--json", action="store_true", help="Emit result JSON only")
    args = ap.parse_args(argv)

    try:
        result = refresh_barchart_curve(csv_path=args.csv, drop=args.drop, base=args.base)
    except CurveRefreshError as exc:
        if args.json:
            print(json.dumps({"ok": False, "error": str(exc)}))
        else:
            print(f"ERROR: {exc}", flush=True)
        return 1

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print("curve_refresh_ok")
        for key in (
            "source_csv",
            "as_of",
            "max_quote_date",
            "quote_symbols",
            "curve_records",
            "BTN26_close",
            "BTN26_date",
        ):
            print(f"{key}={result.get(key)}")
        for w in result.get("written") or []:
            print(f"wrote={w}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
