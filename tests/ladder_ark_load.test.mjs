#!/usr/bin/env node
/**
 * Phase 2.4 Chunk 31 — Transmission Ladder loads hydration only via WTM_Ark.
 * Source chip: ark-hydration | local | fixture. No raw hydration fetch.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function countMatches(src, re) {
  const m = src.match(re);
  return m ? m.length : 0;
}

function testLadderHtmlWiring() {
  const html = fs.readFileSync(
    path.join(ROOT, 'whinfell-transmission-ladder-deep-dive.html'),
    'utf8',
  );

  const arkIdx = html.indexOf('src="js/ark.js"');
  const timeFmtIdx = html.indexOf('src="js/time_format.js"');
  const deskChartIdx = html.indexOf('src="js/desk_chart_links.js"');
  const inlineScriptMarker = html.indexOf("const STORAGE_KEYS = [");

  assert(arkIdx >= 0, 'ladder HTML must include js/ark.js');
  assert(timeFmtIdx >= 0, 'ladder HTML should include js/time_format.js');
  assert(timeFmtIdx < arkIdx || arkIdx > 0, 'time_format / ark present');
  assert(arkIdx < deskChartIdx || deskChartIdx < 0, 'ark.js should load with/before desk scripts when present');
  assert(arkIdx < inlineScriptMarker, 'js/ark.js must load BEFORE the inline ladder script');

  // Load path uses loadHydration + result.ok / result.data (never result.bundle)
  assert(html.includes('loadHydrationViaArk'), 'loadHydrationViaArk helper present');
  assert(html.includes('loadHydration'), 'must call ark.loadHydration');
  assert(html.includes('result.ok') && html.includes('result.data'),
    'must use result.ok && result.data (not result.bundle)');
  // Disallow code that reads result.bundle (comments may mention it as forbidden)
  assert(!/\bresult\.bundle\b(?![^;]*use result\.ok)/.test(html.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')),
    'must never use result.bundle in code');

  // No standalone fetch of hydration JSON / no HYDRATION_PATHS loop
  assert(!/const\s+HYDRATION_PATHS\s*=/.test(html), 'HYDRATION_PATHS constant must be removed');
  assert(!html.includes('data/hydration/latest.json'),
    'must not reference hydration/latest.json paths for direct fetch');
  assert(!/fetch\s*\(\s*HYDRATION_PATHS/.test(html), 'no HYDRATION_PATHS fetch loop');
  assert(!/fetch\s*\(\s*['"][^'"]*hydration\/latest\.json/.test(html),
    'no standalone fetch of hydration/latest.json');

  // Source chip + preferLocal + fallbacks
  assert(html.includes("source: 'ark-hydration'") || html.includes('source: "ark-hydration"'),
    'payload source ark-hydration');
  assert(html.includes("source: 'local'") || html.includes('source: "local"'),
    'payload source local');
  assert(html.includes("source: 'fixture'") || html.includes('source: "fixture"'),
    'payload source fixture');
  assert(html.includes('preferLocal'), 'supports ?preferLocal=1');
  assert(html.includes('Source ·') || html.includes('source-tile'),
    'visible Source chip in decision band');
  assert(html.includes('readSavedState'), 'localStorage fallback via readSavedState');
  assert(html.includes('FIXTURE'), 'FIXTURE fallback present');
}

function testPhaseGateBbdmAndArk() {
  const bbdm = fs.readFileSync(path.join(ROOT, 'bang_bang_da_machine.html'), 'utf8');
  assert(bbdm.includes('id="btnBbdmArticulate"'), 'BBDM still has #btnBbdmArticulate');
  assert(bbdm.includes('js/articulate.js') || bbdm.includes("src=\"js/articulate.js\""),
    'BBDM still loads articulate.js');

  const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const arkRefreshCount = countMatches(index, /id="btnArkRefreshAll"/g);
  assert(arkRefreshCount === 1, `index must have single #btnArkRefreshAll (found ${arkRefreshCount})`);
}

function main() {
  testLadderHtmlWiring();
  testPhaseGateBbdmAndArk();
  console.log('PASS tests/ladder_ark_load.test.mjs');
}

main();
