/**
 * WTM Publish Web — one-click gh-pages deploy via local collect agent.
 * Requires: python3 scripts/whinfell_collect_agent.py
 */
(function publishWebPanel(global) {
  'use strict';

  const PUBLISH_BUILD = '0.1-PUBLISH-WEB-2026-07-06';
  const AGENT_BASE = 'http://127.0.0.1:8767';
  const PAGES_URL = 'https://clark-cmyk.github.io/Whinfell_Transmission_Control/';
  const FALLBACK_CMD = 'bash scripts/publish_ghpages.sh';
  const AGENT_START_CMD = 'python3 scripts/whinfell_collect_agent.py';
  const JOB_POLL_INTERVAL_MS = 3000;
  const JOB_POLL_TIMEOUT_MS = 900000;

  let busy = false;

  function isWebHost() {
    try {
      return global.location?.hostname?.endsWith('github.io');
    } catch {
      return false;
    }
  }

  function notify(msg) {
    if (typeof global.showToast === 'function') global.showToast(msg);
    else console.log('[PublishWeb]', msg);
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

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function pollJob(jobId) {
    if (!jobId) return { ok: false, status: 'missing_job_id', job: null };
    const deadline = Date.now() + JOB_POLL_TIMEOUT_MS;
    while (Date.now() < deadline) {
      try {
        const { ok, data } = await agentFetch(`/v1/job/${jobId}`);
        if (ok && data?.status === 'done') return { ok: true, status: 'done', job: data };
        if (data?.status === 'failed' || data?.status === 'error') {
          return { ok: false, status: data.status, job: data };
        }
      } catch { /* retry */ }
      await sleep(JOB_POLL_INTERVAL_MS);
    }
    return { ok: false, status: 'timeout', job: null };
  }

  function hideLocalOnlyControls() {
    if (!isWebHost()) return;
    ['btnPublishWeb', 'btnMorningCollect', 'btnCollectAgentStatus'].forEach((id) => {
      const el = global.document?.getElementById(id);
      if (el) el.classList.add('hidden');
    });
  }

  async function triggerPublishWeb(opts = {}) {
    if (busy) {
      notify('Publish already running — check Terminal');
      return { ok: false, mode: 'busy' };
    }
    busy = true;
    const btn = global.document?.getElementById('btnPublishWeb');
    if (btn) {
      btn.disabled = true;
      btn.classList.add('wtm-publish--busy');
    }
    try {
      const alive = await pingAgent();
      if (!alive) {
        const copied = await copyText(FALLBACK_CMD);
        notify(
          copied
            ? `Collect agent offline — copied: ${FALLBACK_CMD}`
            : `Collect agent offline — run in Terminal: ${FALLBACK_CMD}`,
        );
        return { ok: false, mode: 'offline-fallback' };
      }

      const { ok, data } = await agentFetch('/v1/publish/web', {
        method: 'POST',
        body: { collect: !!opts.collect },
      });
      if (!ok || !data.ok) {
        notify('Publish failed to start — try Terminal: ' + FALLBACK_CMD);
        return { ok: false, mode: 'error' };
      }

      notify(`Publishing to gh-pages (job ${data.job_id})…`);
      const pollResult = await pollJob(data.job_id);
      if (pollResult.ok) {
        notify(`Published — ${PAGES_URL}`);
        if (typeof global.WTM_loadWebPublishStamp === 'function') {
          global.WTM_loadWebPublishStamp().catch(() => {});
        }
        return { ok: true, mode: 'agent', job_id: data.job_id };
      }

      const tail = String(pollResult.job?.stderr_tail || pollResult.job?.error || '').trim().slice(-200);
      notify(`Publish failed (${pollResult.status})${tail ? ` — ${tail}` : ''}`);
      return { ok: false, mode: pollResult.status || 'error' };
    } finally {
      busy = false;
      if (btn) {
        btn.disabled = false;
        btn.classList.remove('wtm-publish--busy');
      }
    }
  }

  function wireAll() {
    hideLocalOnlyControls();
    const btn = global.document?.getElementById('btnPublishWeb');
    if (!btn || btn._publishWebBound) return;
    btn._publishWebBound = true;
    btn.addEventListener('click', () => triggerPublishWeb({ collect: false }));
  }

  const api = Object.freeze({
    PUBLISH_BUILD,
    PAGES_URL,
    FALLBACK_CMD,
    AGENT_START_CMD,
    isWebHost,
    hideLocalOnlyControls,
    triggerPublishWeb,
    wireAll,
  });

  global.WTM_PublishWeb = api;
  global.__testExports = global.__testExports || {};
  global.__testExports.publishWeb = api;

  if (global.document?.readyState === 'loading') {
    global.document.addEventListener('DOMContentLoaded', wireAll);
  } else {
    wireAll();
  }
})(typeof window !== 'undefined' ? window : globalThis);