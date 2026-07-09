/**
 * Transmission Signal Radar — hero object (Chunk 11 · Phase 14).
 * Config-driven sleeve registry; live ladder nets from buildCommandBarKpiContext().
 */
(function transmissionRadar(global) {
  'use strict';

  const BUILD = '1.2.0-CHUNK11-PANEL-META';
  const MOUNT_ID = 'transmissionRadar';
  const INNER_ID = 'transmissionRadarMount';
  const PANEL_META_ID = 'radarPanelMeta';
  const HORIZONS = Object.freeze(['d1', 'd5', 'd20', 'd60']);

  const RADAR_SLEEVE_REGISTRY = Object.freeze([
    { id: 'liquidity', label: 'Liquidity', short: 'Liq', ladderId: 'liquidity', ladderIdx: 0 },
    { id: 'credit', label: 'Credit', short: 'Cred', ladderId: 'credit', ladderIdx: 1 },
    { id: 'breadth', label: 'Breadth', short: 'Brd', ladderId: 'breadth', ladderIdx: 2 },
    { id: 'btc', label: 'BTC', short: 'BTC', ladderId: 'highbeta', ladderIdx: 3 },
    { id: 'basis', label: 'Basis', short: 'Basis', ladderId: 'basis', ladderIdx: 4 },
  ]);

  const RADAR_DISPLAY = Object.freeze({
    title: 'Transmission Signal Radar',
    summaryFace: 'Not wired',
    summaryState: 'not_computed',
    weakestPrefix: 'Weakest',
    weakestFace: '—',
    sleeveFace: '—',
    sleeveCue: 'Pending',
  });

  const REASONS = Object.freeze({
    importHydration: 'Import hydration for ladder nets',
    sleeveUnset: 'Apply tracer marks for this stage',
  });

  /** Desk-native one-line cues from ladder net — no prose templates. */
  const NET_CUE = Object.freeze({
    confirming: 'Confirming',
    supportive: 'Supportive',
    flat: 'Flat',
    soft: 'Soft',
    dragging: 'Dragging',
  });

  const STATE_HINTS = Object.freeze({
    not_computed: 'Pending',
    unavailable: 'No data',
    blocked: 'Blocked',
    partial: 'Caution',
    stale: 'Stale',
    quarantined: 'Error',
  });

  function ds() {
    return global.WTM_DataStates || null;
  }

  function kpis() {
    return global.WTM_CommandBarKpis || null;
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function formatNet(net) {
    if (net == null || Number.isNaN(net)) return '—';
    return net > 0 ? `+${net}` : String(net);
  }

  function netCue(net) {
    if (net == null || Number.isNaN(net)) return '—';
    if (net >= 2) return NET_CUE.confirming;
    if (net === 1) return NET_CUE.supportive;
    if (net === 0) return NET_CUE.flat;
    if (net === -1) return NET_CUE.soft;
    return NET_CUE.dragging;
  }

  function stageHasMarks(ctx, ladderId) {
    const horizons = ctx.state?.tracer?.horizons || {};
    const hz = horizons[ladderId] || {};
    return HORIZONS.some((h) => {
      const mark = hz[h];
      return mark != null && String(mark).trim() !== '';
    });
  }

  function buildSleeveMeta(ctx, ladderId) {
    if (!ctx.prov?.hydratedAt) {
      return { hydrated: false, not_computed: true, reason: REASONS.importHydration };
    }
    if (!stageHasMarks(ctx, ladderId)) {
      return { hydrated: true, not_computed: true, reason: REASONS.sleeveUnset };
    }
    const step = kpis()?.META_STEPS?.freshnessFromContext;
    return step ? step(ctx, { hydrated: true }) : { hydrated: true };
  }

  function buildSummaryMeta(ctx) {
    return kpis()?.buildMeta(ctx, 'transmission') || {
      hydrated: false,
      not_computed: true,
      reason: REASONS.importHydration,
    };
  }

  function resolveWeakestShort(ctx) {
    const h = ctx.health || {};
    const idx = h.weakestIdx ?? h.summary?.weakestIdx ?? -1;
    if (idx >= 0) {
      const sleeve = RADAR_SLEEVE_REGISTRY.find((s) => s.ladderIdx === idx);
      if (sleeve) return sleeve.short;
    }
    const name = h.weakestStage;
    if (!name || name === '—') return '—';
    const match = RADAR_SLEEVE_REGISTRY.find((s) => name.includes(s.label));
    return match?.short || name.split(/\s+/)[0];
  }

  function weakestSleeveId(ctx) {
    const idx = ctx.health?.weakestIdx ?? ctx.health?.summary?.weakestIdx ?? -1;
    if (idx < 0) return null;
    return RADAR_SLEEVE_REGISTRY.find((s) => s.ladderIdx === idx)?.id || null;
  }

  function resolveSleeve(ctx, sleeve) {
    const DS = ds();
    const nets = ctx.health?.summary?.stageNets || [];
    const net = nets[sleeve.ladderIdx];
    const meta = buildSleeveMeta(ctx, sleeve.ladderId);
    const resolved = DS
      ? DS.makeState(net, meta)
      : {
        state: 'not_computed',
        display: '—',
        reason: meta.reason || '',
        cssClass: 'ds--not_computed',
      };
    const face = resolved.state === 'healthy' ? formatNet(net) : resolved.display;
    const cue = resolved.state === 'healthy' ? netCue(net) : (STATE_HINTS[resolved.state] || resolved.label);
    return {
      id: sleeve.id,
      face,
      cue,
      state: resolved.state,
      reason: resolved.reason,
      cssClass: resolved.cssClass,
      isWeakest: weakestSleeveId(ctx) === sleeve.id,
    };
  }

  function buildRadarDisplay(ctx) {
    if (!ctx) return { ...RADAR_DISPLAY, sleeves: [] };

    const DS = ds();
    const h = ctx.health || {};
    const summaryValue = ctx.prov?.hydratedAt && !Number.isNaN(h.score) ? h.score : null;
    const summaryMeta = buildSummaryMeta(ctx);
    const summaryResolved = DS
      ? DS.makeState(summaryValue, summaryMeta)
      : { state: 'not_computed', display: RADAR_DISPLAY.summaryFace, cssClass: 'ds--not_computed' };

    let summaryFace = RADAR_DISPLAY.summaryFace;
    if (summaryResolved.state === 'healthy' && h.label != null) {
      summaryFace = `${h.label} · ${h.score}`;
    } else if (summaryResolved.display) {
      summaryFace = summaryResolved.display;
    }

    const sleeves = RADAR_SLEEVE_REGISTRY.map((s) => resolveSleeve(ctx, s));

    return {
      title: RADAR_DISPLAY.title,
      summaryFace,
      summaryState: summaryResolved.state,
      summaryReason: summaryResolved.reason,
      weakestPrefix: RADAR_DISPLAY.weakestPrefix,
      weakestFace: resolveWeakestShort(ctx),
      sleeves,
    };
  }

  function sleeveCardHtml(sleeveData, display, registryEntry) {
    const reg = registryEntry || RADAR_SLEEVE_REGISTRY.find((s) => s.id === sleeveData?.id);
    const data = sleeveData || {
      id: reg?.id || 'unknown',
      face: display.sleeveFace,
      cue: display.sleeveCue,
      state: 'not_computed',
      reason: '',
      cssClass: 'ds--not_computed',
      isWeakest: false,
    };
    const weakestCls = data.isWeakest ? ' radar-sleeve--weakest' : '';
    const stateCls = data.cssClass || `ds--${data.state}`;
    return `<div class="radar-sleeve ds-tile ${escapeHtml(stateCls)}${weakestCls}"`
      + ` data-radar-sleeve="${escapeHtml(data.id)}"`
      + ` data-data-state="${escapeHtml(data.state)}"`
      + ` data-agent-reason="${escapeHtml(data.reason || '')}"`
      + ` role="listitem"`
      + ` title="${escapeHtml(data.reason || '')}">`
      + `<span class="radar-sleeve-label">${escapeHtml(reg?.label || data.id)}</span>`
      + `<span class="radar-sleeve-value">${escapeHtml(data.face)}</span>`
      + `<span class="radar-sleeve-cue">${escapeHtml(data.cue)}</span>`
      + '</div>';
  }

  /** Chunk 4 — live glance line in .wf-panel__header meta (presentation only). */
  function syncPanelMeta(display, doc) {
    const document = doc || global.document;
    const meta = document?.getElementById?.(PANEL_META_ID);
    if (!meta) return '';
    const summary = String(display?.summaryFace || RADAR_DISPLAY.summaryFace || '—').trim() || '—';
    const weakest = String(display?.weakestFace || RADAR_DISPLAY.weakestFace || '—').trim() || '—';
    const prefix = display?.weakestPrefix || RADAR_DISPLAY.weakestPrefix || 'Weakest';
    const line = `${summary} · ${prefix} ${weakest}`;
    meta.textContent = line;
    if (typeof meta.setAttribute === 'function') {
      meta.setAttribute('title', `Transmission ${summary}; ${prefix.toLowerCase()} ${weakest}`);
    }
    return line;
  }

  function shellHtml(display = RADAR_DISPLAY) {
    const sleeves = (display.sleeves && display.sleeves.length)
      ? display.sleeves.map((s) => sleeveCardHtml(s, display)).join('')
      : RADAR_SLEEVE_REGISTRY.map((s) => sleeveCardHtml(null, display, s)).join('');
    const summaryState = display.summaryState || 'not_computed';
    const summaryCls = ds()?.cssClass(summaryState) || `ds--${summaryState}`;
    return ''
      + '<header class="radar-head">'
      + `<h2 class="radar-title">${escapeHtml(display.title)}</h2>`
      + `<div class="radar-summary ds-tile ${escapeHtml(summaryCls)}" data-data-state="${escapeHtml(summaryState)}"`
      + ` data-agent-reason="${escapeHtml(display.summaryReason || '')}">`
      + `<span class="radar-summary-face">${escapeHtml(display.summaryFace)}</span>`
      + '</div>'
      + '<div class="radar-weakest">'
      + `<span class="radar-weakest-label">${escapeHtml(display.weakestPrefix)}:</span> `
      + `<span class="radar-weakest-value">${escapeHtml(display.weakestFace)}</span>`
      + '</div>'
      + '</header>'
      + `<div class="radar-sleeves" role="list">${sleeves}</div>`;
  }

  function ensureMount(doc) {
    const document = doc || global.document;
    if (!document?.getElementById) return null;

    let root = document.getElementById(MOUNT_ID);
    let inner = document.getElementById(INNER_ID);
    if (root && inner) return inner;

    if (!root) {
      const scan = document.getElementById('scanKpiStrip');
      const cmd = document.getElementById('commandBar');
      if (!scan?.parentNode) return null;

      root = document.createElement('section');
      root.id = MOUNT_ID;
      root.className = 'transmission-radar';
      root.setAttribute('aria-label', RADAR_DISPLAY.title);
      root.dataset.agentSurface = 'transmission-radar';

      inner = document.createElement('div');
      inner.id = INNER_ID;
      inner.className = 'transmission-radar-mount';
      root.appendChild(inner);

      if (cmd) scan.parentNode.insertBefore(root, cmd);
      else scan.parentNode.appendChild(root);
    } else if (!inner) {
      inner = document.createElement('div');
      inner.id = INNER_ID;
      inner.className = 'transmission-radar-mount';
      root.appendChild(inner);
    }
    return inner;
  }

  function renderShell(mountEl, display = RADAR_DISPLAY, doc) {
    const inner = mountEl || ensureMount(doc);
    if (!inner) {
      syncPanelMeta(display, doc);
      return false;
    }
    inner.innerHTML = shellHtml(display);
    syncPanelMeta(display, doc);
    return true;
  }

  function render(ctx, mountEl, doc) {
    const display = buildRadarDisplay(ctx);
    return renderShell(mountEl, display, doc);
  }

  global.WTM_TransmissionRadar = Object.freeze({
    BUILD,
    HORIZONS,
    RADAR_SLEEVE_REGISTRY,
    RADAR_DISPLAY,
    REASONS,
    NET_CUE,
    PANEL_META_ID,
    formatNet,
    netCue,
    stageHasMarks,
    buildSleeveMeta,
    buildRadarDisplay,
    resolveSleeve,
    resolveWeakestShort,
    weakestSleeveId,
    syncPanelMeta,
    shellHtml,
    ensureMount,
    renderShell,
    render,
  });
})(typeof window !== 'undefined' ? window : globalThis);