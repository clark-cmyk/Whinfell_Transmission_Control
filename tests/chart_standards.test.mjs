#!/usr/bin/env node
/**
 * Chunk 29 — Chart Standards: LWC factory options use theme accent,
 * no gradient/area helpers, wrappers exported, primary mounts are LWC hosts.
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

function loadFactory(themeApi) {
  const src = fs.readFileSync(path.join(ROOT, 'js/charts/lwc_factory.js'), 'utf8');
  const sandbox = {
    console,
    window: {},
    document: {
      documentElement: {
        style: { setProperty() {}, getPropertyValue() { return ''; } },
      },
    },
    getComputedStyle: () => ({
      getPropertyValue: (name) => {
        if (name === '--wtm-accent' || name === '--wtm-chart-line') return '#228B22';
        if (name === '--wtm-chart-grid') return 'rgba(255,255,255,0.07)';
        if (name === '--wtm-surface') return '#1A1A1A';
        if (name === '--wtm-bg') return '#0A0A0A';
        if (name === '--wtm-text') return '#FFFFFF';
        if (name === '--wtm-muted') return 'rgba(255,255,255,0.6)';
        if (name === '--wtm-chart-axis') return 'rgba(255,255,255,0.6)';
        return '';
      },
    }),
    WTM_Theme: themeApi || {
      getAccent: () => '#228B22',
      getTheme: () => ({
        id: 'dark',
        bg: '#0A0A0A',
        surface: '#1A1A1A',
        text: '#FFFFFF',
        accent: '#228B22',
      }),
    },
    ResizeObserver: class {
      observe() {}
      disconnect() {}
    },
    addEventListener() {},
    removeEventListener() {},
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.runInContext(src, vm.createContext(sandbox), { filename: 'lwc_factory.js' });
  return sandbox.WTM_Charts;
}

function testFactoryOptions() {
  const Charts = loadFactory();
  assert(Charts, 'WTM_Charts exported');
  assert(typeof Charts.buildChartOptions === 'function', 'buildChartOptions');
  assert(typeof Charts.createLineChart === 'function', 'createLineChart');
  assert(typeof Charts.applyThemeToChart === 'function', 'applyThemeToChart');
  assert(typeof Charts.destroyChart === 'function', 'destroyChart');
  assert(typeof Charts.dteToUtcTime === 'function', 'dteToUtcTime');
  assert(typeof Charts.mapDteSeries === 'function', 'mapDteSeries');
  assert(typeof Charts.buildLineSeriesOptions === 'function', 'buildLineSeriesOptions');

  const opts = Charts.buildChartOptions();
  assert(opts.layout?.background, 'layout background present');
  assert(opts.grid?.vertLines?.color, 'vert grid color');
  assert(opts.grid?.horzLines?.color, 'horz grid color');
  assert(
    Math.abs(opts.rightPriceScale.scaleMargins.top - 0.05) < 1e-9,
    'tight top scaleMargins 0.05'
  );
  assert(
    Math.abs(opts.rightPriceScale.scaleMargins.bottom - 0.05) < 1e-9,
    'tight bottom scaleMargins 0.05'
  );
  assert(opts.rightPriceScale.borderVisible === false, 'price scale border hidden');
  assert(opts.timeScale.borderVisible === false, 'time scale border hidden');

  const line = Charts.buildLineSeriesOptions();
  assert(line.color === '#228B22', `line accent color got ${line.color}`);
  assert(line.lineWidth === 2, 'line width 2');
  assert(!('topColor' in line) && !('bottomColor' in line), 'no area gradient colors on line opts');

  const tokens = Charts.resolveThemeTokens();
  assert(tokens.accent === '#228B22', 'resolveThemeTokens accent');
  assert(tokens.grid, 'resolveThemeTokens grid');

  // Nature accent
  const nature = loadFactory({
    getAccent: () => '#1E6B2B',
    getTheme: () => ({
      id: 'nature',
      bg: '#F1F5F2',
      surface: '#FFFFFF',
      text: '#1F2937',
      accent: '#1E6B2B',
    }),
  });
  assert(nature.buildLineSeriesOptions().color === '#1E6B2B', 'nature accent on line');

  // DTE mapping approach A
  const t0 = Charts.dteToUtcTime(0);
  const t30 = Charts.dteToUtcTime(30);
  assert(t30 - t0 === 30 * 86400, 'DTE maps to +dte days in seconds');
  const mapped = Charts.mapDteSeries([
    { dte: 30, value: 5.1 },
    { dte: 7, value: 2.2 },
  ]);
  assert(mapped.length === 2, 'mapDteSeries length');
  assert(mapped[0].time < mapped[1].time, 'mapDteSeries sorted by time');
  assert(mapped[0].value === 2.2, 'mapDteSeries preserves values');

  // Forbidden helpers must not exist as real implementations
  const forbidden = Charts.forbiddenHelpers();
  assert(forbidden.createAreaSeries === false, 'no createAreaSeries helper');
  assert(forbidden.createGradientFill === false, 'no createGradientFill helper');
  assert(forbidden.addAreaSeries === false, 'no addAreaSeries helper');
  assert(typeof Charts.createAreaSeries !== 'function', 'createAreaSeries not on API');
  assert(typeof Charts.addAreaSeries !== 'function', 'addAreaSeries not on API');
}

function testFactorySourceGuards() {
  const src = fs.readFileSync(path.join(ROOT, 'js/charts/lwc_factory.js'), 'utf8');
  assert(!/addAreaSeries\s*\(/.test(src), 'factory source must not call addAreaSeries');
  assert(!/createLinearGradient/.test(src), 'factory source must not use canvas gradients');
  assert(/scaleMargins/.test(src), 'factory uses scaleMargins');
  assert(/getAccent|wtm-accent|accent/.test(src), 'factory references accent');
  assert(/ResizeObserver/.test(src), 'factory wires ResizeObserver');
  assert(/wtm:themechange/.test(src), 'factory listens for themechange');
}

function testPrimarySurfacesUseLwcMounts() {
  const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert(index.includes('js/vendor/lightweight-charts.standalone.production.js'), 'index vendors LWC');
  assert(index.includes('js/charts/lwc_factory.js'), 'index loads factory');
  assert(/id="bwCurveCanvas"[^>]*class="[^"]*wtm-lwc-mount/.test(index)
    || /id="bwCurveCanvas"[^>]*class="wtm-lwc-mount/.test(index)
    || index.includes('id="bwCurveCanvas" class="wtm-lwc-mount'), 'bwCurveCanvas is LWC mount');
  assert(!/<canvas id="bwCurveCanvas"/.test(index), 'bwCurveCanvas not canvas');
  assert(!/<canvas id="cockpitRvCanvas"/.test(index), 'cockpitRvCanvas not canvas');
  assert(index.includes('id="cockpitRvCanvas"'), 'cockpitRvCanvas mount present');

  const bw = fs.readFileSync(path.join(ROOT, 'Whinfell_BasisWatch.html'), 'utf8');
  assert(bw.includes('js/vendor/lightweight-charts.standalone.production.js'), 'BW vendors LWC');
  assert(bw.includes('js/charts/lwc_factory.js'), 'BW loads factory');
  assert(!/<canvas id="bwCurveCanvas"/.test(bw), 'standalone BW curve not canvas');

  const ca = fs.readFileSync(path.join(ROOT, 'Crypto_Analytics.html'), 'utf8');
  assert(ca.includes('js/charts/lwc_factory.js'), 'CA loads factory');
  assert(ca.includes('lightweight-charts'), 'CA vendors LWC');

  const bbdm = fs.readFileSync(path.join(ROOT, 'bang_bang_da_machine.html'), 'utf8');
  assert(bbdm.includes('lightweight-charts'), 'BBDM vendors LWC');
  assert(!/chart\.js@/.test(bbdm), 'BBDM no longer loads Chart.js CDN');
  assert(!/<canvas id="historyChart"/.test(bbdm), 'historyChart not canvas');
  assert(bbdm.includes('id="historyChart"'), 'historyChart mount present');
}

function testPanelLocksLwcPath() {
  const bwPanel = fs.readFileSync(path.join(ROOT, 'js/basis_watch_panel.js'), 'utf8');
  assert(/WTM_Charts|createLineChart|mapDteSeries/.test(bwPanel), 'BW panel uses WTM_Charts');
  assert(!/createLinearGradient/.test(bwPanel), 'BW panel dropped gradient curve paint');
  assert(/CHUNK29|Chunk 29|LWC/i.test(bwPanel), 'BW panel documents Chunk 29 LWC');

  const core = fs.readFileSync(path.join(ROOT, 'js/core.js'), 'utf8');
  assert(/WTM_Charts|createLineChart|mapOrdinalSeries/.test(core), 'core RV uses WTM_Charts');
  assert(/Chunk 29/.test(core), 'core documents Chunk 29');

  const caBasis = fs.readFileSync(path.join(ROOT, 'crypto_analytics/ca-basis-chart.js'), 'utf8');
  assert(/WTM_Charts|createLineChart/.test(caBasis), 'CA basis uses LWC factory');

  const vendor = path.join(ROOT, 'js/vendor/lightweight-charts.standalone.production.js');
  assert(fs.existsSync(vendor), 'vendored LWC standalone present');
  const vendorSrc = fs.readFileSync(vendor, 'utf8');
  assert(/LightweightCharts|createChart/.test(vendorSrc), 'vendor exposes createChart');
}

function run() {
  testFactoryOptions();
  testFactorySourceGuards();
  testPrimarySurfacesUseLwcMounts();
  testPanelLocksLwcPath();
  console.log('chart_standards.test.mjs: ok');
}

run();
