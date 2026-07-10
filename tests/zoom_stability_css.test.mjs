#!/usr/bin/env node
/**
 * Chunk 30 — Zoom Stability CSS gates.
 *
 * Behavioral zoom (80/100/110/125%) is layout/scroll + LWC ResizeObserver,
 * not rem renames or root zoom:/transform:scale.
 *
 * Fail if:
 *   - zoom: or transform: scale on html / body / .wtm-ia-shell
 *   - flex chain missing min-height: 0 (shell → center → dig host)
 *   - critical center canvas / basis-watch main still overflow: clip/hidden only
 *   - LWC factory missing ResizeObserver → chart.resize path
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

/**
 * Strip CSS block comments so regex gates ignore commented examples.
 */
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, ' ');
}

/**
 * Extract a single top-level rule body for selector (first match).
 * Handles simple selectors; not a full CSS parser.
 */
function ruleBody(css, selectorRe) {
  const src = stripComments(css);
  const re = new RegExp(selectorRe.source + '\\s*\\{([^}]*)\\}', selectorRe.flags.includes('i') ? 'i' : '');
  const m = src.match(re);
  return m ? m[1] : null;
}

function hasDecl(body, prop, valueRe) {
  if (!body) return false;
  const re = new RegExp(
    prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*:\\s*([^;]+);',
    'i'
  );
  const m = body.match(re);
  if (!m) return false;
  return valueRe.test(m[1].trim());
}

function testNoRootZoomOrScale() {
  const files = [
    'css/console_ia.css',
    'css/basis_watch.css',
    'css/main.css',
    'css/theme.css',
    'css/ui_polish.css',
  ];
  for (const rel of files) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    const css = stripComments(read(rel));

    // Forbidden: zoom on html, body, or .wtm-ia-shell
    const zoomOnRoot =
      /(?:^|[,}\s])html\s*\{[^}]*\bzoom\s*:/i.test(css) ||
      /(?:^|[,}\s])body\s*\{[^}]*\bzoom\s*:/i.test(css) ||
      /\.wtm-ia-shell\s*\{[^}]*\bzoom\s*:/i.test(css);
    assert(!zoomOnRoot, `${rel}: forbidden zoom: on html/body/.wtm-ia-shell`);

    // Forbidden: transform: scale(...) on those roots
    const scaleOnRoot =
      /(?:^|[,}\s])html\s*\{[^}]*transform\s*:[^;]*\bscale\s*\(/i.test(css) ||
      /(?:^|[,}\s])body\s*\{[^}]*transform\s*:[^;]*\bscale\s*\(/i.test(css) ||
      /\.wtm-ia-shell\s*\{[^}]*transform\s*:[^;]*\bscale\s*\(/i.test(css);
    assert(!scaleOnRoot, `${rel}: forbidden transform: scale on html/body/.wtm-ia-shell`);
  }
}

function testFlexChainMinHeightZero() {
  const css = read('css/console_ia.css');
  const shell = ruleBody(css, /\.wtm-ia-shell/);
  assert(shell, '.wtm-ia-shell rule present');
  assert(hasDecl(shell, 'min-height', /^0$/), '.wtm-ia-shell has min-height: 0');
  assert(hasDecl(shell, 'min-width', /^0$/), '.wtm-ia-shell has min-width: 0');

  const center = ruleBody(css, /\.ia-center-canvas/);
  assert(center, '.ia-center-canvas rule present');
  assert(hasDecl(center, 'min-height', /^0$/), '.ia-center-canvas has min-height: 0');
  assert(hasDecl(center, 'min-width', /^0$/), '.ia-center-canvas has min-width: 0');

  // dig host appears in a multi-selector rule with scan/cockpit
  const digGroup = ruleBody(css, /\.ia-scan-host\s*,\s*\n?\s*\.ia-cockpit-host\s*,\s*\n?\s*\.ia-dig-host/);
  const digSolo = ruleBody(css, /\.ia-dig-host/);
  const digBody = digGroup || digSolo;
  assert(digBody, '.ia-dig-host rule present');
  assert(hasDecl(digBody, 'min-height', /^0$/), '.ia-dig-host has min-height: 0');
  assert(hasDecl(digBody, 'min-width', /^0$/), '.ia-dig-host has min-width: 0');
}

function testScrollableCriticalRegions() {
  const consoleCss = stripComments(read('css/console_ia.css'));
  const bwCss = stripComments(read('css/basis_watch.css'));

  const center = ruleBody(consoleCss, /\.ia-center-canvas/);
  assert(center, '.ia-center-canvas rule for overflow check');
  // Must be scrollable (auto/scroll/overlay), not only hidden/clip
  assert(
    hasDecl(center, 'overflow', /^(auto|scroll|overlay)$/i) ||
      hasDecl(center, 'overflow-y', /^(auto|scroll|overlay)$/i),
    '.ia-center-canvas must use overflow: auto (or scroll) for zoom — not hidden/clip alone'
  );
  assert(!hasDecl(center, 'overflow', /^(hidden|clip)$/i), '.ia-center-canvas must not use overflow: hidden|clip');

  // basis-watch main — console embed and standalone
  const embedMain = ruleBody(consoleCss, /\.ia-center-canvas\s+\.basis-watch-main/);
  if (embedMain) {
    assert(
      hasDecl(embedMain, 'overflow', /^(auto|scroll|overlay)$/i) ||
        hasDecl(embedMain, 'overflow-y', /^(auto|scroll|overlay)$/i),
      '.ia-center-canvas .basis-watch-main must be scrollable'
    );
  }

  const bwMain = ruleBody(bwCss, /\.basis-watch-main/);
  assert(bwMain, '.basis-watch-main rule present');
  assert(
    hasDecl(bwMain, 'overflow', /^(auto|scroll|overlay)$/i) ||
      hasDecl(bwMain, 'overflow-y', /^(auto|scroll|overlay)$/i),
    '.basis-watch-main must use overflow: auto (Chunk 30 critical scroll region)'
  );
}

function testChartMountMinHeight() {
  const bw = stripComments(read('css/basis_watch.css'));
  const mount = ruleBody(bw, /\.wtm-lwc-mount/);
  assert(mount, '.wtm-lwc-mount rule present');
  assert(hasDecl(mount, 'display', /^block$/i), '.wtm-lwc-mount display: block');
  assert(
    hasDecl(mount, 'min-height', /^(?!0(?:px)?$)\S+/),
    '.wtm-lwc-mount has non-zero min-height (not height:auto alone)'
  );

  const curve = ruleBody(bw, /#bwCurveCanvas,\s*\.bw-curve-canvas,\s*\.wtm-lwc-mount\.bw-curve-canvas/);
  assert(curve, 'BW curve chart container rule present');
  assert(hasDecl(curve, 'display', /^block$/i), 'curve mount display: block');
  assert(hasDecl(curve, 'min-height', /\d+/), 'curve mount has min-height');
}

function testResizeObserverPath() {
  const factory = read('js/charts/lwc_factory.js');
  assert(/ResizeObserver/.test(factory), 'lwc_factory wires ResizeObserver');
  assert(/chart\.resize/.test(factory), 'lwc_factory calls chart.resize');
  assert(/observeResize|ro\.observe|ResizeObserver\s*\(/.test(factory), 'ResizeObserver observes container');
}

function run() {
  testNoRootZoomOrScale();
  testFlexChainMinHeightZero();
  testScrollableCriticalRegions();
  testChartMountMinHeight();
  testResizeObserverPath();
  console.log('zoom_stability_css.test.mjs: ok');
}

run();
