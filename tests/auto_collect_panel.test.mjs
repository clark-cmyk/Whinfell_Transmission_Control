#!/usr/bin/env node
/** Auto-collect panel — module exports + button wiring */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function loadAutoCollect(fetchImpl) {
  const src = fs.readFileSync(path.join(ROOT, 'js/auto_collect_panel.js'), 'utf8');
  const btnMorning = { id: 'btnMorningCollect', _autoCollectBound: false, disabled: false, classList: { _s: new Set(), toggle() {} }, setAttribute() {}, addEventListener() {} };
  const btnRefresh = { id: 'btnDeskRefresh', _deskOpsBound: false, disabled: false, dataset: {}, textContent: 'Refresh data', classList: { _s: new Set(), toggle() {} }, setAttribute() {}, addEventListener() {} };
  const btnAgent = { id: 'btnCollectAgentStatus', _autoCollectBound: false, disabled: false, textContent: 'Agent ○', title: '', classList: { _s: new Set(), toggle() {} }, setAttribute() {}, addEventListener() {} };
  const bodyChildren = [];
  const toasts = [];
  const sandbox = {
    window: {},
    appState: { hydration: {}, basisWatch: {} },
    showToast(msg) { toasts.push(msg); },
    WTM_reloadDeployHydration: async () => true,
    WTM_DeskOps: {
      refreshAllDeskData: async () => ({ ok: true, results: { hydration: true, curve: true, wmc: false } }),
      wireAll() {},
    },
    document: {
      readyState: 'complete',
      body: {
        appendChild(el) { bodyChildren.push(el); return el; },
      },
      getElementById(id) {
        if (id === 'btnMorningCollect') return btnMorning;
        if (id === 'btnDeskRefresh') return btnRefresh;
        if (id === 'btnCollectAgentStatus') return btnAgent;
        if (id === 'collectAgentOffline') return bodyChildren.find((n) => n.id === 'collectAgentOffline') || null;
        return null;
      },
      createElement(tag) {
        const listeners = new Map();
        const el = {
          id: '',
          className: '',
          dataset: {},
          innerHTML: '',
          setAttribute() {},
          querySelector(sel) {
            if (sel === '[data-collect-agent-msg]') return { textContent: '' };
            if (sel === '.collect-agent-offline-cmd') return { textContent: '' };
            if (sel === '.collect-agent-offline-copy') return { addEventListener: (ev, fn) => listeners.set(ev, fn) };
            if (sel === '.collect-agent-offline-dismiss') return { addEventListener: (ev, fn) => listeners.set(ev, fn) };
            return null;
          },
          addEventListener(ev, fn) { listeners.set(ev, fn); },
          classList: { _s: new Set(), add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); } },
        };
        el.tagName = tag.toUpperCase();
        return el;
      },
      addEventListener() {},
    },
    console,
    fetch: fetchImpl || (async () => { throw new Error('offline'); }),
    navigator: { clipboard: { writeText: async () => true } },
    setTimeout,
    clearTimeout,
    AbortController: globalThis.AbortController,
  };
  sandbox.window = sandbox;
  const deskOpsSrc = fs.readFileSync(path.join(ROOT, 'js/desk_data_ops.js'), 'utf8');
  vm.runInContext(deskOpsSrc, vm.createContext(sandbox), { filename: 'desk_data_ops.js' });
  vm.runInContext(src, vm.createContext(sandbox), { filename: 'auto_collect_panel.js' });
  return { sandbox, btnMorning, btnRefresh, btnAgent, bodyChildren, toasts };
}

async function run() {
  const { sandbox, btnMorning, btnRefresh, btnAgent } = loadAutoCollect();
  const ac = sandbox.WTM_AutoCollect;
  assert(ac, 'WTM_AutoCollect exported');
  assert(ac.COLLECT_BUILD.includes('AUTO-COLLECT'), 'build stamp');
  assert(typeof ac.pollJob === 'function', 'pollJob exported');
  assert(typeof ac.reloadDeskDataAfterCollect === 'function', 'reloadDeskDataAfterCollect exported');
  assert(ac.EXPORT_IDS.barchart === 'barchart_futures_intraday', 'barchart id');
  assert(ac.EXPORT_IDS.koyfin === 'koyfin_rates', 'koyfin id');
  assert(ac.FALLBACK_CMD.includes('morning_auto_collect'), 'fallback cmd');
  assert(ac.AGENT_START_CMD.includes('whinfell_collect_agent.py'), 'agent start cmd');

  ac.wireAll();
  assert(btnMorning._autoCollectBound, 'btnMorningCollect wired');
  assert(btnRefresh._deskOpsBound, 'btnDeskRefresh wired');
  assert(btnAgent._autoCollectBound, 'btnCollectAgentStatus wired');

  const offline = ac.showAgentOfflinePrompt('Collect CSVs');
  assert(offline.mode === 'offline-prompt', 'offline prompt mode');
  const banner = sandbox.document.getElementById('collectAgentOffline');
  assert(banner, 'offline banner created');
  assert(banner.classList._s.has('collect-agent-offline--show'), 'banner visible');
  assert(banner.dataset.cmd === ac.AGENT_START_CMD, 'banner stores start cmd');

  const jsonRes = (obj, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(obj),
  });

  // pollJob resolves on done
  let jobPolls = 0;
  const { sandbox: sb2 } = loadAutoCollect(async (url) => {
    const path = String(url);
    if (path.includes('/v1/job/job-test-1')) {
      jobPolls += 1;
      return jsonRes({ status: 'done', exit_code: 0 });
    }
    throw new Error(`unexpected fetch ${path}`);
  });
  const poll = await sb2.WTM_AutoCollect.pollJob('job-test-1', { intervalMs: 1, timeoutMs: 200 });
  assert(poll.ok && poll.status === 'done', 'pollJob done');

  // Morning collect: health → start → poll → desk reload toast
  const { sandbox: sb3, toasts } = loadAutoCollect(async (url, opts = {}) => {
    const path = String(url);
    if (path.includes('/health')) return jsonRes({ ok: true });
    if (path.includes('/v1/collect/morning') && opts.method === 'POST') {
      return jsonRes({ ok: true, job_id: 'job-test-1' }, 202);
    }
    if (path.includes('/v1/job/job-test-1')) return jsonRes({ status: 'done', exit_code: 0 });
    throw new Error(`unexpected fetch ${path}`);
  });
  const morning = await sb3.WTM_AutoCollect.triggerMorningCollect();
  assert(morning.ok, 'morning collect completes after job done');
  assert(morning.job_id === 'job-test-1', 'job id preserved');
  assert(toasts.some((t) => t.includes('Collect complete')), `completion toast: ${toasts.join('|')}`);

  // WMC page: refreshAfterCollect hook + Midwest toast
  let wmcRefreshCalls = 0;
  const { sandbox: sb4, toasts: wmcToasts } = loadAutoCollect(async (url, opts = {}) => {
    const path = String(url);
    if (path.includes('/health')) return jsonRes({ ok: true });
    if (path.includes('/v1/collect/morning') && opts.method === 'POST') {
      return jsonRes({ ok: true, job_id: 'job-wmc-1' }, 202);
    }
    if (path.includes('/v1/job/job-wmc-1')) return jsonRes({ status: 'done', exit_code: 0 });
    throw new Error(`unexpected fetch ${path}`);
  });
  sb4.WMC = {
    refreshAfterCollect: async () => {
      wmcRefreshCalls += 1;
      return { hydrated: true, refreshed: true };
    },
  };
  const wmcMorning = await sb4.WTM_AutoCollect.triggerMorningCollect();
  assert(wmcMorning.ok, 'WMC morning collect completes');
  assert(wmcRefreshCalls === 1, 'WMC.refreshAfterCollect called once');
  assert(
    wmcToasts.some((t) => t.includes('Midwest Compute data refreshed')),
    `WMC completion toast: ${wmcToasts.join('|')}`,
  );

  console.log([
    'PASS auto_collect_panel.test.mjs',
    `build=${ac.COLLECT_BUILD}`,
    `agent=${ac.AGENT_BASE}`,
    `barchart=${ac.EXPORT_IDS.barchart}`,
    `jobPolls=${jobPolls}`,
    `toasts=${toasts.length}`,
  ].join('\n'));
}

run().catch((err) => {
  console.error(`FAIL auto_collect_panel.test.mjs: ${err.message}`);
  process.exit(1);
});