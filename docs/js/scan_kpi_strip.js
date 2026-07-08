/**
 * Scan-layer compact KPI strip — Lego config layer (Phase 3 · Chunk 05).
 * Dominant value + one-line state; rationale deferred to title/expand only.
 */
(function scanKpiStrip(global) {
  'use strict';

  const BUILD = '1.0.0-CHUNK03';
  const MOUNT_ID = 'scanKpiStrip';
  const TILES_ID = 'scanKpiTiles';

  const REASONS = Object.freeze({
    importRegime: 'Import hydration for regime tag',
    regimeUnset: 'Regime tag not set — import WTM or enter intake',
  });

  /** Chunk 03 — visible tile face rules (config-driven, not inline render logic). */
  const SCAN_DISPLAY = Object.freeze({
    compactFace: true,
    maxFaceDeltaChars: 28,
    stateHints: Object.freeze({
      healthy: '',
      not_computed: 'Pending',
      unavailable: 'No data',
      blocked: 'Blocked',
      partial: 'Caution',
      stale: 'Stale',
      quarantined: 'Error',
    }),
  });

  /** Chunk 04 — only exceptional states earn a visible badge; others use value + tile chrome + title. */
  const BADGE_DISPLAY = Object.freeze({
    visibleStates: Object.freeze(['blocked', 'quarantined', 'stale', 'partial']),
    shortLabels: Object.freeze({
      blocked: 'Blocked',
      quarantined: 'Error',
      stale: 'Stale',
      partial: 'Caution',
    }),
  });

  const BADGE_CHIP_BY_STATE = Object.freeze({
    healthy: 'ds-state-badge scan-kpi-badge scan-kpi-badge--healthy',
    stale: 'ds-state-badge scan-kpi-badge scan-kpi-badge--stale',
    partial: 'ds-state-badge scan-kpi-badge scan-kpi-badge--partial',
    blocked: 'ds-state-badge scan-kpi-badge scan-kpi-badge--blocked',
    quarantined: 'ds-state-badge scan-kpi-badge scan-kpi-badge--blocked',
    unavailable: 'ds-state-badge scan-kpi-badge scan-kpi-badge--muted',
    not_computed: 'ds-state-badge scan-kpi-badge scan-kpi-badge--muted',
  });

  function ds() {
    return global.WTM_DataStates || null;
  }

  function kpis() {
    return global.WTM_CommandBarKpis || null;
  }

  function badgeCls(state) {
    const st = ds()?.normalize(state) || 'not_computed';
    return BADGE_CHIP_BY_STATE[st] || BADGE_CHIP_BY_STATE.not_computed;
  }

  function resolveBadge(tile, resolved) {
    const st = resolved.state;
    const visible = BADGE_DISPLAY.visibleStates.includes(st);
    const baseCls = badgeCls(st);
    return {
      visible,
      text: visible ? (BADGE_DISPLAY.shortLabels[st] || resolved.label) : '',
      cls: visible ? baseCls : `${baseCls} scan-kpi-badge--hidden`,
      hoverHint: visible ? '' : resolved.label,
    };
  }

  function isMissingNumber(v) {
    return v == null || (typeof v === 'number' && Number.isNaN(v));
  }

  /** Scan-only meta steps — delegate shared steps to command-bar registry when present. */
  const SCAN_META_STEPS = Object.freeze({
    regimeRequired(ctx, m) {
      if (!ctx.prov?.hydratedAt) {
        return { hydrated: false, not_computed: true, reason: REASONS.importRegime };
      }
      if (!ctx.metrics?.regime) {
        return { not_computed: true, reason: REASONS.regimeUnset };
      }
      return { ...m, hydrated: true };
    },
    regimeFreshness(ctx, m) {
      const step = kpis()?.META_STEPS?.freshnessFromContext;
      return step ? step(ctx, m) : m;
    },
  });

  const SCAN_META_RECIPES = Object.freeze({
    regime: ['regimeRequired', 'regimeFreshness'],
  });

  function buildMeta(ctx, recipeId) {
    const shared = kpis()?.META_RECIPES?.[recipeId];
    if (shared) return kpis().buildMeta(ctx, recipeId);
    const steps = SCAN_META_RECIPES[recipeId] || [];
    let meta = {};
    for (const stepId of steps) {
      const step = SCAN_META_STEPS[stepId];
      if (step) meta = step(ctx, meta) || meta;
    }
    return meta;
  }

  /** Chunk 05 — plain-English face copy for Score / Gate / Shock (config, not render branches). */
  const SEMANTIC_DISPLAY = Object.freeze({
    score: Object.freeze({
      label: 'Risk Score',
      subtitle: 'Whinfell composite',
      tileClass: 'scan-kpi-tile--score',
      zonePrefix: 'Zone',
    }),
    gate: Object.freeze({
      label: 'BTC Gate',
      subtitle: 'Sizing permission',
      tileClass: 'scan-kpi-tile--gate',
      faceDelta: Object.freeze({
        blocked: 'BTC modules off',
        reduced: 'Half-size BTC',
        open: 'Normal BTC sizing',
        unknown: 'Score required',
      }),
    }),
    shock: Object.freeze({
      label: 'Shock',
      subtitle: 'Scenario overlay',
      tileClass: 'scan-kpi-tile--shock',
      faceValue: Object.freeze({
        armed: 'Scenario active',
        clear: 'No scenario',
      }),
      faceDelta: Object.freeze({
        armed: 'Compress sizing',
        clear: 'Baseline only',
      }),
    }),
  });

  /** Short one-line cues under the dominant value — no prose, no mental math. */
  const DELTA_FORMATTERS = Object.freeze({
    scoreZone(ctx) {
      const z = ctx.zone?.text;
      if (!z || z === '—') return null;
      const prefix = SEMANTIC_DISPLAY.score.zonePrefix;
      return prefix ? `${prefix} ${z}` : z;
    },
    weakest(ctx) {
      const w = ctx.health?.weakestStage;
      return w && w !== '—' ? w : null;
    },
    gateChip(ctx) {
      return ctx.gate?.label || ctx.gate?.displayLabel || ctx.gate?.code || null;
    },
    gateFace(ctx) {
      const code = ctx.gate?.code || ctx.gate?.key || 'unknown';
      return SEMANTIC_DISPLAY.gate.faceDelta[code]
        || SEMANTIC_DISPLAY.gate.faceDelta.unknown
        || null;
    },
    freshAge(ctx) {
      if (!ctx.metrics?.dataAsOf) return null;
      const ageH = Math.round(((Date.now() - new Date(ctx.metrics.dataAsOf).getTime()) / 3600000) * 10) / 10;
      return `${ageH}h`;
    },
    shockCue(ctx) {
      const key = ctx.shockLabel ? 'armed' : 'clear';
      return SEMANTIC_DISPLAY.shock.faceDelta[key];
    },
    shockFace(ctx) {
      const key = ctx.shockLabel ? 'armed' : 'clear';
      return SEMANTIC_DISPLAY.shock.faceValue[key];
    },
    regimeTx(ctx) {
      const tx = ctx.txLabel || ctx.metrics?.txState;
      return tx && tx !== '—' ? tx : null;
    },
  });

  /** Long rationale — title + expandable panel only. */
  const RATIONALE_BUILDERS = Object.freeze({
    score(ctx, resolved) {
      const z = ctx.zone?.text || '—';
      return `Whinfell Score ${resolved.display} · zone ${z}. ${resolved.reason}`;
    },
    transmission(ctx, resolved) {
      const h = ctx.health || {};
      return `Transmission ${h.label || '—'} (${h.score ?? '—'}). Weakest: ${h.weakestStage || '—'}. ${resolved.reason}`;
    },
    gate(ctx, resolved) {
      const rule = ctx.gate?.rule || ctx.gate?.bannerSub || '';
      return `Gate ${ctx.gateTitle || '—'}${rule ? ` — ${rule}` : ''}. ${resolved.reason}`;
    },
    freshness(ctx, resolved) {
      const asOf = ctx.metrics?.dataAsOf ? new Date(ctx.metrics.dataAsOf).toLocaleString() : 'no timestamp';
      return `Freshness ${ctx.freshLabel || '—'} · as-of ${asOf}. ${resolved.reason}`;
    },
    shock(ctx, resolved) {
      if (ctx.shockLabel) return `Active shock: ${ctx.shockLabel.label}. ${resolved.reason}`;
      return `No active shock — baseline regime. ${resolved.reason}`;
    },
    regime(ctx, resolved) {
      const tx = ctx.metrics?.txState || '—';
      return `Regime ${ctx.metrics?.regime || '—'} · transmission ${tx}. ${resolved.reason}`;
    },
  });

  const TILE_REGISTRY = Object.freeze([
    {
      id: 'scan_score',
      label: SEMANTIC_DISPLAY.score.label,
      subtitle: SEMANTIC_DISPLAY.score.subtitle,
      tileClass: SEMANTIC_DISPLAY.score.tileClass,
      metaRecipe: 'score',
      value: (ctx) => ctx.metrics?.whinfellScore,
      format: (ctx, resolved) => (
        resolved.state === 'healthy' && !isMissingNumber(ctx.metrics?.whinfellScore)
          ? String(ctx.metrics.whinfellScore)
          : resolved.display
      ),
      delta: 'scoreZone',
      rationale: 'score',
    },
    {
      id: 'scan_transmission',
      label: 'Transmission',
      metaRecipe: 'transmission',
      value: (ctx) => (
        ctx.prov?.hydratedAt && !Number.isNaN(ctx.health?.score) ? ctx.health.score : null
      ),
      format: (ctx, resolved) => (
        resolved.state === 'healthy' ? String(ctx.health.score) : resolved.display
      ),
      delta: 'weakest',
      rationale: 'transmission',
    },
    {
      id: 'scan_gate',
      label: SEMANTIC_DISPLAY.gate.label,
      subtitle: SEMANTIC_DISPLAY.gate.subtitle,
      tileClass: SEMANTIC_DISPLAY.gate.tileClass,
      metaRecipe: 'gate',
      value: (ctx) => ctx.gateTitle,
      format: (_ctx, resolved) => resolved.display,
      delta: 'gateFace',
      rationale: 'gate',
    },
    {
      id: 'scan_freshness',
      label: 'Freshness',
      metaRecipe: 'freshness',
      value: (ctx) => (ctx.prov?.hydratedAt && ctx.metrics?.dataAsOf ? ctx.freshLabel : null),
      format: (_ctx, resolved) => resolved.display,
      delta: 'freshAge',
      rationale: 'freshness',
    },
    {
      id: 'scan_shock',
      label: SEMANTIC_DISPLAY.shock.label,
      subtitle: SEMANTIC_DISPLAY.shock.subtitle,
      tileClass: SEMANTIC_DISPLAY.shock.tileClass,
      metaRecipe: 'shock',
      value: (ctx) => DELTA_FORMATTERS.shockFace(ctx),
      format: (ctx, resolved) => (
        resolved.state === 'healthy' ? DELTA_FORMATTERS.shockFace(ctx) : resolved.display
      ),
      delta: 'shockCue',
      rationale: 'shock',
    },
    {
      id: 'scan_regime',
      label: 'Regime',
      metaRecipe: 'regime',
      value: (ctx) => ctx.metrics?.regime,
      format: (_ctx, resolved) => resolved.display,
      delta: 'regimeTx',
      rationale: 'regime',
    },
  ]);

  function truncateFace(text) {
    if (!text) return '';
    const s = String(text).trim();
    if (!s) return '';
    const max = SCAN_DISPLAY.maxFaceDeltaChars;
    if (s.length <= max) return s;
    return `${s.slice(0, Math.max(1, max - 1))}…`;
  }

  function resolveDelta(tile, ctx, resolved) {
    if (!tile.delta) return null;
    if (typeof tile.delta === 'function') return tile.delta(ctx, resolved);
    const fn = DELTA_FORMATTERS[tile.delta];
    return fn ? fn(ctx, resolved) : null;
  }

  function resolveFaceDelta(tile, ctx, resolved, rawDelta) {
    if (!SCAN_DISPLAY.compactFace) {
      return truncateFace(rawDelta || resolved.reason || '');
    }
    if (rawDelta) return truncateFace(rawDelta);
    if (resolved.state === 'healthy') return '';
    const hint = (typeof tile.stateHint === 'function' && tile.stateHint(ctx, resolved))
      || SCAN_DISPLAY.stateHints[resolved.state]
      || resolved.label;
    return truncateFace(hint);
  }

  function resolveRationale(tile, ctx, resolved) {
    if (!tile.rationale) return resolved.reason || '';
    const fn = RATIONALE_BUILDERS[tile.rationale];
    return fn ? fn(ctx, resolved) : (resolved.reason || '');
  }

  function tileParts(tile, ctx) {
    const DS = ds();
    const value = tile.value(ctx);
    const meta = buildMeta(ctx, tile.metaRecipe);
    const resolved = DS
      ? DS.makeState(value, meta)
      : {
        state: 'not_computed',
        display: isMissingNumber(value) ? '—' : String(value),
        label: 'Not computed',
        reason: '',
        cssClass: 'ds--not_computed',
      };
    const display = tile.format ? tile.format(ctx, resolved) : resolved.display;
    const rawDelta = resolveDelta(tile, ctx, resolved);
    const faceDelta = resolveFaceDelta(tile, ctx, resolved, rawDelta);
    const rationale = resolveRationale(tile, ctx, resolved);
    return { resolved, display, delta: faceDelta, rawDelta, faceDelta, rationale };
  }

  function makeChild(doc, tag, cls, extra) {
    const node = doc.createElement(tag);
    node.className = cls;
    cls.split(/\s+/).filter(Boolean).forEach(c => node.classList.add(c));
    if (extra) Object.assign(node, extra);
    return node;
  }

  function ensureTileShell(tile, container, doc) {
    let el = container.querySelector(`[data-scan-tile="${tile.id}"]`);
    if (el) return el;
    el = doc.createElement('div');
    el.className = 'scan-kpi-tile ds-tile';
    el.classList.add('scan-kpi-tile', 'ds-tile');
    el.dataset.scanTile = tile.id;
    el.dataset.agentKpi = tile.id;
    el.appendChild(makeChild(doc, 'span', 'ds-label scan-kpi-label'));
    el.appendChild(makeChild(doc, 'span', 'scan-kpi-subtitle'));
    const badge = makeChild(doc, 'span', 'ds-state-badge scan-kpi-badge');
    badge.setAttribute('aria-label', 'Data state');
    el.appendChild(badge);
    el.appendChild(makeChild(doc, 'strong', 'ds-value scan-kpi-value'));
    el.appendChild(makeChild(doc, 'span', 'ds-meta scan-kpi-delta'));
    const expand = makeChild(doc, 'button', 'scan-kpi-expand', { type: 'button' });
    expand.setAttribute('aria-expanded', 'false');
    expand.setAttribute('aria-label', 'Show rationale');
    expand.setAttribute('title', 'Expand rationale');
    expand.textContent = '⋯';
    el.appendChild(expand);
    const rationale = makeChild(doc, 'div', 'scan-kpi-rationale zone-hidden');
    rationale.setAttribute('aria-hidden', 'true');
    el.appendChild(rationale);
    container.appendChild(el);
    return el;
  }

  function applyTile(tile, ctx, container, doc) {
    const el = ensureTileShell(tile, container, doc);
    const { resolved, display, faceDelta, rationale } = tileParts(tile, ctx);
    const DS = ds();

    if (DS) {
      DS.STATES.forEach(s => el.classList.remove(`ds--${s}`));
    }
    el.classList.add(resolved.cssClass || `ds--${resolved.state}`);
    el.dataset.dataState = resolved.state;
    el.dataset.agentReason = resolved.reason || rationale;
    el.title = rationale;

    const labelEl = el.querySelector('.scan-kpi-label');
    if (labelEl) labelEl.textContent = tile.label;

    const subtitleEl = el.querySelector('.scan-kpi-subtitle');
    if (subtitleEl) {
      const sub = tile.subtitle || '';
      subtitleEl.textContent = sub;
      if (subtitleEl.classList) {
        subtitleEl.classList.toggle('scan-kpi-subtitle--empty', !sub);
      }
    }

    if (tile.tileClass && el.classList) {
      el.classList.add(tile.tileClass);
    }

    const badgeEl = el.querySelector('.scan-kpi-badge');
    if (badgeEl) {
      const badge = resolveBadge(tile, resolved);
      badgeEl.textContent = badge.text;
      badgeEl.className = badge.cls;
      if (badge.hoverHint) badgeEl.setAttribute('title', badge.hoverHint);
      else if (typeof badgeEl.removeAttribute === 'function') badgeEl.removeAttribute('title');
    }

    const valueEl = el.querySelector('.scan-kpi-value');
    if (valueEl) valueEl.textContent = display;

    const deltaEl = el.querySelector('.scan-kpi-delta');
    if (deltaEl) {
      deltaEl.textContent = faceDelta || '';
      deltaEl.title = resolved.reason || rationale || '';
      if (deltaEl.classList) {
        deltaEl.classList.toggle('scan-kpi-delta--empty', !faceDelta);
      }
    }

    const rationaleEl = el.querySelector('.scan-kpi-rationale');
    if (rationaleEl) rationaleEl.textContent = rationale;

    const expandEl = el.querySelector('.scan-kpi-expand');
    if (expandEl?.classList) {
      const hasRationale = !!(rationale && String(rationale).trim());
      expandEl.classList.toggle('zone-hidden', !hasRationale);
      if (!hasRationale && rationaleEl?.classList) {
        rationaleEl.classList.add('zone-hidden');
        rationaleEl.setAttribute('aria-hidden', 'true');
        expandEl.setAttribute('aria-expanded', 'false');
      }
    }

    return resolved;
  }

  let expandBound = false;

  function bindExpand(container) {
    if (expandBound || !container) return;
    expandBound = true;
    container.addEventListener('click', (ev) => {
      const btn = ev.target?.closest?.('.scan-kpi-expand');
      if (!btn || !container.contains(btn)) return;
      const tile = btn.closest('.scan-kpi-tile');
      const panel = tile?.querySelector('.scan-kpi-rationale');
      if (!panel) return;
      const open = panel.classList.contains('zone-hidden');
      panel.classList.toggle('zone-hidden', !open);
      panel.setAttribute('aria-hidden', open ? 'false' : 'true');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function ensureMount(doc) {
    const document = doc || global.document;
    if (!document?.getElementById) return null;
    const tiles = document.getElementById(TILES_ID);
    if (tiles) return tiles;
    const mount = document.getElementById(MOUNT_ID);
    if (mount) return mount.querySelector?.(`#${TILES_ID}`) || mount;

    const cmdBar = document.getElementById('commandBar');
    if (!cmdBar?.parentNode) return null;

    mount = document.createElement('section');
    mount.id = MOUNT_ID;
    mount.className = 'scan-kpi-strip';
    mount.setAttribute('aria-label', 'Scan KPIs');
    mount.innerHTML = `<div id="${TILES_ID}" class="scan-kpi-tiles" role="list"></div>`;
    cmdBar.parentNode.insertBefore(mount, cmdBar);
    return mount.querySelector(`#${TILES_ID}`);
  }

  function renderStrip(ctx, mountEl) {
    const doc = global.document;
    const container = mountEl || ensureMount(doc);
    if (!container) return {};
    bindExpand(container);

    const out = {};
    for (const tile of TILE_REGISTRY) {
      out[tile.id] = applyTile(tile, ctx, container, doc);
    }
    return out;
  }

  global.WTM_ScanKpiStrip = {
    BUILD,
    REASONS,
    SCAN_DISPLAY,
    BADGE_DISPLAY,
    BADGE_CHIP_BY_STATE,
    resolveBadge,
    SCAN_META_RECIPES,
    SCAN_META_STEPS,
    SEMANTIC_DISPLAY,
    DELTA_FORMATTERS,
    RATIONALE_BUILDERS,
    TILE_REGISTRY,
    buildMeta,
    badgeCls,
    truncateFace,
    resolveFaceDelta,
    tileParts,
    ensureMount,
    renderStrip,
  };
})(typeof window !== 'undefined' ? window : globalThis);