#!/usr/bin/env node
/** Shell keyboard shortcuts — cross-platform + macOS ⌃⌥ chords. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

class ElementShim {
  constructor(tag = 'button', id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.className = '';
    this.classList = {
      _set: new Set(),
      add: (...cls) => cls.forEach((c) => this.classList._set.add(c)),
      remove: (...cls) => cls.forEach((c) => this.classList._set.delete(c)),
      contains: (c) => this.classList._set.has(c),
      toggle: () => {},
    };
    this.dataset = {};
    this.disabled = false;
    this.title = 'Jump to Risk Cockpit (Alt+R)';
    this.textContent = 'Risk Cockpit';
    this.clicked = 0;
    this.focused = 0;
    this.attributes = { title: this.title };
  }

  click() { this.clicked += 1; }

  focus() { this.focused += 1; }

  hasAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name);
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
    if (name === 'title') this.title = value;
  }

  getAttribute(name) {
    return this.attributes[name] ?? null;
  }

  scrollIntoView() {}
}

function loadShortcuts(platform = 'Win32') {
  const code = fs.readFileSync(path.join(ROOT, 'js/shell_shortcuts.js'), 'utf8');
  const risk = new ElementShim('button', 'risk');
  risk.dataset.shortcut = 'r';
  risk.dataset.shortcutMod = 'alt';

  const collect = new ElementShim('button', 'collect');
  collect.dataset.shortcut = 'c';
  collect.dataset.shortcutMod = 'alt-shift';

  const keyHandlers = [];
  const sandbox = {
    window: {},
    navigator: { platform, userAgentData: null },
    document: {
      readyState: 'complete',
      querySelectorAll(sel) {
        if (sel === '[data-shortcut]') return [risk, collect];
        return [];
      },
      addEventListener(type, fn) {
        if (type === 'keydown') keyHandlers.push(fn);
      },
    },
    setTimeout: () => 1,
    clearTimeout() {},
    console,
  };
  sandbox.window = sandbox;
  vm.runInNewContext(code, sandbox, { filename: 'shell_shortcuts.js' });
  return { SS: sandbox.window.WTM_ShellShortcuts, risk, collect, keyHandlers };
}

function loadRegistry(platform = 'Win32') {
  const shortcuts = loadShortcuts(platform);
  const code = fs.readFileSync(path.join(ROOT, 'js/top_utility_registry.js'), 'utf8');
  const sandbox = {
    window: { WTM_ShellShortcuts: shortcuts.SS },
    navigator: { platform, userAgentData: null },
    document: {
      readyState: 'complete',
      addEventListener() {},
      querySelector() { return null; },
      getElementById() { return null; },
      createElement(tag) {
        return new ElementShim(tag);
      },
    },
    console,
  };
  sandbox.window = sandbox;
  sandbox.WTM_ShellShortcuts = shortcuts.SS;
  vm.runInNewContext(code, sandbox, { filename: 'top_utility_registry.js' });
  return { WTM: sandbox.WTM_TopUtility, SS: shortcuts.SS };
}

const { SS, risk, collect, keyHandlers } = loadShortcuts();
const { WTM } = loadRegistry();

assert(SS, 'WTM_ShellShortcuts exported');
assert(SS.IS_MAC === false, 'default test platform is not Mac');
assert(keyHandlers.length === 1, 'keydown listener registered');

const map = SS.buildShortcutMap();
assert(map.get('alt:r') === risk, 'left nav risk mapped');
assert(map.get('alt-shift:c') === collect, 'top collect mapped');

assert(SS.eventShortcutKey({ code: 'KeyR', key: '¬' }) === 'r', 'mac option special char resolves via code');
assert(SS.modifierMatches(risk, { altKey: true, shiftKey: false, ctrlKey: false, metaKey: false }), 'alt+r match');
assert(!SS.modifierMatches(risk, { altKey: true, shiftKey: true, ctrlKey: false, metaKey: false }), 'alt+shift+r rejected for nav');
assert(SS.modifierMatches(collect, { altKey: true, shiftKey: true, ctrlKey: false, metaKey: false }), 'alt+shift+c match');
assert(SS.keysMatch(risk, { code: 'KeyR', key: '¬' }), 'keysMatch uses event.code');

SS.triggerTarget(risk);
assert(risk.clicked === 1, 'triggerTarget clicks button');
assert(risk.classList.contains('shell-shortcut-focus'), 'focus ring applied');

const handler = keyHandlers[0];
const input = { tagName: 'INPUT', isContentEditable: false };
handler({
  altKey: true, shiftKey: false, ctrlKey: false, metaKey: false, code: 'KeyR', key: 'r',
  target: input, preventDefault() {}, stopPropagation() {},
});
assert(risk.clicked === 1, 'ignored while typing in input');

handler({
  altKey: true, shiftKey: false, ctrlKey: false, metaKey: false, code: 'KeyR', key: '¬',
  target: { tagName: 'BODY' }, preventDefault() {}, stopPropagation() {},
});
assert(risk.clicked === 2, 'option+r with special char key still fires');

handler({
  altKey: true, shiftKey: true, ctrlKey: false, metaKey: false, code: 'KeyC', key: 'c',
  target: { tagName: 'BODY' }, preventDefault() {}, stopPropagation() {},
});
assert(collect.clicked === 1, 'alt+shift+c fires collect shortcut');

const docs = WTM.TOP_UTILITY_REGISTRY.find((e) => e.id === 'docs');
const docsNode = WTM.createUtilityNode(docs);
assert(docsNode.dataset.shortcut === 'd', 'docs shortcut on node');
assert(docsNode.title.includes('Alt+Shift+D'), 'windows docs title includes shortcut hint');

const mac = loadShortcuts('MacIntel');
assert(mac.SS.IS_MAC === true, 'mac platform detected');
assert(mac.SS.formatModLabel('alt') === '⌃⌥', 'mac nav modifier label');
assert(mac.SS.formatModLabel('alt-shift') === '⌃⌥⇧', 'mac top modifier label');
assert(
  mac.SS.modifierMatches(mac.risk, { altKey: true, ctrlKey: true, shiftKey: false, metaKey: false }),
  'mac ctrl+option chord accepted for nav',
);
mac.keyHandlers[0]({
  altKey: true, ctrlKey: true, shiftKey: false, metaKey: false, code: 'KeyR', key: 'r',
  target: { tagName: 'BODY' }, preventDefault() {}, stopPropagation() {},
});
assert(mac.risk.clicked === 1, 'mac ctrl+option+r fires nav shortcut');

mac.SS.syncShortcutTitles({
  querySelectorAll(sel) {
    if (sel === '[data-shortcut]') return [mac.risk];
    return [];
  },
});
assert(mac.risk.title.includes('⌃⌥R'), 'mac title rewritten with ctrl+option hint');

const macRegistry = loadRegistry('MacIntel');
const macDocs = macRegistry.WTM.createUtilityNode(macRegistry.WTM.TOP_UTILITY_REGISTRY.find((e) => e.id === 'docs'));
assert(macDocs.title.includes('⌃⌥⇧D'), 'mac registry title uses ctrl+option+shift hint');

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const shellPos = html.indexOf('js/shell_shortcuts.js');
const registryPos = html.indexOf('js/top_utility_registry.js');
assert(shellPos > 0 && shellPos < registryPos, 'shell_shortcuts loads before top_utility_registry');

const css = fs.readFileSync(path.join(ROOT, 'css/console_ia.css'), 'utf8');
assert(css.includes('.shell-shortcut-focus'), 'focus ring styles present');

console.log('shell_shortcuts.test.mjs — all assertions passed');