#!/usr/bin/env node
/**
 * Unit tests for RV/Basis spot-fallback presentation (Chunk 1).
 * Calls shipped resolveRvHorizonValueFallback + buildRvHorizonEvidenceMarkup.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCoreJs, loadBundle } from './dom_shim.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRATCH = process.env.SCRATCH || '/var/folders/qn/gdsdhg9j3f77wk7fn889zbq40000gn/T/grok-goal-0353ff2e1563/implementer';

const SPOT_VALUE = 339.2;
const SPOT_FORMATTED = '339.2 bps';

function creditFixture() {
  const bundle = loadBundle();
  const cockpit = bundle.node_cockpits?.credit;
  if (!cockpit) throw new Error('credit cockpit missing from latest.json');
  const series = cockpit.rv_basis.series.hy_oas_proxy;
  return { cockpit, series };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function countFormattedSpot(html) {
  const re = new RegExp(SPOT_FORMATTED.replace('.', '\\.'), 'g');
  return (html.match(re) || []).length;
}

function run() {
  const w = loadCoreJs();
  const { resolveRvHorizonValueFallback, buildRvHorizonEvidenceMarkup } = w.__testExports;
  assert(resolveRvHorizonValueFallback, 'resolveRvHorizonValueFallback not exported');
  assert(buildRvHorizonEvidenceMarkup, 'buildRvHorizonEvidenceMarkup not exported');

  const { cockpit, series } = creditFixture();
  assert(cockpit.composite_score_source === 'horizon_net_fallback', 'fixture composite_score_source');
  const horizons = ['1m', '3m', '6m', '12m', '3y'];
  for (const h of horizons) {
    assert(series.horizons[h].current_value === SPOT_VALUE, `identical ${h} value`);
  }

  const fallback = resolveRvHorizonValueFallback(cockpit, series);
  assert(fallback.mode === 'spot', `fallback.mode expected spot, got ${fallback.mode}`);
  assert(fallback.isNetFallback === true, 'isNetFallback should be true');

  const markup = buildRvHorizonEvidenceMarkup(cockpit, series);
  assert(markup.tableClass.includes('focus-horizon-table--spot-fallback'), 'spot-fallback table class');
  assert(countFormattedSpot(markup.rows) === 1, `expected 1 formatted spot value, got ${countFormattedSpot(markup.rows)}`);
  assert((markup.rows.match(/rv-horizon-na/g) || []).length >= 4, 'non-primary rows show N/A/dash');
  assert(/Single spot reading/i.test(markup.note), 'note mentions single spot');
  assert(/horizon-net fallback/i.test(markup.note), 'note mentions horizon-net fallback');

  const probe = w.__rvHorizonEvidenceProbe(loadBundle(), 'credit');
  assert(probe.fallbackMode === 'spot', 'probe fallbackMode');
  assert(probe.spotFallbackTable === true, 'probe spotFallbackTable');
  assert(probe.spotValueRepeatCount <= 1, `probe spotValueRepeatCount ${probe.spotValueRepeatCount}`);
  assert(probe.hasSpotNote === true, 'probe hasSpotNote');

  const lines = [
    'PASS rv_horizon_fallback.test.mjs',
    `fallback.mode=${fallback.mode}`,
    `spotValueRepeatCount=${countFormattedSpot(markup.rows)}`,
    `probe.spotValueRepeatCount=${probe.spotValueRepeatCount}`,
    `tableClass=${markup.tableClass}`,
  ];
  const log = lines.join('\n') + '\n';
  fs.mkdirSync(SCRATCH, { recursive: true });
  fs.writeFileSync(path.join(SCRATCH, 'rv_horizon_tests.log'), log);
  console.log(log);
}

try {
  run();
  process.exit(0);
} catch (err) {
  const msg = `FAIL rv_horizon_fallback.test.mjs: ${err.message}\n`;
  fs.mkdirSync(SCRATCH, { recursive: true });
  fs.writeFileSync(path.join(SCRATCH, 'rv_horizon_tests.log'), msg);
  console.error(msg);
  process.exit(1);
}