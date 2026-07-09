/**
 * WTM Desk Data Ops — one Collect CSVs button + one Refresh data button for all tools.
 */
(function deskDataOps(global) {
  'use strict';

  const BUILD = '1.3-DESK-OPS-ARK-STAMP-2026-07-09';
  const REFRESH_BTN_ID = 'btnDeskRefresh';
  const COLLECT_BTN_ID = 'btnMorningCollect';

  let refreshBusy = false;

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

  function setButtonBusy(btn, on, busyLabel) {
    if (!btn) return;
    if (!btn.dataset.deskOpsLabel) btn.dataset.deskOpsLabel = btn.textContent || '';
    btn.disabled = !!on;
    btn.classList.toggle('desk-ops--busy', !!on);
    btn.setAttribute('aria-busy', on ? 'true' : 'false');
    if (on && busyLabel) btn.textContent = busyLabel;
    else if (!on) btn.textContent = btn.dataset.deskOpsLabel;
  }

  async function refreshBasisWatch() {
    if (!global.WTM_BasisWatch) return false;
    const state = resolveDeskState();
    const hooks = {
      renderAll: typeof global.renderAll === 'function' ? global.renderAll : undefined,
    };
    try {
      if (typeof global.WTM_BasisWatch.reloadCurve === 'function') {
        await global.WTM_BasisWatch.reloadCurve(state, hooks);
        return true;
      }
      if (typeof global.WTM_BasisWatch.invalidateCurveCache === 'function') {
        global.WTM_BasisWatch.invalidateCurveCache();
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

  async function refreshAllDeskData(options = {}) {
    if (refreshBusy) {
      notify('Refresh already running');
      return { ok: false, mode: 'busy' };
    }
    refreshBusy = true;
    const results = {
      hydration: false,
      curve: false,
      wmc: false,
      surfaces: false,
      as_of: null,
      snapshot_id: null,
      freshness_status: null,
    };
    try {
      const hyd = await refreshHydration();
      // Prefer live Ark stamp for toasts (SSOT) after hydration coordination.
      const arkStamp = stampFromArk(hyd);
      results.hydration = !!(hyd && hyd.ok);
      results.as_of = arkStamp.as_of || hyd?.as_of || null;
      results.snapshot_id = arkStamp.snapshot_id || hyd?.snapshot_id || null;
      results.freshness_status = arkStamp.freshness_status || hyd?.freshness_status || null;
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

      const any = results.hydration || results.curve || results.wmc || results.surfaces;
      const stampBit = results.snapshot_id
        ? ` · ${results.snapshot_id}${results.as_of ? ` @ ${results.as_of}` : ''}`
        : '';
      if (!options.silent) {
        if (results.hydration && results.curve) {
          notify(`Desk data refreshed — hydration + BasisWatch curve${stampBit}`);
        } else if (any) {
          notify(`Desk data refreshed — partial${stampBit} (some panels may need publish/collect)`);
        } else {
          notify('Refresh complete — no live data paths (check hydration / curve JSON)');
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
    resolveDeskState,
    stampFromArk,
    warmArkHydration,
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