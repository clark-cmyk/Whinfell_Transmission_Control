#!/usr/bin/env node
/**
 * Chunk 2 + 5 — WTM_Ark unit tests (mock fetch only).
 * Hydration, curve history, BBDM report, getSources, subscribe.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ARK_SRC = fs.readFileSync(path.join(ROOT, 'js/ark.js'), 'utf8');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function sourceById(sources, id) {
  return (sources || []).find((s) => s.id === id) || null;
}

/**
 * Load ark.js into an isolated sandbox with controllable fetch + location.
 * @param {{ protocol?: string, fetchImpl?: Function }} opts
 */
function loadArk(opts = {}) {
  const protocol = opts.protocol || 'http:';
  let fetchCount = 0;
  const fetchImpl = opts.fetchImpl || (async () => {
    throw new Error('fetch not stubbed');
  });

  const sandbox = {
    console,
    location: { protocol, href: `${protocol}//localhost/` },
    fetch: async (...args) => {
      fetchCount += 1;
      return fetchImpl(...args);
    },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  vm.runInContext(ARK_SRC, vm.createContext(sandbox), { filename: 'ark.js' });

  return {
    Ark: sandbox.WTM_Ark,
    getFetchCount: () => fetchCount,
    sandbox,
  };
}

function okResponse(body) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  };
}

function httpError(status) {
  return {
    ok: false,
    status,
    json: async () => ({}),
  };
}

/** Route mock by URL path fragment. */
function routeFetch(routes) {
  return async (url) => {
    const u = String(url);
    for (const [fragment, bodyOrFn] of Object.entries(routes)) {
      if (u.includes(fragment)) {
        if (typeof bodyOrFn === 'function') return bodyOrFn(url);
        if (bodyOrFn && bodyOrFn.__httpError) return httpError(bodyOrFn.status);
        return okResponse(bodyOrFn);
      }
    }
    throw new Error(`unexpected fetch ${u}`);
  };
}

async function run() {
  // --- export surface ---
  {
    const { Ark } = loadArk({
      fetchImpl: async () => okResponse({ as_of: 't', snapshot_id: 's', freshness_status: 'fresh' }),
    });
    assert(Ark, 'WTM_Ark exported');
    assert(typeof Ark.BUILD === 'string' && Ark.BUILD.includes('ARK'), 'BUILD stamp');
    assert(typeof Ark.loadHydration === 'function', 'loadHydration');
    assert(typeof Ark.getHydration === 'function', 'getHydration');
    assert(typeof Ark.getStamp === 'function', 'getStamp');
    assert(typeof Ark.loadCurveHistory === 'function', 'loadCurveHistory');
    assert(typeof Ark.getCurveHistory === 'function', 'getCurveHistory');
    assert(typeof Ark.loadBbdmReport === 'function', 'loadBbdmReport');
    assert(typeof Ark.getBbdmReport === 'function', 'getBbdmReport');
    assert(typeof Ark.loadCoinglass === 'function', 'loadCoinglass');
    assert(typeof Ark.getCoinglass === 'function', 'getCoinglass');
    assert(typeof Ark.getSources === 'function', 'getSources');
    assert(typeof Ark.subscribe === 'function', 'subscribe');
  }

  // --- successful hydration load ---
  {
    const bundle = {
      as_of: '2026-07-09T12:00:00Z',
      snapshot_id: 'global-2026-07-09-test-01',
      freshness_status: 'fresh',
      node_cockpits: { basis: {} },
    };
    const { Ark, getFetchCount } = loadArk({
      fetchImpl: async (url) => {
        assert(String(url).includes('data/hydration/latest.json'), 'hydration URL');
        assert(String(url).includes('_='), 'cache-bust query');
        return okResponse(bundle);
      },
    });

    assert(Ark.getHydration() === null, 'cache empty before load');
    const stamp0 = Ark.getStamp();
    assert(stamp0.sources.length === 4, 'four source rows initially');
    assert(sourceById(stamp0.sources, 'hydration').status === 'unavailable', 'initial hydration unavailable');
    assert(stamp0.as_of === null, 'initial stamp empty');

    const result = await Ark.loadHydration({ force: true });
    assert(result.ok === true, 'load ok');
    assert(result.data === bundle, 'result.data is bundle');
    assert(result.as_of === bundle.as_of, 'as_of');
    assert(result.snapshot_id === bundle.snapshot_id, 'snapshot_id');
    assert(result.freshness_status === 'fresh', 'freshness_status');
    assert(Ark.getHydration() === bundle, 'getHydration returns cache');
    assert(getFetchCount() === 1, 'one fetch on force load');

    const stamp = Ark.getStamp();
    assert(stamp.as_of === bundle.as_of, 'getStamp as_of');
    assert(stamp.snapshot_id === bundle.snapshot_id, 'getStamp snapshot_id');
    assert(stamp.freshness_status === 'fresh', 'getStamp freshness');
    assert(stamp.lastRefreshedAt && typeof stamp.lastRefreshedAt === 'string', 'lastRefreshedAt set');
    assert(stamp.sources.length === 4, 'four source rows after load');
    const hyd = sourceById(stamp.sources, 'hydration');
    assert(hyd && hyd.id === 'hydration', 'hydration source id');
    assert(hyd.status === 'ok', 'hydration source status ok');
    assert(hyd.error === null, 'hydration source error cleared');
  }

  // --- cache hit when force === false ---
  {
    const bundle = {
      as_of: '2026-07-09T13:00:00Z',
      snapshot_id: 'cache-hit-01',
      freshness_status: 'fresh',
    };
    const { Ark, getFetchCount } = loadArk({
      fetchImpl: async () => okResponse(bundle),
    });

    await Ark.loadHydration({ force: true });
    assert(getFetchCount() === 1, 'first load fetched');

    const cached = await Ark.loadHydration({ force: false });
    assert(cached.ok === true, 'cache hit ok');
    assert(cached.snapshot_id === 'cache-hit-01', 'cache returns stamp');
    assert(getFetchCount() === 1, 'no second fetch when force false');
  }

  // --- force true re-fetches ---
  {
    let call = 0;
    const { Ark, getFetchCount } = loadArk({
      fetchImpl: async () => {
        call += 1;
        return okResponse({
          as_of: `t${call}`,
          snapshot_id: `s${call}`,
          freshness_status: 'fresh',
        });
      },
    });

    await Ark.loadHydration({ force: true });
    const second = await Ark.loadHydration({ force: true });
    assert(getFetchCount() === 2, 'force true re-fetches');
    assert(second.snapshot_id === 's2', 'second load updates cache');
    assert(Ark.getHydration().snapshot_id === 's2', 'getHydration updated');
  }

  // --- HTTP error ---
  {
    const { Ark } = loadArk({
      fetchImpl: async () => httpError(404),
    });
    const result = await Ark.loadHydration({ force: true });
    assert(result.ok === false, '404 not ok');
    assert(result.data === null, 'no data on fail');
    assert(String(result.error).includes('404'), 'error mentions 404');
    assert(Ark.getHydration() === null, 'cache stays empty on fail');
    const hyd = sourceById(Ark.getStamp().sources, 'hydration');
    assert(hyd.status === 'error', 'hydration source status error');
    assert(String(hyd.error).includes('404'), 'hydration source error 404');
  }

  // --- invalid JSON body (non-object) ---
  {
    const { Ark } = loadArk({
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        json: async () => null,
      }),
    });
    const result = await Ark.loadHydration({ force: true });
    assert(result.ok === false, 'null body fails');
    assert(result.error === 'invalid JSON body', 'invalid body message');
    assert(sourceById(Ark.getStamp().sources, 'hydration').status === 'error', 'source error on bad body');
  }

  // --- validation_status === missing ---
  {
    const { Ark } = loadArk({
      fetchImpl: async () => okResponse({
        validation_status: 'missing',
        as_of: null,
      }),
    });
    const result = await Ark.loadHydration({ force: true });
    assert(result.ok === false, 'missing validation fails');
    assert(String(result.error).includes('missing'), 'missing error text');
    assert(Ark.getHydration() === null, 'no cache on missing');
    assert(sourceById(Ark.getStamp().sources, 'hydration').status === 'missing', 'source status missing');
  }

  // --- fetch throws ---
  {
    const { Ark } = loadArk({
      fetchImpl: async () => {
        throw new Error('network down');
      },
    });
    const result = await Ark.loadHydration({ force: true });
    assert(result.ok === false, 'throw not ok');
    assert(String(result.error).includes('network down'), 'error message from throw');
    assert(sourceById(Ark.getStamp().sources, 'hydration').status === 'error', 'source error on throw');
  }

  // --- file: protocol ---
  {
    let fetched = false;
    const { Ark, getFetchCount } = loadArk({
      protocol: 'file:',
      fetchImpl: async () => {
        fetched = true;
        return okResponse({ snapshot_id: 'should-not-load' });
      },
    });
    const result = await Ark.loadHydration({ force: true });
    assert(result.ok === false, 'file: fails');
    assert(String(result.error).includes('file:'), 'file: error text');
    assert(getFetchCount() === 0 && fetched === false, 'file: does not fetch');
    assert(sourceById(Ark.getStamp().sources, 'hydration').status === 'unavailable', 'file: source unavailable');
  }

  // --- default options treat force as true (re-fetch) ---
  {
    const { Ark, getFetchCount } = loadArk({
      fetchImpl: async () => okResponse({
        as_of: 'x',
        snapshot_id: 'default-force',
        freshness_status: 'fresh',
      }),
    });
    await Ark.loadHydration();
    await Ark.loadHydration();
    assert(getFetchCount() === 2, 'omitted options defaults force true');
  }

  // --- curve history load + cache ---
  {
    const curve = { records: [{ raw_symbol: 'BTM26', latest: { close: 100 } }] };
    const { Ark, getFetchCount } = loadArk({
      fetchImpl: async (url) => {
        assert(String(url).includes('barchart_curve_history.json'), 'curve URL');
        return okResponse(curve);
      },
    });

    assert(Ark.getCurveHistory() === null, 'curve empty before load');
    const result = await Ark.loadCurveHistory({ force: true });
    assert(result.ok === true, 'curve load ok');
    assert(result.data === curve, 'curve data');
    assert(Ark.getCurveHistory() === curve, 'getCurveHistory cache');
    assert(getFetchCount() === 1, 'curve one fetch');

    const cached = await Ark.loadCurveHistory({ force: false });
    assert(cached.ok && getFetchCount() === 1, 'curve cache hit');

    await Ark.loadCurveHistory({ force: true });
    assert(getFetchCount() === 2, 'curve force re-fetch');

    const curveSrc = sourceById(Ark.getSources(), 'curve');
    assert(curveSrc && curveSrc.status === 'ok', 'curve source ok');
  }

  // --- Chunk 23: invalidateCurveHistory clears cache; force reload re-fetches ---
  {
    let gen = 0;
    const { Ark, getFetchCount } = loadArk({
      fetchImpl: async () => {
        gen += 1;
        return okResponse({
          as_of: `t${gen}`,
          records: [{ raw_symbol: 'BTN26', latest: { close: 63000 + gen, date: '2026-07-09' } }],
        });
      },
    });
    assert(typeof Ark.invalidateCurveHistory === 'function', 'invalidateCurveHistory exported');
    await Ark.loadCurveHistory({ force: true });
    assert(Ark.getCurveHistory()?.records?.[0]?.latest?.close === 63001, 'first load');
    Ark.invalidateCurveHistory();
    assert(Ark.getCurveHistory() === null, 'invalidate clears cache');
    const stamp = Ark.getStamp();
    assert(sourceById(stamp.sources, 'curve')?.status === 'stale', 'source marked stale');
    await Ark.loadCurveHistory({ force: true });
    assert(Ark.getCurveHistory()?.records?.[0]?.latest?.close === 63002, 'reload after invalidate');
    assert(getFetchCount() === 2, 'two network fetches');
    assert(Ark.getStamp().BTN26?.close === 63002, 'stamp exposes BTN26');
  }

  // --- curve error ---
  {
    const { Ark } = loadArk({
      fetchImpl: async () => httpError(500),
    });
    const result = await Ark.loadCurveHistory({ force: true });
    assert(result.ok === false, 'curve 500 fails');
    assert(Ark.getCurveHistory() === null, 'curve cache empty on fail');
    assert(sourceById(Ark.getSources(), 'curve').status === 'error', 'curve source error');
  }

  // --- BBDM report load + cascade ---
  {
    let hits = [];
    const report = { as_of: '2026-07-09', scores: [{ id: 'x' }] };
    const { Ark, getFetchCount } = loadArk({
      fetchImpl: async (url) => {
        const u = String(url);
        hits.push(u);
        if (u.includes('./bang_bang_da/bang_bang_da_report.json')) {
          return okResponse(report);
        }
        if (u.includes('bang_bang_da/bang_bang_da_report.json')) {
          return httpError(404);
        }
        throw new Error(`unexpected ${u}`);
      },
    });

    assert(Ark.getBbdmReport() === null, 'bbdm empty before load');
    const result = await Ark.loadBbdmReport({ force: true });
    assert(result.ok === true, 'bbdm cascade ok');
    assert(result.data === report, 'bbdm data');
    assert(Ark.getBbdmReport() === report, 'getBbdmReport cache');
    assert(getFetchCount() === 2, 'bbdm tried two paths');
    assert(hits.some((h) => h.includes('bang_bang_da_report')), 'bbdm path hit');

    await Ark.loadBbdmReport({ force: false });
    assert(getFetchCount() === 2, 'bbdm cache hit no fetch');

    const bbdmSrc = sourceById(Ark.getSources(), 'bbdm_report');
    assert(bbdmSrc && bbdmSrc.status === 'ok', 'bbdm source ok');
    assert(String(bbdmSrc.url).includes('bang_bang'), 'bbdm source url recorded');
  }

  // --- BBDM both paths fail ---
  {
    const { Ark } = loadArk({
      fetchImpl: async () => httpError(404),
    });
    const result = await Ark.loadBbdmReport({ force: true });
    assert(result.ok === false, 'bbdm both fail');
    assert(Ark.getBbdmReport() === null, 'bbdm no cache');
    assert(sourceById(Ark.getSources(), 'bbdm_report').status === 'error', 'bbdm source error');
  }

  // --- getSources inventory shape ---
  {
    const { Ark } = loadArk({
      fetchImpl: routeFetch({
        'latest.json': { as_of: 'a', snapshot_id: 's', freshness_status: 'fresh' },
        'barchart_curve_history.json': { records: [] },
        'bang_bang_da_report.json': { scores: [] },
        'crypto_market.json': { data_status: 'live', export_id: 'coinglass_perp_market', tables: {} },
      }),
    });

    const initial = Ark.getSources();
    assert(initial.length === 4, 'getSources length 4');
    assert(initial.map((s) => s.id).join(',') === 'hydration,curve,bbdm_report,coinglass_perp', 'source id order');
    assert(initial.every((s) => s.status === 'unavailable'), 'all start unavailable');

    await Ark.loadHydration({ force: true });
    await Ark.loadCurveHistory({ force: true });
    await Ark.loadBbdmReport({ force: true });
    await Ark.loadCoinglass({ force: true });

    const after = Ark.getSources();
    assert(after.every((s) => s.status === 'ok'), 'all ok after loads');
    assert(after.every((s) => s.lastSuccessAt), 'lastSuccessAt set');
    assert(Ark.getStamp().sources.length === 4, 'getStamp uses full inventory');
  }

  // --- subscribe / unsubscribe ---
  {
    const events = [];
    const { Ark } = loadArk({
      fetchImpl: routeFetch({
        'latest.json': { as_of: 'a', snapshot_id: 's', freshness_status: 'fresh' },
        'barchart_curve_history.json': { records: [1] },
        'bang_bang_da_report.json': { scores: [] },
      }),
    });

    const unsub = Ark.subscribe((ev) => {
      events.push(ev);
    });
    assert(typeof unsub === 'function', 'subscribe returns unsubscribe');

    await Ark.loadHydration({ force: true });
    await Ark.loadCurveHistory({ force: true });
    await Ark.loadBbdmReport({ force: true });

    assert(events.length === 3, 'three success events');
    assert(events.map((e) => e.type).join(',') === 'hydration,curve,bbdm_report', 'event types');
    assert(events.every((e) => e.ok === true), 'events ok');

    // failed load does not notify
    const { Ark: ArkFail } = loadArk({
      fetchImpl: async () => httpError(404),
    });
    const failEvents = [];
    ArkFail.subscribe((ev) => failEvents.push(ev));
    await ArkFail.loadHydration({ force: true });
    assert(failEvents.length === 0, 'no event on failed load');

    // unsubscribe stops delivery
    const n = events.length;
    unsub();
    await Ark.loadHydration({ force: true });
    assert(events.length === n, 'unsubscribe stops events');

    // non-function subscribe is no-op
    const noopUnsub = Ark.subscribe(null);
    assert(typeof noopUnsub === 'function', 'noop unsub');
    noopUnsub();
  }

  // --- file: blocks curve and bbdm ---
  {
    let fetched = false;
    const { Ark, getFetchCount } = loadArk({
      protocol: 'file:',
      fetchImpl: async () => {
        fetched = true;
        return okResponse({});
      },
    });
    assert((await Ark.loadCurveHistory({ force: true })).ok === false, 'curve file: fails');
    assert((await Ark.loadBbdmReport({ force: true })).ok === false, 'bbdm file: fails');
    assert(getFetchCount() === 0 && !fetched, 'file: no network for curve/bbdm');
    assert(sourceById(Ark.getSources(), 'curve').status === 'unavailable', 'curve unavailable file:');
    assert(sourceById(Ark.getSources(), 'bbdm_report').status === 'unavailable', 'bbdm unavailable file:');
    assert(sourceById(Ark.getSources(), 'coinglass_perp').status === 'unavailable', 'coinglass unavailable file:');
  }

  console.log('PASS ark.test.mjs — hydration + curve + bbdm + coinglass + getSources + subscribe');
}

run().catch((err) => {
  console.error('FAIL ark.test.mjs', err);
  process.exit(1);
});
