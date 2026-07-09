#!/usr/bin/env node
/** Chunk 15 — WTM_Articulate prompt, log, adapters */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'js/articulate.js'), 'utf8');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function loadArticulate(opts = {}) {
  const store = new Map();
  const sandbox = {
    console,
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => { store.set(k, String(v)); },
      removeItem: (k) => { store.delete(k); },
    },
    navigator: {
      clipboard: {
        writeText: async (t) => {
          sandbox._clip = t;
          if (opts.clipboardFail) throw new Error('denied');
        },
      },
    },
    showToast: (m) => { sandbox._toast = m; },
    WTM_Ark: opts.ark || {
      getStamp: () => ({
        as_of: '2026-07-09T12:00:00Z',
        snapshot_id: 'snap-art-1',
        freshness_status: 'fresh',
      }),
    },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.runInContext(SRC, vm.createContext(sandbox), { filename: 'articulate.js' });
  return { A: sandbox.WTM_Articulate, sandbox, store };
}

async function run() {
  const { A, sandbox } = loadArticulate();
  assert(A, 'WTM_Articulate exported');
  assert(A.BUILD.includes('ARTICULATE'), 'BUILD');
  assert(typeof A.buildPrompt === 'function', 'buildPrompt');
  assert(typeof A.copyPrompt === 'function', 'copyPrompt');
  assert(typeof A.logSession === 'function', 'logSession');
  assert(typeof A.listSessions === 'function', 'listSessions');
  assert(typeof A.contextFromBasisWatch === 'function', 'contextFromBasisWatch');
  assert(typeof A.contextFromBbdm === 'function', 'contextFromBbdm');

  // --- prompt template structure ---
  const prompt = A.buildPrompt({
    subject: 'BasisWatch · Bitcoin',
    snapshot: 'snap-1 · 2026-07-09',
    dataBlock: 'Front: BTM26 · basis%=2.00',
  });
  assert(prompt.includes('**WTC Analysis — BasisWatch · Bitcoin**'), 'title');
  assert(prompt.includes('**Snapshot:** snap-1 · 2026-07-09'), 'snapshot line');
  assert(prompt.includes('**Current Data:**'), 'current data header');
  assert(prompt.includes('Front: BTM26 · basis%=2.00'), 'data body');
  assert(prompt.includes('**Instructions:**'), 'instructions header');
  assert(prompt.includes('experienced floor trader'), 'trader persona');
  assert(prompt.includes('hammer the original thesis'), 'hammer');
  assert(prompt.includes('2–3 crisp new lines of inquiry'), 'inquiry');

  // empty data fallback
  const empty = A.buildPrompt({ subject: 'X' });
  assert(empty.includes('no quantitative snapshot'), 'empty data');

  // --- clipboard ---
  const copied = await A.copyPrompt(prompt);
  assert(copied === true, 'copy ok');
  assert(sandbox._clip === prompt, 'clipboard content');

  // --- log cap + order ---
  A.clearSessions();
  for (let i = 0; i < 55; i += 1) {
    A.logSession({
      panelId: 'basis_watch',
      moduleName: 'BasisWatch',
      snapshot: `s${i}`,
      prompt: `prompt body ${i}`,
    });
  }
  const sessions = A.listSessions();
  assert(sessions.length === A.MAX_LOG_ENTRIES, `cap ${sessions.length}`);
  assert(sessions[0].snapshot === 's54', 'newest first');
  assert(sessions[0].prompt.includes('prompt body 54'), 'full prompt stored');
  assert(sessions[0].promptPreview, 'preview present');

  // --- BasisWatch adapter ---
  const bwCtx = A.contextFromBasisWatch({
    basisWatch: { asset: 'BTC', view: 'basis' },
    _basisWatchModel: {
      asset: { label: 'Bitcoin' },
      assetKey: 'BTC',
      view: 'basis',
      mode: 'live',
      shape: 'contango',
      contracts: [
        {
          symbol: 'BTM26',
          futuresPrice: 102000,
          spotPrice: 100000,
          spotBasisPct: 2,
          spotAnnualizedCarry: 12.5,
          dte: 60,
        },
      ],
      front: {
        symbol: 'BTM26',
        futuresPrice: 102000,
        spotPrice: 100000,
        spotBasisPct: 2,
        spotAnnualizedCarry: 12.5,
        dte: 60,
      },
      hydrationAsOf: '2026-07-09T12:00:00Z',
    },
  });
  assert(bwCtx.panelId === 'basis_watch', 'bw panelId');
  assert(bwCtx.dataBlock.includes('BTM26'), 'bw data');
  assert(bwCtx.dataBlock.includes('contango'), 'bw shape');
  assert(bwCtx.snapshot.includes('snap-art-1') || bwCtx.snapshot.includes('2026-07-09'), 'bw snap');

  // --- BBDM adapter ---
  const bbdmCtx = A.contextFromBbdm({
    as_of: '2026-07-09',
    window_days: 60,
    summary: { top_z: 3.2, verdict_counts: { BANG: 1, WATCH: 2, PASS: 5, BLOCKED: 0 } },
    trades: [
      { id: 't1', verdict: 'BANG', z_score: 3.2, z_abs: 3.2, trade_type: 'crypto_calendar' },
      { id: 't2', verdict: 'WATCH', z_score: -2.1, z_abs: 2.1, trade_type: 'rates' },
    ],
  });
  assert(bbdmCtx.panelId === 'bbdm', 'bbdm panelId');
  assert(bbdmCtx.dataBlock.includes('BANG=1'), 'bbdm counts');
  assert(bbdmCtx.dataBlock.includes('t1'), 'bbdm trade');

  // --- runArticulate integration ---
  sandbox._clip = null;
  sandbox._toast = null;
  const out = await A.runBasisWatch({
    basisWatch: { asset: 'ETH' },
    _basisWatchModel: {
      asset: { label: 'Ethereum' },
      view: 'implied',
      mode: 'live',
      contracts: [],
      front: null,
    },
  });
  assert(out.ok && out.copied, 'runBasisWatch');
  assert(out.prompt.includes('WTC Analysis'), 'run prompt');
  assert(String(sandbox._toast || '').toLowerCase().includes('copied'), 'toast');
  assert(A.listSessions()[0].panelId === 'basis_watch', 'logged');

  const out2 = await A.runBbdm({
    as_of: '2026-07-08',
    summary: { verdict_counts: {} },
    trades: [],
  });
  assert(out2.ok && out2.prompt.includes('Bang Bang Da'), 'runBbdm');

  console.log('PASS articulate.test.mjs — prompt, log, adapters, runBasisWatch/runBbdm');
}

run().catch((err) => {
  console.error('FAIL articulate.test.mjs', err);
  process.exit(1);
});
