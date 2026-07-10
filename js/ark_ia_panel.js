/**
 * The Ark — Dig-layer control dashboard (presentation only).
 * Reads data exclusively through WTM_Ark (no raw file loads).
 */
(function arkIaPanel(global) {
  'use strict';

  const BUILD = 'ARK-IA-1.3.0-CHUNK24-REFRESH-ALL-2026-07-09';
  /** Preferred ports — desk defaults to 8767; worktree/dev often runs 8768 when 8767 is occupied by an older agent. */
  const AGENT_PORTS = [8767, 8768, 8769];
  const AGENT_DEFAULT = 'http://127.0.0.1:8767';

  let active = false;
  let wired = false;
  /** @type {(() => void)|null} */
  let unsubscribe = null;
  /** @type {{ base: string, version: string|null, repo: string|null }|null} */
  let resolvedAgent = null;

  function el(id) {
    return global.document?.getElementById(id) || null;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function notify(msg) {
    if (typeof global.showToast === 'function') global.showToast(msg);
    else console.log('[ArkIaPanel]', msg);
  }

  function getArk() {
    return global.WTM_Ark || null;
  }

  /**
   * Chunk 23 — find a collect agent that actually supports curve refresh.
   * Stale agents (v0.1.0 without /v1/curve/*) on :8767 used to silently fail.
   */
  async function resolveAgentBase(force) {
    if (!force && resolvedAgent && resolvedAgent.base) return resolvedAgent;

    let fallback = null;
    for (let i = 0; i < AGENT_PORTS.length; i += 1) {
      const port = AGENT_PORTS[i];
      const base = `http://127.0.0.1:${port}`;
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 1800);
        const res = await fetch(`${base}/health`, { cache: 'no-store', signal: ctrl.signal });
        clearTimeout(t);
        if (!res.ok) continue;
        const health = await res.json().catch(() => ({}));
        if (!health || !health.ok) continue;

        const version = health.version != null ? String(health.version) : null;
        const supportsCurve = version
          ? /curve/i.test(version) || /^0\.[2-9]/.test(version) || /^[1-9]/.test(version)
          : false;

        // Confirm curve endpoint exists (old Desktop agents return not_found).
        let curveOk = false;
        try {
          const cs = await fetch(`${base}/v1/curve/status`, { cache: 'no-store' });
          const body = await cs.json().catch(() => ({}));
          curveOk = cs.ok && body && body.error !== 'not_found' && (body.ok === true || body.BTN26 != null || body.path);
        } catch (_) {
          curveOk = false;
        }

        const candidate = {
          base,
          version,
          repo: health.repo || null,
          supportsCurve: !!(supportsCurve || curveOk),
        };
        if (candidate.supportsCurve) {
          resolvedAgent = candidate;
          return resolvedAgent;
        }
        if (!fallback) fallback = candidate;
      } catch (_) {
        /* try next port */
      }
    }

    resolvedAgent = fallback || { base: AGENT_DEFAULT, version: null, repo: null, supportsCurve: false };
    return resolvedAgent;
  }

  async function agentFetch(path, init) {
    const agent = await resolveAgentBase(false);
    const url = `${agent.base}${path}`;
    const res = await fetch(url, init);
    // If default port is a dead/old agent, re-probe once and retry.
    if (res.status === 404 && path.indexOf('/v1/curve/') === 0) {
      resolvedAgent = null;
      const again = await resolveAgentBase(true);
      if (again.base !== agent.base) {
        return fetch(`${again.base}${path}`, init);
      }
    }
    return res;
  }

  function statusChipClass(status) {
    const s = String(status || 'unavailable').toLowerCase();
    if (s === 'ok') return 'console-chip console-chip--ok';
    if (s === 'missing' || s === 'stale') return 'console-chip console-chip--warn';
    if (s === 'error') return 'console-chip console-chip--risk';
    return 'console-chip console-chip--meta';
  }

  function formatTime(iso) {
    if (typeof global.WTM_formatLocalStamp === 'function') {
      return global.WTM_formatLocalStamp(iso, { fallback: '—' });
    }
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return String(iso);
      return d.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, 'Z');
    } catch (_) {
      return String(iso);
    }
  }

  /**
   * Diagnostic prompt for Fix with LLM (built from Ark inventory only).
   */
  function buildFixWithLlmPrompt() {
    const ark = getArk();
    const stamp = ark && typeof ark.getStamp === 'function' ? ark.getStamp() : {};
    const sources = ark && typeof ark.getSources === 'function'
      ? ark.getSources()
      : (stamp.sources || []);

    const lines = [
      '**WTC Ark Diagnostic — Fix with LLM**',
      '',
      'You are helping debug Whinfell Transmission Control data loading (The Ark SSOT).',
      'Only ark.js may load raw data files. Summarize what is broken and give a short fix plan.',
      '',
      '**Stamp**',
      `- as_of: ${formatTime(stamp.as_of) || 'null'}`,
      `- snapshot_id: ${stamp.snapshot_id || 'null'}`,
      `- freshness_status: ${stamp.freshness_status || 'null'}`,
      `- lastRefreshedAt: ${formatTime(stamp.lastRefreshedAt) || 'null'}`,
      `- Ark BUILD: ${ark?.BUILD || 'missing'}`,
      '',
      '**Data sources**',
    ];

    if (!sources.length) {
      lines.push('- (no sources registered — WTM_Ark may not be loaded)');
    } else {
      sources.forEach((src) => {
        lines.push(
          `- ${src.id}: status=${src.status || '—'} url=${src.url || '—'} `
          + `lastSuccess=${formatTime(src.lastSuccessAt) || '—'} error=${src.error || 'none'}`
        );
      });
    }

    lines.push(
      '',
      '**Expected paths**',
      '- data/hydration/latest.json',
      '- data/barchart/v1/barchart_curve_history.json',
      '- bang_bang_da/bang_bang_da_report.json',
      '- bang_bang_da/litmus/crypto_market.json (CoinGlass / Litmus)',
      '',
      '**Environment notes**',
      `- location.protocol: ${global.location?.protocol || 'unknown'}`,
      '- file: protocol cannot fetch JSON (use http(s) desk host or manual import)',
      '',
      '**Instructions**',
      '1. Identify which sources failed and why.',
      '2. Suggest the smallest safe fix (path, publish, collect, or Ark rewire).',
      '3. Keep the response concise and operator-friendly.',
    );

    return lines.join('\n');
  }

  async function copyText(text) {
    try {
      if (global.navigator?.clipboard?.writeText) {
        await global.navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) { /* fall through */ }
    return false;
  }

  async function onFixWithLlm() {
    const prompt = buildFixWithLlmPrompt();
    const ok = await copyText(prompt);
    if (ok) notify('Ark diagnostic prompt copied to clipboard');
    else notify('Clipboard denied — open console for prompt');
    if (!ok) console.log(prompt);
  }

  function renderSourcesTable(sources) {
    const rows = (sources || []).map((src) => {
      const chip = statusChipClass(src.status);
      return (
        `<tr>`
        + `<td>${escapeHtml(src.id)}</td>`
        + `<td><code class="ark-source-url">${escapeHtml(src.url)}</code></td>`
        + `<td><span class="${chip}">${escapeHtml(src.status || '—')}</span></td>`
        + `<td>${escapeHtml(formatTime(src.lastSuccessAt))}</td>`
        + `<td class="ark-source-error">${escapeHtml(src.error || '—')}</td>`
        + `</tr>`
      );
    }).join('');

    return (
      `<div class="ark-panel-block">`
      + `<div class="ark-panel-block__head">`
      + `<span class="ark-panel-block__title">Data sources</span>`
      + `</div>`
      + `<div class="ark-table-wrap">`
      + `<table class="ark-sources-table" aria-label="Ark data sources">`
      + `<thead><tr>`
      + `<th>Source</th><th>Path</th><th>Status</th><th>Last success</th><th>Error</th>`
      + `</tr></thead>`
      + `<tbody>${rows || '<tr><td colspan="5">No sources</td></tr>'}</tbody>`
      + `</table>`
      + `</div>`
      + `</div>`
    );
  }

  function renderStampStrip(stamp) {
    const asOf = formatTime(stamp?.as_of);
    const snap = stamp?.snapshot_id || '—';
    const fresh = stamp?.freshness_status || '—';
    const last = formatTime(stamp?.lastRefreshedAt);

    return (
      `<div class="ark-stamp-strip" role="status" aria-live="polite">`
      + `<span class="console-chip console-chip--meta">as_of · ${escapeHtml(asOf)}</span>`
      + `<span class="console-chip console-chip--meta">snapshot · ${escapeHtml(snap)}</span>`
      + `<span class="console-chip console-chip--meta">freshness · ${escapeHtml(fresh)}</span>`
      + `<span class="console-chip console-chip--meta">last refresh · ${escapeHtml(last)}</span>`
      + `</div>`
    );
  }

  function curveSummaryFromArk(ark) {
    const curve = typeof ark.getCurveHistory === 'function' ? ark.getCurveHistory() : null;
    if (!curve || !Array.isArray(curve.records)) return null;
    let maxDate = '';
    let btn = null;
    curve.records.forEach((rec) => {
      const lat = rec.latest || {};
      const d = String(lat.date || '');
      if (d > maxDate) maxDate = d;
      if (String(rec.raw_symbol || '').toUpperCase() === 'BTN26') {
        btn = { close: lat.close, date: lat.date };
      }
    });
    return {
      as_of: curve.as_of || null,
      max_quote_date: maxDate || curve.refresh?.max_quote_date || null,
      symbol_count: curve.symbol_count || (curve.records || []).length,
      BTN26: btn,
      refresh: curve.refresh || null,
    };
  }

  function renderCurveBlock(summary) {
    if (!summary) {
      return (
        `<div class="ark-panel-block">`
        + `<div class="ark-panel-block__head"><span class="ark-panel-block__title">Barchart curve</span></div>`
        + `<p class="ark-help">No curve in Ark cache — click <strong>Refresh All Data</strong> (rebuilds curve when collect agent is up).</p>`
        + `</div>`
      );
    }
    const btnPx = summary.BTN26?.close != null
      ? `$${Number(summary.BTN26.close).toLocaleString('en-US')}`
      : '—';
    const btnDate = summary.BTN26?.date || '—';
    return (
      `<div class="ark-panel-block">`
      + `<div class="ark-panel-block__head"><span class="ark-panel-block__title">Barchart curve</span></div>`
      + `<div class="ark-stamp-strip">`
      + `<span class="console-chip console-chip--meta">max date · ${escapeHtml(summary.max_quote_date || '—')}</span>`
      + `<span class="console-chip console-chip--ok">BTN26 · ${escapeHtml(btnPx)} · ${escapeHtml(btnDate)}</span>`
      + `<span class="console-chip console-chip--meta">nodes · ${escapeHtml(summary.symbol_count)}</span>`
      + `<span class="console-chip console-chip--meta">as_of · ${escapeHtml(formatTime(summary.as_of))}</span>`
      + `</div>`
      + `<p class="ark-help">Permanent path: watchlist CSV → <code>scripts/refresh_barchart_curve_from_watchlist.py</code> → Ark <code>data/barchart/v1/barchart_curve_history.json</code>.</p>`
      + `</div>`
    );
  }

  function render() {
    const viewport = el('iaArkViewport');
    if (!viewport) return;

    const ark = getArk();
    if (!ark) {
      viewport.innerHTML = (
        `<p class="ark-empty">WTM_Ark not loaded. Ensure js/ark.js is included before this panel.</p>`
      );
      return;
    }

    const stamp = typeof ark.getStamp === 'function' ? ark.getStamp() : {};
    const sources = typeof ark.getSources === 'function' ? ark.getSources() : (stamp.sources || []);
    const curveSummary = curveSummaryFromArk(ark);

    viewport.innerHTML = (
      `${renderStampStrip(stamp)}`
      + renderCurveBlock(curveSummary)
      + renderSourcesTable(sources)
      + `<div class="ark-panel-block ark-panel-block--meta">`
      + `<p class="ark-help">The Ark is the single source of truth. Panels must not fetch raw data files.</p>`
      + `<p class="ark-help"><strong>Refresh All Data</strong> rebuilds the curve from the watchlist (when agent is up), then force-loads hydration · curve · BBDM · CoinGlass into The Ark.</p>`
      + `<p class="ark-help">Ark BUILD · <code>${escapeHtml(ark.BUILD || '—')}</code> · Panel · <code>${escapeHtml(BUILD)}</code></p>`
      + `</div>`
    );
  }

  /**
   * Force-load all Ark sources into cache (no disk rebuild).
   * @returns {Promise<{ hydration: boolean, curve: boolean, bbdm: boolean, coinglass: boolean }>}
   */
  async function refreshInventory() {
    const ark = getArk();
    const status = { hydration: false, curve: false, bbdm: false, coinglass: false };
    if (!ark) {
      render();
      return status;
    }
    if (typeof ark.invalidateCurveHistory === 'function') {
      ark.invalidateCurveHistory();
    }
    try {
      const tasks = [];
      if (typeof ark.loadHydration === 'function') {
        tasks.push(ark.loadHydration({ force: true }).then((r) => { status.hydration = !!(r && r.ok); }));
      }
      if (typeof ark.loadCurveHistory === 'function') {
        tasks.push(ark.loadCurveHistory({ force: true }).then((r) => { status.curve = !!(r && r.ok); }));
      }
      if (typeof ark.loadBbdmReport === 'function') {
        tasks.push(ark.loadBbdmReport({ force: true }).then((r) => { status.bbdm = !!(r && r.ok); }));
      }
      if (typeof ark.loadCoinglass === 'function') {
        tasks.push(ark.loadCoinglass({ force: true }).then((r) => { status.coinglass = !!(r && r.ok); }));
      }
      await Promise.all(tasks);
    } catch (err) {
      console.warn('[ArkIaPanel] inventory refresh', err);
    }
    render();
    return status;
  }

  /**
   * Chunk 24 — one clean ARK action: curve rebuild (agent) + full Ark source reload.
   */
  async function refreshAllData() {
    notify('Refresh All Data…');
    let curveRebuild = null;
    try {
      // Prefer CSV rebuild (fast, reliable). Live fetch is optional bonus when agent supports it.
      curveRebuild = await refreshCurveFromWatchlist({ fetchLive: false, force: true });
    } catch (err) {
      console.warn('[ArkIaPanel] curve rebuild during Refresh All', err);
    }

    const inv = await refreshInventory();

    // Push consumers that listen for desk refresh.
    try {
      if (typeof global.WTM_DeskOps?.refreshAllDeskData === 'function') {
        await global.WTM_DeskOps.refreshAllDeskData({ quiet: true });
      } else {
        global.dispatchEvent?.(new CustomEvent('whinfell-desk-refresh', {
          detail: { source: 'ark-refresh-all' },
        }));
      }
    } catch (err) {
      console.warn('[ArkIaPanel] desk fan-out after Refresh All', err);
    }

    render();
    const btnPx = curveRebuild?.BTN26_close != null
      ? `BTN26 $${Number(curveRebuild.BTN26_close).toLocaleString('en-US')}`
      : (getArk()?.getStamp?.()?.BTN26?.close != null
        ? `BTN26 $${Number(getArk().getStamp().BTN26.close).toLocaleString('en-US')}`
        : 'curve');
    const parts = [
      inv.hydration ? 'hydration' : null,
      inv.curve ? 'curve' : null,
      inv.bbdm ? 'bbdm' : null,
      inv.coinglass ? 'coinglass' : null,
    ].filter(Boolean);
    notify(
      parts.length
        ? `All data refreshed · ${btnPx} · ${parts.join(' · ')}`
        : `Refresh finished · ${btnPx} (some sources unavailable)`,
    );
    return { ok: true, curveRebuild, inventory: inv };
  }

  /**
   * After disk rebuild: drop Ark + BasisWatch curve caches and re-fetch newest JSON.
   */
  async function forceReloadCurveIntoUi() {
    const ark = getArk();
    if (ark && typeof ark.invalidateCurveHistory === 'function') {
      ark.invalidateCurveHistory();
    }
    if (ark && typeof ark.loadCurveHistory === 'function') {
      await ark.loadCurveHistory({ force: true });
    }
    if (typeof global.WTM_BasisWatch?.invalidateCurveCache === 'function') {
      global.WTM_BasisWatch.invalidateCurveCache();
    }
    if (typeof global.WTM_DeskOps?.refreshBasisWatch === 'function') {
      await global.WTM_DeskOps.refreshBasisWatch();
    } else if (typeof global.WTM_BasisWatch?.reloadCurve === 'function') {
      await global.WTM_BasisWatch.reloadCurve(
        global.WTM_BasisWatch.getState?.() || global.appState || {},
        {},
      );
    }
  }

  /**
   * Chunk 22/23 — rebuild curve JSON from latest Barchart watchlist, then force-load into Ark.
   * Discovers collect agent across 8767/8768 (skips stale agents without /v1/curve/*).
   * @param {{ fetchLive?: boolean, force?: boolean }} [opts]
   */
  async function refreshCurveFromWatchlist(opts) {
    const options = opts || {};
    const fetchLive = !!options.fetchLive;
    const forceMode = options.force !== false;

    try {
      const agent = await resolveAgentBase(true);
      if (!agent.supportsCurve) {
        throw new Error(
          'agent_offline_or_stale — run: bash scripts/ensure_collect_agent.sh'
          + ' (needs /v1/curve/refresh on :8767)',
        );
      }

      if (fetchLive) {
        // Async job: live Barchart fetch + auto curve rebuild.
        const start = await agentFetch('/v1/curve/fetch-and-refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        });
        const startData = await start.json().catch(() => ({}));
        if (!start.ok || !startData.job_id) {
          // Force mode: fall back to CSV rebuild if live fetch unavailable.
          if (forceMode) {
            notify('Live fetch unavailable — rebuilding from drop CSV…');
            return refreshCurveFromWatchlist({ fetchLive: false, force: true });
          }
          throw new Error(startData.error || 'fetch_job_failed');
        }
        notify(`Fetching Barchart watchlist (job ${startData.job_id})…`);
        const jobId = startData.job_id;
        const deadline = Date.now() + 180000;
        let job = null;
        while (Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, 1500));
          const jr = await agentFetch(`/v1/job/${jobId}`, { cache: 'no-store' });
          job = await jr.json().catch(() => ({}));
          if (job.status === 'done' || job.status === 'failed' || job.status === 'error') break;
        }
        if (!job || job.status !== 'done') {
          // Always attempt CSV rebuild so Force Refresh still updates the curve.
          if (forceMode) {
            notify('Live fetch timed out — rebuilding from drop CSV…');
            return refreshCurveFromWatchlist({ fetchLive: false, force: true });
          }
          throw new Error(job?.stderr_tail || job?.error || `job_${job?.status || 'timeout'}`);
        }

        await forceReloadCurveIntoUi();
        let status = {};
        try {
          const sr = await agentFetch('/v1/curve/status', { cache: 'no-store' });
          status = await sr.json();
        } catch (_) { /* ignore */ }
        render();
        const px = status?.BTN26?.close;
        notify(
          px != null
            ? `Live curve refreshed · BTN26 $${Number(px).toLocaleString('en-US')} · ${status.max_quote_date || ''}`
            : 'Live curve fetch complete — Ark reloaded',
        );
        return { ok: true, ...status, agent: agent.base };
      }

      // Sync rebuild from latest drop CSV.
      const res = await agentFetch('/v1/curve/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `http_${res.status}`);
      }
      await forceReloadCurveIntoUi();
      render();
      const btn = data.BTN26_close != null
        ? `BTN26 $${Number(data.BTN26_close).toLocaleString('en-US')}`
        : 'curve';
      notify(`Curve rebuilt · ${btn} · ${data.max_quote_date || '—'} · via ${agent.base}`);
      return { ...data, agent: agent.base };
    } catch (err) {
      const msg = err?.message || String(err);
      if (/Failed to fetch|NetworkError|abort|agent_offline/i.test(msg)) {
        notify('Collect agent offline/stale — run: bash scripts/ensure_collect_agent.sh');
      } else {
        notify(`Curve refresh failed: ${msg}`);
      }
      render();
      return { ok: false, error: msg };
    }
  }

  function wireControls() {
    if (wired) return;
    wired = true;

    el('btnArkFixWithLlm')?.addEventListener('click', () => {
      onFixWithLlm();
    });

    // Chunk 24 — single ARK action.
    el('btnArkRefreshAll')?.addEventListener('click', () => {
      const btn = el('btnArkRefreshAll');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Refreshing…';
      }
      refreshAllData().finally(() => {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Refresh All Data';
        }
      });
    });
  }

  function ensureSubscribe() {
    const ark = getArk();
    if (!ark || typeof ark.subscribe !== 'function') return;
    if (unsubscribe) return;
    unsubscribe = ark.subscribe(() => {
      if (active) render();
    });
  }

  async function activate() {
    active = true;
    const host = el('iaArkHost');
    if (host) host.classList.remove('zone-hidden');

    wireControls();
    ensureSubscribe();
    render();
    // Warm inventory once when opening the page (non-blocking).
    refreshInventory();
  }

  function deactivate() {
    active = false;
    const host = el('iaArkHost');
    if (host) host.classList.add('zone-hidden');
  }

  function isActive() {
    return active;
  }

  function init() {
    wireControls();
    ensureSubscribe();
  }

  global.WTM_ArkIaPanel = {
    BUILD: BUILD,
    activate: activate,
    deactivate: deactivate,
    isActive: isActive,
    render: render,
    refreshInventory: refreshInventory,
    refreshAllData: refreshAllData,
    refreshCurveFromWatchlist: refreshCurveFromWatchlist,
    resolveAgentBase: resolveAgentBase,
    buildFixWithLlmPrompt: buildFixWithLlmPrompt,
    init: init,
  };

  if (global.document) {
    if (global.document.readyState === 'loading') {
      global.document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
