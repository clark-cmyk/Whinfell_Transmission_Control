#!/usr/bin/env node
/** Browser launch gate — playwright screenshot + console error check. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import http from 'node:http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCRATCH = process.env.SCRATCH || '/var/folders/qn/gdsdhg9j3f77wk7fn889zbq40000gn/T/grok-goal-0353ff2e1563/implementer';
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.DESK_PORT) || 0;

function serveStatic(root) {
  return http.createServer((req, res) => {
    const url = (req.url || '/').split('?')[0];
    const file = path.join(root, url === '/' ? 'index.html' : url.replace(/^\//, ''));
    if (!file.startsWith(root) || !fs.existsSync(file)) {
      res.writeHead(404); res.end('not found'); return;
    }
    const ext = path.extname(file);
    const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
}

async function curlScripts() {
  const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script src="(js\/[^"]+)"/g)].map(m => m[1]);
  for (const s of scripts) {
    const p = path.join(DIST, s);
    if (!fs.existsSync(p)) throw new Error(`missing script ${s}`);
  }
  return scripts.length;
}

async function main() {
  fs.mkdirSync(SCRATCH, { recursive: true });
  const scriptCount = await curlScripts();
  console.log(`static audit: ${scriptCount} script tags OK`);

  let playwright;
  try {
    playwright = await import('playwright');
  } catch {
    fs.writeFileSync(path.join(SCRATCH, 'launch_fallback.log'), 'playwright not installed — static audit only\n');
    console.log('playwright unavailable — wrote launch_fallback.log');
    return;
  }

  const server = serveStatic(DIST);
  const listenPort = await new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(PORT, () => resolve(server.address().port));
  });

  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.includes('127.0.0.1') || url.includes('localhost')) return route.continue();
    return route.abort();
  });

  await page.goto(`http://127.0.0.1:${listenPort}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => window.__WTM_BOOTED === true, { timeout: 15000 });

  const booted = await page.evaluate(() => ({
    booted: window.__WTM_BOOTED,
    bootText: document.getElementById('js-boot-check')?.textContent || '',
  }));

  const creditTab = page.locator('[data-node-id="credit"]');
  if (await creditTab.count()) await creditTab.click();
  else await page.keyboard.press('2');
  await page.waitForTimeout(800);
  const bannerVisible = await page.locator('#basisTacticalBanner').isVisible();

  await page.screenshot({ path: path.join(SCRATCH, 'desk_launch.png'), fullPage: false });

  await browser.close();
  server.close();

  if (errors.length) throw new Error(`console errors: ${errors.join('; ')}`);
  if (!booted.booted) throw new Error(`__WTM_BOOTED false; bootText=${booted.bootText}`);
  if (!bannerVisible) throw new Error('basisTacticalBanner not visible');

  console.log('PASS desk_launch.mjs — RENDER SUCCESS, tactical banner visible');
}

main().catch((err) => {
  console.error(`FAIL desk_launch.mjs: ${err.message}`);
  process.exit(1);
});