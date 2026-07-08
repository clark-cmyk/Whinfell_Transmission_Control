/**
 * WTM Auto Collect — one-click Barchart/Koyfin CSV download via local collect agent.
 * Requires: python3 scripts/whinfell_collect_agent.py (or Whinfell_Morning_Collect.command)
 */
(function autoCollectPanel(global) {
  'use strict';

  const COLLECT_BUILD = '0.3-AUTO-COLLECT-CURVE-2026-07-05';
  const JOB_POLL_INTERVAL_MS = 2000;
  const JOB_POLL_TIMEOUT_MS = 600000;
  const AGENT_BASE = 'http://127.0.0.1:8767';
  const FALLBACK_CMD = 'bash scripts/morning_auto_collect.sh';
  const AGENT_START_CMD = 'python3 scripts/whinfell_collect_agent.py';

  const EXPORT_IDS = {
    barchart: 'barchart_futures_intraday',
    koyfin: 'koyfin_rates',
  };

  let busy = false;

  function notify(msg) {
    if (typeof global.showToast === 'function') global.showToast(msg);
    else if (global.WMC?.Utils?.showToast) global.WMC.Utils.showToast(msg);
    else console.log('[AutoCollect]', msg);
  }

  async function agentFetch(path, opts = {}) {
    const url = `${AGENT_BASE}${path}`;
    const res = await fetch(url, {
      method: opts.method || 'GET',
      headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
    const text = await res.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
    return { ok: res.ok, status: res.status, data };
  }

  async function pingAgent() {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 1200);
      const { ok, data } = await agentFetch('/health', { signal: ctrl.signal });
      clearTimeout(t);
      return ok && data.ok;
    } catch {
      return false;
    }
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  function ensureOfflineBanner() {
    const doc = global.document;
    if (!doc?.body) return null;

    let banner = doc.getElementById('collectAgentOffline');
    if (banner) return banner;

    banner = doc.createElement('aside');
    banner.id = 'collectAgentOffline';
    banner.className = 'collect-agent-offline';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
    banner.innerHTML = `
      <p class="collect-agent-offline-title">Collect agent offline</p>
      <p class="collect-agent-offline-msg" data-collect-agent-msg></p>
      <code class="collect-agent-offline-cmd"></code>
      <div class="collect-agent-offline-actions">
        <button type="button" class="console-chip console-chip--primary collect-agent-offline-copy">Copy Command</button>
        <button type="button" class="console-chip console-chip--meta collect-agent-offline-dismiss">Dismiss</button>
      </div>
    `;

    banner.querySelector('.collect-agent-offline-copy')?.addEventListener('click', async () => {
      const cmd = banner.dataset.cmd || AGENT_START_CMD;
      const copied = await copyText(cmd);
      notify(
        copied
          ? 'Start command copied — paste in Terminal to launch the collect agent'
          : `Copy failed — run in Terminal: ${cmd}`,
      );
    });
    banner.querySelector('.collect-agent-offline-dismiss')?.addEventListener('click', () => {
      banner.classList.remove('collect-agent-offline--show');
    });

    doc.body.appendChild(banner);
    return banner;
  }

  function showAgentOfflinePrompt(contextLabel = 'Collect CSVs') {
    const banner = ensureOfflineBanner();
    if (!banner) {
      notify(`Collect agent offline — run in Terminal: ${AGENT_START_CMD}`);
      return { ok: false, mode: 'offline-fallback' };
    }

    banner.dataset.cmd = AGENT_START_CMD;
    const msg = banner.querySelector('[data-collect-agent-msg]');
    const cmdEl = banner.querySelector('.collect-agent-offline-cmd');
    if (msg) {
      msg.textContent = `The local collect agent is not listening on ${AGENT_BASE}. Start it, then click ${contextLabel} again.`;
    }
    if (cmdEl) cmdEl.textContent = AGENT_START_CMD;
    banner.classList.add('collect-agent-offline--show');
    notify('Collect agent offline — use Copy Command below to start the server');
    updateAgentStatusChip(false);
    return { ok: false, mode: 'offline-prompt' };
  }

  async function fallbackClipboard(label) {
    return showAgentOfflinePrompt(label);
  }

  async function updateAgentStatusChip(forceAlive) {
    const btn = global.document?.getElementById('btnCollectAgentStatus');
    if (!btn) return null;
    const alive = typeof forceAlive === 'boolean' ? forceAlive : await pingAgent();
    btn.classList.toggle('wtm-collect-agent--online', alive);
    btn.classList.toggle('wtm-collect-agent--offline', !alive);
    btn.textContent = alive ? 'Agent ●' : 'Agent ○';
    btn.title = alive
      ? `Collect agent ready at ${AGENT_BASE}`
      : `Collect agent offline — click for start command: ${AGENT_START_CMD}`;
    btn.setAttribute('aria-label', alive ? 'Collect agent online' : 'Collect agent offline');
    return alive;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function pollJob(jobId, opts = {}) {
    if (!jobId) return { ok: false, status: 'missing_job_id', job: null };
    const intervalMs = opts.intervalMs ?? JOB_POLL_INTERVAL_MS;
    const timeoutMs = opts.timeoutMs ?? JOB_POLL_TIMEOUT_MS;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try {
        const { ok, data } = await agentFetch(`/v1/job/${jobId}`);
        if (ok && data?.status === 'done') {
          return { ok: true, status: 'done', job: data };
        }
        if (data?.status === 'failed' || data?.status === 'error') {
          return { ok: false, status: data.status, job: data };
        }
      } catch { /* retry until timeout */ }
      await sleep(intervalMs);
    }
    return { ok: false, status: 'timeout', job: null };
  }

  async function reloadDeskDataAfterCollect() {
    if (typeof global.WTM_DeskOps?.refreshAllDeskData === 'function') {
      const out = await global.WTM_DeskOps.refreshAllDeskData({ silent: true });
      const r = out?.results || {};
      return {
        hydrationOk: !!r.hydration,
        curveOk: !!r.curve,
        wmcOk: !!r.wmc,
      };
    }
    return { hydrationOk: false, curveOk: false, wmcOk: false };
  }

  async function onMorningCollectComplete(pollResult) {
    if (pollResult?.ok) {
      const { hydrationOk, curveOk, wmcOk } = await reloadDeskDataAfterCollect();
      if (typeof global.renderAll === 'function') {
        try { global.renderAll(); } catch { /* ignore */ }
      }
      if (typeof global.WMC?.refreshAfterCollect === 'function') {
        if (wmcOk) {
          notify('Collect complete — Midwest Compute data refreshed');
        } else {
          notify('Collect complete — partial refresh (check hydration path)');
        }
      } else if (hydrationOk && curveOk) {
        notify('Collect complete — BasisWatch curve refreshed');
      } else if (hydrationOk || curveOk) {
        notify('Collect complete — partial desk refresh (check curve or hydration paths)');
      } else {
        notify('Collect complete — run scripts/sync_live_desk_data.sh or Refresh curve in BasisWatch');
      }
      return { ok: true, hydrationOk, curveOk, wmcOk };
    }

    const job = pollResult?.job || {};
    const tail = String(job.stderr_tail || job.error || '').trim();
    const snippet = tail ? tail.slice(-200) : '';
    notify(
      `Collect failed (${pollResult?.status || 'error'})${snippet ? ` — ${snippet}` : ''} — check Terminal`,
    );
    return { ok: false, status: pollResult?.status || 'error' };
  }

  async function openTerminalCollect() {
    try {
      const { ok, data } = await agentFetch('/v1/collect/terminal', { method: 'POST' });
      if (ok && data.ok) {
        notify('Morning collect opened in Terminal — Comet may prompt for Barchart/Koyfin login');
        return { ok: true, mode: 'terminal' };
      }
    } catch { /* fall through */ }
    return null;
  }

  async function triggerMorningCollect() {
    if (busy) {
      notify('Collect already running — check Terminal or Comet');
      return { ok: false, mode: 'busy' };
    }
    busy = true;
    try {
      const alive = await pingAgent();
      if (!alive) {
        const term = await openTerminalCollect();
        if (term) return term;
        return fallbackClipboard('Collect CSVs');
      }

      const { ok, data } = await agentFetch('/v1/collect/morning', { method: 'POST' });
      if (ok && data.ok) {
        notify(`Morning collect started (job ${data.job_id}) — Barchart + wired Koyfin → drop → chain`);
        updateAgentStatusChip(true);
        const pollResult = await pollJob(data.job_id);
        const complete = await onMorningCollectComplete(pollResult);
        return {
          ok: complete.ok,
          mode: 'agent',
          job_id: data.job_id,
          job_status: pollResult.status,
          hydrationOk: complete.hydrationOk,
          curveOk: complete.curveOk,
        };
      }

      const term = await openTerminalCollect();
      if (term) return term;
      return fallbackClipboard('Collect CSVs');
    } finally {
      busy = false;
    }
  }

  async function triggerFetch(exportId) {
    if (!exportId) {
      notify('Missing export id');
      return { ok: false, mode: 'error' };
    }
    if (busy) {
      notify('Collect already running');
      return { ok: false, mode: 'busy' };
    }
    busy = true;
    try {
      const alive = await pingAgent();
      if (!alive) {
        showAgentOfflinePrompt('Collect');
        return { ok: false, mode: 'offline-prompt' };
      }

      const { ok, data } = await agentFetch('/v1/collect/fetch', {
        method: 'POST',
        body: { id: exportId },
      });
      if (ok && data.ok) {
        notify(`Fetch started: ${exportId} (job ${data.job_id})`);
        updateAgentStatusChip(true);
        return { ok: true, mode: 'agent', job_id: data.job_id };
      }
      notify(`Fetch failed for ${exportId}`);
      return { ok: false, mode: 'error' };
    } finally {
      busy = false;
    }
  }

  async function triggerBarchartCollect() {
    return triggerFetch(EXPORT_IDS.barchart);
  }

  async function triggerKoyfinCollect() {
    return triggerFetch(EXPORT_IDS.koyfin);
  }

  async function triggerAgentStatusClick() {
    const alive = await pingAgent();
    if (alive) {
      notify(`Collect agent ready at ${AGENT_BASE}`);
    } else {
      showAgentOfflinePrompt('Collect CSVs');
    }
    updateAgentStatusChip(alive);
    return { ok: alive, mode: alive ? 'online' : 'offline-prompt' };
  }

  async function refreshDropStatus() {
    const alive = await pingAgent();
    if (!alive) return null;
    try {
      const { ok, data } = await agentFetch('/v1/status');
      return ok ? data : null;
    } catch {
      return null;
    }
  }

  function setButtonBusy(btn, on) {
    if (!btn) return;
    btn.disabled = !!on;
    btn.classList.toggle('wtm-collect--busy', !!on);
    btn.setAttribute('aria-busy', on ? 'true' : 'false');
  }

  function wireButton(id, handler) {
    const btn = global.document?.getElementById(id);
    if (!btn || btn._autoCollectBound) return;
    btn._autoCollectBound = true;
    btn.addEventListener('click', async () => {
      setButtonBusy(btn, true);
      try {
        await handler();
      } catch (err) {
        notify(`Collect error: ${err?.message || err}`);
      } finally {
        setButtonBusy(btn, false);
      }
    });
  }

  function wireAll() {
    wireButton('btnMorningCollect', triggerMorningCollect);
    wireButton('btnCollectAgentStatus', triggerAgentStatusClick);
    if (typeof global.WTM_DeskOps?.wireAll === 'function') {
      global.WTM_DeskOps.wireAll();
    }
    updateAgentStatusChip().catch(() => updateAgentStatusChip(false));
  }

  const api = {
    COLLECT_BUILD,
    AGENT_BASE,
    AGENT_START_CMD,
    FALLBACK_CMD,
    EXPORT_IDS,
    pingAgent,
    showAgentOfflinePrompt,
    updateAgentStatusChip,
    triggerMorningCollect,
    triggerFetch,
    triggerBarchartCollect,
    triggerKoyfinCollect,
    triggerAgentStatusClick,
    refreshDropStatus,
    pollJob,
    reloadDeskDataAfterCollect,
    onMorningCollectComplete,
    wireAll,
  };

  global.WTM_AutoCollect = api;
  global.__testExports = global.__testExports || {};
  global.__testExports.autoCollect = api;

  if (global.document?.readyState === 'loading') {
    global.document.addEventListener('DOMContentLoaded', wireAll);
  } else {
    wireAll();
  }
})(typeof window !== 'undefined' ? window : globalThis);