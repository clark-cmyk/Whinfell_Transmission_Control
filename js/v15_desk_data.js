/** v1.5 desk defaults — override via hydration bundle keys */
window.V15_DESK_DEFAULTS = {
  corporate_credit: {
    as_of: '2026-07-03',
    hy_oas_bps: 339.2,
    percentile: 90.5,
    richness: 'cheap',
    band: 'Blocked',
    rv_posture: 'long_spread',
    preferred_expression: 'HYG vs LQD',
    tactical_lead: 'HY OAS proxy cheap; long spread allowed at half size under Tight Risk.',
    is_weakest_link: true,
  },
  trade_tracker: {
    as_of: '2026-07-03',
    trades: [
      { id: 'btc_calendar', book: 'prop', structure: 'BTC Jul/Back calendar', status: 'watch', pnl_pct: 1.2, size_cap: 'half' },
      { id: 'hyg_lqd', book: 'client', structure: 'HYG/LQD long spread', status: 'watch', pnl_pct: 0.4, size_cap: 'half' },
    ],
  },
  btc_attribution: {
    as_of: '2026-07-03',
    btc_bias: 'Neutral',
    btc_ret_1d_pct: 2.2,
    summary: 'Credit leg dragging; liquidity flat.',
    attribution: [
      { stage: 'credit', d1: 'down', net_impact: -1, btc_drag: true },
      { stage: 'liquidity', d1: 'flat', net_impact: 0, btc_drag: false },
    ],
  },
  margin_rules: {
    as_of: '2026-07-03',
    whinfell_score: 46,
    tier: 'defensive',
    gross_risk_cap_pct: 15,
    max_per_trade_risk_pct: 0.5,
    max_concurrent_trades: 2,
    layer2_allowed: false,
    layer3_allowed: false,
    rules: ['Score < 50 → defensive tier', 'Layer 2/3 blocked'],
  },
};