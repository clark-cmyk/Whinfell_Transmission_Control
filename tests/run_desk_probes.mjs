#!/usr/bin/env node
/** Mission + RV probes against shipped hydration bundle (Chunks 1–2). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCoreJs, loadBundle } from './dom_shim.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRATCH = process.env.SCRATCH || '/var/folders/qn/gdsdhg9j3f77wk7fn889zbq40000gn/T/grok-goal-0353ff2e1563/implementer';
const NODES = ['basis', 'credit', 'liquidity', 'breadth', 'highbeta'];

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function tacticalDup(tactical) {
  const words = tactical.split(/\s+/);
  const half = Math.floor(words.length / 2);
  if (half < 3) return false;
  return words.slice(0, half).join(' ') === words.slice(half).join(' ');
}

function run() {
  const w = loadCoreJs();
  const bundle = loadBundle();
  const mission = {};
  const rv = {};

  for (const nodeId of NODES) {
    const m = w.runMissionSurfaceProbe
      ? w.runMissionSurfaceProbe(nodeId, bundle, nodeId === 'credit' || nodeId === 'liquidity' || nodeId === 'breadth' || nodeId === 'highbeta'
        ? { chinaInputs: { policy: 50, state: 0, growth: 0 } }
        : {})
      : (nodeId === 'credit' ? w.__creditMissionProbe(bundle)
        : nodeId === 'liquidity' ? w.__liquidityMissionProbe(bundle)
        : nodeId === 'breadth' ? w.__breadthMissionProbe(bundle)
        : nodeId === 'highbeta' ? w.__highbetaMissionProbe(bundle)
        : w.__creditMissionProbe(bundle));

    assert(m.missionVisible === true, `${nodeId} missionVisible`);
    assert((m.tacticalLead || '').length > 10, `${nodeId} tacticalLead`);
    assert((m.chips || []).length >= 1, `${nodeId} chips`);
    assert(!tacticalDup(m.tactical || ''), `${nodeId} duplicated tactical banner`);

    if (nodeId === 'credit') {
      assert(m.railHasHorizonNet || m.compositeFallback, 'credit horizon-net/composite fallback surfaced');
    }

    mission[nodeId] = {
      missionVisible: m.missionVisible,
      tacticalLead: m.tacticalLead,
      chips: m.chips,
      compositeFallback: m.compositeFallback,
      railHasHorizonNet: m.railHasHorizonNet,
    };

    const r = w.__rvHorizonEvidenceProbe(bundle, nodeId);
    rv[nodeId] = {
      fallbackMode: r.fallbackMode,
      spotFallbackTable: r.spotFallbackTable,
      spotValueRepeatCount: r.spotValueRepeatCount,
      hasSpotNote: r.hasSpotNote,
    };
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
  console.log(JSON.stringify({ missionNodes: NODES.length, spotFallbackNodes: spotNodes }, null, 2));
}

try {
  run();
} catch (err) {
  console.error(`FAIL run_desk_probes.mjs: ${err.message}`);
  process.exit(1);
}