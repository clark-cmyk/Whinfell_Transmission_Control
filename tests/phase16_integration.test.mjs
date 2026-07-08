#!/usr/bin/env node
/** Phase 16 — IA shell integration, right-rail commentary, dictionary drawer. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function scriptIndex(html, src) {
  const a = html.indexOf(`src="${src}"`);
  assert(a > 0, `${src} script tag missing`);
  return a;
}

function runHtmlChecks() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  assert(html.includes('class="wtm-ia-shell"'), 'wtm-ia-shell class present');
  assert(html.includes('id="wtmIaShell"'), 'wtmIaShell id present');
  assert(html.includes('id="iaCommentaryFeed"'), 'iaCommentaryFeed mount present');
  assert(html.includes('id="iaDictionaryDrawer"'), 'iaDictionaryDrawer present');
  assert(html.includes('id="cockpitDecisionContent"'), 'cockpitDecisionContent mount present');

  assert(
    html.includes('id="iaCommentaryFeed"') && html.includes('id="cockpitDecisionRail"'),
    'commentary and decision rail both present',
  );

  const commentaryInsideRail = /<aside[^>]*id="cockpitDecisionRail"[\s\S]*id="iaCommentaryFeed"/.test(html);
  assert(commentaryInsideRail, 'iaCommentaryFeed nested in cockpitDecisionRail');

  assert(!/<details[^>]*id="basisTacticalDisclosure"[^>]*\bopen\b/i.test(html), 'basisTacticalDisclosure collapsed');
  assert(html.includes('id="bwMethodologyDisclosure"'), 'basis methodology disclosure present');
  assert(!/<details[^>]*id="bwMethodologyDisclosure"[^>]*\bopen\b/i.test(html), 'methodology collapsed by default');

  const corePos = scriptIndex(html, 'js/core.js');
  for (const mod of ['js/commentary_feed.js', 'js/data_dictionary_panel.js', 'js/console_ia_shell.js']) {
    assert(scriptIndex(html, mod) < corePos, `${mod} loads before core.js`);
  }

  assert(html.includes('id="cockpitDataViewport"'), 'cockpit data viewport for zoom-safe scroll');
}

function runShellActivatorCheck() {
  const shellSrc = fs.readFileSync(path.join(ROOT, 'js/console_ia_shell.js'), 'utf8');
  assert(shellSrc.includes('WTM_IaShell'), 'WTM_IaShell export');
  assert(shellSrc.includes('ia-shell-active'), 'shell active class');
  assert(shellSrc.includes('iaFlipchartHost'), 'flipchart widget relocation');

  const ctx = {
    document: {
      body: { classList: { _s: new Set(), add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, toggle() {} } },
      querySelectorAll: () => [],
      getElementById: (id) => {
        const nodes = {
          wtmIaShell: { id },
          iaTopFrame: { id, dataset: { collapsed: 'false' } },
          iaRiskCockpitHost: { id, appendChild() {} },
          iaRiskCurveHost: { id, appendChild() {} },
          iaRadarHost: { id, appendChild() {} },
          iaHyOasHost: { id, appendChild() {} },
          iaFlipchartHost: { id, appendChild() {} },
          iaDepthHost: { id, appendChild() {} },
          iaDigHost: { id, appendChild() {} },
          iaMidwestCrushHost: { id, parentElement: null, classList: { remove() {}, add() {} } },
          scanKpiStrip: { id, parentElement: null },
          nodeRail: { id, parentElement: null },
          transmissionRadar: { id, parentElement: null },
          cockpitChartArea: { id, parentElement: null },
          cockpitDetailBand: { id, parentElement: null },
          cockpitActions: { id, parentElement: null },
          nodeCockpitZone: { id, parentElement: null, classList: { add() {}, toggle() {} } },
          basisWatchPanel: { id, parentElement: null },
          cockpitDecisionRail: { id, parentElement: null },
          consoleDepthDisclosure: { id, parentElement: null },
        };
        return nodes[id] || null;
      },
    },
    console: { warn() {} },
  };
  vm.runInNewContext(shellSrc, ctx);
  ctx.WTM_IaShell.activateShell();
  assert(ctx.document.body.classList._s.has('ia-shell-active'), 'activateShell sets ia-shell-active');
}

function run() {
  runHtmlChecks();
  runShellActivatorCheck();
  console.log('PASS phase16_integration.test.mjs');
}

try {
  run();
} catch (err) {
  console.error(`FAIL phase16_integration.test.mjs: ${err.message}`);
  process.exit(1);
}