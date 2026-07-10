/**
 * WTM Desk Data Ops — one Collect CSVs button + one Refresh data button for all tools.
 */
(function deskDataOps(global) {
  'use strict';

  const BUILD = '1.6-DESK-OPS-REFRESH-ALL-ARK-2026-07-10';
  const REFRESH_BTN_ID = 'btnDeskRefresh';
  const COLLECT_BTN_ID = 'btnMorningCollect';
  /** Local collect agent ports — Chunk 23 probes for curve-capable agent. */
  const AGENT_PORTS = [8767, 8768, 8769];
  const AGENT_DEFAULT = 'http://127.0.0.1:8767';

  let refreshBusy = false;
  /** @type {string|null} */
  let resolvedAgentBase = null;

  /** Standalone tools (BasisWatch) keep state off appState — resolve via WTM_BasisWatch.getState(). */
  function resolveDeskState() {
    if (typeof global.WTM_BasisWatch?.getState === 'function') {
      const state = global.WTM_BasisWatch.getState();
      if (state && typeof state === 'object') return state;
    }
    return global.appState || {};
  }

  function getArk() {
    return global.WTM_Ark || null;
  }

  function notify(msg) {
    if (typeof global.showToast === 'function') global.showToast(msg);
    else if (global.WMC?.Utils?.showToast) global.WMC.Utils.showToast(msg);
    else console.log('[DeskOps]', msg);
  }

  /**
   * Chunk 23 — prefer an agent that exposes /v1/curve/* (skip stale Desktop v0.1.0 on :8767).
   */
  async function resolveAgentBase(force) {
    if (!force && resolvedAgentBase) return resolvedAgentBase;
    for (let i = 0; i < AGENT_PORTS.length; i += 1) {
      const base = `http://127.0.0.1:${AGENT_PORTS[i]}`;
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 1800);
        const healthRes = await fetch(`${base}/health`, { cache: 'no-store', signal: ctrl.signal });
        clearTimeout(t);
        if (!healthRes.ok) continue;
        const health = await healthRes.json().catch(() => ({}));
        if (!health?.ok) continue;
        const cs = await fetch(`${base}/v1/curve/status`, { cache: 'no-store' });
        const body = await cs.json().catch(() => ({}));
        if (cs.ok && body && body.error !== 'not_found' && (body.ok === true || body.path || body.BTN26)) {
          resolvedAgentBase = base;
          return base;
        }
      } catch (_) { /* next */ }
    }
    resolvedAgentBase = AGENT_DEFAULT;
    return resolvedAgentBase;
  }

  function setButtonBusy(btn, on, busyLabel) {
    if (!btn) return;
    if (!btn.dataset.deskOpsLabel) btn.dataset.deskOpsLabel = btn.textContent || '';
    btn.disabled = !!on;
    btn.classList.toggle('desk-ops--busy', !!on);
    btn.setAttribute('aria-busy', on ? 'true' : 'false');
    if (on && busyLabel) btn.textContent = busyLabel;
    else if (!on) btn.textContent = btn.dataset.deskOpsLabel;
  }

  /**
   * Chunk 22 — rebuild barchart_curve_history.json from latest watchlist via collect agent.
   * Safe no-op if agent offline (caller still reloads existing JSON via Ark).
   */
  async function rebuildCurveFromWatchlist() {
    try {
      const base = await resolveAgentBase(true);
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 12000);
      const res = await fetch(`${base}/v1/curve/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
        signal: ctrl.signal,
      });
      clearTimeout(t);
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        return {
          ok: true,
          BTN26_close: data.BTN26_close,
          max_quote_date: data.max_quote_date,
          as_of: data.as_of,
          source_csv: data.source_csv,
          agent: base,
        };
      }
      // Retry other ports if this one is stale.
      if (res.status === 404) {
        resolvedAgentBase = null;
        const again = await resolveAgentBase(true);
        if (again !== base) {
          const res2 = await fetch(`${again}/v1/curve/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}',
          });
          const data2 = await res2.json().catch(() => ({}));
          if (res2.ok && data2.ok) {
            return {
              ok: true,
              BTN26_close: data2.BTN26_close,
              max_quote_date: data2.max_quote_date,
              as_of: data2.as_of,
              source_csv: data2.source_csv,
              agent: again,
            };
          }
        }
      }
      return { ok: false, error: data.error || `http_${res.status}` };
    } catch (err) {
      return { ok: false, error: err?.message || 'agent_offline', offline: true };
    }
  }

  async function refreshBasisWatch() {
    if (!global.WTM_BasisWatch) return false;
    const state = resolveDeskState();
    const hooks = {
      renderAll: typeof global.renderAll === 'function' ? global.renderAll : undefined,
    };
    try {
      // Chunk 23: drop Ark + panel caches, then force re-fetch newest JSON.
      if (typeof global.WTM_Ark?.invalidateCurveHistory === 'function') {
        global.WTM_Ark.invalidateCurveHistory();
      }
      if (typeof global.WTM_Ark?.loadCurveHistory === 'function') {
        await global.WTM_Ark.loadCurveHistory({ force: true });
      }
      if (typeof global.WTM_BasisWatch.invalidateCurveCache === 'function') {
        global.WTM_BasisWatch.invalidateCurveCache();
      }
      if (typeof global.WTM_BasisWatch.reloadCurve === 'function') {
        await global.WTM_BasisWatch.reloadCurve(state, hooks);
        return true;
      }
      if (typeof global.WTM_BasisWatch.refresh === 'function') {
        await global.WTM_BasisWatch.refresh(state, hooks);
        return true;
      }
    } catch (err) {
      console.warn('[DeskOps] BasisWatch refresh skipped', err);
    }
    return false;
  }

  function normalizeStamp(out) {
    if (out && typeof out === 'object' && ('ok' in out || 'as_of' in out || 'snapshot_id' in out)) {
      return {
        ok: !!out.ok,
        as_of: out.as_of || null,
        snapshot_id: out.snapshot_id || null,
        freshness_status: out.freshness_status || null,
      };
    }
    return { ok: !!out, as_of: null, snapshot_id: null, freshness_status: null };
  }

  /**
   * Stamp authority: The Ark getStamp() when available (SSOT after load).
   * Falls back to a prior normalizeStamp result.
   */
  function stampFromArk(fallback) {
    const base = fallback || { ok: false, as_of: null, snapshot_id: null, freshness_status: null };
    const ark = getArk();
    if (!ark || typeof ark.getStamp !== 'function') return base;

    const s = ark.getStamp() || {};
    const hasHydration = typeof ark.getHydration === 'function' && !!ark.getHydration();
    const hasStamp = !!(s.as_of || s.snapshot_id || s.freshness_status || s.lastRefreshedAt);
    return {
      ok: !!(base.ok || hasHydration || hasStamp),
      as_of: s.as_of || base.as_of || null,
      snapshot_id: s.snapshot_id || base.snapshot_id || null,
      freshness_status: s.freshness_status || base.freshness_status || null,
    };
  }

  /**
   * Ensure Ark hydration cache is warm (single raw load path).
   * Does not apply UI state — callers use deploy hydrate / BW / WMC apply layers.
   */
  async function warmArkHydration(force) {
    const ark = getArk();
    if (!ark || typeof ark.loadHydration !== 'function') return null;
    try {
      return await ark.loadHydration({ force: force !== false });
    } catch (err) {
      console.warn('[DeskOps] Ark loadHydration skipped', err);
      return null;
    }
  }

  async function refreshHydration() {
    /** @type {{ ok: boolean, as_of?: string|null, snapshot_id?: string|null, freshness_status?: string|null }} */
    let stamp = { ok: false, as_of: null, snapshot_id: null, freshness_status: null };

    // Main desk: deploy hydrate (core → Ark single fetch) so cockpits + toast stamps match latest.json.
    if (typeof global.WTM_reloadDeployHydration === 'function') {
      try {
        const out = await global.WTM_reloadDeployHydration({ force: true, detail: true });
        stamp = stampFromArk(normalizeStamp(out));
        if (stamp.ok) {
          // Keep embedded/standalone BW state warm without replacing Ark stamp authority.
          if (typeof global.WTM_BasisWatch?.reloadHydration === 'function') {
            try {
              await global.WTM_BasisWatch.reloadHydration(resolveDeskState());
            } catch (err) {
              console.warn('[DeskOps] BasisWatch hydration sync skipped', err);
            }
          }
          return stampFromArk(stamp);
        }
      } catch (err) {
        console.warn('[DeskOps] hydration refresh skipped', err);
      }
    }

    // Standalone / no core: warm Ark first (SSOT load), then panel apply layers.
    const arkLoaded = await warmArkHydration(true);
    if (arkLoaded && arkLoaded.ok) {
      stamp = stampFromArk(normalizeStamp(arkLoaded));
    }

    if (typeof global.WTM_BasisWatch?.reloadHydration === 'function') {
      try {
        const bwOut = await global.WTM_BasisWatch.reloadHydration(resolveDeskState());
        const bwStamp = normalizeStamp(bwOut);
        // Ark stamp wins when present; BW only fills gaps before Ark rewires (Chunk 12).
        stamp = stampFromArk({
          ok: stamp.ok || bwStamp.ok,
          as_of: stamp.as_of || bwStamp.as_of,
          snapshot_id: stamp.snapshot_id || bwStamp.snapshot_id,
          freshness_status: stamp.freshness_status || bwStamp.freshness_status,
        });
        if (stamp.ok) return stamp;
      } catch (err) {
        console.warn('[DeskOps] BasisWatch hydration reload skipped', err);
      }
    }

    if (global.WMC?.Hydrate?.load) {
      try {
        const wmcOk = !!(await global.WMC.Hydrate.load());
        stamp = stampFromArk({
          ok: stamp.ok || wmcOk,
          as_of: stamp.as_of,
          snapshot_id: stamp.snapshot_id,
          freshness_status: stamp.freshness_status,
        });
        return stamp;
      } catch (err) {
        console.warn('[DeskOps] WMC hydrate skipped', err);
      }
    }
    return stampFromArk(stamp);
  }

  async function refreshWmc() {
    if (typeof global.WMC?.refreshAfterCollect === 'function') {
      try {
        const out = await global.WMC.refreshAfterCollect();
        return !!(out?.hydrated || out?.refreshed);
      } catch (err) {
        console.warn('[DeskOps] WMC refresh skipped', err);
      }
    }
    return false;
  }

  function refreshToolSurfaces() {
    let signaled = false;
    try {
      global.dispatchEvent(new CustomEvent('whinfell-desk-refresh', { detail: { source: 'desk-ops' } }));
      signaled = true;
    } catch { /* ignore */ }
    if (typeof global.WTM_TransmissionRadar?.render === 'function') {
      try { global.WTM_TransmissionRadar.render(global.appState || {}); } catch { /* ignore */ }
    }
    if (typeof global.WTM_ScanKpiStrip?.render === 'function') {
      try { global.WTM_ScanKpiStrip.render(global.appState || {}); } catch { /* ignore */ }
    }
    if (typeof global.renderAll === 'function') {
      try { global.renderAll(); } catch { /* ignore */ }
    }
    return signaled;
  }

  /**
   * Force-load every Ark source (hydration · curve · BBDM · coinglass · corporate_gm).
   * @returns {Promise<Record<string, boolean>|null>}
   */
  async function refreshAllArkSources() {
    const ark = getArk();
    if (!ark) return null;
    try {
      if (typeof ark.loadAll === 'function') {
        return await ark.loadAll({ force: true });
      }
      if (typeof ark.invalidateAll === 'function') ark.invalidateAll();
      const status = {
        hydration: false,
        curve: false,
        bbdm: false,
        coinglass: false,
        corporate_gm: false,
      };
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
      if (typeof ark.loadCorporateGm === 'function') {
        tasks.push(ark.loadCorporateGm({ force: true }).then((r) => { status.corporate_gm = !!(r && r.ok); }));
      }
      await Promise.all(tasks);
      return status;
    } catch (err) {
      console.warn('[DeskOps] refreshAllArkSources', err);
      return null;
    }
  }

  async function refreshAllDeskData(options = {}) {
    if (refreshBusy) {
      notify('Refresh already running');
      return { ok: false, mode: 'busy' };
    }
    refreshBusy = true;
    const silent = !!(options.silent || options.quiet);
    const results = {
      hydration: false,
      curve: false,
      curveRebuild: null,
      arkSources: null,
      wmc: false,
      surfaces: false,
      as_of: null,
      snapshot_id: null,
      freshness_status: null,
    };
    try {
      // Full Ark inventory first (unless ARK page already force-loaded everything).
      if (!options.skipArkLoad) {
        results.arkSources = await refreshAllArkSources();
      }

      const hyd = options.skipArkLoad
        ? (getArk()?.getHydration?.()
          ? { ok: true, ...stampFromArk({ ok: true }) }
          : await refreshHydration())
        : await refreshHydration();
      // Prefer live Ark stamp for toasts (SSOT) after hydration coordination.
      const arkStamp = stampFromArk(hyd);
      results.hydration = !!(hyd && hyd.ok) || !!(results.arkSources && results.arkSources.hydration);
      results.as_of = arkStamp.as_of || hyd?.as_of || null;
      results.snapshot_id = arkStamp.snapshot_id || hyd?.snapshot_id || null;
      results.freshness_status = arkStamp.freshness_status || hyd?.freshness_status || null;

      // Chunk 22: rebuild curve JSON from latest watchlist before Ark reloads it.
      if (!options.skipCurveRebuild) {
        results.curveRebuild = await rebuildCurveFromWatchlist();
        // After disk rebuild, force Ark curve re-read.
        if (typeof getArk()?.invalidateCurveHistory === 'function') {
          getArk().invalidateCurveHistory();
        }
        if (typeof getArk()?.loadCurveHistory === 'function') {
          const cr = await getArk().loadCurveHistory({ force: true });
          if (cr?.ok && results.arkSources) results.arkSources.curve = true;
        }
      }
      results.curve = await refreshBasisWatch();
      results.wmc = await refreshWmc();
      results.surfaces = refreshToolSurfaces();

      // Re-read Ark stamp after curve/WMC (they may warm Ark in later chunks).
      const finalStamp = stampFromArk({
        ok: results.hydration,
        as_of: results.as_of,
        snapshot_id: results.snapshot_id,
        freshness_status: results.freshness_status,
      });
      results.as_of = finalStamp.as_of;
      results.snapshot_id = finalStamp.snapshot_id;
      results.freshness_status = finalStamp.freshness_status;

      const arkAny = results.arkSources
        && Object.values(results.arkSources).some(Boolean);
      const any = results.hydration || results.curve || results.wmc || results.surfaces || arkAny;
      const asOfLabel = results.as_of
        ? (typeof global.WTM_formatLocalStamp === 'function'
          ? global.WTM_formatLocalStamp(results.as_of)
          : results.as_of)
        : '';
      const stampBit = results.snapshot_id
        ? ` · ${results.snapshot_id}${asOfLabel ? ` @ ${asOfLabel}` : ''}`
        : '';
      const btnBit = results.curveRebuild?.ok && results.curveRebuild.BTN26_close != null
        ? ` · BTN26 $${Number(results.curveRebuild.BTN26_close).toLocaleString('en-US')}`
        : '';
      const arkBit = arkAny
        ? ` · ark:${Object.entries(results.arkSources).filter(([, v]) => v).map(([k]) => k).join('+')}`
        : '';
      if (!silent) {
        if (results.hydration && results.curve) {
          notify(`Desk data refreshed — all sources${btnBit}${arkBit}${stampBit}`);
        } else if (any) {
          notify(`Desk data refreshed — partial${btnBit}${arkBit}${stampBit} (some panels may need publish/collect)`);
        } else {
          notify('Refresh complete — no live data paths (check hydration / curve JSON)');
        }
        if (results.curveRebuild && !results.curveRebuild.ok) {
          if (results.curveRebuild.offline) {
            notify('Curve rebuild skipped — run: bash scripts/ensure_collect_agent.sh');
          } else {
            notify(`Curve rebuild note: ${results.curveRebuild.error || 'failed'}`);
          }
        }
      }
      return { ok: any, results };
    } catch (err) {
      notify(`Refresh error: ${err?.message || err}`);
      return { ok: false, error: err };
    } finally {
      refreshBusy = false;
    }
  }

  async function triggerDeskRefresh() {
    const btn = global.document?.getElementById(REFRESH_BTN_ID);
    setButtonBusy(btn, true, 'Refreshing…');
    try {
      return await refreshAllDeskData();
    } finally {
      setButtonBusy(btn, false);
    }
  }

  function wireRefreshButton(id) {
    const btn = global.document?.getElementById(id || REFRESH_BTN_ID);
    if (!btn || btn._deskOpsBound) return;
    btn._deskOpsBound = true;
    btn.addEventListener('click', async () => {
      await triggerDeskRefresh();
    });
  }

  function mountDeskOpsBar(mountEl, options = {}) {
    const root = typeof mountEl === 'string'
      ? global.document?.querySelector(mountEl)
      : mountEl;
    if (!root || root.querySelector(`#${COLLECT_BTN_ID}`)) return root;

    const showAgent = options.showAgent !== false;
    const backHref = options.backHref || './index.html';
    const backLabel = options.backLabel || '← Transmission Control';

    const bar = global.document.createElement('div');
    bar.className = 'desk-ops-bar';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Desk data operations');
    bar.innerHTML = `
      ${options.backHref !== false ? `<a href="${backHref}" class="desk-ops-back">${backLabel}</a>` : ''}
      <div class="desk-ops-actions">
        ${showAgent ? `<button type="button" id="btnCollectAgentStatus" class="desk-ops-btn desk-ops-btn--meta wtm-collect-agent-status wtm-collect-agent--offline" title="Collect agent status (127.0.0.1:8767)">Agent ○</button>` : ''}
        <button type="button" id="${COLLECT_BTN_ID}" class="desk-ops-btn desk-ops-btn--primary wtm-collect-btn" title="Barchart + Koyfin CSV fetch → drop → hydrate chain">Collect CSVs</button>
        <button type="button" id="${REFRESH_BTN_ID}" class="desk-ops-btn desk-ops-btn--accent" title="Reload hydration, BasisWatch curve, and all desk panels">Refresh data</button>
      </div>
    `;
    root.prepend(bar);
    wireRefreshButton(REFRESH_BTN_ID);
    if (typeof global.WTM_AutoCollect?.wireAll === 'function') {
      global.WTM_AutoCollect.wireAll();
    }
    return root;
  }

  function wireAll() {
    wireRefreshButton(REFRESH_BTN_ID);
  }

  const api = {
    BUILD,
    REFRESH_BTN_ID,
    COLLECT_BTN_ID,
    AGENT_DEFAULT,
    AGENT_PORTS,
    resolveAgentBase,
    resolveDeskState,
    stampFromArk,
    warmArkHydration,
    rebuildCurveFromWatchlist,
    refreshAllArkSources,
    refreshAllDeskData,
    triggerDeskRefresh,
    refreshBasisWatch,
    refreshHydration,
    refreshWmc,
    mountDeskOpsBar,
    wireAll,
  };

  global.WTM_DeskOps = api;
  global.__testExports = global.__testExports || {};
  global.__testExports.deskOps = api;

  if (global.document?.readyState === 'loading') {
    global.document.addEventListener('DOMContentLoaded', wireAll);
  } else {
    wireAll();
  }
})(typeof window !== 'undefined' ? window : globalThis);