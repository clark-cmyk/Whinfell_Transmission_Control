#!/usr/bin/env node
/**
 * Phase 2.4 Chunk 31 — Transmission Ladder loads hydration only via WTM_Ark.
 * Source chip: ark-hydration | local | fixture. No raw hydration fetch.
 * Runtime smoke: stub Ark → loadRaw/buildPayload/renderDecision without ReferenceError.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
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

  // buildPayload must define local wf (strict-mode ReferenceError fix)
  assert(/function buildPayload\s*\([^)]*\)\s*\{[\s\S]*?\bvar\s+wf\s*=\s*raw\.whinfellScore/.test(html),
    'buildPayload must declare local var wf = raw.whinfellScore');

  // Desk stamp helper wired for As of
  assert(html.includes('WTM_formatLocalStamp') || html.includes('WTM_Time'),
    'As of must use WTM_formatLocalStamp / WTM_Time');

  // Source chip + preferLocal + fallbacks
  assert(html.includes("source: 'ark-hydration'") || html.includes('source: "ark-hydration"'),
    'payload source ark-hydration');
  assert(html.includes("source: 'local'") || html.includes('source: "local"'),
    'payload source local');
  assert(html.includes("source: 'fixture'") || html.includes('source: "fixture"'),
    'payload source fixture');
  assert(html.includes('preferLocal'), 'supports ?preferLocal=1');
  assert(html.includes('source-tile'), 'visible Source chip in decision band');
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

function makeClassList() {
  const set = new Set();
  return {
    add(...c) { c.forEach((x) => set.add(x)); },
    remove(...c) { c.forEach((x) => set.delete(x)); },
    contains(c) { return set.has(c); },
    toggle(c, force) {
      if (force === true) set.add(c);
      else if (force === false) set.delete(c);
      else if (set.has(c)) set.delete(c);
      else set.add(c);
      return set.has(c);
    },
  };
}

function makeNode(id) {
  const children = [];
  const node = {
    id,
    textContent: '',
    className: '',
    classList: makeClassList(),
    style: {},
    dataset: {},
    innerHTML: '',
    value: '',
    children,
    firstChild: null,
    appendChild(child) {
      children.push(child);
      node.firstChild = children[0] || null;
      return child;
    },
    removeChild(child) {
      const i = children.indexOf(child);
      if (i >= 0) children.splice(i, 1);
      node.firstChild = children[0] || null;
      return child;
    },
    setAttribute() {},
    getAttribute: () => null,
    addEventListener() {},
    removeEventListener() {},
    querySelector: () => null,
    querySelectorAll: () => [],
  };
  Object.defineProperty(node, 'firstChild', {
    get() { return children[0] || null; },
    configurable: true,
  });
  // while (root.firstChild) root.removeChild(root.firstChild) needs mutable firstChild
  let fc = null;
  Object.defineProperty(node, 'firstChild', {
    get() { return children[0] || null; },
    set(v) { fc = v; },
    configurable: true,
  });
  node.appendChild = function appendChild(child) {
    children.push(child);
    return child;
  };
  node.removeChild = function removeChild(child) {
    const i = children.indexOf(child);
    if (i >= 0) children.splice(i, 1);
    return child;
  };
  node._children = children;
  return node;
}

function extractLadderInlineScript(html) {
  const marker = "const STORAGE_KEYS = [";
  const start = html.indexOf(marker);
  assert(start >= 0, 'inline ladder script marker not found');
  // Walk back to the opening <script> after models
  const scriptOpen = html.lastIndexOf('<script>', start);
  assert(scriptOpen >= 0, 'inline <script> open not found');
  const bodyStart = scriptOpen + '<script>'.length;
  const scriptClose = html.indexOf('</script>', bodyStart);
  assert(scriptClose > bodyStart, 'inline </script> not found');
  return html.slice(bodyStart, scriptClose);
}

/**
 * Runtime smoke: Ark stub → loadRaw/buildPayload/renderDecision.
 * Locks the buildPayload `wf` strict-mode bug and source === 'ark-hydration'.
 */
async function testRuntimeArkLoadAndBuild() {
  const html = fs.readFileSync(
    path.join(ROOT, 'whinfell-transmission-ladder-deep-dive.html'),
    'utf8',
  );
  const timeFmtSrc = fs.readFileSync(path.join(ROOT, 'js/time_format.js'), 'utf8');
  const chinaSrc = fs.readFileSync(path.join(ROOT, 'js/desk_china_ladder_models.js'), 'utf8');
  let inline = extractLadderInlineScript(html);

  // Replace auto-boot with exports so we can drive loadRaw/buildPayload ourselves
  assert(inline.includes('loadRaw().then'), 'expected loadRaw().then boot');
  inline = inline.replace(
    /loadRaw\(\)\.then\(function \(raw\) \{\s*render\(buildPayload\(raw\), buildChinaPayload\(raw\)\);\s*\}\);/,
    [
      'window.__ladderApi = {',
      '  loadRaw: loadRaw,',
      '  buildPayload: buildPayload,',
      '  buildChinaPayload: buildChinaPayload,',
      '  renderDecision: renderDecision,',
      '  formatAsOfStamp: formatAsOfStamp,',
      '  prefersLocalFirst: prefersLocalFirst,',
      '  payloadFromHydrationBundle: payloadFromHydrationBundle,',
      '  payloadFromLocalState: payloadFromLocalState,',
      '};',
    ].join('\n'),
  );

  let hydrationCalls = 0;
  let rawFetchCalls = 0;
  const nodes = new Map();
  const sampleBundle = {
    as_of: '2026-07-09T14:37:30+00:00',
    global: { regime_tag: 'Fragile Risk-On', whinfell_score: 58 },
    suggested_tracer: {
      liquidity: { d1: 'flat', d5: 'flat', d20: 'down', d60: 'flat' },
      credit: { d1: 'flat', d5: 'down', d20: 'flat', d60: 'flat' },
      breadth: { d1: 'flat', d5: 'flat', d20: 'flat', d60: 'flat' },
      highbeta: { d1: 'flat', d5: 'flat', d20: 'flat', d60: 'flat' },
      basis: { d1: 'flat', d5: 'flat', d20: 'flat', d60: 'flat' },
    },
    china_ladder: {
      horizons: {
        liquidity: { d1: 'flat', d5: 'flat', d20: 'down', d60: 'flat' },
        credit: { d1: 'flat', d5: 'flat', d20: 'flat', d60: 'down' },
        breadth: { d1: 'up', d5: 'flat', d20: 'flat', d60: 'flat' },
        highbeta: { d1: 'flat', d5: 'down', d20: 'flat', d60: 'flat' },
        basis: { d1: 'flat', d5: 'flat', d20: 'down', d60: 'flat' },
      },
      sq3_score: 54,
    },
    china: { sq3_band: 'Mixed / Fragile · policy overlay', sq3_score: 54 },
  };

  const sandbox = {
    console,
    window: {},
    location: {
      protocol: 'http:',
      search: '',
      href: 'http://localhost/whinfell-transmission-ladder-deep-dive.html',
      origin: 'http://localhost',
      pathname: '/whinfell-transmission-ladder-deep-dive.html',
    },
    localStorage: {
      getItem: () => null,
      setItem() {},
      removeItem() {},
    },
    URLSearchParams,
    fetch: async () => {
      rawFetchCalls += 1;
      throw new Error('raw fetch forbidden in ladder runtime smoke');
    },
    document: {
      readyState: 'complete',
      documentElement: {
        getAttribute: () => 'dark',
        setAttribute() {},
        classList: makeClassList(),
      },
      body: { classList: makeClassList(), appendChild() {}, prepend() {} },
      getElementById: (id) => {
        if (!nodes.has(id)) nodes.set(id, makeNode(id));
        return nodes.get(id);
      },
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: (tag) => makeNode(tag || 'el'),
      addEventListener() {},
    },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.WTM_Ark = {
    async loadHydration() {
      hydrationCalls += 1;
      return { ok: true, data: sampleBundle, error: null };
    },
    getHydration() {
      return sampleBundle;
    },
  };
  sandbox.window.WTM_Ark = sandbox.WTM_Ark;

  const ctx = vm.createContext(sandbox);
  vm.runInContext(timeFmtSrc, ctx, { filename: 'time_format.js' });
  vm.runInContext(chinaSrc, ctx, { filename: 'desk_china_ladder_models.js' });
  // chart links optional — leave undefined
  vm.runInContext(inline, ctx, { filename: 'ladder-inline.js' });

  const api = sandbox.window.__ladderApi || sandbox.__ladderApi;
  assert(api && typeof api.loadRaw === 'function', 'ladder API not exported after boot patch');
  assert(typeof api.buildPayload === 'function', 'buildPayload not exported');
  assert(typeof sandbox.WTM_formatLocalStamp === 'function'
    || (sandbox.WTM_Time && typeof sandbox.WTM_Time.formatLocalStamp === 'function'),
    'time_format must expose WTM_formatLocalStamp');

  // Default path: Ark first
  const raw = await api.loadRaw();
  assert(raw, 'loadRaw returned null');
  assert(raw.source === 'ark-hydration', `expected source ark-hydration, got ${raw.source}`);
  assert(raw.asOf === sampleBundle.as_of, 'asOf mapped from bundle.as_of');
  assert(raw.regimeLabel === sampleBundle.global.regime_tag, 'regime mapped from global.regime_tag');
  assert(hydrationCalls >= 1, 'loadHydration must be called');
  assert(rawFetchCalls === 0, 'must not raw-fetch hydration JSON');

  // buildPayload must not throw (wf strict-mode fix)
  const payload = api.buildPayload(raw);
  assert(payload.whinfellScore === 58, `whinfellScore from bundle, got ${payload.whinfellScore}`);
  assert(payload.source === 'ark-hydration', 'buildPayload preserves source');
  assert(payload.weak && payload.weak.length >= 1, 'weak list populated');
  assert(payload.btc && payload.btc.posture, 'btc posture present');

  // Decision band paints Source + As of via desk stamp
  api.renderDecision(payload);
  const band = nodes.get('decisionBand');
  assert(band, 'decisionBand mount exists');
  const tileTexts = [];
  function walk(n) {
    if (!n) return;
    if (n.textContent) tileTexts.push(String(n.textContent));
    const kids = n._children || n.children || [];
    kids.forEach(walk);
  }
  walk(band);
  const joined = tileTexts.join(' | ');
  assert(joined.includes('ark-hydration') || joined.includes('Source'),
    `source chip missing in decision band: ${joined.slice(0, 200)}`);
  // stamp helper should produce YYYY-MM-DD style, not throw
  const stamp = api.formatAsOfStamp(payload.asOf);
  assert(stamp && stamp !== '—', `formatAsOfStamp returned ${stamp}`);
  assert(/\d{4}-\d{2}-\d{2}/.test(stamp), `desk stamp format expected, got ${stamp}`);

  // preferLocal=1: localStorage first when present; no raw fetch
  sandbox.location.search = '?preferLocal=1';
  const localState = {
    provenance: { dataAsOf: '2026-01-01T00:00:00Z' },
    intake: { regimeTag: 'Local Regime', whinfellScore: 42 },
    tracer: {
      horizons: sampleBundle.suggested_tracer,
    },
  };
  sandbox.localStorage.getItem = (key) => {
    if (String(key).includes('whinfell_transmission')) return JSON.stringify(localState);
    return null;
  };
  const callsBefore = hydrationCalls;
  const localRaw = await api.loadRaw();
  assert(localRaw.source === 'local', `preferLocal should yield local, got ${localRaw.source}`);
  assert(localRaw.whinfellScore === 42, 'local whinfellScore');
  // Ark may or may not be called depending on order — with preferLocal, local hits first so Ark should not be needed
  assert(hydrationCalls === callsBefore, 'preferLocal with local state should not call Ark');
  assert(rawFetchCalls === 0, 'preferLocal path still forbids raw hydration fetch');

  // Fixture path: Ark fail + no local
  sandbox.location.search = '';
  sandbox.localStorage.getItem = () => null;
  sandbox.WTM_Ark.loadHydration = async () => ({ ok: false, data: null, error: 'unavailable' });
  sandbox.WTM_Ark.getHydration = () => null;
  sandbox.window.WTM_Ark = sandbox.WTM_Ark;
  const fixtureRaw = await api.loadRaw();
  assert(fixtureRaw.source === 'fixture', `expected fixture, got ${fixtureRaw.source}`);
  const fixturePayload = api.buildPayload(fixtureRaw);
  assert(typeof fixturePayload.whinfellScore === 'number', 'fixture buildPayload ok');
  assert(fixturePayload.source === 'fixture', 'fixture source on payload');
}

function main() {
  testLadderHtmlWiring();
  testPhaseGateBbdmAndArk();
  return testRuntimeArkLoadAndBuild().then(() => {
    console.log('PASS tests/ladder_ark_load.test.mjs');
  });
}

main().catch((err) => {
  console.error('FAIL tests/ladder_ark_load.test.mjs:', err && err.stack ? err.stack : err);
  process.exit(1);
});
