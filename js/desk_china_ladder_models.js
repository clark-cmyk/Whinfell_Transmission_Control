/* AUTO-GENERATED — do not edit manually.
 * Source: china_policy_track/china_ladder.py
 * Version: china_ladder.v1.1
 * Generated: 2026-07-04
 * Regenerate: python3 -m whinfell_pipeline.desk_china_ladder_models
 */
'use strict';

const CHINA_LADDER_SPEC = {
  "version": "china_ladder.v1.1",
  "source": "china_policy_track/china_ladder.py",
  "stages": [
    {
      "id": "liquidity",
      "name": "Liquidity & Rates",
      "short": "Liq",
      "sub": "GCN10YR · USDCNH"
    },
    {
      "id": "credit",
      "name": "Credit Confirmation",
      "short": "Credit",
      "sub": "KHYB · 2829.HK · provisional"
    },
    {
      "id": "breadth",
      "name": "Equity Breadth",
      "short": "Breadth",
      "sub": "000300.SS · HSTECH"
    },
    {
      "id": "highbeta",
      "name": "High-Beta / China Cyclical Transmission",
      "short": "Cyc",
      "sub": "HG1"
    },
    {
      "id": "basis",
      "name": "Basis & Term Structure",
      "short": "Basis",
      "sub": "HG1 spreads"
    }
  ],
  "mark_score": {
    "up": 75,
    "flat": 50,
    "down": 25
  },
  "stage_models": {
    "liquidity": {
      "components": [
        {
          "label": "1D funding impulse",
          "w": 15,
          "hz": "d1"
        },
        {
          "label": "5D funding trend",
          "w": 20,
          "hz": "d5"
        },
        {
          "label": "20D China rates / CNH",
          "w": 40,
          "hz": "d20"
        },
        {
          "label": "60D liquidity regime",
          "w": 25,
          "hz": "d60"
        }
      ],
      "proxies": [
        "GCN10YR",
        "USDCNH"
      ],
      "status": "confirmed"
    },
    "credit": {
      "components": [
        {
          "label": "1D HY vs govt impulse",
          "w": 20,
          "hz": "d1"
        },
        {
          "label": "5D credit momentum",
          "w": 30,
          "hz": "d5"
        },
        {
          "label": "20D KHYB vs 2829.HK",
          "w": 30,
          "hz": "d20"
        },
        {
          "label": "60D durability",
          "w": 20,
          "hz": "d60"
        }
      ],
      "proxies": [
        "KHYB",
        "2829.HK"
      ],
      "status": "provisional"
    },
    "breadth": {
      "components": [
        {
          "label": "1D participation",
          "w": 25,
          "hz": "d1"
        },
        {
          "label": "5D breadth thrust",
          "w": 25,
          "hz": "d5"
        },
        {
          "label": "20D CSI300 vs HSTECH",
          "w": 30,
          "hz": "d20"
        },
        {
          "label": "60D sustained breadth",
          "w": 20,
          "hz": "d60"
        }
      ],
      "proxies": [
        "000300.SS",
        "HSTECH"
      ],
      "status": "confirmed"
    },
    "highbeta": {
      "components": [
        {
          "label": "1D cyclical impulse",
          "w": 25,
          "hz": "d1"
        },
        {
          "label": "5D HG1 copper impulse",
          "w": 25,
          "hz": "d5"
        },
        {
          "label": "20D beta transmission",
          "w": 30,
          "hz": "d20"
        },
        {
          "label": "60D regime persistence",
          "w": 20,
          "hz": "d60"
        }
      ],
      "proxies": [
        "HG1"
      ],
      "status": "confirmed"
    },
    "basis": {
      "components": [
        {
          "label": "1D curve impulse",
          "w": 20,
          "hz": "d1"
        },
        {
          "label": "5D roll pressure",
          "w": 25,
          "hz": "d5"
        },
        {
          "label": "20D front vs deferred",
          "w": 35,
          "hz": "d20"
        },
        {
          "label": "60D carry durability",
          "w": 20,
          "hz": "d60"
        }
      ],
      "proxies": [
        "HG1 spreads"
      ],
      "status": "confirmed"
    }
  },
  "final_bands": [
    {
      "min": 80,
      "max": 100,
      "band": "Strong",
      "desk_meaning": "Policy support aligned with ladder"
    },
    {
      "min": 65,
      "max": 79,
      "band": "Constructive",
      "desk_meaning": "Normal sizing acceptable"
    },
    {
      "min": 50,
      "max": 64,
      "band": "Mixed / Fragile",
      "desk_meaning": "Selective / reduced size"
    },
    {
      "min": 0,
      "max": 49,
      "band": "Impaired",
      "desk_meaning": "Heavily discount or avoid new exposure"
    }
  ],
  "stage_health_bands": [
    {
      "min": 80,
      "band": "Healthy",
      "status": "healthy"
    },
    {
      "min": 65,
      "band": "Constructive",
      "status": "constructive"
    },
    {
      "min": 50,
      "band": "Fragile",
      "status": "fragile"
    },
    {
      "min": 0,
      "band": "Broken",
      "status": "broken"
    }
  ],
  "stage_tie_rank": {
    "liquidity": 0,
    "credit": 1,
    "breadth": 2,
    "highbeta": 3,
    "basis": 4
  },
  "ui_copy": {
    "liquidity": {
      "state": "{score} / {band} — China funding and CNH liquidity {posture}.",
      "evidence": "GCN10YR / USDCNH net {net}; offshore funding sets daily China posture.",
      "trigger": "Sustained >60 with easier 5D/20D China rates / CNH marks."
    },
    "credit": {
      "state": "{score} / {band} — {durability} cross-asset credit read.",
      "evidence": "KHYB vs 2829.HK net {net}; provisional proxy — validate live.",
      "trigger": "Net ≥+2 with SQ3 policy ≥50 and breadth confirm on CSI300/HSTECH."
    },
    "breadth": {
      "state": "{score} / {band} — participation {participation}.",
      "evidence": "CSI300 vs HSTECH net {net}; broad vs tech leadership split.",
      "trigger": "5D/20D net ≥+1 unlocks larger China-linked sleeves."
    },
    "highbeta": {
      "state": "{score} / {band} — cyclical beta {transmitting}.",
      "evidence": "HG1 copper net {net}; cyclical transmission vs policy impulse.",
      "trigger": "Net ≥+2 with credit stage ≥60 for larger cyclical beta."
    },
    "basis": {
      "state": "{score} / {band} — {carry} Cu/IO curve quality.",
      "evidence": "Front vs deferred net {net}; warehouse carry not always backed.",
      "trigger": "Net ≥+1 and China final (adj.) ≥50 for aggressive curve harvest."
    }
  },
  "sq3_multipliers": [
    {
      "min_sq3": 80,
      "multiplier": 1.0
    },
    {
      "min_sq3": 65,
      "multiplier": 0.95
    },
    {
      "min_sq3": 50,
      "multiplier": 0.8
    },
    {
      "min_sq3": 0,
      "multiplier": 0.6
    }
  ]
};

const CHINA_LADDER_SPEC_VERSION = CHINA_LADDER_SPEC.version;
const CHINA_LADDER_STAGES = CHINA_LADDER_SPEC.stages;
const CHINA_MARK_SCORE = CHINA_LADDER_SPEC.mark_score;
const CHINA_STAGE_MODELS = CHINA_LADDER_SPEC.stage_models;
const CHINA_LADDER_FINAL_BANDS = CHINA_LADDER_SPEC.final_bands;
const STAGE_HEALTH_BANDS = CHINA_LADDER_SPEC.stage_health_bands;
const STAGE_TIE_RANK = CHINA_LADDER_SPEC.stage_tie_rank;
const CHINA_STAGE_UI_COPY = CHINA_LADDER_SPEC.ui_copy;

/** Derived from china_ladder.py — keep in sync via desk_china_ladder_models generator. */
function compositeChinaStageScore(stageId, horizons) {
  var model = CHINA_STAGE_MODELS[stageId];
  var hz = horizons && horizons[stageId] ? horizons[stageId] : {};
  if (!model) return 50;
  var total = 0;
  model.components.forEach(function (c) {
    var mark = (hz[c.hz] || 'flat').toLowerCase();
    total += c.w * (CHINA_MARK_SCORE[mark] != null ? CHINA_MARK_SCORE[mark] : 50);
  });
  return Math.round(total / 100);
}

function chinaHorizonNet(hz) {
  var keys = ['d1', 'd5', 'd20', 'd60'];
  var map = { up: 1, flat: 0, down: -1, '': 0 };
  return keys.reduce(function (s, k) { return s + (map[(hz && hz[k]) || ''] || 0); }, 0);
}

function stageHealthBand(score) {
  var s = Math.max(0, Math.min(100, Math.round(score)));
  for (var i = 0; i < STAGE_HEALTH_BANDS.length; i++) {
    if (s >= STAGE_HEALTH_BANDS[i].min) return STAGE_HEALTH_BANDS[i];
  }
  return STAGE_HEALTH_BANDS[STAGE_HEALTH_BANDS.length - 1];
}

function chinaSq3Multiplier(sq3Score) {
  var s = Math.round(sq3Score);
  if (s >= 80) return 1.00;
  if (s >= 65) return 0.95;
  if (s >= 50) return 0.80;
  return 0.60;
}

function chinaLadderFinalBand(finalScore) {
  var score = Math.max(0, Math.min(100, Math.round(finalScore)));
  for (var i = 0; i < CHINA_LADDER_FINAL_BANDS.length; i++) {
    var row = CHINA_LADDER_FINAL_BANDS[i];
    if (score >= row.min && score <= row.max) return row;
  }
  return CHINA_LADDER_FINAL_BANDS[CHINA_LADDER_FINAL_BANDS.length - 1];
}

/**
 * weakestStage — composite = lowest stage score (TC + Deep Dive China).
 * net = lowest horizon net (tracer-style; optional).
 */
function weakestStage(stageList, mode) {
  mode = mode || 'composite';
  var key = mode === 'net' ? 'net' : 'score';
  if (!stageList || !stageList.length) {
    return { stage_id: '', name: '—', value: 0, mode: mode };
  }
  var weakest = stageList[0];
  stageList.forEach(function (row) {
    var v = row[key] != null ? row[key] : 0;
    var wv = weakest[key] != null ? weakest[key] : 0;
    var tie = (STAGE_TIE_RANK[row.id] != null ? STAGE_TIE_RANK[row.id] : 99);
    var wtie = (STAGE_TIE_RANK[weakest.id] != null ? STAGE_TIE_RANK[weakest.id] : 99);
    if (v < wv || (v === wv && tie < wtie)) weakest = row;
  });
  return {
    stage_id: weakest.id,
    name: weakest.name,
    value: weakest[key] != null ? weakest[key] : 0,
    mode: mode,
  };
}

function formatChinaHandicapLine(raw, sq3, multiplier, finalScore, finalBand, deskMeaning, sq3PolicyBand) {
  var mult = typeof multiplier === 'number' ? multiplier.toFixed(2) : String(multiplier);
  var line = 'Ladder ' + raw + ' × SQ3 ' + mult + ' → Final ' + finalScore + ' · ' + finalBand;
  if (deskMeaning) line += ' · ' + deskMeaning;
  if (sq3PolicyBand) line += ' (SQ3 policy band: ' + sq3PolicyBand + ')';
  return line;
}

function chinaStageFacts(stageId, stageName, score, band, net, weakestName, sq3Score) {
  var tpl = CHINA_STAGE_UI_COPY[stageId] || CHINA_STAGE_UI_COPY.liquidity;
  var netStr = (net >= 0 ? '+' : '') + net;
  var vars = {
    score: score,
    band: band,
    net: netStr,
    posture: net >= 0 ? 'available' : 'tightening',
    durability: score >= 65 ? 'durable' : 'tactical',
    participation: net >= 0 ? 'broadening' : 'narrow',
    transmitting: net < 0 ? 'not transmitting' : 'transmitting',
    carry: band === 'Fragile' ? 'selective' : 'warehouse-friendly',
    sq3: sq3Score != null ? sq3Score : '—',
  };
  function fill(s) {
    return String(s).replace(/\{(\w+)\}/g, function (_, k) {
      return vars[k] != null ? String(vars[k]) : '';
    });
  }
  var facts = {
    state: fill(tpl.state),
    evidence: fill(tpl.evidence),
    trigger: fill(tpl.trigger),
  };
  if (stageName === weakestName) facts.evidence += ' Weakest link — size China-linked books first.';
  return facts;
}

