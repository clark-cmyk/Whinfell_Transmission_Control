#!/usr/bin/env node
/** Phase 1 — WTM_DataStates taxonomy + helpers */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

class ElementShim {
  constructor() {
    this.dataset = {};
    this.classList = {
      _set: new Set(),
      add: (...cls) => cls.forEach(c => this.classList._set.add(c)),
      remove: (...cls) => cls.forEach(c => this.classList._set.delete(c)),
      contains: (c) => this.classList._set.has(c),
    };
    this.children = [];
  }

  querySelector(sel) {
    if (sel === '.ds-label') return this._label || null;
    if (sel === '.ds-value') return this._value || null;
    if (sel === '.ds-meta') return this._meta || null;
    if (sel === '.ds-state-badge') return this._badge || null;
    return null;
  }
}

function loadDataStates() {
  const src = fs.readFileSync(path.join(ROOT, 'js/data_states.js'), 'utf8');
  const sandbox = { window: {}, console };
  sandbox.window = sandbox;
  vm.runInContext(src, vm.createContext(sandbox), { filename: 'data_states.js' });
  return sandbox.WTM_DataStates;
}

function run() {
  const DS = loadDataStates();
  assert(DS, 'WTM_DataStates exported');
  assert(DS.DATA_STATES_BUILD.includes('PHASE1'), 'build stamp');

  const expected = [
    'quarantined', 'blocked', 'unavailable', 'stale', 'partial', 'not_computed', 'healthy',
  ];
  assert(DS.STATES.length === 7, 'seven states');
  assert(DS.PRIORITY.join() === expected.join(), 'priority order');
  for (const st of expected) {
    assert(DS.LABELS[st], `label for ${st}`);
    assert(DS.MEANINGS[st]?.meaning, `meaning for ${st}`);
    assert(DS.MEANINGS[st]?.uiTreatment, `uiTreatment for ${st}`);
  }

  assert(DS.isBlank(null) && DS.isBlank('—') && DS.isBlank('N/A'), 'isBlank');
  assert(!DS.isBlank(42) && !DS.isBlank('0.12'), 'isBlank preserves values');

  assert(DS.classify(72, {}) === 'healthy', 'healthy numeric');
  assert(DS.classify(null, { quarantined: true }) === 'quarantined', 'quarantined wins');
  assert(DS.classify(72, { blocked: true, quarantined: true }) === 'quarantined', 'precedence');
  assert(DS.classify(null, { blocked: true }) === 'blocked', 'blocked');
  assert(DS.classify(null, { hydrated: false }) === 'unavailable', 'unhydrated blank');
  assert(DS.classify(null, { allowPartial: true }) === 'partial', 'partial blank');
  assert(DS.classify(null, {}) === 'not_computed', 'blank default');
  assert(DS.classify('1.2', { freshness: 'stale' }) === 'stale', 'freshness stale');
  assert(DS.classify('1.2', { freshness: 'aging' }) === 'partial', 'freshness aging');
  assert(DS.classify('1.2', { freshness: 'aging', strictFresh: true }) === 'stale', 'strict aging');

  assert(DS.displayValue(null, 'not_computed') === 'Not computed', 'display not_computed');
  assert(DS.displayValue(null, 'unavailable') === 'Unavailable', 'display unavailable');
  assert(DS.displayValue('—', 'partial') === 'Partial', 'display partial blank');
  assert(DS.displayValue(0.42, 'healthy') === '0.42', 'display healthy value');

  assert(DS.fromFailureKey('gate_suppressed') === 'blocked', 'failure blocked');
  assert(DS.fromFailureKey('transform_failed') === 'quarantined', 'failure quarantined');
  assert(DS.fromFailureKey('unknown_key') === 'not_computed', 'failure fallback');
  const fm = DS.failureMeta('data_stale', { hint: 'Flows 3d old' });
  assert(fm.stale && fm.reason === 'Flows 3d old', 'failureMeta hint');

  const fresh = DS.fromFreshness('fresh');
  assert(fresh.freshness === 'fresh' && !fresh.unavailable, 'fromFreshness fresh');
  assert(DS.fromFreshness('stale').stale === true, 'fromFreshness stale');
  assert(DS.fromFreshness('aging').partial === true, 'fromFreshness aging');

  const resolved = DS.makeState(null, { blocked: true, blockReason: 'SQ3 gate' });
  assert(resolved.state === 'blocked', 'makeState state');
  assert(resolved.status === 'blocked', 'makeState status');
  assert(resolved.display === 'Blocked', 'makeState display');
  assert(resolved.reason === 'SQ3 gate', 'makeState reason');
  assert(resolved.cssClass === 'ds--blocked', 'makeState cssClass');
  assert(resolved.value === null, 'makeState null value');
  assert(Object.isFrozen(resolved), 'makeState frozen');

  const healthy = DS.resolve(88, { freshness: 'fresh' });
  assert(healthy.state === 'healthy' && healthy.freshness === 'fresh', 'resolve healthy');

  assert(DS.isSemanticNull(null, 'healthy'), 'semantic null blank');
  assert(DS.isSemanticNull(1, 'not_computed'), 'semantic null forced state');
  assert(!DS.isSemanticNull(1, 'healthy'), 'semantic null has value');

  const tile = DS.tileHtml('kpi-score', 'Score <b>', null, null, { not_computed: true, hint: 'Awaiting run' });
  assert(tile.includes('id="kpi-score"'), 'tile id');
  assert(tile.includes('data-data-state="not_computed"'), 'tile state');
  assert(tile.includes('Score &lt;b&gt;'), 'tile escapes label');
  assert(tile.includes('Awaiting run'), 'tile meta');
  assert(tile.includes('data-agent-reason='), 'tile reason attr');

  const cell = DS.cellHtml('—', 'stale', { reason: 'Export 2d old' });
  assert(cell.startsWith('<td class="ds-cell ds--stale"'), 'cell markup');
  assert(cell.includes('Export 2d old'), 'cell reason');

  const badge = DS.badgeHtml('partial');
  assert(badge.includes('ds--partial') && badge.includes('Partial'), 'badge');

  const el = new ElementShim();
  el._label = { textContent: '' };
  el._value = { textContent: '' };
  el._badge = { textContent: '' };
  el._meta = { textContent: '' };
  DS.apply(el, 'stale', { value: '—', label: 'Basis %', meta: { hint: '2d old' } });
  assert(el.dataset.dataState === 'stale', 'apply dataState');
  assert(el.dataset.agentReason, 'apply agentReason');
  assert(el.classList.contains('ds--stale'), 'apply css');
  assert(el._value.textContent === 'Stale', 'apply display');
  assert(el._badge.textContent === 'Stale', 'apply badge');

  assert(DS.normalize('bogus') === 'not_computed', 'normalize invalid');
  assert(DS.normalize('healthy') === 'healthy', 'normalize valid');

  console.log([
    'PASS data_states.test.mjs',
    `build=${DS.DATA_STATES_BUILD}`,
    `states=${DS.STATES.length}`,
    `priority=${DS.PRIORITY[0]}→${DS.PRIORITY[DS.PRIORITY.length - 1]}`,
  ].join('\n'));
}

try {
  run();
} catch (err) {
  console.error(`FAIL data_states.test.mjs: ${err.message}`);
  process.exit(1);
}