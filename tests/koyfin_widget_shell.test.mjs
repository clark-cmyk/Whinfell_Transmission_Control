#!/usr/bin/env node
/** Koyfin widget shell — top frame, widget grid, view shortcuts. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function runHtmlChecks() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  assert(html.includes('id="iaTopFrame"'), 'iaTopFrame present');
  assert(html.includes('id="iaTopPhaseTag"'), 'collapsed phase tag present');
  assert(html.includes('id="iaTopFreshnessDot"'), 'collapsed freshness dot present');
  assert(html.includes('id="iaTopUnsavedBadge"'), 'collapsed unsaved badge present');
  assert(html.includes('id="btnIaTopCollapse"'), 'top collapse toggle present');
  assert(html.includes('id="iaWidgetGrid"'), 'widget grid present');
  assert(html.includes('id="widgetRiskCockpit"'), 'Risk Cockpit widget present');
  assert(html.includes('wf-panel--risk-cockpit'), 'Risk Cockpit uses wf-panel chrome');
  assert(html.includes('id="riskCockpitPanelMeta"'), 'Risk Cockpit panel meta present');
  assert(html.includes('id="widgetRiskCurve"'), 'Risk Curve widget present');
  assert(html.includes('wf-panel--risk-curve'), 'Risk Curve uses wf-panel chrome');
  assert(html.includes('id="widgetTransmissionRadar"'), 'Radar widget present');
  assert(html.includes('wf-panel--radar'), 'Radar uses wf-panel chrome');
  assert(html.includes('id="radarPanelMeta"'), 'Radar panel meta present');
  assert(html.includes('id="widgetHyOas"'), 'HY OAS widget present');
  assert(html.includes('wf-panel--hy-oas'), 'HY OAS uses wf-panel chrome');
  assert(html.includes('id="hyOasPanelMeta"'), 'HY OAS panel meta present');
  assert(html.includes('id="hyOasNumerics"'), 'HY OAS Numerics subsection present');
  assert(html.includes('id="hyOasThesisHandoff"'), 'HY OAS Thesis & Handoff subsection present');
  assert(html.includes('id="hyOasHandoffActions"'), 'HY OAS handoff actions row present');
  assert(html.includes('wf-panel__actions'), 'HY OAS actions use wf-panel__actions');
  assert(html.includes('id="btnHeresWhy"'), "Here's Why action present");
  assert(html.includes('id="btnCompareMode"'), 'Compare action present');
  assert(html.includes('id="btnExportNode"'), 'Export node action present');
  assert(html.includes('id="widgetFlipchart"'), 'Flipchart widget present');
  assert(html.includes('id="flipchartSlideIndex"'), 'Flipchart slide index present');
  assert(html.includes('id="flipchartRegimeTag"'), 'Flipchart regime pill present');
  assert(html.includes('flipchart-header__title-group'), 'Flipchart header title group present');
  assert(html.includes('id="widgetDepth"'), 'Depth widget present');
  assert(html.includes('id="depthLaddersWidget"'), 'DepthLaddersWidget present');
  assert(html.includes('id="depthLaddersStatus"'), 'Depth status row present');
  assert(html.includes('class="ladder-viz-region"'), 'Ladder viz region present');
  assert(html.includes('depth-ladders-plumbing-icon'), 'Depth plumbing icon present');
  assert(html.includes('data-ia-view-shortcut="risk_cockpit"'), 'view shortcut buttons present');
  assert(html.includes('id="iaRiskCurveSummary"'), 'compact risk curve summary in left rail');

  const headerInsideShell = /<div[^>]*id="wtmIaShell"[\s\S]*<header[^>]*class="console-topbar/.test(html);
  assert(headerInsideShell, 'console-topbar nested inside wtmIaShell');

  const headerOutsideShell = /^[\s\S]*<header[^>]*class="console-topbar[\s\S]*<div[^>]*id="wtmIaShell"/.test(html);
  assert(!headerOutsideShell, 'no duplicate topbar outside shell');
}

function runShellJsChecks() {
  const shellSrc = fs.readFileSync(path.join(ROOT, 'js/console_ia_shell.js'), 'utf8');
  assert(shellSrc.includes('VIEW_SHORTCUT_REGISTRY'), 'VIEW_SHORTCUT_REGISTRY export');
  assert(shellSrc.includes('focusWidget'), 'focusWidget helper');
  assert(shellSrc.includes('relocateTopBar'), 'Chunk 1 relocateTopBar helper');
  assert(shellSrc.includes('iaRiskCockpitHost'), 'risk cockpit relocation');
  assert(shellSrc.includes('iaRiskCurveHost'), 'risk curve relocation');
  assert(shellSrc.includes('iaRadarHost'), 'radar relocation');
  assert(shellSrc.includes('iaHyOasHost'), 'HY OAS relocation');
  assert(shellSrc.includes('assembleHyOasWidget'), 'HY OAS subsection assembly');
  assert(shellSrc.includes('syncHyOasPanelMeta'), 'HY OAS panel meta sync');
  assert(shellSrc.includes('observeHyOasPanelMeta'), 'HY OAS panel meta observer');
  assert(shellSrc.includes('hyOasNumericsBody'), 'HY OAS numerics host');
  assert(shellSrc.includes('hyOasThesisBody'), 'HY OAS thesis host');
  assert(shellSrc.includes('hyOasHandoffActions'), 'HY OAS handoff relocation');
  assert(shellSrc.includes('iaFlipchartHost'), 'flipchart relocation');
  assert(shellSrc.includes('iaDepthHost'), 'depth relocation');
  assert(shellSrc.includes('assembleDepthLaddersWidget'), 'depth widget assembly');
  assert(shellSrc.includes('syncDepthLaddersStatus'), 'depth status sync');
  assert(shellSrc.includes('depthLaddersContent'), 'depth content host');
  assert(shellSrc.includes('parsePipelineFreshness'), 'pipeline freshness parser');
  assert(shellSrc.includes('iaTopFreshnessDot'), 'collapsed strip dot sync');
  assert(!shellSrc.includes('iaLeftNavHost'), 'nodeRail no longer targets left nav host');

  const css = fs.readFileSync(path.join(ROOT, 'css/console_ia.css'), 'utf8');
  assert(css.includes(':root[data-theme="light"]'), 'light theme tokens');
  assert(css.includes('--wf-bg-page'), 'wf-bg-page token');
  assert(css.includes('.ia-widget-grid'), 'widget grid CSS');
  assert(css.includes('.wf-panel--risk-cockpit'), 'Risk Cockpit panel grid area');
  assert(css.includes('.wf-panel--radar'), 'Radar panel grid area');
  assert(css.includes('.wf-panel--risk-curve'), 'Risk Curve panel grid area');
  assert(css.includes('.wf-panel--hy-oas'), 'HY OAS panel grid area');
  assert(css.includes('.wf-panel--hy-oas .wf-panel__meta'), 'HY OAS panel meta chrome');
  assert(css.includes('#iaRadarHost .transmission-radar .radar-title'), 'radar double-title suppress in host');
  assert(css.includes('.hy-oas-subsection'), 'HY OAS subsection CSS');
  assert(css.includes('.hy-oas-handoff-actions'), 'HY OAS handoff actions CSS');
  assert(css.includes('.flipchart-slide-index'), 'Flipchart slide index CSS');
  assert(css.includes('.flipchart-regime-tag'), 'Flipchart regime pill CSS');
  assert(css.includes('.depth-ladders-status'), 'Depth status row CSS');
  assert(css.includes('.ladder-viz-region'), 'Ladder viz region CSS');
  assert(css.includes('.ia-top-phase-tag'), 'collapsed phase tag CSS');
  assert(css.includes('[data-collapsed="true"] .ia-top-pipeline-strip'), 'collapsed pipeline strip CSS');
  // Chunk 2 — icons-only left rail (must not hide .ia-left-body when collapsed)
  assert(
    !/body\.ia-left-collapsed\s+\.ia-left-body\s*\{\s*display:\s*none/.test(css),
    'collapsed left body must not use display:none (icons-only rail)',
  );
  assert(css.includes('body.ia-left-collapsed [data-ia-view-shortcut="risk_cockpit"]::before'), 'RC icon code');
  assert(css.includes('body.ia-left-collapsed [data-ia-view-shortcut="transmission_radar"]::before'), 'RD icon code');
  assert(css.includes('body.ia-left-collapsed [data-ia-view-shortcut="hy_oas"]::before'), 'HY icon code');
  assert(css.includes('body.ia-left-collapsed #btnIaBasisWatch::before'), 'BW specialized tool code');
  assert(css.includes('--ia-left-w-collapsed'), 'collapsed left width token');
}

function runActivatorCheck() {
  const shellSrc = fs.readFileSync(path.join(ROOT, 'js/console_ia_shell.js'), 'utf8');
  const hosts = {};
  const mkHost = (id) => ({ id, appendChild(n) { hosts[id] = hosts[id] || []; hosts[id].push(n?.id || n); } });
  const mkNode = (id) => ({ id, parentElement: null });

  const hyOasMeta = { id: 'hyOasPanelMeta', textContent: '—', setAttribute(k, v) { this[k] = v; } };
  const basisLead = { id: 'basisTacticalLead', textContent: 'HY OAS cheap; half size' };
  const chartSub = { id: 'cockpitChartSubtitle', textContent: '—' };
  const basisReading = { id: 'basisReadingValue', textContent: '+12 bps' };
  const ctx = {
    document: {
      body: { classList: { _s: new Set(), add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, toggle(c) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); } } },
      querySelectorAll: () => [],
      getElementById: (id) => {
        const nodes = {
          wtmIaShell: mkNode('wtmIaShell'),
          iaTopFrame: { id, dataset: { collapsed: 'false' } },
          iaRiskCockpitHost: mkHost('iaRiskCockpitHost'),
          iaRiskCurveHost: mkHost('iaRiskCurveHost'),
          iaRadarHost: mkHost('iaRadarHost'),
          iaHyOasHost: mkHost('iaHyOasHost'),
          hyOasNumericsBody: mkHost('hyOasNumericsBody'),
          hyOasThesisBody: mkHost('hyOasThesisBody'),
          iaFlipchartHost: mkHost('iaFlipchartHost'),
          iaDepthHost: mkHost('iaDepthHost'),
          depthLaddersContent: mkHost('depthLaddersContent'),
          iaDigHost: mkHost('iaDigHost'),
          scanKpiStrip: mkNode('scanKpiStrip'),
          nodeRail: mkNode('nodeRail'),
          transmissionRadar: mkNode('transmissionRadar'),
          cockpitChartArea: mkNode('cockpitChartArea'),
          basisSummaryStrip: mkNode('basisSummaryStrip'),
          cockpitDetailBand: mkNode('cockpitDetailBand'),
          hyOasHandoffActions: mkNode('hyOasHandoffActions'),
          cockpitActions: mkNode('cockpitActions'),
          cockpitDecisionRail: mkNode('cockpitDecisionRail'),
          consoleDepthDisclosure: mkNode('consoleDepthDisclosure'),
          basisWatchPanel: mkNode('basisWatchPanel'),
          iaMidwestCrushHost: mkNode('iaMidwestCrushHost'),
          nodeCockpitZone: { id, classList: { add() {}, toggle() {} } },
          hyOasPanelMeta: hyOasMeta,
          basisTacticalLead: basisLead,
          cockpitChartSubtitle: chartSub,
          basisReadingValue: basisReading,
        };
        return nodes[id] || null;
      },
    },
    sessionStorage: { getItem: () => null, setItem() {} },
    MutationObserver: class { observe() {} },
    console: { warn() {} },
    clearTimeout() {},
    clearInterval() {},
    setTimeout(fn) { fn(); return 0; },
    setInterval(fn) { fn(); return 0; },
  };
  vm.runInNewContext(shellSrc, ctx);
  ctx.WTM_IaShell.activateShell();
  assert(ctx.document.body.classList._s.has('ia-shell-active'), 'shell activates');
  assert(hosts.iaRiskCurveHost?.includes('nodeRail'), 'nodeRail moved to risk curve widget');
  assert(hosts.iaRadarHost?.includes('transmissionRadar'), 'radar moved to widget host');
  assert(hosts.hyOasNumericsBody?.includes('cockpitChartArea'), 'chart area in Numerics subsection');
  assert(hosts.hyOasThesisBody?.includes('basisSummaryStrip'), 'basis structure in Thesis subsection');
  assert(hosts.hyOasThesisBody?.includes('cockpitDetailBand'), 'component drivers in Thesis subsection');
  assert(hosts.hyOasThesisBody?.includes('hyOasHandoffActions'), 'handoff row in Thesis subsection');
  assert(hosts.depthLaddersContent?.includes('consoleDepthDisclosure'), 'depth disclosure in widget content');
  const metaLine = ctx.WTM_IaShell.syncHyOasPanelMeta();
  assert(metaLine === 'HY OAS cheap; half size · +12 bps', 'HY OAS panel meta line');
  assert(hyOasMeta.textContent === metaLine, 'HY OAS panel meta written');
  ctx.WTM_IaShell.focusWidget('hy_oas');
  assert(typeof ctx.WTM_IaShell.focusWidget === 'function', 'focusWidget callable');
}

function run() {
  runHtmlChecks();
  runShellJsChecks();
  runActivatorCheck();
  console.log('PASS koyfin_widget_shell.test.mjs');
}

try {
  run();
} catch (err) {
  console.error(`FAIL koyfin_widget_shell.test.mjs: ${err.message}`);
  process.exit(1);
}