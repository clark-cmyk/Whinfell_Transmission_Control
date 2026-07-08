#!/usr/bin/env node
/**
 * Clark human smoke — Depth/Ladders widget desk walk-through.
 * Runs automated pre-flight, opens the desk in a browser, captures evidence,
 * and prints a numbered checklist for operator sign-off.
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCRATCH = process.env.SCRATCH || path.join(ROOT, '08_Deliverables');
const PORT = Number(process.env.CLARK_HUMAN_PORT || process.env.DESK_PORT || 8765);

const CHECKLIST = [
  'Widget header shows pipe icon + "Depth · Command bar & Ladders".',
  'Status row under header: hydration · freshness · Viz score (e.g. Viz 9/10).',
  'WARN chip hidden when all viz checks pass; visible amber pill when any fail.',
  'Dashed ladder viz placeholder (~72px) sits above command bar content.',
  'Command bar KPIs visible after expanding depth band (Gate detail link works).',
  'Ladder clusters still render; IDs preserved (cmdWhinfellScore, gateText, suggestionTray).',
  'Alt+L (Ladders & Depth nav) scrolls/highlights the Depth widget.',
  'After Import hydration, status row updates (not stuck on em-dash).',
];

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function runAutomatedPreflight() {
  console.log('\n==> Automated pre-flight (depth_ladders_widget.test.mjs)');
  const result = spawnSync(process.execPath, ['tests/depth_ladders_widget.test.mjs'], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, SCRATCH },
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  assert(result.status === 0, 'automated depth_ladders_widget suite must PASS before human walk-through');
}

function ensureDist() {
  const index = path.join(ROOT, 'dist', 'index.html');
  if (fs.existsSync(index)) return;
  console.log('\n==> Building dist (scripts/build.sh)…');
  const build = spawnSync('bash', ['scripts/build.sh'], { cwd: ROOT, encoding: 'utf8', stdio: 'inherit' });
  assert(build.status === 0, 'build.sh failed');
  assert(fs.existsSync(index), 'dist/index.html missing after build');
}

function serveStatic(root) {
  return http.createServer((req, res) => {
    const url = (req.url || '/').split('?')[0].split('#')[0];
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
      '.png': 'image/png',
    };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
}

function openBrowser(url) {
  if (process.env.CLARK_HUMAN_NO_OPEN === '1') {
    console.log(`\n(open skipped) ${url}`);
    return;
  }
  const platform = process.platform;
  try {
    if (platform === 'darwin') {
      spawnSync('open', [url], { stdio: 'ignore' });
    } else if (platform === 'win32') {
      spawnSync('cmd', ['/c', 'start', '', url], { stdio: 'ignore' });
    } else {
      spawnSync('xdg-open', [url], { stdio: 'ignore' });
    }
  } catch {
    console.log(`\nCould not auto-open browser — visit: ${url}`);
  }
}

async function captureEvidence(baseUrl, outDir) {
  let playwright;
  try {
    playwright = await import('playwright');
  } catch {
    console.log('\n(playwright not installed — skipping screenshot evidence)');
    return null;
  }

  fs.mkdirSync(outDir, { recursive: true });
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.includes('127.0.0.1') || url.includes('localhost')) return route.continue();
    return route.abort();
  });

  await page.goto(`${baseUrl}/?safe_boot=1`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => window.__WTM_BOOTED === true, { timeout: 20000 });

  await page.evaluate(() => {
    document.getElementById('consoleDepthDisclosure')?.scrollIntoView({ block: 'center' });
    document.getElementById('consoleDepthDisclosure').open = true;
    window.WTM_IaShell?.focusWidget?.('depth_ladders');
  });
  await page.waitForTimeout(600);

  const snapshot = await page.evaluate(() => {
    const status = document.getElementById('depthLaddersStatus');
    const hydration = document.getElementById('depthStatusHydration')?.textContent?.trim();
    const freshness = document.getElementById('depthStatusFreshness')?.textContent?.trim();
    const viz = document.getElementById('depthStatusViz')?.textContent?.trim();
    const warn = document.getElementById('depthStatusWarn');
    return {
      booted: window.__WTM_BOOTED === true,
      header: document.querySelector('#widgetDepth .depth-ladders-widget__title')?.textContent?.trim() || '',
      disclosureInContent: document.getElementById('depthLaddersContent')
        ?.contains(document.getElementById('consoleDepthDisclosure')),
      commandBarPresent: !!document.getElementById('commandBar'),
      hydration,
      freshness,
      viz,
      warnVisible: warn ? !warn.classList.contains('depth-status-badge--hidden') : null,
      statusText: status?.textContent?.replace(/\s+/g, ' ').trim() || '',
    };
  });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const pngPath = path.join(outDir, `clark_depth_ladders_human_${stamp}.png`);
  await page.screenshot({ path: pngPath, fullPage: false });
  await browser.close();

  return { pngPath, snapshot };
}

function printChecklist(url, evidence) {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  CLARK HUMAN — Depth/Ladders Widget Walk-through             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`\nDesk URL: ${url}`);
  if (evidence?.pngPath) console.log(`Screenshot: ${evidence.pngPath}`);
  if (evidence?.snapshot) {
    console.log('\nAutomated snapshot at capture:');
    console.log(`  booted: ${evidence.snapshot.booted}`);
    console.log(`  header: ${evidence.snapshot.header}`);
    console.log(`  status: ${evidence.snapshot.statusText}`);
    console.log(`  disclosure relocated: ${evidence.snapshot.disclosureInContent}`);
    console.log(`  command bar present: ${evidence.snapshot.commandBarPresent}`);
  }

  console.log('\nVerify each item (check when OK):\n');
  CHECKLIST.forEach((step, i) => {
    console.log(`  [ ] ${i + 1}. ${step}`);
  });

  console.log('\nSign-off — copy into 08_Deliverables/Desk_Feedback_Log.md:\n');
  console.log('| Surface | Operator | Rating (1–5) | Pass/Fail | Notes | Date |');
  console.log('|---------|----------|--------------|-----------|-------|------|');
  console.log('| Depth/Ladders widget | Clark | | | | |');
  console.log('\nPre-flight: PASS · Human steps: pending operator');
}

async function main() {
  fs.mkdirSync(SCRATCH, { recursive: true });
  runAutomatedPreflight();
  ensureDist();

  const dist = path.join(ROOT, 'dist');
  const server = serveStatic(dist);
  const listenPort = await new Promise((resolve, reject) => {
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') resolve(PORT);
      else reject(err);
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server.address().port));
  });

  const baseUrl = `http://127.0.0.1:${listenPort}`;
  const deskUrl = `${baseUrl}/?safe_boot=1#widgetDepth`;

  const evidence = await captureEvidence(baseUrl, SCRATCH);
  printChecklist(deskUrl, evidence);
  openBrowser(deskUrl);

  const reportPath = path.join(SCRATCH, 'clark_depth_ladders_human_report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    at: new Date().toISOString(),
    operator: 'Clark',
    surface: 'depth_ladders_widget',
    preflight: 'PASS',
    checklist: CHECKLIST,
    url: deskUrl,
    evidence: evidence?.snapshot || null,
    screenshot: evidence?.pngPath || null,
    humanStatus: 'pending',
  }, null, 2));
  console.log(`\nReport: ${reportPath}`);
  console.log('\nPASS depth_ladders_widget_clark_human.mjs — ready for Clark sign-off');

  server.close();
}

main().catch((err) => {
  console.error(`\nFAIL depth_ladders_widget_clark_human.mjs: ${err.message}`);
  process.exit(1);
});