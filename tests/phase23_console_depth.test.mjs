#!/usr/bin/env node
/** Chunk 12 — depth band DOM order + stowed command bar. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function indexPos(id, html) {
  const key = `id="${id}"`;
  const pos = html.indexOf(key);
  assert(pos > 0, `${id} present in index.html`);
  return pos;
}

function run() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  const scan = indexPos('scanKpiStrip', html);
  const shell = indexPos('wtmIaShell', html);
  const radar = indexPos('transmissionRadar', html);
  const cockpit = indexPos('nodeCockpitZone', html);
  const basis = indexPos('basisWatchPanel', html);
  const depth = indexPos('consoleDepthDisclosure', html);
  const cmd = indexPos('commandBar', html);

  assert(scan < shell, 'scan before IA shell');
  assert(shell < depth, 'IA shell before depth disclosure');
  assert(html.includes('id="iaScanHost"') && html.indexOf('id="iaScanHost"') < radar, 'radar inside scan host');
  assert(html.includes('id="iaDigHost"') && html.indexOf('id="iaDigHost"') < basis, 'basis watch inside dig host');
  assert(radar < cockpit, 'radar before cockpit in document');
  assert(cockpit < basis, 'cockpit before basis in shell');
  assert(depth < cmd, 'disclosure wraps command bar');

  assert(html.includes('id="consoleDepthDisclosure"'), 'depth disclosure id');
  assert(html.includes('class="console-depth-disclosure"'), 'depth disclosure class');
  assert(html.includes('class="console-depth-summary"'), 'depth summary class');
  assert(!/<details[^>]*id="consoleDepthDisclosure"[^>]*\bopen\b/i.test(html), 'depth collapsed by default');

  for (const id of ['cmdWhinfellScore', 'cmdGlobalCluster', 'cmdChinaCluster', 'gateText', 'suggestionTray']) {
    assert(html.includes(`id="${id}"`), `${id} preserved`);
  }

  console.log('PASS phase23_console_depth.test.mjs');
}

try {
  run();
} catch (err) {
  console.error(`FAIL phase23_console_depth.test.mjs: ${err.message}`);
  process.exit(1);
}