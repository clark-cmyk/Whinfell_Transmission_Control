/**
 * Task Force v1.1.0 — slim panel feed for BasisWatch + Midwest Compute Crush.
 * Extracts qualitative specialist layers from chained TCM output; snapshot fallback when stub.
 */
(function taskForcePanelFeed(global) {
  'use strict';

  const PANEL_IDS = ['btc_eth_basis', 'compute_gpu', 'btc_eth_vol_arb'];

  function isLiveSpecialist(spec) {
    return spec && spec.status === 'ok' && spec.signal && spec.signal !== 'stub' && spec.signal !== 'pending';
  }

  function spreadVsRef(spread, exec) {
    const n = Number(spread);
    const low = Number(exec?.ref_low);
    const high = Number(exec?.ref_high);
    if (!Number.isFinite(n) || !Number.isFinite(low) || !Number.isFinite(high)) return 'mid';
    if (n < low) return 'low';
    if (n > high) return 'high';
    return 'mid';
  }

  function fallbackBasis(tf) {
    const snap = tf?.snapshot;
    const basis = snap?.node_summaries?.basis;
    const exec = snap?.execution;
    if (!basis && !exec) return null;
    const parts = [];
    if (basis?.state) parts.push(basis.state);
    if (basis?.lead_rv) parts.push(basis.lead_rv);
    if (exec?.near_month && exec?.far_month) parts.push(`${exec.near_month}→${exec.far_month}`);
    return {
      status: 'snapshot',
      node_id: 'basis',
      signal: parts.length ? parts.join(' · ') : 'Basis read pending Task Force chain',
      confidence: 0.4,
      invalidation: '',
      as_of: snap?.hydration_ref?.as_of || tf?.as_of || '',
      source: 'snapshot',
      execution: exec ? {
        near_month: exec.near_month || '',
        far_month: exec.far_month || '',
        basis_spread: String(exec.basis_spread ?? ''),
        spread_vs_ref: spreadVsRef(exec.basis_spread, exec),
        btc_bias: snap?.global?.btc_bias || '',
        calendar_read: basis?.lead_rv || '',
      } : undefined,
    };
  }

  function fallbackComputeGpu(tf) {
    const snap = tf?.snapshot;
    const ai = snap?.node_summaries?.ai_compute;
    if (!ai) return null;
    const signal = [ai.gpu_basis, ai.power_basis].filter(Boolean).join(' · ') || 'Compute read pending Task Force chain';
    return {
      status: 'snapshot',
      node_id: 'ai_compute',
      signal,
      confidence: 0.4,
      invalidation: '',
      as_of: snap?.hydration_ref?.as_of || tf?.as_of || '',
      source: 'snapshot',
      crush_trade: {
        posture: 'watch',
        structure: '',
        current_basis: 0,
        expected_pnl_pct: 0,
        horizon_days: 0,
      },
    };
  }

  function fallbackVolArb(tf) {
    const snap = tf?.snapshot;
    const hb = snap?.node_summaries?.highbeta;
    if (!hb) return null;
    return {
      status: 'snapshot',
      node_id: 'highbeta',
      signal: hb.lead_rv ? `${hb.state || 'Supportive'} · ${hb.lead_rv}` : 'Highbeta gate pending Task Force chain',
      confidence: 0.35,
      invalidation: '',
      as_of: snap?.hydration_ref?.as_of || tf?.as_of || '',
      source: 'snapshot',
      layer2: { cap_read: hb.layer2_allowed ? 'probe' : 'blocked' },
    };
  }

  const FALLBACKS = {
    btc_eth_basis: fallbackBasis,
    compute_gpu: fallbackComputeGpu,
    btc_eth_vol_arb: fallbackVolArb,
  };

  function resolveSpecialist(tf, id) {
    const spec = tf?.specialists?.[id];
    if (isLiveSpecialist(spec)) return { ...spec, source: 'task_force' };
    const fb = FALLBACKS[id]?.(tf);
    return fb || spec || null;
  }

  function extractTaskForcePanels(taskForce) {
    if (!taskForce || typeof taskForce !== 'object') return null;
    const specialists = {};
    for (const id of PANEL_IDS) {
      const layer = resolveSpecialist(taskForce, id);
      if (layer) specialists[id] = layer;
    }
    if (!Object.keys(specialists).length) return null;
    return {
      task_force_version: taskForce.task_force_version || '1.1.0',
      as_of: taskForce.as_of || '',
      validation_status: taskForce.validation_status || 'stub',
      specialists,
      master_sizing: taskForce.master_sizing || null,
    };
  }

  function extractFromBundle(bundle) {
    if (!bundle || typeof bundle !== 'object') return null;
    if (bundle.task_force_panels) return bundle.task_force_panels;
    return extractTaskForcePanels(bundle.task_force);
  }

  function postureDir(posture) {
    const p = String(posture || '').toLowerCase();
    if (p === 'execute') return 'long';
    if (p === 'pass') return 'neutral';
    if (p === 'watch') return 'watch';
    return 'neutral';
  }

  function mergeWmcData(base, panels) {
    if (!base || !panels?.specialists) return base;
    const out = JSON.parse(JSON.stringify(base));
    const gpu = panels.specialists.compute_gpu;
    const vol = panels.specialists.btc_eth_vol_arb;
    if (!gpu) return out;

    if (gpu.signal) out.meta.thesis = gpu.signal;
    if (panels.as_of) out.meta.as_of = String(panels.as_of).slice(0, 10);
    out.meta.task_force_source = gpu.source || gpu.status;

    const crush = gpu.crush_trade || {};
    const core = out.trade_variants?.core;
    if (core) {
      if (crush.posture) core.posture = crush.posture;
      if (crush.structure) core.signal = crush.structure;
      else if (gpu.signal) core.signal = gpu.signal;
      if (gpu.invalidation) core.stop = gpu.invalidation;
      if (Number.isFinite(crush.expected_pnl_pct)) core.target = `+${crush.expected_pnl_pct}% crush convergence`;
      const cap = vol?.layer2?.cap_read || gpu.highbeta_cross?.layer2_cap;
      if (cap) {
        core.rationale = `${gpu.signal}${cap ? ` · layer2 cap ${String(cap).toUpperCase()}` : ''}`;
      }
    }

    const hero = out.kpis?.find((k) => k.hero);
    if (hero && Number.isFinite(crush.expected_pnl_pct)) {
      hero.value = crush.expected_pnl_pct >= 0 ? `+${crush.expected_pnl_pct}` : String(crush.expected_pnl_pct);
      if (crush.horizon_days) hero.delta = `${crush.horizon_days}d horizon`;
    }

    const gateKpi = out.kpis?.find((k) => /transmission gate/i.test(k.label));
    const cap = vol?.layer2?.cap_read || gpu.highbeta_cross?.layer2_cap;
    if (gateKpi && cap) {
      gateKpi.value = String(cap).toUpperCase();
      gateKpi.delta = gpu.highbeta_cross?.transmission_note || 'layer2 cap';
    }

    if (Number.isFinite(crush.current_basis)) {
      const basisKpi = out.kpis?.find((k) => /gpu basis/i.test(k.label));
      if (basisKpi) basisKpi.value = String(crush.current_basis);
    }

    out._task_force_panels = panels;
    return out;
  }

  function basisWatchFeed(hydration) {
    return hydration?.task_force_panels?.specialists?.btc_eth_basis
      || extractFromBundle(hydration)?.specialists?.btc_eth_basis
      || null;
  }

  global.WTM_TaskForceFeed = {
    PANEL_IDS,
    extractTaskForcePanels,
    extractFromBundle,
    mergeWmcData,
    basisWatchFeed,
    postureDir,
  };
})(typeof window !== 'undefined' ? window : globalThis);