/**
 * Signal detail drawer copy — config-driven desk tone (Chunk 09 · Phase 12).
 * Executive sections only: Whinfell Score, Transmission, Gate, Shock, Freshness.
 */
(function signalDetailCopy(global) {
  'use strict';

  const BUILD = '1.0.0-CHUNK09';

  const SIGNAL_DETAIL_DISPLAY = Object.freeze({
    bulletLabels: Object.freeze(['State', 'Drivers', 'Trigger']),
    templates: Object.freeze({
      whinfellScore: Object.freeze({
        unset: Object.freeze([
          'Score unset. Observe only — no carry sleeve, no prop calendar.',
          'Ladder {ladderNets}. Health {health}. Gate bands need a bound score.',
          'Enter score or import hydration. Blocked <50 · client 50–64 · prop 65+ with health ≥{healthOpen}.',
        ]),
        red: Object.freeze([
          'Score {score}. Red band. Convexity only — client maintenance, prop flat.',
          '{weakest} net {wNet}. {sq3Line}. Ladder {ladderNets}.',
          'Amber at 50 (+{scoreToAmber} pts). Prop needs 65+ and health ≥{healthOpen} (now {health}).',
        ]),
        amber: Object.freeze([
          'Score {score}. Amber band. Minimum carry sleeve — ¼–½ prop size.',
          '{weakest} net {wNet}. {sq3Line}. {channels} hold.',
          'Opens at 65 (+{scoreToGreen} pts) with health ≥{healthOpen} ({healthGap} pts short). Falls <50 if credit+equities slip.',
        ]),
        green: Object.freeze([
          'Score {score}. Green band. Carry-dominant when health confirms. Prop sizing on.',
          'Health {health}/{healthOpen}. Weakest {weakest} ({wNet}). {sq3Line}.',
          'Downgrades below 65 or health <{healthOpen}. Hard block <50.',
        ]),
      }),
      transmission: Object.freeze({
        mixed: Object.freeze([
          'Transmission {health}. Mixed band. Half-size basis rolls until {healthOpen} clears.',
          '{weakest} weakest ({wNet}). Ladder {ladderNets}.',
          'Full sizing at health >{healthOpen}. Watch {weakest} toward +2 ({healthGap} pts short).',
        ]),
        open: Object.freeze([
          'Transmission {health}. {healthLabel} band. Carry-friendly — full policy sizing.',
          'Weakest {weakest} ({wNet}). Ladder {ladderNets}. Spread {spread}.',
          'Pull back if health <{healthOpen} or {weakest} net ≤−2.',
        ]),
      }),
      gateState: Object.freeze({
        blocked: Object.freeze([
          'Gate blocked. Score {score} <50. No new prop BTC risk.',
          'Health {health}. Spread {spread} vs {refs}.',
          'First step at score ≥50 (+{scoreToAmber} pts). Full open needs 65+ and health ≥{healthOpen}.',
        ]),
        reduced: Object.freeze([
          'Gate {gateTitle}. Reduced. Client carry — ½ prop size max.',
          'Score {score}. Health {health}. {sq3Line}. {weakest} ({wNet}).',
          'Opens at score ≥65 AND health ≥{healthOpen} together.',
        ]),
        open: Object.freeze([
          'Gate open. Score {score} ≥65, health {health} ≥{healthOpen}. Full sizing.',
          '{zoneText} zone. {weakest} net {wNet}. Spread {spread}.',
          'Closes if score <65 or health <{healthOpen}. Hard block <50.',
        ]),
      }),
      shock: Object.freeze({
        active: Object.freeze([
          'Shock live: {shockLabel}. Carry off — convexity posture.',
          'Score {score}. Health {health}. Basis whip risk.',
          'Clear shock in Signal Tracer. Tag {shockProb}%/{shockHorizon} is planning only.',
        ]),
        none: Object.freeze([
          'No shock override. Baseline rules apply.',
          'Score {score}. Health {health}. Gate {gateTitle}. Spread {spread}.',
          'Live shift if BTC Decoupling, Vol Spike, or Credit Widening activates.',
        ]),
      }),
      freshness: Object.freeze({
        fresh: Object.freeze([
          'Fresh. As-of {asOf}. Safe to size on score {score} / health {health}.',
          'Snapshot {snapId}. Refs {refs}.',
          'Ages at {freshHours}h. Stale at {staleHours}h. Re-import before prop add.',
        ]),
        aging: Object.freeze([
          'Aging ({freshHours}–{staleHours}h). As-of {asOf}. Confirm basis before add.',
          'Score {score}. Health {health}. Spread may lag tape.',
          'Re-import for Fresh <{freshHours}h. Stale >{staleHours}h without refresh.',
        ]),
        stale: Object.freeze([
          'Stale (>{staleHours}h). As-of {asOf}. No new BTC risk.',
          'Gate {gateTitle} may look valid but spread {spread} often wrong.',
          'Hydration import or Save State with new timestamp.',
        ]),
        unknown: Object.freeze([
          'No pipeline timestamp. Sizing confidence discounted.',
          'Ladder {ladderNets} may be stale vs live tape.',
          'Research import or hydration save binds as-of.',
        ]),
      }),
    }),
  });

  function fill(template, vars) {
    return String(template).replace(/\{(\w+)\}/g, (_, key) => {
      const v = vars[key];
      return v == null || v === '' ? '—' : String(v);
    });
  }

  function fillTriple(templates, vars) {
    return templates.map((t) => fill(t, vars));
  }

  function resolveWhinfellKey(ctx) {
    if (Number.isNaN(ctx.score)) return 'unset';
    if (ctx.score < 50) return 'red';
    if (ctx.score < 65) return 'amber';
    return 'green';
  }

  function resolveTransmissionKey(ctx) {
    return ctx.health < ctx.healthOpen ? 'mixed' : 'open';
  }

  function resolveGateKey(ctx) {
    const code = ctx.gateCode || 'reduced';
    if (code === 'blocked') return 'blocked';
    if (code === 'open') return 'open';
    return 'reduced';
  }

  function resolveShockKey(ctx) {
    return ctx.shockActive ? 'active' : 'none';
  }

  function resolveFreshnessKey(ctx) {
    const st = ctx.freshStatus || 'unknown';
    if (st === 'fresh' || st === 'aging' || st === 'stale') return st;
    return 'unknown';
  }

  function buildExecutiveBullets(ctx) {
    const vars = { ...ctx };
    const T = SIGNAL_DETAIL_DISPLAY.templates;
    return {
      whinfellScore: fillTriple(T.whinfellScore[resolveWhinfellKey(ctx)], vars),
      transmission: fillTriple(T.transmission[resolveTransmissionKey(ctx)], vars),
      gateState: fillTriple(T.gateState[resolveGateKey(ctx)], vars),
      shock: fillTriple(T.shock[resolveShockKey(ctx)], vars),
      freshness: fillTriple(T.freshness[resolveFreshnessKey(ctx)], vars),
    };
  }

  global.WTM_SignalDetailCopy = Object.freeze({
    BUILD,
    SIGNAL_DETAIL_DISPLAY,
    buildExecutiveBullets,
    fill,
  });
})(typeof window !== 'undefined' ? window : globalThis);