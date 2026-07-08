#!/usr/bin/env node
/** Chunk 09 — signal detail drawer copy (desk tone, config-driven). */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function loadModule() {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  const src = fs.readFileSync(path.join(ROOT, 'js/signal_detail_copy.js'), 'utf8');
  vm.runInContext(src, sandbox);
  return sandbox.window.WTM_SignalDetailCopy;
}

function baseCtx(overrides = {}) {
  return {
    score: 58,
    scoreStr: '58',
    health: 63,
    healthLabel: 'Mixed',
    healthOpen: 70,
    healthGap: 7,
    scoreToAmber: 0,
    scoreToGreen: 7,
    weakest: 'Credit',
    wNet: '-1',
    ladderNets: 'Liq +1 · Cred -1 · Brd +0',
    sq3Line: 'China SQ3 54 (mid-band)',
    channels: 'rates and equities',
    spread: '12',
    refs: '8/12/18',
    gateCode: 'reduced',
    gateTitle: 'Tight Risk',
    zoneText: 'Amber',
    shockActive: false,
    shockLabel: '',
    shockProb: 35,
    shockHorizon: '5D',
    freshStatus: 'fresh',
    asOf: 'Jul 5, 10:30',
    snapId: 'snap-001',
    freshHours: 4,
    staleHours: 24,
    ...overrides,
  };
}

function main() {
  const mod = loadModule();
  assert(mod, 'WTM_SignalDetailCopy export missing');
  assert(mod.SIGNAL_DETAIL_DISPLAY.bulletLabels.join('/') === 'State/Drivers/Trigger', 'bullet labels');

  const bullets = mod.buildExecutiveBullets(baseCtx());
  for (const section of ['whinfellScore', 'transmission', 'gateState', 'shock', 'freshness']) {
    assert(Array.isArray(bullets[section]) && bullets[section].length === 3, `${section} triple`);
    for (const line of bullets[section]) {
      assert(!/historically/i.test(line), `${section} must not use "historically": ${line}`);
      assert(!/win-rate|sessions like this|past /i.test(line), `${section} report prose: ${line}`);
      assert(line.length < 160, `${section} line too long: ${line}`);
    }
  }

  assert(bullets.whinfellScore[0].includes('Amber band'), 'amber score state');
  assert(bullets.gateState[0].includes('Reduced'), 'reduced gate state');
  assert(bullets.shock[0].includes('No shock override'), 'no shock state');

  const blocked = mod.buildExecutiveBullets(baseCtx({ score: 42, scoreStr: '42', gateCode: 'blocked', scoreToAmber: 8 }));
  assert(blocked.gateState[0].includes('blocked'), 'blocked gate copy');
  assert(blocked.whinfellScore[0].includes('Red band'), 'red score copy');

  const activeShock = mod.buildExecutiveBullets(baseCtx({ shockActive: true, shockLabel: 'Vol Spike' }));
  assert(activeShock.shock[0].includes('Vol Spike'), 'active shock copy');

  const stale = mod.buildExecutiveBullets(baseCtx({ freshStatus: 'stale' }));
  assert(stale.freshness[0].includes('Stale'), 'stale freshness copy');

  console.log('PASS signal_detail_copy.test.mjs');
}

try {
  main();
} catch (err) {
  console.error(`FAIL signal_detail_copy.test.mjs: ${err.message}`);
  process.exit(1);
}