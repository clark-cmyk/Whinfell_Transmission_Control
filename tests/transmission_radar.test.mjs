#!/usr/bin/env node
/** Chunk 11 — Transmission Signal Radar live wiring. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function loadModule() {
  const sandbox = { window: {}, console };
  sandbox.window = sandbox;
  for (const file of ['data_states.js', 'command_bar_kpis.js', 'transmission_radar.js']) {
    const src = fs.readFileSync(path.join(ROOT, 'js', file), 'utf8');
    vm.runInContext(src, vm.createContext(sandbox), { filename: file });
  }
  return sandbox.WTM_TransmissionRadar;
}

function makeCtx(overrides = {}) {
  const horizons = {
    liquidity: { d1: 'up', d5: 'flat', d20: 'flat', d60: 'flat' },
    credit: { d1: 'down', d5: 'down', d20: 'flat', d60: 'down' },
    breadth: { d1: 'up', d5: 'flat', d20: 'flat', d60: 'flat' },
    highbeta: { d1: 'flat', d5: 'down', d20: 'flat', d60: 'flat' },
    basis: { d1: 'flat', d5: 'flat', d20: 'down', d60: 'flat' },
  };
  const stageNets = [1, -3, 1, -1, -1];
  return {
    prov: { hydratedAt: '2026-07-04T20:52:57+00:00' },
    metrics: { dataAsOf: '2026-07-04T20:52:57+00:00', freshnessStatus: 'fresh' },
    state: { tracer: { horizons } },
    health: {
      score: 58,
      label: 'Mixed',
      weakestStage: 'Credit Confirmation',
      weakestIdx: 1,
      summary: { stageNets, weakestIdx: 1 },
    },
    freshStatus: 'fresh',
    freshLabel: 'Fresh',
    ...overrides,
  };
}

function main() {
  const mod = loadModule();
  assert(mod, 'WTM_TransmissionRadar export missing');
  assert(mod.BUILD.includes('CHUNK11'), 'chunk 11 build tag');
  assert(mod.RADAR_SLEEVE_REGISTRY.length === 5, 'five sleeves');
  assert(mod.RADAR_SLEEVE_REGISTRY.every((s) => s.ladderId), 'ladder ids wired');

  const emptyHtml = mod.shellHtml();
  assert(emptyHtml.includes('Transmission Signal Radar'), 'shell title');
  assert(emptyHtml.includes('data-radar-sleeve="credit"'), 'credit sleeve');
  assert(emptyHtml.includes('Weakest'), 'weakest row');
  assert(emptyHtml.includes('Not wired'), 'empty summary');
  assert(!/historically|win-rate|sessions like/i.test(emptyHtml), 'no AI prose');

  const ctx = makeCtx();
  const display = mod.buildRadarDisplay(ctx);
  assert(display.summaryFace === 'Mixed · 58', 'live summary face');
  assert(display.weakestFace === 'Cred', 'weakest short label');
  assert(display.sleeves.length === 5, 'five live sleeves');

  const credit = display.sleeves.find((s) => s.id === 'credit');
  assert(credit.face === '-3', 'credit net face');
  assert(credit.cue === 'Dragging', 'credit net cue');
  assert(credit.isWeakest === true, 'credit weakest flag');
  assert(credit.state === 'healthy', 'credit data state');

  const html = mod.shellHtml(display);
  assert(html.includes('Mixed · 58'), 'wired summary in html');
  assert(html.includes('data-data-state="healthy"'), 'typed healthy state');
  assert(html.includes('radar-sleeve--weakest'), 'weakest highlight class');
  assert(html.includes('data-radar-sleeve="credit"'), 'credit sleeve in live html');
  assert(html.includes('>-3<'), 'credit net in html');

  const unhydrated = mod.buildRadarDisplay(makeCtx({ prov: { hydratedAt: null } }));
  const liq = unhydrated.sleeves.find((s) => s.id === 'liquidity');
  assert(liq.state === 'not_computed', 'unhydrated sleeve not_computed');

  const noMarks = mod.buildRadarDisplay(makeCtx({
    state: { tracer: { horizons: { liquidity: { d1: '', d5: '', d20: '', d60: '' } } } },
    health: { score: 50, label: 'Mixed', weakestIdx: 0, summary: { stageNets: [0, 0, 0, 0, 0], weakestIdx: 0 } },
  }));
  const liqPending = noMarks.sleeves.find((s) => s.id === 'liquidity');
  assert(liqPending.state === 'not_computed', 'no marks → not_computed');

  assert(mod.formatNet(2) === '+2', 'formatNet positive');
  assert(mod.formatNet(-1) === '-1', 'formatNet negative');
  assert(mod.netCue(0) === 'Flat', 'netCue flat');

  // Chunk 4 — panel header meta (summary · weakest)
  assert(typeof mod.syncPanelMeta === 'function', 'syncPanelMeta export');
  assert(mod.PANEL_META_ID === 'radarPanelMeta', 'panel meta id');
  const metaEl = { textContent: '', title: '', setAttribute(k, v) { this[k] = v; } };
  const metaDoc = { getElementById: (id) => (id === 'radarPanelMeta' ? metaEl : null) };
  const metaLine = mod.syncPanelMeta(display, metaDoc);
  assert(metaLine === 'Mixed · 58 · Weakest Cred', 'panel meta line');
  assert(metaEl.textContent === metaLine, 'panel meta written');
  const emptyMeta = mod.syncPanelMeta(mod.buildRadarDisplay(null), metaDoc);
  assert(emptyMeta.includes('Not wired'), 'empty panel meta falls back');

  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert(indexHtml.includes('id="transmissionRadar"'), 'index mount');
  assert(indexHtml.includes('transmission_radar.css'), 'css linked');
  assert(indexHtml.includes('transmission_radar.js'), 'js linked');
  assert(indexHtml.includes('id="widgetTransmissionRadar"'), 'radar wf-panel wrapper');
  assert(indexHtml.includes('wf-panel--radar'), 'radar panel class');
  assert(indexHtml.includes('id="radarPanelMeta"'), 'radar panel meta in header');
  assert(indexHtml.includes('id="widgetRiskCurve"'), 'risk curve sibling panel');
  assert(indexHtml.includes('wf-panel--risk-curve'), 'risk curve panel class');
  assert(indexHtml.includes('id="iaRiskCurveSummary"'), 'left rail keeps curve shortcut');
  const scanPos = indexHtml.indexOf('id="scanKpiStrip"');
  const shellPos = indexHtml.indexOf('id="wtmIaShell"');
  const scanHostPos = indexHtml.indexOf('id="iaScanHost"');
  const radarPos = indexHtml.indexOf('id="transmissionRadar"');
  const cockpitPos = indexHtml.indexOf('id="nodeCockpitZone"');
  const digHostPos = indexHtml.indexOf('id="iaDigHost"');
  const basisPos = indexHtml.indexOf('id="basisWatchPanel"');
  const depthPos = indexHtml.indexOf('id="consoleDepthDisclosure"');
  const cmdPos = indexHtml.indexOf('id="commandBar"');
  assert(scanPos > 0 && shellPos > scanPos, 'IA shell after scan strip');
  assert(scanHostPos > shellPos && radarPos > scanHostPos, 'radar inside scan host');
  assert(cockpitPos > radarPos, 'cockpit after radar');
  assert(digHostPos > cockpitPos && basisPos > digHostPos, 'basis watch inside dig host');
  assert(depthPos > shellPos && cmdPos > depthPos, 'depth band after shell with command bar inside');

  console.log('PASS transmission_radar.test.mjs');
}

try {
  main();
} catch (err) {
  console.error(`FAIL transmission_radar.test.mjs: ${err.message}`);
  process.exit(1);
}