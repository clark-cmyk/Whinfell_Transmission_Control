#!/usr/bin/env node
/** Chunk 08 — commentary collapsed by default in command bar + mission read */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCoreJs } from './dom_shim.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function run() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert(html.includes('class="cmd-meta-disclosure"'), 'command bar meta disclosures present');
  assert(html.includes('id="basisTacticalLead"'), 'mission read short lead mount');
  assert(html.includes('class="mission-read-disclosure"'), 'mission read disclosure present');
  assert(html.includes('class="ladder-cluster-disclosure"'), 'ladder cluster disclosure present');

  assert(
    /<details[^>]*class="cmd-meta-disclosure"[^>]*>[\s\S]*id="gateHelperText"/.test(html),
    'gate helper inside disclosure in markup',
  );

  const w = loadCoreJs();
  assert(w.document.getElementById('cmdLadderDisclosure'), 'ladder disclosure mount');
  assert(w.document.getElementById('basisTacticalLead'), 'mission lead mount');

  console.log('PASS commentary_collapse.test.mjs');
}

try {
  run();
} catch (err) {
  console.error(`FAIL commentary_collapse.test.mjs: ${err.message}`);
  process.exit(1);
}