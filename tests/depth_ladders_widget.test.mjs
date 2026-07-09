#!/usr/bin/env node
/** Depth/Ladders widget — DOM structure, status sync, relocation, CSS scoping, optional Playwright e2e. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

class ElementShim {
  constructor(tag = 'div', id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.className = '';
    this.classList = {
      _set: new Set(),
      add: (...cls) => cls.forEach((c) => this.classList._set.add(c)),
      remove: (...cls) => cls.forEach((c) => this.classList._set.delete(c)),
      toggle: (c, force) => {
        if (force === true) this.classList._set.add(c);
        else if (force === false) this.classList._set.delete(c);
        else if (this.classList._set.has(c)) this.classList._set.delete(c);
        else this.classList._set.add(c);
      },
      contains: (c) => this.classList._set.has(c),
    };
    this.attributes = {};
    this.children = [];
    this.parentElement = null;
    this.textContent = '';
    this.innerHTML = '';
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  getAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name)
      ? this.attributes[name]
      : null;
  }
}

class DetailsShim extends ElementShim {
  constructor(id) {
    super('details', id);
    this.open = false;
  }
}

function runDomStructureChecks() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  for (const id of [
    'iaDepthHost',
    'depthLaddersWidget',
    'depthLaddersStatus',
    'depthLaddersContent',
    'ladderVizRegion',
    'depthStatusHydration',
    'depthStatusFreshness',
    'depthStatusViz',
    'depthStatusWarn',
    'depthPanelMeta',
    'consoleDepthDisclosure',
    'commandBar',
  ]) {
    assert(html.includes(`id="${id}"`), `${id} present in index.html`);
  }

  assert(html.includes('class="ladder-viz-region"'), 'ladder viz region class');
  assert(html.includes('depth-ladders-plumbing-icon'), 'plumbing SVG icon');
  assert(html.includes('Depth · Command bar &amp; Ladders'), 'widget header title');
  assert(html.includes('id="depthPanelMeta"'), 'Depth panel meta present');
  assert(html.includes('wf-panel--depth'), 'Depth uses wf-panel chrome');

  const widgetInsideHost = /<div[^>]*id="iaDepthHost"[\s\S]*<div[^>]*id="depthLaddersWidget"/.test(html);
  assert(widgetInsideHost, 'depthLaddersWidget nested in iaDepthHost');

  const statusInsideWidget = /<div[^>]*id="depthLaddersWidget"[\s\S]*<div[^>]*id="depthLaddersStatus"/.test(html);
  assert(statusInsideWidget, 'depthLaddersStatus under widget root');

  const vizBeforeContent = html.indexOf('ladder-viz-region') < html.indexOf('id="depthLaddersContent"');
  assert(vizBeforeContent, 'ladder viz placeholder precedes depthLaddersContent');

  const disclosureOutsideShell = html.indexOf('id="consoleDepthDisclosure"') > html.indexOf('id="wtmIaShell"');
  assert(disclosureOutsideShell, 'consoleDepthDisclosure starts outside shell for relocation');

  assert(!/<details[^>]*id="consoleDepthDisclosure"[^>]*\bopen\b/i.test(html), 'depth disclosure collapsed by default');
}

function runCssScopingChecks() {
  const css = fs.readFileSync(path.join(ROOT, 'css/console_ia.css'), 'utf8');

  assert(css.includes('#iaDepthHost .depth-ladders-status'), 'status row scoped to iaDepthHost');
  assert(css.includes('#iaDepthHost .depth-status-badge'), 'WARN chip scoped to iaDepthHost');
  assert(css.includes('#iaDepthHost .ladder-viz-region'), 'viz region scoped to iaDepthHost');
  assert(css.includes('.wf-panel--depth .wf-panel__meta'), 'Depth panel meta chrome');
  assert(/\.wf-panel--depth\s*\{[^}]*min-height:\s*var\(--wf-panel-min-h\)/s.test(css), 'Depth panel min-height');

  const statusBlock = css.match(/#iaDepthHost \.depth-ladders-status\s*\{[^}]+\}/s)?.[0] || '';
  assert(statusBlock.includes('linear-gradient'), 'status row uses gradient banner');
  assert(statusBlock.includes('rgba(103, 167, 255'), 'status gradient matches radar accent tone');
  assert(statusBlock.includes('var(--wf-panel-bg-2)'), 'status row uses wf-panel-bg-2');
  assert(statusBlock.includes('var(--wf-divider)'), 'status row uses wf-divider border');

  const warnBlock = css.match(/#iaDepthHost \.depth-status-badge\s*\{[^}]+\}/s)?.[0] || '';
  assert(warnBlock.includes('border-radius: 999px'), 'WARN pill is chip-shaped');
  assert(warnBlock.includes('text-transform: uppercase'), 'WARN pill uppercase');

  const vizBlock = css.match(/#iaDepthHost \.ladder-viz-region\s*\{[^}]+\}/s)?.[0] || '';
  assert(vizBlock.includes('min-height: 72px'), 'ladder viz min-height 72px');
  assert(vizBlock.includes('dashed'), 'ladder viz dashed border');

  const statusSelectors = [...css.matchAll(/([^{]*)\.depth-ladders-status\s*\{/g)].map((m) => m[1].trim());
  assert(
    statusSelectors.every((sel) => sel.includes('#iaDepthHost')),
    'all .depth-ladders-status rules scoped under #iaDepthHost',
  );
}

function createShellHarness(extraIds = []) {
  const nodes = new Map();
  const hosts = {};

  const register = (node) => {
    nodes.set(node.id, node);
    return node;
  };

  const mkHost = (id) => register({
    id,
    children: [],
    appendChild(n) {
      n.parentElement = this;
      this.children.push(n);
      hosts[id] = hosts[id] || [];
      hosts[id].push(n.id);
      return n;
    },
  });

  const mkText = (id, text = '') => register(Object.assign(new ElementShim('span', id), { textContent: text }));
  const mkDetails = (id) => register(new DetailsShim(id));

  const baseIds = [
    'wtmIaShell', 'iaTopFrame', 'iaRiskCockpitHost', 'iaRiskCurveHost', 'iaRadarHost',
    'iaHyOasHost', 'hyOasNumericsBody', 'hyOasThesisBody', 'iaFlipchartHost', 'iaDepthHost',
    'depthLaddersContent', 'depthLaddersWidget', 'depthLaddersStatus', 'iaDigHost',
    'depthStatusHydration', 'depthStatusFreshness', 'depthStatusViz', 'depthStatusWarn',
    'depthPanelMeta',
    'hydrationImportStatus', 'headerFreshnessLabel', 'vizDiagnosticsBadge',
    'scanKpiStrip', 'nodeRail', 'transmissionRadar', 'cockpitChartArea', 'basisSummaryStrip',
    'cockpitDetailBand', 'hyOasHandoffActions', 'cockpitActions', 'cockpitDecisionRail',
    'consoleDepthDisclosure', 'commandBar', 'basisWatchPanel', 'iaMidwestCrushHost',
    'nodeCockpitZone', 'headerFreshnessDot', 'saveIndicator',
    ...extraIds,
  ];

  mkHost('iaRiskCockpitHost');
  mkHost('iaRiskCurveHost');
  mkHost('iaRadarHost');
  mkHost('iaHyOasHost');
  mkHost('hyOasNumericsBody');
  mkHost('hyOasThesisBody');
  mkHost('iaFlipchartHost');
  mkHost('iaDepthHost');
  mkHost('depthLaddersContent');
  mkHost('iaDigHost');

  register(new ElementShim('div', 'wtmIaShell'));
  register(Object.assign(new ElementShim('div', 'iaTopFrame'), { dataset: { collapsed: 'false' } }));
  register(Object.assign(new ElementShim('section', 'nodeCockpitZone'), {
    classList: { _set: new Set(), add() {}, remove() {}, toggle() {}, contains: () => false },
  }));

  mkText('depthStatusHydration', '—');
  mkText('depthStatusFreshness', '—');
  mkText('depthStatusViz', 'Viz —');
  mkText('depthPanelMeta', '—');
  const warn = mkText('depthStatusWarn', 'WARN');
  warn.classList.add('depth-status-badge', 'depth-status-badge--hidden');
  warn.setAttribute('aria-hidden', 'true');

  mkText('hydrationImportStatus', '—');
  mkText('headerFreshnessLabel', '—');

  const badge = mkText('vizDiagnosticsBadge', 'Viz —');
  badge.className = 'viz-diagnostics';

  const disclosure = mkDetails('consoleDepthDisclosure');
  disclosure.classList.add('console-depth-disclosure');
  const commandBar = register(new ElementShim('section', 'commandBar'));
  disclosure.appendChild(commandBar);

  for (const id of baseIds) {
    if (!nodes.has(id)) register(new ElementShim('div', id));
  }

  const ctx = {
    document: {
      body: {
        classList: {
          _s: new Set(),
          add(c) { this._s.add(c); },
          remove(c) { this._s.delete(c); },
          toggle() {},
          contains(c) { return this._s.has(c); },
        },
      },
      querySelectorAll: () => [],
      getElementById: (id) => nodes.get(id) || null,
    },
    sessionStorage: { getItem: () => null, setItem() {} },
    MutationObserver: class { observe() {} },
    console: { warn() {} },
    clearTimeout() {},
    clearInterval() {},
    setTimeout(fn) { fn(); return 0; },
    setInterval(fn) { fn(); return 0; },
    __vizDiagnostics: null,
  };

  const shellSrc = fs.readFileSync(path.join(ROOT, 'js/console_ia_shell.js'), 'utf8');
  vm.runInNewContext(shellSrc, ctx);

  return { ctx, hosts, nodes, disclosure, commandBar };
}

function runSyncDepthLaddersStatusUnitTests() {
  const cases = [
    {
      name: 'hydrated import',
      hydration: 'Imported 9:41 AM · fresh',
      freshness: 'fresh',
      viz: { ok: true, passed: 9, total: 10 },
      expect: {
        hydration: 'Parquet hydration applied',
        freshness: 'fresh',
        viz: 'Viz 9/10',
        warnVisible: false,
        meta: 'Applied · fresh · Viz 9/10',
      },
    },
    {
      name: 'pending — no bundle',
      hydration: 'No bundle imported — panels degraded',
      freshness: '—',
      viz: null,
      badge: { text: 'Viz 6/9 · WARN', warn: true },
      expect: {
        hydration: 'Parquet hydration pending',
        freshness: '—',
        viz: 'Viz 6/9',
        warnVisible: true,
        meta: 'Pending · Viz 6/9 · WARN',
      },
    },
    {
      name: 'stale bundle',
      hydration: 'Stale bundle — re-import recommended',
      freshness: 'stale',
      viz: { ok: false, passed: 7, total: 10 },
      expect: {
        hydration: 'Parquet hydration stale',
        freshness: 'stale',
        viz: 'Viz 7/10',
        warnVisible: true,
        meta: 'Stale · stale · Viz 7/10 · WARN',
      },
    },
    {
      name: 'degraded import',
      hydration: 'Render fallback — critical',
      freshness: 'Freshness — delayed',
      viz: { ok: true, passed: 10, total: 10 },
      expect: {
        hydration: 'Parquet hydration pending',
        freshness: 'delayed',
        viz: 'Viz 10/10',
        warnVisible: false,
        meta: 'Pending · delayed · Viz 10/10',
      },
    },
    {
      name: 'empty sources',
      hydration: '—',
      freshness: '—',
      viz: null,
      badge: { text: 'Viz —', warn: false },
      expect: {
        hydration: '—',
        freshness: '—',
        viz: 'Viz —',
        warnVisible: false,
        meta: '—',
      },
    },
  ];

  for (const tc of cases) {
    const { ctx, nodes } = createShellHarness();
    nodes.get('hydrationImportStatus').textContent = tc.hydration;
    nodes.get('headerFreshnessLabel').textContent = tc.freshness;
    ctx.__vizDiagnostics = tc.viz;
    if (tc.badge) {
      const badge = nodes.get('vizDiagnosticsBadge');
      badge.textContent = tc.badge.text;
      badge.classList.toggle('viz-diagnostics--warn', tc.badge.warn);
    }

    ctx.WTM_IaShell.syncDepthLaddersStatus();

    const hydrationEl = nodes.get('depthStatusHydration');
    const freshnessEl = nodes.get('depthStatusFreshness');
    const vizEl = nodes.get('depthStatusViz');
    const warnEl = nodes.get('depthStatusWarn');
    const metaEl = nodes.get('depthPanelMeta');

    assert(hydrationEl.textContent === tc.expect.hydration, `${tc.name}: hydration`);
    assert(freshnessEl.textContent === tc.expect.freshness, `${tc.name}: freshness`);
    assert(vizEl.textContent === tc.expect.viz, `${tc.name}: viz`);
    assert(
      !warnEl.classList.contains('depth-status-badge--hidden') === tc.expect.warnVisible,
      `${tc.name}: WARN visibility`,
    );
    assert(
      warnEl.getAttribute('aria-hidden') === (tc.expect.warnVisible ? 'false' : 'true'),
      `${tc.name}: WARN aria-hidden`,
    );
    assert(metaEl.textContent === tc.expect.meta, `${tc.name}: panel meta`);
    assert(ctx.WTM_IaShell.syncDepthPanelMeta() === tc.expect.meta, `${tc.name}: syncDepthPanelMeta return`);
  }

  const { ctx, nodes } = createShellHarness();
  nodes.delete('depthStatusHydration');
  nodes.get('headerFreshnessLabel').textContent = 'should-not-sync';
  ctx.WTM_IaShell.syncDepthLaddersStatus();
  assert(nodes.get('depthStatusFreshness').textContent === '—', 'status body no-ops when hydration mount missing');
  assert(nodes.get('depthPanelMeta').textContent === '—', 'panel meta stays empty when body status unwritten');
}

function runAssembleDepthLaddersWidgetTests() {
  const { ctx, hosts, disclosure, commandBar } = createShellHarness();
  disclosure.open = false;

  ctx.WTM_IaShell.assembleDepthLaddersWidget();

  assert(hosts.depthLaddersContent?.includes('consoleDepthDisclosure'), 'disclosure relocated into depthLaddersContent');
  assert(disclosure.parentElement?.id === 'depthLaddersContent', 'disclosure parent is content host');
  assert(disclosure.id === 'consoleDepthDisclosure', 'disclosure id preserved');
  assert(commandBar.id === 'commandBar', 'command bar id preserved');
  assert(disclosure.open === false, 'collapse state preserved after relocation');

  disclosure.open = true;
  ctx.WTM_IaShell.assembleDepthLaddersWidget();
  assert(disclosure.open === true, 'expanded state preserved on repeat assembly');
  assert(hosts.depthLaddersContent?.filter((id) => id === 'consoleDepthDisclosure').length === 1, 'no duplicate relocation');

  const fallback = createShellHarness();
  fallback.nodes.delete('depthLaddersContent');
  fallback.ctx.WTM_IaShell.assembleDepthLaddersWidget();
  assert(
    fallback.hosts.iaDepthHost?.includes('consoleDepthDisclosure'),
    'fallback relocates disclosure to iaDepthHost when content host missing',
  );
}

function runShellIntegrationChecks() {
  const shellSrc = fs.readFileSync(path.join(ROOT, 'js/console_ia_shell.js'), 'utf8');
  assert(shellSrc.includes('assembleDepthLaddersWidget'), 'assembler present');
  assert(shellSrc.includes('observeDepthLaddersStatus'), 'depth status observer wired');
  assert(shellSrc.includes('syncDepthLaddersStatus()'), 'status sync invoked from observers');
  assert(shellSrc.includes('syncDepthPanelMeta'), 'Depth panel meta sync present');
  assert(shellSrc.includes('syncDepthLaddersStatus,'), 'status sync exported on WTM_IaShell');
  assert(shellSrc.includes('syncDepthPanelMeta,'), 'panel meta exported on WTM_IaShell');

  const uiPolish = fs.readFileSync(path.join(ROOT, 'js/ui_polish.js'), 'utf8');
  assert(uiPolish.includes('syncDepthLaddersStatus'), 'viz diagnostics triggers depth status sync');
}

function serveStatic(root) {
  return http.createServer((req, res) => {
    const url = (req.url || '/').split('?')[0];
    const file = path.join(root, url === '/' ? 'index.html' : url.replace(/^\//, ''));
    if (!file.startsWith(root) || !fs.existsSync(file)) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    const ext = path.extname(file);
    const types = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
    };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
}

async function runE2eChecks() {
  let playwright;
  try {
    playwright = await import('playwright');
  } catch {
    console.log('SKIP depth_ladders_widget e2e — playwright not installed');
    return;
  }

  const dist = path.join(ROOT, 'dist');
  assert(fs.existsSync(path.join(dist, 'index.html')), 'dist build required for e2e — run scripts/build.sh');

  const server = serveStatic(dist);
  const listenPort = await new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(0, () => resolve(server.address().port));
  });

  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.includes('127.0.0.1') || url.includes('localhost')) return route.continue();
    return route.abort();
  });

  await page.goto(`http://127.0.0.1:${listenPort}/?safe_boot=1`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForFunction(() => window.__WTM_BOOTED === true, { timeout: 20000 });

  const structure = await page.evaluate(() => {
    const widget = document.getElementById('depthLaddersWidget');
    const host = document.getElementById('iaDepthHost');
    const disclosure = document.getElementById('consoleDepthDisclosure');
    const content = document.getElementById('depthLaddersContent');
    const commandBar = document.getElementById('commandBar');
    return {
      widgetInHost: !!widget && host?.contains(widget),
      statusId: !!document.getElementById('depthLaddersStatus'),
      vizRegion: !!document.querySelector('#depthLaddersWidget .ladder-viz-region'),
      disclosureInContent: content?.contains(disclosure),
      commandBarInDisclosure: disclosure?.contains(commandBar),
      disclosureId: disclosure?.id,
      collapsed: disclosure ? !disclosure.open : null,
      headerText: document.querySelector('#widgetDepth .depth-ladders-widget__title')?.textContent?.trim() || '',
    };
  });

  assert(structure.widgetInHost, 'e2e: widget inside iaDepthHost');
  assert(structure.statusId, 'e2e: status row present');
  assert(structure.vizRegion, 'e2e: ladder viz placeholder present');
  assert(structure.disclosureInContent, 'e2e: disclosure relocated into depthLaddersContent');
  assert(structure.commandBarInDisclosure, 'e2e: command bar still inside disclosure');
  assert(structure.disclosureId === 'consoleDepthDisclosure', 'e2e: disclosure id preserved');
  assert(structure.collapsed === true, 'e2e: disclosure starts collapsed');
  assert(structure.headerText.includes('Depth'), 'e2e: widget header visible');

  await page.keyboard.press('Alt+l');
  await page.waitForTimeout(400);
  const focused = await page.evaluate(() => {
    const panel = document.getElementById('widgetDepth');
    return {
      active: panel?.classList.contains('is-active'),
      aria: document.querySelector('[data-ia-view-shortcut="depth_ladders"]')?.getAttribute('aria-current'),
    };
  });
  assert(focused.active || focused.aria === 'true', 'e2e: Alt+L focuses depth widget');

  await page.evaluate(() => {
    const d = document.getElementById('consoleDepthDisclosure');
    if (d) d.open = true;
  });
  const expanded = await page.evaluate(() => {
    const d = document.getElementById('consoleDepthDisclosure');
    const bar = document.getElementById('commandBar');
    return { open: d?.open === true, barPresent: !!bar };
  });
  assert(expanded.open && expanded.barPresent, 'e2e: disclosure expand reveals command bar');

  const statusAfterViz = await page.evaluate(() => {
    window.__vizDiagnostics = { ok: false, passed: 4, total: 9, checks: [], at: new Date().toISOString() };
    window.WTM_IaShell?.syncDepthLaddersStatus?.();
    return {
      viz: document.getElementById('depthStatusViz')?.textContent,
      warnHidden: document.getElementById('depthStatusWarn')?.classList.contains('depth-status-badge--hidden'),
    };
  });
  assert(statusAfterViz.viz === 'Viz 4/9', 'e2e: injected viz diagnostics sync to status row');
  assert(statusAfterViz.warnHidden === false, 'e2e: WARN chip visible when diagnostics fail');

  await browser.close();
  server.close();

  if (errors.length) throw new Error(`e2e console errors: ${errors.join('; ')}`);
}

async function run() {
  runDomStructureChecks();
  runCssScopingChecks();
  runSyncDepthLaddersStatusUnitTests();
  runAssembleDepthLaddersWidgetTests();
  runShellIntegrationChecks();
  await runE2eChecks();
  console.log('PASS depth_ladders_widget.test.mjs');
}

run().catch((err) => {
  console.error(`FAIL depth_ladders_widget.test.mjs: ${err.message}`);
  process.exit(1);
});