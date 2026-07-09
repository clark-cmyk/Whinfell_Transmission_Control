#!/usr/bin/env node
/** Phase 2.3 — safeBoot, meta polling off, hydration bundle prep. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCoreJs, loadBundle } from './dom_shim.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function run() {
  const raw = loadBundle('docs/data/hydration/latest.json');
  assert(raw.wtm_export_v22, 'fixture has wtm_export_v22');
  assert(raw.task_force, 'fixture has task_force block');

  const w = loadCoreJs();
  const exp = w.__testExports || {};
  assert(w.DD_META_POLLING_ENABLED === false, 'meta polling disabled');
  assert(w.SAFE_BOOT === false, 'default safeBoot off');

  const prepped = exp.prepareHydrationBundle(raw);
  assert(!prepped.wtm_export_v22, 'wtm_export_v22 stripped');
  assert(!prepped.task_force, 'task_force stripped after wtm lift');
  assert(prepped.task_force_panels, 'task_force_panels preserved for desk panels');
  assert(prepped.task_force_panels.specialists?.btc_eth_basis?.signal, 'btc_eth_basis feed');
  assert(prepped.task_force_panels.specialists?.compute_gpu?.signal, 'compute_gpu feed');
  assert(prepped.wtm_export_v21?.includes('Source Channel: task_force'), 'task_force wtm promoted');

  const rawBytes = fs.statSync(path.join(ROOT, 'docs/data/hydration/latest.json')).size;
  const preppedBytes = Buffer.byteLength(JSON.stringify(prepped), 'utf8');
  assert(rawBytes > 100000, `fixture ~108KB (${rawBytes})`);
  assert(preppedBytes < rawBytes, `prepped smaller than raw (${preppedBytes} < ${rawBytes})`);

  const ok = w.hydrateFromBundle(raw, { force: true });
  assert(ok !== false, 'hydrateFromBundle with full bundle');
  const expectedScore = String(raw.task_force?.master_sizing?.full_whinfell_score ?? '');
  assert(expectedScore, 'task_force master_sizing.full_whinfell_score present');
  assert(
    w.document.getElementById('whinfellScore').value === expectedScore,
    `task_force WTM score applied (${expectedScore})`,
  );
  assert(raw.task_force.snapshot_id === raw.snapshot_id, 'task_force snapshot matches bundle');

  console.log([
    'PASS phase23_console.test.mjs',
    `raw_bytes=${rawBytes}`,
    `prepped_bytes=${preppedBytes}`,
    `saved_bytes=${rawBytes - preppedBytes}`,
    `safe_boot=${w.SAFE_BOOT}`,
    `meta_polling=${w.DD_META_POLLING_ENABLED}`,
    `whinfellScore=${w.document.getElementById('whinfellScore').value}`,
    `snapshot_id=${raw.snapshot_id}`,
  ].join('\n'));
}

try {
  run();
} catch (err) {
  console.error(`FAIL phase23_console.test.mjs: ${err.message}`);
  process.exit(1);
}