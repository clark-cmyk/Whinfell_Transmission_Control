/**
 * WTM Desk Data Ops — one Collect CSVs button + one Refresh data button for all tools.
 */
(function deskDataOps(global) {
  'use strict';

  const BUILD = '1.1-DESK-OPS-2026-07-08';
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

  async function refreshHydration() {
    /** @type {{ ok: boolean, as_of?: string|null, snapshot_id?: string|null, freshness_status?: string|null }} */
    const stamp = { ok: false, as_of: null, snapshot_id: null, freshness_status: null };
    if (typeof global.WTM_BasisWatch?.reloadHydration === 'function') {
      try {
        stamp.ok = !!(await global.WTM_BasisWatch.reloadHydration(resolveDeskState()));
        if (stamp.ok) return stamp;
      } catch (err) {
        console.warn('[DeskOps] BasisWatch hydration reload skipped', err);
      }
    }
    if (typeof global.WTM_reloadDeployHydration === 'function') {
      try {
        const out = await global.WTM_reloadDeployHydration({ force: true, detail: true });
        if (out && typeof out === 'object') {
          stamp.ok = !!out.ok;
          stamp.as_of = out.as_of || null;
          stamp.snapshot_id = out.snapshot_id || null;
          stamp.freshness_status = out.freshness_status || null;
          return stamp;
        }
        stamp.ok = !!out;
        return stamp;
      } catch (err) {
        console.warn('[DeskOps] hydration refresh skipped', err);
      }
    }
    if (global.WMC?.Hydrate?.load) {
      try {
        stamp.ok = !!(await global.WMC.Hydrate.load());
        return stamp;
      } catch (err) {
        console.warn('[DeskOps] WMC hydrate skipped', err);
      }
    }
    return stamp;
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
      results.hydration = !!(hyd && hyd.ok);
      results.as_of = hyd?.as_of || null;
      results.snapshot_id = hyd?.snapshot_id || null;
      results.freshness_status = hyd?.freshness_status || null;
      results.curve = await refreshBasisWatch();
      results.wmc = await refreshWmc();
      results.surfaces = refreshToolSurfaces();

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