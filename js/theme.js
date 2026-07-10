/**
 * WTM Theme System — Chunk 26
 * Single source for Dark / Light / Nature tokens, localStorage, data-theme.
 * No neon / generic AI accent colors — forest brand accents only.
 */
(function themeModule(global) {
  'use strict';

  const STORAGE_KEY = 'whinfell_tc_theme';
  const DEFAULT_THEME_ID = 'dark';
  const EVENT_NAME = 'wtm:themechange';

  const THEMES = Object.freeze({
    dark: Object.freeze({
      id: 'dark',
      label: 'Dark',
      bg: '#0A0A0A',
      surface: '#1A1A1A',
      text: '#FFFFFF',
      accent: '#228B22',
    }),
    light: Object.freeze({
      id: 'light',
      label: 'Light',
      bg: '#F8F9F6',
      surface: '#FFFFFF',
      text: '#1F2937',
      accent: '#228B22',
    }),
    nature: Object.freeze({
      id: 'nature',
      label: 'Nature',
      bg: '#F1F5F2',
      surface: '#FFFFFF',
      text: '#1F2937',
      accent: '#1E6B2B',
    }),
  });

  const THEME_IDS = Object.freeze(Object.keys(THEMES));

  let currentId = DEFAULT_THEME_ID;

  function normalizeThemeId(id) {
    if (id == null) return DEFAULT_THEME_ID;
    const key = String(id).trim().toLowerCase();
    if (THEMES[key]) return key;
    return DEFAULT_THEME_ID;
  }

  function hexToRgb(hex) {
    const h = String(hex || '').replace('#', '').trim();
    if (h.length !== 6) return { r: 0, g: 0, b: 0 };
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }

  function withAlpha(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function deriveTokens(theme) {
    return {
      muted: withAlpha(theme.text, 0.6),
      border: withAlpha(theme.text, 0.12),
      chartGrid: withAlpha(theme.text, 0.07),
      chartLine: theme.accent,
      accentSoft: withAlpha(theme.accent, 0.14),
      surface2: theme.id === 'dark' ? '#242424' : withAlpha(theme.text, 0.04),
    };
  }

  function writeCssVars(theme) {
    const root = document.documentElement;
    if (!root?.style?.setProperty) return;
    const derived = deriveTokens(theme);
    root.style.setProperty('--wtm-bg', theme.bg);
    root.style.setProperty('--wtm-surface', theme.surface);
    root.style.setProperty('--wtm-text', theme.text);
    root.style.setProperty('--wtm-accent', theme.accent);
    root.style.setProperty('--wtm-muted', derived.muted);
    root.style.setProperty('--wtm-border', derived.border);
    root.style.setProperty('--wtm-chart-grid', derived.chartGrid);
    root.style.setProperty('--wtm-chart-line', derived.chartLine);
    root.style.setProperty('--wtm-accent-soft', derived.accentSoft);
    root.style.setProperty('--wtm-surface-2', derived.surface2);
  }

  function readStoredThemeId() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (_) {
      return null;
    }
  }

  function writeStoredThemeId(id) {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch (_) {
      /* private browsing */
    }
  }

  function syncThemeControls(id) {
    const doc = document;
    if (!doc) return;

    const select = doc.getElementById('themeSelect');
    if (select && select.value !== id) {
      select.value = id;
    }

    const bwSelect = doc.getElementById('bwThemeSelect');
    if (bwSelect && bwSelect.value !== id) {
      bwSelect.value = id;
    }

    const btn = doc.getElementById('btnTheme');
    if (btn) {
      const theme = THEMES[id] || THEMES.dark;
      btn.textContent = theme.label;
      if (typeof btn.setAttribute === 'function') {
        btn.setAttribute('aria-pressed', id !== 'dark' ? 'true' : 'false');
        btn.setAttribute('data-theme-id', id);
      }
    }

    const bwBtn = doc.getElementById('btnBwTheme');
    if (bwBtn) {
      const label = bwBtn.querySelector?.('.bw-theme-label');
      const theme = THEMES[id] || THEMES.dark;
      if (label) label.textContent = theme.label;
      else if ('textContent' in bwBtn) bwBtn.textContent = theme.label;
      if (typeof bwBtn.setAttribute === 'function') {
        bwBtn.setAttribute('aria-pressed', id !== 'dark' ? 'true' : 'false');
        bwBtn.setAttribute('data-theme-id', id);
        bwBtn.title = `Theme: ${theme.label}`;
      }
    }

    const themeColor = doc.getElementById('bwThemeColor');
    if (themeColor && typeof themeColor.setAttribute === 'function') {
      const theme = THEMES[id] || THEMES.dark;
      themeColor.setAttribute('content', theme.bg);
    }
  }

  function dispatchThemeChange(theme) {
    if (typeof global.dispatchEvent !== 'function') return;
    try {
      global.dispatchEvent(new CustomEvent(EVENT_NAME, {
        detail: {
          theme: theme.id,
          tokens: {
            bg: theme.bg,
            surface: theme.surface,
            text: theme.text,
            accent: theme.accent,
          },
        },
      }));
    } catch (_) {
      /* ignore */
    }
    /* legacy alias for older listeners */
    try {
      global.dispatchEvent(new CustomEvent('whinfell-theme-change', {
        detail: { theme: theme.id },
      }));
    } catch (_) {
      /* ignore */
    }
  }

  function applyTheme(id) {
    const nextId = normalizeThemeId(id);
    const theme = THEMES[nextId];
    currentId = nextId;

    if (document?.documentElement?.setAttribute) {
      document.documentElement.setAttribute('data-theme', nextId);
    }

    writeCssVars(theme);
    writeStoredThemeId(nextId);
    syncThemeControls(nextId);
    dispatchThemeChange(theme);
    return nextId;
  }

  function getTheme() {
    return THEMES[currentId] || THEMES[DEFAULT_THEME_ID];
  }

  function getAccent() {
    return getTheme().accent;
  }

  function getThemeId() {
    return currentId;
  }

  function wireThemeSelect(selectEl) {
    if (!selectEl || typeof selectEl.addEventListener !== 'function') return;
    selectEl.addEventListener('change', () => {
      applyTheme(selectEl.value);
    });
  }

  function ensureSelectOptions(selectEl) {
    if (!selectEl) return;
    const existing = new Set(
      Array.from(selectEl.options || []).map((o) => o.value)
    );
    THEME_IDS.forEach((id) => {
      if (existing.has(id)) return;
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = THEMES[id].label;
      selectEl.appendChild(opt);
    });
  }

  function initTheme(options) {
    const opts = options || {};
    let initial = opts.theme || null;

    if (!initial && typeof location !== 'undefined' && location.search) {
      try {
        initial = new URLSearchParams(location.search).get('theme');
      } catch (_) {
        initial = null;
      }
    }

    if (!initial) {
      initial = readStoredThemeId() || DEFAULT_THEME_ID;
    }

    applyTheme(initial);

    const root = opts.root || document;
    if (root) {
      const themeSelect = root.getElementById?.('themeSelect') || root.querySelector?.('#themeSelect');
      const bwThemeSelect = root.getElementById?.('bwThemeSelect') || root.querySelector?.('#bwThemeSelect');
      ensureSelectOptions(themeSelect);
      ensureSelectOptions(bwThemeSelect);
      wireThemeSelect(themeSelect);
      wireThemeSelect(bwThemeSelect);
      syncThemeControls(currentId);
    }

    return currentId;
  }

  const api = Object.freeze({
    STORAGE_KEY,
    DEFAULT_THEME_ID,
    EVENT_NAME,
    THEMES,
    THEME_IDS,
    normalizeThemeId,
    deriveTokens,
    applyTheme,
    initTheme,
    getTheme,
    getThemeId,
    getAccent,
    syncThemeControls,
    hexToRgb,
    withAlpha,
  });

  global.WTM_Theme = api;

  if (typeof document !== 'undefined') {
    const boot = () => {
      try {
        initTheme();
      } catch (err) {
        console.warn('[WTM_Theme] init failed', err);
      }
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
