/**
 * Top utility control registry — Lego config layer (Chunk 01 / Phase 4 · Chunk 02 slim header).
 * Unifies header utility chips and action-row button styling via config, not inline classes.
 */
(function topUtilityRegistry(global) {
  'use strict';

  const BUILD = '1.0.0-CHUNK02';
  const CHIP_BASE = 'console-chip';

  /** Header layout — tune compression without touching render logic. */
  const HEADER_LAYOUT = Object.freeze({
    compactMeta: true,
  });

  const TIER_SUFFIX = Object.freeze({
    meta: 'console-chip--meta',
    external: 'console-chip--external',
    action: 'console-chip--action',
    mode: 'console-chip--mode',
  });

  const VARIANT_SUFFIX = Object.freeze({
    default: 'console-chip--default',
    primary: 'console-chip--primary',
    accent: 'console-chip--accent',
    save: 'console-chip--save',
    build: 'console-chip--build',
  });

  /** Tech-meta strip — build badge, dictionary, docs, collect, external links, workspace toggle. */
  const TOP_UTILITY_REGISTRY = Object.freeze([
    {
      id: 'build',
      domId: 'tcConsoleBuildBadge',
      kind: 'badge',
      tier: 'meta',
      variant: 'build',
      label: '—',
      compactLabel: 'Build',
      title: 'Operator-console build — hard-refresh if stale',
    },
    {
      id: 'dictionary',
      domId: 'ddVersionBadge',
      kind: 'link',
      tier: 'meta',
      label: '',
      compactLabel: 'DD',
      href: 'https://github.com/clark-cmyk/Whinfell_BUILD_Cousins/blob/main/whinfell_pipeline/data_dictionary.yaml',
      target: '_blank',
      rel: 'noopener noreferrer',
      title: 'Open Master Data Dictionary',
    },
    {
      id: 'docs',
      domId: 'btnDeskDocs',
      kind: 'button',
      tier: 'action',
      label: 'Docs',
      title: 'Open desk documentation links',
    },
    {
      id: 'collect',
      domId: 'btnMorningCollect',
      kind: 'button',
      tier: 'action',
      variant: 'primary',
      label: 'Collect CSVs',
      title: 'One-click Barchart + Koyfin CSV fetch via collect agent (python3 scripts/whinfell_collect_agent.py)',
      extraClass: 'wtm-collect-btn',
    },
    {
      id: 'refresh-data',
      domId: 'btnDeskRefresh',
      kind: 'button',
      tier: 'action',
      variant: 'accent',
      label: 'Refresh data',
      compactLabel: 'Refresh',
      title: 'Reload hydration, BasisWatch curve, Midwest Compute, and all desk panels',
      extraClass: 'wtm-refresh-btn',
    },
    {
      id: 'publish-web',
      domId: 'btnPublishWeb',
      kind: 'button',
      tier: 'action',
      variant: 'accent',
      label: 'Publish Web',
      compactLabel: 'Publish',
      title: 'Build + push latest bundle to gh-pages (bash scripts/publish_ghpages.sh)',
      extraClass: 'wtm-publish-btn',
    },
    {
      id: 'collect-agent-status',
      domId: 'btnCollectAgentStatus',
      kind: 'button',
      tier: 'action',
      variant: 'default',
      label: 'Agent ○',
      title: 'Collect agent status (127.0.0.1:8767) — click when offline for start command',
      extraClass: 'wtm-collect-agent-status wtm-collect-agent--offline',
    },
    {
      id: 'koyfin',
      domId: 'headerLinkKoyfin',
      kind: 'link',
      tier: 'external',
      label: 'Koyfin ↗',
      href: 'https://app.koyfin.com/',
      target: '_blank',
      rel: 'noopener noreferrer',
      title: 'Open Koyfin desk',
    },
    {
      id: 'barchart',
      domId: 'headerLinkBarchart',
      kind: 'link',
      tier: 'external',
      label: 'Barchart ↗',
      href: 'https://www.barchart.com/futures/major-commodities',
      target: '_blank',
      rel: 'noopener noreferrer',
      title: 'Open Barchart futures',
    },
    {
      id: 'workspace',
      domId: 'btnWorkspaceToggle',
      kind: 'button',
      tier: 'mode',
      label: 'Node Cockpits',
      title: 'Toggle workspace view',
    },
  ]);

  /** Action row — import, export, save, theme. */
  const ACTION_BUTTON_REGISTRY = Object.freeze([
    { id: 'btnImportHydration', tier: 'action', variant: 'accent', label: 'Import hydration' },
    { id: 'btnImport', tier: 'action', variant: 'primary', label: 'Import WTM' },
    { id: 'btnExport', tier: 'action', variant: 'default', label: 'Export' },
    { id: 'btnExportPipeline', tier: 'action', variant: 'default', label: 'Pipeline bundle' },
    { id: 'btnSave', tier: 'action', variant: 'save', label: 'Save' },
    { id: 'btnTheme', tier: 'action', variant: 'default', label: 'Light mode' },
  ]);

  function chipClasses(entry) {
    const parts = [CHIP_BASE, TIER_SUFFIX[entry.tier] || TIER_SUFFIX.action];
    if (entry.variant && VARIANT_SUFFIX[entry.variant]) {
      parts.push(VARIANT_SUFFIX[entry.variant]);
    }
    if (entry.primary && !entry.variant) {
      parts.push(VARIANT_SUFFIX.primary);
    }
    if (entry.extraClass) parts.push(entry.extraClass);
    return parts.join(' ');
  }

  function actionButtonClasses(entry) {
    const parts = ['btn-console', CHIP_BASE, TIER_SUFFIX[entry.tier] || TIER_SUFFIX.action];
    if (entry.variant && VARIANT_SUFFIX[entry.variant]) {
      parts.push(VARIANT_SUFFIX[entry.variant]);
    }
    return parts.join(' ');
  }

  function resolveUtilityLabel(entry) {
    const useCompact = HEADER_LAYOUT.compactMeta && entry.compactLabel;
    if (useCompact) return entry.compactLabel;
    return entry.label || '';
  }

  function resolveUtilityTitle(entry) {
    if (entry.title) return entry.title;
    if (HEADER_LAYOUT.compactMeta && entry.compactLabel && entry.label) {
      return `${entry.compactLabel} — ${entry.label}`;
    }
    return entry.compactLabel || entry.label || '';
  }

  function createUtilityNode(entry) {
    let node;
    if (entry.kind === 'link') {
      node = document.createElement('a');
      if (entry.href) node.href = entry.href;
      if (entry.target) node.target = entry.target;
      if (entry.rel) node.rel = entry.rel;
    } else if (entry.kind === 'button') {
      node = document.createElement('button');
      node.type = 'button';
    } else {
      node = document.createElement('span');
    }
    node.id = entry.domId;
    const classes = chipClasses(entry);
    const compact = HEADER_LAYOUT.compactMeta && entry.compactLabel;
    node.className = compact ? `${classes} console-chip--compact` : classes;
    node.textContent = resolveUtilityLabel(entry);
    const title = resolveUtilityTitle(entry);
    if (title) node.title = title;
    node.dataset.utilityId = entry.id;
    if (compact) node.dataset.compact = 'true';
    return node;
  }

  function renderTechMetaStrip(mountEl) {
    if (!mountEl) return null;
    const frag = document.createDocumentFragment();
    TOP_UTILITY_REGISTRY.forEach((entry) => {
      frag.appendChild(createUtilityNode(entry));
    });
    mountEl.replaceChildren(frag);
    return mountEl;
  }

  function applyActionRowChips(root) {
    const doc = root || document;
    ACTION_BUTTON_REGISTRY.forEach((entry) => {
      const el = doc.getElementById(entry.id);
      if (!el) return;
      el.className = actionButtonClasses(entry);
    });
    return ACTION_BUTTON_REGISTRY.length;
  }

  function normalizeTopControls(root) {
    const doc = root || document;
    const metaMount = doc.querySelector('.console-tech-meta');
    if (metaMount) renderTechMetaStrip(metaMount);
    return applyActionRowChips(doc);
  }

  const api = Object.freeze({
    BUILD,
    CHIP_BASE,
    HEADER_LAYOUT,
    TIER_SUFFIX,
    VARIANT_SUFFIX,
    TOP_UTILITY_REGISTRY,
    ACTION_BUTTON_REGISTRY,
    chipClasses,
    actionButtonClasses,
    resolveUtilityLabel,
    resolveUtilityTitle,
    createUtilityNode,
    renderTechMetaStrip,
    applyActionRowChips,
    normalizeTopControls,
  });

  global.WTM_TopUtility = api;

  if (typeof document !== 'undefined') {
    const boot = () => {
      try {
        normalizeTopControls();
      } catch (err) {
        console.warn('[WTM_TopUtility] normalize failed', err);
      }
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);