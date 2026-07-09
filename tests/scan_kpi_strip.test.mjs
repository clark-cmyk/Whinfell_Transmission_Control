#!/usr/bin/env node
/** Phase 3 — scan-layer compact KPI strip (Lego registry + render). */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { loadCoreJs } from './dom_shim.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function loadScanModule() {
  const files = ['data_states.js', 'command_bar_kpis.js', 'scan_kpi_strip.js'];
  const sandbox = {
    window: {},
    console,
    document: {
      createElement(tag) {
        const el = {
          tagName: tag.toUpperCase(),
          className: '',
          innerHTML: '',
          dataset: {},
          children: [],
          parentNode: null,
          setAttribute() {},
          getAttribute: () => null,
          appendChild(child) {
            child.parentNode = el;
            el.children.push(child);
            return child;
          },
          querySelector(sel) {
            if (sel.startsWith('[data-rc-zone=')) {
              const zone = sel.match(/"([^"]+)"/)?.[1];
              return el.children.find(c => c.dataset?.rcZone === zone) || null;
            }
            if (sel.startsWith('[data-scan-tile=')) {
              const id = sel.match(/"([^"]+)"/)?.[1];
              const walk = (node) => {
                if (node.dataset?.scanTile === id) return node;
                for (const child of node.children || []) {
                  const hit = walk(child);
                  if (hit) return hit;
                }
                return null;
              };
              return walk(el);
            }
            return null;
          },
          querySelectorAll(sel) {
            if (sel === '[data-scan-tile]') {
              const out = [];
              const walk = (node) => {
                if (node.dataset?.scanTile) out.push(node);
                for (const child of node.children || []) walk(child);
              };
              walk(el);
              return out;
            }
            return [];
          },
          insertAdjacentElement() {},
          addEventListener() {},
        };
        if (tag === 'div') {
          el.querySelector = function query(sel) {
            if (sel === '.scan-kpi-label') return el._label || null;
            if (sel === '.scan-kpi-badge') return el._badge || null;
            if (sel === '.scan-kpi-value') return el._value || null;
            if (sel === '.scan-kpi-delta') return el._delta || null;
            if (sel === '.scan-kpi-rationale') return el._rationale || null;
            if (sel === '.scan-kpi-expand') return el._expand || null;
            if (sel.startsWith('[data-scan-tile=')) {
              const id = sel.match(/"([^"]+)"/)?.[1];
              return el.children.find(c => c.dataset?.scanTile === id) || null;
            }
            return null;
          };
        }
        return el;
      },
      getElementById(id) {
        if (id === 'scanKpiStrip') return sandbox._mount || null;
        if (id === 'scanKpiTiles') return sandbox._tiles || null;
        if (id === 'commandBar') return sandbox._cmdBar || { parentNode: sandbox._parent };
        return null;
      },
    },
  };
  sandbox.window = sandbox;
  sandbox._parent = {
    insertBefore(node, ref) {
      node._ref = ref;
      sandbox._mount = node;
      sandbox._tiles = node.children?.[0] || node.querySelector?.('#scanKpiTiles');
    },
  };
  sandbox._cmdBar = { parentNode: sandbox._parent };
  const ctx = vm.createContext(sandbox);
  for (const file of files) {
    const src = fs.readFileSync(path.join(ROOT, 'js', file), 'utf8');
    vm.runInContext(src, ctx, { filename: file });
  }
  return sandbox.WTM_ScanKpiStrip;
}

function asHtmlCollection(items) {
  /** Array-like only — no .find / .some / .forEach (real HTMLCollection shape). */
  const col = { length: items.length };
  for (let i = 0; i < items.length; i += 1) col[i] = items[i];
  return col;
}

function run() {
  // Boot fix lock: HTMLCollection is not an Array — never call .some/.find on .children
  const stripSrc = fs.readFileSync(path.join(ROOT, 'js', 'scan_kpi_strip.js'), 'utf8');
  assert(/function childList\s*\(/.test(stripSrc), 'childList helper present for HTMLCollection');
  assert(/Array\.from\(\s*kids\s*\)/.test(stripSrc), 'childList uses Array.from');
  assert(
    !/\(\s*layout\?\.children\s*\|\|\s*\[\s*\]\s*\)\.some/.test(stripSrc),
    'hasRcZones must not call .some on layout.children',
  );
  assert(
    !/\(\s*layout\?\.children\s*\|\|\s*\[\s*\]\s*\)\.find/.test(stripSrc),
    'findRcZone must not call .find on layout.children',
  );
  assert(
    !/\(\s*mount\?\.children\s*\|\|\s*\[\s*\]\s*\)\.find/.test(stripSrc),
    'findTilesLayout must not call .find on mount.children',
  );
  assert(
    !/\(\s*node\?\.children\s*\|\|\s*\[\s*\]\s*\)\.forEach/.test(stripSrc),
    'collectScanTiles must not call .forEach on node.children',
  );
  // Sanity: HTMLCollection-like lacks Array methods; Array.from still works
  const probe = asHtmlCollection([{ dataset: { rcZone: 'header' } }]);
  assert(typeof probe.some !== 'function', 'HTMLCollection-like has no .some');
  assert(typeof probe.find !== 'function', 'HTMLCollection-like has no .find');
  assert(Array.from(probe).some((c) => c.dataset?.rcZone) === true, 'Array.from restores .some');

  const SCAN = loadScanModule();
  assert(SCAN?.BUILD?.includes('CHUNK07'), 'scan strip build stamp');
  assert(SCAN.STATE_CLASS_POOLS?.riskZone?.includes('risk-zone-amber'), 'risk zone state pool');
  assert(SCAN.STATE_CLASS_POOLS?.btcGate?.includes('btc-gate-caution'), 'btc gate state pool');
  assert(SCAN.STATE_CLASS_POOLS?.regime?.includes('regime-constructive'), 'regime state pool');
  assert(SCAN.TILE_ZONES?.scan_score === 'header', 'score tile in header zone');
  assert(SCAN.TILE_ZONES?.scan_gate === 'gate', 'gate tile in gate zone');
  assert(SCAN.SEMANTIC_DISPLAY?.gate?.permissionLabel?.reduced === 'Caution', 'gate permission labels');
  assert(SCAN.SEMANTIC_DISPLAY?.gate?.sizingLabel?.reduced === '0.5× size', 'gate sizing labels');
  assert(SCAN.SEMANTIC_DISPLAY?.score?.label === 'Risk Score', 'score semantic label');
  assert(SCAN.SEMANTIC_DISPLAY?.gate?.label === 'BTC Gate', 'gate semantic label');
  assert(SCAN.SCAN_DISPLAY?.compactFace === true, 'compact face enabled');
  assert(SCAN.BADGE_DISPLAY?.visibleStates?.includes('blocked'), 'badge display config');
  const hiddenBadge = SCAN.resolveBadge(SCAN.TILE_REGISTRY[0], {
    state: 'not_computed',
    label: 'Not computed',
  });
  assert(hiddenBadge.visible === false && hiddenBadge.text === '', 'not_computed badge suppressed');
  const shownBadge = SCAN.resolveBadge(SCAN.TILE_REGISTRY[2], {
    state: 'blocked',
    label: 'Blocked',
  });
  assert(shownBadge.visible === true && shownBadge.text === 'Blocked', 'blocked badge visible');
  assert(SCAN.TILE_REGISTRY.length >= 4 && SCAN.TILE_REGISTRY.length <= 6, '4–6 scan tiles');
  assert(SCAN.TILE_REGISTRY.some(t => t.id === 'scan_score'), 'score tile');
  assert(SCAN.TILE_REGISTRY.some(t => t.id === 'scan_gate'), 'gate tile');
  assert(SCAN.TILE_REGISTRY.some(t => t.id === 'scan_freshness'), 'freshness tile');

  const ctx = {
    prov: { hydratedAt: null },
    metrics: { whinfellScore: null, regime: null, txState: null, dataAsOf: null },
    gate: { score: NaN, code: 'blocked', label: 'Blocked', rule: 'Score required' },
    health: { score: 50, label: 'Fair', weakestStage: 'Liquidity' },
    zone: { text: 'Pending', key: 'amber' },
    freshStatus: 'unknown',
    freshLabel: '—',
    gateTitle: 'BLOCKED',
    txLabel: null,
    shockLabel: null,
  };

  const scoreParts = SCAN.tileParts(SCAN.TILE_REGISTRY[0], ctx);
  assert(scoreParts.resolved.state === 'not_computed', 'unhydrated score typed');
  assert(scoreParts.display !== '—', 'no silent dash for score');
  assert(scoreParts.rationale.length > 10, 'rationale deferred from dominant value');
  assert(scoreParts.faceDelta === 'Zone Pending', 'unhealthy face shows zone hint');
  assert(!scoreParts.faceDelta?.includes('Import'), 'no import prose in visible delta');
  assert(!scoreParts.rationale.includes(scoreParts.faceDelta) || scoreParts.faceDelta === 'Pending', 'rationale not duplicated in face');

  const regimeMeta = SCAN.buildMeta(ctx, 'regime');
  assert(regimeMeta.not_computed && regimeMeta.reason.includes('Import'), 'regime meta recipe');

  const scoreMeta = SCAN.buildMeta(ctx, 'score');
  assert(scoreMeta.reason.includes('Import'), 'delegates score recipe to command bar');

  const w = loadCoreJs();
  const exp = w.__testExports;
  const gate = w.deriveGate?.(w.buildStateFromDOM?.()) || {
    score: NaN,
    zone: { text: '—', key: '' },
    code: 'blocked',
    glow: '',
    bannerSub: '',
    label: 'Blocked',
    rule: 'Enter score',
  };
  const state = {
    provenance: w.appState?.provenance || { hydratedAt: null },
    intake: { whinfellScore: '', transmissionState: '', regimeTag: '' },
    tracer: { horizons: {}, activeShock: null },
    grossRisk: { posture: '' },
    operator: {},
    hydration: {},
  };
  exp.renderCommandBar(state, gate);

  const mount = w.document.getElementById('scanKpiStrip');
  assert(mount, 'scan strip mount in DOM');
  const tilesEl = w.document.getElementById('scanKpiTiles');
  assert(tilesEl, 'scan tiles container in DOM');
  const collectTiles = (root) => {
    const out = [];
    const walk = (node) => {
      if (node?.dataset?.scanTile) out.push(node);
      (node?.children || []).forEach(walk);
    };
    walk(root);
    return out;
  };
  const tiles = collectTiles(tilesEl);
  assert(tiles.length >= 4, `rendered ${tiles.length} scan tiles`);
  assert((tilesEl.children || []).some((c) => c.dataset?.rcZone === 'header'), 'risk cockpit header zone');
  assert((tilesEl.children || []).some((c) => c.dataset?.rcZone === 'gate'), 'risk cockpit gate zone');
  assert((tilesEl.children || []).some((c) => c.dataset?.rcZone === 'footer'), 'risk cockpit footer zone');

  const scoreTile = tilesEl.querySelector('[data-scan-tile="scan_score"]')
    || tiles.find(t => t.dataset?.scanTile === 'scan_score');
  assert(scoreTile, 'score scan tile rendered');
  const valueEl = scoreTile?.querySelector?.('.scan-kpi-value')
    || scoreTile?.children?.find(c => c.classList?.contains('scan-kpi-value'));
  assert(valueEl?.textContent === 'Not computed', `scan score typed (${valueEl?.textContent})`);
  assert(scoreTile?.title?.length > 5, 'score rationale in title');
  const scoreDelta = scoreTile?.querySelector?.('.scan-kpi-delta')
    || scoreTile?.children?.find(c => c.classList?.contains('scan-kpi-delta'));
  const scoreLabel = scoreTile?.querySelector?.('.scan-kpi-label')
    || scoreTile?.children?.find(c => c.classList?.contains('scan-kpi-label'));
  assert(scoreLabel?.textContent === 'Risk Score', `score semantic label (${scoreLabel?.textContent})`);
  assert(scoreDelta?.textContent === 'Pending' || scoreDelta?.textContent === 'Zone Pending',
    `score delta compact (${scoreDelta?.textContent})`);
  assert(!scoreDelta?.textContent?.includes('hydration'), 'score delta has no hydration prose');

  // Chunk 3 — panel header meta (presentation only)
  assert(typeof SCAN.syncPanelMeta === 'function', 'syncPanelMeta exported');
  const metaEl = {
    textContent: '',
    setAttribute(k, v) { this[k] = v; },
  };
  const metaDoc = { getElementById: (id) => (id === 'riskCockpitPanelMeta' ? metaEl : null) };
  const metaLine = SCAN.syncPanelMeta({
    metrics: { whinfellScore: 69, regime: 'Constructive / Selective Risk-On' },
    gate: { code: 'open', label: 'Open' },
  }, metaDoc);
  assert(metaLine.includes('Score 69'), `panel meta score (${metaLine})`);
  assert(metaLine.includes('Open') || metaLine.includes('open') || /·/.test(metaLine), `panel meta gate/regime (${metaLine})`);

  const gateParts = SCAN.tileParts(SCAN.TILE_REGISTRY[2], ctx);
  assert(SCAN.resolveGatePermission(ctx) === 'Blocked', 'gate permission from code');
  assert(SCAN.resolveGateSizing(ctx) === '0× size', 'gate sizing from code');
  assert(SCAN.resolveBtcGateClass(ctx) === 'btc-gate-blocked', 'btc gate state class');
  const zoneCtx = { ...ctx, zone: { text: 'Amber', key: 'amber' }, gate: { code: 'reduced', label: 'Reduced' } };
  assert(SCAN.resolveRiskZoneClass(zoneCtx) === 'risk-zone-amber', 'risk zone class from key');
  assert(SCAN.resolveBtcGateClass(zoneCtx) === 'btc-gate-caution', 'btc caution class from reduced code');
  const regimeCtx = {
    ...ctx,
    metrics: { ...ctx.metrics, regime: 'Constructive / Selective Risk-On', txState: 'elevated' },
    txLabel: 'Elevated',
  };
  assert(SCAN.resolveRegimeClass(regimeCtx) === 'regime-constructive', 'regime constructive from tag');
  assert(SCAN.resolveRegimeTxClass(regimeCtx) === 'regime-stressed', 'regime stressed from tx');
  assert(gateParts.faceDelta === 'BTC modules off', 'gate face uses config cue');
  assert(!gateParts.faceDelta?.includes('Score required'), 'gate rule not on face');
  assert(gateParts.rationale.includes('Score required'), 'gate rule deferred to rationale');
  for (const tile of SCAN.TILE_REGISTRY) {
    const parts = SCAN.tileParts(tile, ctx);
    const face = `${parts.display || ''} ${parts.faceDelta || ''}`;
    assert(!face.includes('\n'), `${tile.id} face is single-line`);
    assert(!/import hydration/i.test(face), `${tile.id} face has no import prose`);
    if (parts.faceDelta) {
      assert(parts.faceDelta.length <= SCAN.SCAN_DISPLAY.maxFaceDeltaChars + 1,
        `${tile.id} delta within max chars`);
    }
  }

  const gateTile = tiles.find((t) => t.dataset?.scanTile === 'scan_gate');
  assert(gateTile?.dataset?.dataState, 'gate tile data state');
  const visibleBadges = tiles.filter((t) => {
    const b = t.querySelector?.('.scan-kpi-badge') || t.children?.find(c => c.classList?.contains('scan-kpi-badge'));
    return b && !b.className?.includes('scan-kpi-badge--hidden') && b.textContent?.trim();
  });
  assert(visibleBadges.length <= 2, `scan strip visible badges calmer (${visibleBadges.length})`);

  console.log([
    'PASS scan_kpi_strip.test.mjs',
    `build=${SCAN.BUILD}`,
    `tiles=${SCAN.TILE_REGISTRY.length}`,
    `rendered=${tiles.length}`,
    `score=${valueEl?.textContent}`,
    `gate_state=${gateTile?.dataset?.dataState}`,
    'htmlcollection_safe=1',
  ].join('\n'));
}

try {
  run();
} catch (err) {
  console.error(`FAIL scan_kpi_strip.test.mjs: ${err.message}`);
  process.exit(1);
}