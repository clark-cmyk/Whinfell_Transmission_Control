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

  /**
   * Chunk 1 — ensure TopShell: console-topbar lives inside ia-top-frame body.
   * No-op when markup is already correct; heals orphaned/legacy topbars.
   */
  function relocateTopBar() {
    const host = el('iaTopBody');
    if (!host || typeof document === 'undefined' || !document.querySelector) return false;
    const topbar = document.querySelector('header.console-topbar');
    if (!topbar || topbar.parentElement === host) return false;
    host.appendChild(topbar);
    return true;
  }

  function syncDepthLaddersStatus() {
    const hydrationEl = el('depthStatusHydration');
    const freshnessEl = el('depthStatusFreshness');
    const vizEl = el('depthStatusViz');
    const warnEl = el('depthStatusWarn');
    if (!hydrationEl) {
      syncDepthPanelMeta();
      return;
    }

    const importRaw = stripNodeText(el('hydrationImportStatus')).toLowerCase();
    if (/no bundle|not imported|degraded|critical/.test(importRaw)) {
      hydrationEl.textContent = 'Parquet hydration pending';
    } else if (/stale/.test(importRaw)) {
      hydrationEl.textContent = 'Parquet hydration stale';
    } else if (importRaw && importRaw !== '—') {
      hydrationEl.textContent = 'Parquet hydration applied';
    } else {
      hydrationEl.textContent = '—';
    }

    if (freshnessEl) {
      const freshLabel = stripNodeText(el('headerFreshnessLabel'));
      const fl = freshLabel.replace(/^freshness\s*[—-]/i, '').trim();
      freshnessEl.textContent = fl && fl !== '—' ? fl : '—';
    }

    const vizDiag = global.__vizDiagnostics;
    const vizBadge = el('vizDiagnosticsBadge');
    if (vizEl) {
      if (vizDiag?.total != null) {
        vizEl.textContent = `Viz ${vizDiag.passed}/${vizDiag.total}`;
      } else if (vizBadge?.textContent) {
        const m = vizBadge.textContent.match(/Viz\s+(\d+\/\d+)/i);
        vizEl.textContent = m ? `Viz ${m[1]}` : 'Viz —';
      } else {
        vizEl.textContent = 'Viz —';
      }
    }

    if (warnEl) {
      const warn = vizDiag ? !vizDiag.ok : Boolean(vizBadge?.classList.contains('viz-diagnostics--warn'));
      warnEl.classList.toggle('depth-status-badge--hidden', !warn);
      warnEl.setAttribute('aria-hidden', warn ? 'false' : 'true');
    }

    syncDepthPanelMeta();
  }

  /** Chunk 7 — Depth header glance: compact hydration · freshness · viz · WARN (presentation only). */
  function syncDepthPanelMeta() {
    const meta = el('depthPanelMeta');
    if (!meta) return '';

    const hydRaw = stripNodeText(el('depthStatusHydration'));
    const freshRaw = stripNodeText(el('depthStatusFreshness'));
    const vizRaw = stripNodeText(el('depthStatusViz'));
    const warnEl = el('depthStatusWarn');
    const warnVisible = Boolean(
      warnEl
      && !warnEl.classList?.contains?.('depth-status-badge--hidden')
      && warnEl.getAttribute?.('aria-hidden') !== 'true',
    );

    let hydShort = '';
    if (/pending/i.test(hydRaw)) hydShort = 'Pending';
    else if (/stale/i.test(hydRaw)) hydShort = 'Stale';
    else if (/applied/i.test(hydRaw)) hydShort = 'Applied';
    else if (hydRaw && hydRaw !== '—') hydShort = truncateMeta(hydRaw, 16);

    const parts = [];
    if (hydShort) parts.push(hydShort);
    if (freshRaw && freshRaw !== '—') parts.push(truncateMeta(freshRaw, 18));
    if (vizRaw && vizRaw !== 'Viz —' && vizRaw !== '—') parts.push(vizRaw);
    if (warnVisible) parts.push('WARN');

    const line = parts.length ? parts.join(' · ') : '—';
    meta.textContent = line;
    if (typeof meta.setAttribute === 'function') {
      meta.setAttribute('title', line === '—' ? 'Depth · ladders status pending' : line);
    }
    return line;
  }

  function assembleDepthLaddersWidget() {
    const content = el('depthLaddersContent');
    if (!content) {
      moveNode('consoleDepthDisclosure', 'iaDepthHost');
      return;
    }
    moveNode('consoleDepthDisclosure', 'depthLaddersContent');
    syncDepthLaddersStatus();
  }

  function assembleHyOasWidget() {
    const numericsBody = el('hyOasNumericsBody');
    const thesisBody = el('hyOasThesisBody');
    if (!numericsBody || !thesisBody) {
      moveNode('cockpitChartArea', 'iaHyOasHost');
      moveNode('basisSummaryStrip', 'iaHyOasHost');
      moveNode('cockpitDetailBand', 'iaHyOasHost');
      moveNode('hyOasHandoffActions', 'iaHyOasHost');
      return;
    }
    moveNode('cockpitChartArea', 'hyOasNumericsBody');
    moveNode('basisSummaryStrip', 'hyOasThesisBody');
    moveNode('cockpitDetailBand', 'hyOasThesisBody');
    moveNode('hyOasHandoffActions', 'hyOasThesisBody');
  }

  function relocateNodes() {
    relocateTopBar();
    moveNode('scanKpiStrip', 'iaRiskCockpitHost');
    moveNode('nodeRail', 'iaRiskCurveHost');
    moveNode('transmissionRadar', 'iaRadarHost');
    assembleHyOasWidget();
    moveNode('cockpitActions', 'iaFlipchartHost');
    moveNode('cockpitDecisionRail', 'iaFlipchartHost');
    assembleDepthLaddersWidget();
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

  function stripNodeText(node) {
    return node?.textContent?.trim().replace(/\s+/g, ' ') || '';
  }

  function parsePipelineFreshness() {
    const importRaw = stripNodeText(el('hydrationImportStatus')).toLowerCase();
    if (/no bundle|critical|degraded|error|blocked|quarantine/.test(importRaw)) return 'error';
    const dot = el('headerFreshnessDot');
    if (dot?.classList.contains('freshness-dot-fresh')) return 'fresh';
    if (dot?.classList.contains('freshness-dot-aging')) return 'aging';
    if (dot?.classList.contains('freshness-dot-stale')) return 'stale';
    const freshText = stripNodeText(el('headerFreshnessLabel')).toLowerCase();
    if (freshText.includes('fresh')) return 'fresh';
    if (freshText.includes('aging')) return 'aging';
    if (freshText.includes('stale')) return 'stale';
    if (freshText.includes('error') || freshText.includes('blocked')) return 'error';
    return 'idle';
  }

  function syncTopPipelineStrip() {
    const label = el('iaTopPipelineLabel');
    const strip = el('iaTopPipelineStrip');
    const frame = el('iaTopFrame');
    const stripDot = el('iaTopFreshnessDot');
    const unsavedBadge = el('iaTopUnsavedBadge');
    if (!label) return;

    const freshnessLabel = stripNodeText(el('headerFreshnessLabel'));
    const importRaw = stripNodeText(el('hydrationImportStatus'));
    const saveStatus = stripNodeText(el('saveIndicator'));
    const parts = [];

    if (freshnessLabel && !/^freshness\s*[—-]/i.test(freshnessLabel) && freshnessLabel !== '—') {
      parts.push(freshnessLabel);
    }
    if (importRaw) {
      if (/no bundle|stale bundle|critical|degraded/i.test(importRaw)) {
        parts.push(importRaw);
      } else {
        const importPart = importRaw.replace(/\s*·\s*(Fresh|Aging|Stale)$/i, '').trim();
        if (importPart) parts.push(importPart);
      }
    }
    if (saveStatus && saveStatus !== '—') parts.push(saveStatus);

    label.textContent = parts.length ? `Pipeline: ${parts.join(' · ')}` : 'Pipeline';

    const freshness = parsePipelineFreshness();
    if (strip) strip.dataset.freshness = freshness;
    if (frame) frame.dataset.pipelineFreshness = freshness;

    if (stripDot) {
      stripDot.className = `ia-top-strip-dot ia-top-strip-dot--${freshness}`;
      stripDot.title = freshnessLabel || 'Freshness';
    }

    if (unsavedBadge) {
      const isUnsaved = /unsaved/i.test(saveStatus);
      const isSaved = /saved/i.test(saveStatus) && !isUnsaved;
      unsavedBadge.classList.toggle('ia-top-strip-badge--hidden', !isUnsaved && !isSaved);
      unsavedBadge.classList.toggle('ia-top-strip-badge--unsaved', isUnsaved);
      unsavedBadge.classList.toggle('ia-top-strip-badge--saved', isSaved);
      unsavedBadge.textContent = isUnsaved ? 'Unsaved' : (isSaved ? 'Saved' : '');
      unsavedBadge.title = saveStatus || 'Save state';
    }
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
    const btn = el('btnIaLeftCollapse');
    btn?.setAttribute('aria-expanded', on ? 'false' : 'true');
    btn?.setAttribute('aria-label', on ? 'Expand left rail' : 'Collapse left rail');
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

  /** Chunk 5 — HY OAS header glance: mission lead · basis reading (presentation only). */
  function truncateMeta(text, max) {
    const s = String(text || '').trim();
    if (!s || s === '—') return '';
    if (s.length <= max) return s;
    return `${s.slice(0, Math.max(1, max - 1))}…`;
  }

  function syncHyOasPanelMeta() {
    const meta = el('hyOasPanelMeta');
    if (!meta) return '';
    const lead = truncateMeta(stripNodeText(el('basisTacticalLead')), 42);
    const subtitle = truncateMeta(stripNodeText(el('cockpitChartSubtitle')), 36);
    const reading = truncateMeta(stripNodeText(el('basisReadingValue')), 18);
    const head = lead || subtitle;
    const parts = [];
    if (head) parts.push(head);
    if (reading) parts.push(reading);
    const line = parts.length ? parts.join(' · ') : '—';
    meta.textContent = line;
    if (typeof meta.setAttribute === 'function') {
      meta.setAttribute('title', line === '—' ? 'HY OAS pending mission read' : line);
    }
    return line;
  }

  /** Chunk 6 — Flipchart header glance: position · asset · regime (presentation only). */
  function syncFlipchartPanelMeta() {
    const meta = el('flipchartPanelMeta');
    if (!meta) return '';
    const posRaw = stripNodeText(el('flipchartPosition'));
    const slideRaw = stripNodeText(el('flipchartSlideIndex'));
    const title = truncateMeta(stripNodeText(el('flipchartTitle')), 18);
    const regime = truncateMeta(stripNodeText(el('flipchartRegimeTag')), 14);
    let pos = '';
    if (posRaw && posRaw !== '—') {
      pos = posRaw.replace(/\s*\/\s*/, '/');
    } else if (slideRaw && slideRaw !== '—') {
      const m = slideRaw.match(/(\d+)\s*(?:of|\/)\s*(\d+)/i);
      pos = m ? `${m[1]}/${m[2]}` : slideRaw.replace(/^Slide\s+/i, '');
    }
    const parts = [];
    if (pos) parts.push(pos);
    if (title) parts.push(title);
    if (regime) parts.push(regime);
    const line = parts.length ? parts.join(' · ') : '—';
    meta.textContent = line;
    if (typeof meta.setAttribute === 'function') {
      meta.setAttribute('title', line === '—' ? 'Flipchart pending node' : line);
    }
    return line;
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
    const ids = ['headerFreshnessLabel', 'headerFreshnessDot', 'hydrationImportStatus', 'saveIndicator'];
    if (typeof MutationObserver === 'undefined') return;
    const obs = new MutationObserver(syncTopPipelineStrip);
    ids.forEach((id) => {
      const node = el(id);
      if (!node) return;
      const opts = id === 'headerFreshnessDot'
        ? { attributes: true, attributeFilter: ['class'] }
        : { childList: true, characterData: true, subtree: true };
      obs.observe(node, opts);
    });
    syncTopPipelineStrip();
    syncDepthLaddersStatus();
  }

  function observeDepthLaddersStatus() {
    if (typeof MutationObserver === 'undefined') return;
    const obs = new MutationObserver(syncDepthLaddersStatus);
    ['hydrationImportStatus', 'headerFreshnessLabel'].forEach((id) => {
      const node = el(id);
      if (!node) return;
      obs.observe(node, { childList: true, characterData: true, subtree: true });
    });
    const attachVizObserver = () => {
      const badge = el('vizDiagnosticsBadge');
      if (!badge) return false;
      obs.observe(badge, {
        childList: true,
        characterData: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class'],
      });
      return true;
    };
    if (!attachVizObserver()) {
      let tries = 0;
      const poll = global.setInterval(() => {
        if (attachVizObserver() || ++tries > 60) global.clearInterval(poll);
      }, 500);
    }
    syncDepthLaddersStatus();
  }

  function observeRiskCurveSummary() {
    const rail = el('nodeRail');
    if (!rail || typeof MutationObserver === 'undefined') return;
    const obs = new MutationObserver(syncRiskCurveSummary);
    obs.observe(rail, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'aria-selected'] });
    syncRiskCurveSummary();
  }

  function observeHyOasPanelMeta() {
    if (typeof MutationObserver === 'undefined') {
      syncHyOasPanelMeta();
      return;
    }
    const obs = new MutationObserver(syncHyOasPanelMeta);
    ['basisTacticalLead', 'cockpitChartSubtitle', 'basisReadingValue'].forEach((id) => {
      const node = el(id);
      if (!node) return;
      obs.observe(node, { childList: true, characterData: true, subtree: true });
    });
    syncHyOasPanelMeta();
  }

  function observeFlipchartPanelMeta() {
    if (typeof MutationObserver === 'undefined') {
      syncFlipchartPanelMeta();
      return;
    }
    const obs = new MutationObserver(syncFlipchartPanelMeta);
    ['flipchartPosition', 'flipchartSlideIndex', 'flipchartTitle', 'flipchartRegimeTag'].forEach((id) => {
      const node = el(id);
      if (!node) return;
      obs.observe(node, {
        childList: true,
        characterData: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class'],
      });
    });
    syncFlipchartPanelMeta();
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
      observeDepthLaddersStatus();
      observeRiskCurveSummary();
      observeHyOasPanelMeta();
      observeFlipchartPanelMeta();
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
    relocateTopBar,
    assembleDepthLaddersWidget,
    assembleHyOasWidget,
    syncDepthLaddersStatus,
    syncDepthPanelMeta,
    syncHyOasPanelMeta,
    syncFlipchartPanelMeta,
    syncRiskCurveSummary,
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