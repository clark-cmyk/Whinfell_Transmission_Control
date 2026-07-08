#!/usr/bin/env node
/** Midwest Compute Crush — IA shell integration regression */
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

  assert(html.includes('ia-specialized-tools'), 'Specialized Tools nav group');
  assert(html.includes('Specialized tools'), 'Specialized tools label');
  assert(html.includes('btnIaBasisWatch'), 'BasisWatch nav button');
  const registry = fs.readFileSync(path.join(ROOT, 'js/top_utility_registry.js'), 'utf8');
  assert(registry.includes('btnDeskRefresh'), 'global refresh control registered');
  assert(!html.includes('id="btnWmcCollect"'), 'no per-panel WMC collect button');
  assert(!html.includes('id="btnBwCollect"'), 'no per-panel BasisWatch collect button');
  assert(!html.includes('id="btnBwRefresh"'), 'no per-panel BasisWatch refresh button');
  assert(html.includes('btnIaMidwestCrush'), 'Midwest Crush nav button');
  assert(html.includes('btnIaBangBangDa'), 'Bang Bang Da nav link');
  assert(html.includes('btnIaLadderDeepDive'), 'Ladder deep dive nav link');
  assert(html.includes('data-ia-dig-view="basis_watch"'), 'basis watch dig view');
  assert(html.includes('data-ia-dig-view="midwest_crush"'), 'dig view data attribute');
  assert(html.includes('bang_bang_da_machine.html'), 'BBD href');
  assert(html.includes('whinfell-transmission-ladder-deep-dive.html'), 'ladder deep dive href');
  assert(html.includes('wf-rail-section--risk-curve'), 'risk curve scroll section');
  assert(html.includes('id="iaMidwestCrushHost"'), 'midwest crush host');
  assert(html.includes('id="corrHeatmap"'), 'correlation heatmap mount');
  assert(html.includes('id="basisTable"'), 'basis tracker mount');
  assert(html.includes('Whinfell_Midwest_Compute_Crush.html'), 'pop-out link to standalone');
  assert(html.includes('midwest_compute/wmc.css'), 'wmc.css linked');
  assert(html.includes('js/wmc_ia_panel.js'), 'wmc_ia_panel script');

  const digHostPos = html.indexOf('id="iaDigHost"');
  const crushPos = html.indexOf('id="iaMidwestCrushHost"');
  assert(digHostPos > 0 && crushPos > digHostPos, 'midwest host inside dig host region');

  const standalone = fs.readFileSync(path.join(ROOT, 'Whinfell_Midwest_Compute_Crush.html'), 'utf8');
  assert(standalone.includes('midwest_compute/wmc-boot.js'), 'standalone still uses wmc-boot');
  assert(!standalone.includes('iaMidwestCrushHost'), 'standalone unchanged by IA embed');
}

function runShellChecks() {
  const shellSrc = fs.readFileSync(path.join(ROOT, 'js/console_ia_shell.js'), 'utf8');
  assert(shellSrc.includes('selectMidwestCrush'), 'selectMidwestCrush export');
  assert(shellSrc.includes('selectBasisWatch'), 'selectBasisWatch export');
  assert(shellSrc.includes('setDigView'), 'setDigView export');
  assert(shellSrc.includes('iaMidwestCrushHost'), 'relocates midwest host');
  assert(shellSrc.includes('ia-dig-view-midwest-crush'), 'midwest crush body class');
  assert(shellSrc.includes('bindSpecializedTools'), 'specialized tools binding');

  const ctx = {
    document: {
      body: { classList: { _s: new Set(), add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, toggle() {}, contains(c) { return this._s.has(c); } } },
      querySelectorAll: (sel) => {
        if (sel === '.ia-layer-tab') return [];
        if (sel === '[data-ia-dig-view]') {
          return [{
            dataset: { iaDigView: 'midwest_crush' },
            classList: { toggle() {} },
            setAttribute() {},
            addEventListener(_ev, _cb) {},
          }];
        }
        return [];
      },
      getElementById: (id) => {
        const nodes = {
          wtmIaShell: { id },
          iaLeftNavHost: { id, appendChild() {} },
          iaScanHost: { id, appendChild() {} },
          iaCockpitHost: { id, appendChild() {} },
          iaDigHost: { id, appendChild() {} },
          iaRightRailHost: { id, appendChild() {} },
          iaMidwestCrushHost: { id, parentElement: null, classList: { remove() {}, add() {} } },
          nodeRail: { id, parentElement: null },
          transmissionRadar: { id, parentElement: null },
          nodeCockpitZone: { id, parentElement: null, classList: { add() {}, toggle() {} } },
          basisWatchPanel: { id, parentElement: null },
          cockpitDecisionRail: { id, parentElement: null },
          btnIaLeftCollapse: null,
          iaCommentaryDisclosure: null,
        };
        return nodes[id] || null;
      },
    },
    console: { warn() {} },
    WTM_WmcIaPanel: { activate() {}, deactivate() {} },
  };
  vm.runInNewContext(shellSrc, ctx);
  ctx.WTM_IaShell.activateShell();
  ctx.WTM_IaShell.selectMidwestCrush();
  assert(ctx.document.body.classList._s.has('ia-layer-dig'), 'selectMidwestCrush sets dig layer');
  assert(ctx.document.body.classList._s.has('ia-dig-view-midwest-crush'), 'selectMidwestCrush sets midwest view');
  assert(ctx.WTM_IaShell.activeDigView === 'midwest_crush', 'activeDigView tracked');
}

function runPanelChecks() {
  const panelSrc = fs.readFileSync(path.join(ROOT, 'js/wmc_ia_panel.js'), 'utf8');
  assert(panelSrc.includes('WTM_WmcIaPanel'), 'panel export');
  assert(panelSrc.includes('renderDecisionRail'), 'decision rail renderer');
  assert(panelSrc.includes('crushSpreadRow'), 'crush spread helper');
  assert(panelSrc.includes('topCorrelation'), 'correlation helper');
}

function runCssChecks() {
  const css = fs.readFileSync(path.join(ROOT, 'css/console_ia.css'), 'utf8');
  assert(css.includes('.ia-specialized-tools'), 'specialized tools styles');
  assert(css.includes('bottom: 33vh'), 'specialized tools sticky offset');
  assert(css.includes('.wf-rail-section--risk-curve'), 'risk curve section styles');
  assert(css.includes('.ia-midwest-crush-viewport'), 'zoom-safe viewport');
  assert(css.includes('ia-dig-view-midwest-crush'), 'dig view toggle rules');
}

function runCommentaryChecks() {
  const src = fs.readFileSync(path.join(ROOT, 'js/commentary_feed.js'), 'utf8');
  assert(src.includes('wmc:thesis'), 'WMC thesis commentary');
  assert(src.includes('wmc:correlation'), 'WMC correlation commentary');
}

runHtmlChecks();
runShellChecks();
runPanelChecks();
runCssChecks();
runCommentaryChecks();

console.log('wmc_ia_integration.test.mjs — PASS (nav · shell · panel · css · commentary)');