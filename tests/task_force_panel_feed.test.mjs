#!/usr/bin/env node
/** Task Force panel feed — extract + WMC merge regression */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { loadCoreJs, loadBundle } from './dom_shim.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function loadFeedOnly() {
  const sandbox = { window: {}, console };
  sandbox.window = sandbox;
  const ctx = vm.createContext(sandbox);
  const src = fs.readFileSync(path.join(ROOT, 'js/task_force_panel_feed.js'), 'utf8');
  vm.runInContext(src, ctx, { filename: 'task_force_panel_feed.js' });
  return sandbox;
}

function run() {
  const bundle = loadBundle('docs/data/hydration/latest.json');
  const w = loadCoreJs();
  const feed = w.WTM_TaskForceFeed;
  assert(feed, 'WTM_TaskForceFeed on window');

  const panels = feed.extractTaskForcePanels(bundle.task_force);
  assert(panels, 'panels extracted from task_force');
  assert(panels.specialists.btc_eth_basis?.signal, 'basis signal');
  assert(panels.specialists.compute_gpu?.signal, 'compute_gpu signal');
  assert(panels.specialists.btc_eth_vol_arb?.signal, 'vol_arb signal');

  const prepped = w.__testExports.prepareHydrationBundle(bundle);
  assert(prepped.task_force_panels?.specialists?.btc_eth_basis, 'prepareHydrationBundle lifts panels');

  const mockWmc = {
    meta: { version: '1.1.0', as_of: '2026-01-01', thesis: 'mock' },
    kpis: [
      { label: 'GPU Basis (H200)', value: '0', unit: '$/hr', delta: '', dir: 'flat', hero: false },
      { label: 'Transmission Gate', value: '—', unit: '', delta: '', dir: 'flat', hero: false },
      { label: 'Crush P&L Est.', value: '0', unit: '%', delta: '', dir: 'flat', hero: true },
    ],
    trade_variants: {
      core: { name: 'Core', posture: 'watch', signal: 'stub', signal_dir: 'watch', sizing: '', stop: '', target: '', rationale: '' },
    },
  };

  const merged = feed.mergeWmcData(mockWmc, panels);
  assert(merged.meta.thesis === panels.specialists.compute_gpu.signal, 'WMC thesis from compute_gpu');
  assert(merged._task_force_panels === panels, 'panels attached for export');

  const sb = loadFeedOnly();
  const basisOnly = sb.WTM_TaskForceFeed.basisWatchFeed({ task_force_panels: panels });
  assert(basisOnly?.signal, 'basisWatchFeed resolves');

  console.log([
    'PASS task_force_panel_feed.test.mjs',
    `basis_source=${panels.specialists.btc_eth_basis.source || panels.specialists.btc_eth_basis.status}`,
    `compute_signal=${panels.specialists.compute_gpu.signal.slice(0, 48)}…`,
    `validation=${panels.validation_status}`,
  ].join('\n'));
}

try {
  run();
} catch (err) {
  console.error(`FAIL task_force_panel_feed.test.mjs: ${err.message}`);
  process.exit(1);
}