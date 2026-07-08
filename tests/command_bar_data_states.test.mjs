#!/usr/bin/env node
/** Phase 2 — command-bar KPIs bind to WTM_DataStates registry */
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCoreJs } from './dom_shim.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function loadKpiModule() {
  for (const file of ['data_states.js', 'command_bar_kpis.js']) {
    const src = fs.readFileSync(path.join(ROOT, 'js', file), 'utf8');
    const sandbox = { window: {}, console, document: { createElement: () => ({ className: '', setAttribute() {}, textContent: '' }) } };
    sandbox.window = sandbox;
    vm.runInContext(src, vm.createContext(sandbox), { filename: file });
    if (file === 'command_bar_kpis.js') return sandbox.WTM_CommandBarKpis;
  }
  return null;
}

function run() {
  const KPI = loadKpiModule();
  assert(KPI?.BUILD?.includes('CHUNK08'), 'command bar kpi build');
  assert(KPI.SEMANTIC_CARD_DISPLAY?.shock?.faceValue?.clear === 'No scenario', 'shock semantic face');
  assert(KPI.BADGE_DISPLAY?.suppressKinds?.includes('card'), 'card badges suppressed by config');
  const hiddenCardBadge = KPI.resolveBadge(
    { kind: 'card', id: 'whinfell_score' },
    { state: 'not_computed', label: 'Not computed' },
  );
  assert(hiddenCardBadge.visible === false, 'decision-strip card badge hidden');
  assert(KPI.DECISION_STRIP_REGISTRY.length >= 5, 'decision strip registry');
  assert(KPI.TOOLBAR_REGISTRY.length >= 4, 'toolbar registry');
  assert(KPI.META_RECIPES.score?.length, 'score meta recipe');

  const ctx = {
    prov: { hydratedAt: null },
    metrics: { whinfellScore: null, sq3Score: null, grossRiskPct: null, dataAsOf: null, source: 'live' },
    gate: { score: NaN, code: 'blocked', zone: { text: 'Pending', key: 'amber' }, rule: 'Score required' },
    health: { score: 50, label: 'Fair', weakestStage: 'Liquidity' },
    state: { tracer: { activeShock: null } },
    zone: { text: 'Pending', key: 'amber' },
    freshStatus: 'unknown',
    freshLabel: '—',
    sq3Key: 'unknown',
    gateTitle: 'BLOCKED',
    shockLabel: null,
    helpers: {
      freshnessChipCls: () => 'status-chip',
      freshnessDotCls: () => 'freshness-dot',
      sq3ChipCls: () => 'border-wtm-border',
    },
  };
  const scoreMeta = KPI.buildMeta(ctx, 'score');
  assert(scoreMeta.not_computed && scoreMeta.reason.includes('Import'), 'unhydrated score meta');

  const w = loadCoreJs();
  const exp = w.__testExports;
  const gate = w.deriveGate?.(w.buildStateFromDOM?.()) || {
    score: NaN,
    zone: { text: '—', key: '' },
    code: 'blocked',
    glow: '',
    bannerSub: '',
    label: 'Blocked',
    rule: 'Enter score',
  };
  const state = {
    provenance: w.appState?.provenance || { hydratedAt: null },
    intake: { whinfellScore: '', transmissionState: '', regimeTag: '' },
    tracer: { horizons: {}, activeShock: null },
    grossRisk: { posture: '' },
    operator: {},
    hydration: {},
  };
  exp.renderCommandBar(state, gate);

  const scoreEl = w.document.getElementById('cmdWhinfellScore');
  assert(scoreEl?.textContent === 'Not computed', `score typed null not dash (${scoreEl?.textContent})`);
  assert(scoreEl?.parentElement?.dataset?.dataState === 'not_computed' || w.document.getElementById('scoreCard')?.dataset?.dataState === 'not_computed', 'score card data state');

  const sq3El = w.document.getElementById('cmdSq3Score');
  assert(sq3El?.textContent !== 'SQ3 policy —', `sq3 not silent dash (${sq3El?.textContent})`);
  assert(sq3El?.dataset?.dataState, 'sq3 inline data state');

  const grossEl = w.document.getElementById('cmdGrossRisk');
  assert(grossEl?.textContent !== '—', `gross typed (${grossEl?.textContent})`);

  const sq3BandEl = w.document.getElementById('cmdSq3Band');
  assert(!sq3BandEl?.textContent?.trim(), `sq3 band chip hidden without band (${sq3BandEl?.textContent})`);
  const hiddenCmdBadges = w.document.querySelectorAll?.('.decision-strip .ds-state-badge:not(.ds-state-badge--hidden)')
    || [];
  assert(hiddenCmdBadges.length === 0, `decision strip badges suppressed (${hiddenCmdBadges.length})`);

  console.log([
    'PASS command_bar_data_states.test.mjs',
    `kpi_build=${KPI.BUILD}`,
    `strip=${KPI.DECISION_STRIP_REGISTRY.length}`,
    `toolbar=${KPI.TOOLBAR_REGISTRY.length}`,
    `score=${scoreEl?.textContent}`,
    `sq3=${sq3El?.textContent}`,
  ].join('\n'));
}

try {
  run();
} catch (err) {
  console.error(`FAIL command_bar_data_states.test.mjs: ${err.message}`);
  process.exit(1);
}