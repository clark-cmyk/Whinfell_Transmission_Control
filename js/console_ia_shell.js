/**
 * Phase 16 + Koyfin widget shell — presentation-only wiring.
 * Relocates existing nodes into shell hosts; safe fallback if hosts missing.
 */
(function consoleIaShell(global) {
  'use strict';

  const LAYER_CLASS = {
    scan: 'ia-layer-scan',
    dig: 'ia-layer-dig',
    iterate: 'ia-layer-iterate',
  };

  const DIG_VIEW_CLASS = {
    basis_watch: 'ia-dig-view-basis-watch',
    midwest_crush: 'ia-dig-view-midwest-crush',
  };

  const VIEW_SHORTCUT_REGISTRY = Object.freeze({
    risk_cockpit: 'widgetRiskCockpit',
    risk_curve: 'widgetRiskCurve',
    transmission_radar: 'widgetTransmissionRadar',
    hy_oas: 'widgetHyOas',
    flipchart: 'widgetFlipchart',
    depth_ladders: 'widgetDepth',
  });

  const COLLAPSE_STORAGE_KEY = 'wtm_ia_shell_collapse_v1';

  let activeLayer = 'scan';
  let activeDigView = 'basis_watch';
  let activated = false;
  let focusClearTimer = null;

  function el(id) { return document.getElementById(id); }

  function moveNode(nodeId, hostId) {
    const node = el(nodeId);
    const host = el(hostId);
    if (!node || !host || node.parentElement === host) return false;
    host.appendChild(node);
    return true;
  }

  function relocateNodes() {
    moveNode('scanKpiStrip', 'iaRiskCockpitHost');
    moveNode('nodeRail', 'iaRiskCurveHost');
    moveNode('transmissionRadar', 'iaRadarHost');
    moveNode('cockpitChartArea', 'iaHyOasHost');
    moveNode('cockpitDetailBand', 'iaHyOasHost');
    moveNode('cockpitActions', 'iaFlipchartHost');
    moveNode('cockpitDecisionRail', 'iaFlipchartHost');
    moveNode('consoleDepthDisclosure', 'iaDepthHost');
    moveNode('basisWatchPanel', 'iaDigHost');
    moveNode('iaMidwestCrushHost', 'iaDigHost');
  }

  function readCollapsePrefs() {
    try {
      const raw = global.sessionStorage?.getItem(COLLAPSE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_err) {
      return {};
    }
  }

  function writeCollapsePrefs(prefs) {
    try {
      global.sessionStorage?.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify(prefs));
    } catch (_err) { /* ignore quota */ }
  }

  function syncTopPipelineStrip() {
    const label = el('iaTopPipelineLabel');
    if (!label) return;
    const parts = [
      el('headerFreshnessLabel')?.textContent?.trim(),
      el('hydrationImportStatus')?.textContent?.trim(),
      el('saveIndicator')?.textContent?.trim(),
    ].filter((p) => p && p !== '—');
    label.textContent = parts.length ? parts.join(' · ') : 'Pipeline';
  }

  function setTopCollapsed(collapsed) {
    const frame = el('iaTopFrame');
    const btn = el('btnIaTopCollapse');
    if (!frame) return;
    const on = Boolean(collapsed);
    frame.dataset.collapsed = on ? 'true' : 'false';
    btn?.setAttribute('aria-expanded', on ? 'false' : 'true');
    const prefs = readCollapsePrefs();
    prefs.top = on;
    writeCollapsePrefs(prefs);
    syncTopPipelineStrip();
  }

  function setLeftCollapsed(collapsed) {
    const on = Boolean(collapsed);
    document.body.classList.toggle('ia-left-collapsed', on);
    const prefs = readCollapsePrefs();
    prefs.left = on;
    writeCollapsePrefs(prefs);
  }

  function focusWidget(shortcutKey) {
    const widgetId = VIEW_SHORTCUT_REGISTRY[shortcutKey];
    const widget = widgetId ? el(widgetId) : null;
    if (!widget) return false;

    document.querySelectorAll('.ia-view-shortcut, .ia-risk-curve-summary').forEach((btn) => {
      const on = btn.dataset.iaViewShortcut === shortcutKey;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-current', on ? 'true' : 'false');
    });

    document.querySelectorAll('#iaWidgetGrid .wf-panel').forEach((panel) => {
      panel.classList.toggle('is-active', panel.id === widgetId);
    });

    widget.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (focusClearTimer) global.clearTimeout(focusClearTimer);
    focusClearTimer = global.setTimeout(() => {
      document.querySelectorAll('#iaWidgetGrid .wf-panel.is-active').forEach((panel) => {
        if (panel.id !== widgetId) panel.classList.remove('is-active');
      });
    }, 2400);
    return true;
  }

  function syncRiskCurveSummary() {
    const summary = el('iaRiskCurveSummary');
    const rail = el('nodeRail');
    if (!summary || !rail) return;
    const active = rail.querySelector('.node-rail-tab--active, .node-rail-tab.active, [aria-selected="true"]');
    const label = active?.textContent?.trim() || '—';
    summary.textContent = `Curve · ${label}`;
  }

  function applyDigViewClasses() {
    const body = document.body;
    Object.values(DIG_VIEW_CLASS).forEach((cls) => body.classList.remove(cls));
    if (activeLayer === 'dig' && DIG_VIEW_CLASS[activeDigView]) {
      body.classList.add(DIG_VIEW_CLASS[activeDigView]);
    }
  }

  function syncDigViewUi() {
    document.querySelectorAll('[data-ia-dig-view]').forEach((btn) => {
      const on = activeDigView === btn.dataset.iaDigView && activeLayer === 'dig';
      btn.classList.toggle('ia-specialized-tool-btn--active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function setDigView(view) {
    const key = DIG_VIEW_CLASS[view] ? view : 'basis_watch';
    activeDigView = key;
    applyDigViewClasses();
    syncDigViewUi();

    if (key === 'midwest_crush') {
      global.WTM_WmcIaPanel?.activate?.();
    } else {
      global.WTM_WmcIaPanel?.deactivate?.();
    }
  }

  function selectMidwestCrush() {
    setLayer('dig');
    setDigView('midwest_crush');
  }

  function selectBasisWatch() {
    setLayer('dig');
    setDigView('basis_watch');
    try {
      if (global.WTM_DeskOps?.refreshBasisWatch) {
        const state = global.appState;
        global.WTM_DeskOps.refreshBasisWatch().then(() => {
          if (state && global.WTM_BasisWatch?.render) global.WTM_BasisWatch.render(state);
        });
      } else {
        const state = global.appState;
        if (state && global.WTM_BasisWatch?.refresh) {
          global.WTM_BasisWatch.refresh(state, { renderAll: global.renderAll });
        } else if (state && global.WTM_BasisWatch?.render) {
          global.WTM_BasisWatch.render(state);
        }
      }
    } catch (err) {
      console.warn('[WTM IaShell] BasisWatch refresh deferred', err);
    }
  }

  function setLayer(layer) {
    const key = LAYER_CLASS[layer] ? layer : 'scan';
    activeLayer = key;
    const body = document.body;
    Object.values(LAYER_CLASS).forEach((cls) => body.classList.remove(cls));
    body.classList.add(LAYER_CLASS[key]);

    document.querySelectorAll('.ia-layer-tab').forEach((tab) => {
      const on = tab.dataset.iaLayer === key;
      tab.classList.toggle('ia-layer-tab--active', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
    });

    const cockpit = el('nodeCockpitZone');
    if (cockpit) {
      cockpit.classList.toggle('ia-dig-source', key === 'dig');
      cockpit.classList.toggle('ia-dig-active', key === 'dig');
    }

    const commentary = el('iaCommentaryDisclosure');
    if (commentary && key === 'iterate') commentary.open = true;

    if (key !== 'dig') {
      applyDigViewClasses();
      syncDigViewUi();
      global.WTM_WmcIaPanel?.deactivate?.();
    } else {
      applyDigViewClasses();
      syncDigViewUi();
      if (activeDigView === 'midwest_crush') {
        global.WTM_WmcIaPanel?.activate?.();
      } else {
        global.WTM_WmcIaPanel?.deactivate?.();
      }
    }
  }

  function bindLayerTabs() {
    document.querySelectorAll('.ia-layer-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const layer = tab.dataset.iaLayer;
        if (!layer) return;
        if (layer === 'dig' && activeDigView === 'midwest_crush') {
          setLayer('dig');
          return;
        }
        if (layer === 'dig') setDigView('basis_watch');
        setLayer(layer);
      });
    });
  }

  function bindSpecializedTools() {
    document.querySelectorAll('[data-ia-dig-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.iaDigView;
        if (view === 'midwest_crush') selectMidwestCrush();
        else if (view === 'basis_watch') selectBasisWatch();
        else {
          setLayer('dig');
          setDigView(view);
        }
      });
    });
  }

  function bindViewShortcuts() {
    document.querySelectorAll('[data-ia-view-shortcut]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.iaViewShortcut;
        if (key) focusWidget(key);
      });
    });
  }

  function bindTopCollapse() {
    el('btnIaTopCollapse')?.addEventListener('click', () => {
      const frame = el('iaTopFrame');
      const collapsed = frame?.dataset.collapsed === 'true';
      setTopCollapsed(!collapsed);
    });
  }

  function bindLeftCollapse() {
    el('btnIaLeftCollapse')?.addEventListener('click', () => {
      setLeftCollapsed(!document.body.classList.contains('ia-left-collapsed'));
    });
  }

  function restoreCollapsePrefs() {
    const prefs = readCollapsePrefs();
    if (prefs.top) setTopCollapsed(true);
    if (prefs.left) setLeftCollapsed(true);
  }

  function observePipelineStrip() {
    const ids = ['headerFreshnessLabel', 'hydrationImportStatus', 'saveIndicator'];
    if (typeof MutationObserver === 'undefined') return;
    const obs = new MutationObserver(syncTopPipelineStrip);
    ids.forEach((id) => {
      const node = el(id);
      if (node) obs.observe(node, { childList: true, characterData: true, subtree: true });
    });
    syncTopPipelineStrip();
  }

  function observeRiskCurveSummary() {
    const rail = el('nodeRail');
    if (!rail || typeof MutationObserver === 'undefined') return;
    const obs = new MutationObserver(syncRiskCurveSummary);
    obs.observe(rail, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'aria-selected'] });
    syncRiskCurveSummary();
  }

  function activateShell() {
    if (activated) return true;
    const shell = el('wtmIaShell');
    if (!shell) return false;
    try {
      relocateNodes();
      document.body.classList.add('ia-shell-active');
      restoreCollapsePrefs();
      setLayer(activeLayer);
      observePipelineStrip();
      observeRiskCurveSummary();
      activated = true;
      return true;
    } catch (err) {
      console.warn('[WTM IaShell] activation failed — legacy layout', err);
      document.body.classList.remove('ia-shell-active');
      return false;
    }
  }

  function syncLayer(state) {
    if (!activated) return;
    const bw = state?._basisWatchModel;
    const bwFocused = state?.basisWatch?.expanded || state?.ui?.basisWatchFocus;
    if (bwFocused && bw?.front) {
      setLayer('dig');
      setDigView('basis_watch');
    }
  }

  function init() {
    bindLayerTabs();
    bindSpecializedTools();
    bindViewShortcuts();
    bindTopCollapse();
    bindLeftCollapse();
    activateShell();
  }

  global.WTM_IaShell = {
    activateShell,
    relocateNodes,
    setLayer,
    setDigView,
    selectMidwestCrush,
    selectBasisWatch,
    focusWidget,
    syncLayer,
    init,
    VIEW_SHORTCUT_REGISTRY,
    get activeLayer() { return activeLayer; },
    get activeDigView() { return activeDigView; },
    get activated() { return activated; },
  };
})(typeof window !== 'undefined' ? window : globalThis);