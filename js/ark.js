/**
 * The Ark — single source of truth for raw data loads.
 * Only this module may fetch market/data files. All panels request data through WTM_Ark.
 *
 * Chunk 1: hydration load/cache.
 * Chunk 4: curve history, BBDM report, getSources, subscribe.
 */
(function arkModule(global) {
  'use strict';

  const BUILD = 'ARK-1.2.0-CHUNK18-2026-07-09';

  const HYDRATION_URL = 'data/hydration/latest.json';
  const CURVE_URL = 'data/barchart/v1/barchart_curve_history.json';
  const BBDM_REPORT_URLS = Object.freeze([
    'bang_bang_da/bang_bang_da_report.json',
    './bang_bang_da/bang_bang_da_report.json',
  ]);
  /** CoinGlass / Litmus market stub (BBDM v2). */
  const COINGLASS_URLS = Object.freeze([
    'bang_bang_da/litmus/crypto_market.json',
    './bang_bang_da/litmus/crypto_market.json',
  ]);

  /** @type {object|null} */
  let hydrationCache = null;
  /** @type {object|null} */
  let curveCache = null;
  /** @type {object|null} */
  let bbdmReportCache = null;
  /** @type {object|null} */
  let coinglassCache = null;
  /** @type {string|null} */
  let lastRefreshedAt = null;

  /** @type {Map<string, { id: string, url: string, status: string, lastSuccessAt: string|null, error: string|null }>} */
  const sources = new Map();

  /** @type {Set<Function>} */
  const listeners = new Set();

  function makeSource(id, url) {
    return {
      id: id,
      url: url,
      status: 'unavailable',
      lastSuccessAt: null,
      error: null,
    };
  }

  sources.set('hydration', makeSource('hydration', HYDRATION_URL));
  sources.set('curve', makeSource('curve', CURVE_URL));
  sources.set('bbdm_report', makeSource('bbdm_report', BBDM_REPORT_URLS[0]));
  sources.set('coinglass_perp', makeSource('coinglass_perp', COINGLASS_URLS[0]));

  function isFileProtocol() {
    try {
      return global.location && global.location.protocol === 'file:';
    } catch (_) {
      return false;
    }
  }

  function bustUrl(url) {
    const sep = url.indexOf('?') >= 0 ? '&' : '?';
    return `${url}${sep}_=${Date.now()}`;
  }

  function stampFromBundle(bundle) {
    if (!bundle || typeof bundle !== 'object') {
      return {
        as_of: null,
        snapshot_id: null,
        freshness_status: null,
      };
    }
    return {
      as_of: bundle.as_of || null,
      snapshot_id: bundle.snapshot_id || null,
      freshness_status: bundle.freshness_status || null,
    };
  }

  function setSourceStatus(id, status, error, url) {
    const prev = sources.get(id) || makeSource(id, url || '');
    const now = status === 'ok' ? new Date().toISOString() : prev.lastSuccessAt;
    sources.set(id, {
      id: id,
      url: url || prev.url,
      status: status,
      lastSuccessAt: now,
      error: error || null,
    });
  }

  function cloneSource(src) {
    return {
      id: src.id,
      url: src.url,
      status: src.status,
      lastSuccessAt: src.lastSuccessAt,
      error: src.error,
    };
  }

  function failResult(error) {
    return {
      ok: false,
      data: null,
      as_of: null,
      snapshot_id: null,
      freshness_status: null,
      error: error || 'load failed',
    };
  }

  function okResult(data, extra) {
    const stamp = stampFromBundle(data);
    return Object.assign({
      ok: true,
      data: data,
      as_of: stamp.as_of,
      snapshot_id: stamp.snapshot_id,
      freshness_status: stamp.freshness_status,
    }, extra || {});
  }

  function notify(event) {
    listeners.forEach((fn) => {
      try {
        fn(event);
      } catch (err) {
        console.warn('[WTM_Ark] subscriber error', err);
      }
    });
  }

  /**
   * @param {string} url
   * @returns {Promise<{ ok: boolean, data?: object|null, error?: string, status?: number }>}
   */
  async function fetchJson(url) {
    if (isFileProtocol()) {
      return { ok: false, error: 'file: protocol cannot fetch data files' };
    }
    if (typeof global.fetch !== 'function') {
      return { ok: false, error: 'fetch unavailable' };
    }
    try {
      const res = await global.fetch(bustUrl(url), { cache: 'no-store' });
      if (!res.ok) {
        return { ok: false, error: `HTTP ${res.status}`, status: res.status };
      }
      const data = await res.json();
      if (!data || typeof data !== 'object') {
        return { ok: false, error: 'invalid JSON body' };
      }
      return { ok: true, data: data };
    } catch (err) {
      const msg = err && err.message ? err.message : String(err || 'load failed');
      return { ok: false, error: msg };
    }
  }

  /**
   * Try a list of URLs; first successful JSON wins.
   * @param {string[]} urls
   */
  async function fetchJsonFirst(urls) {
    let lastError = 'no paths';
    for (let i = 0; i < urls.length; i += 1) {
      const result = await fetchJson(urls[i]);
      if (result.ok) {
        return { ok: true, data: result.data, url: urls[i] };
      }
      lastError = result.error || lastError;
    }
    return { ok: false, error: lastError, url: urls[0] || null };
  }

  /**
   * Load (or re-load) deploy hydration JSON into the in-memory cache.
   * @param {{ force?: boolean }} [options]
   */
  async function loadHydration(options) {
    const opts = options || {};
    const force = opts.force !== false;

    if (!force && hydrationCache) {
      return okResult(hydrationCache);
    }

    const fetched = await fetchJson(HYDRATION_URL);
    if (!fetched.ok) {
      const status = isFileProtocol() ? 'unavailable' : 'error';
      setSourceStatus('hydration', status, fetched.error, HYDRATION_URL);
      return failResult(fetched.error);
    }

    const bundle = fetched.data;
    if (bundle.validation_status === 'missing') {
      setSourceStatus('hydration', 'missing', 'validation_status=missing', HYDRATION_URL);
      return failResult('validation_status=missing');
    }

    hydrationCache = bundle;
    lastRefreshedAt = new Date().toISOString();
    setSourceStatus('hydration', 'ok', null, HYDRATION_URL);
    notify({ type: 'hydration', ok: true, source: 'hydration' });
    return okResult(bundle);
  }

  /** @returns {object|null} */
  function getHydration() {
    return hydrationCache;
  }

  /**
   * Load Barchart curve history JSON.
   * @param {{ force?: boolean }} [options]
   */
  async function loadCurveHistory(options) {
    const opts = options || {};
    const force = opts.force !== false;

    if (!force && curveCache) {
      return okResult(curveCache);
    }

    const fetched = await fetchJson(CURVE_URL);
    if (!fetched.ok) {
      const status = isFileProtocol() ? 'unavailable' : 'error';
      setSourceStatus('curve', status, fetched.error, CURVE_URL);
      return failResult(fetched.error);
    }

    curveCache = fetched.data;
    lastRefreshedAt = new Date().toISOString();
    setSourceStatus('curve', 'ok', null, CURVE_URL);
    notify({ type: 'curve', ok: true, source: 'curve' });
    return okResult(curveCache);
  }

  /** @returns {object|null} */
  function getCurveHistory() {
    return curveCache;
  }

  /**
   * Load Bang Bang DA report JSON (path cascade).
   * @param {{ force?: boolean }} [options]
   */
  async function loadBbdmReport(options) {
    const opts = options || {};
    const force = opts.force !== false;

    if (!force && bbdmReportCache) {
      return okResult(bbdmReportCache);
    }

    if (isFileProtocol()) {
      setSourceStatus('bbdm_report', 'unavailable', 'file: protocol cannot fetch data files', BBDM_REPORT_URLS[0]);
      return failResult('file: protocol cannot fetch data files');
    }

    const fetched = await fetchJsonFirst(BBDM_REPORT_URLS.slice());
    if (!fetched.ok) {
      setSourceStatus('bbdm_report', 'error', fetched.error, BBDM_REPORT_URLS[0]);
      return failResult(fetched.error);
    }

    bbdmReportCache = fetched.data;
    lastRefreshedAt = new Date().toISOString();
    setSourceStatus('bbdm_report', 'ok', null, fetched.url || BBDM_REPORT_URLS[0]);
    notify({ type: 'bbdm_report', ok: true, source: 'bbdm_report' });
    return okResult(bbdmReportCache);
  }

  /** @returns {object|null} */
  function getBbdmReport() {
    return bbdmReportCache;
  }

  /**
   * Load CoinGlass / Litmus crypto_market JSON (path cascade).
   * @param {{ force?: boolean }} [options]
   */
  async function loadCoinglass(options) {
    const opts = options || {};
    const force = opts.force !== false;

    if (!force && coinglassCache) {
      return okResult(coinglassCache);
    }

    if (isFileProtocol()) {
      setSourceStatus('coinglass_perp', 'unavailable', 'file: protocol cannot fetch data files', COINGLASS_URLS[0]);
      return failResult('file: protocol cannot fetch data files');
    }

    const fetched = await fetchJsonFirst(COINGLASS_URLS.slice());
    if (!fetched.ok) {
      setSourceStatus('coinglass_perp', 'error', fetched.error, COINGLASS_URLS[0]);
      return failResult(fetched.error);
    }

    coinglassCache = fetched.data;
    lastRefreshedAt = new Date().toISOString();
    // Stub docs may be pending_coinglass — still "ok" as published artifact.
    const dataStatus = coinglassCache && (coinglassCache.data_status || coinglassCache.stub_status || coinglassCache.status);
    // File present counts as ok for Ark inventory; stub/pending flagged in error note for desk.
    const note = dataStatus && /pending|stub|missing/i.test(String(dataStatus))
      ? `data_status=${dataStatus}`
      : null;
    setSourceStatus('coinglass_perp', 'ok', note, fetched.url || COINGLASS_URLS[0]);
    notify({ type: 'coinglass_perp', ok: true, source: 'coinglass_perp' });
    return okResult(coinglassCache);
  }

  /** @returns {object|null} */
  function getCoinglass() {
    return coinglassCache;
  }


  /**
   * Inventory of registered data sources for the ARK page.
   * @returns {Array<{ id: string, url: string, status: string, lastSuccessAt: string|null, error: string|null }>}
   */
  function getSources() {
    return ['hydration', 'curve', 'bbdm_report', 'coinglass_perp'].map((id) => cloneSource(sources.get(id)));
  }

  /**
   * Snapshot stamp from hydration + full source inventory.
   */
  function getStamp() {
    const stamp = stampFromBundle(hydrationCache);
    return {
      as_of: stamp.as_of,
      snapshot_id: stamp.snapshot_id,
      freshness_status: stamp.freshness_status,
      lastRefreshedAt: lastRefreshedAt,
      sources: getSources(),
    };
  }

  /**
   * Subscribe to successful Ark reloads.
   * @param {(event: { type: string, ok: boolean, source: string }) => void} listener
   * @returns {() => void} unsubscribe
   */
  function subscribe(listener) {
    if (typeof listener !== 'function') {
      return function noop() {};
    }
    listeners.add(listener);
    return function unsubscribe() {
      listeners.delete(listener);
    };
  }

  const api = {
    BUILD: BUILD,
    loadHydration: loadHydration,
    getHydration: getHydration,
    loadCurveHistory: loadCurveHistory,
    getCurveHistory: getCurveHistory,
    loadBbdmReport: loadBbdmReport,
    getBbdmReport: getBbdmReport,
    loadCoinglass: loadCoinglass,
    getCoinglass: getCoinglass,
    getSources: getSources,
    getStamp: getStamp,
    subscribe: subscribe,
  };

  global.WTM_Ark = api;
})(typeof window !== 'undefined' ? window : globalThis);
