#!/usr/bin/env node
/** Task Force v1.1.0 — WTM EXPORT v2.1 parse + hydration import verification. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCoreJs, loadBundle } from './dom_shim.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCRATCH = process.env.SCRATCH || '/tmp/whinfell_task_force_test';

const PIPELINE_SEQ = [
  'data_gatherer', 'btc_eth_basis', 'btc_eth_vol_arb', 'compute_gpu',
  'power_nat_gas', 'metals_debt', 'china_sq3_deep', 'sofr_fedfunds',
  'hy_vs_ig', 'global_transmission', 'master_sizing', 'tx_integrator',
];

const REQUIRED_WTM_FIELDS = [
  'whinfellScore', 'transmissionState', 'regimeTag', 'keyObservation',
  'grossRiskRecommendation', 'btcBias', 'sq3Score', 'sq3Band',
  'snapshotId', 'lineageHash', 'sourceChannel', 'provenance',
];

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function run() {
  const bundle = loadBundle('docs/data/hydration/latest.json');
  const tf = bundle.task_force;

  assert(tf, 'task_force block present in latest.json');
  assert(tf.task_force_version === '1.1.0', 'task_force_version 1.1.0');
  assert(JSON.stringify(tf.pipeline_seq) === JSON.stringify(PIPELINE_SEQ), 'pipeline_seq 12-step');

  const tfWtm = tf.wtm_export_v21;
  assert(tfWtm && tfWtm.includes('--- WTM EXPORT v2.1 ---'), 'task_force.wtm_export_v21 block present');
  assert(tfWtm.includes('Source Channel: task_force'), 'Source Channel: task_force');

  const w = loadCoreJs();
  const parsed = w.parsePerplexityText(tfWtm);
  assert(parsed.imported.length >= 10, `WTM parse imported ${parsed.imported.length} fields`);
  for (const key of REQUIRED_WTM_FIELDS) {
    assert(parsed.fields[key] != null && parsed.fields[key] !== '', `parsed field ${key}`);
  }
  assert(parsed.fields.sourceChannel === 'task_force', 'sourceChannel task_force');
  assert(parsed.fields.whinfellScore === '69', 'whinfellScore from stub');
  assert(
    (parsed.fields.grossRiskRecommendation || '').includes('30%'),
    'grossRiskRecommendation from task_force WTM',
  );

  // Post-merge hydration: top-level wtm_export_v21 should match task_force block.
  const mergedBundle = { ...bundle, wtm_export_v21: tfWtm };
  const ok = w.hydrateFromBundle(mergedBundle, { force: true });
  assert(ok !== false, 'hydrateFromBundle succeeded');

  assert(w.document.getElementById('whinfellScore').value === '69', 'hydration whinfellScore');
  assert(w.document.getElementById('transmissionState').value === 'elevated', 'hydration transmissionState');
  assert(w.document.getElementById('chinaPolicyStrength').value === '50', 'hydration chinaPolicyStrength');
  assert(w.document.getElementById('grossA').value === '30', 'grossA from WTM gross risk parse');

  if (tf.validation_status === 'complete') {
    assert(tf.master_sizing, 'master_sizing present when complete');
    assert(tf.specialists?.tx_integrator, 'tx_integrator specialist present');
    assert(['EXECUTE', 'WATCH', 'BLOCKED'].includes(tf.master_sizing.verdict), 'valid verdict');
  }

  const lines = [
    'PASS task_force_wtm_export.test.mjs',
    `validation_status=${tf.validation_status}`,
    `wtm_fields=${parsed.imported.length}`,
    `verdict=${tf.master_sizing?.verdict || '—'}`,
    `whinfellScore=${parsed.fields.whinfellScore}`,
    `sourceChannel=${parsed.fields.sourceChannel}`,
  ];
  fs.mkdirSync(SCRATCH, { recursive: true });
  fs.writeFileSync(path.join(SCRATCH, 'task_force_wtm_export.log'), lines.join('\n') + '\n');
  console.log(lines.join('\n'));
}

try {
  run();
} catch (err) {
  console.error(`FAIL task_force_wtm_export.test.mjs: ${err.message}`);
  process.exit(1);
}