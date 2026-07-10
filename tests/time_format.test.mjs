#!/usr/bin/env node
/** WTM local stamp format — 24h + system timezone abbreviation */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const src = fs.readFileSync(path.join(ROOT, 'js/time_format.js'), 'utf8');
const sandbox = { console };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.runInContext(src, vm.createContext(sandbox), { filename: 'time_format.js' });
const T = sandbox.WTM_Time;

assert(T && typeof T.formatLocalStamp === 'function', 'WTM_Time exported');

const d = new Date(2026, 6, 9, 23, 45, 0); // local Jul 9 2026 23:45
const stamp = T.formatLocalStamp(d);
assert(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2} /.test(stamp), `pattern ${stamp}`);
assert(stamp.startsWith('2026-07-09 23:45'), `expected 2026-07-09 23:45… got ${stamp}`);
assert(!/AM|PM/i.test(stamp), 'must be 24-hour (no AM/PM)');
assert(stamp.split(' ').length >= 3, `timezone present: ${stamp}`);

const iso = T.formatLocalStamp('2026-07-09T14:37:30+00:00');
assert(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2} /.test(iso), `iso local ${iso}`);

const dateOnly = T.formatLocalStamp('2026-07-09');
assert(dateOnly.startsWith('2026-07-09'), `date-only ${dateOnly}`);
assert(!/\d{2}:\d{2}/.test(dateOnly), `date-only has no clock time: ${dateOnly}`);

assert(T.formatLocalStamp(null) === '—', 'null fallback');
assert(T.formatLocalStamp('', { fallback: 'n/a' }) === 'n/a', 'empty fallback');
assert(typeof T.formatLocalNow() === 'string' && T.formatLocalNow().length > 10, 'now');

console.log([
  'PASS time_format.test.mjs',
  `sample=${stamp}`,
  `iso=${iso}`,
  `dateOnly=${dateOnly}`,
  `now=${T.formatLocalNow()}`,
].join('\n'));
