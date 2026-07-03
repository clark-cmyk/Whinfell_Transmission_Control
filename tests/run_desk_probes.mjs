#!/usr/bin/env node
/** Mission + RV probes against shipped hydration bundle (Chunks 1–2). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCoreJs, loadBundle } from './dom_shim.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRATCH = process.env.SCRATCH || '/var/folders/qn/gdsdhg9j3f77wk7fn889zbq40000gn/T/grok-goal-0353ff2e1563/implementer';
const NODES = ['basis', 'credit', 'liquidity', 'breadth', 'highbeta'];

const EXPECTED_SERIES = {
  basis: 'BT near-deferred calendar',
  credit: 'HY OAS proxy',
  liquidity: 'US 2s10s spread',
  breadth: 'IWM / SPY participation',
  highbeta: 'IBIT vs QQQ beta spread',
};

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function tacticalDup(tactical) {
  const words = tactical.split(/\s+/);
  const half = Math.floor(words.length / 2);
  if (half < 3) return false;
  return words.slice(0, half).join(' ') === words.slice(half).join(' ');
}

function seriesLabelFromBundle(bundle, nodeId) {
  const cockpit = bundle.node_cockpits?.[nodeId];
  const seriesMap = cockpit?.rv_basis?.series || {};
  const seriesId = cockpit?.rv_basis?.active_series_id || Object.keys(seriesMap)[0];
  return seriesMap[seriesId]?.label || '';
}

function runMissionProbe(w, bundle, nodeId) {
  const chinaOpts = nodeId !== 'basis'
    ? { chinaInputs: { policy: 50, state: 0, growth: 0 } }
    : {};
  return w.runMissionSurfaceProbe(nodeId, bundle, chinaOpts);
}

function run() {
  const w = loadCoreJs();
  const bundle = loadBundle();
  const mission = {};
  const rv = {};
  const leads = [];

  // Mission probes first — before any focus-mode RV probes mutate navigation state.
  for (const nodeId of NODES) {
    const expectedSeries = seriesLabelFromBundle(bundle, nodeId) || EXPECTED_SERIES[nodeId];
    const m = runMissionProbe(w, bundle, nodeId);

    assert(m.missionVisible === true, `${nodeId} missionVisible`);
    assert((m.tacticalLead || '').length > 10, `${nodeId} tacticalLead length`);
    assert((m.chips || []).length >= 1, `${nodeId} chips`);
    assert(!tacticalDup(m.tactical || ''), `${nodeId} duplicated tactical banner`);
    assert(
      m.tacticalLead.includes(expectedSeries),
      `${nodeId} tacticalLead must include series "${expectedSeries}", got: ${m.tacticalLead}`,
    );
    leads.push(m.tacticalLead);

    if (nodeId === 'credit') {
      assert(m.railHasHorizonNet || m.compositeFallback, 'credit horizon-net/composite fallback surfaced');
    }

    mission[nodeId] = {
      missionVisible: m.missionVisible,
      tacticalLead: m.tacticalLead,
      expectedSeries,
      chips: m.chips,
      compositeFallback: m.compositeFallback,
      railHasHorizonNet: m.railHasHorizonNet,
    };
  }

  assert(new Set(leads).size === NODES.length, `tacticalLead must differ per node; got ${leads.length} unique of ${NODES.length}`);

  // RV probes after mission probes — focus restored by shipped probe.
  for (const nodeId of NODES) {
    const r = w.__rvHorizonEvidenceProbe(bundle, nodeId);
    rv[nodeId] = {
      fallbackMode: r.fallbackMode,
      spotFallbackTable: r.spotFallbackTable,
      spotValueRepeatCount: r.spotValueRepeatCount,
      hasSpotNote: r.hasSpotNote,
    };
    // Mission view must remain renderable after each RV probe.
    const post = runMissionProbe(w, bundle, nodeId);
    assert(post.missionVisible === true, `${nodeId} missionVisible after rv probe`);
    assert(
      post.tacticalLead.includes(mission[nodeId].expectedSeries),
      `${nodeId} tacticalLead stable after rv probe`,
    );
  }

  const creditRv = rv.credit;
  assert(creditRv.fallbackMode === 'spot', 'credit rv fallbackMode');
  assert(creditRv.spotFallbackTable === true, 'credit spotFallbackTable');
  assert(creditRv.spotValueRepeatCount <= 1, 'credit spot repeat');

  fs.mkdirSync(SCRATCH, { recursive: true });
  fs.writeFileSync(path.join(SCRATCH, 'mission_probes.json'), JSON.stringify({ mission, rv }, null, 2));
  fs.writeFileSync(path.join(SCRATCH, 'rv_probe_credit.json'), JSON.stringify(rv.credit, null, 2));

  const spotNodes = Object.entries(rv).filter(([, v]) => v.fallbackMode === 'spot').map(([k]) => k);
  for (const n of spotNodes) {
    if (n !== 'credit') {
      fs.writeFileSync(path.join(SCRATCH, `rv_probe_${n}.json`), JSON.stringify(rv[n], null, 2));
    }
  }

  console.log('PASS run_desk_probes.mjs');
  console.log(JSON.stringify({
    missionNodes: NODES.length,
    uniqueTacticalLeads: new Set(leads).size,
    spotFallbackNodes: spotNodes,
  }, null, 2));
}

try {
  run();
} catch (err) {
  console.error(`FAIL run_desk_probes.mjs: ${err.message}`);
  process.exit(1);
}