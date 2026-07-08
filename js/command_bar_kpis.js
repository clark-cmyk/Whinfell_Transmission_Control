/**
 * Command-bar KPI registry — Lego config layer (Phase 2 · Chunk 08 commentary collapse).
 * Renders decision-strip + toolbar KPIs via WTM_DataStates; no layout ownership.
 */
(function commandBarKpis(global) {
  'use strict';

  const BUILD = '1.0.0-CHUNK08';

  const REASONS = Object.freeze({
    importHydration: 'Import hydration bundle for live command-bar metrics',
    importScore: 'Import hydration bundle for live Whinfell Score',
    scoreUnset: 'Whinfell Score not set — import WTM EXPORT or enter score',
    importTransmission: 'Import hydration for transmission health',
    gateScoreRequired: 'Enter Whinfell Score to evaluate gate',
    gateBlocked: 'Policy gate blocks BTC execution',
    gateReduced: 'Reduced gate — client-only sizing',
    importFreshness: 'Import hydration to read pipeline freshness',
    noTimestamp: 'No pipeline timestamp on bundle',
    importSq3: 'Import hydration for SQ3 policy score',
    sq3Unavailable: 'SQ3 policy score not available — check China ladder inputs',
    sq3Caution: (score) => `SQ3 ${score} <50 — China caution on mission nodes`,
    importGross: 'Import hydration for gross risk read',
    grossUnset: 'Gross risk not set — enter book sizing or import WTM EXPORT',
    overrideActive: 'Manual override active — pipeline authority suspended',
    overrideScore: 'Manual override active — score from operator session',
    shockActive: 'Active shock scenario — compress sizing bands',
    shockBaseline: 'Baseline regime — no shock armed',
  });

  /** Chunk 05 — plain-English decision-strip face copy for Score / Gate / Shock. */
  const SEMANTIC_CARD_DISPLAY = Object.freeze({
    whinfell_score: Object.freeze({
      metaFallback: 'Composite 0–100',
      zonePrefix: 'Zone',
    }),
    gate_state: Object.freeze({
      metaFallback: 'BTC sizing permission',
    }),
    shock: Object.freeze({
      faceValue: Object.freeze({
        armed: 'Scenario active',
        clear: 'No scenario',
      }),
      meta: Object.freeze({
        armed: 'Compress sizing bands',
        clear: 'Baseline — no overlay',
      }),
    }),
  });

  /** Chunk 04 — scan strip owns scan-layer badges; command bar defers to value/meta/title. */
  const BADGE_DISPLAY = Object.freeze({
    visibleStates: Object.freeze(['blocked', 'quarantined', 'stale', 'partial']),
    shortLabels: Object.freeze({
      blocked: 'Blocked',
      quarantined: 'Error',
      stale: 'Stale',
      partial: 'Caution',
    }),
    suppressKinds: Object.freeze(['card']),
    chipShowWhenBand: true,
  });

  const BADGE_CHIP_BY_STATE = Object.freeze({
    healthy: 'ds-state-badge status-chip status-chip--fresh',
    stale: 'ds-state-badge status-chip status-chip--stale',
    partial: 'ds-state-badge status-chip status-chip--aging',
    blocked: 'ds-state-badge status-chip status-chip--impaired',
    quarantined: 'ds-state-badge status-chip status-chip--impaired',
    unavailable: 'ds-state-badge status-chip status-chip--info',
    not_computed: 'ds-state-badge status-chip status-chip--info',
  });

  function ds() {
    return global.WTM_DataStates || null;
  }

  function badgeChipCls(state) {
    const st = ds()?.normalize(state) || 'not_computed';
    return BADGE_CHIP_BY_STATE[st] || BADGE_CHIP_BY_STATE.not_computed;
  }

  function resolveBadge(kpi, resolved) {
    const st = resolved.state;
    const suppressed = kpi.badge === false
      || (kpi.badge == null && BADGE_DISPLAY.suppressKinds.includes(kpi.kind));
    if (suppressed) {
      return {
        visible: false,
        text: '',
        cls: `${badgeChipCls(st)} ds-state-badge--hidden`,
        hoverHint: resolved.label,
      };
    }
    const visible = BADGE_DISPLAY.visibleStates.includes(st);
    const baseCls = badgeChipCls(st);
    return {
      visible,
      text: visible ? (BADGE_DISPLAY.shortLabels[st] || resolved.label) : '',
      cls: visible ? baseCls : `${baseCls} ds-state-badge--hidden`,
      hoverHint: visible ? '' : resolved.label,
    };
  }

  function isMissingNumber(v) {
    return v == null || (typeof v === 'number' && Number.isNaN(v));
  }

  /** Chunk 08 — hide empty rationale disclosures in decision strip. */
  function syncMetaDisclosure(metaEl) {
    if (!metaEl?.closest) return;
    const disclosure = metaEl.closest('.cmd-meta-disclosure');
    if (!disclosure?.classList) return;
    const text = (metaEl.textContent || '').trim();
    disclosure.classList.toggle('cmd-meta-disclosure--empty', !text || text === '—');
  }

  /** Composable meta steps — each receives (ctx, meta) and returns meta. */
  const META_STEPS = Object.freeze({
    hydratedOrNotComputed(ctx, m) {
      if (!ctx.prov.hydratedAt) {
        return { ...m, hydrated: false, not_computed: true, reason: m.reason || REASONS.importHydration };
      }
      return { ...m, hydrated: true };
    },
    unavailableIfNoTimestamp(ctx, m) {
      if (ctx.prov.hydratedAt && !ctx.metrics.dataAsOf) {
        return { ...m, unavailable: true, reason: m.reason || REASONS.noTimestamp };
      }
      return m;
    },
    freshnessFromContext(ctx, m) {
      if (!ctx.prov.hydratedAt) return m;
      const status = ctx.freshStatus;
      if (!status || status === 'unknown') return m;
      const DS = ds();
      return DS ? { ...m, ...DS.fromFreshness(status) } : m;
    },
    overridePartial(ctx, m) {
      if (ctx.metrics.source !== 'override') return m;
      return { ...m, partial: true, reason: m.reason || REASONS.overrideActive };
    },
    scoreRequired(ctx, m) {
      if (!ctx.prov.hydratedAt) {
        return { hydrated: false, not_computed: true, reason: REASONS.importScore };
      }
      if (isMissingNumber(ctx.metrics.whinfellScore)) {
        return { hydrated: true, not_computed: true, reason: REASONS.scoreUnset };
      }
      return m;
    },
    scoreFreshness(ctx, m) {
      if (isMissingNumber(ctx.metrics.whinfellScore)) return m;
      let next = META_STEPS.freshnessFromContext(ctx, m);
      delete next.not_computed;
      if (ctx.metrics.source === 'override') {
        next = { ...next, partial: true, reason: REASONS.overrideScore };
      }
      return next;
    },
    transmissionRequired(ctx, m) {
      if (!ctx.prov.hydratedAt) {
        return { hydrated: false, not_computed: true, reason: REASONS.importTransmission };
      }
      return META_STEPS.freshnessFromContext(ctx, { ...m, hydrated: true });
    },
    gateRequired(ctx, m) {
      if (!ctx.prov.hydratedAt && isMissingNumber(ctx.gate.score)) {
        return { hydrated: false, not_computed: true, reason: REASONS.gateScoreRequired };
      }
      if (isMissingNumber(ctx.gate.score)) {
        return { not_computed: true, reason: REASONS.gateScoreRequired };
      }
      return m;
    },
    gatePolicy(ctx, m) {
      let next = META_STEPS.freshnessFromContext(ctx, META_STEPS.overridePartial(ctx, m));
      if (ctx.gate.code === 'blocked') {
        next = {
          ...next,
          blocked: true,
          blockReason: ctx.gate.rule || ctx.gate.bannerSub || REASONS.gateBlocked,
        };
      } else if (ctx.gate.code === 'reduced') {
        next = { ...next, partial: true, reason: ctx.gate.rule || REASONS.gateReduced };
      }
      return next;
    },
    freshnessRequired(ctx, m) {
      if (!ctx.prov.hydratedAt) {
        return { hydrated: false, unavailable: true, reason: REASONS.importFreshness };
      }
      if (!ctx.metrics.dataAsOf || ctx.freshStatus === 'unknown') {
        return { unavailable: true, reason: REASONS.noTimestamp };
      }
      const DS = ds();
      return DS ? DS.fromFreshness(ctx.freshStatus) : m;
    },
    sq3Required(ctx, m) {
      if (!ctx.prov.hydratedAt) {
        return { hydrated: false, not_computed: true, reason: REASONS.importSq3 };
      }
      if (isMissingNumber(ctx.metrics.sq3Score)) {
        return { not_computed: true, reason: REASONS.sq3Unavailable };
      }
      return m;
    },
    sq3Caution(ctx, m) {
      let next = META_STEPS.freshnessFromContext(ctx, { ...m, hydrated: true });
      if (ctx.gate?.sq3Result && ctx.metrics.sq3Score < 50) {
        next = { ...next, partial: true, reason: REASONS.sq3Caution(ctx.metrics.sq3Score) };
      }
      return next;
    },
    grossRequired(ctx, m) {
      if (!ctx.prov.hydratedAt) {
        return { hydrated: false, not_computed: true, reason: REASONS.importGross };
      }
      if (isMissingNumber(ctx.metrics.grossRiskPct)) {
        return { not_computed: true, reason: REASONS.grossUnset };
      }
      return META_STEPS.freshnessFromContext(ctx, { ...m, hydrated: true });
    },
    shockState(ctx, m) {
      if (ctx.shockLabel) {
        return { partial: true, reason: REASONS.shockActive };
      }
      return { state: 'healthy', reason: REASONS.shockBaseline };
    },
  });

  const META_RECIPES = Object.freeze({
    score: ['scoreRequired', 'scoreFreshness'],
    transmission: ['transmissionRequired'],
    gate: ['gateRequired', 'gatePolicy'],
    freshness: ['freshnessRequired'],
    sq3: ['sq3Required', 'sq3Caution'],
    gross: ['grossRequired'],
    shock: ['shockState'],
  });

  function buildMeta(ctx, recipeId) {
    const steps = META_RECIPES[recipeId] || [];
    let meta = {};
    for (const stepId of steps) {
      const step = META_STEPS[stepId];
      if (step) meta = step(ctx, meta) || meta;
    }
    return meta;
  }

  function ensureBadge(card, elFn) {
    if (!card) return null;
    let badge = card.querySelector?.('.ds-state-badge');
    if (!badge && elFn) {
      badge = elFn('span');
      if (badge) {
        badge.className = 'ds-state-badge';
        badge.setAttribute('aria-label', 'Data state');
        const labelEl = card.querySelector?.('.label, .metric-tip');
        if (labelEl?.insertAdjacentElement) labelEl.insertAdjacentElement('afterend', badge);
        else if (card.appendChild) card.appendChild(badge);
      }
    }
    return badge;
  }

  function resolveCard(kpi, ctx, elFn) {
    if (kpi.cardId) return elFn(kpi.cardId);
    if (typeof kpi.cardFrom === 'function') return kpi.cardFrom(ctx, elFn);
    const valueEl = kpi.valueId ? elFn(kpi.valueId) : null;
    return valueEl?.parentElement || null;
  }

  function applyCard(kpi, ctx, elFn) {
    const DS = ds();
    const card = resolveCard(kpi, ctx, elFn);
    const valueEl = kpi.valueId ? elFn(kpi.valueId) : null;
    const metaEl = kpi.metaId ? elFn(kpi.metaId) : null;
    const value = kpi.value(ctx);
    const meta = buildMeta(ctx, kpi.metaRecipe);
    const opts = kpi.display?.(ctx) || {};
    if (!DS || !card) {
      if (valueEl) valueEl.textContent = isMissingNumber(value) ? '—' : String(value);
      return null;
    }
    const resolved = DS.makeState(value, meta);
    const doc = global.document;
    const badge = ensureBadge(card, () => (doc?.createElement ? doc.createElement('span') : null));
    DS.STATES.forEach(s => card.classList.remove(`ds--${s}`));
    card.classList.add('ds-tile', resolved.cssClass);
    card.dataset.dataState = resolved.state;
    card.dataset.agentReason = resolved.reason;
    if (badge) {
      const badgeView = resolveBadge(kpi, resolved);
      badge.textContent = badgeView.text;
      badge.className = badgeView.cls;
      if (badgeView.hoverHint) badge.setAttribute('title', badgeView.hoverHint);
      else if (typeof badge.removeAttribute === 'function') badge.removeAttribute('title');
    }
    if (valueEl) valueEl.textContent = resolved.display;
    if (metaEl) {
      if (opts.preserveMeta !== true) {
        metaEl.textContent = opts.metaText != null ? opts.metaText : resolved.reason;
      } else if (opts.metaText != null) {
        metaEl.textContent = opts.metaText;
      }
      if (resolved.reason) metaEl.title = resolved.reason;
      syncMetaDisclosure(metaEl);
    }
    if (typeof kpi.afterRender === 'function') kpi.afterRender(ctx, resolved, elFn);
    return resolved;
  }

  function applyInline(kpi, ctx, elFn) {
    const DS = ds();
    const node = elFn(kpi.valueId);
    if (!node) return null;
    const value = kpi.value(ctx);
    const meta = buildMeta(ctx, kpi.metaRecipe);
    if (!DS) {
      node.textContent = isMissingNumber(value) ? '—' : String(value);
      return null;
    }
    const resolved = DS.makeState(value, meta);
    const format = kpi.format?.(ctx, resolved);
    node.textContent = format != null ? format : resolved.display;
    node.dataset.dataState = resolved.state;
    node.dataset.agentReason = resolved.reason;
    node.title = resolved.reason;
    DS.STATES.forEach(s => node.classList.remove(`ds--${s}`));
    node.classList.add('ds-inline-kpi', resolved.cssClass);
    if (typeof kpi.afterRender === 'function') kpi.afterRender(ctx, resolved, elFn);
    return resolved;
  }

  function hasSq3Band(band) {
    if (band == null) return false;
    const s = String(band).trim();
    return s.length > 0 && s !== '—' && s !== '-';
  }

  function applyChip(kpi, ctx, elFn, helpers) {
    const node = elFn(kpi.valueId);
    if (!node) return null;
    const band = ctx.metrics.sq3Band;
    if (hasSq3Band(band)) {
      node.textContent = `policy ${band}`;
      node.className = `text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${helpers.sq3ChipCls(ctx.sq3Key)}`;
      node.dataset.dataState = 'healthy';
      node.title = `SQ3 band: ${band}`;
      return ds()?.makeState(band, { state: 'healthy' }) || null;
    }
    const meta = buildMeta(ctx, kpi.metaRecipe);
    const resolved = ds()?.makeState(null, meta);
    if (BADGE_DISPLAY.chipShowWhenBand) {
      node.textContent = '';
      node.className = 'cmd-sq3-band--hidden';
      if (resolved) {
        node.dataset.dataState = resolved.state;
        node.dataset.agentReason = resolved.reason;
        node.title = resolved.reason || resolved.label;
      }
      return resolved;
    }
    node.textContent = resolved?.label || 'Not computed';
    node.className = `text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${helpers.sq3ChipCls('unknown')}`;
    if (resolved) {
      node.dataset.dataState = resolved.state;
      node.dataset.agentReason = resolved.reason;
      node.title = resolved.reason;
    }
    return resolved;
  }

  const DECISION_STRIP_REGISTRY = Object.freeze([
    {
      id: 'whinfell_score',
      kind: 'card',
      cardId: 'scoreCard',
      valueId: 'cmdWhinfellScore',
      metaId: 'cmdScoreZone',
      metaRecipe: 'score',
      value: (ctx) => ctx.metrics.whinfellScore,
      display: (ctx) => {
        const z = ctx.zone?.text;
        const prefix = SEMANTIC_CARD_DISPLAY.whinfell_score.zonePrefix;
        const metaText = z && z !== '—'
          ? `${prefix} · ${z}`
          : SEMANTIC_CARD_DISPLAY.whinfell_score.metaFallback;
        return { preserveMeta: true, metaText };
      },
      afterRender(ctx, _r, elFn) {
        const zoneEl = elFn('cmdScoreZone');
        if (!zoneEl) return;
        const z = ctx.zone;
        zoneEl.className = `meta ${z.key === 'green' ? 'green' : z.key === 'amber' ? 'amber' : z.key === 'red' ? 'red' : ''}`;
      },
    },
    {
      id: 'transmission_health',
      kind: 'card',
      valueId: 'txHealthValue',
      metaId: 'txHealthMeta',
      metaRecipe: 'transmission',
      cardFrom: (_ctx, elFn) => elFn('txHealthValue')?.parentElement,
      value: (ctx) => (ctx.prov.hydratedAt && !Number.isNaN(ctx.health.score) ? ctx.health.score : null),
      display: (ctx) => {
        const h = ctx.health;
        const text = h.label && h.weakestStage && h.weakestStage !== '—'
          ? `${h.label} · Weakest: ${h.weakestStage}`
          : null;
        return { metaText: text };
      },
    },
    {
      id: 'gate_state',
      kind: 'card',
      valueId: 'gateText',
      metaId: 'gateHelperText',
      metaRecipe: 'gate',
      cardFrom: (_ctx, elFn) => elFn('gateText')?.parentElement,
      value: (ctx) => ctx.gateTitle,
      display: () => ({ preserveMeta: true }),
    },
    {
      id: 'shock',
      kind: 'card',
      valueId: 'shockText',
      metaId: 'shockMeta',
      metaRecipe: 'shock',
      cardFrom: (_ctx, elFn) => elFn('shockText')?.parentElement,
      value: (ctx) => {
        const copy = SEMANTIC_CARD_DISPLAY.shock.faceValue;
        return ctx.shockLabel ? ctx.shockLabel.label : copy.clear;
      },
      display: (ctx) => {
        const key = ctx.shockLabel ? 'armed' : 'clear';
        return { metaText: SEMANTIC_CARD_DISPLAY.shock.meta[key] };
      },
    },
    {
      id: 'freshness',
      kind: 'card',
      cardId: 'cmdFreshnessCluster',
      valueId: 'cmdFreshness',
      metaId: 'cmdFreshnessMeta',
      metaRecipe: 'freshness',
      value: (ctx) => (ctx.prov.hydratedAt && ctx.metrics.dataAsOf ? ctx.freshLabel : null),
      display: (ctx) => ({
        preserveMeta: true,
        metaText: ctx.metrics.dataAsOf
          ? new Date(ctx.metrics.dataAsOf).toLocaleString()
          : 'No pipeline timestamp',
      }),
      afterRender(ctx, resolved, elFn) {
        const freshEl = elFn('cmdFreshness');
        if (freshEl && resolved) {
          freshEl.className = `${ctx.helpers.freshnessChipCls(ctx.freshStatus)} ${resolved.cssClass}`.trim();
        }
        const metaEl = elFn('cmdFreshnessMeta');
        if (metaEl) {
          metaEl.title = ctx.metrics.snapshotId
            ? `Snapshot: ${ctx.metrics.snapshotId}`
            : (ctx.metrics.dataAsOf ? String(ctx.metrics.dataAsOf) : '');
        }
      },
    },
  ]);

  const TOOLBAR_REGISTRY = Object.freeze([
    {
      id: 'sq3_score',
      kind: 'inline',
      valueId: 'cmdSq3Score',
      metaRecipe: 'sq3',
      value: (ctx) => ctx.metrics.sq3Score,
      format: (ctx, r) => (r.state === 'healthy' ? `SQ3 policy ${ctx.metrics.sq3Score}` : r.display),
    },
    {
      id: 'sq3_band',
      kind: 'chip',
      valueId: 'cmdSq3Band',
      metaRecipe: 'sq3',
    },
    {
      id: 'gross_risk',
      kind: 'inline',
      valueId: 'cmdGrossRisk',
      metaRecipe: 'gross',
      value: (ctx) => ctx.metrics.grossRiskPct,
      format: (ctx, r) => (r.state === 'healthy' ? `${Number(ctx.metrics.grossRiskPct).toFixed(1)}% gross` : r.display),
    },
    {
      id: 'gross_posture',
      kind: 'inline',
      valueId: 'cmdGrossPosture',
      metaRecipe: 'gross',
      value: (ctx) => {
        const p = ctx.metrics.grossPosture;
        return p && p !== '—' ? p : null;
      },
      format: (ctx, r) => (r.state === 'healthy' ? `· ${ctx.metrics.grossPosture}` : r.display),
    },
  ]);

  function renderKpi(kpi, ctx, elFn, helpers) {
    if (kpi.kind === 'card') return applyCard(kpi, ctx, elFn);
    if (kpi.kind === 'inline') return applyInline(kpi, ctx, elFn);
    if (kpi.kind === 'chip') return applyChip(kpi, ctx, elFn, helpers);
    return null;
  }

  function renderDecisionStrip(ctx, elFn) {
    const out = {};
    for (const kpi of DECISION_STRIP_REGISTRY) {
      out[kpi.id] = renderKpi(kpi, ctx, elFn, ctx.helpers);
    }
    return out;
  }

  function renderToolbar(ctx, elFn) {
    const out = {};
    for (const kpi of TOOLBAR_REGISTRY) {
      out[kpi.id] = renderKpi(kpi, ctx, elFn, ctx.helpers);
    }
    return out;
  }

  function renderAll(ctx, elFn) {
    return {
      decisionStrip: renderDecisionStrip(ctx, elFn),
      toolbar: renderToolbar(ctx, elFn),
    };
  }

  global.WTM_CommandBarKpis = {
    BUILD,
    REASONS,
    SEMANTIC_CARD_DISPLAY,
    BADGE_DISPLAY,
    BADGE_CHIP_BY_STATE,
    resolveBadge,
    META_RECIPES,
    META_STEPS,
    DECISION_STRIP_REGISTRY,
    TOOLBAR_REGISTRY,
    buildMeta,
    badgeChipCls,
    hasSq3Band,
    applyCard,
    applyInline,
    renderAll,
    renderDecisionStrip,
    renderToolbar,
  };
})(typeof window !== 'undefined' ? window : globalThis);