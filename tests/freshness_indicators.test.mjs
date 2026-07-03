#!/usr/bin/env node
/** Validate latest.json freshness/fallback indicators (Chunk 3). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBundle } from './dom_shim.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCRATCH = process.env.SCRATCH || '/var/folders/qn/gdsdhg9j3f77wk7fn889zbq40000gn/T/grok-goal-0353ff2e1563/implementer';
const NODES = ['basis', 'credit', 'liquidity', 'breadth', 'highbeta'];

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function run() {
  const bundle = loadBundle('docs/data/hydration/latest.json');
  assert(bundle.as_of, 'top-level as_of');
  assert(bundle.freshness_status, 'top-level freshness_status');

  for (const nodeId of NODES) {
    const cockpit = bundle.node_cockpits?.[nodeId];
    assert(cockpit, `${nodeId} cockpit present`);
    assert(cockpit.composite_score_source, `${nodeId} composite_score_source`);
    assert(cockpit.freshness_status, `${nodeId} freshness_status`);
  }

  const lines = [
    'PASS freshness_indicators.test.mjs',
    `as_of=${bundle.as_of}`,
    `freshness_status=${bundle.freshness_status}`,
    ...NODES.map(n => `${n}: ${bundle.node_cockpits[n].composite_score_source} / ${bundle.node_cockpits[n].freshness_status}`),
  ];
  fs.mkdirSync(SCRATCH, { recursive: true });
  fs.writeFileSync(path.join(SCRATCH, 'freshness_indicators.log'), lines.join('\n') + '\n');
  console.log(lines.join('\n'));
}

try {
  run();
} catch (err) {
  console.error(`FAIL freshness_indicators.test.mjs: ${err.message}`);
  process.exit(1);
}