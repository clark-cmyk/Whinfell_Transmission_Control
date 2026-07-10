/** Whinfell Transmission Control — Phase 2 · Storage v7 (node cockpit navigation) */

const STORAGE_KEY = 'whinfell_transmission_control_v7';
const LEGACY_KEYS = ['whinfell_transmission_control_v1', 'whinfell_transmission_control_v0', 'whinfell_operator_v1_1'];
const STATE_VERSION = 7;
/** Bump when operator-console UX changes — visible in header for reload verification. */
const TC_CONSOLE_BUILD = '1.5-BUILD-COUSINS-2026-07-04-PHASE23';
const DESK_GITHUB_BLOB = 'https://github.com/clark-cmyk/Whinfell_Transmission_Control/blob/main/';
const DESK_GITHUB_RAW = 'https://raw.githubusercontent.com/clark-cmyk/Whinfell_Transmission_Control/main/';
const DESK_PAGES_URL = 'https://clark-cmyk.github.io/Whinfell_Transmission_Control/';
const DESK_PAGES_URL_PUBLIC = 'https://clark-cmyk.github.io/Whinfell_BUILD_Cousins_v2/';
const DESK_REPO_URL = 'https://github.com/clark-cmyk/Whinfell_Transmission_Control';
const COUSINS_REPO_URL = 'https://github.com/clark-cmyk/Whinfell_BUILD_Cousins_v2';

/** Canonical desk documentation catalog — paths relative to repo root on GitHub. */
const DESK_DOC_CATALOG = [
  { group: 'Start here', docs: [
    { label: 'User Guide v1.5 (this repo)', path: 'documentation/Whinfell_Transmission_Control_User_Guide_v1.5.md', local: true },
    { label: 'Quick Reference v1.5', path: 'documentation/Whinfell_Quick_Reference_v1.5.md', local: true },
    { label: 'Data Dictionary v1.5', path: 'documentation/DATA_DICTIONARY_v1.5.md', local: true },
    { label: 'Desk URLs & paths', path: 'documentation/DESK_URLS.md', local: true },
    { label: 'Desk User Manual v1.0 (archive)', path: COUSINS_REPO_URL + '/blob/main/08_Deliverables/Whinfell_Desk_User_Manual_v1.0.md', external: true },
    { label: 'Live desk preview (TC Pages)', path: DESK_PAGES_URL, external: true },
    { label: 'Live desk preview (public fallback)', path: DESK_PAGES_URL_PUBLIC, external: true },
    { label: 'GitHub repo (TC)', path: DESK_REPO_URL, external: true },
    { label: 'GitHub repo (BUILD Cousins v2)', path: COUSINS_REPO_URL, external: true },
    { label: 'Latest hydration JSON', path: DESK_PAGES_URL + 'data/hydration/latest.json', external: true },
    { label: 'Hydration field log JSON', path: DESK_PAGES_URL + 'data/hydration/hydration_log.json', external: true },
    { label: 'Session activation', path: '08_Deliverables/BUILD_Cousins_Session_Activation.md' },
    { label: 'Session activation — how to use', path: '08_Deliverables/BUILD_Cousins_Session_Activation_How_to_Use.md' },
    { label: 'Phased development plan v1.0', path: '08_Deliverables/Whinfell_Phased_Development_Plan_v1.0.md' },
    { label: 'Phased plan — how to use', path: '08_Deliverables/Whinfell_Phased_Development_Plan_How_to_Use.md' },
    { label: 'Operator dashboard setup', path: '08_Deliverables/Whinfell_Operator_Dashboard_Setup_Guide.md' },
    { label: 'Operator dashboard (legacy HTML)', path: '08_Deliverables/Whinfell_Operator_Dashboard.html' },

    { label: 'Transmission Control (modular index)', path: 'index.html', local: true },
    { label: 'Legacy monolith (archive)', path: COUSINS_REPO_URL + '/blob/main/08_Deliverables/Whinfell_Transmission_Control.html', external: true },
  ]},
  { group: 'Daily operations', docs: [
    { label: 'Simple data update (Clark)', path: '08_Deliverables/Whinfell_Data_Update_Simple_Guide.md', audience: 'Clark' },
    { label: 'Full data update guide', path: '08_Deliverables/Whinfell_Data_Update_Guide.md', audience: 'Clark' },
    { label: 'Expanded Operators Guide v1.5 (archive)', path: COUSINS_REPO_URL + '/blob/main/08_Deliverables/Whinfell_Expanded_Operators_Guide_v1.5.md', external: true },
    { label: 'Expanded Operators Guide v1.4', path: '08_Deliverables/Whinfell_Expanded_Operators_Guide_v1.4.md' },
    { label: 'Expanded Operators Guide v1.2', path: '08_Deliverables/Whinfell_Expanded_Operators_Guide_v1.2.md' },
    { label: 'Quick Reference v1.5 (this repo)', path: 'documentation/Whinfell_Quick_Reference_v1.5.md', local: true },
    { label: 'Quick Reference Card v1.5 (archive)', path: COUSINS_REPO_URL + '/blob/main/08_Deliverables/Whinfell_Quick_Reference_Card_v1.5.md', external: true },
    { label: 'Comet browser blueprint', path: '08_Deliverables/Comet_Browser_Operations_Blueprint.md', audience: 'Comet' },
    { label: 'Perplexity + Comet collection', path: '08_Deliverables/Perplexity_Comet_Collection_Instructions.md', audience: 'Perplexity' },
    { label: 'Comet shortcuts', path: '08_Deliverables/Comet_Shortcuts_WTM.md', audience: 'Comet' },
    { label: 'Fast CSV collect guide', path: '08_Deliverables/Fast_CSV_Collect_Guide.md' },
    { label: 'Perplexity Barchart/Koyfin playbook', path: '08_Deliverables/Perplexity_Barchart_Koyfin_Playbook.md', audience: 'Perplexity' },
    { label: 'Perplexity full collect prompt', path: '08_Deliverables/Perplexity_Full_Collection_Prompt.txt', audience: 'Perplexity' },
    { label: 'Perplexity 2.2e update prompt', path: '08_Deliverables/Perplexity_2.2e_Update_Prompt.txt', audience: 'Perplexity' },
    { label: 'Grok operator prompt', path: '08_Deliverables/Whinfell_Grok_Operator_Prompt.txt', audience: 'Grok' },
    { label: 'Comet adapter handoff manifest', path: '08_Deliverables/Comet_Adapter_Handoff/MANIFEST.md', audience: 'Comet' },
    { label: 'CSV download entrypoint', path: 'run_csv_download.py', audience: 'Clark' },
  ]},
  { group: 'Scores · China · SQ3', docs: [
    { label: 'SQ3 Reference v1.0', path: '08_Deliverables/Whinfell_SQ3_Reference_v1.0.md', audience: 'G-Quant' },
    { label: 'Credit Confirmation Score (C1)', path: '04_Score_Calculation/Whinfell_Credit_Confirmation_Score_Logic.md', audience: 'G-Quant' },
    { label: 'C1 score logic (deliverables copy)', path: '08_Deliverables/C1_Whinfell_Credit_Confirmation_Score_Logic.md', audience: 'G-Quant' },
    { label: 'C1 — how to use', path: '08_Deliverables/C1_How_to_Use.md' },
    { label: 'C1 kickoff brief', path: '04_Score_Calculation/C1_Kickoff_Brief.md' },
    { label: 'C1 review log', path: '04_Score_Calculation/C1_Review_Log.md' },
    { label: 'C2 — how to use', path: '08_Deliverables/C2_How_to_Use.md' },
    { label: 'C3 — how to use', path: '08_Deliverables/C3_How_to_Use.md' },
    { label: 'Interim node score weights', path: '04_Score_Calculation/Phase2_Interim_Node_Score_Weights.md' },
    { label: 'Transmission ladder teach-in', path: '08_Deliverables/Whinfell_Transmission_Ladder_Teach_In.md' },
    { label: 'Ladder deep dive (interactive)', path: 'whinfell-transmission-ladder-deep-dive.html', local: true },
    { label: 'SQ3 engine (Python)', path: 'china_policy_track/sq3.py', audience: 'G-Quant' },
  ]},
  { group: 'Pipeline · specs', docs: [
    { label: 'Master data dictionary (YAML)', path: 'whinfell_pipeline/data_dictionary.yaml' },
    { label: 'Master data dictionary v1.0 (strategy)', path: '01_Strategy_Docs/Archive/Master_Data_Dictionary_v1.0.md' },
    { label: 'WTM EXPORT v2.1 spec', path: 'whinfell_pipeline/WTM_EXPORT_v2.1_SPEC.md' },
    { label: 'WTM EXPORT v2.2 spec', path: 'whinfell_pipeline/WTM_EXPORT_v2.2_SPEC.md' },
    { label: 'Phase 2 signal intelligence spec', path: '08_Deliverables/Whinfell_Phase2_Signal_Intelligence_Spec.md' },
    { label: 'ARCH-3 WTM import criteria', path: '08_Deliverables/ARCH-3_WTM_Import_Core_Criteria.md' },
    { label: 'ARCH-3 WTM import handoff', path: '08_Deliverables/ARCH-3_WTM_Import_Core_Handoff.md' },
    { label: 'Desk URLs (Comet wired)', path: 'whinfell_pipeline/desk_urls.yaml' },
    { label: 'WTM data architecture build plan', path: '01_Strategy_Docs/Archive/WTM_Data_Architecture_Build_Plan.md' },
    { label: 'Phase 2 flows implementation spec', path: '01_Strategy_Docs/Archive/Phase2_Flows_Implementation_Spec.md' },
    { label: 'Phase 2 node cockpit data model', path: '01_Strategy_Docs/Archive/Phase2_Node_Cockpit_Data_Model.md' },
    { label: 'Phase 2 TC cockpit UI architecture', path: '01_Strategy_Docs/Archive/Phase2_TC_Cockpit_UI_Architecture.md' },
    { label: 'Cockpit UI interaction standard', path: '01_Strategy_Docs/Archive/Whinfell_Cockpit_UI_Interaction_Standard.md' },
    { label: 'Funds flow sponsorship design', path: '01_Strategy_Docs/Archive/Phase2_Funds_Flow_Sponsorship_Design.md' },
    { label: 'Liquidity mission surface v1 plan', path: '01_Strategy_Docs/Liquidity_Mission_Surface_v1_Plan.md' },
  ]},
  { group: 'Mission surfaces · validation', docs: [
    { label: 'Desk feedback log', path: '08_Deliverables/Desk_Feedback_Log.md' },
    { label: 'UI audit spec', path: '08_Deliverables/whinfell_ui_audit_chunked.md' },
    { label: 'Credit mission surface handoff', path: '08_Deliverables/Credit_Mission_Surface_Desk_Handoff.md' },
    { label: 'Liquidity mission surface handoff', path: '08_Deliverables/Liquidity_Mission_Surface_Desk_Handoff.md' },
    { label: 'TC review log', path: '08_Deliverables/Whinfell_Transmission_Control_Review_Log.md' },
    { label: 'Series ticker master (C3)', path: '08_Deliverables/C3_Whinfell_Series_Ticker_Master_List.md' },
    { label: 'C4 test results summary', path: '08_Deliverables/C4_Test_Results_Summary.md' },
    { label: 'C4.5 kickoff brief', path: '08_Deliverables/C4.5_Kickoff_Brief.md' },
    { label: 'C4.5 desk announcement memo', path: '08_Deliverables/C4.5_Desk_Announcement_Memo.md' },
    { label: 'C4.5 — how to use', path: '08_Deliverables/C4.5_How_to_Use.md' },
    { label: 'C4.5 review log', path: '08_Deliverables/C4.5_Review_Log.md' },
    { label: 'C4.6 review log', path: '08_Deliverables/C4.6_Review_Log.md' },
    { label: 'Funds flow sponsorship GOAL', path: '08_Deliverables/Funds_Flow_Sponsorship_GOAL.md' },
    { label: 'Funds flow sponsorship PLAN', path: '08_Deliverables/Funds_Flow_Sponsorship_PLAN.md' },
    { label: 'Funds flow ingest arena debate', path: '08_Deliverables/Funds_Flow_Ingest_Arena_Debate.md' },
  ]},
  { group: 'Strategy · team', docs: [
    { label: 'BUILD Cousins operating plan v1.0', path: '01_Strategy_Docs/Archive/BUILD_Cousins_Operating_Plan_v1.0.md' },
    { label: 'BUILD Cousins team introduction', path: '01_Strategy_Docs/Archive/BUILD_Cousins_Team_Introduction.md' },
    { label: 'BUILD TODO list', path: '01_Strategy_Docs/BUILD_TODO_List.md' },
    { label: 'Progress log', path: '01_Strategy_Docs/Progress_Log.md' },
  ]},
];
const HYDRATION_BUNDLE_VERSION = '1.2.0';
const RV_HORIZONS = ['1m', '3m', '6m', '12m', '3y'];
const RV_HORIZON_LABELS = { '1m': '1M', '3m': '3M', '6m': '6M', '12m': '12M', '3y': '3Y' };
const FRESH_HOURS = 4;
const STALE_HOURS = 24;
const EXPORT_FORMAT = 'WTC-2.1';
const MAX_SNAPSHOTS = 12;
const SCENARIO_VARIANT_COUNT = 3;
const RESEARCH_EXPORT_FORMAT = 'WTM EXPORT v2.1';
const RESEARCH_EXPORT_FORMAT_LEGACY = 'WTM EXPORT v2.0';
const CHINA_EXPORT_FORMAT = 'CHINA POLICY EXPORT v1.0';
const CHINA_LADDER_EXPORT_FORMAT = 'CHINA LADDER EXPORT v1.1';
const PIPELINE_BUNDLE_VERSION = '1.0.0';
const MASTER_DATA_DICTIONARY_META_URL = 'data_dictionary_meta.json';
/** Phase 2.3 — static dictionary badge only; no runtime meta.json polling. */
const DD_META_POLLING_ENABLED = false;
let ddMetaCache = null;
let ddMetaFetchGen = 0;

/** Keys dropped before desk hydration import (saves parse + memory on ~108KB bundles). */
const HYDRATION_LOAD_STRIP_KEYS = ['wtm_export_v22'];

function resolveSafeBoot() {
  try {
    const params = new URLSearchParams(location.search);
    if (params.get('safe_boot') === '1') return true;
    if (params.get('safe_boot') === '0') return false;
  } catch (_) { /* ignore */ }
  return !!(typeof window !== 'undefined' && window.WHINFELL_SAFE_BOOT);
}

const SAFE_BOOT = resolveSafeBoot();

function resolveBootVerbose() {
  try {
    const params = new URLSearchParams(location.search);
    if (params.get('boot_log') === '0') return false;
    if (params.get('boot_log') === '1') return true;
  } catch (_) { /* ignore */ }
  return SAFE_BOOT;
}

const WTM_BOOT_VERBOSE = resolveBootVerbose();

function bootLog(level, msg, extra) {
  if (!WTM_BOOT_VERBOSE && level === 'debug') return;
  const line = `[WTM boot] ${msg}`;
  if (level === 'error') console.error(line, extra ?? '');
  else if (level === 'warn') console.warn(line, extra ?? '');
  else console.log(line, extra ?? '');
}

function signalBootCheck(message, isError) {
  if (typeof window !== 'undefined' && typeof window.updateBootCheck === 'function') {
    window.updateBootCheck(message, isError);
    return;
  }
  const check = typeof document !== 'undefined' ? document.getElementById('js-boot-check') : null;
  if (check) {
    check.textContent = message;
    check.style.color = isError ? '#f56565' : 'lime';
    check.classList.toggle('boot-check--error', !!isError);
    if (!isError && message === 'RENDER SUCCESS') {
      check.classList.remove('boot-check--error');
      check.classList.add('boot-check--ok');
      check.classList.remove('boot-check--hidden');
    }
  }
}

/**
 * Success vs fallback gate inputs — logged on every full paint decision.
 * Fallback is for genuine paint failure only (not missing optional widgets).
 */
function logConsoleGuard(reason, extra) {
  if (typeof window !== 'undefined') {
    window.__WTM_BOOT_GUARD = {
      at: new Date().toISOString(),
      reason: reason || 'unknown',
      safeBoot: SAFE_BOOT,
      coreReady: !!window.__WTM_CORE_READY,
      bootComplete: !!window.__WTM_BOOT_COMPLETE,
      bootFailed: !!window.__WTM_BOOT_FAILED,
      lastRenderOk: window.__WTM_LAST_RENDER_OK,
      pipelineImported: !!(appState?.provenance?.hydratedAt || appState?.hydration?.node_cockpits),
      hasNodeCockpits: !!appState?.hydration?.node_cockpits,
      protocol: typeof location !== 'undefined' ? location.protocol : '?',
      ...(extra || {}),
    };
  }
  if (WTM_BOOT_VERBOSE || reason === 'fallback' || reason === 'error') {
    bootLog(reason === 'fallback' || reason === 'error' ? 'warn' : 'info', 'console_guard', window.__WTM_BOOT_GUARD);
  }
}

/** True when a full success shell paint is allowed (data optional; throw path uses fallback). */
function consoleCanRenderSuccess(state) {
  // Required shell anchors — if these are gone, fall back instead of throwing mid-paint.
  if (typeof document === 'undefined') return false;
  if (!document.getElementById('commandBar') && !document.getElementById('headerRegimeLine')) return false;
  // Pipeline/hydration are soft: missing data paints empty cockpit, not global FALLBACK.
  void state;
  return true;
}

/** Yield to browser paint/input between heavy desk panels (Phase 2.3). */
function yieldToMain() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => setTimeout(resolve, 0));
    } else {
      setTimeout(resolve, 0);
    }
  });
}

const _deferredWorkKeys = new Map();

/** Coalesce keyed deferred work onto the next macrotask. */
function scheduleDeferredWork(key, fn) {
  if (_deferredWorkKeys.has(key)) return;
  const run = () => {
    _deferredWorkKeys.delete(key);
    try { fn(); } catch (err) { bootLog('warn', `deferred ${key} failed`, err); }
  };
  _deferredWorkKeys.set(key, run);
  setTimeout(run, 0);
}

function scheduleHeavyPanelRefresh() {
  scheduleDeferredWork('heavy_panels', () => {
    if (typeof WTM_BasisWatch !== 'undefined') {
      try {
        WTM_BasisWatch.refresh(appState, {});
      } catch (bwErr) {
        bootLog('warn', 'BasisWatch.refresh deferred failed', bwErr);
      }
    }
    if (typeof window.renderVisualizationDiagnostics === 'function') {
      try { window.renderVisualizationDiagnostics(); } catch (_) { /* optional */ }
    }
  });
}

if (typeof window !== 'undefined') {
  window.WHINFELL_SAFE_BOOT = SAFE_BOOT;
  window.SAFE_BOOT = SAFE_BOOT;
  window.DD_META_POLLING_ENABLED = DD_META_POLLING_ENABLED;
  window.WTM_BOOT_VERBOSE = WTM_BOOT_VERBOSE;
  window.WTM_yieldToMain = yieldToMain;
  window.WTM_scheduleDeferred = scheduleDeferredWork;
}
const SQ3_WEIGHT_POLICY = 0.35;
const SQ3_WEIGHT_STATE = 0.35;
const SQ3_WEIGHT_GROWTH = 0.30;
const SQ3_POLICY_BANDS = [
  [0, 49, 'Impaired'],
  [50, 64, 'Mixed / Fragile'],
  [65, 79, 'Constructive'],
  [80, 100, 'Strong'],
];
const BTC_BIAS_MAP = { confirming: 'up', dragging: 'down', neutral: 'flat' };
const HORIZON_PARSE = { '1d': 'd1', '5d': 'd5', '20d': 'd20', '60d': 'd60', d1: 'd1', d5: 'd5', d20: 'd20', d60: 'd60' };
const MARK_PARSE = { up: 'up', '↑': 'up', confirming: 'up', flat: 'flat', '→': 'flat', neutral: 'flat', mixed: 'flat', down: 'down', '↓': 'down', impairing: 'down' };
const TX_PARSE = {
  normal: 'normal', stressed: 'stressed', disorderly: 'disorderly', crisis: 'crisis',
  elevated: 'elevated',
  'risk-on': 'normal', 'risk-off': 'disorderly', constructive: 'normal', compression: 'disorderly',
};
const POSTURE_PARSE = {
  full: 'full', selective: 'selective', light: 'light', defensive: 'defensive', flat: 'flat',
  'full gross': 'full', 'light gross': 'light', 'no new risk': 'flat',
};
const HORIZONS = ['d1', 'd5', 'd20', 'd60'];
const HORIZON_LABELS = { d1: '1d', d5: '5d', d20: '20d', d60: '60d' };
const HORIZON_DISPLAY = { up: '↑', flat: '→', down: '↓', '': '—' };
const HORIZON_SCORE = { up: 1, flat: 0, down: -1, '': 0 };

const DEFAULTS = {
  urls: { koyfin: 'https://app.koyfin.com/', barchart: 'https://www.barchart.com/futures/major-commodities' },
};

const TX_META = {
  normal: { label: 'Normal', chip: 'bg-emerald-500/15 text-wtm-green border-wtm-green' },
  elevated: { label: 'Elevated', chip: 'bg-lime-500/15 text-lime-400 border-lime-400' },
  stressed: { label: 'Stressed', chip: 'bg-amber-500/15 text-wtm-amber border-wtm-amber' },
  disorderly: { label: 'Disorderly', chip: 'bg-orange-500/15 text-orange-400 border-orange-400' },
  crisis: { label: 'Crisis', chip: 'bg-red-500/15 text-wtm-red border-wtm-red' },
};

const LADDER = [
  { id: 'liquidity', name: 'Liquidity & Rates', short: 'Liq', sub: '2Y/10Y · curve shape' },
  { id: 'credit', name: 'Credit Confirmation', short: 'Credit', sub: 'HY/IG · Whinfell Score' },
  { id: 'breadth', name: 'Equity Breadth', short: 'Breadth', sub: 'SPY · IWM · participation' },
  { id: 'highbeta', name: 'High-Beta / BTC', short: 'BTC', sub: 'IBIT vs QQQ/SPY' },
  { id: 'basis', name: 'Basis & Term Structure', short: 'Basis', sub: 'Futures curve · contango' },
];

/** China ladder stages — derived from desk_china_ladder_models.js (authoritative: china_ladder.py). */
const CHINA_LADDER = typeof CHINA_LADDER_STAGES !== 'undefined' ? CHINA_LADDER_STAGES : [];

const STAGE_GROK_KEYS = {
  liquidity: 'liquidity_rates',
  credit: 'credit_confirmation',
  breadth: 'equity_breadth',
  highbeta: 'highbeta_btc',
  basis: 'basis_term_structure',
};

const TX_HEALTH_OPEN_THRESHOLD = 70;
const GROK_SPEC_VERSION = 'whinfell.phase2.2.grok.v1';
const PIPELINE_OBSERVATION_SKIP = /desk auto-transform|2\.2e|koyfin wide export/i;

function isPipelineBoilerplateObservation(text) {
  return !text || PIPELINE_OBSERVATION_SKIP.test(String(text));
}

function gatePlainEnglishHelper(gate) {
  if (gate.code === 'blocked') return 'No new BTC risk. Observation and client maintenance only.';
  if (gate.code === 'reduced') return 'Trading allowed, but reduced-size client structures only.';
  if (gate.code === 'open') return 'Full BTC access within desk policy.';
  return 'Enter Whinfell Score to evaluate access.';
}

function deriveL3CalendarRead(state) {
  const spread = parseFloat(String(state.btcL3?.basisSpread || '').replace(/[^\d.-]/g, ''));
  const low = parseFloat(state.btcL3?.refLow);
  const mid = parseFloat(state.btcL3?.refMid);
  const high = parseFloat(state.btcL3?.refHigh);
  if (Number.isNaN(spread)) return { bias: 'neutral', label: 'Enter basis spread and refs to evaluate calendar bias.' };
  if (!Number.isNaN(low) && spread <= low) return { bias: 'cheap', label: 'Cheap calendar — buy-spread bias at the low end of the ref range.' };
  if (!Number.isNaN(high) && spread >= high) return { bias: 'rich', label: 'Rich calendar — sell-spread bias at the high end of the ref range.' };
  if (!Number.isNaN(mid)) return { bias: 'neutral', label: `Spread ${spread} near ref mid ${mid} — no strong edge vs references.` };
  return { bias: 'neutral', label: `Spread ${spread} — compare to ref band when set.` };
}

function deriveOperatorAction(gate, intent) {
  if (gate.code === 'blocked') return { code: 'BLOCKED', cls: 'plain-english-action-blocked', line: 'BLOCKED — no new BTC risk; score below gate floor.' };
  if (gate.code === 'reduced' || intent === 'client_only' || intent === 'observe') {
    return { code: 'WATCH', cls: 'plain-english-action-watch', line: 'WATCH — reduced size, client-only; macro transmission mixed — do not scale yet.' };
  }
  if (intent === 'full_risk' && gate.code === 'open') {
    return { code: 'EXECUTE', cls: 'plain-english-action-execute', line: 'EXECUTE — normal sizing allowed within desk policy.' };
  }
  return { code: 'WATCH', cls: 'plain-english-action-watch', line: 'WATCH — reduced probe only until gate and transmission align.' };
}

function deriveLayer3ActionSurface(state, gate, health) {
  const op = state.operator || readOperatorFromDOM();
  const l3 = deriveL3CalendarRead(state);
  const base = deriveOperatorAction(gate, op.executionIntent);
  let posture = 'reduced';
  if (gate.code === 'blocked' || op.executionIntent === 'observe') posture = 'observe only';
  else if (op.executionIntent === 'client_only') posture = 'client-only, reduced size';
  else if (op.executionIntent === 'reduced_probe') posture = 'reduced probe';
  else if (op.executionIntent === 'full_risk' && gate.code === 'open') posture = 'full within desk policy';
  const reason = gate.code === 'blocked'
    ? 'Score below 50 — calendar arb blocked regardless of spread.'
    : l3.bias === 'cheap'
      ? 'Spread screens cheap versus refs, but macro transmission is still mixed.'
      : l3.label;
  return {
    ...base,
    posture,
    reason,
    keyRisk: `${health.weakestStage || 'Transmission chain'} remains the weakest link.`,
    spreadRead: l3.label,
  };
}

/** Why copy: 3 desk bullets — executive drawer sections use WTM_SignalDetailCopy templates. */
function whyBullets(b1, b2, b3) {
  return [b1, b2, b3];
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function deskDocHref(entry) {
  if (!entry) return DESK_REPO_URL;
  const path = entry.path || '';
  if (entry.external || path.startsWith('http://') || path.startsWith('https://')) return path;
  if (entry.local) return path.replace(/^\//, '');
  return DESK_GITHUB_BLOB + path.replace(/^\//, '');
}

function deskDocRawHref(path) {
  if (!path || path.startsWith('http')) return deskDocHref({ path });
  return DESK_GITHUB_RAW + path.replace(/^\//, '');
}

function deskDocAnchor(entry) {
  const href = deskDocHref(entry);
  const label = entry.label || entry.path || 'Doc';
  const aud = entry.audience ? `<span class="desk-docs-audience">(${escapeHtml(entry.audience)})</span>` : '';
  return `<a href="${escapeHtml(href)}" class="desk-doc-link" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>${aud}`;
}

function deskDocCatalogCount() {
  return DESK_DOC_CATALOG.reduce((n, grp) => n + (grp.docs || []).length, 0);
}

function renderDeskDocsPanel() {
  const targets = ['deskDocsList', 'deskDocsDrawerList'].map(id => el(id)).filter(Boolean);
  if (!targets.length) return;
  const groups = DESK_DOC_CATALOG.map(grp => {
    const items = (grp.docs || []).map(d => `<li>${deskDocAnchor(d)}</li>`).join('');
    return `<div class="desk-docs-group"><div class="desk-docs-group-title">${escapeHtml(grp.group)}</div><ul class="desk-docs-list">${items}</ul></div>`;
  }).join('');
  const count = deskDocCatalogCount();
  const html = `<p class="text-[9px] mb-2"><strong class="text-slate-200">${count} documents</strong> — v1.5 guides in <code>documentation/</code> · archive on <a href="${escapeHtml(COUSINS_REPO_URL)}" class="desk-doc-link" target="_blank" rel="noopener noreferrer">BUILD Cousins v2</a>. Public desk: <a href="${escapeHtml(DESK_PAGES_URL_PUBLIC)}" class="desk-doc-link" target="_blank" rel="noopener noreferrer">Pages fallback</a>.</p>${groups}`;
  targets.forEach(node => { node.innerHTML = html; });
}

function renderSignalDetailDocs() {
  const node = el('signalDetailDocs');
  if (!node) return;
  const picks = [
    { label: 'User Guide v1.5', path: 'documentation/Whinfell_Transmission_Control_User_Guide_v1.5.md', local: true },
    { label: 'Data Dictionary v1.5', path: 'documentation/DATA_DICTIONARY_v1.5.md', local: true },
    { label: 'SQ3 Reference', path: COUSINS_REPO_URL + '/blob/main/08_Deliverables/Whinfell_SQ3_Reference_v1.0.md', external: true },
    { label: 'Feedback log', path: COUSINS_REPO_URL + '/blob/main/08_Deliverables/Desk_Feedback_Log.md', external: true },
    { label: 'Live desk (public)', path: DESK_PAGES_URL_PUBLIC, external: true },
  ];
  const links = picks.map(d => deskDocAnchor(d)).join(' · ');
  node.innerHTML = `<p>${links}</p><p class="text-[9px] mt-1"><a href="#" class="desk-doc-link" id="signalDetailDocsOpenAll">Open full doc index in left rail</a></p>`;
  const openAll = el('signalDetailDocsOpenAll');
  if (openAll) {
    openAll.onclick = (e) => {
      e.preventDefault();
      openDeskDocsPanel();
    };
  }
}

function setDeskDocsOpen(open) {
  const drawer = el('deskDocsDrawer');
  const backdrop = el('deskDocsBackdrop');
  if (drawer) {
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
  }
  if (backdrop) {
    backdrop.classList.toggle('is-open', open);
    backdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
  }
  if (open) renderDeskDocsPanel();
}

function openDeskDocsPanel() {
  if (el('deskDocsDrawer')) {
    setDeskDocsOpen(true);
    return;
  }
  const panel = el('deskDocsPanel');
  const list = el('deskDocsList');
  if (panel) {
    panel.open = true;
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  if (list) list.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

const EXECUTIVE_WHY_IDS = new Set([
  'whyWhinfellScore', 'whyTransmission', 'whyGateState', 'whyShock', 'whyFreshness',
]);

function whyBlockFromBullets(bullets, labeled = false) {
  if (labeled) {
    const labels = window.WTM_SignalDetailCopy?.SIGNAL_DETAIL_DISPLAY?.bulletLabels
      || ['State', 'Drivers', 'Trigger'];
    const items = bullets.map((b, i) => `<li><strong>${labels[i] || 'Note'}:</strong> ${escapeHtml(b)}</li>`).join('');
    return `<ul class="why-list why-list--labeled">${items}</ul>`;
  }
  const items = bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('');
  return `<ul class="why-list">${items}</ul>`;
}

function setWhyHtml(id, bullets) {
  const node = el(id);
  if (node) node.innerHTML = whyBlockFromBullets(bullets, EXECUTIVE_WHY_IDS.has(id));
}

function formatLadderNets(health) {
  const nets = health.summary?.stageNets || [];
  return LADDER.map((row, i) => {
    const n = nets[i] ?? 0;
    return `${row.short} ${n > 0 ? '+' : ''}${n}`;
  }).join(' · ');
}

function weakestNet(health) {
  const idx = health.weakestIdx ?? health.summary?.weakestIdx ?? -1;
  if (idx < 0) return 0;
  return health.summary?.stageNets?.[idx] ?? 0;
}

const CHANNEL_LABELS = {
  liquidity: 'rates',
  credit: 'credit',
  breadth: 'equities',
  highbeta: 'BTC',
  basis: 'basis',
};

function strongChannelLabels(health) {
  const nets = health.summary?.stageNets || [];
  const weakest = health.weakestStage;
  const names = LADDER.filter((row, i) => row.name !== weakest && (nets[i] ?? 0) >= 0)
    .map(row => CHANNEL_LABELS[row.id] || row.short.toLowerCase())
    .filter((v, i, a) => a.indexOf(v) === i);
  if (!names.length) return 'other macro channels';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

function sq3DefineLine() {
  return `SQ3 = Policy STR. (35%) + State IMP. (35%) + Growth IMP. (30%) — composite 0–100 China policy transmission score.`;
}

function regimeBandFlavor(tag) {
  const t = String(tag || '').toLowerCase();
  if (/fragile/.test(t)) return 'sessions like this tend to pay client carry, not prop convexity; mid-40s win-rate on risk-on days';
  if (/risk-on|constructive/.test(t)) return 'carry-friendly when scores confirm; prop opens above health 70';
  if (/risk-off|compression|crisis/.test(t)) return 'convexity and hedges dominate; calendar arb rarely sized';
  return 'carry vs convexity posture follows score and health bands, not tag alone';
}

function buildWhyExplanations(state, gate, health) {
  const score = gate.score;
  const zone = gate.zone || scoreZone(score);
  const op = state.operator || readOperatorFromDOM();
  const l3 = deriveL3CalendarRead(state);
  const txManual = state.intake.transmissionState;
  const txManualLabel = txManual && TX_META[txManual] ? TX_META[txManual].label : (txManual || 'not set');
  const shockActive = state.tracer?.activeShock && SHOCKS[state.tracer.activeShock];
  const sq3 = gate.sq3Result;
  const china = state.china || {};
  const weakest = health.weakestStage || 'Liquidity & Rates';
  const wNet = weakestNet(health);
  const wNetStr = `${wNet > 0 ? '+' : ''}${wNet}`;
  const ladderNets = formatLadderNets(health);
  const spread = state.btcL3?.basisSpread ?? '—';
  const refLow = state.btcL3?.refLow || '—';
  const refMid = state.btcL3?.refMid || '—';
  const refHigh = state.btcL3?.refHigh || '—';
  const refs = `${refLow}/${refMid}/${refHigh}`;
  const sq3Line = sq3 ? `China SQ3 ${gate.sq3Score} (${gate.sq3Band})` : 'China SQ3 not computed';
  const suggestedIntent = suggestExecutionIntent(gate, op.confidence);
  const healthGap = TX_HEALTH_OPEN_THRESHOLD - health.score;

  const sq3Score = sq3 ? gate.sq3Score : null;
  const sq3Band = sq3 ? gate.sq3Band : '—';
  const policyStr = china.policyStrength ?? '—';
  const stateImp = china.stateImpulse ?? '—';
  const growthImp = china.growthImpulse ?? '—';
  const channels = strongChannelLabels(health);
  const scoreStr = Number.isNaN(score) ? '—' : score;
  const prov = state.provenance || createEmptyProvenance();
  const freshStatus = prov.freshnessStatus || computeFreshnessFromIso(prov.dataAsOf).status;
  const asOfLabel = prov.dataAsOf
    ? (typeof window.WTM_formatLocalStamp === 'function'
      ? window.WTM_formatLocalStamp(prov.dataAsOf)
      : new Date(prov.dataAsOf).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }))
    : 'not set';
  const snapId = prov.snapshotId || 'none';

  const signalDetailCtx = {
    score,
    scoreStr,
    health: health.score,
    healthLabel: health.label,
    healthOpen: TX_HEALTH_OPEN_THRESHOLD,
    healthGap: healthGap > 0 ? healthGap : 0,
    scoreToAmber: Number.isNaN(score) ? '—' : Math.max(0, 50 - score),
    scoreToGreen: Number.isNaN(score) ? '—' : Math.max(0, 65 - score),
    weakest,
    wNet: wNetStr,
    ladderNets,
    sq3Line,
    channels,
    spread,
    refs,
    gateCode: gate.code,
    gateTitle: gateStripTitle(gate),
    zoneText: zone.text,
    shockActive: !!shockActive,
    shockLabel: shockActive?.label || '',
    shockProb: op.shockProbability,
    shockHorizon: op.shockHorizon,
    freshStatus,
    asOf: asOfLabel,
    snapId,
    freshHours: FRESH_HOURS,
    staleHours: STALE_HOURS,
  };
  const executiveCopy = window.WTM_SignalDetailCopy?.buildExecutiveBullets(signalDetailCtx) || {};
  const whinfell = executiveCopy.whinfellScore || whyBullets('Score unset.', 'Drivers unavailable.', 'Enter score.');
  const transmission = executiveCopy.transmission || whyBullets('Transmission pending.', '—', '—');
  const gateWhy = executiveCopy.gateState || whyBullets('Gate pending.', '—', '—');
  const freshness = executiveCopy.freshness || whyBullets('Freshness pending.', '—', '—');

  const transmissionState = whyBullets(
    `Intake "${txManualLabel}" vs computed health ${health.score} (${health.label}) — dropdown is narrative; sizing uses ${health.score}. Amber 50–64 + Stressed intake historically = client-only despite narrative risk-on.`,
    `Health built from ladder nets (${ladderNets}); weakest ${weakest} (${wNetStr}). Past mismatches (Stressed label, health 63) still produced choppy BTC basis — narrative ran hot, tape ran mixed.`,
    `Would change if tracer apply lifts health ≥ ${TX_HEALTH_OPEN_THRESHOLD} or dropdown shifts to match health band — target net +2 on ${weakest}.`,
  );

  const shock = executiveCopy.shock || whyBullets('Shock pending.', '—', '—');

  const regime = state.intake.regimeTag
    ? whyBullets(
        `Regime "${state.intake.regimeTag}" — score ${scoreStr} (${zone.text}), health ${health.score}: ${regimeBandFlavor(state.intake.regimeTag)}.`,
        `Tag fits 50–64 score + health ${health.score} < ${TX_HEALTH_OPEN_THRESHOLD} mix — past Fragile Risk-On tapes: BTC up days led credit lag; basis cheap reads faded when rates net negative.`,
        `Would change if tag upgraded to broad Risk-On — needs score ≥ 65 and health ≥ ${TX_HEALTH_OPEN_THRESHOLD}; downgrade if score < 50 or health < 50.`,
      )
    : whyBullets(
        `Regime tag unset — score ${scoreStr}, health ${health.score} still drive gate; untagged exports lack narrative band context for handover.`,
        `Optional tag would anchor ${sq3Line} + ladder ${ladderNets} — desks often label this mix "Fragile Risk-On" when Amber 50–64 meets Mixed health.`,
        `Would change when operator sets tag matching tape — pair with score band and health ${health.score} for audit trail.`,
      );

  let sq3Why;
  if (!sq3) {
    sq3Why = whyBullets(
      sq3DefineLine() + ' Score not computed — dual-track China filter offline.',
      'Need Policy STR., State IMP., Growth IMP. inputs — past incomplete SQ3 sessions defaulted to extra caution on China-linked BTC and credit beta regardless of Global score.',
      'Would change when all three inputs entered or CHINA POLICY EXPORT imported — bands: <50 Impaired, 50–64 mid-band, ≥65 constructive.',
    );
  } else if (gate.sq3Score < 50) {
    sq3Why = whyBullets(
      sq3DefineLine() + ` Composite ${gate.sq3Score} (<50 Impaired) — historically China-led transmission broken; global BTC treated as hedge sleeve, not carry anchor.`,
      `Policy STR. ${policyStr}, State IMP. ${stateImp}, Growth IMP. ${growthImp} — past Impaired SQ3 mixes saw BTC decouple from copper/EM FX and credit widen ahead of equities.`,
      `Would change if SQ3 ≥ 50 (mid-band) — needs State IMP. toward +30+ or Policy/Growth lift; Global gate still separate at score ${scoreStr}.`,
    );
  } else if (gate.sq3Score < 65) {
    sq3Why = whyBullets(
      sq3DefineLine() + ` Composite ${gate.sq3Score} — mid-50s band (${sq3Band}): China transmission mixed; historically choppy global risk — BTC beta unstable, basis trades client-sized only.`,
      `Policy STR. ${policyStr}, State IMP. ${stateImp}, Growth IMP. ${growthImp} — past mid-50s SQ3 with low State IMP. (${stateImp}): industrial policy strong but execution weak; BTC range-bound, credit flat-to-wider, equities led on/off.`,
      `Would change if SQ3 ≥ 65 (high-60s constructive) — State IMP. toward +50+ typically needed; at 65+ past sessions saw BTC track cyclicals better and China impulse support global carry.`,
    );
  } else {
    sq3Why = whyBullets(
      sq3DefineLine() + ` Composite ${gate.sq3Score} — high-60s+ (${sq3Band}): constructive China-led transmission; historically tailwind to global cyclicals and cleaner BTC–credit coupling.`,
      `Policy STR. ${policyStr}, State IMP. ${stateImp}, Growth IMP. ${growthImp} — past high-60s SQ3: BTC basis held ref band ${refs}, credit tightened 5–15bps, equities breadth confirmed 60–70% of sessions.`,
      `Would change if SQ3 < 65 — watch State IMP. < +30 or Growth IMP. slip; dual-track caution returns below 50.`,
    );
  }

  const intentBands = { observe: 'L0 observe', client_only: 'L1 client/reduced', reduced_probe: 'L2 desk probe', full_risk: 'L3 full policy' };
  const executionIntent = whyBullets(
    `Intent "${op.executionIntent}" (${intentBands[op.executionIntent] || op.executionIntent}) — gate ${gateStripTitle(gate)} at score ${scoreStr}, health ${health.score}: L1 historically ~½ prop notional vs L3.`,
    `System suggests "${suggestedIntent}" at confidence ${op.confidence}/100 — past Reduced-gate + L1 mixes: BTC calendar cheap (${spread} vs ${refs}) done for clients, prop flat until health ≥ ${TX_HEALTH_OPEN_THRESHOLD}.`,
    `Would change to reduced_probe if confidence ≥ 70 and gate Open (score ≥ 65, health ≥ ${TX_HEALTH_OPEN_THRESHOLD}); full_risk needs confidence ≥ 75 + Open.`,
  );

  const confBand = op.confidence < 45 ? '0–44 low' : op.confidence < 70 ? '45–69 moderate' : '70+ high';
  const operatorConfidence = op.confidence < 45
    ? whyBullets(
        `Confidence ${op.confidence}/100 — ${confBand} band: historically observe / minimal client maintenance; prop hit-rate <30% in similar reads.`,
        `Gate ${gateStripTitle(gate)}, score ${scoreStr}, health ${health.score}, ${weakest} net ${wNetStr} — past low-confidence + health < 65: BTC basis cheap signals faded within 1–2 sessions.`,
        `Would change if confidence ≥ 45 with tracer confirm on ${weakest}; ≥ 70 needed before reduced_probe at open gate.`,
      )
    : op.confidence >= 70
      ? whyBullets(
          `Confidence ${op.confidence}/100 — ${confBand} band: probe-grade conviction; historically supports L2 reduced_probe when gate Open.`,
          `Gate still ${gateStripTitle(gate)} — score ${scoreStr}, health ${health.score} vs ${TX_HEALTH_OPEN_THRESHOLD}; past high-confidence + Reduced gate: conviction did not override sizing — basis trades still half-sized.`,
          `Would change to full_risk band at confidence ≥ 75 only with gate Open; drops below 70 if health stays < ${TX_HEALTH_OPEN_THRESHOLD}.`,
        )
      : whyBullets(
          `Confidence ${op.confidence}/100 — ${confBand} band (45–69): client-grade conviction; aligns with L1 client_only at gate ${gateStripTitle(gate)}.`,
          `Score ${scoreStr}, health ${health.score}, spread ${spread} — past 55–65 confidence + Amber 50–64: client basis rolls cleared ~45% with smaller drawdowns than prop probes.`,
          `Would change if confidence ≥ 70 and health ≥ ${TX_HEALTH_OPEN_THRESHOLD}; falls < 45 favors observe-only.`,
        );

  const basisHist = {
    flat: 'flat band — carry muted; historically theta-only client rolls, prop flat',
    'normal contango': 'normal contango — carry sleeve; past normal contango + Amber score: buy-spread bias ~50% win-rate client-sized',
    'steep contango': 'steep contango — wide carry needs score ≥ 65 and health ≥ 70; else stop-out risk elevated',
    'stress backwardation': 'stress backwardation — convexity dominates; sell-spread / avoid historically outperformed carry',
  };
  const basisRegime = whyBullets(
    `Basis regime "${op.basisRegimeLabel}" — ${basisHist[op.basisRegimeLabel] || 'curve shape tag'}; spread ${spread} vs refs ${refs}.`,
    `Gate ${gateStripTitle(gate)}, health ${health.score}, score ${scoreStr} — past normal contango at spread ${spread} with health 60–65: BTC calendar cheap vs ${refLow} worked clients but prop added size only after health ≥ ${TX_HEALTH_OPEN_THRESHOLD}.`,
    `Would change to flat near ref mid ${refMid}; to stress backwardation above ref high ${refHigh}; regime label should follow curve, not override gate.`,
  );

  const l3Surface = deriveLayer3ActionSurface(state, gate, health);
  const layer3Spread = l3.bias === 'cheap'
    ? whyBullets(
        `Layer 3 ${l3Surface.code} — cheap spread ${spread} vs refs ${refs} (≤ ref low ${refLow}); posture ${l3Surface.posture}. Sessions like this tend to pay client carry, not prop convexity, until health ≥ ${TX_HEALTH_OPEN_THRESHOLD}.`,
        `Gate ${gateStripTitle(gate)}, health ${health.score}, confidence ${op.confidence} — past WATCH + cheap at Amber 50–64 / health 60–65: BTC buy-spread worked ~45% for clients; mean-revert to ref mid ${refMid} in 3–5 sessions when ${weakest} net ${wNetStr}.`,
        `Would change to EXECUTE sizing if spread holds cheap AND health ≥ ${TX_HEALTH_OPEN_THRESHOLD} + score ≥ 65; WATCH persists if spread > ${refMid} or health stays ${health.score}.`,
      )
    : l3.bias === 'rich'
      ? whyBullets(
          `Spread ${spread} ≥ ref high ${refHigh} — rich band vs ${refs}; historically sell-spread or avoid; carry win-rate drops ~20pts vs cheap band.`,
          `Gate ${gateStripTitle(gate)}, score ${scoreStr}, health ${health.score} — past rich reads: BTC basis compressed toward ${refMid} after credit firming; prop shorts crowded when health < ${TX_HEALTH_OPEN_THRESHOLD}.`,
          `Would change if spread compresses to ≤ ${refLow} (cheap) or inside ${refLow}–${refHigh}; neutral at ref mid ${refMid}.`,
        )
      : whyBullets(
          `Spread ${spread} inside ref band ${refs} — neutral; historically no edge: theta harvest only, win-rate ~50/50 near ref mid ${refMid}.`,
          `Gate ${gateStripTitle(gate)}, intent ${op.executionIntent}, health ${health.score} — past neutral spreads with Mixed health: desk waited for ≤ ${refLow} or ≥ ${refHigh} before adding BTC calendar risk.`,
          `Would change if spread ≤ ${refLow} (cheap/buy-spread) or ≥ ${refHigh} (rich/sell-spread); ${l3Surface.code} posture ${l3Surface.posture} until then.`,
        );

  return {
    whinfellScore: whinfell,
    transmission,
    transmissionState,
    gateState: gateWhy,
    shock,
    regimeTag: regime,
    chinaSq3: sq3Why,
    executionIntent,
    operatorConfidence,
    basisRegime,
    freshness,
    layer3Spread,
    txMappingNote: `Intake: ${txManualLabel} · Live health: ${health.score} ${health.label} (computed, not the dropdown).`,
    l3Surface,
  };
}

function renderWhyExplanations(state, gate, health) {
  const w = buildWhyExplanations(state, gate, health);
  setWhyHtml('whyWhinfellScore', w.whinfellScore);
  setWhyHtml('whyTransmission', w.transmission);
  setWhyHtml('whyGateState', w.gateState);
  setWhyHtml('whyShock', w.shock);
  setWhyHtml('whyFreshness', w.freshness);
  setWhyHtml('whyTransmissionState', w.transmissionState);
  setWhyHtml('whyRegimeTag', w.regimeTag);
  setWhyHtml('whyChinaSq3', w.chinaSq3);
  setWhyHtml('whyExecutionIntent', w.executionIntent);
  setWhyHtml('whyOperatorConfidence', w.operatorConfidence);
  setWhyHtml('whyBasisRegime', w.basisRegime);
  setWhyHtml('whyLayer3Spread', w.layer3Spread);
  const txNote = el('txMappingNote');
  if (txNote) txNote.textContent = w.txMappingNote;
  const l3 = w.l3Surface;
  if (el('l3ActionCode')) el('l3ActionCode').textContent = l3.code;
  if (el('l3ActionPosture')) el('l3ActionPosture').textContent = l3.posture;
  if (el('l3ActionReason')) el('l3ActionReason').textContent = l3.reason;
  if (el('l3ActionKeyRisk')) el('l3ActionKeyRisk').textContent = l3.keyRisk;
}

function buildDeskKeyObservation(state, gate, health, l3Read) {
  const custom = (state.research?.keyObservation || el('keyObservation')?.value || '').trim();
  if (custom && !isPipelineBoilerplateObservation(custom)) return custom;
  const weakest = health.weakestStage || 'the transmission chain';
  if (gate.code === 'blocked') {
    return `Score below 50 — no new BTC calendar risk; monitor ${weakest} before reconsidering.`;
  }
  if (l3Read.bias === 'cheap') {
    return 'Cheap BTC calendar signal is permitted but should stay reduced-size and client-only until transmission improves.';
  }
  return `Weakest link remains ${weakest}; BTC execution stays gate-aware and reduced-sizing only.`;
}

function buildPlainEnglishSummary(state, gate, health) {
  const op = state.operator || readOperatorFromDOM();
  const l3 = deriveL3CalendarRead(state);
  const regime = state.intake.regimeTag || 'unset regime';
  const txLabel = health.score >= TX_HEALTH_OPEN_THRESHOLD ? 'constructive enough' : 'mixed';
  const gateWord = gate.code === 'blocked' ? 'blocked' : gate.code === 'reduced' ? 'allowed but constrained' : 'allowed';
  const backdrop = gate.code === 'blocked'
    ? 'The backdrop is too weak for new BTC basis risk.'
    : `The market backdrop is fragile, not broken. Risk can still work, but support is uneven — especially around ${health.weakestStage || 'liquidity'} — so this is not an environment for aggressive BTC basis risk.`;
  const calendar = gate.code === 'blocked'
    ? 'BTC calendar arb is blocked at the current score.'
    : `BTC calendar arb is ${gateWord}. Score ${gate.score ?? '—'} keeps you above the hard block line, but transmission is ${txLabel}, so stay small and client-focused.`;
  const spreadNote = l3.bias === 'cheap'
    ? 'The spread looks cheap versus refs — buy-spread logic is reasonable, but macro backdrop does not justify sizing up.'
    : l3.label;
  const nextStep = appState.suggestedTracer && Object.keys(appState.suggestedTracer).length
    ? 'Apply pending tracer rows, save state, then reassess intent before sizing up.'
    : 'Keep client-only intent unless transmission health clears 70.';
  return {
    paragraphs: [backdrop, calendar, spreadNote, `Regime read: ${regime}. Next: ${nextStep}`],
    l3Line: `Layer 3: ${l3.label}${gate.code === 'reduced' ? ' Reduced-size only.' : ''}`,
    action: deriveOperatorAction(gate, op.executionIntent),
    keyObservation: buildDeskKeyObservation(state, gate, health, l3),
  };
}

function renderPlainEnglishSummary(state, gate, health) {
  const summary = buildPlainEnglishSummary(state, gate, health);
  const l3Surface = deriveLayer3ActionSurface(state, gate, health);
  const body = el('plainEnglishBody');
  const l3 = el('plainEnglishL3');
  const action = el('plainEnglishAction');
  const gateHelper = el('gateHelperText');
  if (body) body.textContent = summary.paragraphs.join(' ');
  if (l3) l3.textContent = `${summary.l3Line} Next: ${l3Surface.code} · ${l3Surface.posture}.`;
  if (gateHelper) {
    gateHelper.textContent = gatePlainEnglishHelper(gate);
    syncMetaDisclosure(gateHelper);
  }
  if (action) {
    action.textContent = summary.action.code;
    action.className = `plain-english-action ${summary.action.cls}`;
    action.title = summary.action.line;
  }
}
const EXECUTION_INTENTS = ['observe', 'client_only', 'reduced_probe', 'full_risk'];
const GROK_OPERATOR_PROMPT = `You are supporting the Whinfell Transmission Control operator console.

Return your answer in this exact order:

SECTION 1 — PLAIN ENGLISH
Write for a smart market team that does not yet know the tool well.
Explain: regime setup, whether BTC calendar arb is allowed/constrained/blocked, main risk, and next steps.
Keep this direct, practical, and non-technical where possible.

SECTION 2 — TOOL MAP
Map the read into: Whinfell Score, Transmission State, Regime Tag, Gate State, Execution Intent, Operator Confidence, Shock Probability/Horizon, Basis Regime Label, Layer 3 action, Key Observation.

SECTION 3 — UI CHECK
Say whether the UI helps or hurts understanding. Recommend only clarity, gate visibility, operator safety, or plain-English/tool consistency improvements.
If on-screen wording is too abstract or tool-native, rewrite exact helper text in simpler desk English (Gate helper, Key Observation placeholder, Evidence Note placeholder, Layer 3 action hint).

SECTION 4 — OPERATOR ACTION
One line: EXECUTE / WATCH / BLOCKED — include size posture and main reason.

SECTION 5 — WTM EXPORT
End with exactly:
--- WTM EXPORT ---
Whinfell Score: <value>
Transmission State: <value>
Regime Tag: <value>
Key Observation: <value>

Rules: Plain English before tool language. Score < 50 → BTC calendar arb BLOCKED. Tight Risk → client structures only, reduced size. Flag confusing or inconsistent tool state.`;

const POSTURE_LABELS = { full: 'Full Gross', selective: 'Selective', light: 'Light Gross', defensive: 'Defensive', flat: 'Flat' };
const POSTURE_RANK = { flat: 0, defensive: 1, light: 2, selective: 3, full: 4 };

const SHOCKS = {
  creditWidening: { label: 'Credit Widening', effects: { credit: { d1: 'down', d5: 'down' }, liquidity: { d1: 'down', d5: 'down' } } },
  curveInversion: { label: 'Curve Inversion', effects: { liquidity: { d1: 'down', d5: 'down' }, breadth: { d1: 'flat', d5: 'flat' } } },
  btcDecoupling: { label: 'BTC Decoupling', effects: { highbeta: { d1: 'down', d5: 'down' }, basis: { d1: 'flat', d5: 'flat' } } },
  volSpike: { label: 'Vol Spike', effects: { highbeta: { d1: 'down', d5: 'down' }, basis: { d1: 'down', d5: 'down' } } },
};

const PROMPT_L2 = `WTM Layer 2 — BTC Options Workflow\n\nContext: Whinfell Transmission Model intake complete.\n- Whinfell Score: [from intake]\n- Transmission State: [from intake]\n- Regime Tag: [from intake]\n- Gate Status: [Allowed / Tight Risk Band / NO NEW BTC RISK]\n\nTask:\n1) Confirm gate permits BTC options activity (if Tight Risk Band → reduced sizing only)\n2) Map IBIT/BTC vol surface vs credit transmission alignment\n3) Recommend structure: covered / spread / collar — with max notional\n4) State invalidation: score threshold, vol spike, credit impairment\n5) Output: EXECUTE (sized) / WATCH / BLOCKED`;

const PROMPT_L3_BASE = `WTM Layer 3 — BTC Calendar Arb Agent\n\nContext: Whinfell Transmission Model intake complete.\n- Whinfell Score: [from intake]\n- Transmission State: [from intake]\n- Regime Tag: [from intake]\n- Gate Status: [Allowed / Tight Risk Band / NO NEW BTC RISK]\n\nTask:\n1) Verify gate status permits calendar arb (BLOCKED if Score < 50)\n2) Read near vs far BTC basis from Barchart — compute attractiveness\n3) Rank calendar spread opportunities vs WTM transmission read\n4) If Tight Risk Band: client basis structures only, reduced size\n5) Output one-line action: EXECUTE / WATCH / BLOCKED with size and risks`;

const PROMPTS = [
  { id: 'A', title: 'WTM Transmission Read & Regime Classification', desc: 'Classify today\u2019s overall regime and key signals.',
    inputs: 'WTM map, Whinfell Score, credit, rates, breadth, futures, BTC/IBIT',
    outputs: 'Regime state, score zone, confirming/disconfirming signals, posture rec',
    text: `Using the current Whinfell Transmission Map (regime banner, Whinfell Score, credit inputs, rates, breadth, futures leadership, and BTC/IBIT behavior), classify today\u2019s transmission state.\n\n1. State: Risk-On, Fragile Risk-On, Neutral, Risk-Off, or Crisis.\n2. Whinfell Score and zone (Green / Amber / Red).\n3. Top 2 confirming signals and top 2 disconfirming signals.\n4. One-line desk posture recommendation and what would cause an upgrade or downgrade.\n\nBe concise and transmission-focused.\n\nEnd your response with a WTM EXPORT v2.1 block (exact labels) for Transmission Control import:\n--- WTM EXPORT v2.1 ---\nWhinfell Score: [0-100]\nTransmission State: [Normal / Stressed / Disorderly / Crisis]\nRegime Tag: [phrase]\nKey Observation: [1-2 sentences]\nGross Risk Recommendation: [e.g. 35% total, Light posture]\nBTC Bias: [Confirming / Dragging / Neutral]\nTimestamp: [ISO datetime]\nSQ3 Score: [0-100]\nSQ3 Band: [Impaired / Mixed / Fragile / Constructive / Strong]\nPolicy Strength: [0-100]\nState Impulse Score: [-100 to 100]\nGrowth Impulse Score: [0-100]` },
  { id: 'B', title: 'WTM Posture & Gross-Risk Recommendation', desc: 'Set daily gross risk and sizing.',
    inputs: 'Whinfell Score, transmission state, desk posture, capital base',
    outputs: 'Gross risk %, per-trade sizing, concurrent trade limits, R-multiple calc',
    text: `Using current Whinfell Score, transmission state, and desk posture, recommend gross risk and position sizing for today.\n\n1. Recommended gross risk range (% of capital deployed).\n2. Max per-trade risk (% and dollar amount).\n3. Max concurrent trades.\n4. For a candidate trade (entry, stop, target, account size), calculate: contract/share count, notional, risk $, reward $, and R-multiple.\n\nKeep sizing conservative and aligned with the current Whinfell regime.` },
  { id: 'C', title: 'WTM Trade Evaluation & Ranking', desc: 'Evaluate and rank candidate trades.',
    inputs: 'Candidate trade list, WTM regime, transmission ladder read',
    outputs: 'Ranked Core / Tactical / Watchlist, WTM Trade Score, ban flags',
    text: `Given a list of candidate trades (tickers, direction, setup), evaluate each through the Whinfell lens and rank them.\n\nFor each trade:\n- Regime fit\n- Basis/term-structure alignment\n- Liquidity and edge\n- Transmission confirmation\n\nOutput a ranked list: Core, Tactical, Watchlist, with one-line justification and WTM Trade Score (0\u2013100). Flag any trades that should be banned due to regime mismatch.` },
  { id: 'D', title: 'WTM Income Projection from Current Book', desc: 'Project income scenarios.',
    inputs: 'Current book, sizes, key levels, Whinfell regime',
    outputs: 'Base/favorable/adverse P&L scenarios, income posture statement',
    text: `Using the current book (positions, sizes, key levels) and Whinfell regime, build projected income scenarios for the next session/week.\n\n1. Base, favorable, and adverse scenarios with estimated P&L ($ and % of capital).\n2. Key drivers (carry, basis, directional, convexity).\n3. One-line income posture statement.\n\nBe realistic and tie directly to the current Whinfell Score and transmission state.` },
  { id: 'E', title: 'WTM Divergence & Risk Compression', desc: 'Diagnose divergences and recommend risk actions.',
    inputs: 'Tape behavior vs WTM signals, cross-asset divergences',
    outputs: 'Divergence diagnosis, compression actions, re-expansion criteria',
    text: `When the tape diverges from Whinfell transmission signals, diagnose and recommend risk compression.\n\n1. Describe key divergences (credit vs equities, BTC vs SPY, futures vs regime, etc.).\n2. Classify as transient or regime-threatening.\n3. Recommend concrete actions: reduce gross, rotate, tighten stops, or exit.\n4. State what evidence would justify re-expanding risk.\n\nBe concise and action-oriented.` },
];

let appState = createEmptyState();
let preShockSnapshot = null;
let compareSnapshotId = null;
let scenarioLoop = { variants: [], lastResults: [] };

function el(id) {
  const node = document.getElementById(id);
  if (!node && WTM_BOOT_VERBOSE) bootLog('debug', `missing #${id}`);
  return node;
}

function setElText(id, text) {
  const node = el(id);
  if (node) node.textContent = text;
}

function createEmptyHorizons() {
  const h = {};
  LADDER.forEach(row => { h[row.id] = { d1: '', d5: '', d20: '', d60: '' }; });
  return h;
}

function createEmptyChinaHorizons() {
  const h = {};
  CHINA_LADDER.forEach(row => { h[row.id] = { d1: '', d5: '', d20: '', d60: '' }; });
  return h;
}

function deriveChinaLadderKeyObservation(weakestName, weakestScore, finalBand) {
  let sizing = 'size within desk policy';
  if (finalBand === 'Impaired') sizing = 'avoid new China-linked exposure';
  else if (finalBand === 'Mixed / Fragile') sizing = 'keep China-linked beta selective and reduced size';
  else if (finalBand === 'Constructive') sizing = 'normal China-linked sizing acceptable within Global gate';
  else if (finalBand === 'Strong') sizing = 'China ladder aligned — size within desk policy';
  return `Weakest stage ${weakestName} at ${weakestScore}/100 — ${sizing} until composite clears 50.`;
}

function buildChinaLadderExportBlock(state) {
  const read = computeChinaLadderRead(state);
  if (!read.hasHorizons || read.sq3 == null || read.finalScore == null) return '';
  const obs = deriveChinaLadderKeyObservation(read.weakestStage, read.weakestScore, read.band);
  return [
    `--- ${CHINA_LADDER_EXPORT_FORMAT} ---`,
    `China Raw Score: ${read.raw}`,
    `China Final Score: ${read.finalScore}`,
    `China Final Band: ${read.band}`,
    `SQ3 Policy Score: ${read.sq3}`,
    `Weakest China Stage: ${read.weakestStage}`,
    `Key China Observation: ${obs}`,
  ].join('\n');
}

function chinaLadderMasterState(state) {
  const read = computeChinaLadderRead(state);
  if (!read.hasHorizons || read.sq3 == null || read.finalScore == null) return null;
  return {
    raw: read.raw,
    final: read.finalScore,
    band: read.band,
    weakest_stage: read.weakestStage,
    sq3_score: read.sq3,
  };
}

/** China ladder read — composite weakest (mode='composite') per china_ladder.py. */
function computeChinaLadderRead(state) {
  const horizons = state.chinaLadder?.horizons || createEmptyChinaHorizons();
  const stageRows = CHINA_LADDER.map(row => {
    const score = compositeChinaStageScore(row.id, horizons);
    const net = chinaHorizonNet(horizons[row.id] || {});
    return { id: row.id, name: row.name, score, net };
  });
  const stageScores = {};
  stageRows.forEach(r => { stageScores[r.id] = r.score; });
  const raw = Math.round(stageRows.reduce((sum, r) => sum + r.score, 0) / Math.max(stageRows.length, 1));
  const gate = deriveGate(state);
  const sq3 = gate.sq3Result ? gate.sq3Score : null;
  const sq3PolicyBand = gate.sq3Result ? gate.sq3Band : null;
  const multiplier = sq3 != null ? chinaSq3Multiplier(sq3) : null;
  const finalScore = multiplier != null
    ? Math.max(0, Math.min(100, Math.round(raw * multiplier)))
    : null;
  const bandInfo = finalScore != null ? chinaLadderFinalBand(finalScore) : { band: '—', desk_meaning: '—' };
  const weakest = weakestStage(stageRows, 'composite');
  const handicapLine = finalScore != null
    ? formatChinaHandicapLine(raw, sq3, multiplier, finalScore, bandInfo.band, bandInfo.desk_meaning, sq3PolicyBand)
    : null;
  return {
    horizons,
    stageScores,
    raw,
    sq3,
    sq3PolicyBand,
    multiplier,
    finalScore,
    band: bandInfo.band,
    deskMeaning: bandInfo.desk_meaning,
    handicapLine,
    stageNets: stageRows.map(r => r.net),
    weakestStage: weakest.name,
    weakestId: weakest.stage_id,
    weakestScore: weakest.value,
    hasHorizons: CHINA_LADDER.some(row => HORIZONS.some(h => horizons[row.id]?.[h])),
  };
}

function createEmptyShockConfig() {
  return { intensity: 'full', disabledStages: [] };
}

/** Pure: merge pipeline suggestions into horizon map (no DOM). */
function applySuggestedMarks(horizons, suggested) {
  const out = JSON.parse(JSON.stringify(horizons || createEmptyHorizons()));
  Object.keys(suggested || {}).forEach(stageId => {
    if (!out[stageId]) out[stageId] = { d1: '', d5: '', d20: '', d60: '' };
    HORIZONS.forEach(h => {
      if (suggested[stageId]?.[h]) out[stageId][h] = suggested[stageId][h];
    });
  });
  return out;
}

const TRACER_FLOW_LABELS = {
  suggested: 'Suggestions Pending',
  confirmed: 'Operator Confirmed',
  override: 'Manual Override',
  empty: 'Operator Marked',
};

/** Pure: tracer matrix chrome from tracer.flow + suggestions only. */
function getTracerChrome(tracerMeta, suggestedTracer) {
  let flow = 'empty';
  if (tracerMeta?.flow === 'override') flow = 'override';
  else if (suggestedTracer && Object.keys(suggestedTracer).length) flow = 'suggested';
  else if (tracerMeta?.flow === 'confirmed') flow = 'confirmed';
  const label = TRACER_FLOW_LABELS[flow] || TRACER_FLOW_LABELS.empty;
  const badgeClass = flow === 'suggested' ? 'tracer-chip-suggested'
    : flow === 'confirmed' ? 'tracer-chip-confirmed'
    : flow === 'override' ? 'tracer-chip-override'
    : 'border-wtm-border text-wtm-muted';
  const tableClass = flow === 'suggested' ? 'tracer-flow-suggested'
    : flow === 'confirmed' ? 'tracer-flow-confirmed'
    : flow === 'override' ? 'tracer-flow-override' : '';
  const title = flow === 'confirmed' ? 'Horizon Matrix — Operator Confirmed'
    : flow === 'override' ? 'Horizon Matrix — Manual Override'
    : flow === 'suggested' ? 'Horizon Matrix — Review Suggestions'
    : 'Horizon Matrix — Operator Marked';
  return { flow, label, badgeClass, tableClass, title };
}

/** Pure: resolve hybrid tracer flow state (never reads provenance.manualOverride). */
function getTracerFlowState(_prov, suggestedTracer, tracerMeta) {
  return getTracerChrome(tracerMeta, suggestedTracer).flow;
}

/** Pure: intake edit after hydration — command bar override only. */
function applyIntakeOverride(prov) {
  return { ...(prov || createEmptyProvenance()), manualOverride: true };
}

/** Pure: horizon edit or Manual Override — tracer override + provenance flag. */
function applyHorizonOverride(state) {
  const s = state || {};
  return {
    ...s,
    tracer: { ...(s.tracer || {}), flow: 'override' },
    suggestedTracer: null,
    provenance: { ...(s.provenance || createEmptyProvenance()), manualOverride: true },
  };
}

function createEmptyProvenance() {
  return {
    snapshotId: '', lineageHash: '', validationStatus: '', dataAsOf: null,
    sourceChannel: '', freshnessStatus: '', hydratedAt: null, manualOverride: false,
  };
}

function createEmptyCommandBarAuthority() {
  return {
    active: false,
    whinfellScore: null,
    scoreZone: null,
    transmissionState: '',
    regimeTag: '',
    sq3Score: null,
    sq3Band: '',
    gateLabel: '',
    gateSub: '',
    gateGlow: '',
    gateTitleCls: 'text-wtm-muted',
    grossRiskPct: null,
    grossPosture: '',
    freshnessStatus: '',
    freshnessLabel: '',
    dataAsOf: null,
    sourceChannel: '',
    snapshotId: '',
  };
}

function freshnessDotCls(status) {
  if (status === 'fresh') return 'freshness-dot freshness-dot-fresh';
  if (status === 'aging') return 'freshness-dot freshness-dot-aging';
  if (status === 'stale') return 'freshness-dot freshness-dot-stale';
  return 'freshness-dot hidden';
}

function freshnessLabelFromStatus(status) {
  if (status === 'fresh') return 'Fresh';
  if (status === 'aging') return 'Aging';
  if (status === 'stale') return 'Stale';
  return '—';
}

function flowsStatusToDotStatus(flowsStatus) {
  if (flowsStatus === 'ok') return 'fresh';
  if (flowsStatus === 'partial' || flowsStatus === 'fallback_1d') return 'aging';
  if (flowsStatus === 'unavailable') return 'stale';
  return 'unknown';
}

function resolveFlowsStatusFromState(state) {
  const sidecar = state.hydration?.flows_sidecar;
  if (sidecar?.flows_status) return sidecar.flows_status;
  const cockpits = state.hydration?.node_cockpits || {};
  const statuses = Object.values(cockpits)
    .map(c => c?.funds_flows?.flows_meta?.flows_status)
    .filter(Boolean);
  if (!statuses.length) return 'unavailable';
  if (statuses.some(s => s === 'unavailable')) return 'unavailable';
  if (statuses.some(s => s === 'partial' || s === 'fallback_1d')) {
    return statuses.find(s => s === 'partial' || s === 'fallback_1d') || 'partial';
  }
  return statuses.every(s => s === 'ok') ? 'ok' : (statuses.find(s => s !== 'ok') || 'unavailable');
}

function scanRvBasisFreshness(nodeCockpits) {
  let latestEnd = null;
  let hasData = false;
  const cockpits = nodeCockpits || {};
  Object.values(cockpits).forEach(cockpit => {
    const seriesMap = cockpit?.rv_basis?.series || {};
    Object.values(seriesMap).forEach(series => {
      const horizons = series?.horizons || {};
      Object.values(horizons).forEach(hz => {
        if (hz?.n_observations > 0 || hz?.current_value != null) {
          hasData = true;
          const end = hz?.lookback_end;
          if (end && (!latestEnd || end > latestEnd)) latestEnd = end;
        }
      });
    });
  });
  return {
    hasData,
    asOf: latestEnd ? `${latestEnd}T12:00:00Z` : null,
  };
}

function resolveBarchartBundleAsOf(bundle) {
  if (!bundle || typeof bundle !== 'object') return null;
  if (bundle.barchart?.as_of) return bundle.barchart.as_of;
  const exec = bundle.execution || {};
  if (exec.as_of) return exec.as_of;
  if (exec.timestamp) return exec.timestamp;
  if (String(exec.source || '').toLowerCase() === 'barchart' && bundle.as_of) return bundle.as_of;
  return null;
}

function buildFreshnessSubCluster(state) {
  const prov = state.provenance || createEmptyProvenance();
  const hydration = state.hydration || createEmptyHydration();
  const globalStatus = prov.freshnessStatus || computeFreshnessFromIso(prov.dataAsOf).status;
  const flowsRaw = resolveFlowsStatusFromState(state);
  const flowsDot = flowsStatusToDotStatus(flowsRaw);
  const chinaAsOf = hydration.china_as_of || null;
  const chinaStatus = chinaAsOf ? computeFreshnessFromIso(chinaAsOf).status : 'stale';
  const rvScan = scanRvBasisFreshness(hydration.node_cockpits);
  const barchartBundleAsOf = hydration.barchart_as_of || state.meta?.lastBarchart || null;
  let barchartStatus = 'stale';
  let barchartTitle = 'no Barchart / rv_basis data';
  if (barchartBundleAsOf) {
    barchartStatus = computeFreshnessFromIso(barchartBundleAsOf).status;
    barchartTitle = `Barchart as-of ${barchartBundleAsOf}`;
  } else if (rvScan.asOf) {
    barchartStatus = computeFreshnessFromIso(rvScan.asOf).status;
    barchartTitle = `rv_basis lookback_end ${rvScan.asOf.slice(0, 10)}`;
  } else if (rvScan.hasData) {
    barchartStatus = 'aging';
    barchartTitle = 'rv_basis populated — as_of unknown';
  }
  return {
    global: {
      key: 'global',
      label: 'Global',
      status: globalStatus,
      title: prov.dataAsOf ? `Global as-of ${prov.dataAsOf}` : 'Global provenance missing as-of',
    },
    flows: {
      key: 'flows',
      label: 'Flows',
      status: flowsDot,
      title: `flows_status: ${flowsRaw}`,
    },
    china: {
      key: 'china',
      label: 'China',
      status: chinaStatus,
      title: chinaAsOf ? `China as-of ${chinaAsOf}` : 'China payload missing as_of',
    },
    barchart: {
      key: 'barchart',
      label: 'Barchart',
      status: barchartStatus,
      title: barchartTitle,
    },
  };
}

function renderFreshnessSubClusterHtml(sources) {
  const order = ['global', 'flows', 'china', 'barchart'];
  return order.map((key, i) => {
    const s = sources[key];
    const dotCls = freshnessDotCls(s.status);
    const sep = i < order.length - 1 ? '<span class="freshness-sub-sep">·</span>' : '';
    const title = escapeHtml(s.title || s.label || '');
    return `<span class="freshness-sub-item" title="${title}"><span class="${dotCls}"></span>${escapeHtml(s.label)}</span>${sep}`;
  }).join('');
}

function defaultPipelineGross(score) {
  if (Number.isNaN(score)) return { bookA: '', posture: '' };
  const posture = suggestPosture(score);
  if (score < 50) return { bookA: '15', posture: 'defensive' };
  if (score < 65) return { bookA: '30', posture: 'light' };
  if (score < 80) return { bookA: '45', posture: 'selective' };
  return { bookA: '60', posture: 'full' };
}

function buildCommandBarAuthority(state, bundle) {
  const g = bundle?.global || {};
  const c = bundle?.china || {};
  const score = parseInt(g.whinfell_score ?? state.intake.whinfellScore, 10);
  const health = computeHealthScore(state);
  const gate = evaluateGate(score, health.score);
  const zone = scoreZone(score);
  const sq3FromBundle = c.sq3_score ?? g.sq3_score;
  const sq3BandFromBundle = c.sq3_band ?? g.sq3_band;
  const sq3Result = deriveSq3FromState(state);
  const sq3Score = sq3FromBundle != null && sq3FromBundle !== '' ? parseInt(sq3FromBundle, 10) : (sq3Result?.sq3Score ?? NaN);
  const sq3Band = sq3BandFromBundle || sq3Result?.interpretationBand || '—';
  let displayLabel = g.gate_status || gate.banner || gate.label;
  if (!Number.isNaN(sq3Score) && sq3Score < 50 && gate.key !== 'blocked') {
    displayLabel = gate.tight ? 'Tight + China Caution' : 'Allowed · China Caution';
  }
  const total = deriveGrossTotal(state);
  const freshStatus = bundle?.freshness_status
    || bundle?.freshnessStatus
    || computeFreshnessFromIso(bundle?.as_of || state.provenance?.dataAsOf).status;
  const dataAsOf = bundle?.as_of || g.as_of || state.provenance?.dataAsOf || null;
  const posture = state.grossRisk.posture || suggestPosture(score);
  return {
    active: true,
    whinfellScore: score,
    scoreZone: zone,
    transmissionState: g.transmission_state || state.intake.transmissionState,
    regimeTag: g.regime_tag || state.intake.regimeTag,
    sq3Score: Number.isNaN(sq3Score) ? null : sq3Score,
    sq3Band,
    gateLabel: displayLabel,
    gateSub: `${zone.text} zone · Whinfell ${Number.isNaN(score) ? '—' : score}`,
    gateGlow: gate.glow,
    gateTitleCls: gate.bannerTitleCls,
    grossRiskPct: total > 0 ? total : null,
    grossPosture: POSTURE_LABELS[posture] || posture || '—',
    freshnessStatus: freshStatus,
    freshnessLabel: freshnessLabelFromStatus(freshStatus),
    dataAsOf,
    sourceChannel: bundle?.source === 'parquet_hydration' ? 'parquet' : (bundle?.source || state.provenance?.sourceChannel || 'pipeline'),
    snapshotId: bundle?.snapshot_id || g.observation_id || state.provenance?.snapshotId || '',
  };
}

function resolveCommandBarMetrics(state, gate, prov) {
  const auth = appState.commandBarAuthority || createEmptyCommandBarAuthority();
  const usePipeline = auth.active && prov.hydratedAt && !prov.manualOverride;
  if (usePipeline) {
    const zone = auth.scoreZone || gate.zone;
    return {
      source: 'pipeline',
      whinfellScore: auth.whinfellScore,
      scoreZone: zone,
      txState: auth.transmissionState,
      regime: auth.regimeTag,
      sq3Score: auth.sq3Score,
      sq3Band: auth.sq3Band,
      gateLabel: auth.gateLabel,
      gateSub: auth.gateSub,
      gateGlow: auth.gateGlow || gate.glow,
      gateTitleCls: auth.gateTitleCls || gate.bannerTitleCls,
      grossRiskPct: auth.grossRiskPct,
      grossPosture: auth.grossPosture,
      freshnessStatus: auth.freshnessStatus || prov.freshnessStatus,
      freshnessLabel: auth.freshnessLabel || freshnessLabelFromStatus(prov.freshnessStatus),
      dataAsOf: auth.dataAsOf || prov.dataAsOf,
      sourceChannel: auth.sourceChannel || prov.sourceChannel,
      snapshotId: auth.snapshotId || prov.snapshotId,
    };
  }
  const total = deriveGrossTotal(state);
  const posture = state.grossRisk.posture || suggestPosture(gate.score);
  const freshStatus = prov.freshnessStatus || computeFreshnessFromIso(prov.dataAsOf).status;
  return {
    source: prov.hydratedAt && prov.manualOverride ? 'override' : 'live',
    whinfellScore: gate.score,
    scoreZone: gate.zone,
    txState: state.intake.transmissionState,
    regime: state.intake.regimeTag,
    sq3Score: gate.sq3Result ? gate.sq3Score : null,
    sq3Band: gate.sq3Band,
    gateLabel: gate.displayLabel || gate.label,
    gateSub: `${gate.zone.text} zone · Whinfell ${Number.isNaN(gate.score) ? '—' : gate.score}`,
    gateGlow: gate.glow,
    gateTitleCls: gate.bannerTitleCls,
    grossRiskPct: total > 0 ? total : null,
    grossPosture: POSTURE_LABELS[posture] || posture || '—',
    freshnessStatus: freshStatus,
    freshnessLabel: prov.dataAsOf ? computeFreshnessFromIso(prov.dataAsOf).label : freshnessLabelFromStatus(freshStatus),
    dataAsOf: prov.dataAsOf,
    sourceChannel: prov.sourceChannel,
    snapshotId: prov.snapshotId,
  };
}

function createEmptyOperator() {
  return {
    confidence: 58,
    executionIntent: 'client_only',
    shockProbability: 35,
    shockHorizon: '5D',
    basisRegimeLabel: 'normal contango',
    evidenceNote: '',
  };
}

function readOperatorFromDOM() {
  const conf = parseInt(el('operatorConfidence')?.value, 10);
  return {
    confidence: Number.isNaN(conf) ? 58 : Math.max(0, Math.min(100, conf)),
    executionIntent: el('executionIntent')?.value || 'client_only',
    shockProbability: Math.max(0, Math.min(100, parseInt(el('shockProbability')?.value, 10) || 0)),
    shockHorizon: el('shockHorizon')?.value || '5D',
    basisRegimeLabel: el('basisRegimeLabel')?.value || 'normal contango',
    evidenceNote: el('evidenceNote')?.value || '',
  };
}

function applyOperatorToDOM(op) {
  const o = { ...createEmptyOperator(), ...(op || {}) };
  if (el('operatorConfidence')) el('operatorConfidence').value = String(o.confidence);
  if (el('operatorConfidenceValue')) el('operatorConfidenceValue').textContent = String(o.confidence);
  if (el('executionIntent')) el('executionIntent').value = EXECUTION_INTENTS.includes(o.executionIntent) ? o.executionIntent : 'client_only';
  if (el('shockProbability')) el('shockProbability').value = String(o.shockProbability);
  if (el('shockHorizon')) el('shockHorizon').value = o.shockHorizon;
  if (el('basisRegimeLabel')) el('basisRegimeLabel').value = o.basisRegimeLabel;
  if (el('evidenceNote')) el('evidenceNote').value = o.evidenceNote;
}

function suggestExecutionIntent(gate, confidence) {
  const conf = Number.isFinite(confidence) ? confidence : 50;
  if (gate.code === 'blocked') return 'observe';
  if (gate.code === 'reduced') return conf >= 70 ? 'reduced_probe' : 'client_only';
  if (gate.code === 'open') return conf >= 75 ? 'full_risk' : 'reduced_probe';
  return 'observe';
}

function buildOperatorInputsPayload(state) {
  const op = state.operator || readOperatorFromDOM();
  const keyObs = state.research?.keyObservation || el('keyObservation')?.value || '';
  return {
    operator_confidence: op.confidence,
    execution_intent: op.executionIntent,
    shock_probability: op.shockProbability,
    shock_horizon: op.shockHorizon,
    basis_regime_label: op.basisRegimeLabel,
    evidence_note: op.evidenceNote,
    key_observation: keyObs,
  };
}

function createEmptyNavigation() {
  return {
    view_mode: 'flip',
    active_node_id: 'liquidity',
    compare_node_ids: [],
    focus_mode: false,
    focus_node_id: null,
  };
}

function createEmptyChartState() {
  return {
    shared_horizon: '3m',
    zoom_range: null,
    y_scale_mode: 'auto',
  };
}

function createEmptyPanelState() {
  return { scroll_positions: {}, expanded_sections: {} };
}

function createEmptyHydration() {
  return {
    node_cockpits: null,
    cockpit_context: null,
    flows_sidecar: null,
    flows_health: null,
    china_as_of: null,
    barchart_as_of: null,
    ingest_provenance: null,
    ai_compute: null,
    corporate_credit: null,
    trade_tracker: null,
    btc_attribution: null,
    margin_rules: null,
    hydration_audit: null,
  };
}

function createEmptyState() {
  return {
    version: STATE_VERSION,
    intake: { whinfellScore: '', transmissionState: '', regimeTag: '' },
    china: { policyStrength: '', stateImpulse: '', growthImpulse: '', regimeTag: '' },
    provenance: createEmptyProvenance(),
    commandBarAuthority: createEmptyCommandBarAuthority(),
    suggestedTracer: null,
    hydration: createEmptyHydration(),
    navigation: createEmptyNavigation(),
    chart: createEmptyChartState(),
    panel: createEmptyPanelState(),
    node_cockpit_overrides: {},
    ui: {
      trackView: 'both',
      gateDetailOpen: false,
      expandedPrompt: null,
      workspaceView: 'cockpit',
      hydrationBannerDismissed: false,
      postImportWorkflow: null,
    },
    grossRisk: { bookA: '', bookB: '', capitalBaseMm: '', posture: '', postureManual: false, handoverNote: '' },
    research: { keyObservation: '', importedObservation: '', grossRiskRecommendation: '', btcBias: '', timestamp: '' },
    operator: createEmptyOperator(),
    tracer: { horizons: createEmptyHorizons(), activeShock: null, shockConfig: createEmptyShockConfig(), flow: 'empty' },
    chinaLadder: { horizons: createEmptyChinaHorizons() },
    snapshots: [],
    btcL3: { nearMonth: '', farMonth: '', basisSpread: '', refLow: '', refMid: '', refHigh: '', lastScan: {} },
    urls: { ...DEFAULTS.urls },
    meta: { savedAt: null, lastKoyfin: null, lastBarchart: null },
  };
}

function computeFreshnessFromIso(iso) {
  if (!iso) return { status: 'unknown', label: '—' };
  const ageH = (Date.now() - new Date(iso).getTime()) / 3600000;
  if (ageH < 0) return { status: 'fresh', label: 'Fresh' };
  if (ageH < FRESH_HOURS) return { status: 'fresh', label: 'Fresh' };
  if (ageH < STALE_HOURS) return { status: 'aging', label: 'Aging' };
  return { status: 'stale', label: 'Stale' };
}

function freshnessChipCls(status) {
  const base = 'status-chip ';
  if (status === 'fresh') return base + 'status-chip--fresh';
  if (status === 'aging') return base + 'status-chip--aging';
  if (status === 'stale') return base + 'status-chip--stale';
  return base + 'status-chip--info';
}

function resolveImpairmentDriver(state, gate) {
  const globalScore = Number(state?.intake?.whinfellScore);
  const china = computeChinaLadderRead(state);
  const globalImpaired = Number.isFinite(globalScore) && globalScore < 50;
  const chinaImpaired = gate?.sq3Result && gate.sq3Score < 50;
  if (globalImpaired && chinaImpaired) {
    const globalDelta = 50 - globalScore;
    const chinaDelta = 50 - gate.sq3Score;
    return globalDelta >= chinaDelta ? 'Global score' : 'China SQ3';
  }
  if (globalImpaired) return 'Global score';
  if (chinaImpaired) return 'China SQ3';
  return '';
}

/** Chunk 05 — plain-English gate face (scan strip + command bar dominant value). */
const GATE_STRIP_DISPLAY = Object.freeze({
  blocked: 'No new BTC',
  reduced: 'Reduced sizing',
  open: 'Full access',
  unknown: 'Not set',
  tight: 'Reduced sizing',
  allowed: 'Full access',
});

const GATE_STRIP_BANNER = Object.freeze({
  BLOCKED: 'No new BTC',
  'TIGHT RISK': 'Reduced sizing',
  OPEN: 'Full access',
  '—': 'Not set',
});

function gateStripTitle(gate) {
  if (!gate) return '—';
  if (gate.chinaCaution && gate.displayLabel) return gate.displayLabel;
  const code = gate.code || gate.key;
  if (code && GATE_STRIP_DISPLAY[code]) return GATE_STRIP_DISPLAY[code];
  const bannerKey = String(gate.banner || '').toUpperCase();
  if (GATE_STRIP_BANNER[bannerKey]) return GATE_STRIP_BANNER[bannerKey];
  return gate.displayLabel || gate.label || '—';
}

function gateExecChip(gate) {
  if (gate.code === 'blocked') return { cls: 'gate-blocked', label: gate.label || 'Blocked' };
  if (gate.code === 'reduced') return { cls: 'gate-reduced', label: gate.label || 'Reduced' };
  if (gate.code === 'open') return { cls: 'gate-open', label: gate.label || 'Allowed' };
  return { cls: '', label: '—' };
}

function gateExecRule(gate) {
  return gate.rule || 'Enter Whinfell Score to evaluate BTC module access.';
}

function stageGrokKey(stageId) {
  return STAGE_GROK_KEYS[stageId] || stageId;
}

function horizonsToGrokMarks(hz) {
  return HORIZONS.map(h => HORIZON_DISPLAY[hz?.[h] || ''] || '—');
}

function buildHorizonMatrixGrok(horizons) {
  const out = {};
  LADDER.forEach(row => {
    out[stageGrokKey(row.id)] = horizonsToGrokMarks(horizons[row.id]);
  });
  return out;
}

function buildSuggestionRowsGrok(suggested) {
  const out = {};
  if (!suggested) return out;
  Object.keys(suggested).forEach(stageId => {
    out[stageGrokKey(stageId)] = horizonsToGrokMarks(suggested[stageId]);
  });
  return out;
}

function buildGrokPayload(state) {
  const gate = deriveGate(state);
  const health = computeHealthScore(state);
  const op = state.operator || createEmptyOperator();
  const operatorInputs = buildOperatorInputsPayload(state);
  return {
    spec_version: GROK_SPEC_VERSION,
    instruction_wrapper: GROK_OPERATOR_PROMPT,
    master_state: {
      whinfell_score: gate.score,
      transmission_health: health.score,
      weakest_link: health.weakestStage,
      gate_state: gate.code,
      score_zone: gate.zone?.text || scoreZone(gate.score).text,
      active_shock: state.tracer?.activeShock || null,
      operator_confidence: op.confidence,
      execution_intent: op.executionIntent,
      china_ladder: chinaLadderMasterState(state),
    },
    operator_inputs: operatorInputs,
    horizon_matrix: buildHorizonMatrixGrok(state.tracer?.horizons || createEmptyHorizons()),
    suggestion_rows: buildSuggestionRowsGrok(appState.suggestedTracer),
    shock_scenario: {
      active: state.tracer?.activeShock || null,
      probability: op.shockProbability,
      horizon: op.shockHorizon,
    },
    basis_context: {
      spread: state.btcL3?.basisSpread || '',
      regime_label: op.basisRegimeLabel,
      near_month: state.btcL3?.nearMonth || '',
      far_month: state.btcL3?.farMonth || '',
    },
    execution: {
      layer2: { status: gate.code === 'open' ? 'open' : gate.code === 'reduced' ? 'reduced' : 'blocked', intent: op.executionIntent },
      layer3: { status: gate.code === 'open' ? 'open' : gate.code === 'reduced' ? 'reduced' : 'blocked', intent: op.executionIntent },
    },
    export_block: buildWtmExportV21FromState(state, gate, health),
    ui_audit: buildUiAuditPayload(state),
  };
}

function buildGrokPromptPackage(state) {
  const payload = buildGrokPayload(state || buildStateFromDOM());
  return `${GROK_OPERATOR_PROMPT}\n\n--- STATE OBJECT ---\n${JSON.stringify(payload, null, 2)}`;
}

function buildWtmExportV21FromState(state, gate, health) {
  const h = health || computeHealthScore(state);
  const g = gate || deriveGate(state);
  const op = state.operator || createEmptyOperator();
  const txLabel = h.score >= TX_HEALTH_OPEN_THRESHOLD ? 'Healthy' : 'Mixed';
  const l3Read = deriveL3CalendarRead(state);
  const obs = buildDeskKeyObservation(state, g, h, l3Read);
  const lines = [
    '--- WTM EXPORT ---',
    `Whinfell Score: ${state.intake.whinfellScore || '—'}`,
    `Transmission State: ${txLabel}`,
    `Regime Tag: ${state.intake.regimeTag || '—'}`,
    `Key Observation: ${obs}`,
    `Operator Confidence: ${op.confidence}`,
    `Execution Intent: ${op.executionIntent}`,
    `Basis Regime: ${op.basisRegimeLabel}`,
    `Shock Scenario: ${state.tracer?.activeShock || 'none'} · P=${op.shockProbability}% · ${op.shockHorizon}`,
  ];
  if (op.evidenceNote) lines.push(`Evidence Note: ${op.evidenceNote}`);
  lines.push(
    `Gate State: ${gateStripTitle(g)} (${g.label})`,
    `Transmission Health: ${h.score} (${h.label}) · Weakest: ${h.weakestStage}`,
    '--- WTM EXPORT ---',
  );
  return lines.join('\n');
}

function paintGate(state, gate) {
  const g = gate || deriveGate(state || buildStateFromDOM());
  const execChip = gateExecChip(g);
  const gateTextEl = el('gateText');
  const gateChipEl = el('gateChip');
  const cmdGateLabel = el('cmdGateLabel');
  const banner = gateStripTitle(g);
  if (gateTextEl) gateTextEl.textContent = banner;
  if (cmdGateLabel) cmdGateLabel.textContent = banner;
  if (gateChipEl) {
    gateChipEl.textContent = execChip.label;
    gateChipEl.className = `gate-chip ${execChip.cls}`.trim();
  }
  ['layer2', 'layer3'].forEach(id => {
    const chip = el(`${id}Chip`);
    const rule = el(`${id}Rule`);
    if (chip) {
      chip.textContent = execChip.label;
      chip.className = `gate-chip ${execChip.cls}`.trim();
    }
    if (rule) rule.textContent = gateExecRule(g);
  });
}

function formatSuggestionMarks(hz) {
  return HORIZONS.map(h => HORIZON_DISPLAY[hz?.[h] || ''] || '—').join(' ');
}

function parseTracerLinesFromBlock(block) {
  const horizons = {};
  const re = /^\s*Signal Tracer\s*—\s*(.+?):\s*(.+)$/gim;
  let m;
  while ((m = re.exec(block)) !== null) {
    const stageName = m[1].trim().toLowerCase();
    const row = LADDER.find(r => r.name.toLowerCase() === stageName);
    if (!row) continue;
    const hz = {};
    m[2].replace(/(1d|5d|20d|60d)\s*:\s*([↑→↓]|up|flat|down)/gi, (_, h, mark) => {
      const key = HORIZON_PARSE[h.toLowerCase()];
      const parsed = parseHorizonMark(mark);
      if (key && parsed) hz[key] = parsed;
    });
    if (Object.keys(hz).length) horizons[row.id] = hz;
  }
  return horizons;
}

function buildTracerExportLines(horizons) {
  const lines = [];
  LADDER.forEach(row => {
    const hz = horizons[row.id];
    if (!hz || !Object.values(hz).some(Boolean)) return;
    const parts = HORIZONS.map(h => `${HORIZON_LABELS[h]}: ${HORIZON_DISPLAY[hz[h] || ''] || '→'}`).join(' | ');
    lines.push(`Signal Tracer — ${row.name}: ${parts}`);
  });
  return lines;
}

function clampSq3(value, lo, hi) {
  return Math.max(lo, Math.min(hi, value));
}

function normalizePolicyStrength(policyStrength) {
  return clampSq3(parseFloat(policyStrength), 0, 100);
}

function normalizeStateControlImpulse(impulseScore) {
  const clamped = clampSq3(parseFloat(impulseScore), -100, 100);
  return (100 - clamped) / 2;
}

function normalizeGrowthImpulse(growthImpulseScore) {
  return clampSq3(parseFloat(growthImpulseScore), 0, 100);
}

function interpretSq3Band(score) {
  const bounded = Math.round(clampSq3(score, 0, 100));
  for (const [lo, hi, label] of SQ3_POLICY_BANDS) {
    if (bounded >= lo && bounded <= hi) return label;
  }
  return 'Unknown';
}

function sq3BandKey(band) {
  if (band === 'Impaired') return 'red';
  if (band === 'Mixed / Fragile') return 'amber';
  if (band === 'Constructive') return 'green';
  if (band === 'Strong') return 'green';
  return 'unknown';
}

function calculateSq3(policyStrength, stateImpulseScore, growthImpulseScore) {
  const policyN = normalizePolicyStrength(policyStrength);
  const stateN = normalizeStateControlImpulse(stateImpulseScore);
  const growthN = normalizeGrowthImpulse(growthImpulseScore);
  if ([policyStrength, stateImpulseScore, growthImpulseScore].some(v => v === '' || v === null || v === undefined || Number.isNaN(parseFloat(v)))) {
    return null;
  }
  const raw = SQ3_WEIGHT_POLICY * policyN + SQ3_WEIGHT_STATE * stateN + SQ3_WEIGHT_GROWTH * growthN;
  const sq3Score = Math.round(clampSq3(raw, 0, 100));
  return {
    sq3Score,
    interpretationBand: interpretSq3Band(sq3Score),
    components: {
      policy: SQ3_WEIGHT_POLICY * policyN,
      state: SQ3_WEIGHT_STATE * stateN,
      growth: SQ3_WEIGHT_GROWTH * growthN,
    },
  };
}

function deriveSq3FromState(state) {
  const c = state.china || {};
  return calculateSq3(c.policyStrength, c.stateImpulse, c.growthImpulse);
}

function evaluateGate(score, txHealth) {
  const tx = Number.isFinite(txHealth) ? txHealth : null;
  if (Number.isNaN(score)) {
    return {
      code: 'unknown', key: 'unknown', label: '—', chipLabel: '—', banner: '—',
      rule: 'Enter Whinfell Score to evaluate BTC module access.',
      bannerTitle: 'Enter Whinfell Score', bannerSub: 'WTM intake drives BTC module access',
      bannerBg: 'bg-wtm-surface', bannerTitleCls: 'text-wtm-muted', bannerSubCls: 'text-wtm-muted',
      glow: '', chipCls: 'border-wtm-border text-wtm-muted bg-wtm-bg', borderAccent: 'border-l-wtm-border',
      blocked: true, tight: false,
    };
  }
  if (score < 50) {
    return {
      code: 'blocked', key: 'blocked', label: 'Blocked', chipLabel: 'BLOCKED', banner: 'BLOCKED',
      rule: 'No new BTC risk. Observation and client maintenance only.',
      bannerTitle: 'NO NEW BTC RISK', bannerSub: 'Score < 50 · BTC modules disabled',
      bannerBg: 'bg-red-500/10', bannerTitleCls: 'text-wtm-red', bannerSubCls: 'text-red-300/70',
      glow: 'gate-glow-red', chipCls: 'border-wtm-red text-wtm-red bg-red-500/15', borderAccent: 'border-l-wtm-red',
      blocked: true, tight: false,
    };
  }
  if (score < 65 || (tx != null && tx < TX_HEALTH_OPEN_THRESHOLD)) {
    const txReduced = tx != null && tx < TX_HEALTH_OPEN_THRESHOLD && score >= 65;
    return {
      code: 'reduced', key: 'tight', label: 'Reduced', chipLabel: 'Tight Risk', banner: 'TIGHT RISK',
      rule: 'Reduced sizing only. Client structures preferred.',
      bannerTitle: 'Tight Risk Band',
      bannerSub: txReduced ? `Score ≥ 65 but Transmission ${tx} < ${TX_HEALTH_OPEN_THRESHOLD}` : 'Score 50–64 · Reduced BTC sizing only',
      bannerBg: 'bg-amber-500/10', bannerTitleCls: 'text-wtm-amber', bannerSubCls: 'text-amber-200/70',
      glow: 'gate-glow-amber', chipCls: 'border-wtm-amber text-wtm-amber bg-amber-500/15', borderAccent: 'border-l-wtm-amber',
      blocked: false, tight: true, txReduced,
    };
  }
  return {
    code: 'open', key: 'allowed', label: 'Allowed', chipLabel: 'Allowed', banner: 'OPEN',
    rule: 'Normal sizing allowed within desk policy.',
    bannerTitle: 'Allowed', bannerSub: `Score ≥ 65 · Transmission ≥ ${TX_HEALTH_OPEN_THRESHOLD}`,
    bannerBg: 'bg-emerald-500/10', bannerTitleCls: 'text-wtm-green', bannerSubCls: 'text-emerald-200/70',
    glow: 'gate-glow-green', chipCls: 'border-wtm-green text-wtm-green bg-emerald-500/15', borderAccent: 'border-l-wtm-green',
    blocked: false, tight: false,
  };
}

function deriveGate(state) {
  const score = parseInt(state.intake.whinfellScore, 10);
  const sq3Result = deriveSq3FromState(state);
  const sq3Score = sq3Result ? sq3Result.sq3Score : NaN;
  const health = computeHealthScore(state);
  const gate = evaluateGate(score, health.score);
  const zone = scoreZone(score);
  const explanations = [];
  const unlock = [];

  if (Number.isNaN(score)) {
    explanations.push('Global Whinfell Score not set — BTC gate unknown.');
    unlock.push('Enter Whinfell Score from Koyfin or import WTM EXPORT');
  } else if (score < 50) {
    explanations.push(`Global Whinfell ${score} < 50 — NO NEW BTC RISK. BTC modules disabled.`);
    unlock.push('Raise Whinfell Score to ≥ 50 for Tight Risk Band (reduced BTC sizing)');
    unlock.push('Raise Whinfell Score to ≥ 65 for full BTC access');
  } else if (score < 65) {
    explanations.push(`Global Whinfell ${score} (50–64) — Tight Risk Band. Reduced BTC sizing only.`);
    unlock.push('Raise Whinfell Score to ≥ 65 for full BTC access');
  } else if (gate.txReduced) {
    explanations.push(`Global Whinfell ${score} ≥ 65 but Transmission Health ${health.score} < ${TX_HEALTH_OPEN_THRESHOLD} — reduced sizing only.`);
    unlock.push(`Raise Transmission Health to ≥ ${TX_HEALTH_OPEN_THRESHOLD} (apply tracer marks / confirm weakest link)`);
    unlock.push('Or raise ladder nets on impaired stages via Signal Tracer');
  } else {
    explanations.push(`Global Whinfell ${score} ≥ 65 and Transmission ${health.score} ≥ ${TX_HEALTH_OPEN_THRESHOLD} — full BTC module access permitted.`);
  }

  if (!Number.isNaN(score) && score >= 50 && health.score < TX_HEALTH_OPEN_THRESHOLD && !gate.txReduced && score < 65) {
    explanations.push(`Transmission Health ${health.score} (${health.label}) · Weakest: ${health.weakestStage}.`);
  }

  if (!sq3Result) {
    explanations.push('China SQ3 not computed — enter Policy / State / Growth inputs or import CHINA POLICY EXPORT.');
    unlock.push('Enter China dimension scores (0–100 policy & growth; state impulse −100 to +100)');
  } else if (sq3Score < 50) {
    explanations.push(`China SQ3 ${sq3Score} (${sq3Result.interpretationBand}) — dual-track impairment. Verify China-linked exposure.`);
    if (!Number.isNaN(score) && score >= 50) gate.chinaCaution = true;
    unlock.push('Raise SQ3 to ≥ 50 to clear China impairment flag');
    unlock.push('Raise SQ3 to ≥ 65 for constructive China transmission read');
  } else if (sq3Score < 65) {
    explanations.push(`China SQ3 ${sq3Score} (${sq3Result.interpretationBand}) — monitor China policy transmission.`);
    unlock.push('Raise SQ3 to ≥ 65 for constructive dual-track alignment');
  } else {
    explanations.push(`China SQ3 ${sq3Score} (${sq3Result.interpretationBand}) — constructive China track.`);
  }

  if (!Number.isNaN(score) && sq3Result && score >= 65 && sq3Score >= 65) {
    explanations.push('Dual-track aligned — Global and China both constructive.');
  }

  let displayLabel = gate.label;
  if (gate.chinaCaution && gate.key !== 'blocked') {
    displayLabel = gate.tight ? 'Tight + China Caution' : 'Allowed · China Caution';
  }

  return {
    ...gate,
    zone,
    score,
    sq3Score,
    sq3Band: sq3Result?.interpretationBand || '—',
    sq3Result,
    explanations,
    unlock,
    displayLabel,
  };
}

function scoreZone(score) {
  if (Number.isNaN(score)) return { text: '—', key: 'unknown' };
  if (score >= 65) return { text: 'Green', key: 'green' };
  if (score >= 50) return { text: 'Amber', key: 'amber' };
  return { text: 'Red', key: 'red' };
}

function suggestPosture(score) {
  if (Number.isNaN(score)) return '';
  if (score >= 80) return 'full';
  if (score >= 65) return 'selective';
  if (score >= 50) return 'light';
  return 'defensive';
}

function deriveGrossTotal(state) {
  return (parseFloat(state.grossRisk.bookA) || 0) + (parseFloat(state.grossRisk.bookB) || 0);
}

function postureGateMismatch(gate, posture, score) {
  const rank = POSTURE_RANK[posture] ?? -1;
  if (gate.key === 'blocked' && rank >= POSTURE_RANK.light) return true;
  if (gate.key === 'tight' && rank >= POSTURE_RANK.selective) return true;
  if (gate.key === 'allowed' && posture === 'defensive' && !Number.isNaN(score) && score >= 65) return true;
  return false;
}

function sumHorizons(stageHorizons) {
  return HORIZONS.reduce((sum, h) => sum + (HORIZON_SCORE[stageHorizons[h] || ''] || 0), 0);
}

function computeTracerSummary(horizons) {
  const stageNets = LADDER.map(row => sumHorizons(horizons[row.id] || {}));
  const chainHealth = stageNets.map((n, i) => i === 0 ? null : n - stageNets[i - 1]);
  const overall = stageNets.reduce((a, b) => a + b, 0);
  const weakestIdx = stageNets.length ? stageNets.indexOf(Math.min(...stageNets)) : -1;
  return { stageNets, chainHealth, overall, weakestIdx };
}

const HEALTH_LABELS = [
  { min: 80, label: 'Strong' },
  { min: 65, label: 'Constructive' },
  { min: 50, label: 'Mixed' },
  { min: 35, label: 'Fragile' },
  { min: 0, label: 'Impaired' },
];

function healthLabel(score) {
  return (HEALTH_LABELS.find(h => score >= h.min) || HEALTH_LABELS[HEALTH_LABELS.length - 1]).label;
}

function computeHealthScore(state) {
  const horizons = state.tracer?.horizons || createEmptyHorizons();
  const summary = computeTracerSummary(horizons);
  const whinfell = parseInt(state.intake?.whinfellScore, 10);
  const maxNet = 4;
  const minNet = -4;
  const ladderAvg = LADDER.reduce((sum, row, i) => {
    const net = summary.stageNets[i];
    return sum + ((net - minNet) / (maxNet - minNet)) * 100;
  }, 0) / LADDER.length;
  let coherenceSum = 0;
  let coherenceCount = 0;
  summary.chainHealth.forEach(delta => {
    if (delta === null) return;
    coherenceSum += Math.max(0, 100 - Math.abs(delta) * 25);
    coherenceCount++;
  });
  const coherence = coherenceCount ? coherenceSum / coherenceCount : 50;
  const whinfellComponent = Number.isNaN(whinfell) ? 50 : whinfell;
  const score = Math.round(Math.max(0, Math.min(100,
    ladderAvg * 0.40 + whinfellComponent * 0.35 + coherence * 0.25
  )));
  const weakestStage = summary.weakestIdx >= 0 ? LADDER[summary.weakestIdx].name : '—';
  return { score, label: healthLabel(score), weakestStage, weakestIdx: summary.weakestIdx, summary };
}

function chainArrow(delta) {
  if (delta === null) return null;
  const abs = Math.abs(delta);
  const sizeCls = abs >= 3 ? 'chain-arrow-thick' : abs >= 2 ? 'chain-arrow-mid' : 'chain-arrow-thin';
  if (delta >= 2) return { sym: '⇄', cls: `text-wtm-green ${sizeCls}` };
  if (delta <= -2) return { sym: '⚠', cls: `text-wtm-red ${sizeCls}` };
  if (delta === 1) return { sym: '↗', cls: `text-wtm-green ${sizeCls}` };
  if (delta === -1) return { sym: '↘', cls: `text-wtm-amber ${sizeCls}` };
  return { sym: '→', cls: `text-wtm-muted ${sizeCls}` };
}

function parseScore(val) {
  const n = parseInt(String(val).replace(/[^\d]/g, ''), 10);
  return n >= 0 && n <= 100 ? String(n) : null;
}

function parseTransmissionState(val) {
  const key = String(val).toLowerCase().replace(/[^a-z-]/g, '');
  return TX_PARSE[key] || (TX_META[key] ? key : null);
}

function parsePosture(val) {
  const key = String(val).toLowerCase().trim();
  return POSTURE_PARSE[key] || null;
}

function parseHorizonMark(val) {
  return MARK_PARSE[String(val).toLowerCase().trim()] || null;
}

function parseGrossRiskRecommendation(val) {
  const s = String(val);
  const pct = s.match(/(\d+(?:\.\d+)?)\s*%/);
  const total = pct ? parseFloat(pct[1]) : null;
  let posture = null;
  const lower = s.toLowerCase();
  if (/\blight\b/.test(lower)) posture = 'light';
  else if (/\bselective\b/.test(lower)) posture = 'selective';
  else if (/\bfull\b/.test(lower)) posture = 'full';
  else if (/\bdefensive\b/.test(lower)) posture = 'defensive';
  else if (/\bflat\b/.test(lower)) posture = 'flat';
  return { total, posture };
}

function extractWtmExportBlock(text) {
  const match = text.match(/---\s*WTM EXPORT v2\.[01]\s*---/i);
  if (!match) return { block: null, format: null };
  const header = match[0];
  const format = /v2\.1/i.test(header) ? RESEARCH_EXPORT_FORMAT : RESEARCH_EXPORT_FORMAT_LEGACY;
  const start = text.search(/---\s*WTM EXPORT v2\.[01]\s*---/i);
  const rest = text.slice(start).replace(/^---\s*WTM EXPORT v2\.[01]\s*---\s*/i, '');
  const end = rest.search(/\n---\s*WTM EXPORT/i);
  return { block: (end >= 0 ? rest.slice(0, end) : rest).trim(), format };
}

function extractChinaExportBlock(text) {
  const start = text.search(/---\s*CHINA POLICY EXPORT v1\.0\s*---/i);
  if (start < 0) return null;
  const rest = text.slice(start).replace(/^---\s*CHINA POLICY EXPORT v1\.0\s*---\s*/i, '');
  const end = rest.search(/\n---\s*CHINA POLICY EXPORT/i);
  return (end >= 0 ? rest.slice(0, end) : rest).trim();
}

function parseWtmExportBlock(block, format) {
  const fields = {};
  const imported = [];
  const lines = [
    ['whinfellScore', /^\s*Whinfell Score:\s*(.+)$/im, v => parseScore(v)],
    ['transmissionState', /^\s*Transmission State:\s*(.+)$/im, v => parseTransmissionState(v)],
    ['regimeTag', /^\s*Regime Tag:\s*(.+)$/im, v => v.trim()],
    ['keyObservation', /^\s*Key Observation:\s*(.+)$/im, v => v.trim()],
    ['grossRiskRecommendation', /^\s*Gross Risk Recommendation:\s*(.+)$/im, v => v.trim()],
    ['btcBias', /^\s*BTC Bias:\s*(.+)$/im, v => v.trim()],
    ['researchTimestamp', /^\s*Timestamp:\s*(.+)$/im, v => v.trim()],
    ['sq3Score', /^\s*SQ3 Score:\s*(\d{1,3})$/im, v => parseScore(v)],
    ['sq3Band', /^\s*SQ3 Band:\s*(.+)$/im, v => v.trim()],
    ['chinaPolicyStrength', /^\s*Policy Strength:\s*(\d{1,3})$/im, v => parseScore(v)],
    ['chinaStateImpulse', /^\s*State Impulse Score:\s*(-?\d{1,3})$/im, v => {
      const n = parseInt(String(v).replace(/[^\d-]/g, ''), 10);
      return n >= -100 && n <= 100 ? String(n) : null;
    }],
    ['chinaGrowthImpulse', /^\s*Growth Impulse Score:\s*(\d{1,3})$/im, v => parseScore(v)],
    ['chinaRegimeTag', /^\s*China Regime Tag:\s*(.+)$/im, v => v.trim()],
    ['snapshotId', /^\s*Snapshot ID:\s*(.+)$/im, v => v.trim()],
    ['lineageHash', /^\s*Lineage Hash:\s*(.+)$/im, v => v.trim()],
    ['validationStatus', /^\s*Validation Status:\s*(.+)$/im, v => v.trim()],
    ['dataAsOf', /^\s*Data As Of:\s*(.+)$/im, v => v.trim()],
    ['sourceChannel', /^\s*Source Channel:\s*(.+)$/im, v => v.trim()],
    ['freshnessStatus', /^\s*Freshness Status:\s*(.+)$/im, v => v.trim()],
  ];
  for (const [key, re, transform] of lines) {
    const m = block.match(re);
    if (!m) continue;
    const val = transform(m[1]);
    if (val === null || val === undefined || val === '') continue;
    fields[key] = val;
    imported.push(key);
  }
  if (fields.grossRiskRecommendation) {
    const gr = parseGrossRiskRecommendation(fields.grossRiskRecommendation);
    if (gr.total !== null) {
      fields.grossA = String(gr.total);
      fields.totalGross = String(gr.total);
      imported.push('grossA', 'totalGross');
    }
    if (gr.posture) {
      fields.posture = gr.posture;
      imported.push('posture');
    }
  }
  if (fields.btcBias) {
    const mark = BTC_BIAS_MAP[String(fields.btcBias).toLowerCase().trim()];
    if (mark) {
      fields.tracerHorizons = fields.tracerHorizons || {};
      fields.tracerHorizons.highbeta = { ...(fields.tracerHorizons.highbeta || {}), d1: mark };
      imported.push('tracer:highbeta', 'btcBias');
    }
  }
  const tracerFromBlock = parseTracerLinesFromBlock(block);
  if (Object.keys(tracerFromBlock).length) {
    fields.tracerHorizons = { ...(fields.tracerHorizons || {}), ...tracerFromBlock };
    fields.tracerSuggested = tracerFromBlock;
    Object.keys(tracerFromBlock).forEach(id => imported.push(`tracer:${id}`));
  }
  if (fields.snapshotId || fields.dataAsOf) {
    fields.provenance = {
      snapshotId: fields.snapshotId || '',
      lineageHash: fields.lineageHash || '',
      validationStatus: fields.validationStatus || 'parsed',
      dataAsOf: fields.dataAsOf || fields.researchTimestamp || '',
      sourceChannel: fields.sourceChannel || '',
      freshnessStatus: fields.freshnessStatus || '',
    };
    imported.push('provenance');
  }
  fields._format = format || RESEARCH_EXPORT_FORMAT;
  return { fields, imported: [...new Set(imported)] };
}

function parseChinaExportBlock(block) {
  const fields = {};
  const imported = [];
  const lines = [
    ['chinaPolicyStrength', /^\s*Policy Strength:\s*(\d{1,3})$/im, v => parseScore(v)],
    ['chinaStateImpulse', /^\s*State Control Impulse Score:\s*(-?\d{1,3})$/im, v => {
      const n = parseInt(String(v).replace(/[^\d-]/g, ''), 10);
      return n >= -100 && n <= 100 ? String(n) : null;
    }],
    ['chinaGrowthImpulse', /^\s*Growth Impulse Score:\s*(\d{1,3})$/im, v => parseScore(v)],
    ['chinaRegimeTag', /^\s*Dominant Policy Theme:\s*(.+)$/im, v => v.trim()],
    ['researchTimestamp', /^\s*Timestamp:\s*(.+)$/im, v => v.trim()],
  ];
  for (const [key, re, transform] of lines) {
    const m = block.match(re);
    if (!m) continue;
    const val = transform(m[1]);
    if (val === null || val === undefined || val === '') continue;
    fields[key] = val;
    imported.push(key);
  }
  fields._format = CHINA_EXPORT_FORMAT;
  return { fields, imported: [...new Set(imported)] };
}

function parsePerplexityText(text) {
  if (!text || typeof text !== 'string') return { fields: {}, imported: [], format: null };
  const normalized = text.replace(/\r\n/g, '\n');
  const merged = { fields: {}, imported: [], format: null };

  const { block: wtmBlock, format: wtmFormat } = extractWtmExportBlock(normalized);
  if (wtmBlock) {
    const wtm = parseWtmExportBlock(wtmBlock, wtmFormat);
    if (wtm.imported.length) {
      Object.assign(merged.fields, wtm.fields);
      merged.imported.push(...wtm.imported);
      merged.format = wtmFormat;
    }
  }

  const chinaBlock = extractChinaExportBlock(normalized);
  if (chinaBlock) {
    const china = parseChinaExportBlock(chinaBlock);
    if (china.imported.length) {
      Object.assign(merged.fields, china.fields);
      merged.imported.push(...china.imported);
      merged.format = merged.format || CHINA_EXPORT_FORMAT;
    }
  }
  if (merged.imported.length) return { ...merged, imported: [...new Set(merged.imported)] };

  const fields = {};
  const imported = [];

  const labeled = [
    [/whinfell\s*score\s*[:=]\s*(\d{1,3})/i, 'whinfellScore', v => parseScore(v)],
    [/transmission\s*state\s*[:=]\s*([^\n]+)/i, 'transmissionState', v => parseTransmissionState(v)],
    [/regime\s*tag\s*[:=]\s*([^\n]+)/i, 'regimeTag', v => v.trim()],
    [/gate\s*status\s*[:=]\s*([^\n]+)/i, 'gateStatus', v => v.trim()],
    [/score\s*zone\s*[:=]\s*([^\n]+)/i, 'scoreZone', v => v.trim()],
    [/gross\s*risk\s*book\s*a\s*(?:\(%\))?\s*[:=]\s*([\d.]+)/i, 'grossA', v => v.trim()],
    [/gross\s*risk\s*book\s*b\s*(?:\(%\))?\s*[:=]\s*([\d.]+)/i, 'grossB', v => v.trim()],
    [/total\s*gross\s*risk\s*(?:\(%\))?\s*[:=]\s*([\d.]+)/i, 'totalGross', v => v.trim()],
    [/approved\s*posture\s*[:=]\s*([^\n]+)/i, 'posture', v => parsePosture(v) || v.trim()],
    [/handover(?:\s*\/\s*watch)?\s*(?:note|items)?\s*[:=]\s*([^\n]+)/i, 'handoverNote', v => v.trim()],
    [/capital\s*base\s*(?:\(\$mm\))?\s*[:=]\s*([\d.]+)/i, 'capitalBaseMm', v => v.trim()],
    [/active\s*shock\s*[:=]\s*([^\n]+)/i, 'activeShock', v => v.trim()],
    [/near\s*month\s*[:=]\s*([^\n]+)/i, 'l3NearMonth', v => v.trim()],
    [/far\s*month\s*[:=]\s*([^\n]+)/i, 'l3FarMonth', v => v.trim()],
    [/basis\s*spread\s*[:=]\s*([^\n]+)/i, 'l3BasisSpread', v => v.trim()],
    [/key\s*observation\s*[:=]\s*([^\n]+)/i, 'keyObservation', v => v.trim()],
    [/gross\s*risk\s*recommendation\s*[:=]\s*([^\n]+)/i, 'grossRiskRecommendation', v => v.trim()],
    [/btc\s*bias\s*[:=]\s*([^\n]+)/i, 'btcBias', v => v.trim()],
    [/timestamp\s*[:=]\s*([^\n]+)/i, 'researchTimestamp', v => v.trim()],
  ];

  for (const [re, key, transform] of labeled) {
    const m = normalized.match(re);
    if (!m) continue;
    const val = transform(m[1]);
    if (val === null || val === undefined || val === '') continue;
    fields[key] = val;
    imported.push(key);
  }

  if (!fields.whinfellScore) {
    const scoreFallback = normalized.match(/(?:^|\n)\s*score\s*[:=]\s*(\d{1,3})/i);
    if (scoreFallback) {
      const val = parseScore(scoreFallback[1]);
      if (val) { fields.whinfellScore = val; imported.push('whinfellScore'); }
    }
  }

  fields.tracerHorizons = {};
  LADDER.forEach(row => {
    const escaped = row.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const lineRe = new RegExp(`${escaped}\\s*[:|]\\s*([^\\n]+)`, 'i');
    const line = normalized.match(lineRe);
    if (!line) return;
    const segment = line[1];
    const horizon = {};
    segment.replace(/(1d|5d|20d|60d|d1|d5|d20|d60)\s*[:=]\s*([↑→↓]|up|flat|down|confirming|mixed|impairing|neutral)/gi, (_, h, mark) => {
      const hz = HORIZON_PARSE[h.toLowerCase()];
      const parsed = parseHorizonMark(mark);
      if (hz && parsed) horizon[hz] = parsed;
    });
    if (Object.keys(horizon).length) {
      fields.tracerHorizons[row.id] = horizon;
      imported.push(`tracer:${row.id}`);
    }
  });

  if (fields.grossRiskRecommendation && !fields.grossA) {
    const gr = parseGrossRiskRecommendation(fields.grossRiskRecommendation);
    if (gr.total !== null) { fields.grossA = String(gr.total); imported.push('grossA'); }
    if (gr.posture && !fields.posture) { fields.posture = gr.posture; imported.push('posture'); }
  }
  if (fields.btcBias && !fields.tracerHorizons) {
    const mark = BTC_BIAS_MAP[String(fields.btcBias).toLowerCase().trim()];
    if (mark) { fields.tracerHorizons = { highbeta: { d1: mark } }; imported.push('tracer:highbeta'); }
  }

  return { fields, imported: [...new Set(imported)], format: EXPORT_FORMAT };
}

function simpleLineageHash(obj) {
  const str = JSON.stringify(obj, Object.keys(obj).sort());
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return 'sha256:browser_' + Math.abs(h).toString(16).padStart(8, '0');
}

function buildPipelineBundle() {
  const state = buildStateFromDOM();
  const gate = deriveGate(state);
  const total = deriveGrossTotal(state);
  const posture = state.grossRisk.posture || suggestPosture(gate.score);
  const wtmBlock = buildWtmExportV21();
  const globalPayload = {
    observation_id: 'global_' + Date.now().toString(36),
    whinfell_score: parseInt(state.intake.whinfellScore, 10) || null,
    transmission_state: state.intake.transmissionState || '',
    regime_tag: state.intake.regimeTag || '',
    gate_status: gate.displayLabel || gate.banner || gate.label,
    gate_state: gate.code,
    transmission_health: computeHealthScore(state).score,
    key_observation: state.research?.keyObservation || state.grossRisk.handoverNote || '',
    sq3_score: gate.sq3Result ? gate.sq3Score : null,
    sq3_band: gate.sq3Result ? gate.sq3Band : '',
    gross_total_pct: total,
    approved_posture: posture,
  };
  const chinaPayload = gate.sq3Result ? {
    policy_strength: parseInt(state.china.policyStrength, 10),
    state_impulse_score: parseInt(state.china.stateImpulse, 10),
    growth_impulse_score: parseInt(state.china.growthImpulse, 10),
    sq3_score: gate.sq3Score,
    sq3_band: gate.sq3Band,
    regime_tag: state.china.regimeTag || '',
  } : {};
  const executionPayload = {
    near_month: state.btcL3.nearMonth || '',
    far_month: state.btcL3.farMonth || '',
    basis_spread: state.btcL3.basisSpread || '',
    basis_regime_label: state.operator?.basisRegimeLabel || '',
    ref_low: state.btcL3.refLow || '',
    ref_mid: state.btcL3.refMid || '',
    ref_high: state.btcL3.refHigh || '',
    operator_confidence: state.operator?.confidence ?? null,
    execution_intent: state.operator?.executionIntent || '',
    shock_probability: state.operator?.shockProbability ?? null,
    shock_horizon: state.operator?.shockHorizon || '',
    evidence_note: state.operator?.evidenceNote || '',
    koyfin_url: state.urls.koyfin || '',
    barchart_url: state.urls.barchart || '',
    last_l3_scan: state.btcL3.lastScan || {},
  };
  const core = { global: globalPayload, china: chinaPayload, execution: executionPayload };
  const warnings = [];
  if (Number.isNaN(gate.score)) warnings.push('Global Whinfell Score missing');
  if (!gate.sq3Result) warnings.push('China SQ3 not computed');
  const snapshotId = 'snap_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  return {
    bundle_version: PIPELINE_BUNDLE_VERSION,
    hydration_version: HYDRATION_BUNDLE_VERSION,
    snapshot_id: snapshotId,
    lineage_hash: simpleLineageHash(core),
    validation_status: warnings.length ? 'partial' : 'parsed',
    as_of: new Date().toISOString(),
    source: 'transmission_control',
    freshness_status: 'fresh',
    schema_version: STATE_VERSION,
    global: globalPayload,
    china: chinaPayload,
    execution: executionPayload,
    suggested_tracer: {},
    tracer_apply_mode: 'confirm_required',
    wtm_export_v21: wtmBlock,
    operator_inputs: buildOperatorInputsPayload(state),
    grok_payload: buildGrokPayload(state),
    warnings,
  };
}

function downloadJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPipelineBundle() {
  const bundle = buildPipelineBundle();
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  downloadJson(`whinfell_pipeline_bundle_${ts}.json`, bundle);
  showToast(`Pipeline bundle exported · ${bundle.validation_status}`);
}

function buildWtmExportV21() {
  const state = buildStateFromDOM();
  const gate = deriveGate(state);
  const sq3 = gate.sq3Result;
  const total = deriveGrossTotal(state);
  const posture = state.grossRisk.posture || suggestPosture(gate.score);
  const txLabel = state.intake.transmissionState && TX_META[state.intake.transmissionState]
    ? TX_META[state.intake.transmissionState].label : (state.intake.transmissionState || '—');
  const btcHz = state.tracer.horizons.highbeta?.d1 || '';
  const btcBias = btcHz === 'up' ? 'Confirming' : btcHz === 'down' ? 'Dragging' : 'Neutral';
  const obs = state.research.keyObservation || el('keyObservation')?.value || state.grossRisk.handoverNote || '—';
  const op = state.operator || createEmptyOperator();
  const prov = state.provenance || createEmptyProvenance();
  const dataAsOf = prov.dataAsOf || new Date().toISOString();
  const fresh = prov.freshnessStatus || computeFreshnessFromIso(dataAsOf).status;
  const lines = [
    '--- WTM EXPORT v2.1 ---',
    `Whinfell Score: ${state.intake.whinfellScore || '—'}`,
    `Transmission State: ${txLabel}`,
    `Regime Tag: ${state.intake.regimeTag || '—'}`,
    `Key Observation: ${obs}`,
    `Operator Confidence: ${op.confidence}`,
    `Execution Intent: ${op.executionIntent}`,
    `Basis Regime: ${op.basisRegimeLabel}`,
    `Shock Scenario: ${state.tracer.activeShock || 'none'} · P=${op.shockProbability}% · ${op.shockHorizon}`,
    `Gross Risk Recommendation: ${total.toFixed(0)}% total, ${POSTURE_LABELS[posture] || posture || '—'} posture`,
    `BTC Bias: ${state.research.btcBias || btcBias}`,
    `Timestamp: ${typeof window.WTM_formatLocalStamp === 'function' ? window.WTM_formatLocalStamp(new Date()) : new Date().toISOString().slice(0, 19)}`,
  ];
  if (sq3) {
    lines.push(`SQ3 Score: ${sq3.sq3Score}`);
    lines.push(`SQ3 Band: ${sq3.interpretationBand}`);
    lines.push(`Policy Strength: ${state.china.policyStrength || '—'}`);
    lines.push(`State Impulse Score: ${state.china.stateImpulse || '—'}`);
    lines.push(`Growth Impulse Score: ${state.china.growthImpulse || '—'}`);
    if (state.china.regimeTag) lines.push(`China Regime Tag: ${state.china.regimeTag}`);
  }
  lines.push(...buildTracerExportLines(state.tracer.horizons));
  if (prov.snapshotId) lines.push(`Snapshot ID: ${prov.snapshotId}`);
  if (prov.lineageHash) lines.push(`Lineage Hash: ${prov.lineageHash}`);
  lines.push(`Validation Status: ${prov.validationStatus || 'parsed'}`);
  lines.push(`Data As Of: ${dataAsOf}`);
  lines.push(`Source Channel: ${prov.sourceChannel || 'transmission_control'}`);
  lines.push(`Freshness Status: ${fresh}`);
  const chinaLadderBlock = buildChinaLadderExportBlock(state);
  if (chinaLadderBlock) lines.push(chinaLadderBlock);
  return lines.join('\n');
}

function buildPerplexityExport() {
  const state = buildStateFromDOM();
  const gate = deriveGate(state);
  const health = computeHealthScore(state);
  const total = deriveGrossTotal(state);
  const posture = state.grossRisk.posture || suggestPosture(gate.score);
  const shockCfg = state.tracer.shockConfig || createEmptyShockConfig();
  const lines = [
    'WHINFELL TRANSMISSION CONTROL — STATE EXPORT',
    `Format: ${EXPORT_FORMAT}`,
    `Schema Version: ${STATE_VERSION}`,
    `Generated: ${new Date().toISOString()}`,
    '---',
    `Whinfell Score: ${state.intake.whinfellScore || '—'}`,
    `Transmission State: ${state.intake.transmissionState || '—'}`,
    `Regime Tag: ${state.intake.regimeTag || '—'}`,
    `Gate Status: ${gate.displayLabel || gate.label}`,
    `Score Zone: ${gate.zone.text}`,
    `SQ3 Score: ${gate.sq3Result ? gate.sq3Score : '—'}`,
    `SQ3 Band: ${gate.sq3Result ? gate.sq3Band : '—'}`,
    `Transmission Health: ${health.score} (${health.label}) · Weakest: ${health.weakestStage}`,
    `Operator Confidence: ${state.operator?.confidence ?? '—'}`,
    `Execution Intent: ${state.operator?.executionIntent || '—'}`,
    `Basis Regime: ${state.operator?.basisRegimeLabel || '—'}`,
    `Shock Probability: ${state.operator?.shockProbability ?? '—'}% · Horizon: ${state.operator?.shockHorizon || '—'}`,
    `Key Observation: ${state.research?.keyObservation || el('keyObservation')?.value || '—'}`,
    `Evidence Note: ${state.operator?.evidenceNote || '—'}`,
    '---',
    `Gross Risk Book A (%): ${state.grossRisk.bookA || '0'}`,
    `Gross Risk Book B (%): ${state.grossRisk.bookB || '0'}`,
    `Total Gross Risk (%): ${total.toFixed(1)}`,
    `Approved Posture: ${POSTURE_LABELS[posture] || posture || '—'}`,
    `Capital Base ($mm): ${state.grossRisk.capitalBaseMm || '—'}`,
    `Handover Note: ${state.grossRisk.handoverNote || '—'}`,
    '---',
    'Signal Tracer Horizons:',
  ];

  LADDER.forEach(row => {
    const hz = state.tracer.horizons[row.id] || {};
    const parts = HORIZONS.map(h => `${HORIZON_LABELS[h]}: ${HORIZON_DISPLAY[hz[h] || ''] || '—'}`).join(' | ');
    lines.push(`${row.name}: ${parts}`);
  });

  const shock = state.tracer.activeShock && SHOCKS[state.tracer.activeShock];
  lines.push('---');
  lines.push(`Active Shock: ${shock ? shock.label : 'None'}`);
  lines.push(`Shock Intensity: ${shockCfg.intensity || 'full'}`);
  lines.push(`Shock Disabled Stages: ${(shockCfg.disabledStages || []).length ? shockCfg.disabledStages.join(', ') : 'None'}`);
  if ((state.snapshots || []).length) {
    lines.push('---');
    lines.push('Tracer Snapshots:');
    state.snapshots.forEach(s => {
      const savedLabel = s.savedAt
        ? (typeof window.WTM_formatLocalStamp === 'function' ? window.WTM_formatLocalStamp(s.savedAt) : s.savedAt.slice(0, 19))
        : '—';
      lines.push(`  - ${s.name} | ${savedLabel} | Health band: ${s.scoreBand || '—'} | Regime: ${s.regimeTag || '—'}`);
    });
  }
  if (state.btcL3.nearMonth || state.btcL3.farMonth || state.btcL3.basisSpread) {
    lines.push('---');
    lines.push(`Near Month: ${state.btcL3.nearMonth || '—'}`);
    lines.push(`Far Month: ${state.btcL3.farMonth || '—'}`);
    lines.push(`Basis Spread: ${state.btcL3.basisSpread || '—'}`);
    lines.push(`Ref Low: ${state.btcL3.refLow || '—'}`);
    lines.push(`Ref Mid: ${state.btcL3.refMid || '—'}`);
    lines.push(`Ref High: ${state.btcL3.refHigh || '—'}`);
    if (state.btcL3.lastScan?.result) {
      lines.push(`Last L3 Scan: ${state.btcL3.lastScan.result} — ${state.btcL3.lastScan.reason || ''}`);
    }
  }
  lines.push('---');
  lines.push('End of WTC Export — paste into Perplexity or re-import via Transmission Control');
  lines.push('');
  lines.push(buildWtmExportV21());
  return lines.join('\n');
}

function updateResearchReadout(state) {
  const r = state.research || {};
  const imported = r.importedObservation || '';
  const has = imported || r.btcBias || r.timestamp;
  const panel = el('researchReadout');
  panel.classList.toggle('hidden', !has);
  if (!has) return;
  const impNode = el('importedObservationDisplay');
  if (impNode) {
    if (imported) {
      impNode.textContent = `Pipeline note (provenance): ${imported}`;
      impNode.classList.remove('hidden');
    } else {
      impNode.textContent = '';
      impNode.classList.add('hidden');
    }
  }
  const parts = [];
  if (r.btcBias) parts.push(`BTC Bias: ${r.btcBias}`);
  if (r.timestamp) parts.push(`Imported: ${r.timestamp}`);
  el('btcBiasDisplay').textContent = parts.join(' · ');
}

function applyProvenanceFields(prov, { markHydrated } = {}) {
  if (!prov) return;
  appState.provenance = {
    ...createEmptyProvenance(),
    snapshotId: prov.snapshotId || '',
    lineageHash: prov.lineageHash || '',
    validationStatus: prov.validationStatus || 'parsed',
    dataAsOf: prov.dataAsOf || null,
    sourceChannel: prov.sourceChannel || '',
    freshnessStatus: prov.freshnessStatus || computeFreshnessFromIso(prov.dataAsOf).status,
    hydratedAt: markHydrated ? new Date().toISOString() : (appState.provenance?.hydratedAt || null),
    manualOverride: false,
  };
}

function renderProvenancePanel(state) {
  const prov = state.provenance || createEmptyProvenance();
  const panel = el('provenancePanel');
  const has = prov.snapshotId || prov.dataAsOf || prov.sourceChannel;
  panel.classList.toggle('hidden', !has);
  if (!has) return;
  const fresh = prov.freshnessStatus || computeFreshnessFromIso(prov.dataAsOf).label;
  const tracerFlow = getTracerFlowState(prov, appState.suggestedTracer, appState.tracer);
  const overrideNotes = [];
  if (prov.manualOverride) overrideNotes.push('<span class="text-wtm-amber">Manual override active</span>');
  if (tracerFlow === 'override' && !prov.manualOverride) {
    overrideNotes.push('<span class="text-wtm-amber">Tracer override — horizons edited manually</span>');
  }
  el('provenanceDisplay').innerHTML = [
    prov.snapshotId ? `Snapshot: <span class="text-slate-200">${prov.snapshotId}</span>` : '',
    prov.dataAsOf ? `As of: <span class="text-slate-200">${typeof window.WTM_formatLocalStamp === 'function' ? window.WTM_formatLocalStamp(prov.dataAsOf) : new Date(prov.dataAsOf).toLocaleString()}</span>` : '',
    prov.sourceChannel ? `Source: <span class="text-slate-200">${prov.sourceChannel}</span>` : '',
    prov.lineageHash ? `Lineage: <span class="text-slate-200 font-mono text-[8px]">${prov.lineageHash.slice(0, 24)}…</span>` : '',
    `Freshness: <span class="${freshnessChipCls(prov.freshnessStatus)}">${fresh}</span>`,
    ...overrideNotes,
  ].filter(Boolean).join('<br>');
}

function renderSuggestedTracerPanel() {
  const panel = el('suggestedTracerPanel');
  const tray = el('suggestionTray');
  const rows = el('suggestionRows');
  const sug = appState.suggestedTracer;
  const has = sug && Object.keys(sug).length;
  panel?.classList.toggle('hidden', !has);
  tray?.classList.toggle('hidden', !has);
  if (!has) {
    if (rows) rows.innerHTML = '';
    return;
  }
  const badge = el('suggestedTracerBadge');
  if (badge) badge.textContent = 'Pending';
  const parts = LADDER.filter(r => sug[r.id]).map(r => {
    const hz = sug[r.id];
    const marks = HORIZONS.map(h => HORIZON_DISPLAY[hz[h] || ''] || '—').join('');
    return `${r.short}: ${marks}`;
  });
  el('suggestedTracerSummary').textContent = parts.join(' · ') || '—';
  if (rows) {
    rows.innerHTML = LADDER.filter(r => sug[r.id]).map(r => {
      const hz = sug[r.id];
      const marks = formatSuggestionMarks(hz);
      return `<div class="suggestion-row" data-stage="${stageGrokKey(r.id)}">
        <span class="stage">${r.name}</span>
        <code>${marks}</code>
        <button type="button" class="btn btn-row-apply" data-stage="${stageGrokKey(r.id)}">Apply row</button>
      </div>`;
    }).join('');
    if (typeof rows.querySelectorAll === 'function') {
      rows.querySelectorAll('.btn-row-apply').forEach(btn => {
        btn.onclick = () => acceptSuggestedTracerRow(btn.dataset.stage);
      });
    }
  }
}

function resolveStageId(stageKey) {
  const byGrok = Object.entries(STAGE_GROK_KEYS).find(([, v]) => v === stageKey);
  if (byGrok) return byGrok[0];
  return LADDER.find(r => r.id === stageKey || stageGrokKey(r.id) === stageKey)?.id || stageKey;
}

function acceptSuggestedTracerRow(stageKey) {
  const stageId = resolveStageId(stageKey);
  const sug = appState.suggestedTracer;
  if (!sug?.[stageId]) return;
  if (!appState.tracer.horizons) appState.tracer.horizons = createEmptyHorizons();
  appState.tracer.horizons = applySuggestedMarks(appState.tracer.horizons, { [stageId]: sug[stageId] });
  const hz = appState.tracer.horizons[stageId];
  HORIZONS.forEach(h => {
    const sel = el(`hz-${stageId}-${h}`);
    if (sel) sel.value = hz[h] || '';
  });
  delete sug[stageId];
  if (!Object.keys(sug).length) {
    appState.suggestedTracer = null;
    appState.tracer.flow = 'confirmed';
  } else {
    appState.tracer.flow = 'suggested';
  }
  renderSuggestedTracerPanel();
  renderTracerFlowChrome();
  renderTracerVisual();
  renderProvenancePanel(buildStateFromDOM());
  renderCommandBar(buildStateFromDOM(), deriveGate(buildStateFromDOM()));
  markDirty();
  const rows = el('suggestionRows');
  if (rows && typeof rows.querySelector === 'function') {
    const rowEl = rows.querySelector(`[data-stage="${stageGrokKey(stageId)}"]`);
    if (rowEl) rowEl.dataset.applied = 'true';
  }
  const row = LADDER.find(r => r.id === stageId);
  showToast(`Applied ${row?.name || stageId} — ${Object.keys(sug).length ? 'more suggestions pending' : 'all suggestions applied'}`);
}

function renderTracerFlowChrome() {
  const chrome = getTracerChrome(appState.tracer, appState.suggestedTracer);
  const badge = el('tracerFlowBadge');
  const table = el('tracerHorizonTable');
  const title = el('tracerMatrixTitle');
  if (!badge || !table) return;
  badge.textContent = chrome.label;
  badge.className = 'tracer-status-chip ' + chrome.badgeClass;
  table.classList.remove('tracer-flow-suggested', 'tracer-flow-confirmed', 'tracer-flow-override');
  if (chrome.tableClass) table.classList.add(chrome.tableClass);
  if (title) title.textContent = chrome.title;
}

function commitHorizonOverrideToAppState() {
  const next = applyHorizonOverride(appState);
  appState.tracer = next.tracer;
  appState.suggestedTracer = next.suggestedTracer;
  appState.provenance = next.provenance;
  renderSuggestedTracerPanel();
  renderTracerFlowChrome();
  const state = buildStateFromDOM();
  renderProvenancePanel(state);
  renderCommandBar(state, deriveGate(state));
}

function markCommandBarManualOverride() {
  if (appState.provenance?.manualOverride) return;
  appState.provenance = applyIntakeOverride(appState.provenance);
  const state = buildStateFromDOM();
  renderProvenancePanel(state);
  if (appState.provenance?.hydratedAt) renderCommandBar(state, deriveGate(state));
}

function markTracerManualOverride() {
  commitHorizonOverrideToAppState();
  markDirty();
  showToast('Manual Override — horizons and command bar marked override');
}

function onHorizonSelectChange() {
  if (appState.tracer.flow !== 'override') commitHorizonOverrideToAppState();
  renderTracerVisual();
  markDirty();
}

function applyL3ToDOM(btcL3) {
  if (!btcL3) return;
  const map = [
    ['nearMonth', 'l3NearMonth'], ['farMonth', 'l3FarMonth'], ['basisSpread', 'l3BasisSpread'],
    ['refLow', 'l3RefLow'], ['refMid', 'l3RefMid'], ['refHigh', 'l3RefHigh'],
  ];
  map.forEach(([key, id]) => {
    const v = btcL3[key];
    if (v != null && v !== '') el(id).value = String(v);
  });
}

function syncHydratedSlicesFromDOM() {
  appState.intake = {
    whinfellScore: el('whinfellScore').value,
    transmissionState: el('transmissionState').value,
    regimeTag: el('regimeTag').value,
  };
  appState.china = {
    policyStrength: el('chinaPolicyStrength').value,
    stateImpulse: el('chinaStateImpulse').value,
    growthImpulse: el('chinaGrowthImpulse').value,
    regimeTag: el('chinaRegimeTag').value,
  };
  appState.grossRisk = {
    ...appState.grossRisk,
    bookA: el('grossA').value,
    bookB: el('grossB').value,
    posture: el('posture').value,
    handoverNote: el('handoverNote').value,
  };
  appState.btcL3 = {
    ...appState.btcL3,
    nearMonth: el('l3NearMonth').value,
    farMonth: el('l3FarMonth').value,
    basisSpread: el('l3BasisSpread').value,
    refLow: el('l3RefLow').value,
    refMid: el('l3RefMid').value,
    refHigh: el('l3RefHigh').value,
  };
}

function applyPipelineGrossDefaults(score) {
  if (Number.isNaN(score) || el('grossA').value.trim()) return;
  const d = defaultPipelineGross(score);
  if (d.bookA) el('grossA').value = d.bookA;
  if (d.posture && !appState.grossRisk.postureManual) el('posture').value = d.posture;
}

function acceptSuggestedTracer() {
  const sug = appState.suggestedTracer;
  if (!sug) return;
  if (!appState.tracer.horizons) appState.tracer.horizons = createEmptyHorizons();
  appState.tracer.horizons = applySuggestedMarks(appState.tracer.horizons, sug);
  LADDER.forEach(row => {
    const hz = appState.tracer.horizons[row.id];
    if (!hz) return;
    HORIZONS.forEach(h => {
      const sel = el(`hz-${row.id}-${h}`);
      if (sel) sel.value = hz[h] || '';
    });
  });
  appState.suggestedTracer = null;
  appState.tracer.flow = 'confirmed';
  renderSuggestedTracerPanel();
  renderTracerFlowChrome();
  renderTracerVisual();
  renderProvenancePanel(buildStateFromDOM());
  renderAll();
  markDirty();
  showToast('Operator Confirmed — suggestions applied to horizon matrix');
}

function dismissSuggestedTracer() {
  appState.suggestedTracer = null;
  if (appState.tracer.flow === 'suggested') appState.tracer.flow = 'empty';
  renderSuggestedTracerPanel();
  renderTracerFlowChrome();
  renderPostImportWorkflowStrip(buildStateFromDOM());
  markDirty();
  showToast('Tracer suggestions dismissed — matrix unchanged');
}

function scoreHydrationBundleQuality(bundle) {
  if (!bundle || typeof bundle !== 'object') return 0;
  let score = 0;
  const flows = bundle.flows_sidecar?.flows_status;
  if (flows === 'ok') score += 40;
  else if (flows === 'partial' || flows === 'fallback_1d') score += 22;
  else if (flows === 'unavailable') score += 4;
  const cockpits = bundle.node_cockpits;
  if (!cockpits) return score;
  score += 10;
  for (const row of LADDER) {
    const c = cockpits[row.id];
    if (!c) continue;
    score += 2;
    const sid = c.rv_basis?.active_series_id;
    const hz = sid && c.rv_basis?.series?.[sid]?.horizons;
    if (hz && Object.keys(hz).length >= 5) score += 4;
    const fm = c.funds_flows?.flows_meta?.flows_status;
    if (fm === 'ok') score += 2;
    else if (fm && fm !== 'unavailable') score += 1;
  }
  return score;
}

function assessHydrationImportGuard(incoming, currentState) {
  const incomingScore = scoreHydrationBundleQuality(incoming);
  const currentBundle = {
    node_cockpits: currentState?.hydration?.node_cockpits,
    flows_sidecar: currentState?.hydration?.flows_sidecar,
  };
  const currentScore = scoreHydrationBundleQuality(currentBundle);
  const downgrade = currentScore >= 45 && incomingScore < currentScore - 12;
  return {
    allowed: !downgrade,
    downgrade,
    incomingScore,
    currentScore,
    reason: downgrade
      ? 'Import blocked: incoming bundle is degraded vs current hydrated session.'
      : '',
  };
}

function prepareHydrationBundle(raw) {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (!raw || typeof raw !== 'object') {
    bootLog('warn', 'prepareHydrationBundle: invalid input', typeof raw);
    return raw;
  }
  try {
    const bundle = { ...raw };
    for (const key of HYDRATION_LOAD_STRIP_KEYS) delete bundle[key];
    if (bundle.task_force?.wtm_export_v21 && !bundle.wtm_export_v21) {
      bundle.wtm_export_v21 = bundle.task_force.wtm_export_v21;
      bootLog('debug', 'promoted task_force.wtm_export_v21');
    }
    const extractPanels = typeof window !== 'undefined' && window.WTM_TaskForceFeed?.extractTaskForcePanels;
    if (bundle.task_force) {
      if (extractPanels) {
        const panels = extractPanels(bundle.task_force);
        if (panels) bundle.task_force_panels = panels;
      }
      delete bundle.task_force;
    }
    if (bundle.hydration_audit && typeof bundle.hydration_audit === 'object') {
      const audit = { ...bundle.hydration_audit };
      delete audit.nodes;
      bundle.hydration_audit = audit;
    }
    const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
    bootLog('debug', `prepareHydrationBundle ok ${elapsed.toFixed(1)}ms keys=${Object.keys(bundle).length}`);
    return bundle;
  } catch (err) {
    bootLog('error', 'prepareHydrationBundle failed — using raw bundle', err);
    return raw;
  }
}

function hydrateFromBundle(bundle, options = {}) {
  if (!bundle || typeof bundle !== 'object') throw new Error('Invalid hydration bundle');
  bootLog('info', 'hydrateFromBundle start', { force: !!options.force, keys: Object.keys(bundle).length });
  bundle = prepareHydrationBundle(bundle);

  const guard = assessHydrationImportGuard(bundle, appState);
  if (!guard.allowed && !options.force) {
    showToast(`${guard.reason} Shift+click Import to force.`);
    return false;
  }

  const isHydration = bundle.hydration_version || bundle.source === 'parquet_hydration';
  const isPipeline = bundle.bundle_version && bundle.global;

  const wtmBlock = bundle.wtm_export_v21 || '';
  const wtmIsTaskForce = /Source Channel:\s*task_force/i.test(wtmBlock);
  let wtmParsed = null;
  if (wtmBlock) {
    wtmParsed = parsePerplexityText(wtmBlock);
    if (wtmParsed.imported.length && !wtmIsTaskForce) {
      delete wtmParsed.fields.tracerHorizons;
      delete wtmParsed.fields.tracerSuggested;
      applyImportFields(wtmParsed.fields);
    }
  }

  const g = bundle.global || {};
  if (g.whinfell_score != null) el('whinfellScore').value = String(g.whinfell_score);
  if (g.transmission_state) el('transmissionState').value = g.transmission_state;
  if (g.regime_tag) el('regimeTag').value = g.regime_tag;
  if (g.key_observation) {
    appState.research = { ...(appState.research || {}), importedObservation: g.key_observation };
    if (!isPipelineBoilerplateObservation(g.key_observation)) {
      appState.research.keyObservation = g.key_observation;
      if (el('keyObservation')) el('keyObservation').value = g.key_observation;
      if (!el('handoverNote').value.trim()) el('handoverNote').value = g.key_observation;
    }
  }

  const c = bundle.china || {};
  if (c.policy_strength != null) el('chinaPolicyStrength').value = String(c.policy_strength);
  if (c.state_impulse_score != null) el('chinaStateImpulse').value = String(c.state_impulse_score);
  if (c.growth_impulse_score != null) el('chinaGrowthImpulse').value = String(c.growth_impulse_score);
  if (c.regime_tag) el('chinaRegimeTag').value = c.regime_tag;

  const exec = bundle.execution || {};
  const l3Patch = {};
  if (exec.near_month) l3Patch.nearMonth = String(exec.near_month);
  if (exec.far_month) l3Patch.farMonth = String(exec.far_month);
  if (exec.basis_spread) l3Patch.basisSpread = String(exec.basis_spread);
  if (exec.ref_low) l3Patch.refLow = String(exec.ref_low);
  if (exec.ref_mid) l3Patch.refMid = String(exec.ref_mid);
  if (exec.ref_high) l3Patch.refHigh = String(exec.ref_high);
  if (Object.keys(l3Patch).length) {
    appState.btcL3 = { ...appState.btcL3, ...l3Patch };
    applyL3ToDOM(appState.btcL3);
  }
  const opPatch = {};
  if (exec.operator_confidence != null) opPatch.confidence = parseInt(exec.operator_confidence, 10);
  if (exec.execution_intent) opPatch.executionIntent = exec.execution_intent;
  if (exec.shock_probability != null) opPatch.shockProbability = parseInt(exec.shock_probability, 10);
  if (exec.shock_horizon) opPatch.shockHorizon = exec.shock_horizon;
  if (exec.basis_regime_label) opPatch.basisRegimeLabel = exec.basis_regime_label;
  if (exec.evidence_note) opPatch.evidenceNote = exec.evidence_note;
  if (bundle.operator_inputs) {
    const oi = bundle.operator_inputs;
    if (oi.operator_confidence != null) opPatch.confidence = oi.operator_confidence;
    if (oi.execution_intent) opPatch.executionIntent = oi.execution_intent;
    if (oi.shock_probability != null) opPatch.shockProbability = oi.shock_probability;
    if (oi.shock_horizon) opPatch.shockHorizon = oi.shock_horizon;
    if (oi.basis_regime_label) opPatch.basisRegimeLabel = oi.basis_regime_label;
    if (oi.evidence_note) opPatch.evidenceNote = oi.evidence_note;
    if (oi.key_observation) {
      appState.research = { ...(appState.research || {}), keyObservation: oi.key_observation };
      if (el('keyObservation')) el('keyObservation').value = oi.key_observation;
    }
  }
  if (Object.keys(opPatch).length) {
    appState.operator = { ...createEmptyOperator(), ...(appState.operator || {}), ...opPatch };
    applyOperatorToDOM(appState.operator);
  }

  const btcBias = exec.btc_bias || g.btc_bias || '';
  if (btcBias && !wtmIsTaskForce) {
    appState.research = { ...(appState.research || {}), btcBias };
  }

  if (wtmIsTaskForce && wtmParsed?.imported.length) {
    delete wtmParsed.fields.tracerHorizons;
    delete wtmParsed.fields.tracerSuggested;
    applyImportFields(wtmParsed.fields);
  }

  const score = parseInt(el('whinfellScore').value || g.whinfell_score, 10);
  applyPipelineGrossDefaults(score);
  syncHydratedSlicesFromDOM();

  applyProvenanceFields({
    snapshotId: bundle.snapshot_id || g.observation_id || '',
    lineageHash: bundle.lineage_hash || '',
    validationStatus: wtmIsTaskForce ? 'complete' : (bundle.validation_status || 'parsed'),
    dataAsOf: bundle.as_of || g.as_of || null,
    sourceChannel: wtmIsTaskForce ? 'task_force' : (isHydration ? 'parquet' : (bundle.source || 'pipeline')),
    freshnessStatus: bundle.freshness_status || computeFreshnessFromIso(bundle.as_of).status,
  }, { markHydrated: true });

  appState.commandBarAuthority = buildCommandBarAuthority(buildStateFromDOM(), bundle);

  const sug = bundle.suggested_tracer || {};
  if (Object.keys(sug).length) {
    appState.suggestedTracer = sug;
    appState.tracer.flow = 'suggested';
  } else {
    appState.tracer.flow = appState.tracer.flow === 'confirmed' ? 'confirmed' : 'empty';
  }

  const chinaHz = bundle.china_ladder?.horizons;
  if (chinaHz && typeof chinaHz === 'object') {
    appState.chinaLadder = {
      horizons: { ...createEmptyChinaHorizons(), ...chinaHz },
    };
  }

  appState.hydration = appState.hydration || createEmptyHydration();
  if (bundle.flows_sidecar) {
    appState.hydration.flows_sidecar = bundle.flows_sidecar;
  }
  if (bundle.flows_health) {
    appState.hydration.flows_health = bundle.flows_health;
  }
  if (bundle.china?.as_of) {
    appState.hydration.china_as_of = bundle.china.as_of;
  }
  const barchartAsOf = resolveBarchartBundleAsOf(bundle);
  if (barchartAsOf) {
    appState.hydration.barchart_as_of = barchartAsOf;
  }
  if (bundle.node_cockpits) {
    appState.hydration.node_cockpits = bundle.node_cockpits;
    appState.ui = appState.ui || createEmptyState().ui;
    appState.ui.hydrationBannerDismissed = false;
    startPostImportWorkflow();
  }
  if (bundle.cockpit_context) {
    appState.hydration.cockpit_context = bundle.cockpit_context;
    if (bundle.cockpit_context.weakest_node_id && LADDER.some(r => r.id === bundle.cockpit_context.weakest_node_id)) {
      appState.navigation = appState.navigation || createEmptyNavigation();
      if (!appState.navigation._user_picked_node) {
        appState.navigation.active_node_id = bundle.cockpit_context.weakest_node_id;
      }
    }
  }
  if (bundle.ingest_provenance) {
    appState.hydration.ingest_provenance = bundle.ingest_provenance;
  }
  if (bundle.hydration_audit) {
    appState.hydration.hydration_audit = bundle.hydration_audit;
  }
  if (bundle.ai_compute) {
    appState.hydration.ai_compute = bundle.ai_compute;
  }
  for (const key of ['corporate_credit', 'trade_tracker', 'btc_attribution', 'margin_rules', 'task_force_panels']) {
    if (bundle[key]) appState.hydration[key] = bundle[key];
  }

  const paintOk = renderAll();
  if (!paintOk) {
    bootLog('error', 'hydrateFromBundle renderAll failed — kept FALLBACK until next healthy paint');
    logConsoleGuard('hydrate_fallback', { snapshot: bundle?.snapshot_id || null });
  }
  markDirty();
  const label = isHydration ? 'Parquet hydration' : (isPipeline ? 'Pipeline bundle' : 'Hydration');
  const degradeNote = guard.downgrade && options.force ? ' · forced degraded import' : '';
  showToast(`${label} applied · ${bundle.freshness_status || 'freshness updated'}${degradeNote}`);
  bootLog('info', 'hydrateFromBundle complete', { label, snapshot: bundle.snapshot_id });
  return true;
}

function importHydrationFile(file, options = {}) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const bundle = JSON.parse(reader.result);
      hydrateFromBundle(bundle, options);
    } catch (err) {
      showToast('Invalid hydration JSON: ' + (err.message || 'parse error'));
    }
  };
  reader.readAsText(file);
}

/** Canonical deploy path — raw fetch owned by WTM_Ark only. */
const DEPLOY_HYDRATION_URL = 'data/hydration/latest.json';

/**
 * Force-reload deploy hydration via The Ark (single fetch + cache).
 * Returns boolean for legacy callers, or detail object when options.detail === true:
 * { ok, as_of, snapshot_id, freshness_status }
 */
async function reloadDeployHydration(options = {}) {
  const detail = !!options.detail;
  const fail = () => (detail ? { ok: false, as_of: null, snapshot_id: null, freshness_status: null } : false);
  if (location.protocol === 'file:') return fail();

  const ark = (typeof window !== 'undefined' && window.WTM_Ark) ? window.WTM_Ark : null;
  if (!ark || typeof ark.loadHydration !== 'function') {
    console.warn('[WTM] reloadDeployHydration: WTM_Ark unavailable — cannot load raw hydration');
    return fail();
  }

  try {
    // Ark is the sole raw loader (cache-bust + no-store). No second fetch here.
    const loaded = await ark.loadHydration({ force: options.force !== false });
    if (!loaded || !loaded.ok || !loaded.data) return fail();

    const bundle = loaded.data;
    if (!bundle || bundle.validation_status === 'missing') return fail();

    const ok = hydrateFromBundle(bundle, { force: options.force !== false });
    if (ok) {
      try { sessionStorage.setItem('whinfell_hydration_prompt_v1', '1'); } catch (_) { /* ignore */ }
      // Drop cached curve so post-hydrate paint cannot stick on empty/stale records.
      try {
        if (typeof WTM_BasisWatch !== 'undefined' && typeof WTM_BasisWatch.invalidateCurveCache === 'function') {
          WTM_BasisWatch.invalidateCurveCache();
        }
      } catch (_) { /* optional */ }
      scheduleHeavyPanelRefresh();
    }
    if (detail) {
      return {
        ok: !!ok,
        as_of: loaded.as_of || bundle.as_of || null,
        snapshot_id: loaded.snapshot_id || bundle.snapshot_id || null,
        freshness_status: loaded.freshness_status || bundle.freshness_status || null,
      };
    }
    return !!ok;
  } catch (_) {
    return fail();
  }
}

if (typeof window !== 'undefined') {
  window.WTM_reloadDeployHydration = reloadDeployHydration;
}

function isGitHubPagesHost() {
  try {
    return location.hostname.endsWith('github.io');
  } catch (_) {
    return false;
  }
}

function formatWebPublishStamp(iso, hydrationVersion) {
  if (!iso) return 'Web bundle — date unknown';
  let label = iso;
  try {
    if (typeof window.WTM_formatLocalStamp === 'function') {
      label = window.WTM_formatLocalStamp(iso);
    } else {
      const d = new Date(iso);
      if (!Number.isNaN(d.getTime())) {
        label = d.toLocaleString('en-US', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short',
        });
      }
    }
  } catch (_) { /* keep iso */ }
  const hv = hydrationVersion && hydrationVersion !== 'missing' ? ` · hydration ${hydrationVersion}` : '';
  return `Last updated · ${label}${hv}`;
}

async function loadWebPublishStamp() {
  if (location.protocol === 'file:') return null;
  const stampEl = el('webLastUpdated');
  if (!stampEl) return null;
  try {
    const res = await fetch(`BUILD_MANIFEST.json?_=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const manifest = await res.json();
      const text = formatWebPublishStamp(manifest.published_at, manifest.hydration_version);
      stampEl.textContent = text;
      stampEl.classList.remove('hidden');
      stampEl.title = manifest.pages_url || DESK_PAGES_URL;
      return manifest;
    }
    const stampRes = await fetch(`BUILD_STAMP.txt?_=${Date.now()}`, { cache: 'no-store' });
    if (stampRes.ok) {
      const lines = (await stampRes.text()).trim().split('\n');
      const text = formatWebPublishStamp(lines[0], null);
      stampEl.textContent = text;
      stampEl.classList.remove('hidden');
      return { published_at: lines[0] };
    }
  } catch (_) { /* ignore */ }
  if (isGitHubPagesHost()) {
    stampEl.textContent = 'Last updated — bundle stamp unavailable';
    stampEl.classList.remove('hidden');
  }
  return null;
}

if (typeof window !== 'undefined') {
  window.WTM_loadWebPublishStamp = loadWebPublishStamp;
}

async function tryAutoHydrateFromDeploy() {
  if (SAFE_BOOT) return false;
  if (location.protocol === 'file:') return false;
  try {
    if (new URLSearchParams(location.search).get('auto_hydrate') === '0') return false;
  } catch (_) { /* ignore */ }
  if (appState.provenance?.hydratedAt && appState.hydration?.node_cockpits) return false;
  return reloadDeployHydration({ force: false });
}

function applyImportFields(fields) {
  if (fields.provenance) applyProvenanceFields(fields.provenance, { markHydrated: !!fields.provenance.snapshotId });
  if (fields.tracerSuggested && Object.keys(fields.tracerSuggested).length) {
    appState.suggestedTracer = fields.tracerSuggested;
  } else if (fields.tracerHorizons && !fields.tracerSuggested) {
    LADDER.forEach(row => {
      const hz = fields.tracerHorizons[row.id];
      if (!hz) return;
      HORIZONS.forEach(h => {
        const sel = el(`hz-${row.id}-${h}`);
        if (sel && hz[h]) sel.value = hz[h];
      });
    });
  }
  if (fields.keyObservation || fields.btcBias || fields.researchTimestamp || fields.grossRiskRecommendation) {
    const ko = fields.keyObservation || '';
    appState.research = {
      ...appState.research,
      importedObservation: ko && isPipelineBoilerplateObservation(ko) ? ko : (appState.research?.importedObservation || ''),
      keyObservation: ko && !isPipelineBoilerplateObservation(ko) ? ko : (appState.research?.keyObservation || ''),
      grossRiskRecommendation: fields.grossRiskRecommendation || '',
      btcBias: fields.btcBias || '',
      timestamp: fields.researchTimestamp || new Date().toISOString().slice(0, 19),
    };
    if (ko && !isPipelineBoilerplateObservation(ko) && el('keyObservation')) el('keyObservation').value = ko;
  }
  if (fields.whinfellScore) el('whinfellScore').value = fields.whinfellScore;
  if (fields.transmissionState) el('transmissionState').value = fields.transmissionState;
  if (fields.regimeTag) el('regimeTag').value = fields.regimeTag;
  if (fields.chinaPolicyStrength) el('chinaPolicyStrength').value = fields.chinaPolicyStrength;
  if (fields.chinaStateImpulse) el('chinaStateImpulse').value = fields.chinaStateImpulse;
  if (fields.chinaGrowthImpulse) el('chinaGrowthImpulse').value = fields.chinaGrowthImpulse;
  if (fields.chinaRegimeTag) el('chinaRegimeTag').value = fields.chinaRegimeTag;
  if (fields.grossA) el('grossA').value = fields.grossA;
  if (fields.grossB) el('grossB').value = fields.grossB;
  if (fields.capitalBaseMm) el('capitalBaseMm').value = fields.capitalBaseMm;
  if (fields.handoverNote) el('handoverNote').value = fields.handoverNote;
  else if (fields.keyObservation && !el('handoverNote').value.trim()) el('handoverNote').value = fields.keyObservation;
  if (fields.l3NearMonth) el('l3NearMonth').value = fields.l3NearMonth;
  if (fields.l3FarMonth) el('l3FarMonth').value = fields.l3FarMonth;
  if (fields.l3BasisSpread) el('l3BasisSpread').value = fields.l3BasisSpread;
  if (fields.posture) {
    const p = parsePosture(fields.posture) || fields.posture;
    if (POSTURE_LABELS[p] || ['full','selective','light','defensive','flat'].includes(p)) {
      el('posture').value = p;
      appState.grossRisk.postureManual = true;
    }
  }
  if (fields.tracerHorizons) {
    LADDER.forEach(row => {
      const hz = fields.tracerHorizons[row.id];
      if (!hz) return;
      HORIZONS.forEach(h => {
        const sel = el(`hz-${row.id}-${h}`);
        if (sel && hz[h]) sel.value = hz[h];
      });
    });
  }
  if (fields.activeShock) {
    const shockKey = Object.keys(SHOCKS).find(k =>
      k.toLowerCase() === fields.activeShock.toLowerCase() ||
      SHOCKS[k].label.toLowerCase() === fields.activeShock.toLowerCase()
    );
    if (shockKey) {
      preShockSnapshot = JSON.parse(JSON.stringify(buildStateFromDOM().tracer.horizons));
      applyShock(shockKey, true);
    }
  }
  if (fields.whinfellScore || fields.provenance?.snapshotId) {
    const score = parseInt(fields.whinfellScore || el('whinfellScore').value, 10);
    applyPipelineGrossDefaults(score);
    syncHydratedSlicesFromDOM();
    appState.commandBarAuthority = buildCommandBarAuthority(buildStateFromDOM(), {
      global: {
        whinfell_score: fields.whinfellScore,
        transmission_state: fields.transmissionState,
        regime_tag: fields.regimeTag,
        gate_status: fields.gateStatus,
      },
      china: {
        sq3_score: fields.sq3Score,
        sq3_band: fields.sq3Band,
        policy_strength: fields.chinaPolicyStrength,
        state_impulse_score: fields.chinaStateImpulse,
        growth_impulse_score: fields.chinaGrowthImpulse,
      },
      freshness_status: fields.provenance?.freshnessStatus,
      as_of: fields.provenance?.dataAsOf,
      snapshot_id: fields.provenance?.snapshotId,
      source: fields.provenance?.sourceChannel || 'wtm_import',
    });
  }
  renderAll();
}

function normalizeLegacyState(raw) {
  if (!raw || typeof raw !== 'object') return createEmptyState();
  if ((raw.version === STATE_VERSION || raw.version === 6 || raw.version === 4 || raw.version === 3 || raw.version === 2) && raw.intake) return {
    ...createEmptyState(), ...raw,
    version: STATE_VERSION,
    china: { ...createEmptyState().china, ...(raw.china || {}) },
    provenance: { ...createEmptyProvenance(), ...(raw.provenance || {}) },
    commandBarAuthority: { ...createEmptyCommandBarAuthority(), ...(raw.commandBarAuthority || {}) },
    suggestedTracer: raw.suggestedTracer || null,
    hydration: { ...createEmptyState().hydration, ...(raw.hydration || {}) },
    navigation: { ...createEmptyNavigation(), ...(raw.navigation || {}) },
    chart: { ...createEmptyChartState(), ...(raw.chart || {}) },
    panel: { ...createEmptyPanelState(), ...(raw.panel || {}) },
    node_cockpit_overrides: { ...(raw.node_cockpit_overrides || {}) },
    ui: { ...createEmptyState().ui, ...(raw.ui || {}) },
    research: { ...createEmptyState().research, ...(raw.research || {}) },
    operator: { ...createEmptyOperator(), ...(raw.operator || {}) },
    snapshots: Array.isArray(raw.snapshots) ? raw.snapshots.slice(0, MAX_SNAPSHOTS) : [],
    tracer: {
      ...createEmptyState().tracer,
      ...raw.tracer,
      flow: raw.tracer?.flow || 'empty',
      horizons: { ...createEmptyHorizons(), ...(raw.tracer?.horizons || {}) },
      shockConfig: { ...createEmptyShockConfig(), ...(raw.tracer?.shockConfig || {}) },
    },
    chinaLadder: {
      horizons: { ...createEmptyChinaHorizons(), ...(raw.chinaLadder?.horizons || {}) },
    },
    btcL3: { ...createEmptyState().btcL3, ...(raw.btcL3 || {}) },
  };

  const s = createEmptyState();
  s.intake.whinfellScore = raw.whinfellScore ?? raw.intake?.whinfellScore ?? '';
  s.intake.transmissionState = raw.transmissionState ?? raw.intake?.transmissionState ?? '';
  s.intake.regimeTag = raw.regimeTag ?? raw.intake?.regimeTag ?? '';
  s.grossRisk.bookA = raw.grossA ?? raw.grossRisk?.bookA ?? '';
  s.grossRisk.bookB = raw.grossB ?? raw.grossRisk?.bookB ?? '';
  s.grossRisk.capitalBaseMm = raw.capitalBaseMm ?? raw.grossRisk?.capitalBaseMm ?? '';
  s.grossRisk.posture = raw.posture ?? raw.grossRisk?.posture ?? '';
  s.grossRisk.postureManual = !!(raw.postureManual ?? raw.grossRisk?.postureManual);
  s.grossRisk.handoverNote = raw.handoverNote ?? raw.grossRisk?.handoverNote ?? '';
  s.research = { ...createEmptyState().research, ...(raw.research || {}) };
  s.operator = { ...createEmptyOperator(), ...(raw.operator || {}) };
  s.urls.koyfin = raw.urlKoyfin ?? raw.urls?.koyfin ?? DEFAULTS.urls.koyfin;
  s.urls.barchart = raw.urlBarchart ?? raw.urls?.barchart ?? DEFAULTS.urls.barchart;
  s.meta.lastKoyfin = raw.lastKoyfin ?? raw.meta?.lastKoyfin ?? null;
  s.meta.lastBarchart = raw.lastBarchart ?? raw.meta?.lastBarchart ?? null;
  s.meta.savedAt = raw.savedAt ?? raw.meta?.savedAt ?? null;
  s.btcL3 = { ...s.btcL3, ...(raw.btcL3 || {}) };

  if (raw.tracer?.horizons) {
    s.tracer.horizons = { ...createEmptyHorizons(), ...raw.tracer.horizons };
  } else if (raw.tracer && typeof raw.tracer === 'object') {
    LADDER.forEach(row => {
      const legacy = raw.tracer[row.id];
      if (!legacy) return;
      const mapped = { confirming: 'up', mixed: 'flat', impairing: 'down', neutral: 'flat' }[legacy] || '';
      if (mapped) s.tracer.horizons[row.id].d1 = mapped;
    });
  }
  s.tracer.activeShock = raw.tracer?.activeShock ?? null;
  s.tracer.shockConfig = { ...createEmptyShockConfig(), ...(raw.tracer?.shockConfig || {}) };
  s.chinaLadder = {
    horizons: { ...createEmptyChinaHorizons(), ...(raw.chinaLadder?.horizons || {}) },
  };
  s.snapshots = Array.isArray(raw.snapshots) ? raw.snapshots.slice(0, MAX_SNAPSHOTS) : [];
  s.btcL3 = { ...s.btcL3, ...(raw.btcL3 || {}) };
  s.version = STATE_VERSION;
  return s;
}

function buildStateFromDOM() {
  const horizons = createEmptyHorizons();
  LADDER.forEach(row => {
    HORIZONS.forEach(h => {
      const sel = el(`hz-${row.id}-${h}`);
      if (sel) horizons[row.id][h] = sel.value;
    });
  });
  return {
    version: STATE_VERSION,
    intake: {
      whinfellScore: el('whinfellScore').value,
      transmissionState: el('transmissionState').value,
      regimeTag: el('regimeTag').value,
    },
    china: {
      policyStrength: el('chinaPolicyStrength').value,
      stateImpulse: el('chinaStateImpulse').value,
      growthImpulse: el('chinaGrowthImpulse').value,
      regimeTag: el('chinaRegimeTag').value,
    },
    provenance: { ...(appState.provenance || createEmptyProvenance()) },
    commandBarAuthority: { ...(appState.commandBarAuthority || createEmptyCommandBarAuthority()) },
    suggestedTracer: appState.suggestedTracer || null,
    hydration: {
      node_cockpits: appState.hydration?.node_cockpits || null,
      cockpit_context: appState.hydration?.cockpit_context || null,
      flows_sidecar: appState.hydration?.flows_sidecar || null,
      flows_health: appState.hydration?.flows_health || null,
      china_as_of: appState.hydration?.china_as_of || null,
      barchart_as_of: appState.hydration?.barchart_as_of || null,
      ingest_provenance: appState.hydration?.ingest_provenance || null,
      ai_compute: appState.hydration?.ai_compute || null,
      corporate_credit: appState.hydration?.corporate_credit || null,
      trade_tracker: appState.hydration?.trade_tracker || null,
      btc_attribution: appState.hydration?.btc_attribution || null,
      margin_rules: appState.hydration?.margin_rules || null,
      hydration_audit: appState.hydration?.hydration_audit || null,
    },
    navigation: { ...createEmptyNavigation(), ...(appState.navigation || {}) },
    chart: { ...createEmptyChartState(), ...(appState.chart || {}) },
    panel: { ...createEmptyPanelState(), ...(appState.panel || {}) },
    node_cockpit_overrides: { ...(appState.node_cockpit_overrides || {}) },
    ui: {
      trackView: appState.ui?.trackView || 'both',
      gateDetailOpen: !!appState.ui?.gateDetailOpen,
      expandedPrompt: appState.ui?.expandedPrompt || null,
      workspaceView: appState.ui?.workspaceView || 'cockpit',
    },
    grossRisk: {
      bookA: el('grossA').value,
      bookB: el('grossB').value,
      capitalBaseMm: el('capitalBaseMm').value,
      posture: el('posture').value,
      postureManual: appState.grossRisk.postureManual,
      handoverNote: el('handoverNote').value,
    },
    research: {
      ...(appState.research || createEmptyState().research),
      keyObservation: el('keyObservation')?.value || appState.research?.keyObservation || '',
    },
    operator: readOperatorFromDOM(),
    tracer: {
      horizons,
      activeShock: appState.tracer.activeShock,
      shockConfig: readShockConfigFromDOM(),
      flow: appState.tracer?.flow || 'empty',
    },
    chinaLadder: {
      horizons: { ...createEmptyChinaHorizons(), ...(appState.chinaLadder?.horizons || {}) },
    },
    snapshots: [...(appState.snapshots || [])],
    btcL3: {
      nearMonth: el('l3NearMonth').value,
      farMonth: el('l3FarMonth').value,
      basisSpread: el('l3BasisSpread').value,
      refLow: el('l3RefLow').value,
      refMid: el('l3RefMid').value,
      refHigh: el('l3RefHigh').value,
      lastScan: { ...(appState.btcL3?.lastScan || {}) },
    },
    urls: { koyfin: el('urlKoyfin').value, barchart: el('urlBarchart').value },
    meta: {
      savedAt: new Date().toISOString(),
      lastKoyfin: el('lastKoyfin').dataset.ts || null,
      lastBarchart: el('lastBarchart').dataset.ts || null,
    },
  };
}

function applyStateToDOM(state) {
  appState = normalizeLegacyState(state);
  el('whinfellScore').value = appState.intake.whinfellScore;
  el('transmissionState').value = appState.intake.transmissionState;
  el('regimeTag').value = appState.intake.regimeTag;
  el('chinaPolicyStrength').value = appState.china?.policyStrength || '';
  el('chinaStateImpulse').value = appState.china?.stateImpulse || '';
  el('chinaGrowthImpulse').value = appState.china?.growthImpulse || '';
  el('chinaRegimeTag').value = appState.china?.regimeTag || '';
  el('urlKoyfin').value = appState.urls.koyfin || DEFAULTS.urls.koyfin;
  el('urlBarchart').value = appState.urls.barchart || DEFAULTS.urls.barchart;
  el('grossA').value = appState.grossRisk.bookA;
  el('grossB').value = appState.grossRisk.bookB;
  el('capitalBaseMm').value = appState.grossRisk.capitalBaseMm;
  el('posture').value = appState.grossRisk.posture;
  el('handoverNote').value = appState.grossRisk.handoverNote;
  applyOperatorToDOM(appState.operator);
  if (el('keyObservation')) {
    const obs = appState.research?.keyObservation || '';
    el('keyObservation').value = isPipelineBoilerplateObservation(obs) ? '' : obs;
  }
  el('l3NearMonth').value = appState.btcL3.nearMonth;
  el('l3FarMonth').value = appState.btcL3.farMonth;
  el('l3BasisSpread').value = appState.btcL3.basisSpread;
  el('l3RefLow').value = appState.btcL3.refLow || '';
  el('l3RefMid').value = appState.btcL3.refMid || '';
  el('l3RefHigh').value = appState.btcL3.refHigh || '';
  applyShockConfigToDOM(appState.tracer.shockConfig);
  renderL3ScanResult(appState.btcL3.lastScan);
  LADDER.forEach(row => {
    HORIZONS.forEach(h => {
      const sel = el(`hz-${row.id}-${h}`);
      if (sel) sel.value = appState.tracer.horizons[row.id]?.[h] || '';
    });
  });
  setLastOpened('lastKoyfin', appState.meta.lastKoyfin);
  setLastOpened('lastBarchart', appState.meta.lastBarchart);
  if (appState.meta.savedAt) {
    const savedLabel = typeof window.WTM_formatLocalStamp === 'function'
      ? window.WTM_formatLocalStamp(appState.meta.savedAt)
      : new Date(appState.meta.savedAt).toLocaleString();
    setSaveIndicator('Saved · ' + savedLabel, true);
  }
  renderAll();
}

function loadState() {
  try {
    for (const key of [STORAGE_KEY, ...LEGACY_KEYS]) {
      const raw = localStorage.getItem(key);
      if (raw) return normalizeLegacyState(JSON.parse(raw));
    }
  } catch { /* */ }
  return createEmptyState();
}

function persistState() {
  appState = buildStateFromDOM();
  const wf = appState.ui?.postImportWorkflow;
  if (wf?.importAt) {
    const assessment = assessPostImportWorkflow(appState);
    if (assessment.steps[0]?.done && assessment.steps[1]?.done) {
      wf.savedAfterImport = true;
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  setSaveIndicator('Saved · ' + (typeof window.WTM_formatLocalStamp === 'function'
    ? window.WTM_formatLocalStamp(new Date())
    : new Date().toLocaleString()), true);
  flashSave();
  renderPostImportWorkflowStrip(appState);
  renderSessionReadyChip(appState);
}

function renderPrompts() {
  const expanded = appState.ui?.expandedPrompt;
  el('panel-prompts').innerHTML = PROMPTS.map(p => {
    const isOpen = expanded === p.id;
    return `
    <div class="prompt-tile progressive-disclosure bg-wtm-card border border-wtm-border rounded-lg p-2.5 ${isOpen ? 'prompt-tile-expanded' : ''}" data-prompt-id="${p.id}">
      <div class="flex justify-between items-start gap-2">
        <button type="button" class="prompt-expand text-left flex-1 min-w-0" data-id="${p.id}">
          <p class="text-xs font-bold">Prompt ${p.id} – ${p.title}</p>
          <p class="text-[10px] text-wtm-muted truncate">${p.desc}</p>
        </button>
        <button type="button" class="copy-prompt text-[10px] px-2 py-1 rounded border border-wtm-border shrink-0" data-text="${encodeURIComponent(p.text)}">Copy</button>
      </div>
      ${isOpen ? `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-[9px]">
        <div class="bg-wtm-bg border border-wtm-border rounded px-2 py-1"><span class="text-wtm-accent font-bold uppercase">Inputs:</span> ${p.inputs}</div>
        <div class="bg-wtm-bg border border-wtm-border rounded px-2 py-1"><span class="text-wtm-accent font-bold uppercase">Outputs:</span> ${p.outputs}</div>
      </div>
      <pre class="text-[10px] text-wtm-muted whitespace-pre-wrap bg-wtm-bg border border-wtm-border rounded p-2 max-h-20 overflow-y-auto mt-2">${p.text}</pre>` : ''}
    </div>`;
  }).join('');
  document.querySelectorAll('.copy-prompt').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      await navigator.clipboard.writeText(decodeURIComponent(btn.dataset.text));
      btn.textContent = 'Copied ✓';
      setTimeout(() => btn.textContent = 'Copy', 2000);
    };
  });
  document.querySelectorAll('.prompt-expand').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      appState.ui = appState.ui || createEmptyState().ui;
      appState.ui.expandedPrompt = appState.ui.expandedPrompt === id ? null : id;
      renderPrompts();
    };
  });
}

function applyTrackView(view) {
  appState.ui = appState.ui || createEmptyState().ui;
  appState.ui.trackView = view;
  const showGlobal = view === 'both' || view === 'global';
  const showChina = view === 'both' || view === 'china';
  el('cmdGlobalCluster')?.classList.toggle('zone-hidden', !showGlobal);
  el('cmdChinaCluster')?.classList.toggle('zone-hidden', !showChina);
  el('tracerGlobalCol')?.classList.toggle('zone-hidden', !showGlobal);
  el('tracerChinaCol')?.classList.toggle('zone-hidden', !showChina);
  el('tracerLadderTracks')?.classList.toggle('lg:grid-cols-2', view === 'both');
  el('tracerLadderTracks')?.classList.toggle('lg:grid-cols-1', view !== 'both');
  el('intakeGlobal').classList.toggle('zone-hidden', !showGlobal);
  el('intakeChina').classList.toggle('zone-hidden', !showChina);
  document.querySelectorAll('.track-toggle').forEach(btn => {
    btn.classList.toggle('track-toggle-active', btn.dataset.track === view);
    btn.classList.toggle('text-wtm-muted', btn.dataset.track !== view);
  });
}

function sq3ChipCls(bandKey) {
  if (bandKey === 'green') return 'border-wtm-green text-wtm-green bg-emerald-500/10';
  if (bandKey === 'amber') return 'border-wtm-amber text-wtm-amber bg-amber-500/10';
  if (bandKey === 'red') return 'border-wtm-red text-wtm-red bg-red-500/10';
  return 'border-wtm-border text-wtm-muted';
}

function readShockConfigFromDOM() {
  const intensity = document.querySelector('input[name="shockIntensity"]:checked')?.value || 'full';
  const disabledStages = [];
  document.querySelectorAll('.shock-stage-cb').forEach(cb => {
    if (!cb.checked) disabledStages.push(cb.dataset.stage);
  });
  return { intensity, disabledStages };
}

function applyShockConfigToDOM(cfg) {
  const c = cfg || createEmptyShockConfig();
  document.querySelectorAll('input[name="shockIntensity"]').forEach(r => {
    r.checked = r.value === (c.intensity || 'full');
  });
  document.querySelectorAll('.shock-stage-cb').forEach(cb => {
    cb.checked = !(c.disabledStages || []).includes(cb.dataset.stage);
  });
}

function renderShockStageChecks() {
  el('shockStageChecks').innerHTML = LADDER.map(row => `
    <label class="flex items-center gap-1 text-[9px] cursor-pointer px-1.5 py-0.5 rounded border border-wtm-border bg-wtm-bg">
      <input type="checkbox" class="shock-stage-cb accent-wtm-accent" data-stage="${row.id}" checked />
      ${row.short}
    </label>`).join('');
  document.querySelectorAll('.shock-stage-cb').forEach(cb => {
    cb.onchange = () => {
      appState.tracer.shockConfig = readShockConfigFromDOM();
      markDirty();
    };
  });
  document.querySelectorAll('input[name="shockIntensity"]').forEach(r => {
    r.onchange = () => {
      appState.tracer.shockConfig = readShockConfigFromDOM();
      markDirty();
    };
  });
}

function makeSnapshotId() {
  return 'snap_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
}

function saveTracerSnapshot() {
  const name = (el('snapshotName').value || '').trim();
  if (!name) { showToast('Enter a snapshot name'); return; }
  const state = buildStateFromDOM();
  const gate = deriveGate(state);
  const snap = {
    id: makeSnapshotId(),
    name,
    savedAt: new Date().toISOString(),
    scoreBand: gate.zone.text,
    regimeTag: state.intake.regimeTag,
    intake: { ...state.intake },
    tracer: { horizons: JSON.parse(JSON.stringify(state.tracer.horizons)), activeShock: state.tracer.activeShock },
    operator: { ...state.operator },
    keyObservation: state.research?.keyObservation || '',
    posture: state.grossRisk.posture || suggestPosture(gate.score),
  };
  appState.snapshots = [snap, ...(appState.snapshots || [])].slice(0, MAX_SNAPSHOTS);
  el('snapshotName').value = '';
  renderSnapshotList();
  markDirty();
  showToast(`Snapshot saved: ${name}`);
}

function deleteTracerSnapshot(id) {
  appState.snapshots = (appState.snapshots || []).filter(s => s.id !== id);
  if (compareSnapshotId === id) { compareSnapshotId = null; el('snapshotCompare').classList.add('hidden'); }
  renderSnapshotList();
  markDirty();
  showToast('Snapshot deleted');
}

function loadTracerSnapshot(id) {
  const snap = (appState.snapshots || []).find(s => s.id === id);
  if (!snap) return;
  if (snap.tracer?.horizons) {
    LADDER.forEach(row => {
      HORIZONS.forEach(h => {
        const sel = el(`hz-${row.id}-${h}`);
        if (sel) sel.value = snap.tracer.horizons[row.id]?.[h] || '';
      });
    });
  }
  appState.tracer.activeShock = snap.tracer?.activeShock || null;
  renderTracerVisual();
  markDirty();
  showToast(`Loaded snapshot: ${snap.name}`);
}

function toggleCompareSnapshot(id) {
  compareSnapshotId = compareSnapshotId === id ? null : id;
  renderSnapshotList();
  renderSnapshotCompare();
}

function renderSnapshotCompare() {
  const panel = el('snapshotCompare');
  if (!compareSnapshotId) { panel.classList.add('hidden'); return; }
  const snap = (appState.snapshots || []).find(s => s.id === compareSnapshotId);
  if (!snap) { panel.classList.add('hidden'); return; }
  const current = buildStateFromDOM();
  const curHealth = computeHealthScore(current);
  const snapState = { intake: snap.intake || {}, tracer: snap.tracer || {} };
  const snapHealth = computeHealthScore(snapState);
  const snapSummary = snapHealth.summary;
  const curSummary = curHealth.summary;
  const diffs = LADDER.map((row, i) => {
    const d = curSummary.stageNets[i] - snapSummary.stageNets[i];
    return `${row.short}: ${d > 0 ? '+' : ''}${d}`;
  }).join(' · ');
  panel.classList.remove('hidden');
  panel.innerHTML = `<span class="font-bold text-wtm-accent uppercase">Compare — ${snap.name}</span>
    <div class="mt-1 grid grid-cols-2 gap-2">
      <div><span class="text-wtm-muted">Snapshot:</span> Health ${snapHealth.score} (${snapHealth.label}) · ${snap.scoreBand || '—'}</div>
      <div><span class="text-wtm-muted">Current:</span> Health ${curHealth.score} (${curHealth.label}) · ${deriveGate(current).zone.text}</div>
    </div>
    <p class="mt-1 text-wtm-muted">Net deltas (current − snapshot): ${diffs}</p>`;
}

function snapshotHealth(snap) {
  return computeHealthScore({ intake: snap.intake || {}, tracer: snap.tracer || {} });
}

function renderSnapshotList() {
  const list = el('snapshotList');
  if (!list) return;
  const snaps = appState.snapshots || [];
  if (!snaps.length) {
    list.innerHTML = '<span class="text-[9px] text-wtm-muted italic">No snapshots saved</span>';
    return;
  }
  list.innerHTML = snaps.map(s => {
    const h = snapshotHealth(s);
    return `
    <div class="flex items-center gap-1 px-2 py-1 rounded border text-[9px] ${compareSnapshotId === s.id ? 'snapshot-selected border-wtm-accent' : 'border-wtm-border bg-wtm-bg'}">
      <span class="font-semibold">${s.name}</span>
      <span class="text-wtm-muted">${h.score} (${h.label}) · ${s.scoreBand || '—'}</span>
      <button type="button" class="snap-load text-wtm-accent hover:underline" data-id="${s.id}">Load</button>
      <button type="button" class="snap-compare text-wtm-muted hover:underline" data-id="${s.id}">${compareSnapshotId === s.id ? 'Hide' : 'Compare'}</button>
      <button type="button" class="snap-del text-wtm-red hover:underline" data-id="${s.id}">Del</button>
    </div>`;
  }).join('');
  list.querySelectorAll('.snap-load').forEach(b => b.onclick = () => loadTracerSnapshot(b.dataset.id));
  list.querySelectorAll('.snap-compare').forEach(b => b.onclick = () => toggleCompareSnapshot(b.dataset.id));
  list.querySelectorAll('.snap-del').forEach(b => b.onclick = () => deleteTracerSnapshot(b.dataset.id));
}

function initScenarioLoop() {
  scenarioLoop.variants = Array.from({ length: SCENARIO_VARIANT_COUNT }, (_, i) => ({
    id: 'var_' + (i + 1),
    label: ['Base Case', 'Stress Case', 'Upside Case'][i] || `Variant ${i + 1}`,
    whinfellScore: '',
    transmissionState: '',
    regimeTag: '',
  }));
  renderScenarioColumns();
}

function renderScenarioColumns() {
  el('scenarioColumns').innerHTML = scenarioLoop.variants.map((v, i) => `
    <div class="bg-wtm-card border border-wtm-border rounded-lg p-3" data-var-idx="${i}">
      <p class="text-[10px] font-bold uppercase text-wtm-accent mb-2">${v.label}</p>
      <label class="block mb-2"><span class="text-[9px] text-wtm-muted uppercase">Whinfell Score</span>
        <input type="number" min="0" max="100" class="sc-score w-full mt-0.5 bg-wtm-bg border border-wtm-border rounded px-2 py-1 text-[10px]" value="${v.whinfellScore}" /></label>
      <label class="block mb-2"><span class="text-[9px] text-wtm-muted uppercase">Transmission State</span>
        <select class="sc-tx w-full mt-0.5 bg-wtm-bg border border-wtm-border rounded px-2 py-1 text-[10px]">
          <option value="">—</option>
          ${Object.keys(TX_META).map(k => `<option value="${k}" ${v.transmissionState === k ? 'selected' : ''}>${TX_META[k].label}</option>`).join('')}
        </select></label>
      <label class="block mb-2"><span class="text-[9px] text-wtm-muted uppercase">Regime Tag</span>
        <input type="text" class="sc-regime w-full mt-0.5 bg-wtm-bg border border-wtm-border rounded px-2 py-1 text-[10px]" value="${v.regimeTag}" /></label>
      <div class="sc-result mt-2 p-2 rounded border border-wtm-border bg-wtm-bg text-[9px] text-wtm-muted">Run comparison to evaluate</div>
    </div>`).join('');
  el('scenarioColumns').querySelectorAll('[data-var-idx]').forEach(col => {
    const idx = parseInt(col.dataset.varIdx, 10);
    col.querySelector('.sc-score').oninput = e => { scenarioLoop.variants[idx].whinfellScore = e.target.value; };
    col.querySelector('.sc-tx').onchange = e => { scenarioLoop.variants[idx].transmissionState = e.target.value; };
    col.querySelector('.sc-regime').oninput = e => { scenarioLoop.variants[idx].regimeTag = e.target.value; };
  });
}

function runScenarioLoop() {
  const current = buildStateFromDOM();
  scenarioLoop.lastResults = scenarioLoop.variants.map(v => {
    const variantState = {
      intake: { whinfellScore: v.whinfellScore, transmissionState: v.transmissionState, regimeTag: v.regimeTag },
      tracer: current.tracer,
    };
    const gate = deriveGate(variantState);
    const health = computeHealthScore(variantState);
    const posture = suggestPosture(gate.score);
    return { ...v, gate: gate.label, health: health.score, healthLabel: health.label, weakest: health.weakestStage, posture: POSTURE_LABELS[posture] || '—' };
  });
  el('scenarioColumns').querySelectorAll('[data-var-idx]').forEach(col => {
    const idx = parseInt(col.dataset.varIdx, 10);
    const r = scenarioLoop.lastResults[idx];
    const resEl = col.querySelector('.sc-result');
    if (!r || !resEl) return;
    const healthCls = r.health >= 65 ? 'text-wtm-green' : r.health >= 50 ? 'text-wtm-amber' : 'text-wtm-red';
    resEl.innerHTML = `<div class="font-bold ${healthCls}">Health ${r.health} (${r.healthLabel})</div>
      <div>Gate: ${r.gate} · Posture: ${r.posture}</div>
      <div class="text-wtm-muted">Weakest: ${r.weakest}</div>`;
  });
  showToast('Scenario comparison updated');
}

function parseL3Number(val) {
  const n = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : NaN;
}

function scanBtcL3Opportunity(btcL3) {
  const spread = parseL3Number(btcL3.basisSpread);
  const low = parseL3Number(btcL3.refLow);
  const mid = parseL3Number(btcL3.refMid);
  const high = parseL3Number(btcL3.refHigh);
  if (Number.isNaN(spread)) return { result: 'neutral', reason: 'Enter a numeric basis spread', scannedAt: new Date().toISOString() };
  if (Number.isNaN(low) && Number.isNaN(high)) return { result: 'neutral', reason: 'Enter ref low and/or ref high thresholds', scannedAt: new Date().toISOString() };
  if (!Number.isNaN(high) && spread >= high) {
    return { result: 'rich', reason: `Spread ${spread} ≥ ref high ${high} — calendar rich / sell-spread bias`, scannedAt: new Date().toISOString() };
  }
  if (!Number.isNaN(low) && spread <= low) {
    return { result: 'cheap', reason: `Spread ${spread} ≤ ref low ${low} — calendar cheap / buy-spread bias`, scannedAt: new Date().toISOString() };
  }
  const band = !Number.isNaN(mid) ? `near ref mid ${mid}` : `between ${low} and ${high}`;
  return { result: 'neutral', reason: `Spread ${spread} ${band} — no edge vs references`, scannedAt: new Date().toISOString() };
}

function renderL3ScanResult(scan) {
  const panel = el('l3ScanResult');
  if (!scan?.result) { panel.classList.add('hidden'); return; }
  const cls = scan.result === 'rich' ? 'border-wtm-green text-wtm-green bg-emerald-500/10'
    : scan.result === 'cheap' ? 'border-wtm-accent text-wtm-accent bg-wtm-accent/10'
    : 'border-wtm-border text-wtm-muted bg-wtm-bg';
  panel.className = `mb-2 p-2 rounded border text-[10px] ${cls}`;
  panel.classList.remove('hidden');
  panel.innerHTML = `<span class="font-bold uppercase">${scan.result}</span> — ${scan.reason || ''}`;
}

function runL3Scan() {
  const state = buildStateFromDOM();
  const scan = scanBtcL3Opportunity(state.btcL3);
  appState.btcL3.lastScan = scan;
  renderL3ScanResult(scan);
  markDirty();
  showToast(`L3 scan: ${scan.result}`);
}

function renderChinaTracerHorizonTable(state) {
  const read = computeChinaLadderRead(state);
  const body = el('chinaTracerHorizonBody');
  if (!body) return;
  body.innerHTML = CHINA_LADDER.map((row, i) => {
    const hz = read.horizons[row.id] || {};
    const net = read.stageNets[i];
    const isWeakest = row.id === read.weakestId;
    const netCls = isWeakest ? 'text-wtm-red'
      : net > 0 ? 'text-wtm-green' : net < 0 ? 'text-wtm-amber' : 'text-wtm-muted';
    return `<tr class="bg-wtm-bg/50" data-stage="${row.id}">
      <td class="p-2"><div class="font-semibold">${row.name}</div><div class="text-[9px] text-wtm-muted">${row.sub}</div></td>
      ${HORIZONS.map(h => {
        const v = hz[h] || '';
        const disp = HORIZON_DISPLAY[v] || '—';
        const cls = v === 'up' ? 'horizon-up' : v === 'down' ? 'horizon-down' : 'horizon-flat';
        return `<td class="p-2 text-center font-bold ${cls}">${disp}</td>`;
      }).join('')}
      <td class="p-2 text-center font-bold ${netCls}">${net > 0 ? '+' : ''}${net}</td>
    </tr>`;
  }).join('');

  const badge = el('chinaLadderBadge');
  if (badge) {
    badge.textContent = read.hasHorizons ? 'Hydrated' : 'Awaiting bundle';
    badge.className = `tracer-status-chip ${read.hasHorizons ? 'tracer-chip-confirmed' : 'border-wtm-border text-wtm-muted'}`;
  }
  const summary = el('chinaLadderSummary');
  if (summary) {
    if (!read.hasHorizons) {
      summary.textContent = 'Import hydration bundle with china_ladder.horizons — SQ3 policy handicaps China final (adj.)';
    } else if (read.handicapLine) {
      summary.textContent = read.handicapLine;
    } else {
      summary.textContent = `Ladder raw ${read.raw} · enter SQ3 policy inputs for China final (adj.)`;
    }
  }
}

function renderLadderCommandClusters(state) {
  const health = computeHealthScore(state);
  const globalNets = formatLadderNets(health);
  const globalNode = el('cmdGlobalCluster');
  if (globalNode) {
    globalNode.innerHTML = `<span class="font-bold uppercase text-wtm-accent">Global ladder</span> · nets ${globalNets} · health ${health.score} (${health.label}) · weakest ${health.weakestStage}`;
  }
  const china = computeChinaLadderRead(state);
  const chinaNode = el('cmdChinaCluster');
  if (chinaNode) {
    if (!china.hasHorizons) {
      chinaNode.innerHTML = '<span class="font-bold uppercase text-wtm-accent">China ladder</span> · awaiting hydration';
    } else if (china.finalScore != null) {
      chinaNode.innerHTML = `<div><span class="font-bold uppercase text-wtm-accent">China ladder</span> · <strong>China final (adj.) ${china.finalScore} · ${china.band}</strong> · weakest ${china.weakestStage}</div>`
        + `<div class="text-[8px] text-wtm-muted mt-0.5">Ladder raw ${china.raw}, SQ3 policy ${china.sq3} (${china.sq3PolicyBand || '—'}) ×${china.multiplier}</div>`
        + (china.handicapLine ? `<div class="text-[8px] text-wtm-muted mt-0.5">${china.handicapLine}</div>` : '');
    } else {
      chinaNode.innerHTML = `<span class="font-bold uppercase text-wtm-accent">China ladder</span> · Ladder raw ${china.raw} · SQ3 policy pending · weakest ${china.weakestStage}`;
    }
  }
}

function renderTracerHorizonTable() {
  el('tracerHorizonBody').innerHTML = LADDER.map(row => `
    <tr class="bg-wtm-bg/50" data-stage="${row.id}">
      <td class="p-2"><div class="font-semibold">${row.name}</div><div class="text-[9px] text-wtm-muted">${row.sub}</div></td>
      ${HORIZONS.map(h => `<td class="p-1 text-center">
        <select id="hz-${row.id}-${h}" class="hz-select w-full bg-wtm-card border border-wtm-border rounded px-1 py-0.5 text-[10px] text-center">
          <option value="">—</option><option value="up">↑</option><option value="flat">→</option><option value="down">↓</option>
        </select></td>`).join('')}
      <td class="p-2 text-center font-bold" id="net-${row.id}">—</td>
    </tr>`).join('');
  document.querySelectorAll('.hz-select').forEach(sel => {
    sel.onchange = onHorizonSelectChange;
  });
}

function renderTracerVisual() {
  const state = buildStateFromDOM();
  const { score, zone } = deriveGate(state);
  const summary = computeTracerSummary(state.tracer.horizons);

  el('tracerScoreLabel').textContent = Number.isNaN(score) ? '—' : `${score} (${zone.text})`;
  el('tracerScoreBar').style.width = (Number.isNaN(score) ? 0 : score) + '%';
  el('tracerScoreBar').className = `h-full tracer-bar ${Number.isNaN(score) ? 'bg-wtm-border' : score >= 65 ? 'bg-wtm-green' : score >= 50 ? 'bg-wtm-amber' : 'bg-wtm-red'}`;

  LADDER.forEach((row, i) => {
    const netEl = el(`net-${row.id}`);
    const net = summary.stageNets[i];
    if (netEl) {
      netEl.textContent = net > 0 ? `+${net}` : String(net);
      netEl.className = `p-2 text-center font-bold ${i === summary.weakestIdx && net < 0 ? 'text-wtm-red' : net > 0 ? 'text-wtm-green' : net < 0 ? 'text-wtm-amber' : 'text-wtm-muted'}`;
    }
  });

  const chain = el('tracerChain');
  chain.innerHTML = LADDER.map((row, i) => {
    const net = summary.stageNets[i];
    const isWeakest = i === summary.weakestIdx;
    const nodeCls = isWeakest
      ? 'border-wtm-red text-wtm-red bg-red-500/20 chain-node-weakest'
      : net > 0 ? 'border-wtm-green text-wtm-green bg-emerald-500/10'
      : net < 0 ? 'border-wtm-amber text-wtm-amber bg-amber-500/10'
      : 'border-wtm-border text-wtm-muted bg-wtm-bg';
    const arrow = i > 0 ? chainArrow(summary.chainHealth[i]) : null;
    const arrowHtml = arrow ? `<span class="${arrow.cls} px-0.5 inline-block" title="Δ ${summary.chainHealth[i]}">${arrow.sym}</span>` : '';
    return `${arrowHtml}<span class="px-1.5 py-0.5 rounded border text-[8px] font-bold ${nodeCls}" title="${row.name} · net ${net}">${row.short}</span>`;
  }).join('');

  const health = computeHealthScore(state);
  el('tracerOverall').textContent = `Transmission Health: ${health.score} (${health.label}) · Weakest: ${health.weakestStage} · ladder net ${summary.overall > 0 ? '+' : ''}${summary.overall}`;
  renderChinaTracerHorizonTable(state);
  renderSnapshotCompare();

  const shockLabel = state.tracer.activeShock && SHOCKS[state.tracer.activeShock];
  el('activeShockLabel').textContent = shockLabel ? `Active: ${shockLabel.label}` : 'No active shock';
}

function updateGrossDisplay(state, gate) {
  const total = deriveGrossTotal(state);
  el('grossTotal').value = total.toFixed(1) + '%';
  const base = parseFloat(state.grossRisk.capitalBaseMm);
  const mmHint = el('grossMmHint');
  if (!Number.isNaN(base) && base > 0) {
    const mmTotal = (total / 100) * base;
    const mmA = ((parseFloat(state.grossRisk.bookA) || 0) / 100) * base;
    const mmB = ((parseFloat(state.grossRisk.bookB) || 0) / 100) * base;
    mmHint.textContent = `≈ ${mmTotal.toFixed(1)} $mm total (A: ${mmA.toFixed(1)}, B: ${mmB.toFixed(1)}) at ${base} $mm capital base`;
  } else {
    mmHint.textContent = 'Optional: enter Capital Base ($mm) to show $mm equivalent';
  }

  let posture = state.grossRisk.posture;
  if (!state.grossRisk.postureManual) {
    const suggested = suggestPosture(gate.score);
    if (suggested) { posture = suggested; el('posture').value = suggested; }
  }
  el('postureHint').textContent = `Linked: Score ${Number.isNaN(gate.score) ? '—' : gate.score} · Gate: ${gate.label} · Posture: ${POSTURE_LABELS[posture] || '—'}`;

  const warn = postureGateMismatch(gate, posture, gate.score);
  el('postureWarning').classList.toggle('hidden', !warn);
}

function assessHydrationSession(state) {
  const prov = state?.provenance || createEmptyProvenance();
  const hydration = state?.hydration || createEmptyHydration();
  const cockpits = hydration.node_cockpits;
  const hasCockpits = cockpits && LADDER.every(r => cockpits[r.id]);
  if (!prov.hydratedAt) {
    return {
      level: 'missing',
      title: 'Hydration required — cockpit panels degraded',
      body: 'No pipeline bundle imported. Run ./scripts/desk_live_session.sh (or Daily AM), then Import latest.json v1.2.0. CURRENT READING and RV quartiles stay empty until import.',
      showBanner: true,
      pulseImport: true,
    };
  }
  if (!hasCockpits) {
    return {
      level: 'stale',
      title: 'Stale or incomplete bundle in session',
      body: 'Session has a timestamp but no node cockpits (likely v1.0.0 or pre–Phase 2). Re-import data/hydration/latest.json or Desktop/Whinfell_Hydration_latest.json.',
      showBanner: true,
      pulseImport: true,
    };
  }
  const quality = scoreHydrationBundleQuality({
    node_cockpits: cockpits,
    flows_sidecar: hydration.flows_sidecar,
  });
  if (quality < 45) {
    return {
      level: 'incomplete',
      title: 'Hydration bundle quality low',
      body: 'Bundle imported but RV/flows data is thin. Re-run desk live session and re-import for full quartiles.',
      showBanner: true,
      pulseImport: false,
    };
  }
  return { level: 'ok', title: '', body: '', showBanner: false, pulseImport: false };
}

function renderHydrationBanner(state) {
  const banner = el('hydrationBanner');
  if (!banner) return;
  const assessment = assessHydrationSession(state);
  const dismissed = appState.ui?.hydrationBannerDismissed && assessment.level === 'missing';
  const show = assessment.showBanner && !dismissed;
  banner.classList.toggle('zone-hidden', !show);
  banner.classList.toggle('hydration-banner--stale', assessment.level === 'stale' || assessment.level === 'incomplete');
  if (show) {
    el('hydrationBannerTitle').textContent = assessment.title;
    el('hydrationBannerBody').textContent = assessment.body;
  }
  const importBtn = el('btnImportHydration');
  if (importBtn) importBtn.classList.toggle('btn-import-pulse', assessment.pulseImport && !dismissed);
  if (document.body?.classList) {
    document.body.classList.toggle('hydration-session-degraded', assessment.level === 'missing' && !dismissed);
    document.body.classList.toggle('hydration-session-stale', assessment.level === 'stale' || assessment.level === 'incomplete');
  }
}

const HYDRATION_IMPORT_HINT = [
  'Select the hydration JSON file:',
  '',
  'EASIEST: Whinfell_Hydration_latest.json',
  '  → Desktop or Downloads folder',
  '',
  'OR: Desktop → Whinfell_BUILD_Cousins → data → hydration → latest.json',
  '',
  'NOT whinfell_drop (that folder is CSV downloads only).',
].join('\n');

function buildHydrationImportConfirmMessage(actionLabel) {
  return `${HYDRATION_IMPORT_HINT}\n\nClick OK to ${actionLabel}.`;
}

function maybePromptFirstHydrationImport(state) {
  if (SAFE_BOOT) {
    bootLog('info', 'safe_boot — hydration import prompt suppressed');
    return;
  }
  try {
    if (sessionStorage.getItem('whinfell_hydration_prompt_v1')) return;
    const assessment = assessHydrationSession(state);
    if (!assessment.showBanner) return;
    if (assessment.level === 'missing' && appState.ui?.hydrationBannerDismissed) return;
    sessionStorage.setItem('whinfell_hydration_prompt_v1', '1');
    setTimeout(() => {
      const msg = buildHydrationImportConfirmMessage('choose the file now');
      if (window.confirm(msg)) openHydrationFilePicker(false);
    }, 700);
  } catch (_) { /* sessionStorage unavailable */ }
}

function renderHydrationImportStatus(state) {
  const node = el('hydrationImportStatus');
  const timeNode = el('headerImportTime');
  if (!node) return;
  const assessment = assessHydrationSession(state);
  const prov = state?.provenance || createEmptyProvenance();
  if (assessment.level === 'missing') {
    node.textContent = 'No bundle imported — panels degraded';
    node.className = 'console-import-status hydration-import-status-critical';
    node.title = 'Import data/hydration/latest.json after desk live session';
    if (timeNode) timeNode.textContent = '';
    renderSignalDetailTech(state);
    return;
  }
  if (assessment.level === 'stale' || assessment.level === 'incomplete') {
    node.textContent = 'Stale bundle — re-import recommended';
    node.className = 'console-import-status hydration-import-status-warn';
    node.title = assessment.body;
    if (timeNode) {
      timeNode.textContent = prov.hydratedAt
        ? `Last import ${typeof window.WTM_formatLocalStamp === 'function' ? window.WTM_formatLocalStamp(prov.hydratedAt) : new Date(prov.hydratedAt).toLocaleString()}`
        : '';
    }
    renderSignalDetailTech(state);
    return;
  }
  const fresh = prov.freshnessStatus || computeFreshnessFromIso(prov.dataAsOf).status;
  const when = prov.hydratedAt
    ? (typeof window.WTM_formatLocalStamp === 'function'
      ? window.WTM_formatLocalStamp(prov.hydratedAt)
      : new Date(prov.hydratedAt).toLocaleString())
    : '—';
  node.textContent = `Imported ${when} · ${freshnessLabelFromStatus(fresh)}`;
  node.className = `console-import-status ${fresh === 'fresh' ? 'text-wtm-green' : fresh === 'stale' ? 'text-wtm-red' : 'text-wtm-amber'}`;
  node.title = `Data as-of: ${typeof window.WTM_formatLocalStamp === 'function' && prov.dataAsOf ? window.WTM_formatLocalStamp(prov.dataAsOf) : (prov.dataAsOf || '—')}`;
  if (timeNode) {
    const lineage = prov.lineageHash ? String(prov.lineageHash).replace(/^sha256:/, '').slice(0, 12) : '';
    timeNode.textContent = lineage ? `Lineage ${lineage}…` : '';
    timeNode.title = prov.lineageHash || prov.snapshotId || '';
  }
  renderSignalDetailTech(state);
}

function hydrationFieldStatusChip(status) {
  const map = {
    ok: 'status-chip--complete',
    partial: 'status-chip--amber',
    empty: 'status-chip--impaired',
    optional_empty: 'status-chip--info',
    miss: 'status-chip--impaired',
  };
  const cls = map[status] || 'status-chip--info';
  return `<span class="status-chip ${cls}">${escapeHtml(String(status || '—'))}</span>`;
}

function renderHydrationFieldLog(state) {
  const node = el('hydrationFieldLog');
  if (!node) return;
  const audit = state?.hydration?.hydration_audit;
  if (!audit?.summary) {
    node.textContent = 'Field-by-field hydration log ships in bundle v1.2.0+ (hydration_audit). Re-import latest.json after desk live session.';
    return;
  }
  const s = audit.summary;
  const rows = (audit.fields || []).map((row, i) => {
    return `<tr class="hydration-log-row" data-hydration-row="${i}" data-status="${escapeHtml(row.status || '')}">
      <td>${hydrationFieldStatusChip(row.status)}</td>
      <td>${escapeHtml(row.section || '')}</td>
      <td>${escapeHtml(row.field || '')}</td>
      <td>${escapeHtml(row.ui_target || '')}</td>
      <td>${escapeHtml(row.value_preview || '—')}</td>
      <td class="text-[10px] text-wtm-muted">${escapeHtml(row.notes || '')}</td>
    </tr>`;
  }).join('');
  const remediation = (audit.remediation || []).slice(0, 8).map(r =>
    `<li><strong>${escapeHtml(r.field || '')}</strong> — ${escapeHtml(r.action || '')}</li>`
  ).join('');
  node.innerHTML = `
    <p><strong>Session:</strong> ${escapeHtml(s.tc_session_level || '—')}
      · <strong>Quality:</strong> ${escapeHtml(String(s.bundle_quality_score ?? '—'))}
      · <strong>Required OK:</strong> ${escapeHtml(String(s.required_ok ?? '—'))}/${escapeHtml(String(s.required_fields ?? '—'))}
      (${escapeHtml(String(s.coverage_pct ?? '—'))}%)</p>
    <table class="ingest-audit-table hydration-field-log-table">
      <thead><tr><th>Status</th><th>Section</th><th>Field</th><th>TC target</th><th>Value</th><th>Notes</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${remediation ? `<p class="text-[10px] mt-2"><strong>Remediation (top):</strong></p><ul class="text-[10px] list-disc pl-4">${remediation}</ul>` : ''}`;
}

function renderIngestProvenanceAudit(state) {
  const node = el('ingestProvenanceAudit');
  if (!node) return;
  const ingest = state?.hydration?.ingest_provenance;
  if (!ingest || !ingest.staged_count) {
    node.textContent = 'Staged ingest routes appear after hydration import (ARCH-1 M3).';
    return;
  }
  const kinds = ingest.output_kinds || {};
  const kindSummary = Object.entries(kinds)
    .map(([k, n]) => `${k}: ${n}`)
    .join(' · ') || '—';
  const rows = (ingest.entries || []).slice(0, 12).map(entry => {
    const assets = (entry.canonical_assets || []).slice(0, 3).join(', ');
    return `<tr>
      <td>${escapeHtml(entry.filename || '')}</td>
      <td>${escapeHtml(entry.source_class || '')}</td>
      <td>${escapeHtml(entry.output_kind || '')}</td>
      <td>${escapeHtml(assets || '—')}</td>
    </tr>`;
  }).join('');
  const more = ingest.staged_count > 12
    ? `<p class="text-[10px] text-wtm-muted mt-1">+ ${ingest.staged_count - 12} more staged files (48h window)</p>`
    : '';
  node.innerHTML = `
    <p><strong>Primary output kind:</strong> ${escapeHtml(ingest.primary_output_kind || 'unknown')}</p>
    <p><strong>Staged routes (${ingest.staged_count}):</strong> ${escapeHtml(kindSummary)}</p>
    <table class="ingest-audit-table">
      <thead><tr><th>File</th><th>Source class</th><th>Kind</th><th>Assets</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>${more}`;
}

function buildDataDictionaryAuditRows(state, filterScope) {
  const rows = [];
  const gate = deriveGate(state);
  const cockpits = state?.hydration?.node_cockpits || {};
  const globalFlows = resolveFlowsStatusFromState(state);
  const flowsAsOf = state?.hydration?.flows_sidecar?.as_of || '';

  if (globalFlows !== 'ok') {
    rows.push({
      id: 'flows-global',
      scope: 'Global',
      node: 'Flows',
      status: globalFlows === 'unavailable' ? 'Missing' : 'Partial',
      missing: 'WTM-Flows-Global.csv',
      cause: globalFlows === 'unavailable' ? 'missing_source' : 'data_stale',
      impact: 'Funds-flow sponsorship degraded on all nodes',
      action: DD_AUDIT_REMEDIATION[globalFlows === 'unavailable' ? 'missing_source' : 'data_stale'],
      meta: { flows_as_of: flowsAsOf },
      auditScope: 'flows',
    });
  }

  LADDER.forEach(row => {
    const cockpit = cockpits[row.id];
    if (!cockpit) return;
    if (isHorizonNetFallback(cockpit) && !(cockpit.component_inputs || []).length) {
      rows.push({
        id: `${row.id}-horizon-fallback`,
        scope: 'Global',
        node: row.short,
        status: 'Partial',
        missing: 'C1-weighted components',
        cause: 'derived_unavailable',
        impact: 'Composite uses horizon-net fallback — mission read confidence reduced',
        action: DD_AUDIT_REMEDIATION.derived_unavailable,
        auditScope: row.id,
      });
    }
    (cockpit.component_inputs || []).forEach((comp, i) => {
      const cause = classifyComponentFailure(comp);
      if (!cause) return;
      const fc = DIAG_FAILURE_CODES[cause];
      rows.push({
        id: `${row.id}-comp-${i}`,
        scope: 'Global',
        node: row.short,
        status: String(comp.value).toLowerCase() === 'unavailable' ? 'Missing' : 'Partial',
        missing: comp.label || comp.asset_id || 'component',
        cause,
        impact: `Weakens ${row.short} mission read / component score`,
        action: DD_AUDIT_REMEDIATION[cause],
        meta: { source: comp.source, asset_id: comp.asset_id, code: fc?.code },
        auditScope: row.id,
        component: comp,
      });
    });
  });

  const china = computeChinaLadderRead(state);
  if (china.weakestStage && gate?.sq3Result && gate.sq3Score < 65) {
    rows.push({
      id: 'china-ladder-weak',
      scope: 'China',
      node: 'Ladder',
      status: 'Impaired',
      missing: `${china.weakestStage} confirmation`,
      cause: 'gate_suppressed',
      impact: 'Pulls final adjusted China confidence down',
      action: 'Inspect China credit confirmation inputs and SQ3 penalty logic',
      auditScope: 'china',
    });
  }

  return filterAuditRowsByScope(rows, filterScope);
}

function filterAuditRowsByScope(rows, filterScope) {
  if (!filterScope) return rows;
  if (filterScope === 'flows') {
    return rows.filter(r => r.auditScope === 'flows' || r.id === 'flows-global');
  }
  if (filterScope === 'signals') {
    return rows.filter(r =>
      r.id.endsWith('-horizon-fallback') ||
      (r.component && r.auditScope !== 'flows' && r.auditScope !== 'china')
    );
  }
  if (filterScope === 'global' || filterScope === 'history') {
    return rows.filter(r =>
      r.id.endsWith('-horizon-fallback') ||
      r.cause === 'sample_insufficient' ||
      r.cause === 'data_stale' ||
      r.component?.source === 'rv_history'
    );
  }
  if (filterScope === 'china') {
    return rows.filter(r => r.auditScope === 'china');
  }
  return rows.filter(r => r.auditScope === filterScope);
}

function renderDdAuditDetail(row) {
  const detail = el('ddAuditDetail');
  if (!detail || !row) {
    detail?.classList.add('zone-hidden');
    return;
  }
  const fc = DIAG_FAILURE_CODES[row.cause] || { code: 'DD-AUDIT', label: row.cause };
  detail.classList.remove('zone-hidden');
  detail.innerHTML = `
    <p><strong>${escapeHtml(row.node)}</strong> · ${escapeHtml(row.missing)}</p>
    <p><span class="status-chip status-chip--impaired">${escapeHtml(fc.code)}</span> ${escapeHtml(fc.label)}</p>
    <p><strong>Impact:</strong> ${escapeHtml(row.impact)}</p>
    <p><strong>Next action:</strong> ${escapeHtml(row.action)}</p>
    ${row.meta?.source ? `<p><strong>Source:</strong> ${escapeHtml(row.meta.source)} · ${escapeHtml(row.meta.asset_id || '')}</p>` : ''}
    ${row.meta?.flows_as_of ? `<p><strong>Flows as-of:</strong> ${escapeHtml(row.meta.flows_as_of)}</p>` : ''}`;
}

function renderDataDictionaryAudit(state, filterScope) {
  const node = el('dataDictionaryAudit');
  if (!node) return [];
  const gate = deriveGate(state);
  const rows = buildDataDictionaryAuditRows(state, filterScope);
  if (!state?.provenance?.hydratedAt) {
    node.textContent = 'Import hydration bundle to run data dictionary audit.';
    return [];
  }
  if (!rows.length) {
    const scopeMsg = filterScope
      ? `No issues in <strong>${escapeHtml(filterScope)}</strong> coverage for this session.`
      : 'All audited fields present for current 48h window. No remediation required.';
    node.innerHTML = `<p>${scopeMsg}</p>`;
    el('ddAuditDetail')?.classList.add('zone-hidden');
    return [];
  }
  const body = rows.map((row, i) => {
    const fc = DIAG_FAILURE_CODES[row.cause] || { code: '—' };
    return `<tr class="dd-audit-row" data-audit-row-id="${escapeHtml(row.id)}" data-agent-audit-row="${i}">
      <td>${escapeHtml(row.scope)}</td>
      <td>${escapeHtml(row.node)}</td>
      <td>${escapeHtml(row.status)}</td>
      <td>${escapeHtml(row.missing)}</td>
      <td><span class="status-chip status-chip--impaired">${escapeHtml(fc.code)}</span></td>
      <td>${escapeHtml(row.impact)}</td>
    </tr>`;
  }).join('');
  node.innerHTML = `
    <p>Click a row or coverage pill for remediation detail. Master Data Dictionary v1.0 governs field mapping.</p>
    <table class="dd-audit-table">
      <thead><tr><th>Scope</th><th>Node</th><th>Status</th><th>Missing</th><th>Cause</th><th>Impact</th></tr></thead>
      <tbody>${body}</tbody>
    </table>`;
  node.querySelectorAll('.dd-audit-row').forEach(tr => {
    tr.onclick = () => {
      node.querySelectorAll('.dd-audit-row').forEach(r => r.classList.remove('dd-audit-row--active'));
      tr.classList.add('dd-audit-row--active');
      const hit = rows.find(r => r.id === tr.dataset.auditRowId);
      renderDdAuditDetail(hit);
    };
  });
  return rows;
}

function openDictionaryAudit(scope) {
  const state = buildStateFromDOM();
  setSignalDetailOpen(true);
  const rows = buildDataDictionaryAuditRows(state, scope);
  renderDataDictionaryAudit(state, scope);
  if (rows.length) renderDdAuditDetail(rows[0]);
  else el('ddAuditDetail')?.classList.add('zone-hidden');
}

function buildUiAuditPayload(state) {
  const gate = deriveGate(state);
  const mode = assessCockpitHydrationMode(state);
  const checklist = buildCoverageChecklist(state);
  const ddRows = buildDataDictionaryAuditRows(state);
  const idx = nodeIndexById(activeNodeId());
  const nav = state.navigation || appState.navigation || {};
  return {
    console_build: TC_CONSOLE_BUILD,
    coverage_mode: mode.mode,
    impairment_driver: resolveImpairmentDriver(state, gate),
    coverage_checklist: checklist,
    dictionary_audit_count: ddRows.length,
    dictionary_audit_rows: ddRows.map(r => ({
      scope: r.scope,
      node: r.node,
      status: r.status,
      missing: r.missing,
      cause_code: (DIAG_FAILURE_CODES[r.cause] || {}).code,
      impact: r.impact,
      next_action: r.action,
    })),
    hydration_audit: state?.hydration?.hydration_audit?.summary || null,
    flipchart: {
      mode: nav.focus_mode ? 'focus' : nav.view_mode === 'compare' ? 'compare' : 'flipchart',
      active_node: activeNodeId(),
      position: idx >= 0 ? `${idx + 1}/${LADDER.length}` : null,
    },
  };
}

function resolveFlipchartRegimePill(metrics) {
  const regime = String(metrics?.regime || '').toLowerCase();
  if (/defensive|risk-off|compression|\bflat\b|fragile|no new/.test(regime)) {
    return { label: 'Defensive', cls: 'regime-defensive' };
  }
  if (/crisis|stressed|impaired|disorderly/.test(regime)) {
    return { label: 'Stressed', cls: 'regime-stressed' };
  }
  if (/constructive|risk-on|selective/.test(regime)) {
    return { label: 'Constructive', cls: 'regime-constructive' };
  }
  const tx = String(metrics?.txState || '').toLowerCase();
  if (/crisis|disorderly|stressed|elevated/.test(tx)) return { label: 'Stressed', cls: 'regime-stressed' };
  if (/defensive/.test(tx)) return { label: 'Defensive', cls: 'regime-defensive' };
  if (/normal|constructive/.test(tx)) return { label: 'Constructive', cls: 'regime-constructive' };
  return { label: '—', cls: 'flipchart-regime-tag--unset' };
}

function renderFlipchartState() {
  const idx = nodeIndexById(activeNodeId());
  const row = idx >= 0 ? LADDER[idx] : null;
  const nav = appState.navigation || {};
  const modeLabel = nav.focus_mode ? 'Focus' : nav.view_mode === 'compare' ? 'Compare' : 'Flipchart';
  const modeEl = el('flipchartMode');
  const titleEl = el('flipchartTitle');
  const slideEl = el('flipchartSlideIndex');
  const posEl = el('flipchartPosition');
  const regimeEl = el('flipchartRegimeTag');
  if (modeEl) modeEl.textContent = modeLabel;
  if (titleEl) titleEl.textContent = row?.short || '—';
  const slideText = row ? `Slide ${idx + 1} of ${LADDER.length}` : '—';
  if (slideEl) slideEl.textContent = slideText;
  if (posEl) posEl.textContent = row ? `${idx + 1} / ${LADDER.length}` : '—';
  if (regimeEl) {
    const domState = buildStateFromDOM();
    const gate = deriveGate(domState);
    const metrics = resolveCommandBarMetrics(domState, gate, domState.provenance || createEmptyProvenance());
    const pill = resolveFlipchartRegimePill(metrics);
    regimeEl.textContent = pill.label;
    regimeEl.classList.remove('regime-constructive', 'regime-defensive', 'regime-stressed', 'flipchart-regime-tag--unset');
    regimeEl.classList.add(pill.cls);
  }
  const prevBtn = el('btnFlipPrev');
  const nextBtn = el('btnFlipNext');
  if (prevBtn) prevBtn.disabled = idx <= 0;
  if (nextBtn) nextBtn.disabled = idx < 0 || idx >= LADDER.length - 1;
}

function renderSignalDetailTech(state) {
  const node = el('signalDetailTech');
  renderSignalDetailDocs();
  renderIngestProvenanceAudit(state);
  renderHydrationFieldLog(state);
  renderDataDictionaryAudit(state);
  if (!node) return;
  const prov = state?.provenance || createEmptyProvenance();
  if (!prov.hydratedAt && !prov.snapshotId) {
    node.textContent = 'Technical metadata appears after hydration import.';
    return;
  }
  const ingest = state?.hydration?.ingest_provenance;
  const parts = [
    prov.snapshotId ? `Snapshot: ${prov.snapshotId}` : null,
    prov.lineageHash ? `Lineage: ${prov.lineageHash}` : null,
    prov.dataAsOf ? `Data as-of: ${prov.dataAsOf}` : null,
    prov.sourceChannel ? `Source: ${prov.sourceChannel}` : null,
    ingest?.primary_output_kind ? `Output kind: ${ingest.primary_output_kind}` : null,
  ].filter(Boolean);
  node.innerHTML = parts.map(p => `<div>${escapeHtml(p)}</div>`).join('');
}

function setSignalDetailOpen(open) {
  const drawer = el('signalDetailDrawer');
  const backdrop = el('signalDetailBackdrop');
  if (!drawer || !backdrop) return;
  drawer.classList.toggle('is-open', open);
  drawer.classList.toggle('zone-hidden', !open);
  drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
  backdrop.classList.toggle('is-open', open);
  backdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
}

function setMetricTip(id, text) {
  const node = el(id);
  if (node) node.setAttribute('data-tip', text);
}

function renderMetricTips(state, gate, health, metrics) {
  const scoreNum = Number(metrics.whinfellScore);
  const scoreStr = Number.isFinite(scoreNum) ? String(scoreNum) : '—';
  const zoneText = metrics.scoreZone?.text || '—';

  let scoreMath = 'Enter score or import hydration.';
  if (Number.isFinite(scoreNum)) {
    if (scoreNum < 50) scoreMath = `Now ${scoreNum} (<50 Red): 0% new BTC prop · +${50 - scoreNum} pts to Amber floor (50).`;
    else if (scoreNum < 65) scoreMath = `Now ${scoreNum} (50–64 Amber): ~½ prop · +${65 - scoreNum} pts to Green (65+).`;
    else scoreMath = `Now ${scoreNum} (≥65 Green): full desk sizing OK · watch drop below 65 → half size.`;
  }
  setMetricTip('tipWhinfellScore',
    `Whinfell Score 0–100 — credit, rates, breadth, BTC transmission.\nNow: ${scoreStr} · ${zoneText}\nMental math: ${scoreMath}`);

  const hNum = Number(health.score);
  let txMath = 'Import hydration to compute ladder health.';
  if (Number.isFinite(hNum)) {
    const gap = TX_HEALTH_OPEN_THRESHOLD - hNum;
    txMath = gap > 0
      ? `Health ${hNum} · need +${gap} to hit open threshold (${TX_HEALTH_OPEN_THRESHOLD}) for full prop calendar.`
      : `Health ${hNum} ≥ ${TX_HEALTH_OPEN_THRESHOLD} — transmission supports full prop sizing.`;
    if (health.weakestStage) txMath += `\nWeakest link: ${health.weakestStage} (${health.label || '—'}).`;
  }
  setMetricTip('tipTransmission',
    `Transmission health 0–100 — five-node ladder (Liq→Credit→Breadth→BTC→Basis).\nNow: ${Number.isFinite(hNum) ? hNum : '—'} · ${health.label || '—'}\nMental math: ${txMath}`);

  const banner = gateStripTitle(gate);
  const sq3 = metrics.sq3Score;
  let gateMath = '';
  if (Number.isFinite(scoreNum)) {
    if (scoreNum < 50) gateMath = `Score ${scoreNum} <50 → BTC calendar BLOCKED (basis irrelevant).`;
    else if (scoreNum < 65) gateMath = `Score ${scoreNum} in 50–64 → client-only ~0.5×; prop flat.`;
    else gateMath = `Score ${scoreNum} ≥65 → BTC allowed within desk policy.`;
  } else gateMath = 'Set Whinfell Score to evaluate gate.';
  if (sq3 != null && !Number.isNaN(Number(sq3)) && Number(sq3) < 50) {
    gateMath += `\nSQ3 ${sq3} <50 → China Caution chip on every mission node.`;
  }
  setMetricTip('tipGateState',
    `Gate = BTC access rule (not auto-trade).\nNow: ${banner}\nMental math: ${gateMath}`);

  const shockKey = state.tracer?.activeShock;
  const shockDef = shockKey && SHOCKS[shockKey];
  const shockCfg = state.tracer?.shockConfig || readShockConfigFromDOM();
  let shockMath = 'No shock → use baseline horizon marks and normal sizing bands.';
  if (shockDef) {
    const prob = shockCfg?.probability ?? state.operator?.shockProbability;
    const hz = shockCfg?.horizon ?? state.operator?.shockHorizon;
    shockMath = `Active: ${shockDef.label} — compress size ~½; matrix marks override until dismiss/re-import.`;
    if (prob != null && prob !== '') shockMath += `\nTagged ${prob}% / ${hz || '—'} horizon — treat as live stress overlay.`;
  }
  setMetricTip('tipShock',
    `Shock = Signal Tracer stress scenario.\nNow: ${shockDef ? shockDef.label : 'None (baseline)'}\nMental math: ${shockMath}`);

  const freshStatus = metrics.freshnessStatus || computeFreshnessFromIso(metrics.dataAsOf).status;
  const freshLabel = metrics.freshnessLabel || freshnessLabelFromStatus(freshStatus);
  let ageLine = 'No pipeline timestamp.';
  let freshMath = 'Import hydration to read data age.';
  if (metrics.dataAsOf) {
    const ageH = Math.round(((Date.now() - new Date(metrics.dataAsOf).getTime()) / 3600000) * 10) / 10;
    ageLine = `${freshLabel} · ${ageH}h since as-of`;
    if (ageH < FRESH_HOURS) freshMath = `<${FRESH_HOURS}h → trade normal size (data trusted).`;
    else if (ageH < STALE_HOURS) freshMath = `${FRESH_HOURS}–${STALE_HOURS}h → cap size · re-export before adding risk.`;
    else freshMath = `>${STALE_HOURS}h → no new BTC risk until AM chain refresh.`;
  }
  setMetricTip('tipFreshness',
    `Freshness = pipeline bundle age (not market clock).\nNow: ${ageLine}\nMental math: ${freshMath}`);
}

function buildCommandBarKpiContext(state, gate, prov, metrics, health) {
  const freshStatus = metrics.freshnessStatus || computeFreshnessFromIso(metrics.dataAsOf).status;
  const tx = metrics.txState;
  return {
    state,
    gate,
    prov,
    metrics,
    health,
    zone: metrics.scoreZone || gate.zone,
    freshStatus,
    freshLabel: metrics.freshnessLabel || freshnessLabelFromStatus(freshStatus),
    sq3Key: metrics.sq3Score != null ? sq3BandKey(metrics.sq3Band) : 'unknown',
    gateTitle: gateStripTitle(gate),
    txLabel: tx && TX_META[tx] ? TX_META[tx].label : (tx || null),
    shockLabel: state.tracer?.activeShock && SHOCKS[state.tracer.activeShock],
    helpers: {
      freshnessChipCls,
      freshnessDotCls,
      sq3ChipCls,
    },
  };
}

function renderCommandBar(state, gate) {
  const prov = state.provenance || createEmptyProvenance();
  const metrics = resolveCommandBarMetrics(state, gate, prov);
  const health = computeHealthScore(state);
  renderMetricTips(state, gate, health, metrics);
  const zone = metrics.scoreZone || gate.zone;
  const kpiCtx = buildCommandBarKpiContext(state, gate, prov, metrics, health);
  const freshStatus = kpiCtx.freshStatus;

  const cmdBar = el('commandBar');
  if (cmdBar) {
    cmdBar.className = `shrink-0 border-b border-wtm-border bg-wtm-surface transition-all px-4 py-2 ${metrics.gateGlow || gate.glow}`;
  }

  const scoreCard = el('scoreCard');
  if (scoreCard) {
    scoreCard.classList.remove('zone-green', 'zone-red');
    if (zone.key === 'green') scoreCard.classList.add('zone-green');
    else if (zone.key === 'red') scoreCard.classList.add('zone-red');
  }

  if (typeof WTM_ScanKpiStrip !== 'undefined') {
    try { WTM_ScanKpiStrip.renderStrip(kpiCtx); } catch (e) { bootLog('warn', 'ScanKpiStrip skipped', e); }
  }

  if (typeof WTM_TransmissionRadar !== 'undefined') {
    try { WTM_TransmissionRadar.render(kpiCtx); } catch (e) { bootLog('warn', 'TransmissionRadar skipped', e); }
  }

  if (typeof WTM_CommandBarKpis !== 'undefined') {
    try { WTM_CommandBarKpis.renderAll(kpiCtx, el); } catch (e) { bootLog('warn', 'CommandBarKpis skipped', e); }
  }

  const tx = metrics.txState;
  const cmdTx = el('cmdTxState');
  if (cmdTx) cmdTx.textContent = tx && TX_META[tx] ? TX_META[tx].label : (tx || '—');
  const cmdRegime = el('cmdRegime');
  if (cmdRegime) cmdRegime.textContent = metrics.regime ? `Regime: ${metrics.regime}` : '—';

  const cmdGateSub = el('cmdGateSub');
  if (cmdGateSub) cmdGateSub.textContent = metrics.gateSub || gate.bannerSub || '—';
  try { paintGate(state, gate); } catch (e) { bootLog('warn', 'paintGate skipped', e); }

  const dot = el('cmdFreshnessDot');
  if (dot) dot.className = freshnessDotCls(freshStatus);
  const headerDot = el('headerFreshnessDot');
  if (headerDot) headerDot.className = freshnessDotCls(freshStatus);
  const headerFresh = el('headerFreshnessLabel');
  if (headerFresh) {
    const freshLabel = metrics.freshnessLabel || freshnessLabelFromStatus(freshStatus);
    headerFresh.innerHTML = `<span class="${freshnessChipCls(freshStatus)}">${escapeHtml(freshLabel)}</span>`;
  }
  const regimeLine = el('headerRegimeLine');
  const regimeSub = el('headerRegimeSub');
  const regimeCluster = el('headerRegimeCluster');
  if (regimeLine) {
    regimeLine.textContent = metrics.regime
      ? `${metrics.regime}`
      : 'Regime pending';
  }
  if (regimeSub) {
    const txLabel = metrics.txState && TX_META[metrics.txState] ? TX_META[metrics.txState].label : (metrics.txState || '—');
    const sq3 = metrics.sq3Score != null ? `SQ3 ${metrics.sq3Score}` : 'SQ3 —';
    const band = metrics.sq3Band || '—';
    const driver = resolveImpairmentDriver(state, gate);
    const driverChip = driver
      ? ` <span class="impairment-driver-chip" title="Primary impairment driver in Both view">Driver: ${escapeHtml(driver)}</span>`
      : '';
    const subText = `${txLabel} transmission · ${sq3} · ${band}${driver ? ` · Driver: ${driver}` : ''}`;
    regimeSub.innerHTML = `${escapeHtml(txLabel)} transmission · ${escapeHtml(String(sq3))} · ${escapeHtml(band)}${driverChip}`;
    regimeSub.classList.toggle('console-regime-sub--placeholder', !metrics.regime && !metrics.txState);
    if (regimeLine) regimeLine.title = subText;
    if (regimeCluster) regimeCluster.classList.toggle('console-regime-cluster--populated', Boolean(metrics.regime || metrics.txState));
  }
  const subCluster = el('cmdFreshnessSubCluster');
  if (subCluster) {
    subCluster.innerHTML = renderFreshnessSubClusterHtml(buildFreshnessSubCluster(state));
    syncFreshnessSubDisclosure(subCluster);
  }

  const badge = el('cmdHydrationBadge');
  const freshCluster = el('cmdFreshnessCluster');
  if (badge && prov.hydratedAt && metrics.source === 'pipeline') {
    badge.textContent = 'Pipeline';
    badge.className = 'text-[7px] font-bold uppercase px-1 py-0.5 rounded border cmd-authority-pipeline';
    badge.classList.remove('hidden');
    freshCluster?.classList.remove('border-wtm-accent/30', 'border-wtm-amber/30');
  } else if (badge && prov.hydratedAt && metrics.source === 'override') {
    badge.textContent = 'Override';
    badge.className = 'text-[7px] font-bold uppercase px-1 py-0.5 rounded border cmd-authority-override';
    badge.classList.remove('hidden');
    freshCluster?.classList.remove('border-wtm-accent/30');
    freshCluster?.classList.add('border-wtm-amber/30');
  } else if (badge) {
    badge.classList.add('hidden');
    freshCluster?.classList.remove('border-wtm-accent/30', 'border-wtm-amber/30');
  }

  try { renderLadderCommandClusters(state); } catch (e) { bootLog('warn', 'ladder clusters skipped', e); }
}

function renderOperatorPanel(state, gate) {
  const op = state.operator || readOperatorFromDOM();
  const confVal = el('operatorConfidenceValue');
  if (confVal) confVal.textContent = String(op.confidence);
  const suggested = suggestExecutionIntent(gate, op.confidence);
  const hint = el('executionIntentHint');
  if (hint) {
    const override = op.executionIntent !== suggested ? ` · selected: ${op.executionIntent}` : '';
    hint.textContent = `Gate suggests ${suggested}${override} · confidence ${op.confidence}`;
  }
}

function renderExecutionStatus(gate, state) {
  paintGate(state, gate);
  const execChip = gateExecChip(gate);
  const rule = gateExecRule(gate);
  const chipL2 = el('chipL2');
  const chipL3 = el('chipL3');
  const noteL2 = el('noteL2');
  const noteL3 = el('noteL3');
  if (chipL2) chipL2.textContent = execChip.label;
  if (chipL3) chipL3.textContent = execChip.label;
  if (noteL2) noteL2.textContent = rule;
  if (noteL3) noteL3.textContent = rule;
}

function applyDataDictionaryBadge(meta, validated) {
  const badge = el('ddVersionBadge');
  if (!badge || !meta) return;
  badge.textContent = `Master Data Dictionary v${meta.version} · ${meta.status} · ${meta.alignment}`;
  badge.href = deskDocHref({ path: 'whinfell_pipeline/data_dictionary.yaml' });
  badge.title = `Open Master Data Dictionary on GitHub (${meta.source || MASTER_DATA_DICTIONARY_META_URL})`;
  badge.classList.toggle('text-emerald-400', validated);
  badge.classList.toggle('border-emerald-500/30', validated);
  badge.classList.toggle('bg-emerald-500/10', validated);
  badge.classList.toggle('text-wtm-muted', !validated);
  badge.classList.toggle('border-wtm-border', !validated);
  badge.classList.toggle('bg-wtm-card', !validated);
  badge.classList.toggle('text-wtm-amber', meta && !validated);
  badge.classList.toggle('border-wtm-amber/40', meta && !validated);
  badge.classList.toggle('bg-amber-500/10', meta && !validated);
}

function getDictionaryBadgeDefault() {
  return (typeof window !== 'undefined' && window.DICTIONARY_BADGE_DEFAULT) || {};
}

function validateDataDictionaryMeta(meta) {
  const expected = getDictionaryBadgeDefault();
  if (!meta || meta.validated !== true) return false;
  if (!expected.version || !expected.status) return false;
  if (meta.version !== expected.version || meta.status !== expected.status) return false;
  if (meta.source !== expected.source) return false;
  return true;
}

function fetchDataDictionaryMeta(force) {
  const gen = ++ddMetaFetchGen;
  const url = `${MASTER_DATA_DICTIONARY_META_URL}?_=${Date.now()}`;
  return fetch(url, { cache: 'no-store' })
    .then(r => {
      if (!r.ok) throw new Error(`meta HTTP ${r.status}`);
      return r.json();
    })
    .then(data => {
      if (gen !== ddMetaFetchGen) return ddMetaCache;
      ddMetaCache = data;
      window.DICTIONARY_META = data;
      return data;
    })
    .catch(err => {
      console.warn('[WTM] Master Data Dictionary meta fetch failed', err);
      return null;
    });
}

function renderDataDictionaryBadge(forceRefresh) {
  const badge = el('ddVersionBadge');
  if (!badge) return;
  const badgeDefault = getDictionaryBadgeDefault();
  if (!DD_META_POLLING_ENABLED || SAFE_BOOT) {
    if (badgeDefault.version && badgeDefault.status && badgeDefault.alignment) {
      applyDataDictionaryBadge(
        { ...badgeDefault, source: badgeDefault.source || MASTER_DATA_DICTIONARY_META_URL },
        false,
      );
    } else if (ddMetaCache) {
      applyDataDictionaryBadge(ddMetaCache, validateDataDictionaryMeta(ddMetaCache));
    } else {
      badge.textContent = 'Dictionary meta static';
      badge.title = `Dictionary badge — meta polling disabled (${MASTER_DATA_DICTIONARY_META_URL})`;
    }
    return;
  }
  if (!ddMetaCache || forceRefresh) {
    badge.textContent = badgeDefault.loadingLabel || 'Loading dictionary…';
  }
  fetchDataDictionaryMeta(forceRefresh).then(meta => {
    if (!meta) {
      const fb = badgeDefault;
      if (fb.version && fb.status && fb.alignment) {
        applyDataDictionaryBadge({ ...fb, source: fb.source || MASTER_DATA_DICTIONARY_META_URL }, false);
      } else {
        badge.textContent = 'Dictionary meta unavailable';
        badge.title = `Failed to load ${MASTER_DATA_DICTIONARY_META_URL}`;
      }
      return;
    }
    const ok = validateDataDictionaryMeta(meta);
    if (!ok) console.warn('[WTM] Master Data Dictionary meta validation failed', meta, badgeDefault);
    applyDataDictionaryBadge(meta, ok);
  });
}

function bandDotClass(bandKey) {
  const k = String(bandKey || 'unknown').toLowerCase();
  if (k === 'supportive') return 'band-dot-supportive';
  if (k === 'mixed') return 'band-dot-mixed';
  if (k === 'fragile') return 'band-dot-fragile';
  if (k === 'blocked') return 'band-dot-blocked';
  return 'band-dot-unknown';
}

function richnessClass(label) {
  const k = String(label || '').toLowerCase();
  if (k === 'extreme') return 'richness-extreme';
  if (k === 'rich') return 'richness-rich';
  if (k === 'fair') return 'richness-fair';
  if (k === 'cheap') return 'richness-cheap';
  return '';
}

function horizonNetToScore(net) {
  const n = Number(net) || 0;
  return Math.max(0, Math.min(100, Math.round(50 + n * 12.5)));
}

function horizonNetToBandKey(net) {
  const score = horizonNetToScore(net);
  if (score >= 65) return 'supportive';
  if (score >= 50) return 'mixed';
  if (score >= 35) return 'fragile';
  return 'blocked';
}

function horizonNetToBandLabel(bandKey) {
  return { supportive: 'Supportive', mixed: 'Mixed', fragile: 'Fragile', blocked: 'Blocked' }[bandKey] || 'Mixed';
}

function deriveStubNodeCockpit(nodeId, state) {
  const row = LADDER.find(r => r.id === nodeId) || LADDER[0];
  const marks = state.tracer?.horizons?.[nodeId] || { d1: '', d5: '', d20: '', d60: '' };
  const net = HORIZONS.reduce((s, h) => s + (HORIZON_SCORE[marks[h] || ''] || 0), 0);
  const bandKey = horizonNetToBandKey(net);
  const health = computeHealthScore(state);
  const gate = deriveGate(state);
  return {
    node_id: nodeId,
    display_name: row.name,
    composite_score: horizonNetToScore(net),
    composite_score_source: 'horizon_net_fallback',
    band: horizonNetToBandLabel(bandKey),
    band_key: bandKey,
    freshness_status: state.provenance?.freshnessStatus || 'unknown',
    as_of: state.provenance?.dataAsOf || new Date().toISOString(),
    horizon_marks: marks,
    horizon_net: net,
    is_weakest_link: health.weakestStage === row.name,
    key_observation: `${row.short} — no pipeline hydration; tracer horizon fallback only.`,
    confidence: 'low',
    gate_interaction: {
      zone: gate.zone?.key || 'amber',
      blocks_directional: gate.blocked,
      blocks_rv: gate.blocked,
      note: gate.rule || '',
    },
    component_inputs: [],
    directional: {
      posture: gate.blocked ? 'no_trade' : 'neutral',
      conviction: 'low',
      rationale: 'Directional read requires hydration import — not inferred from tracer alone.',
      blocked: !!gate.blocked,
      block_reason: gate.blocked ? gate.rule : '',
    },
    relative_value: {
      posture: 'neutral',
      structure: row.sub,
      conviction: 'low',
      rationale: 'Relative value panel unavailable until hydration bundle is imported.',
      blocked: false,
      block_reason: '',
    },
    implementations: [],
    rv_basis: {
      active_horizon: appState.chart?.shared_horizon || '3m',
      active_series_id: null,
      richness_label: null,
      quartile_context: 'RV quartiles require hydration — history not loaded.',
      series: {},
      _fallback_mode: true,
    },
    funds_flows: {
      enabled: false,
      flows_meta: { flows_status: 'unavailable', flows_degraded: true, fallback_reason: 'missing_wtm_flows_file' },
      interpretation: { degrade_notice: 'Flows unavailable — degraded, not neutral.' },
    },
  };
}

function getHydratedNodeCockpit(nodeId) {
  const cockpits = appState.hydration?.node_cockpits;
  if (cockpits && cockpits[nodeId]) return cockpits[nodeId];
  return null;
}

function mergeNodeCockpit(nodeId, state) {
  const base = getHydratedNodeCockpit(nodeId) || deriveStubNodeCockpit(nodeId, state);
  const overrides = appState.node_cockpit_overrides?.[nodeId] || {};
  const merged = JSON.parse(JSON.stringify(base));
  if (overrides.selected_implementation_id != null) merged.selected_implementation_id = overrides.selected_implementation_id;
  if (overrides.sizing) merged.sizing = { ...(merged.sizing || {}), ...overrides.sizing };
  if (overrides.rv_basis) {
    merged.rv_basis = { ...(merged.rv_basis || {}), ...overrides.rv_basis };
  }
  if (overrides.directional?.rationale) {
    merged.directional = { ...(merged.directional || {}), rationale: overrides.directional.rationale };
  }
  if (overrides.relative_value?.rationale) {
    merged.relative_value = { ...(merged.relative_value || {}), rationale: overrides.relative_value.rationale };
  }
  return merged;
}

function activeNodeId() {
  return appState.navigation?.active_node_id || LADDER[0].id;
}

function nodeIndexById(nodeId) {
  return LADDER.findIndex(r => r.id === nodeId);
}

function flipNode(direction) {
  const idx = nodeIndexById(activeNodeId());
  if (idx < 0) return;
  const next = direction < 0 ? Math.max(0, idx - 1) : Math.min(LADDER.length - 1, idx + 1);
  if (next === idx) return;
  const target = LADDER[next];
  jumpToNode(target.id);
  showToast(`Flipchart → ${target.short} (${next + 1}/${LADDER.length})`);
}

function setActiveNode(nodeId) {
  jumpToNode(nodeId);
}

function jumpToNode(nodeId) {
  if (!LADDER.some(r => r.id === nodeId)) return;
  appState.navigation = appState.navigation || createEmptyNavigation();
  appState.navigation._user_picked_node = true;
  const detailBand = el('cockpitDetailBand');
  if (detailBand) {
    appState.panel = appState.panel || createEmptyPanelState();
    appState.panel.scroll_positions[activeNodeId()] = detailBand.scrollTop;
  }
  appState.navigation.active_node_id = nodeId;
  if (appState.navigation.focus_mode) appState.navigation.focus_node_id = nodeId;
  renderNodeCockpitShell(buildStateFromDOM());
  renderFlipchartState();
  markDirty();
}

function setSharedHorizon(horizon) {
  if (!RV_HORIZONS.includes(horizon)) return;
  const chartCanvas = el('cockpitChartCanvas');
  if (chartCanvas && activeNodeId() === 'basis') {
    chartCanvas.classList.add('chart-horizon-transition');
    setTimeout(() => chartCanvas.classList.remove('chart-horizon-transition'), 220);
  }
  appState.chart = appState.chart || createEmptyChartState();
  appState.chart.shared_horizon = horizon;
  const nodeId = activeNodeId();
  appState.node_cockpit_overrides = appState.node_cockpit_overrides || {};
  appState.node_cockpit_overrides[nodeId] = {
    ...(appState.node_cockpit_overrides[nodeId] || {}),
    rv_basis: {
      ...((appState.node_cockpit_overrides[nodeId] || {}).rv_basis || {}),
      active_horizon: horizon,
    },
  };
  renderNodeCockpitShell(buildStateFromDOM());
  markDirty();
}

const PRESENTATIONAL_LABELS = {
  short_spread: 'Short spread',
  long_spread: 'Long spread',
  neutral: 'Neutral',
  no_trade: 'No trade',
  size_hint: 'Size cap',
  higher_is_richer: 'Higher values = richer',
  higher_is_cheaper: 'Higher values = cheaper',
  half: '0.5×',
  quarter: '0.25×',
  fragile: 'Fragile',
  supportive: 'Supportive',
  blocked: 'Blocked',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const BASIS_MISSING_MESSAGES = {
  nearDeferredVsRefs: 'Near-deferred level vs refs unavailable — reference history missing; affects conviction, not eligibility.',
  direction5d20d: '5D/20D spread direction unavailable — short-horizon trend check missing; affects confirmation only.',
  rollContango: 'Roll / contango stability unavailable — term-structure continuity check missing; affects sizing confidence.',
  refBand: 'Spread vs ref band unavailable — ref low/mid/high bundle missing; affects conviction, not gate status.',
  etfVsFutures: 'ETF vs futures consistency unavailable — cross-market confirmation missing; affects confirmation only.',
};

const BASIS_COMPONENT_MATCHERS = [
  { key: 'nearDeferredVsRefs', re: /near-deferred calendar level/i },
  { key: 'direction5d20d', re: /5D\+20D direction|calendar spread 5D/i },
  { key: 'rollContango', re: /Roll \/ contango|contango stability/i },
  { key: 'refBand', re: /ref_low|ref band|Spread vs ref/i },
  { key: 'etfVsFutures', re: /ETF vs futures/i },
];

function humanizeValue(value) {
  if (value == null || value === '') return '—';
  const key = String(value).toLowerCase();
  if (PRESENTATIONAL_LABELS[key]) return PRESENTATIONAL_LABELS[key];
  return String(value).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function ordinalSuffixWhole(n) {
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod10 === 1 && mod100 !== 11) return 'st';
  if (mod10 === 2 && mod100 !== 12) return 'nd';
  if (mod10 === 3 && mod100 !== 13) return 'rd';
  return 'th';
}

function formatPercentile(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 'Percentile unavailable';
  const rounded = Math.round(n * 10) / 10;
  if (!Number.isInteger(rounded)) return `${rounded.toFixed(1)}th percentile`;

  const mod10 = rounded % 10;
  const mod100 = rounded % 100;
  if (mod10 === 1 && mod100 !== 11) return `${rounded}st percentile`;
  if (mod10 === 2 && mod100 !== 12) return `${rounded}nd percentile`;
  if (mod10 === 3 && mod100 !== 13) return `${rounded}rd percentile`;
  return `${rounded}th percentile`;
}

function formatOrdinalPercentile(pct) {
  const n = Number(pct);
  if (!Number.isFinite(n)) return '—';
  return formatPercentile(n);
}

function basisRefsAvailable(refs) {
  return refs && [refs.low, refs.mid, refs.high].every(v => Number.isFinite(v));
}

function getBasisDomain(vals, padRatio = 0.08) {
  const series = (vals || []).filter(v => Number.isFinite(v));
  if (!series.length) return [0, 1];
  const min = Math.min(...series);
  const max = Math.max(...series);
  const center = (min + max) / 2;
  const dataSpan = max - min;
  const minSpan = Math.max(0.20, Math.abs(center) * 0.15, dataSpan || 0.20);
  const span = Math.max(dataSpan, minSpan);
  const pad = span * padRatio;
  let yMin = center - span / 2 - pad;
  let yMax = center + span / 2 + pad;
  if (min <= 0 && max >= 0) {
    yMin = Math.min(yMin, -pad * 0.5);
    yMax = Math.max(yMax, pad * 0.5);
  }
  return [yMin, yMax];
}

function parseBasisRef(value) {
  if (value == null || value === '') return null;
  const n = parseFloat(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function resolveBasisRefLines(state) {
  const l3 = state?.btcL3 || appState?.btcL3 || {};
  return {
    low: parseBasisRef(l3.refLow),
    mid: parseBasisRef(l3.refMid),
    high: parseBasisRef(l3.refHigh),
  };
}

function richnessPillClass(label) {
  const k = String(label || '').toLowerCase();
  if (k === 'rich') return 'basis-pill--rich';
  if (k === 'cheap') return 'basis-pill--cheap';
  return 'basis-pill--fair';
}

function richnessPillLabel(label) {
  const k = String(label || '').toLowerCase();
  if (k === 'rich') return 'Rich vs history';
  if (k === 'cheap') return 'Cheap vs history';
  if (k === 'fair') return 'Fair vs history';
  return humanizeValue(label);
}

function resolveSizeCapLabel(cockpit, gate, health) {
  if (gate?.blocked) return 'Blocked — no new risk';
  if (gate?.tight || (health && health.score < TX_HEALTH_OPEN_THRESHOLD)) return 'Tight Risk cap: 0.5×';
  const hint = cockpit?.directional?.size_hint;
  if (hint === 'half') return 'Size cap: 0.5×';
  if (hint === 'quarter') return 'Size cap: 0.25×';
  return 'Size: desk policy';
}

function formatReadingValue(hz) {
  if (!hz || hz.current_value == null) return '—';
  return formatChartValue(hz.current_value, hz.unit);
}

function formatChartValue(val, unit) {
  const n = Number(val);
  if (!Number.isFinite(n)) return String(val ?? '—');
  const u = String(unit || '').toLowerCase();
  if (u === 'pct' || u === '%') return `${n.toFixed(1)}%`;
  if (u === 'usd' || u === '$' || u === 'dollars') {
    return n >= 1000
      ? `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
      : `$${n.toFixed(0)}`;
  }
  if (u === 'bps' || u === 'bp') return `${n.toFixed(1)} bps`;
  if (Math.abs(n) >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return `${n.toFixed(2)}${unit ? ` ${unit}` : ''}`;
}

function getChartTheme() {
  const themeId = document.documentElement.getAttribute('data-theme') || 'dark';
  const lightish = themeId === 'light' || themeId === 'nature';
  const accent = (typeof WTM_Theme !== 'undefined' && WTM_Theme.getAccent)
    ? WTM_Theme.getAccent()
    : (themeId === 'nature' ? '#1E6B2B' : '#228B22');
  let grid;
  let muted;
  let axisText;
  let label;
  try {
    const s = getComputedStyle(document.documentElement);
    grid = s.getPropertyValue('--wtm-chart-grid').trim();
    muted = s.getPropertyValue('--wtm-muted').trim();
    axisText = s.getPropertyValue('--wtm-chart-axis').trim() || muted;
    label = s.getPropertyValue('--wtm-text').trim();
  } catch (_) {
    /* ignore */
  }
  return {
    grid: grid || (lightish ? 'rgba(31,41,55,0.07)' : 'rgba(255,255,255,0.07)'),
    axisText: axisText || (lightish ? '#1F2937' : '#c5d0dc'),
    label: label || (lightish ? '#1F2937' : '#e8edf3'),
    muted: muted || (lightish ? 'rgba(31,41,55,0.6)' : '#9eacbb'),
    barHi: lightish ? 'rgba(200,80,60,0.88)' : 'rgba(255,140,105,0.92)',
    barLo: lightish ? 'rgba(40,140,80,0.88)' : 'rgba(79,179,122,0.92)',
    barMid: lightish ? 'rgba(34,139,34,0.75)' : 'rgba(34,139,34,0.72)',
    zeroLine: lightish ? 'rgba(31,41,55,0.2)' : 'rgba(255,255,255,0.22)',
    activeBand: lightish ? 'rgba(34,139,34,0.12)' : 'rgba(34,139,34,0.14)',
    line: accent,
  };
}

function syncHeaderSourceLinks(state) {
  const koyfin = (state?.urls?.koyfin || DEFAULTS.urls.koyfin || '').trim();
  const barchart = (state?.urls?.barchart || DEFAULTS.urls.barchart || '').trim();
  const kLink = el('headerLinkKoyfin');
  const bLink = el('headerLinkBarchart');
  if (kLink && koyfin) kLink.href = koyfin;
  if (bLink && barchart) bLink.href = barchart;
}

let cockpitChartResizeObs = null;
function initCockpitChartResize() {
  const host = el('cockpitChartCanvas');
  if (!host || cockpitChartResizeObs || typeof ResizeObserver === 'undefined') return;
  cockpitChartResizeObs = new ResizeObserver(() => {
    if (appState.ui?.workspaceView !== 'cockpit' || appState.navigation?.focus_mode || appState.navigation?.view_mode === 'compare') return;
    const state = buildStateFromDOM();
    const cockpit = mergeNodeCockpit(activeNodeId(), state);
    drawRvBasisChart(cockpit, el('cockpitRvCanvas'), state, deriveGate(state));
  });
  cockpitChartResizeObs.observe(host);
}

function renderCockpitRvTable(cockpit, series) {
  const wrap = el('cockpitRvTableWrap');
  if (!wrap) return;
  const evidence = buildRvHorizonEvidenceMarkup(cockpit, series);
  wrap.innerHTML = `<table class="${evidence.tableClass}"><thead><tr><th>Horizon</th><th>Value</th><th>Percentile</th><th>Quartile</th><th>Richness</th></tr></thead><tbody>${evidence.rows}</tbody></table>${evidence.note || ''}`;
}

function renderDiagnosticBlock(title, chipClass, chipLabel, interpretation, implication) {
  return `<div class="cockpit-card diag-block">
    <h4>${escapeHtml(title)}</h4>
    <span class="diag-chip ${chipClass}">${escapeHtml(chipLabel)}</span>
    <p class="diag-interpretation">${escapeHtml(interpretation)}</p>
    <p class="diag-implication">${escapeHtml(implication)}</p>
  </div>`;
}

function matchBasisDiagnosticKey(label) {
  const text = String(label || '');
  const hit = BASIS_COMPONENT_MATCHERS.find(m => m.re.test(text));
  return hit ? hit.key : null;
}

const DIAG_FAILURE_CODES = {
  missing_source: { code: 'DD-MISS', label: 'Missing source file' },
  field_unmapped: { code: 'DD-UNMAP', label: 'Field unmapped' },
  transform_failed: { code: 'DD-XFORM', label: 'Transform failed' },
  sample_insufficient: { code: 'DD-SAMPLE', label: 'Sample insufficient' },
  data_stale: { code: 'DD-STALE', label: 'Data stale' },
  gate_suppressed: { code: 'DD-GATE', label: 'Gate suppressed' },
  derived_unavailable: { code: 'DD-DERIV', label: 'Derived signal unavailable' },
};

const DD_AUDIT_REMEDIATION = {
  missing_source: 'Stage required CSV in whinfell_drop → bash scripts/normalize_whinfell_drop.sh → bash whinfell_daily_am.sh',
  field_unmapped: 'Verify mapping in data_dictionary.yaml (header Docs → Master data dictionary) · re-export Koyfin/Barchart watchlist with required columns',
  transform_failed: 'Check staged_raw/quarantine logs · run retry_quarantine_normalize on failed files',
  sample_insufficient: 'Export wider Koyfin time-series (rates/equities) · confirm rv_history has ≥3 horizons',
  data_stale: 'Re-export WTM-Flows-Global.csv · confirm flows_sidecar.as_of matches today in latest.json',
  derived_unavailable: 'Rehydrate node derived stack · verify component_inputs populate from rv_history not horizon_fallback',
  gate_suppressed: 'Review SQ3 / gate inputs — signal suppressed by policy layer',
};

function classifyComponentFailure(component) {
  const val = String(component?.value || '').toLowerCase();
  if (val === 'unavailable') {
    if (component?.source === 'horizon_fallback') return 'derived_unavailable';
    if (component?.source === 'rv_history') return 'transform_failed';
    return 'field_unmapped';
  }
  if (component?.source === 'horizon_fallback') return 'sample_insufficient';
  return null;
}

function renderMissingDiagnostic(message, failureKey = 'derived_unavailable') {
  const fc = DIAG_FAILURE_CODES[failureKey] || DIAG_FAILURE_CODES.derived_unavailable;
  return `<div class="diag-row diag-row--muted" data-failure-code="${fc.code}" data-agent-failure="${failureKey}">
    <span class="diag-status status-chip status-chip--impaired">${fc.code}</span>
    <span class="diag-text"><strong>${escapeHtml(fc.label)}</strong> — ${escapeHtml(message)}</span>
  </div>`;
}

const MISSION_SURFACE_NODES = new Set(['basis', 'credit', 'liquidity', 'breadth', 'highbeta']);

const MISSION_NODE_CONFIG = {
  basis: {
    eyebrow: 'Basis mission read',
    defaultSeriesLabel: 'Basis',
    blockedPhrase: 'new basis risk is blocked under current gate.',
  },
  credit: {
    eyebrow: 'Credit mission read',
    defaultSeriesLabel: 'HY OAS proxy',
    blockedPhrase: 'new credit RV is blocked under current gate.',
  },
  liquidity: {
    eyebrow: 'Liquidity mission read',
    defaultSeriesLabel: 'US 2s10s spread',
    blockedPhrase: 'new curve RV is blocked under current gate.',
  },
  breadth: {
    eyebrow: 'Breadth mission read',
    defaultSeriesLabel: 'IWM / SPY participation',
    blockedPhrase: 'new breadth RV is blocked under current gate.',
  },
  highbeta: {
    eyebrow: 'High-beta mission read',
    defaultSeriesLabel: 'IBIT vs QQQ beta spread',
    blockedPhrase: 'new BTC beta RV is blocked under current gate.',
  },
};

function isMissionSurfaceNode(nodeId) {
  return MISSION_SURFACE_NODES.has(nodeId);
}

function missionNodeConfig(nodeId) {
  return MISSION_NODE_CONFIG[nodeId] || null;
}

function isHorizonNetFallback(cockpit) {
  return !!cockpit && cockpit.composite_score_source === 'horizon_net_fallback';
}

function resolveRvHorizonValueFallback(cockpit, series) {
  if (!series?.horizons) return { mode: 'none' };

  const available = RV_HORIZONS.filter(h => series.horizons[h]);
  if (!available.length) return { mode: 'none' };

  const values = available
    .map(h => Number(series.horizons[h].current_value))
    .filter(Number.isFinite);
  if (!values.length) return { mode: 'none' };

  const isNetFallback = isHorizonNetFallback(cockpit);
  const allSame = values.length > 1 && values.every(v => v === values[0]);
  if (allSame) {
    const activeHorizon = cockpit.rv_basis?.active_horizon || appState.chart?.shared_horizon || '3m';
    const primaryHorizon = available.includes(activeHorizon) ? activeHorizon : available[0];
    const primaryHz = series.horizons[primaryHorizon];
    return {
      mode: 'spot',
      primaryHorizon,
      spotValue: values[0],
      unit: primaryHz?.unit || '',
      isNetFallback,
    };
  }

  if (available.length < RV_HORIZONS.length) {
    return { mode: 'limited', availableHorizons: available, isNetFallback };
  }

  if (isNetFallback) return { mode: 'net_fallback_only', isNetFallback: true };
  return { mode: 'none' };
}

function buildRvHorizonEvidenceMarkup(cockpit, series) {
  if (!series) {
    return {
      tableClass: 'focus-horizon-table',
      rows: '<tr><td colspan="5">No horizon data</td></tr>',
      note: '',
    };
  }

  const fallback = resolveRvHorizonValueFallback(cockpit, series);
  const rows = RV_HORIZONS.map(h => {
    const hz = series.horizons?.[h];
    if (!hz) {
      return `<tr class="rv-horizon-row--na"><td>${RV_HORIZON_LABELS[h]}</td><td class="rv-horizon-na">N/A</td><td class="rv-horizon-na">—</td><td class="rv-horizon-na">—</td><td class="rv-horizon-na">—</td></tr>`;
    }

    let valueCell;
    if (fallback.mode === 'spot') {
      valueCell = h === fallback.primaryHorizon
        ? formatChartValue(hz.current_value, hz.unit)
        : '<span class="rv-horizon-na" title="Single spot reading — applies to all lookbacks">—</span>';
    } else {
      valueCell = formatChartValue(hz.current_value, hz.unit);
    }

    const rowCls = fallback.mode === 'spot' && h !== fallback.primaryHorizon ? ' class="rv-horizon-row--spot"' : '';
    return `<tr${rowCls}><td>${RV_HORIZON_LABELS[h]}</td><td>${valueCell}</td><td>${hz.percentile}</td><td>Q${hz.quartile}</td><td class="${richnessClass(hz.richness_label)}">${hz.richness_label}</td></tr>`;
  }).join('');

  let note = '';
  if (fallback.mode === 'spot') {
    const hzLabel = RV_HORIZON_LABELS[fallback.primaryHorizon] || fallback.primaryHorizon;
    note = `<p class="focus-horizon-note">Single spot reading on ${hzLabel} — percentile and quartile vary by lookback.${fallback.isNetFallback ? ' Composite score uses horizon-net fallback.' : ''}</p>`;
  } else if (fallback.mode === 'limited') {
    note = `<p class="focus-horizon-note">Limited horizon coverage — missing lookbacks shown as N/A.${fallback.isNetFallback ? ' Composite score uses horizon-net fallback.' : ''}</p>`;
  } else if (fallback.isNetFallback) {
    note = '<p class="focus-horizon-note">Composite score uses horizon-net fallback.</p>';
  }

  const tableClass = fallback.mode === 'spot'
    ? 'focus-horizon-table focus-horizon-table--spot-fallback'
    : 'focus-horizon-table';

  return { tableClass, rows, note, fallback };
}

function resolveMissionGateChipLabel(gate) {
  if (gate?.blocked) return 'Blocked';
  return humanizeValue(gate?.displayLabel || gate?.label || 'Open');
}

function missionReadShortLead(fullLead) {
  if (!fullLead || fullLead === '—') return '—';
  const idx = fullLead.indexOf(';');
  return idx > 0 ? fullLead.slice(0, idx).trim() : fullLead;
}

function syncMetaDisclosure(metaEl) {
  if (!metaEl?.closest) return;
  const disclosure = metaEl.closest('.cmd-meta-disclosure');
  if (!disclosure?.classList) return;
  const text = (metaEl.textContent || '').trim();
  disclosure.classList.toggle('cmd-meta-disclosure--empty', !text || text === '—');
}

function syncFreshnessSubDisclosure(clusterEl) {
  if (!clusterEl?.closest) return;
  const disclosure = clusterEl.closest('.cmd-freshness-disclosure');
  if (!disclosure?.classList) return;
  const text = (clusterEl.textContent || '').trim();
  disclosure.classList.toggle('cmd-freshness-disclosure--empty', !text);
}

function buildMissionTacticalLead(cockpit, hz, series, gate, health) {
  const config = missionNodeConfig(cockpit.node_id) || MISSION_NODE_CONFIG.basis;
  const seriesLabel = series?.label || config.defaultSeriesLabel;
  const stance = hz?.richness_label || cockpit.rv_basis?.richness_label;
  const richnessText = richnessPillLabel(stance).toLowerCase();
  const rv = cockpit.relative_value || {};

  if (gate?.blocked || rv.blocked) {
    return `${seriesLabel} is ${richnessText}; ${config.blockedPhrase}`;
  }

  const expression = rv.posture ? humanizeValue(rv.posture).toLowerCase() : 'expression';
  const capped = gate?.tight || (health && health.score < TX_HEALTH_OPEN_THRESHOLD);
  if (capped) {
    return `${seriesLabel} is ${richnessText}; ${expression} is allowed, but only at 0.5× under Tight Risk.`;
  }
  return `${seriesLabel} is ${richnessText}; ${expression} is eligible within desk policy.`;
}

function buildMissionChinaSuffix(cockpit, state, gate) {
  if (!isMissionSurfaceNode(cockpit.node_id) || !gate?.sq3Result) return '';
  if (!(gate.chinaCaution || gate.sq3Score < 50)) return '';
  const sq3Band = String(gate.sq3Band || gate.sq3Result?.interpretationBand || '').toLowerCase();
  if (sq3Band.includes('impaired') || sq3Band.includes('fragile') || sq3Band.includes('mixed')) {
    return `· SQ3 ${gate.sq3Score} constraint`;
  }
  const china = computeChinaLadderRead(state);
  if (china.finalScore != null && String(china.band || '').toLowerCase().includes('impaired')) {
    return `· China ladder ${china.finalScore} constraint`;
  }
  return '';
}

function buildMissionTacticalSentence(cockpit, hz, series, gate, health) {
  return buildMissionTacticalLead(cockpit, hz, series, gate, health);
}

function buildBasisTacticalSentence(cockpit, hz, series, gate, health) {
  return buildMissionTacticalLead(cockpit, hz, series, gate, health);
}

function renderMissionTacticalBanner(cockpit, hz, series, state, gate) {
  const banner = el('basisTacticalBanner');
  const leadEl = el('basisTacticalLead');
  const sentence = el('basisTacticalSentence');
  const suffixEl = el('basisTacticalSuffix');
  const disclosure = el('basisTacticalDisclosure');
  const eyebrow = banner?.querySelector('.basis-tactical-eyebrow');
  const config = missionNodeConfig(cockpit.node_id);
  if (!banner || !sentence) return;

  if (!isMissionSurfaceNode(cockpit.node_id) || !hz || !config) {
    banner.classList.add('zone-hidden');
    if (suffixEl) suffixEl.classList.add('zone-hidden');
    return;
  }

  const health = computeHealthScore(state);
  const fullLead = buildMissionTacticalLead(cockpit, hz, series, gate, health);
  if (eyebrow) eyebrow.textContent = config.eyebrow;
  if (leadEl) leadEl.textContent = missionReadShortLead(fullLead);
  sentence.textContent = fullLead;
  const suffix = buildMissionChinaSuffix(cockpit, state, gate);
  if (suffixEl) {
    if (suffix) {
      suffixEl.textContent = suffix;
      suffixEl.classList.remove('zone-hidden');
    } else {
      suffixEl.textContent = '';
      suffixEl.classList.add('zone-hidden');
    }
  }
  if (disclosure?.removeAttribute) disclosure.removeAttribute('open');
  banner.classList.remove('zone-hidden');
  banner.classList.toggle('basis-tactical-banner--blocked', !!(gate?.blocked || cockpit.relative_value?.blocked));
  banner.classList.toggle('basis-tactical-banner--tight', !!(gate?.tight && !gate?.blocked));
}

function renderBasisTacticalBanner(cockpit, hz, series, state, gate) {
  renderMissionTacticalBanner(cockpit, hz, series, state, gate);
}

function buildMissionImplicationChips(cockpit, gate) {
  const ff = cockpit.funds_flows || {};
  const ffStatus = ff.flows_meta?.flows_status || 'unavailable';
  const chips = [];

  if (isHorizonNetFallback(cockpit)) {
    chips.push({ label: 'Composite fallback', cls: 'impl-chip--warn' });
  } else {
    chips.push({ label: humanizeValue(cockpit.band || '—'), cls: 'impl-chip--signal' });
  }

  chips.push({ label: humanizeValue(cockpit.relative_value?.posture || '—'), cls: 'impl-chip--rv' });

  let flowsChip = 'Flows unavailable';
  if (ffStatus === 'ok' || ffStatus === 'partial' || ffStatus === 'fallback_1d') {
    const verdict = ff.aggregate?.verdict || 'mixed';
    flowsChip = verdict === 'mixed' || verdict === 'neutral' ? 'Flows neutral' : humanizeValue(verdict);
  }
  chips.push({ label: flowsChip, cls: 'impl-chip--flows' });
  chips.push({
    label: resolveMissionGateChipLabel(gate),
    cls: gate.blocked ? 'impl-chip--block' : gate.tight ? 'impl-chip--warn' : 'impl-chip--ok',
  });

  if (cockpit.is_weakest_link) {
    chips.push({ label: 'Weakest link', cls: 'impl-chip--warn' });
  }

  return chips;
}

function renderMissionImplicationRail(cockpit, state, gate) {
  const ff = cockpit.funds_flows || {};
  const ffStatus = ff.flows_meta?.flows_status || 'unavailable';
  const blocks = buildSignalDiagnostics(cockpit, state, gate);
  const showFlowsDetail = ffStatus === 'ok' || ffStatus === 'partial';
  const chips = buildMissionImplicationChips(cockpit, gate);

  return `
    <div class="basis-implication-rail">
      <p class="implication-rail-label">Implications</p>
      <div class="implication-chip-row">
        ${chips.map(c => `<span class="impl-chip ${c.cls}">${escapeHtml(c.label)}</span>`).join('')}
      </div>
      <details class="basis-diagnostics-disclosure">
        <summary>Full diagnostics</summary>
        <div class="basis-diagnostics-stack">
          ${blocks.signal}
          ${blocks.directional}
          ${blocks.relativeValue}
          ${blocks.flows}
          ${showFlowsDetail ? renderFundsFlowSponsorshipCard(cockpit, { variant: 'rail' }) : ''}
          ${blocks.gate}
        </div>
      </details>
    </div>`;
}

function renderBasisImplicationRail(cockpit, state, gate) {
  return renderMissionImplicationRail(cockpit, state, gate);
}

function buildBasisInterpretLine(hz, cockpit) {
  if (!hz) return cockpit.rv_basis?.quartile_context || 'Awaiting history';
  const stance = hz.richness_label || cockpit.rv_basis?.richness_label;
  const parts = [
    richnessPillLabel(stance),
    `Q${hz.quartile || '—'}`,
    formatPercentile(Number(hz.percentile)),
    `n=${hz.n_observations ?? '—'}`,
  ];
  return parts.join(' · ');
}

function buildBasisChartDiagnosis(cockpit, state, gate) {
  return buildMissionChartDiagnosis(cockpit, state, gate);
}

function buildMissionChartDiagnosis(cockpit, state, gate) {
  const ff = cockpit.funds_flows || {};
  const ffMeta = ff.flows_meta || {};
  const rv = cockpit.relative_value || {};
  const tags = [];

  if (cockpit.node_id === 'basis') {
    const signal = String(cockpit.band || cockpit.band_key || '').trim();
    if (signal) tags.push(humanizeValue(signal).toUpperCase());
  } else if (cockpit.rv_basis?.richness_label) {
    tags.push(richnessPillLabel(cockpit.rv_basis.richness_label).split(' ')[0].toUpperCase());
  }

  if (rv.posture) tags.push(humanizeValue(rv.posture).toUpperCase());

  const flowsStatus = ffMeta.flows_status || 'unavailable';
  if (flowsStatus === 'ok' || flowsStatus === 'partial' || flowsStatus === 'fallback_1d') {
    const verdict = ff.aggregate?.verdict || 'mixed';
    if (verdict === 'mixed' || verdict === 'neutral') tags.push('FLOWS NEUTRAL');
    else if (verdict === 'supportive') tags.push('FLOWS SUPPORTIVE');
    else if (verdict === 'diverging') tags.push('FLOWS DIVERGING');
  }

  if (gate?.blocked) tags.push('BLOCKED');
  else if (gate?.tight) tags.push('TIGHT RISK');

  return tags.slice(0, 4);
}

function renderMissionSummaryRows(cockpit, hz, series, state, gate) {
  const health = computeHealthScore(state);
  const config = missionNodeConfig(cockpit.node_id);
  const label = series?.label || config?.defaultSeriesLabel || 'Current reading';
  const rv = cockpit.relative_value || {};
  const expression = rv.posture ? humanizeValue(rv.posture) : '—';
  const strip = el('basisSummaryStrip');

  el('basisReadingValue').textContent = formatReadingValue(hz);
  el('basisReadingLabel').textContent = label;

  const stanceRow = el('basisStanceRow');
  if (stanceRow) stanceRow.textContent = buildBasisInterpretLine(hz, cockpit);

  const tradeRow = el('basisTradeRow');
  if (tradeRow) {
    tradeRow.innerHTML = `
      <span class="basis-expression">Preferred expression: ${escapeHtml(expression)}</span>
      <span class="basis-riskcap">${escapeHtml(resolveSizeCapLabel(cockpit, gate, health))}</span>`;
  }

  if (strip) {
    if (isMissionSurfaceNode(cockpit.node_id) && hz) strip.classList.remove('zone-hidden');
    else strip.classList.add('zone-hidden');
  }
}

function renderBasisSummaryRows(cockpit, hz, series, state, gate) {
  renderMissionSummaryRows(cockpit, hz, series, state, gate);
}

function buildSignalDiagnostics(cockpit, state, gate) {
  const health = computeHealthScore(state);
  const dir = cockpit.directional || {};
  const rv = cockpit.relative_value || {};
  const ff = cockpit.funds_flows || {};
  const ffMeta = ff.flows_meta || {};
  const gateNote = cockpit.gate_interaction?.note || '';
  const gateSentence = buildNodeGateDecisionSentence(cockpit, state, gate);

  let signalChip = humanizeValue(cockpit.band || '—');
  let signalInterp = cockpit.key_observation || `${cockpit.display_name || 'Node'} composite ${cockpit.composite_score ?? '—'}.`;
  if (isHorizonNetFallback(cockpit) && !(cockpit.component_inputs || []).length) {
    signalChip = 'horizon-net fallback';
    const obs = cockpit.key_observation ? ` ${cockpit.key_observation}` : '';
    signalInterp = cockpit.node_id === 'credit'
      ? `Credit composite uses horizon-net fallback (not C1-weighted components).${obs}`
      : `${cockpit.display_name || 'Node'} composite from horizon-net fallback — weighted components not populated.${obs}`;
  }
  const signalImpl = gate.blocked
    ? 'Do not initiate new risk — observe and maintain.'
    : gate.tight || health.score < TX_HEALTH_OPEN_THRESHOLD
      ? 'Size new ideas at ≤ 0.5× until health and gate improve.'
      : 'Eligible for desk-sized expression within gate policy.';

  const dirChip = `${humanizeValue(dir.posture || '—')} · ${humanizeValue(dir.conviction || 'low')}`;
  const dirInterp = dir.rationale || 'Directional read pending hydration or tracer confirm.';
  const dirImpl = dir.blocked
    ? (dir.block_reason || 'Directional blocked — RV or observe only.')
    : dir.posture === 'no_trade'
      ? 'Stay flat directionally; use RV sleeve if gate allows.'
      : 'Use for bias context; size still follows gate cap.';

  const rvChip = rv.posture ? humanizeValue(rv.posture) : 'Neutral';
  const rvInterp = rv.rationale || rv.structure || 'Relative value context unavailable.';
  const rvImpl = rv.blocked
    ? (rv.block_reason || 'RV expression blocked.')
    : cockpit.rv_basis?.richness_label
      ? `${richnessPillLabel(cockpit.rv_basis.richness_label)} — expression follows preferred spread leg.`
      : 'Confirm quartile read before sizing.';

  const flowsStatus = ffMeta.flows_status || 'unavailable';
  let flowsChip = humanizeValue(flowsStatus);
  let flowsInterp;
  let flowsImpl;
  if (flowsStatus === 'unavailable' || !ff.enabled) {
    flowsInterp = describeFlowsUpstreamGap(cockpit, state);
    flowsImpl = buildFlowsImpactLine(cockpit);
  } else if (flowsStatus === 'partial' || flowsStatus === 'fallback_1d') {
    flowsInterp = describeFlowsUpstreamGap(cockpit, state);
    flowsImpl = 'Sponsorship degraded — do not treat as neutral; cap size.';
  } else {
    const verdict = ff.aggregate?.verdict || 'mixed';
    flowsInterp = ff.interpretation?.summary || `Flows ${verdict} — ${ff.aggregate?.positive_count ?? '—'}/${ff.aggregate?.total_count ?? '—'} ETFs positive.`;
    flowsImpl = verdict === 'supportive'
      ? 'Sponsorship confirms thesis — can add conviction within gate cap.'
      : verdict === 'diverging'
        ? 'Flows diverge from RV — reduce size or wait for alignment.'
        : 'Flows neutral — RV history leads; sponsorship is non-confirming.';
  }

  const gateChip = resolveMissionGateChipLabel(gate);
  const gateImpl = gateNote
    ? gateNote.replace(/size_hint/gi, 'size cap').replace(/_/g, ' ')
    : 'Gate sizing follows transmission health and Whinfell score bands.';

  return {
    signal: renderDiagnosticBlock('Signal', 'diag-chip--signal', signalChip, signalInterp, signalImpl),
    directional: renderDiagnosticBlock('Directional', dir.blocked ? 'diag-chip--block' : 'diag-chip--warn', dirChip, dirInterp, dirImpl),
    relativeValue: renderDiagnosticBlock('Relative value', 'diag-chip--signal', rvChip, rvInterp, rvImpl),
    flows: renderDiagnosticBlock('Funds Flow Sponsorship', flowsStatus === 'ok' ? 'diag-chip--ok' : 'diag-chip--warn', flowsChip, flowsInterp, flowsImpl),
    gate: `<div class="cockpit-card diag-block">
      <h4>Gate</h4>
      <span class="diag-chip ${gate.blocked ? 'diag-chip--block' : gate.tight ? 'diag-chip--warn' : 'diag-chip--ok'}">${escapeHtml(gateChip)}</span>
      <p class="gate-decision-sentence">${escapeHtml(gateSentence)}</p>
      <p class="gate-implementation-note">${escapeHtml(gateImpl)}</p>
    </div>`,
  };
}

function renderComponentDiagnostics(cockpit, inputs) {
  if (!inputs.length) {
    if (isHorizonNetFallback(cockpit)) {
      return renderMissingDiagnostic(
        'Composite uses horizon-net fallback — C1-weighted components not populated.',
        'derived_unavailable',
      );
    }
    return '';
  }
  const rows = inputs.map(c => {
    const val = String(c.value || '').toLowerCase();
    if (val !== 'unavailable') {
      const partial = c.source === 'horizon_fallback';
      const chip = `<span class="cockpit-component-chip${partial ? ' cockpit-component-chip--partial' : ''}" title="weight ${c.weight ?? '—'} · source ${escapeHtml(c.source || '—')}${partial ? ' · partial sample' : ''}">
        ${escapeHtml(c.label || c.asset_id || '')} <strong>${escapeHtml(humanizeValue(c.value))}</strong>${c.unit ? ' ' + escapeHtml(c.unit) : ''}
        ${c.direction ? ` ${HORIZON_DISPLAY[c.direction] || ''}` : ''}
        ${partial ? ' <span class="status-chip status-chip--partial">fallback</span>' : ''}
      </span>`;
      return chip;
    }
    const key = cockpit.node_id === 'basis' ? matchBasisDiagnosticKey(c.label) : null;
    const msg = (key && BASIS_MISSING_MESSAGES[key])
      || `${c.label || 'Diagnostic'} unavailable — affects conviction, not gate eligibility.`;
    return renderMissingDiagnostic(msg, classifyComponentFailure(c) || 'derived_unavailable');
  });
  return `<div class="component-failure-strip">${rows.join('')}</div>`;
}

function basisValueToY(value, domain, pad, plotH) {
  const [yMin, yMax] = domain;
  const span = yMax - yMin || 1;
  return pad.t + plotH - ((value - yMin) / span) * plotH;
}

function drawBasisQuartileScaffold(ctx, domain, pad, plotW, plotH) {
  const zoneColors = [
    'rgba(79,179,122,0.05)',
    'rgba(76,142,217,0.04)',
    'rgba(76,142,217,0.05)',
    'rgba(255,140,105,0.05)',
  ];
  const labels = ['Q1', 'Q2', 'Q3', 'Q4'];
  for (let q = 0; q < 4; q++) {
    const [yMin, yMax] = domain;
    const vLo = yMin + (yMax - yMin) * (q / 4);
    const vHi = yMin + (yMax - yMin) * ((q + 1) / 4);
    const yLo = basisValueToY(vLo, domain, pad, plotH);
    const yHi = basisValueToY(vHi, domain, pad, plotH);
    ctx.fillStyle = zoneColors[q];
    ctx.fillRect(pad.l, Math.min(yLo, yHi), plotW, Math.abs(yHi - yLo));
  }
  ctx.fillStyle = 'rgba(142,156,179,0.4)';
  ctx.font = '7px system-ui,sans-serif';
  ctx.textAlign = 'right';
  labels.forEach((label, q) => {
    const [yMin, yMax] = domain;
    const v = yMin + (yMax - yMin) * ((q + 0.5) / 4);
    const y = basisValueToY(v, domain, pad, plotH);
    ctx.fillText(label, pad.l + plotW - 4, y + 2);
  });
  ctx.textAlign = 'left';
}

const COVERAGE_NODE_KEYS = [
  ['credit', 'Credit'],
  ['breadth', 'Breadth'],
  ['highbeta', 'BTC'],
  ['basis', 'Basis'],
];

function nodeHasRvHistory(cockpit) {
  const seriesMap = cockpit?.rv_basis?.series || {};
  const seriesId = cockpit?.rv_basis?.active_series_id || Object.keys(seriesMap)[0];
  const hz = seriesId ? seriesMap[seriesId]?.horizons : null;
  return !!(hz && Object.keys(hz).length >= 3);
}

function nodeFlowsCoverageStatus(cockpits, nodeId) {
  const status = cockpits?.[nodeId]?.funds_flows?.flows_meta?.flows_status || 'unavailable';
  if (status === 'ok') return 'ok';
  if (status === 'partial' || status === 'fallback_1d') return 'partial';
  return 'miss';
}

function nodeSignalReadiness(cockpit) {
  if (!cockpit) return 'miss';
  const inputs = cockpit.component_inputs || [];
  if (!inputs.length) {
    if (isHorizonNetFallback(cockpit)) return 'partial';
    return 'miss';
  }
  const unavailable = inputs.filter(c => String(c.value).toLowerCase() === 'unavailable').length;
  const fallbackCount = inputs.filter(c => c.source === 'horizon_fallback').length;
  if (unavailable > 0) return unavailable >= inputs.length ? 'miss' : 'partial';
  if (fallbackCount > Math.floor(inputs.length / 2)) return 'partial';
  return 'ok';
}

function assessCockpitHydrationMode(state) {
  const prov = state?.provenance || createEmptyProvenance();
  const hydration = state?.hydration || createEmptyHydration();
  const cockpits = hydration.node_cockpits;
  const hasCockpits = cockpits && LADDER.every(r => cockpits[r.id]);

  if (!prov.hydratedAt || !hasCockpits) {
    return {
      mode: 'degraded',
      title: 'Degraded',
      headline: 'No hydration — tracers only, CURRENT READING disabled.',
      tradable: 'Tracers and export only.',
      blocked: 'CURRENT READING, RV quartiles, Funds Flow, sized ideas.',
    };
  }

  const globalFlows = resolveFlowsStatusFromState(state);
  const nodeFlowStatuses = COVERAGE_NODE_KEYS.map(([id]) => nodeFlowsCoverageStatus(cockpits, id));
  const nodeSignalStatuses = COVERAGE_NODE_KEYS.map(([id]) => nodeSignalReadiness(cockpits[id]));
  const allFlowsOk = globalFlows === 'ok' && nodeFlowStatuses.every(s => s === 'ok');
  const allSignalsOk = nodeSignalStatuses.every(s => s === 'ok');
  const anySignalGap = nodeSignalStatuses.some(s => s !== 'ok');

  if (allFlowsOk && allSignalsOk) {
    return {
      mode: 'complete',
      title: 'Complete',
      headline: 'Hydration + flows + derived signals — all panels eligible.',
      tradable: 'Trade reads: rich/cheap, directional vs RV, sponsorship, gate.',
      blocked: '',
    };
  }

  if (allFlowsOk && anySignalGap) {
    return {
      mode: 'partial',
      title: 'Partial',
      headline: 'Flows present but derived diagnostics incomplete — mission read confidence reduced.',
      tradable: 'RV history, ladder, gate, and partial sponsorship — cap size.',
      blocked: 'Unavailable component signals are blocked, not neutral.',
    };
  }

  return {
    mode: 'partial',
    title: 'Partial',
    headline: 'Hydration loaded, flows or signals missing — RV active, sponsorship blocked, size capped.',
    tradable: 'RV history, ladder, and gate reads — half size or less.',
    blocked: 'Missing flows/signals are blocked, not neutral.',
  };
}

function buildCoverageChecklist(state) {
  const cockpits = state?.hydration?.node_cockpits;
  const globalFlows = resolveFlowsStatusFromState(state);
  const historyOk = cockpits && LADDER.some(r => nodeHasRvHistory(cockpits[r.id]));
  const signalStatuses = COVERAGE_NODE_KEYS.map(([id]) => nodeSignalReadiness(cockpits?.[id]));
  const signalsOk = signalStatuses.every(s => s === 'ok');
  const signalsPartial = signalStatuses.some(s => s === 'partial');
  const items = [
    { key: 'history', label: 'History', status: historyOk ? 'ok' : 'miss', auditScope: 'history' },
    { key: 'flows', label: 'Flows', status: globalFlows === 'ok' ? 'ok' : (globalFlows === 'unavailable' ? 'miss' : 'partial'), auditScope: 'flows' },
    { key: 'signals', label: 'Signals', status: signalsOk ? 'ok' : (signalsPartial || signalStatuses.some(s => s === 'partial') ? 'partial' : 'miss'), auditScope: 'signals' },
  ];
  COVERAGE_NODE_KEYS.forEach(([id, label]) => {
    const flowSt = nodeFlowsCoverageStatus(cockpits, id);
    const sigSt = nodeSignalReadiness(cockpits?.[id]);
    const combined = flowSt === 'miss' || sigSt === 'miss' ? 'miss'
      : (flowSt === 'partial' || sigSt === 'partial') ? 'partial' : 'ok';
    items.push({ key: id, label, status: combined, auditScope: id });
  });
  return items;
}

function renderCoverageChecklistHtml(items) {
  return items.map(item => {
    const mark = item.status === 'ok' ? '✓' : item.status === 'partial' ? '◐' : '✕';
    const cls = item.status === 'ok' ? 'coverage-check--ok' : item.status === 'partial' ? 'coverage-check--partial' : 'coverage-check--miss';
    const code = item.status === 'ok' ? 'ready' : item.status === 'partial' ? 'partial' : 'missing';
    return `<button type="button" class="coverage-pill coverage-pill--clickable ${cls}" data-audit-scope="${escapeHtml(item.auditScope || item.key)}" data-coverage-status="${code}" title="${escapeHtml(item.label)}: ${item.status} — click for dictionary audit">${escapeHtml(item.label)} ${mark}</button>`;
  }).join('');
}

function buildNodeCoverageSummary(cockpit, modeInfo) {
  const nodeId = cockpit.node_id;
  const row = LADDER.find(r => r.id === nodeId);
  const flowsStatus = cockpit.funds_flows?.flows_meta?.flows_status || 'unavailable';
  if (modeInfo.mode === 'degraded') {
    return 'Import hydration before sizing from this node.';
  }
  if (modeInfo.mode === 'complete') {
    return `${row?.short || 'Node'}: all panels eligible — size follows gate sentence below.`;
  }
  if (nodeId === 'basis' && flowsStatus === 'unavailable') {
    return 'Basis is running RV-only, no flows sponsorship — size capped.';
  }
  if (flowsStatus === 'unavailable') {
    return `${row?.short || 'Node'}: RV active, flows unavailable — size capped.`;
  }
  if (flowsStatus === 'partial' || flowsStatus === 'fallback_1d') {
    return `${row?.short || 'Node'}: partial flows — sponsorship degraded, size capped.`;
  }
  return modeInfo.tradable;
}

function buildCoverageBannerContextLines(cockpit, modeInfo, state) {
  if (modeInfo.mode === 'complete') return '';
  if (modeInfo.mode === 'degraded') {
    return `<p class="node-coverage-context"><span class="node-coverage-blocked">Blocked:</span> ${escapeHtml(modeInfo.blocked)}</p>`;
  }
  const flowsStatus = cockpit.funds_flows?.flows_meta?.flows_status || 'unavailable';
  let nodeLines = '';
  if (flowsStatus !== 'ok') {
    const impact = flowsStatus === 'unavailable'
      ? buildFlowsImpactLine(cockpit)
      : `${cockpit.display_name || 'Node'}: sponsorship degraded — do not treat as neutral.`;
    nodeLines = `
    <p class="node-coverage-upstream">${escapeHtml(describeFlowsUpstreamGap(cockpit, state))}</p>
    <p class="node-coverage-impact">${escapeHtml(impact)}</p>`;
  }
  return `
    <p class="node-coverage-context"><span class="node-coverage-tradable">Tradable:</span> ${escapeHtml(modeInfo.tradable)}</p>
    <p class="node-coverage-context"><span class="node-coverage-blocked">Blocked:</span> ${escapeHtml(modeInfo.blocked)}</p>${nodeLines}`;
}

function renderNodeCoverageBanner(cockpit, state) {
  const banner = el('nodeCoverageBanner');
  const shell = el('cockpitShell');
  if (!banner) return;
  const modeInfo = assessCockpitHydrationMode(state);
  const metrics = resolveCommandBarMetrics(state, deriveGate(state), state.provenance || createEmptyProvenance());
  const stamp = metrics.snapshotId || state.provenance?.snapshotId || '—';
  const checklist = renderCoverageChecklistHtml(buildCoverageChecklist(state));
  const summary = buildNodeCoverageSummary(cockpit, modeInfo);
  const contextLines = buildCoverageBannerContextLines(cockpit, modeInfo, state);

  const statusRail = modeInfo.mode === 'complete';
  banner.className = `node-coverage-banner node-coverage-banner--${modeInfo.mode}${statusRail ? ' node-coverage-banner--status-rail' : ''}`;
  banner.innerHTML = statusRail
    ? `<div class="node-coverage-head node-coverage-head--compact">
        <span class="node-coverage-mode">${escapeHtml(modeInfo.title)}</span>
        <span class="node-coverage-stamp">${escapeHtml(stamp)}</span>
      </div>
      <div class="coverage-pill-grid" aria-label="Coverage checklist">${checklist}</div>`
    : `<div class="node-coverage-head">
        <span class="node-coverage-mode">${escapeHtml(modeInfo.title)}</span>
        <span class="node-coverage-stamp">${escapeHtml(stamp)}</span>
        <p class="node-coverage-headline">${escapeHtml(modeInfo.headline)}</p>
      </div>
      <p class="node-coverage-summary">${escapeHtml(summary)}</p>
      ${contextLines}
      <div class="coverage-pill-grid" aria-label="Coverage checklist">${checklist}</div>`;
  banner.classList.remove('zone-hidden');
  banner.querySelectorAll('[data-audit-scope]').forEach(btn => {
    btn.onclick = () => openDictionaryAudit(btn.dataset.auditScope);
  });
  const diagZone = el('diagnosticsPanelZone');
  if (diagZone) diagZone.classList.remove('zone-hidden');

  if (shell) {
    shell.classList.toggle('cockpit-mode-diagnostic', modeInfo.mode !== 'complete');
    shell.classList.toggle('cockpit-mode-trade', modeInfo.mode === 'complete');
  }
}

function describeFlowsUpstreamGap(cockpit, state) {
  const meta = cockpit?.funds_flows?.flows_meta || {};
  const sidecar = state?.hydration?.flows_sidecar || {};
  const health = state?.hydration?.flows_health || sidecar.basket_health || {};
  const reason = meta.fallback_reason || '';
  const warnings = [...(sidecar.warnings || []), ...(health.warnings || [])];
  const missing = health.missing_tickers || sidecar.basket_health?.missing_tickers || [];

  if (reason === 'missing_basket_etfs' || warnings.some(w => String(w).includes('missing_basket_etfs'))) {
    const tickers = missing.length ? missing.join(', ') : 'basket ETF(s)';
    return `Quarantine CSV missing ${tickers} — partial basket (expected in current fixture).`;
  }
  if (reason === 'missing_wtm_flows_file' || warnings.includes('missing_wtm_flows_file')) {
    if (cockpit.node_id === 'basis') {
      return 'Basis flows basket not attached — WTM-Flows file missing for warehouse/ETF proxy sleeve.';
    }
    return 'WTM-Flows quarantine CSV not ingested for this sleeve.';
  }
  if (reason === 'flows_parse_failed' || warnings.includes('flows_parse_failed')) {
    return 'Flows parse failed — L1 sidecar could not be built from quarantine CSV.';
  }
  if (reason === 'credit_cross_section_1d_only') {
    return 'Flows ingested with 1D cross-section only — 5D persistence unavailable.';
  }
  if (reason === 'non_credit_node_no_fallback') {
    return 'No flows fallback configured for this node basket.';
  }
  return 'Flows pipeline step did not populate this sleeve — check desk live session and quarantine ingest.';
}

function buildFlowsImpactLine(cockpit) {
  if (cockpit.node_id === 'basis') {
    return 'Basis RV relies solely on history; no sponsorship or crowding signal for this session.';
  }
  return `${cockpit.display_name || 'This node'}: RV history usable; sponsorship and crowding signals blocked for this session.`;
}

function buildNodeGateDecisionSentence(cockpit, state, gate) {
  const china = computeChinaLadderRead(state);
  const health = computeHealthScore(state);
  const row = LADDER.find(r => r.id === cockpit.node_id);
  const nodeShort = row?.short || cockpit.display_name || 'Node';
  const mode = assessCockpitHydrationMode(state);

  const ladderPart = china.finalScore != null
    ? `China ladder ${china.finalScore} · ${china.band}`
    : 'China ladder —';
  const sq3Part = gate.sq3Result
    ? ` under SQ3 ${gate.sq3Score} (${gate.sq3Band})`
    : '';

  let riskPart;
  if (gate.blocked) {
    riskPart = ` → Blocked: no new ${nodeShort === 'Basis' ? 'Basis RV' : nodeShort + ' RV'} risk.`;
  } else if (gate.tight || health.score < TX_HEALTH_OPEN_THRESHOLD) {
    riskPart = ` → Tight Risk: new ${nodeShort === 'Basis' ? 'Basis RV' : nodeShort} ideas allowed only at ≤ 0.5× normal size.`;
  } else {
    riskPart = ` → ${gate.displayLabel || gate.label}: ${nodeShort} RV eligible within desk policy.`;
  }
  const flowsStatus = cockpit.funds_flows?.flows_meta?.flows_status || 'unavailable';
  if (mode.mode === 'partial' && flowsStatus === 'unavailable') {
    if (cockpit.node_id === 'basis') {
      riskPart += ' Running RV-only (no flows).';
    } else if (cockpit.node_id === 'credit') {
      riskPart += ' Credit RV-only (no flows sponsorship).';
    }
  }
  return `${ladderPart}${sq3Part}${riskPart}`;
}

function assessPostImportWorkflow(state) {
  const wf = state.ui?.postImportWorkflow;
  if (!wf?.importAt) return { active: false, complete: false, steps: [] };
  const prov = state.provenance || {};
  if (!prov.hydratedAt || !state.hydration?.node_cockpits) {
    return { active: false, complete: false, steps: [] };
  }

  const pendingSuggestions = state.suggestedTracer && Object.keys(state.suggestedTracer).length > 0;
  const tracer = state.tracer || {};
  const step1Done = !pendingSuggestions
    && (tracer.flow === 'confirmed' || tracer.flow === 'override' || tracer.flow === 'empty');
  const step2Done = !!wf.ladderReviewed;
  const step3Done = !!wf.savedAfterImport;

  const steps = [
    { id: 1, label: 'Review & apply tracer suggestions', done: step1Done, blocked: false, action: 'tracer' },
    { id: 2, label: 'Review ladder & gate impact', done: step2Done, blocked: !step1Done, action: 'ladder' },
    { id: 3, label: 'Save State for this session', done: step3Done, blocked: !(step1Done && step2Done), action: 'save' },
  ];
  return { active: true, complete: steps.every(s => s.done), steps };
}

function markPostImportLadderReviewed() {
  appState.ui = appState.ui || createEmptyState().ui;
  appState.ui.postImportWorkflow = appState.ui.postImportWorkflow || {};
  appState.ui.postImportWorkflow.ladderReviewed = true;
  appState.ui.gateDetailOpen = true;
  renderAll();
  markDirty();
}

function startPostImportWorkflow() {
  appState.ui = appState.ui || createEmptyState().ui;
  appState.ui.postImportWorkflow = {
    importAt: new Date().toISOString(),
    ladderReviewed: false,
    savedAfterImport: false,
  };
}

function renderPostImportWorkflowStrip(state) {
  const section = el('postImportWorkflow');
  const list = el('postImportSteps');
  if (!section || !list) return;
  const wf = assessPostImportWorkflow(state);
  const cockpitOn = appState.ui?.workspaceView === 'cockpit';
  if (!cockpitOn || !wf.active || wf.complete) {
    section.classList.add('zone-hidden');
    return;
  }
  section.classList.remove('zone-hidden');
  list.innerHTML = wf.steps.map(step => {
    const cls = step.done ? 'workflow-step--done' : step.blocked ? 'workflow-step--blocked' : 'workflow-step--active';
    const icon = step.done ? '✓' : String(step.id);
    const btn = step.done
      ? ''
      : `<button type="button" class="workflow-step-btn" data-workflow-action="${step.action}" ${step.blocked ? 'disabled' : ''}>${step.action === 'save' ? 'Save' : 'Review'}</button>`;
    return `<li class="workflow-step ${cls}"><span>${icon}</span><span>${escapeHtml(step.label)}</span>${btn}</li>`;
  }).join('');
  list.querySelectorAll('[data-workflow-action]').forEach(btn => {
    btn.onclick = () => {
      const action = btn.dataset.workflowAction;
      if (action === 'tracer') {
        el('suggestionTray')?.classList.remove('hidden');
        el('suggestionTray')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else if (action === 'ladder') {
        markPostImportLadderReviewed();
      } else if (action === 'save') {
        persistState();
      }
    };
  });
}

function renderSessionReadyChip(state) {
  const chip = el('sessionReadyChip');
  if (!chip) return;
  const wf = assessPostImportWorkflow(state);
  if (!wf.active || !wf.complete) {
    chip.classList.add('zone-hidden');
    return;
  }
  const snap = state.provenance?.snapshotId || appState.commandBarAuthority?.snapshotId || 'bundle';
  const mode = assessCockpitHydrationMode(state);
  chip.textContent = `Session ready — using bundle ${snap}`;
  chip.title = `Desk-ready under ${mode.title} coverage — workflow complete, not all datasets required.`;
  chip.classList.remove('zone-hidden');
}

function flowsDegradeChip(cockpit) {
  const meta = cockpit?.funds_flows?.flows_meta;
  if (!meta || meta.flows_status === 'ok') return '';
  const status = meta.flows_status || 'unavailable';
  return `<span class="flows-degrade-chip" title="Flows ${escapeHtml(status)}">${escapeHtml(status)}</span>`;
}

const FLOWS_SOURCE_LABELS = {
  wtm_flows_timeseries: 'WTM-Flows',
  credit_cross_section: 'Credit cross-section',
  none: 'None',
};

const FLOWS_SPARK_CHARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇'];

function formatFlowPctAum(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const n = Number(value);
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

function formatFlowsSourceLabel(source) {
  return FLOWS_SOURCE_LABELS[source] || String(source || '—').replace(/_/g, ' ');
}

function fundsFlowVerdictClass(verdict) {
  const k = String(verdict || '').toLowerCase();
  if (k === 'supportive') return 'funds-flow-verdict-supportive';
  if (k === 'diverging') return 'funds-flow-verdict-diverging';
  if (k === 'neutral' || k === 'mixed') return 'funds-flow-verdict-neutral';
  return '';
}

function sortFundsFlowEtfs(etfs) {
  const rows = Array.isArray(etfs) ? [...etfs] : [];
  rows.sort((a, b) => {
    const aPrimary = a.basket_role === 'primary' ? 1 : 0;
    const bPrimary = b.basket_role === 'primary' ? 1 : 0;
    if (aPrimary !== bPrimary) return bPrimary - aPrimary;
    const aAbs = Math.abs(Number(a.flow_pct_aum_5d ?? a.flow_pct_aum_1d) || 0);
    const bAbs = Math.abs(Number(b.flow_pct_aum_5d ?? b.flow_pct_aum_1d) || 0);
    return bAbs - aAbs;
  });
  return rows.slice(0, 5);
}

function persistenceSparkline(score) {
  if (score == null || Number.isNaN(Number(score))) return '';
  const n = Math.max(0, Math.min(1, Number(score)));
  const len = 5;
  const idx = Math.round(n * (FLOWS_SPARK_CHARS.length - 1));
  const ch = FLOWS_SPARK_CHARS[idx] || FLOWS_SPARK_CHARS[0];
  return FLOWS_SPARK_CHARS.slice(0, len).map((c, i) => (i < Math.ceil(n * len) ? ch : c)).join('');
}

function dataStatusTooltip(status) {
  const map = {
    ok: 'Full 1D + 5D data',
    partial_1d_only: '1D only — 5D unavailable',
    missing: 'Ticker missing from WTM-Flows',
  };
  return map[status] || status || '';
}

function renderFundsFlowSponsorshipCard(cockpit, opts = {}) {
  const variant = opts.variant || 'rail';
  const ff = cockpit?.funds_flows;
  const meta = ff?.flows_meta || {};
  const interpretation = ff?.interpretation || {};
  const aggregate = ff?.aggregate || {};
  const flowsStatus = meta.flows_status || 'unavailable';
  const show5d = flowsStatus !== 'fallback_1d' && meta.degrade_mode !== 'fallback_1d_credit';
  const isUnavailable = !ff?.enabled || flowsStatus === 'unavailable';
  const showVerdict = !isUnavailable && ['ok', 'partial', 'fallback_1d'].includes(flowsStatus);

  if (isUnavailable) {
    const state = buildStateFromDOM();
    const upstream = describeFlowsUpstreamGap(cockpit, state);
    const impact = buildFlowsImpactLine(cockpit);
    return `<section class="funds-flow-card funds-flow-card--unavailable" data-variant="${escapeHtml(variant)}" data-degrade="unavailable">
      <div class="funds-flow-card-header">
        <h4 class="funds-flow-card-title">Funds Flow Sponsorship</h4>
        <span class="funds-flow-meta-chip">${escapeHtml(flowsStatus)} · ${escapeHtml(formatFlowsSourceLabel(meta.flows_source))}</span>
      </div>
      <p class="funds-flow-upstream">${escapeHtml(upstream)}</p>
      <p class="funds-flow-impact">${escapeHtml(impact)}</p>
    </section>`;
  }

  const variantCls = variant === 'compare' ? ' funds-flow-card--compare'
    : variant === 'expanded' ? ' funds-flow-card--expanded' : '';
  const parts = [];

  const basketLabel = ff.basket_label ? ` · ${ff.basket_label}` : '';
  parts.push(`<div class="funds-flow-card-header"><h4 class="funds-flow-card-title">Allocator sponsorship${escapeHtml(basketLabel)}</h4></div>`);

  if (meta.flows_status && meta.flows_status !== 'ok') {
    parts.push(`<span class="funds-flow-meta-chip">${escapeHtml(meta.flows_status)} · ${escapeHtml(formatFlowsSourceLabel(meta.flows_source))}</span>`);
  }

  if (meta.flows_degraded) {
    const state = buildStateFromDOM();
    const upstream = describeFlowsUpstreamGap(cockpit, state);
    const impact = flowsStatus === 'partial' || flowsStatus === 'fallback_1d'
      ? `${cockpit.display_name || 'Node'}: sponsorship degraded — size cap applies; do not treat as neutral.`
      : buildFlowsImpactLine(cockpit);
    parts.push(`<p class="funds-flow-upstream">${escapeHtml(upstream)}</p>`);
    parts.push(`<p class="funds-flow-impact">${escapeHtml(impact)}</p>`);
  }

  if (showVerdict && aggregate.verdict) {
    parts.push(`<span class="funds-flow-verdict-badge ${fundsFlowVerdictClass(aggregate.verdict)}">${escapeHtml(aggregate.verdict)}</span>`);
  }
  if (aggregate.confidence_delta != null && aggregate.confidence_delta !== 0) {
    const sign = aggregate.confidence_delta > 0 ? '+' : '';
    parts.push(`<span class="funds-flow-meta-chip">confidence ${sign}${aggregate.confidence_delta}</span>`);
  }

  const pos = aggregate.positive_count ?? '—';
  const total = aggregate.total_count ?? '—';
  const agg1d = formatFlowPctAum(aggregate.flow_pct_aum_1d);
  let aggLine = `1D ${agg1d} AUM`;
  if (show5d && aggregate.flow_pct_aum_5d != null) {
    aggLine += ` · 5D ${formatFlowPctAum(aggregate.flow_pct_aum_5d)} AUM`;
  }
  aggLine += ` · ${pos}/${total} positive`;

  parts.push(`<p class="funds-flow-aggregate">${escapeHtml(aggLine)}</p>`);

  const etfs = sortFundsFlowEtfs(ff.etfs);
  const showSparklines = variant !== 'compare';
  const etfLimit = variant === 'expanded' ? etfs.length : etfs.length;
  if (etfLimit > 0) {
    const headerCols = show5d
      ? '<span>Ticker</span><span>1D</span><span>5D</span><span></span>'
      : '<span>Ticker</span><span>1D</span><span></span>';
    const headerCls = show5d ? 'funds-flow-etf-header' : 'funds-flow-etf-header funds-flow-etf-header--no5d';
    const rows = etfs.map(etf => {
      const isPrimary = etf.basket_role === 'primary';
      const rowCls = `funds-flow-etf-row${isPrimary ? ' funds-flow-etf-row--primary' : ''}${show5d ? '' : ' funds-flow-etf-row--no5d'}`;
      const tickerCls = `funds-flow-etf-ticker${isPrimary ? ' funds-flow-etf-ticker--primary' : ''}`;
      const val5d = show5d
        ? `<span class="funds-flow-etf-val${etf.flow_pct_aum_5d == null ? ' funds-flow-etf-val--muted' : ''}" title="${escapeHtml(dataStatusTooltip(etf.data_status))}">${etf.flow_pct_aum_5d == null ? '—' : formatFlowPctAum(etf.flow_pct_aum_5d)}</span>`
        : '';
      const spark = showSparklines && show5d && etf.persistence_score != null
        ? `<span class="funds-flow-etf-spark" title="Persistence ${etf.persistence_score}">${persistenceSparkline(etf.persistence_score)}</span>`
        : '<span class="funds-flow-etf-spark"></span>';
      return `<div class="${rowCls}">
        <span class="${tickerCls}">${escapeHtml(etf.ticker || '—')}</span>
        <span class="funds-flow-etf-val">${formatFlowPctAum(etf.flow_pct_aum_1d)}</span>
        ${val5d}
        ${spark}
      </div>`;
    }).join('');
    parts.push(`<div class="funds-flow-etf-table"><div class="${headerCls}">${headerCols}</div>${rows}</div>`);
  }

  if (interpretation.summary) {
    parts.push(`<p class="funds-flow-interpretation">${escapeHtml(interpretation.summary)}</p>`);
  }
  if (interpretation.divergence_flag && interpretation.caution_line) {
    parts.push(`<p class="funds-flow-caution">⚠ ${escapeHtml(interpretation.caution_line)}</p>`);
  }

  if (variant === 'expanded') {
    if (interpretation.change_mind_trigger) {
      parts.push(`<div class="funds-flow-change-mind"><strong>Change mind:</strong> ${escapeHtml(interpretation.change_mind_trigger)}</div>`);
    }
    if (meta.degrade_mode) {
      parts.push(`<p class="funds-flow-diagnostic">degrade_mode: ${escapeHtml(meta.degrade_mode)} · fallback: ${escapeHtml(meta.fallback_reason || '—')} · penalty: ${meta.flows_confidence_penalty ?? 0}</p>`);
    }
  }

  const asOf = ff.as_of || '';
  parts.push(`<p class="funds-flow-footer">Source: ${escapeHtml(formatFlowsSourceLabel(meta.flows_source))}${asOf ? ` · ${escapeHtml(asOf)}` : ''}</p>`);

  return `<section class="funds-flow-card${variantCls}" data-variant="${escapeHtml(variant)}" data-degrade="${escapeHtml(meta.degrade_mode || flowsStatus)}">${parts.join('')}</section>`;
}

function renderNodeRail(state) {
  const rail = el('nodeRail');
  if (!rail) return;
  const active = activeNodeId();
  const compareIds = appState.navigation?.compare_node_ids || [];
  const compareOn = appState.navigation?.view_mode === 'compare';
  rail.innerHTML = LADDER.map((row, i) => {
    const cockpit = mergeNodeCockpit(row.id, state);
    const isActive = row.id === active;
    const inCompare = compareOn && compareIds.includes(row.id);
    const weakest = cockpit.is_weakest_link ? '<span class="weakest-link-dot" title="Weakest link"></span>' : '';
    const freshCls = cockpit.freshness_status === 'fresh' ? 'freshness-dot-fresh'
      : cockpit.freshness_status === 'aging' ? 'freshness-dot-aging'
      : cockpit.freshness_status === 'stale' ? 'freshness-dot-stale' : '';
    const freshDot = freshCls ? `<span class="freshness-dot ${freshCls}" title="${escapeHtml(cockpit.freshness_status)}"></span>` : '';
    return `
      <button type="button"
        class="node-rail-tab ${isActive ? 'node-rail-tab-active' : ''} ${inCompare ? 'node-rail-tab-compare-selected' : ''}"
        data-node-id="${row.id}"
        data-node-index="${i + 1}"
        aria-pressed="${isActive}"
        title="${escapeHtml(row.name)} · ${i + 1}">
        <span class="rail-label">${i + 1}. ${escapeHtml(row.short)}</span>
        <span class="rail-meta">
          <span class="band-dot ${bandDotClass(cockpit.band_key)}"></span>
          ${weakest}
          ${freshDot}
          <span>${cockpit.composite_score ?? '—'}</span>
          ${flowsDegradeChip(cockpit)}
        </span>
      </button>`;
  }).join('');
  rail.querySelectorAll('[data-node-id]').forEach(btn => {
    btn.onclick = (e) => {
      if (e.shiftKey && appState.navigation?.view_mode === 'compare') {
        applyCompareSelection(btn.dataset.nodeId);
        return;
      }
      jumpToNode(btn.dataset.nodeId);
    };
  });
}

function renderCockpitDecisionRail(cockpit, state) {
  const rail = el('cockpitDecisionRail');
  const mount = el('cockpitDecisionContent') || rail;
  if (!mount) return;
  const domState = state || buildStateFromDOM();
  const derivedGate = deriveGate(domState);

  const railZoneLabel = '<div class="console-panel-zone-label console-panel-zone-label--inline">Implications · preferred expression</div>';

  if (isMissionSurfaceNode(cockpit.node_id)) {
    rail?.classList.add('cockpit-decision-rail--basis-mission');
    mount.innerHTML = railZoneLabel + renderMissionImplicationRail(cockpit, domState, derivedGate);
    return;
  }

  rail?.classList.remove('cockpit-decision-rail--basis-mission');
  const blocks = buildSignalDiagnostics(cockpit, domState, derivedGate);
  const flowsDetail = renderFundsFlowSponsorshipCard(cockpit, { variant: 'rail' });
  const showFlowsDetail = (cockpit.funds_flows?.flows_meta?.flows_status === 'ok'
    || cockpit.funds_flows?.flows_meta?.flows_status === 'partial');
  mount.innerHTML = `${railZoneLabel}
    ${blocks.signal}
    ${blocks.directional}
    ${blocks.relativeValue}
    ${blocks.flows}
    ${showFlowsDetail ? flowsDetail : ''}
    ${blocks.gate}`;
}

function drawRvBasisChart(cockpit, canvas, state, gate) {
  if (!canvas || !canvas.getContext) return { drew: false, pointCount: 0 };
  const ctx = canvas.getContext('2d');
  const theme = getChartTheme();
  const domState = state || buildStateFromDOM();
  const gateState = gate || deriveGate(domState);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.parentElement?.getBoundingClientRect?.() || { width: 400, height: 240 };
  const w = Math.max(240, Math.floor(rect.width));
  const h = Math.max(180, Math.floor(rect.height));
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const horizon = cockpit.rv_basis?.active_horizon || appState.chart?.shared_horizon || '3m';
  const seriesMap = cockpit.rv_basis?.series || {};
  const seriesId = cockpit.rv_basis?.active_series_id || Object.keys(seriesMap)[0];
  const series = seriesId ? seriesMap[seriesId] : null;
  if (!series) return { drew: false, pointCount: 0 };

  const points = RV_HORIZONS.map(hzKey => {
    const hz = series.horizons?.[hzKey];
    return hz ? { key: hzKey, value: Number(hz.current_value), percentile: Number(hz.percentile), quartile: hz.quartile, unit: hz.unit } : null;
  }).filter(Boolean);

  if (!points.length) return { drew: false, pointCount: 0 };

  const isMission = isMissionSurfaceNode(cockpit.node_id);
  const isBasis = cockpit.node_id === 'basis';
  const diagTags = isMission ? buildMissionChartDiagnosis(cockpit, domState, gateState) : [];
  const pad = { l: 72, r: 20, t: 28, b: 44 };
  const plotW = w - pad.l - pad.r;
  const plotH = h - pad.t - pad.b;
  const vals = points.map(p => p.value);
  const refs = isBasis ? resolveBasisRefLines(domState) : {};
  const refsReady = isBasis && basisRefsAvailable(refs);
  const domainSource = isBasis
    ? (refsReady ? [...vals, 0, refs.low, refs.mid, refs.high] : [...vals, 0])
    : [0, ...vals, 100];
  const domain = isBasis ? getBasisDomain(domainSource) : [0, 100];
  const [yMin, yMax] = domain;
  const yBase = isBasis && yMin <= 0 && yMax >= 0 ? 0 : yMin;
  const barW = plotW / points.length;
  const activeHz = series.horizons?.[horizon];
  const axisFont = '600 12px system-ui,sans-serif';
  const labelFont = '600 11px system-ui,sans-serif';
  const valueFont = '600 11px system-ui,sans-serif';

  if (isBasis) {
    const permText = gateState.blocked ? 'No new risk' : gateState.tight ? 'Allowed · capped 0.5×' : 'Eligible';
    ctx.fillStyle = gateState.blocked ? 'rgba(245,101,101,0.85)' : gateState.tight ? 'rgba(245,166,35,0.85)' : 'rgba(61,221,140,0.75)';
    ctx.font = labelFont;
    ctx.textAlign = 'right';
    ctx.fillText(permText, w - pad.r, pad.t - 10);
    if (gateState.tight || gateState.blocked) {
      ctx.fillStyle = gateState.blocked ? 'rgba(245,101,101,0.35)' : 'rgba(245,166,35,0.28)';
      ctx.fillRect(pad.l - 4, pad.t, 3, plotH);
    }
  }

  if (isBasis && !refsReady) {
    drawBasisQuartileScaffold(ctx, domain, pad, plotW, plotH);
  }

  ctx.strokeStyle = theme.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const v = yMin + ((yMax - yMin) * i) / 4;
    const y = basisValueToY(v, domain, pad, plotH);
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(w - pad.r, y);
    ctx.stroke();
    ctx.fillStyle = theme.axisText;
    ctx.font = axisFont;
    ctx.textAlign = 'right';
    const axisLabel = isBasis
      ? formatChartValue(v, points[0]?.unit)
      : `${Math.round(v)}%`;
    ctx.fillText(axisLabel, pad.l - 8, y + 4);
  }

  if (isBasis && yMin <= 0 && yMax >= 0) {
    const y0 = basisValueToY(0, domain, pad, plotH);
    ctx.strokeStyle = theme.zeroLine;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.l, y0);
    ctx.lineTo(w - pad.r, y0);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = theme.muted;
    ctx.font = labelFont;
    ctx.textAlign = 'right';
    ctx.fillText('0', pad.l - 8, y0 + 4);
  }

  if (refsReady && refs.low < refs.high) {
    const yLo = basisValueToY(refs.low, domain, pad, plotH);
    const yHi = basisValueToY(refs.high, domain, pad, plotH);
    ctx.fillStyle = 'rgba(214,168,95,0.12)';
    ctx.fillRect(pad.l, Math.min(yLo, yHi), plotW, Math.abs(yHi - yLo));
    [{ v: refs.low, a: 0.28 }, { v: refs.mid, a: 0.42 }, { v: refs.high, a: 0.28 }].forEach(ref => {
      const y = basisValueToY(ref.v, domain, pad, plotH);
      ctx.strokeStyle = `rgba(214,168,95,${ref.a})`;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(w - pad.r, y);
      ctx.stroke();
      ctx.setLineDash([]);
    });
  } else if (isBasis) {
    ctx.fillStyle = theme.muted;
    ctx.font = labelFont;
    ctx.textAlign = 'left';
    ctx.fillText('Ref band unavailable — table below is authoritative', pad.l, pad.t - 10);
  }

  const activeIdx = points.findIndex(p => p.key === horizon);
  if (activeIdx >= 0) {
    ctx.fillStyle = theme.activeBand;
    ctx.fillRect(pad.l + activeIdx * barW, pad.t, barW, plotH);
  }

  points.forEach((p, i) => {
    const x = pad.l + i * barW + barW * 0.12;
    const bw = barW * 0.76;
    const yTop = isBasis
      ? basisValueToY(p.value, domain, pad, plotH)
      : pad.t + plotH - ((p.percentile || 50) / 100) * plotH;
    const yBot = isBasis ? basisValueToY(yBase, domain, pad, plotH) : pad.t + plotH;
    const q = p.quartile || 2;
    ctx.fillStyle = q >= 4 ? theme.barHi : q <= 1 ? theme.barLo : theme.barMid;
    if (isBasis) {
      ctx.fillRect(x, Math.min(yTop, yBot), bw, Math.max(6, Math.abs(yBot - yTop)));
    } else {
      const barH = Math.max(6, plotH * ((p.percentile || 50) / 100));
      ctx.fillRect(x, pad.t + plotH - barH, bw, barH);
    }
    ctx.fillStyle = theme.label;
    ctx.font = labelFont;
    ctx.textAlign = 'center';
    ctx.fillText(RV_HORIZON_LABELS[p.key] || p.key, x + bw / 2, h - pad.b + 16);
    const valLabel = isBasis
      ? formatChartValue(p.value, p.unit)
      : `${Math.round(p.percentile || 0)}%`;
    ctx.fillStyle = theme.axisText;
    ctx.font = valueFont;
    const labelY = isBasis ? Math.min(yTop, yBot) - 6 : Math.max(pad.t + 14, yTop - 6);
    ctx.fillText(valLabel, x + bw / 2, labelY);
  });

  if (!isBasis) {
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = pad.l + i * barW + barW / 2;
      const y = pad.t + plotH - ((p.percentile || 50) / 100) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = theme.muted;
    ctx.font = labelFont;
    ctx.textAlign = 'left';
    ctx.fillText('Y-axis: percentile vs history', pad.l, pad.t - 10);
  }

  if (isBasis && activeHz && Number.isFinite(activeHz.percentile)) {
    const pctY = pad.t + plotH - ((activeHz.percentile || 50) / 100) * plotH;
    ctx.strokeStyle = theme.line;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.l, pctY);
    ctx.lineTo(w - pad.r, pctY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = theme.muted;
    ctx.font = labelFont;
    ctx.textAlign = 'right';
    ctx.fillText(formatPercentile(Number(activeHz.percentile)), w - pad.r, pctY - 4);
  }

  if (diagTags.length) {
    const fontSize = 10;
    let xCursor = pad.l;
    const yDiag = h - 8;
    ctx.font = `${fontSize}px system-ui,sans-serif`;
    ctx.textAlign = 'left';
    diagTags.forEach(tag => {
      const textW = ctx.measureText(tag).width + 12;
      if (xCursor + textW > w - pad.r) return;
      ctx.fillStyle = theme.activeBand;
      ctx.fillRect(xCursor, yDiag - fontSize - 6, textW, fontSize + 6);
      ctx.fillStyle = theme.muted;
      ctx.fillText(tag, xCursor + 6, yDiag - 2);
      xCursor += textW + 6;
    });
  }

  return { drew: true, pointCount: points.length };
}

function renderCockpitChart(cockpit, state) {
  const domState = state || buildStateFromDOM();
  const gate = deriveGate(domState);
  const horizon = cockpit.rv_basis?.active_horizon || appState.chart?.shared_horizon || '3m';
  const seriesMap = cockpit.rv_basis?.series || {};
  const seriesId = cockpit.rv_basis?.active_series_id || Object.keys(seriesMap)[0];
  const series = seriesId ? seriesMap[seriesId] : null;
  const hz = series?.horizons?.[horizon];
  const row = LADDER.find(r => r.id === cockpit.node_id);
  const canvas = el('cockpitRvCanvas');
  const placeholder = el('cockpitChartPlaceholder');

  const isMission = isMissionSurfaceNode(cockpit.node_id);
  const chartArea = el('cockpitChartArea');
  chartArea?.classList.toggle('cockpit-chart-area--basis-mission', isMission);

  el('cockpitChartTitle').textContent = series?.label || `${row?.short || 'Node'} · RV / Basis`;
  const rvFallback = series ? resolveRvHorizonValueFallback(cockpit, series) : { mode: 'none' };
  let chartSubtitle = series
    ? `${humanizeValue(series.quartile_direction || '')} · ${RV_HORIZON_LABELS[horizon] || horizon} lookback`
    : (cockpit.rv_basis?._fallback_mode ? 'RV quartiles require hydration — history not loaded' : 'No series populated');
  if (rvFallback.mode === 'spot') {
    chartSubtitle += ` · spot value shared across lookbacks`;
  }
  el('cockpitChartSubtitle').textContent = chartSubtitle;

  renderMissionTacticalBanner(cockpit, hz, series, domState, gate);
  renderMissionSummaryRows(cockpit, hz, series, domState, gate);
  if (hz) {
    el('cockpitChartValue').textContent = formatReadingValue(hz);
    el('cockpitChartRichness').textContent = `${hz.richness_label || '—'} · Q${hz.quartile || '—'}`;
    el('cockpitChartPct').textContent = `${formatPercentile(Number(hz.percentile))} · n=${hz.n_observations ?? '—'}`;
  }

  const session = assessHydrationSession(buildStateFromDOM());
  const chartCanvas = el('cockpitChartCanvas');
  let unhydratedOverlay = chartCanvas?.querySelector('.cockpit-unhydrated-overlay');
  if (session.level !== 'ok' && chartCanvas) {
    if (!unhydratedOverlay) {
      unhydratedOverlay = document.createElement('div');
      unhydratedOverlay.className = 'cockpit-unhydrated-overlay';
      chartCanvas.appendChild(unhydratedOverlay);
    }
    unhydratedOverlay.innerHTML = `<p>${escapeHtml(session.level === 'missing' ? 'Import hydration bundle to populate CURRENT READING and RV quartiles.' : 'Re-import v1.2.0 bundle — session data incomplete.')}</p>`;
    unhydratedOverlay.classList.remove('zone-hidden');
  } else if (unhydratedOverlay) {
    unhydratedOverlay.classList.add('zone-hidden');
  }

  renderCockpitRvTable(cockpit, series);
  initCockpitChartResize();
  const drawResult = drawRvBasisChart(cockpit, canvas, domState, gate);
  if (placeholder) {
    if (drawResult.drew) placeholder.classList.add('zone-hidden');
    else placeholder.classList.remove('zone-hidden');
  }

  const pills = el('cockpitHorizonPills');
  if (pills) {
    pills.innerHTML = RV_HORIZONS.map(h => {
      const hasData = series?.horizons?.[h];
      const cls = h === horizon ? 'horizon-pill-active' : '';
      const disabled = !hasData ? 'opacity-40' : '';
      return `<button type="button" class="horizon-pill ${cls} ${disabled}" data-horizon="${h}">${RV_HORIZON_LABELS[h]}</button>`;
    }).join('');
    pills.querySelectorAll('[data-horizon]').forEach(btn => {
      btn.onclick = () => setSharedHorizon(btn.dataset.horizon);
    });
  }
}

function renderCockpitDetailBand(cockpit) {
  const band = el('cockpitDetailBand');
  if (!band) return;
  const scroll = appState.panel?.scroll_positions?.[cockpit.node_id];
  if (typeof scroll === 'number') band.scrollTop = scroll;
  const inputs = cockpit.component_inputs || [];
  if (!inputs.length) {
    const marks = cockpit.horizon_marks || {};
    band.innerHTML = `<div class="cockpit-component-strip">
      ${HORIZONS.map(h => `<span class="cockpit-component-chip">${HORIZON_LABELS[h]} ${HORIZON_DISPLAY[marks[h] || ''] || '—'}</span>`).join('')}
      <span class="cockpit-component-chip text-wtm-muted">Component feed requires hydration import</span>
    </div>`;
    return;
  }
  band.innerHTML = `<div class="cockpit-component-strip">${renderComponentDiagnostics(cockpit, inputs)}</div>`;
}

function toggleFocusMode(force) {
  appState.navigation = appState.navigation || createEmptyNavigation();
  const next = typeof force === 'boolean' ? force : !appState.navigation.focus_mode;
  appState.navigation.focus_mode = next;
  appState.navigation.focus_node_id = next ? activeNodeId() : null;
  if (!next) appState.navigation._focus_scroll = el('cockpitFocusLayer')?.scrollTop || 0;
  renderNodeCockpitShell(buildStateFromDOM());
  markDirty();
}

function exitFocusMode() {
  if (!appState.navigation?.focus_mode) return;
  toggleFocusMode(false);
}

function toggleCompareMode(force) {
  appState.navigation = appState.navigation || createEmptyNavigation();
  const next = typeof force === 'boolean' ? force : appState.navigation.view_mode !== 'compare';
  if (next) {
    appState.navigation.view_mode = 'compare';
    if (appState.navigation.focus_mode) exitFocusMode();
    if (!appState.navigation.compare_node_ids?.length) {
      appState.navigation.compare_node_ids = [activeNodeId()];
    }
  } else {
    appState.navigation.view_mode = 'flip';
    appState.navigation.compare_node_ids = [];
  }
  renderNodeCockpitShell(buildStateFromDOM());
  markDirty();
}

function applyCompareSelection(nodeId) {
  if (appState.navigation?.view_mode !== 'compare') return;
  appState.navigation = appState.navigation || createEmptyNavigation();
  const ids = [...(appState.navigation.compare_node_ids || [])];
  const idx = ids.indexOf(nodeId);
  if (idx >= 0) ids.splice(idx, 1);
  else {
    if (ids.length >= 3) { showToast('Compare max 3 nodes'); return; }
    ids.push(nodeId);
  }
  if (!ids.length) ids.push(activeNodeId());
  appState.navigation.compare_node_ids = ids;
  renderNodeCockpitShell(buildStateFromDOM());
  markDirty();
}

function renderFocusLayer(cockpit, state) {
  const layer = el('cockpitFocusLayer');
  if (!layer) return;
  const dir = cockpit.directional || {};
  const rv = cockpit.relative_value || {};
  const seriesMap = cockpit.rv_basis?.series || {};
  const seriesId = cockpit.rv_basis?.active_series_id || Object.keys(seriesMap)[0];
  const series = seriesId ? seriesMap[seriesId] : null;
  const rvEvidence = buildRvHorizonEvidenceMarkup(cockpit, series);
  const flowsCard = renderFundsFlowSponsorshipCard(cockpit, { variant: 'expanded' });
  const changeMindFallback = cockpit.funds_flows?.interpretation?.change_mind_trigger || dir.invalidation || '—';

  layer.innerHTML = `
    <div class="cockpit-card"><h3>Thesis</h3>
      <p class="cockpit-line"><strong>${escapeHtml(cockpit.band)}</strong> · ${cockpit.composite_score} · ${escapeHtml(cockpit.confidence || '')}</p>
      <p class="cockpit-sub">${escapeHtml(cockpit.key_observation || '')}</p>
      <p class="cockpit-sub">${escapeHtml(cockpit.gate_interaction?.note || '')}</p>
    </div>
    <div class="cockpit-card"><h3>Directional</h3>
      <p class="cockpit-line">${escapeHtml(dir.posture || '—')} · ${escapeHtml(dir.conviction || '')}</p>
      <p class="cockpit-sub">${escapeHtml(dir.rationale || '')}</p>
      <p class="cockpit-sub">${escapeHtml(dir.invalidation || '')}</p>
    </div>
    <div class="cockpit-card"><h3>RV / Basis evidence</h3>
      <p class="cockpit-sub">${escapeHtml(series?.label || rv.structure || '')} · ${escapeHtml(series?.quartile_direction || '')}</p>
      <table class="${rvEvidence.tableClass}"><thead><tr><th>Horizon</th><th>Value</th><th>Pct</th><th>Q</th><th>Rich</th></tr></thead><tbody>${rvEvidence.rows}</tbody></table>${rvEvidence.note}
    </div>
    <div class="cockpit-card"><h3>Drivers</h3>
      <p class="cockpit-sub">${(cockpit.component_inputs || []).map(c => `${escapeHtml(c.label || '')} ${c.value}`).join(' · ') || 'Horizon marks only — import hydration for feed.'}</p>
    </div>
    <div class="cockpit-card"><h3>Allocator sponsorship (confirming evidence)</h3>${flowsCard}</div>
    ${!cockpit.funds_flows?.interpretation?.change_mind_trigger ? `<div class="cockpit-card"><h3>Change mind</h3>
      <p class="cockpit-sub">${escapeHtml(changeMindFallback)}</p>
    </div>` : ''}`;
  if (typeof appState.navigation._focus_scroll === 'number') layer.scrollTop = appState.navigation._focus_scroll;
}

function renderCompareLayer(state) {
  const layer = el('cockpitCompareLayer');
  if (!layer) return;
  const ids = appState.navigation?.compare_node_ids || [activeNodeId()];
  const horizon = appState.chart?.shared_horizon || '3m';
  layer.innerHTML = ids.map(nodeId => {
    const cockpit = mergeNodeCockpit(nodeId, state);
    const row = LADDER.find(r => r.id === nodeId);
    const series = cockpit.rv_basis?.series?.[cockpit.rv_basis?.active_series_id];
    const hz = series?.horizons?.[horizon];
    const rvLine = hz ? `Q${hz.quartile} · ${hz.richness_label} · ${hz.percentile}th` : (cockpit.rv_basis?.quartile_context || '—');
    const flowsCard = renderFundsFlowSponsorshipCard(cockpit, { variant: 'compare', horizon });
    return `<article class="compare-card">
      <h4>${escapeHtml(row?.short || nodeId)}</h4>
      <p><strong>${escapeHtml(cockpit.band || '')}</strong> · ${cockpit.composite_score}</p>
      <p>${escapeHtml(cockpit.directional?.posture || '')} · ${escapeHtml(cockpit.directional?.rationale || '').slice(0, 80)}</p>
      <p class="${richnessClass(hz?.richness_label)}">${escapeHtml(rvLine)} · ${RV_HORIZON_LABELS[horizon]}</p>
      ${flowsCard}
    </article>`;
  }).join('');
}

function renderNodeCockpitShell(state) {
  if (appState.ui?.workspaceView !== 'cockpit') return;
  const nav = appState.navigation || createEmptyNavigation();
  const compareOn = nav.view_mode === 'compare';
  const focusOn = nav.focus_mode;
  const main = document.querySelector('#cockpitShell .cockpit-main');
  const detail = el('cockpitDetailBand');
  const focus = el('cockpitFocusLayer');
  const compare = el('cockpitCompareLayer');

  renderNodeRail(state);
  renderNodeCoverageBanner(mergeNodeCockpit(activeNodeId(), state), state);
  renderFlipchartState();

  main?.classList.toggle('zone-hidden', focusOn || compareOn);
  detail?.classList.toggle('zone-hidden', focusOn || compareOn);
  focus?.classList.toggle('zone-hidden', !focusOn);
  compare?.classList.toggle('zone-hidden', !compareOn);

  el('btnCompareMode')?.classList.toggle('btn-primary', compareOn);
  el('btnHeresWhy')?.classList.toggle('btn-primary', focusOn);

  if (compareOn) {
    renderCompareLayer(state);
    return;
  }
  const cockpit = mergeNodeCockpit(focusOn ? (nav.focus_node_id || activeNodeId()) : activeNodeId(), state);
  if (focusOn) {
    renderFocusLayer(cockpit, state);
    return;
  }
  renderCockpitChart(cockpit, state);
  renderCockpitDecisionRail(cockpit, state);
  renderCockpitDetailBand(cockpit);
}

function applyWorkspaceView(view) {
  appState.ui = appState.ui || createEmptyState().ui;
  appState.ui.workspaceView = view;
  const cockpitOn = view === 'cockpit';
  const cockpitZone = el('nodeCockpitZone');
  const legacyZone = el('legacyConsoleZone');
  cockpitZone?.classList.toggle('zone-hidden', !cockpitOn);
  legacyZone?.classList.toggle('zone-hidden', cockpitOn);
  if (cockpitZone) cockpitZone.style.display = cockpitOn ? '' : 'none';
  if (legacyZone) legacyZone.style.display = cockpitOn ? 'none' : '';
  const btn = el('btnWorkspaceToggle');
  if (btn) {
    btn.textContent = cockpitOn ? 'Legacy Console' : 'Node Cockpits';
    btn.setAttribute('aria-pressed', cockpitOn ? 'false' : 'true');
    btn.title = cockpitOn ? 'Open legacy intake + tracer console' : 'Return to node cockpits';
  }
  if (cockpitOn) renderNodeCockpitShell(buildStateFromDOM());
  else renderAll();
}

function isTypingTarget(target) {
  if (!target) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

function handleCockpitKeyboard(e) {
  if (appState.ui?.workspaceView !== 'cockpit') return;
  if (isTypingTarget(e.target)) return;
  if (e.key === 'Escape') {
    if (el('deskDocsDrawer')?.classList.contains('is-open')) { e.preventDefault(); setDeskDocsOpen(false); return; }
    if (el('signalDetailDrawer')?.classList.contains('is-open')) { e.preventDefault(); setSignalDetailOpen(false); return; }
    if (appState.navigation?.focus_mode) { e.preventDefault(); exitFocusMode(); return; }
    if (appState.navigation?.view_mode === 'compare') { e.preventDefault(); toggleCompareMode(false); return; }
  }
  if (e.key === 'f' || e.key === 'F') {
    if (appState.navigation?.view_mode === 'compare') return;
    e.preventDefault();
    toggleFocusMode();
    return;
  }
  if (e.key === 'c' || e.key === 'C') {
    e.preventDefault();
    toggleCompareMode();
    return;
  }
  if (e.key === 'ArrowLeft') { e.preventDefault(); flipNode(-1); return; }
  if (e.key === 'ArrowRight') { e.preventDefault(); flipNode(1); return; }
  const num = parseInt(e.key, 10);
  if (num >= 1 && num <= 5) {
    e.preventDefault();
    jumpToNode(LADDER[num - 1].id);
  }
}

let _renderDepth = 0;

/** Minimal desk paint when full renderAll throws (safe_boot / hydration import recovery). */
function renderAllFallback(err) {
  bootLog('warn', 'renderAllFallback', err?.message || err);
  if (typeof window !== 'undefined') window.__WTM_LAST_RENDER_OK = false;
  logConsoleGuard('fallback', { err: err?.message || String(err || '') });
  let state;
  let gate;
  try {
    state = buildStateFromDOM();
    gate = deriveGate(state);
  } catch (stateErr) {
    bootLog('error', 'renderAllFallback state build failed', stateErr);
    setElText('headerRegimeLine', 'Whinfell Transmission Control — boot fallback');
    setElText('hydrationImportStatus', 'Render fallback — check console (?boot_log=1)');
    signalBootCheck('RENDER FALLBACK', true);
    return;
  }
  try { renderCommandBar(state, gate); } catch (_) { /* partial */ }
  try { renderHydrationImportStatus(state); } catch (_) { /* partial */ }
  try { renderDataDictionaryBadge(false); } catch (_) { /* partial */ }
  setElText('sq3ComputedDisplay', gate.sq3Result ? String(gate.sq3Score) : '—');
  const tcBuildBadge = el('tcConsoleBuildBadge');
  if (tcBuildBadge) tcBuildBadge.textContent = TC_CONSOLE_BUILD;
  signalBootCheck('RENDER FALLBACK', true);
}

function renderAllCore() {
  renderDataDictionaryBadge(false);
  const state = buildStateFromDOM();
  const gate = deriveGate(state);
  const zone = gate.zone;
  const health = computeHealthScore(state);
  const sq3Key = gate.sq3Result ? sq3BandKey(gate.sq3Band) : 'unknown';

  renderCommandBar(state, gate);
  renderHydrationImportStatus(state);
  renderHydrationBanner(state);
  renderPostImportWorkflowStrip(state);
  renderSessionReadyChip(state);

  setElText('sq3ComputedDisplay', gate.sq3Result ? String(gate.sq3Score) : '—');
  const sq3BandChip = el('sq3BandChip');
  if (sq3BandChip) {
    sq3BandChip.textContent = gate.sq3Result ? gate.sq3Band : '—';
    sq3BandChip.className = `text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${sq3ChipCls(sq3Key)}`;
  }

  const gateExplainList = el('gateExplainList');
  if (gateExplainList) gateExplainList.innerHTML = gate.explanations.map(e => `<li>${e}</li>`).join('');
  const gateUnlockList = el('gateUnlockList');
  if (gateUnlockList) gateUnlockList.innerHTML = gate.unlock.map(u => `<li>${u}</li>`).join('');
  setElText('gateHealthSub', `Transmission Health: ${health.score} (${health.label}) · Weakest: ${health.weakestStage}`);
  el('gateDetailPanel')?.classList.toggle('hidden', !appState.ui?.gateDetailOpen);

  const scoreZoneChip = el('scoreZoneChip');
  if (scoreZoneChip) {
    scoreZoneChip.textContent = zone.text;
    scoreZoneChip.className = `text-[9px] font-bold uppercase px-2 py-2 rounded border self-center ${zone.key === 'green' ? 'border-wtm-green text-wtm-green bg-emerald-500/10' : zone.key === 'amber' ? 'border-wtm-amber text-wtm-amber bg-amber-500/10' : zone.key === 'red' ? 'border-wtm-red text-wtm-red bg-red-500/10' : 'border-wtm-border text-wtm-muted'}`;
  }

  const gateStatusChip = el('gateStatusChip');
  if (gateStatusChip) {
    gateStatusChip.textContent = gate.displayLabel || gate.label;
    gateStatusChip.className = `mt-1 min-h-[34px] flex items-center justify-center rounded-md border text-xs font-extrabold uppercase ${gate.chipCls}`;
  }

  const tx = state.intake.transmissionState;
  const tc = el('txChip');
  if (tc) {
    if (tx && TX_META[tx]) { tc.textContent = TX_META[tx].label; tc.className = `text-[9px] font-bold uppercase px-2 py-2 rounded border shrink-0 self-center ${TX_META[tx].chip}`; }
    else { tc.textContent = '—'; tc.className = 'text-[9px] font-bold uppercase px-2 py-2 rounded border border-wtm-border text-wtm-muted shrink-0 self-center'; }
  }

  renderExecutionStatus(gate, state);
  renderOperatorPanel(state, gate);
  renderPlainEnglishSummary(state, gate, health);
  renderWhyExplanations(state, gate, health);
  [['cardBtcOptions','chipL2','noteL2'],['cardBtcCalendar','chipL3','noteL3']].forEach(([c]) => {
    const card = el(c);
    if (!card) return;
    card.classList.remove('border-l-wtm-border','border-l-wtm-red','border-l-wtm-amber','border-l-wtm-green','card-blocked');
    card.classList.add(gate.borderAccent);
    card.classList.toggle('card-blocked', gate.blocked);
  });

  const btnCopyL2 = el('btnCopyL2');
  const btnCopyL3 = el('btnCopyL3');
  if (btnCopyL2) btnCopyL2.disabled = gate.blocked;
  if (btnCopyL3) btnCopyL3.disabled = gate.blocked;

  setElText('urlDisplayKoyfin', state.urls.koyfin?.trim() || 'No URL saved');
  setElText('urlDisplayBarchart', state.urls.barchart?.trim() || 'No URL saved');
  syncHeaderSourceLinks(state);

  updateGrossDisplay(state, gate);
  updateResearchReadout(state);
  renderProvenancePanel(state);
  renderSuggestedTracerPanel();
  renderTracerFlowChrome();
  renderTracerVisual();
  try {
    renderNodeCockpitShell(state);
  } catch (cockpitErr) {
    bootLog('warn', 'renderNodeCockpitShell failed — cockpit zone may be blank', cockpitErr);
  }
  if (typeof WTM_CommentaryFeed !== 'undefined' && typeof WTM_CommentaryFeed.renderFeed === 'function') {
    try { WTM_CommentaryFeed.renderFeed(state); } catch (feedErr) {
      bootLog('warn', 'commentary feed render skipped', feedErr);
    }
  }
  if (typeof WTM_IaShell !== 'undefined' && typeof WTM_IaShell.syncLayer === 'function') {
    try { WTM_IaShell.syncLayer(state); } catch (shellErr) {
      bootLog('warn', 'IA shell sync skipped', shellErr);
    }
  }
  // Defer BasisWatch + viz diagnostics — keeps command bar / cockpit responsive.
  scheduleHeavyPanelRefresh();
}

function renderAll() {
  if (_renderDepth > 3) {
    bootLog('warn', 'renderAll recursion capped');
    return false;
  }
  _renderDepth += 1;
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  try {
    if (!consoleCanRenderSuccess()) {
      throw new Error('console shell anchors missing (#commandBar / #headerRegimeLine)');
    }
    renderAllCore();
    const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
    bootLog('debug', `renderAll ok ${elapsed.toFixed(1)}ms`);
    const prevOk = typeof window !== 'undefined' ? window.__WTM_LAST_RENDER_OK : true;
    if (typeof window !== 'undefined') window.__WTM_LAST_RENDER_OK = true;
    logConsoleGuard('success', { elapsedMs: Math.round(elapsed) });
    // Clear sticky FALLBACK only when recovering from a failed paint (not every keystroke re-render).
    if (typeof window !== 'undefined' && window.__WTM_BOOT_COMPLETE && prevOk === false) {
      signalBootCheck('RENDER SUCCESS');
    }
    return true;
  } catch (err) {
    console.error('[WTM] renderAll failed', err);
    if (typeof window !== 'undefined') window.__WTM_LAST_RENDER_OK = false;
    logConsoleGuard('error', { err: err.message || String(err) });
    signalBootCheck('RENDER ERROR: ' + (err.message || String(err)), true);
    renderAllFallback(err);
    return false;
  } finally {
    _renderDepth -= 1;
  }
}

if (typeof window !== 'undefined') {
  window.renderAll = renderAll;
}

function applyShock(shockId, skipSnapshot) {
  const shock = SHOCKS[shockId];
  if (!shock) return;
  const cfg = readShockConfigFromDOM();
  appState.tracer.shockConfig = cfg;
  if (!skipSnapshot && !preShockSnapshot) {
    preShockSnapshot = JSON.parse(JSON.stringify(buildStateFromDOM().tracer.horizons));
  }
  const horizonsToApply = cfg.intensity === 'mild' ? ['d1'] : HORIZONS;
  LADDER.forEach(row => {
    if ((cfg.disabledStages || []).includes(row.id)) return;
    const effects = shock.effects[row.id];
    if (!effects) return;
    horizonsToApply.forEach(h => {
      if (effects[h]) {
        const sel = el(`hz-${row.id}-${h}`);
        if (sel) sel.value = effects[h];
      }
    });
  });
  appState.tracer.activeShock = shockId;
  renderTracerVisual();
  renderAll();
  markDirty();
  const stageNote = (cfg.disabledStages || []).length ? ` · ${cfg.disabledStages.length} stage(s) skipped` : '';
  showToast(`Shock applied (${cfg.intensity}): ${shock.label}${stageNote}`);
}

function reevaluateTransmission() {
  const shockId = appState.tracer.activeShock;
  if (shockId && SHOCKS[shockId]) {
    applyShock(shockId, true);
  } else {
    renderTracerVisual();
    renderAll();
  }
  const health = computeHealthScore(buildStateFromDOM());
  markDirty();
  showToast(`Re-evaluated · Health ${health.score} (${health.label})`);
}

function clearShock() {
  if (preShockSnapshot) {
    LADDER.forEach(row => {
      HORIZONS.forEach(h => {
        const sel = el(`hz-${row.id}-${h}`);
        if (sel && preShockSnapshot[row.id]) sel.value = preShockSnapshot[row.id][h] || '';
      });
    });
    preShockSnapshot = null;
  }
  appState.tracer.activeShock = null;
  renderTracerVisual();
  markDirty();
  showToast('Shock cleared');
}

function buildL3Prompt() {
  const state = buildStateFromDOM();
  const gate = deriveGate(state);
  const { nearMonth, farMonth, basisSpread, refLow, refMid, refHigh, lastScan } = state.btcL3;
  const op = state.operator || createEmptyOperator();
  let extra = '\n\nOperator context:\n';
  extra += `- Execution Intent: ${op.executionIntent}\n`;
  extra += `- Operator Confidence: ${op.confidence}\n`;
  extra += `- Gate: ${gateStripTitle(gate)} (${gate.label})\n`;
  extra += `- Basis Regime: ${op.basisRegimeLabel}\n`;
  if (op.evidenceNote) extra += `- Evidence: ${op.evidenceNote}\n`;
  if (nearMonth || farMonth || basisSpread || refLow || refMid || refHigh) {
    extra += '\nManual spread inputs:\n';
    if (nearMonth) extra += `- Near Month: ${nearMonth}\n`;
    if (farMonth) extra += `- Far Month: ${farMonth}\n`;
    if (basisSpread) extra += `- Basis Spread: ${basisSpread}\n`;
    if (refLow) extra += `- Ref Low: ${refLow}\n`;
    if (refMid) extra += `- Ref Mid: ${refMid}\n`;
    if (refHigh) extra += `- Ref High: ${refHigh}\n`;
  }
  if (lastScan?.result) extra += `\nL3 Scan Result: ${lastScan.result} — ${lastScan.reason || ''}\n`;
  return PROMPT_L3_BASE + extra;
}

function setLastOpened(id, iso) {
  const n = el(id);
  if (iso) {
    n.textContent = typeof window.WTM_formatLocalStamp === 'function'
      ? window.WTM_formatLocalStamp(iso)
      : new Date(iso).toLocaleString();
    n.dataset.ts = iso;
  } else {
    n.textContent = 'Never';
    delete n.dataset.ts;
  }
}

function setSaveIndicator(t, ok) { el('saveIndicator').textContent = t; el('saveIndicator').classList.toggle('text-wtm-green', !!ok); el('saveIndicator').classList.toggle('text-wtm-muted', !ok); }
function flashSave() { const b = el('btnSave'), o = b.textContent; b.textContent = 'Saved ✓'; setTimeout(() => b.textContent = o, 1200); }
function markDirty() { setSaveIndicator('Unsaved changes', false); }

function showToast(msg) {
  const t = el('toast'); t.textContent = msg; t.classList.remove('translate-y-20','opacity-0');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.add('translate-y-20','opacity-0'), 3000);
}

async function importFromPerplexity() {
  let text;
  try { text = await navigator.clipboard.readText(); } catch { showToast('Clipboard denied'); return; }
  const { fields, imported, format } = parsePerplexityText(text);
  if (!imported.length) { showToast('No WTM fields found in clipboard'); return; }
  applyImportFields(fields);
  markDirty();
  const fmt = format === RESEARCH_EXPORT_FORMAT ? 'WTM EXPORT v2.1'
    : format === RESEARCH_EXPORT_FORMAT_LEGACY ? 'WTM EXPORT v2.0'
    : format === CHINA_EXPORT_FORMAT ? CHINA_EXPORT_FORMAT : 'WTC';
  showToast(`Imported ${imported.length} field(s) · ${fmt}`);
}

async function exportForPerplexity() {
  const text = buildPerplexityExport();
  try {
    await navigator.clipboard.writeText(text);
    const btn = el('btnExport');
    const o = btn.textContent;
    btn.textContent = 'Exported ✓';
    setTimeout(() => btn.textContent = o, 2000);
    showToast('State exported — paste into Perplexity');
  } catch { showToast('Clipboard denied'); }
}

function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('tab-active', b.dataset.tab === name));
  document.querySelectorAll('[data-panel]').forEach(p => p.classList.toggle('panel-hidden', p.dataset.panel !== name));
}

async function copyText(text, btn, label) {
  await navigator.clipboard.writeText(text);
  const o = btn.textContent; btn.textContent = 'Copied ✓';
  setTimeout(() => btn.textContent = o || label, 2000);
}

const THEME_STORAGE_KEY = (typeof WTM_Theme !== 'undefined' && WTM_Theme.STORAGE_KEY)
  ? WTM_Theme.STORAGE_KEY
  : 'whinfell_tc_theme';

function applyConsoleTheme(theme) {
  if (typeof WTM_Theme !== 'undefined' && WTM_Theme.applyTheme) {
    return WTM_Theme.applyTheme(theme);
  }
  const allowed = { dark: true, light: true, nature: true };
  const next = allowed[theme] ? theme : 'dark';
  if (!document.documentElement?.setAttribute) return next;
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch (_) { /* private browsing */ }
  return next;
}

function initConsoleTheme() {
  if (typeof WTM_Theme !== 'undefined' && WTM_Theme.initTheme) {
    return WTM_Theme.initTheme();
  }
  let stored = 'dark';
  try { stored = localStorage.getItem(THEME_STORAGE_KEY) || 'dark'; } catch (_) { /* ignore */ }
  return applyConsoleTheme(stored);
}

initConsoleTheme();
el('themeSelect')?.addEventListener('change', (e) => {
  applyConsoleTheme(e.target?.value || 'dark');
});

el('btnSignalDetail')?.addEventListener('click', () => setSignalDetailOpen(true));
el('btnCloseSignalDetail')?.addEventListener('click', () => setSignalDetailOpen(false));
el('signalDetailBackdrop')?.addEventListener('click', () => setSignalDetailOpen(false));

el('btnSave').onclick = persistState;
el('btnExport').onclick = exportForPerplexity;
el('btnExportPipeline').onclick = exportPipelineBundle;
function openHydrationFilePicker(shiftKey) {
  _hydrationImportForce = !!shiftKey;
  el('hydrationFileInput').click();
}

let _hydrationImportForce = false;
el('btnImportHydration').onclick = (e) => {
  _hydrationImportForce = !!(e && e.shiftKey);
  if (window.confirm(buildHydrationImportConfirmMessage('choose the file'))) {
    openHydrationFilePicker(_hydrationImportForce);
  }
};
el('btnHydrationBannerImport').onclick = () => openHydrationFilePicker(false);
el('btnHydrationBannerDismiss').onclick = () => {
  appState.ui = appState.ui || createEmptyState().ui;
  appState.ui.hydrationBannerDismissed = true;
  renderHydrationBanner(buildStateFromDOM());
  markDirty();
};
el('hydrationFileInput').onchange = e => {
  const f = e.target.files?.[0];
  if (f) importHydrationFile(f, { force: _hydrationImportForce });
  _hydrationImportForce = false;
  e.target.value = '';
};
el('btnAcceptTracer').onclick = acceptSuggestedTracer;
el('btnDismissTracer').onclick = dismissSuggestedTracer;
el('btnManualOverrideTracer').onclick = markTracerManualOverride;
el('btnImport').onclick = importFromPerplexity;
el('btnReevaluate').onclick = reevaluateTransmission;
el('btnSaveSnapshot').onclick = saveTracerSnapshot;
el('btnScanL3').onclick = runL3Scan;
el('btnRunScenarioLoop').onclick = runScenarioLoop;
el('btnKoyfin').onclick = () => { const u = el('urlKoyfin').value.trim(); if (!u) return showToast('Set URL'); window.open(u,'_blank','noopener'); setLastOpened('lastKoyfin', new Date().toISOString()); markDirty(); };
el('btnBarchart').onclick = () => { const u = el('urlBarchart').value.trim(); if (!u) return showToast('Set URL'); window.open(u,'_blank','noopener'); setLastOpened('lastBarchart', new Date().toISOString()); markDirty(); };
el('btnCopyL2').onclick = () => copyText(PROMPT_L2, el('btnCopyL2'), 'Copy Layer 2 Prompt');
el('btnCopyL3').onclick = () => copyText(buildL3Prompt(), el('btnCopyL3'), 'Copy Layer 3 Prompt');
el('btnCopyGrokPrompt').onclick = async () => {
  try {
    await copyText(buildGrokPromptPackage(), el('btnCopyGrokPrompt'), 'Copy Grok prompt');
    showToast('Grok prompt + state object copied');
  } catch { showToast('Clipboard denied'); }
};
el('btnClearShock').onclick = clearShock;
document.querySelectorAll('.shock-btn').forEach(b => b.onclick = () => applyShock(b.dataset.shock));
document.querySelectorAll('.tab-btn').forEach(b => b.onclick = () => switchTab(b.dataset.tab));

['whinfellScore','regimeTag','urlKoyfin','urlBarchart','grossA','grossB','capitalBaseMm','handoverNote','l3NearMonth','l3FarMonth','l3BasisSpread','l3RefLow','l3RefMid','l3RefHigh','chinaPolicyStrength','chinaStateImpulse','chinaGrowthImpulse','chinaRegimeTag','evidenceNote','keyObservation'].forEach(id => {
  const node = el(id);
  if (!node) return;
  node.addEventListener('input', () => {
    if (!['evidenceNote', 'keyObservation', 'l3NearMonth', 'l3FarMonth', 'l3BasisSpread', 'l3RefLow', 'l3RefMid', 'l3RefHigh'].includes(id)) {
      markCommandBarManualOverride();
    }
    renderAll();
    markDirty();
  });
});
['operatorConfidence', 'shockProbability'].forEach(id => {
  const node = el(id);
  if (!node) return;
  node.addEventListener('input', () => {
    if (id === 'operatorConfidence' && el('operatorConfidenceValue')) {
      el('operatorConfidenceValue').textContent = el('operatorConfidence').value;
    }
    renderAll();
    markDirty();
  });
});
['executionIntent', 'shockHorizon', 'basisRegimeLabel'].forEach(id => {
  const node = el(id);
  if (!node) return;
  node.addEventListener('change', () => { renderAll(); markDirty(); });
});
el('transmissionState').onchange = () => { renderAll(); markDirty(); };
el('posture').onchange = () => { appState.grossRisk.postureManual = !!el('posture').value; renderAll(); markDirty(); };
el('btnToggleGateDetail').onclick = () => {
  appState.ui = appState.ui || createEmptyState().ui;
  appState.ui.gateDetailOpen = !appState.ui.gateDetailOpen;
  if (appState.ui.gateDetailOpen && appState.ui.postImportWorkflow?.importAt) {
    appState.ui.postImportWorkflow.ladderReviewed = true;
  }
  renderAll();
};
document.querySelectorAll('.track-toggle').forEach(btn => {
  btn.onclick = () => { applyTrackView(btn.dataset.track); markDirty(); };
});
el('btnWorkspaceToggle')?.addEventListener('click', () => {
  const next = appState.ui?.workspaceView === 'cockpit' ? 'legacy' : 'cockpit';
  applyWorkspaceView(next);
  markDirty();
});
el('btnDeskDocs')?.addEventListener('click', () => openDeskDocsPanel());
el('btnCloseDeskDocs')?.addEventListener('click', () => setDeskDocsOpen(false));
el('deskDocsBackdrop')?.addEventListener('click', () => setDeskDocsOpen(false));
el('btnExportNode').onclick = () => {
  const cockpit = mergeNodeCockpit(activeNodeId(), buildStateFromDOM());
  const lines = [
    `--- NODE COCKPIT: ${cockpit.display_name} ---`,
    `Node ID: ${cockpit.node_id}`,
    `Composite Score: ${cockpit.composite_score}`,
    `Band: ${cockpit.band}`,
    `Directional: ${cockpit.directional?.posture} (${cockpit.directional?.conviction})`,
    `Relative Value: ${cockpit.relative_value?.posture} — ${cockpit.relative_value?.structure}`,
    `Key Observation: ${cockpit.key_observation}`,
  ];
  copyText(lines.join('\n'), el('btnExportNode'), 'Export node');
};
el('btnHeresWhy').onclick = () => toggleFocusMode();
el('btnCompareMode').onclick = () => toggleCompareMode();
el('btnFlipPrev')?.addEventListener('click', () => flipNode(-1));
el('btnFlipNext')?.addEventListener('click', () => flipNode(1));
el('btnShortcutHelp')?.addEventListener('click', () => {
  showToast('Shift+click a rail tab while Compare is on to add/remove nodes (max 3) without leaving your current view.');
});
document.addEventListener('keydown', handleCockpitKeyboard);

async function runBootSequence() {
  window.__WTM_CORE_READY = false;
  window.__WTM_BOOT_COMPLETE = false;
  window.__WTM_BOOT_FAILED = false;
  signalBootCheck('BOOT: wiring…');
  bootLog('info', `runBootSequence safe_boot=${SAFE_BOOT} verbose=${WTM_BOOT_VERBOSE}`);

  try {
    const tcBuildBadge = el('tcConsoleBuildBadge');
    if (tcBuildBadge) tcBuildBadge.textContent = TC_CONSOLE_BUILD;

    bootLog('info', 'phase=panels');
    renderDeskDocsPanel();
    renderPrompts();
    renderShockStageChecks();
    renderTracerHorizonTable();
    initScenarioLoop();

    bootLog('info', 'phase=state');
    applyStateToDOM(loadState());
    if (!appState.provenance?.hydratedAt || !appState.hydration?.node_cockpits) {
      appState.ui = appState.ui || createEmptyState().ui;
      appState.ui.hydrationBannerDismissed = false;
    }

    bootLog('info', 'phase=workspace');
    applyWorkspaceView(appState.ui?.workspaceView || 'cockpit');
    applyTrackView(appState.ui?.trackView || 'both');

    window.__WTM_CORE_READY = true;
    window.renderAll = renderAll;

    bootLog('info', 'phase=ia_shell');
    if (typeof WTM_DataDictionary !== 'undefined' && typeof WTM_DataDictionary.init === 'function') {
      try { WTM_DataDictionary.init(); } catch (ddErr) {
        bootLog('warn', 'DataDictionary.init skipped', ddErr);
      }
    }
    if (typeof WTM_IaShell !== 'undefined' && typeof WTM_IaShell.init === 'function') {
      try { WTM_IaShell.init(); } catch (shellErr) {
        bootLog('warn', 'IaShell.init skipped', shellErr);
      }
    }

    bootLog('info', 'phase=basis_watch');
    if (typeof WTM_BasisWatch !== 'undefined') {
      try {
        WTM_BasisWatch.init({ getState: () => appState, renderAll });
      } catch (bwErr) {
        bootLog('warn', 'BasisWatch.init skipped', bwErr);
      }
    }

    bootLog('info', 'phase=hydrate');
    let hydrated = false;
    if (!SAFE_BOOT) {
      try {
        hydrated = await tryAutoHydrateFromDeploy();
      } catch (hErr) {
        bootLog('warn', 'auto-hydrate error', hErr);
      }
    } else {
      bootLog('info', 'safe_boot — auto-hydrate skipped');
    }

    bootLog('info', `phase=render hydrated=${hydrated}`);
    const paintOk = renderAll();
    logConsoleGuard(paintOk ? 'boot_render_ok' : 'boot_render_fallback', { hydrated });

    if (location.protocol !== 'file:') {
      try { await loadWebPublishStamp(); } catch (_) { /* non-fatal */ }
    }
    if (typeof WTM_PublishWeb !== 'undefined' && typeof WTM_PublishWeb.hideLocalOnlyControls === 'function') {
      try { WTM_PublishWeb.hideLocalOnlyControls(); } catch (_) { /* ignore */ }
    }

    window.__WTM_BOOTED = true;
    window.__WTM_BOOT_COMPLETE = true;
    // Clear any premature bootstrap timeout flag once core finishes.
    window.__WTM_BOOT_FAILED = false;
    // Only claim SUCCESS when last full paint succeeded. Sticky FALLBACK with a
    // healthy desk was the hard-refresh mis-render; recovery happens on next ok paint.
    if (paintOk || window.__WTM_LAST_RENDER_OK) {
      signalBootCheck('RENDER SUCCESS');
    } else {
      signalBootCheck('RENDER FALLBACK', true);
      bootLog('warn', 'boot complete with FALLBACK — full paint failed; UI may be partial');
    }
    bootLog('info', 'boot complete');

    // Post-boot prompts + secondary lists after first paint (dialog stays responsive).
    scheduleDeferredWork('boot_finish', async () => {
      await yieldToMain();
      maybePromptFirstHydrationImport(buildStateFromDOM());
      if (scenarioLoop.variants[0]) {
        const s = buildStateFromDOM();
        scenarioLoop.variants[0].whinfellScore = s.intake.whinfellScore;
        scenarioLoop.variants[0].transmissionState = s.intake.transmissionState;
        scenarioLoop.variants[0].regimeTag = s.intake.regimeTag;
        renderScenarioColumns();
      }
      renderSnapshotList();
    });
  } catch (bootErr) {
    window.__WTM_BOOT_FAILED = true;
    bootLog('error', 'runBootSequence failed', bootErr);
    signalBootCheck('BOOT ERROR: ' + (bootErr.message || String(bootErr)), true);
    try { renderAllFallback(bootErr); } catch (_) { /* last resort */ }
  }
}

runBootSequence();

function ensureCockpitMissionView() {
  appState.navigation = appState.navigation || createEmptyNavigation();
  appState.navigation.focus_mode = false;
  appState.navigation.focus_node_id = null;
  if (appState.navigation.view_mode === 'compare') {
    appState.navigation.view_mode = 'flip';
    appState.navigation.compare_node_ids = [];
  }
}

function runMissionSurfaceProbe(nodeId, bundle, options = {}) {
  if (!bundle || typeof bundle !== 'object') {
    return { error: 'bundle required' };
  }
  hydrateFromBundle(bundle);
  ensureCockpitMissionView();
  if (options.chinaInputs) {
    if (el('chinaPolicyStrength')) el('chinaPolicyStrength').value = String(options.chinaInputs.policy ?? '50');
    if (el('chinaStateImpulse')) el('chinaStateImpulse').value = String(options.chinaInputs.state ?? '0');
    if (el('chinaGrowthImpulse')) el('chinaGrowthImpulse').value = String(options.chinaInputs.growth ?? '0');
  }
  appState.ui = appState.ui || createEmptyState().ui;
  appState.ui.workspaceView = 'cockpit';
  setActiveNode(nodeId);
  renderNodeCockpitShell(buildStateFromDOM());
  const cockpit = mergeNodeCockpit(nodeId, buildStateFromDOM());
  const gate = deriveGate(buildStateFromDOM());
  const tacticalLead = el('basisTacticalSentence')?.textContent || '';
  const tacticalSuffix = el('basisTacticalSuffix')?.textContent || '';
  const railHtml = el('cockpitDecisionRail')?.innerHTML || '';
  const chips = buildMissionImplicationChips(cockpit, gate).map(c => c.label);
  const readingValue = el('basisReadingValue')?.textContent || '';
  return {
    nodeId,
    tacticalLead,
    tacticalSuffix,
    tactical: tacticalSuffix ? `${tacticalLead} ${tacticalSuffix}` : tacticalLead,
    gateChip: resolveMissionGateChipLabel(gate),
    chips,
    railHtml,
    railHasHorizonNet: /horizon-net fallback/i.test(railHtml),
    sq3Score: gate.sq3Score,
    compositeFallback: chips.includes('Composite fallback'),
    readingValue,
    bandChip: chips[0] || '',
    missionVisible: !el('basisTacticalBanner')?.classList.contains('zone-hidden'),
  };
}

window.runMissionSurfaceProbe = runMissionSurfaceProbe;

window.__creditMissionProbe = function creditMissionProbe(bundle) {
  return runMissionSurfaceProbe('credit', bundle, {
    chinaInputs: { policy: 50, state: 0, growth: 0 },
  });
};

window.__liquidityMissionProbe = function liquidityMissionProbe(bundle) {
  return runMissionSurfaceProbe('liquidity', bundle, {
    chinaInputs: { policy: 50, state: 0, growth: 0 },
  });
};

window.__breadthMissionProbe = function breadthMissionProbe(bundle) {
  return runMissionSurfaceProbe('breadth', bundle, {
    chinaInputs: { policy: 50, state: 0, growth: 0 },
  });
};

window.__highbetaMissionProbe = function highbetaMissionProbe(bundle) {
  return runMissionSurfaceProbe('highbeta', bundle, {
    chinaInputs: { policy: 50, state: 0, growth: 0 },
  });
};

window.__uiAuditProbe = function uiAuditProbe(bundle) {
  if (!bundle || typeof bundle !== 'object') return { error: 'bundle required' };
  hydrateFromBundle(bundle);
  appState.ui = appState.ui || createEmptyState().ui;
  appState.ui.workspaceView = 'cockpit';
  renderNodeCockpitShell(buildStateFromDOM());
  const state = buildStateFromDOM();
  const payload = buildUiAuditPayload(state);
  const ddHtml = el('dataDictionaryAudit')?.innerHTML || '';
  const flipPos = el('flipchartPosition')?.textContent || '';
  const flipTitle = el('flipchartTitle')?.textContent || '';
  const coverageMode = el('nodeCoverageBanner')?.className || '';
  const failureCodes = [...document.querySelectorAll('[data-failure-code]')].map(n => n.dataset.failureCode);
  return {
    consoleBuild: TC_CONSOLE_BUILD,
    coverageMode: payload.coverage_mode,
    impairmentDriver: payload.impairment_driver,
    dictionaryAuditCount: payload.dictionary_audit_count,
    flipPosition: flipPos,
    flipTitle,
    hasDdAuditTable: ddHtml.includes('dd-audit-table'),
    hasFlipchartState: flipPos.includes('/'),
    failureCodesPresent: failureCodes.length > 0,
    failureCodes,
    uiAudit: payload,
  };
};

window.__testExports = {
  resolveRvHorizonValueFallback,
  buildRvHorizonEvidenceMarkup,
  prepareHydrationBundle,
  resolveSafeBoot,
  renderAll,
  renderAllCore,
  renderAllFallback,
  runBootSequence,
  bootLog,
  logConsoleGuard,
  consoleCanRenderSuccess,
  yieldToMain,
  scheduleDeferredWork,
  scheduleHeavyPanelRefresh,
  renderCommandBar,
  buildCommandBarKpiContext,
  SAFE_BOOT,
  DD_META_POLLING_ENABLED,
};

window.__rvHorizonEvidenceProbe = function rvHorizonEvidenceProbe(bundle, nodeId = 'credit') {
  if (!bundle || typeof bundle !== 'object') return { error: 'bundle required' };
  hydrateFromBundle(bundle);
  appState.ui = appState.ui || createEmptyState().ui;
  appState.ui.workspaceView = 'cockpit';
  const prevFocus = appState.navigation?.focus_mode;
  const prevFocusNode = appState.navigation?.focus_node_id;
  setActiveNode(nodeId);
  toggleFocusMode(true);
  renderNodeCockpitShell(buildStateFromDOM());
  const cockpit = mergeNodeCockpit(nodeId, buildStateFromDOM());
  const seriesMap = cockpit.rv_basis?.series || {};
  const seriesId = cockpit.rv_basis?.active_series_id || Object.keys(seriesMap)[0];
  const series = seriesId ? seriesMap[seriesId] : null;
  const markup = buildRvHorizonEvidenceMarkup(cockpit, series);
  const focusHtml = el('cockpitFocusLayer')?.innerHTML || '';
  const spotFormatted = markup.fallback?.mode === 'spot' && Number.isFinite(markup.fallback.spotValue)
    ? formatChartValue(markup.fallback.spotValue, markup.fallback.unit)
    : null;
  const spotValueRepeatCount = spotFormatted
    ? (focusHtml.split(spotFormatted).length - 1)
    : 0;
  const result = {
    nodeId,
    fallbackMode: markup.fallback?.mode || 'none',
    spotFormatted,
    spotFallbackTable: focusHtml.includes('focus-horizon-table--spot-fallback'),
    spotValueRepeatCount,
    hasSpotNote: /Single spot reading/i.test(focusHtml),
    primaryHorizon: markup.fallback?.primaryHorizon || null,
    focusHtml,
  };
  if (prevFocus) {
    appState.navigation = appState.navigation || createEmptyNavigation();
    appState.navigation.focus_mode = true;
    appState.navigation.focus_node_id = prevFocusNode || nodeId;
  } else {
    ensureCockpitMissionView();
    renderNodeCockpitShell(buildStateFromDOM());
  }
  return result;
};

console.log('%c[Whinfell TC] Core parsed — boot sequence async', 'color:lime;font-weight:bold');
