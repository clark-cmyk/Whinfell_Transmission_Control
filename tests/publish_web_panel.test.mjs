#!/usr/bin/env node
/** Publish Web panel — registry + github.io host detection. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const registryCode = fs.readFileSync(path.join(ROOT, 'js/top_utility_registry.js'), 'utf8');
const registryCtx = { window: {}, document: { readyState: 'complete' } };
vm.runInNewContext(registryCode, registryCtx);
const reg = registryCtx.window.WTM_TopUtility;
assert(reg, 'WTM_TopUtility missing');
const publishEntry = reg.TOP_UTILITY_REGISTRY.find((e) => e.id === 'publish-web');
assert(publishEntry?.domId === 'btnPublishWeb', 'publish-web registry entry');

const panelCode = fs.readFileSync(path.join(ROOT, 'js/publish_web_panel.js'), 'utf8');
const panelCtx = {
  window: {
    location: { hostname: 'clark-cmyk.github.io' },
    document: {
      readyState: 'complete',
      getElementById: () => ({ classList: { add() {} }, _publishWebBound: true }),
    },
  },
  globalThis: {},
  fetch: async () => ({ ok: false }),
  console: { log() {} },
};
vm.runInNewContext(panelCode, panelCtx);
const pub = panelCtx.window.WTM_PublishWeb;
assert(pub, 'WTM_PublishWeb missing');
assert(pub.isWebHost() === true, 'isWebHost on github.io');
assert(pub.PAGES_URL.includes('Whinfell_Transmission_Control'), 'PAGES_URL');

panelCtx.window.location.hostname = 'localhost';
vm.runInNewContext(panelCode, {
  ...panelCtx,
  window: {
    ...panelCtx.window,
    location: { hostname: 'localhost' },
    document: panelCtx.window.document,
  },
});
assert(panelCtx.window.WTM_PublishWeb.isWebHost() === false, 'isWebHost on localhost');

console.log('publish_web_panel.test.mjs PASS');