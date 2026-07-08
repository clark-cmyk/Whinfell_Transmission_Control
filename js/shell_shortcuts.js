/**
 * Shell keyboard shortcuts — left nav + top utilities.
 * Windows/Linux: Alt+<key> · Alt+Shift+<key>
 * macOS: ⌃⌥+<key> (Ctrl+Option, accesskey parity) · ⌃⌥⇧+<key>; Option+<key> via event.code
 */
(function shellShortcuts(global) {
  'use strict';

  const FOCUS_CLASS = 'shell-shortcut-focus';
  const FOCUS_MS = 1800;
  const EDITABLE = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

  const IS_MAC = (() => {
    if (typeof navigator === 'undefined') return false;
    const platform = navigator.userAgentData?.platform || navigator.platform || '';
    return /Mac|iPhone|iPad|iPod/i.test(platform);
  })();

  let focusTimer = null;
  let bound = false;

  function isEditableTarget(target) {
    if (!target || target.isContentEditable) return true;
    const tag = target.tagName;
    if (EDITABLE.has(tag)) return true;
    return Boolean(target.closest?.('[contenteditable="true"]'));
  }

  function normalizeKey(key) {
    if (!key || key.length !== 1) return '';
    return key.toLowerCase();
  }

  function eventShortcutKey(event) {
    const code = event.code || '';
    const letter = code.match(/^Key([A-Z])$/i);
    if (letter) return letter[1].toLowerCase();
    const digit = code.match(/^Digit([0-9])$/);
    if (digit) return digit[1];
    return normalizeKey(event.key);
  }

  function keysMatch(el, event) {
    const wanted = normalizeKey(el.dataset.shortcut);
    if (!wanted) return false;
    return eventShortcutKey(event) === wanted;
  }

  function shortcutChordActive(event) {
    if (event.metaKey || !event.altKey) return false;
    if (IS_MAC) return true;
    return !event.ctrlKey;
  }

  function modifierMatches(el, event) {
    const mod = (el.dataset.shortcutMod || 'alt').toLowerCase();
    const wantsShift = mod.includes('shift');
    const wantsAlt = mod.includes('alt');

    if (!shortcutChordActive(event)) return false;
    if (wantsShift && !event.shiftKey) return false;
    if (!wantsShift && event.shiftKey) return false;
    if (!wantsAlt) return false;

    if (IS_MAC) {
      if (event.ctrlKey && event.altKey) return true;
      return event.altKey && !event.ctrlKey;
    }

    return event.altKey && !event.ctrlKey;
  }

  function formatModLabel(mod) {
    const key = (mod || 'alt').toLowerCase();
    const wantsShift = key.includes('shift');
    if (IS_MAC) {
      const parts = ['⌃⌥'];
      if (wantsShift) parts.push('⇧');
      return parts.join('');
    }
    const parts = [];
    if (key.includes('alt')) parts.push('Alt');
    if (wantsShift) parts.push('Shift');
    return parts.join('+');
  }

  function formatShortcutLabel(el) {
    const key = (el.dataset.shortcut || '').toUpperCase();
    if (!key) return '';
    const mod = el.dataset.shortcutMod || 'alt';
    const modLabel = formatModLabel(mod);
    if (IS_MAC) return `${modLabel}${key}`;
    return `${modLabel}+${key}`;
  }

  function appendShortcutToTitle(el) {
    const hint = formatShortcutLabel(el);
    if (!hint) return;
    const base = el.getAttribute('title') || el.textContent?.trim() || '';
    if (!base || base.includes(hint)) return;
    const stripped = base.replace(/\s*\([^)]*\)\s*$/, '').trim();
    el.setAttribute('title', stripped ? `${stripped} (${hint})` : hint);
  }

  function syncShortcutTitles(root) {
    const doc = root || global.document;
    doc.querySelectorAll('[data-shortcut]').forEach(appendShortcutToTitle);
  }

  function ensureFocusable(el) {
    if (!el || el.disabled) return;
    const tag = el.tagName;
    if (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT') return;
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  }

  function pulseFocus(el) {
    if (!el) return;
    el.classList.add(FOCUS_CLASS);
    ensureFocusable(el);
    try {
      el.focus({ preventScroll: true });
    } catch (_err) {
      try { el.focus(); } catch (_e2) { /* ignore */ }
    }
    if (focusTimer) global.clearTimeout(focusTimer);
    focusTimer = global.setTimeout(() => {
      el.classList.remove(FOCUS_CLASS);
    }, FOCUS_MS);
  }

  function triggerTarget(el) {
    if (!el || el.disabled) return false;
    const tag = el.tagName;
    if (tag === 'BUTTON' || tag === 'A') {
      el.click();
    } else {
      el.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
    }
    pulseFocus(el);
    return true;
  }

  function buildShortcutMap(root) {
    const doc = root || global.document;
    const map = new Map();
    doc.querySelectorAll('[data-shortcut]').forEach((el) => {
      const key = normalizeKey(el.dataset.shortcut);
      if (!key) return;
      const mod = (el.dataset.shortcutMod || 'alt').toLowerCase();
      map.set(`${mod}:${key}`, el);
    });
    return map;
  }

  function handleKeydown(event, map) {
    if (!shortcutChordActive(event)) return;
    if (isEditableTarget(event.target)) return;

    const key = eventShortcutKey(event);
    if (!key) return;

    const candidates = [
      `alt-shift:${key}`,
      `alt:${key}`,
    ];

    for (const id of candidates) {
      const el = map.get(id);
      if (!el || !modifierMatches(el, event) || !keysMatch(el, event)) continue;
      event.preventDefault();
      event.stopPropagation();
      triggerTarget(el);
      return;
    }
  }

  function bindShortcuts(root) {
    if (bound) return buildShortcutMap(root);
    const doc = root || global.document;
    const map = buildShortcutMap(doc);
    syncShortcutTitles(doc);
    doc.addEventListener('keydown', (event) => handleKeydown(event, map), true);
    bound = true;
    return map;
  }

  function init(root) {
    return bindShortcuts(root);
  }

  const api = Object.freeze({
    FOCUS_CLASS,
    FOCUS_MS,
    IS_MAC,
    formatModLabel,
    formatShortcutLabel,
    eventShortcutKey,
    shortcutChordActive,
    modifierMatches,
    keysMatch,
    normalizeKey,
    buildShortcutMap,
    syncShortcutTitles,
    triggerTarget,
    pulseFocus,
    bindShortcuts,
    init,
  });

  global.WTM_ShellShortcuts = api;

  if (typeof document !== 'undefined') {
    const boot = () => {
      try {
        init();
      } catch (err) {
        console.warn('[WTM_ShellShortcuts] init failed', err);
      }
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);