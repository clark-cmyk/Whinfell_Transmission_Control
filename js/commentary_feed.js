/**
 * Right-rail commentary feed — decision / interpretation layer.
 */
(function commentaryFeed(global) {
  'use strict';

  const MAX_ITEMS = 12;

  function el(id) { return document.getElementById(id); }

  function pushItem(items, entry) {
    if (!entry?.text) return;
    items.push({
      at: entry.at || new Date().toISOString(),
      source: entry.source || 'desk',
      tone: entry.tone || 'neutral',
      text: entry.text,
    });
  }

  function buildEntries(state) {
    const items = [];
    const prov = state?.provenance || {};
    const gate = typeof global.deriveGate === 'function' ? global.deriveGate(state) : null;
    const feed = global.WTM_TaskForceFeed;

    if (!prov.hydratedAt) {
      pushItem(items, {
        source: 'hydration',
        tone: 'warn',
        text: 'No bundle — import latest.json or run Collect before desk read.',
      });
    } else {
      const fresh = prov.freshnessStatus === 'stale' ? 'stale' : 'fresh';
      pushItem(items, {
        source: 'hydration',
        tone: prov.freshnessStatus === 'stale' ? 'warn' : 'ok',
        text: `Hydration ${fresh} · ${prov.snapshotId || 'preview missing'}`,
      });
    }

    if (gate) {
      const gateLine = gate.blocked
        ? 'Gate blocked · No new BTC risk'
        : gate.tight
          ? 'Gate tight · Size capped 0.5×'
          : `Gate ${gate.displayLabel || gate.label} · Eligible`;
      pushItem(items, {
        source: 'gate',
        tone: gate.blocked ? 'block' : 'ok',
        text: gateLine,
      });
    }

    const panels = state?.hydration?.task_force_panels || feed?.fromHydration?.(state?.hydration);
    if (panels?.specialists) {
      ['btc_eth_basis', 'compute_gpu', 'btc_eth_vol_arb'].forEach((sid) => {
        const spec = panels.specialists[sid];
        if (!spec?.signal) return;
        pushItem(items, {
          source: `task_force:${sid}`,
          tone: spec.status === 'ok' ? 'ok' : 'neutral',
          text: `Task Force · ${sid}: ${spec.signal}`,
        });
      });
    }

    const obs = state?.intake?.keyObservation || state?.operator?.keyObservation;
    if (obs && String(obs).trim()) {
      pushItem(items, {
        source: 'operator',
        tone: 'neutral',
        text: `Operator read: ${String(obs).trim()}`,
      });
    }

    const bw = state?._basisWatchModel;
    if (bw?.front) {
      pushItem(items, {
        source: 'basis_watch',
        tone: 'ok',
        text: `${bw.asset?.label || 'Basis'} front ${bw.front.symbol} · ann carry ${bw.front.spotAnnualizedCarry != null ? bw.front.spotAnnualizedCarry.toFixed(2) : '—'}% · shape ${bw.shape || '—'}`,
      });
    }

    const wmcActive = global.WTM_WmcIaPanel?.isActive?.()
      || (typeof document !== 'undefined' && document.body?.classList?.contains('ia-dig-view-midwest-crush'));
    if (wmcActive && global.WMC_DATA) {
      const meta = global.WMC_DATA.meta || {};
      if (meta.thesis) {
        pushItem(items, {
          source: 'wmc:thesis',
          tone: 'ok',
          text: `Midwest Crush: ${meta.thesis}`,
        });
      }
      const crush = global.WTM_WmcIaPanel?.crushSpreadRow?.() || global.WMC_DATA.basis_tracker?.find((r) => /crush spread/i.test(r.leg));
      if (crush) {
        pushItem(items, {
          source: 'wmc:crush_spread',
          tone: crush.dislocation === 'extreme' || crush.dislocation === 'rich' ? 'warn' : 'ok',
          text: `${crush.leg} Z=${crush.z_score != null ? crush.z_score.toFixed(1) : '—'} · ${crush.dislocation} · compute ${crush.compute ?? '—'} · BTC basis ${crush.btc_basis != null ? (crush.btc_basis * 100).toFixed(1) + '%' : '—'}`,
        });
      }
      const topCorr = global.WTM_WmcIaPanel?.topCorrelation?.();
      if (topCorr) {
        pushItem(items, {
          source: 'wmc:correlation',
          tone: Math.abs(topCorr.value) > 0.6 ? 'warn' : 'neutral',
          text: `Crush corr peak: ${topCorr.a}×${topCorr.b} ${topCorr.value.toFixed(2)}`,
        });
      }
      const core = global.WMC_DATA.trade_variants?.core;
      if (core?.signal) {
        pushItem(items, {
          source: 'wmc:expression',
          tone: core.posture === 'execute' ? 'ok' : 'neutral',
          text: `WMC ${core.name}: ${core.signal}`,
        });
      }
    }

    return items.slice(0, MAX_ITEMS);
  }

  function renderFeed(state) {
    const host = el('iaCommentaryFeed');
    if (!host) return;
    const items = buildEntries(state);
    if (!items.length) {
      host.innerHTML = '<p class="ia-feed-empty">Commentary feed idle — import hydration or enter operator read.</p>';
      return;
    }
    host.innerHTML = items.map((it) => {
      const tone = it.tone || 'neutral';
      return `<article class="ia-feed-item ia-feed-item--${tone}" data-agent-feed-source="${it.source}">
        <span class="ia-feed-source">${it.source}</span>
        <p class="ia-feed-text">${escape(it.text)}</p>
      </article>`;
    }).join('');
  }

  function escape(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  global.WTM_CommentaryFeed = { buildEntries, renderFeed };
})(typeof window !== 'undefined' ? window : globalThis);