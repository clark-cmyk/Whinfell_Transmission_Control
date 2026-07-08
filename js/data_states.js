/**
 * WTM Data States — canonical 7-state reliability taxonomy (Phase 1).
 * Healthy · Partial · Blocked · Unavailable · Stale · Quarantined · Not computed
 *
 * Every metric binds to a state object: { state, status, value, display, reason, freshness }.
 */
(function dataStates(global) {
  'use strict';

  const DATA_STATES_BUILD = '1.0.0-PHASE1';

  /** Classification precedence — highest wins when multiple flags are set. */
  const PRIORITY = Object.freeze([
    'quarantined', 'blocked', 'unavailable', 'stale', 'partial', 'not_computed', 'healthy',
  ]);

  const STATES = Object.freeze([...PRIORITY]);

  const LABELS = Object.freeze({
    healthy: 'Healthy',
    partial: 'Partial',
    blocked: 'Blocked',
    unavailable: 'Unavailable',
    stale: 'Stale',
    quarantined: 'Quarantined',
    not_computed: 'Not computed',
  });

  const MEANINGS = Object.freeze({
    healthy: {
      meaning: 'Computed and fresh',
      uiTreatment: 'Normal display with freshness marker',
    },
    partial: {
      meaning: 'Some dependencies missing but output still usable',
      uiTreatment: 'Warning chip with reduced-confidence messaging',
    },
    blocked: {
      meaning: 'Policy or gate prevents use',
      uiTreatment: 'Disabled interaction with explicit reason',
    },
    unavailable: {
      meaning: 'Source absent or not imported',
      uiTreatment: 'Empty-state treatment with remediation path',
    },
    stale: {
      meaning: 'Source older than threshold',
      uiTreatment: 'Stale chip plus age detail',
    },
    quarantined: {
      meaning: 'Validation or adapter mismatch failure',
      uiTreatment: 'Distinct error styling and lineage link',
    },
    not_computed: {
      meaning: 'Pipeline has inputs but no completed calculation',
      uiTreatment: 'Neutral pending state with compute action or explanation',
    },
  });

  const DEFAULT_REASONS = Object.freeze(
    Object.fromEntries(PRIORITY.map(s => [s, MEANINGS[s].meaning])),
  );

  /** Maps desk diagnostic failure keys (core.js) → canonical state. */
  const FAILURE_KEY_MAP = Object.freeze({
    missing_source: 'unavailable',
    field_unmapped: 'unavailable',
    transform_failed: 'quarantined',
    sample_insufficient: 'partial',
    data_stale: 'stale',
    gate_suppressed: 'blocked',
    derived_unavailable: 'not_computed',
  });

  const FLAG_BY_STATE = Object.freeze({
    quarantined: 'quarantined',
    blocked: 'blocked',
    unavailable: 'unavailable',
    stale: 'stale',
    partial: 'partial',
    not_computed: 'not_computed',
  });

  function isState(s) {
    return typeof s === 'string' && STATES.includes(s);
  }

  function normalize(state) {
    return isState(state) ? state : 'not_computed';
  }

  function cssClass(state) {
    return `ds--${normalize(state)}`;
  }

  function escapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function isBlank(v) {
    if (v == null) return true;
    if (typeof v === 'number') return Number.isNaN(v);
    const s = String(v).trim();
    return !s || s === '—' || s === '-' || s === 'N/A' || s === 'n/a';
  }

  function classify(value, meta) {
    const m = meta || {};
    for (const st of PRIORITY) {
      const flag = FLAG_BY_STATE[st];
      if (flag && m[flag]) return st;
      if (st === 'not_computed' && (m.notComputed || m.not_computed)) return st;
    }
    if (isState(m.state)) return m.state;
    if (isBlank(value)) {
      if (m.hydrated === false) return 'unavailable';
      return m.allowPartial ? 'partial' : 'not_computed';
    }
    if (m.freshness === 'stale' || (m.freshness === 'aging' && m.strictFresh)) return 'stale';
    if (m.freshness === 'aging') return 'partial';
    return 'healthy';
  }

  function reasonFor(state, meta) {
    const m = meta || {};
    const st = normalize(state);
    if (m.reason) return String(m.reason);
    if (st === 'blocked' && m.blockReason) return String(m.blockReason);
    if ((st === 'partial' || st === 'stale' || st === 'quarantined') && m.hint) return String(m.hint);
    return DEFAULT_REASONS[st];
  }

  function displayValue(value, state) {
    const st = normalize(state);
    if (st === 'not_computed') return LABELS.not_computed;
    if (st === 'unavailable') return LABELS.unavailable;
    if (st === 'quarantined') return LABELS.quarantined;
    if (isBlank(value)) return LABELS[st] || '—';
    return String(value);
  }

  function isSemanticNull(value, state) {
    const st = normalize(state);
    if (st === 'not_computed' || st === 'unavailable' || st === 'quarantined') return true;
    return isBlank(value);
  }

  function makeState(value, meta) {
    const m = meta || {};
    const state = classify(value, m);
    const display = displayValue(value, state);
    const reason = reasonFor(state, m);
    let freshness = m.freshness || null;
    if (!freshness) {
      if (state === 'healthy') freshness = 'fresh';
      else if (state === 'stale') freshness = 'stale';
      else if (state === 'partial') freshness = 'aging';
    }
    return Object.freeze({
      state,
      status: state,
      value: isSemanticNull(value, state) ? null : value,
      display,
      reason,
      freshness,
      label: LABELS[state],
      cssClass: cssClass(state),
      meaning: MEANINGS[state].meaning,
      uiTreatment: MEANINGS[state].uiTreatment,
    });
  }

  function resolve(value, meta) {
    return makeState(value, meta);
  }

  function fromFailureKey(key) {
    return FAILURE_KEY_MAP[key] || 'not_computed';
  }

  function fromDiagnostic(key) {
    return fromFailureKey(key);
  }

  function failureMeta(key, extra) {
    const state = fromFailureKey(key);
    const base = { ...(extra || {}) };
    const flag = FLAG_BY_STATE[state];
    if (flag) base[flag] = true;
    if (!base.reason) base.reason = base.hint || DEFAULT_REASONS[state];
    return base;
  }

  function fromFreshness(status) {
    if (status === 'stale') return { stale: true, freshness: 'stale' };
    if (status === 'aging') return { partial: true, freshness: 'aging' };
    if (status === 'fresh') return { freshness: 'fresh' };
    return { unavailable: true, freshness: status || 'unknown' };
  }

  function badgeHtml(state) {
    const st = normalize(state);
    return `<span class="ds-state-badge ${cssClass(st)}" data-data-state="${st}" aria-label="Data state">${LABELS[st]}</span>`;
  }

  function apply(el, state, opts) {
    if (!el) return;
    const o = opts || {};
    const resolved = makeState(o.value, { ...(o.meta || {}), ...(isState(state) ? { state } : {}) });
    const st = resolved.state;
    el.dataset.dataState = st;
    if (el.dataset) el.dataset.agentReason = resolved.reason;
    el.classList.remove(...STATES.map(s => `ds--${s}`));
    el.classList.add('ds-tile', cssClass(st));
    if (o.label) {
      const lab = el.querySelector('.ds-label') || el.querySelector('.label');
      if (lab) lab.textContent = o.label;
    }
    if (o.value !== undefined) {
      const val = el.querySelector('.ds-value') || el.querySelector('strong');
      if (val) val.textContent = resolved.display;
    }
    const metaTxt = o.meta?.hint || o.meta?.meta || o.meta || '';
    if (metaTxt && typeof metaTxt === 'string') {
      const metaEl = el.querySelector('.ds-meta') || el.querySelector('.meta');
      if (metaEl) metaEl.textContent = metaTxt;
    }
    const badge = el.querySelector('.ds-state-badge');
    if (badge) badge.textContent = resolved.label;
  }

  function tileHtml(id, label, value, state, meta) {
    const m = meta || {};
    const resolved = makeState(value, isState(state) ? { ...m, state } : m);
    const st = resolved.state;
    const metaTxt = m.hint || m.meta || '';
    return `<div id="${escapeHtml(id)}" class="ds-tile ${resolved.cssClass}" data-data-state="${st}" data-agent-kpi="${escapeHtml(id)}" data-agent-reason="${escapeHtml(resolved.reason)}">
      <span class="ds-label">${escapeHtml(label)}</span>
      <span class="ds-state-badge" aria-label="Data state">${resolved.label}</span>
      <strong class="ds-value">${escapeHtml(resolved.display)}</strong>
      ${metaTxt ? `<span class="ds-meta">${escapeHtml(metaTxt)}</span>` : ''}
    </div>`;
  }

  function cellHtml(value, state, meta) {
    const m = meta || {};
    const resolved = makeState(value, isState(state) ? { ...m, state } : m);
    return `<td class="ds-cell ${resolved.cssClass}" data-data-state="${resolved.state}" data-agent-reason="${escapeHtml(resolved.reason)}" title="${escapeHtml(resolved.reason)}">${escapeHtml(resolved.display)}</td>`;
  }

  global.WTM_DataStates = {
    DATA_STATES_BUILD,
    STATES,
    PRIORITY,
    LABELS,
    MEANINGS,
    DEFAULT_REASONS,
    FAILURE_KEY_MAP,
    isState,
    normalize,
    cssClass,
    escapeHtml,
    isBlank,
    classify,
    reasonFor,
    displayValue,
    isSemanticNull,
    makeState,
    resolve,
    fromFailureKey,
    fromDiagnostic,
    failureMeta,
    fromFreshness,
    badgeHtml,
    apply,
    tileHtml,
    cellHtml,
  };
})(typeof window !== 'undefined' ? window : globalThis);