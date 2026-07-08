#!/usr/bin/env node
/** build_web.sh — full GitHub Pages bundle verification. */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

execSync('bash scripts/build_web.sh', { cwd: ROOT, stdio: 'pipe' });

const required = [
  'index.html',
  '404.html',
  'BUILD_MANIFEST.json',
  'BUILD_STAMP.txt',
  '.nojekyll',
  'Whinfell_Midwest_Compute_Crush.html',
  'Crypto_Analytics.html',
  'Whinfell_BasisWatch.html',
  'midwest_compute/wmc.css',
  'midwest_compute/wmc-boot.js',
  'crypto_analytics/ca.css',
  'crypto_analytics/ca-app.js',
  'js/wmc_ia_panel.js',
  'js/publish_web_panel.js',
  'data/hydration/latest.json',
];

required.forEach((rel) => {
  assert(fs.existsSync(path.join(DIST, rel)), `missing dist/${rel}`);
});

const manifest = JSON.parse(fs.readFileSync(path.join(DIST, 'BUILD_MANIFEST.json'), 'utf8'));
assert(manifest.repo === 'clark-cmyk/Whinfell_Transmission_Control', 'manifest.repo');
assert(manifest.pages_url?.includes('github.io/Whinfell_Transmission_Control'), 'manifest.pages_url');
assert(manifest.published_at, 'manifest.published_at');
assert(manifest.build_id, 'manifest.build_id');

console.log('build_web.test.mjs PASS');