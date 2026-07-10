/**
 * WTM local timestamp formatting — single display standard across the desk.
 *
 * Output: "2026-07-09 23:45 CDT" (24-hour, user's system local timezone).
 * Date-only inputs (YYYY-MM-DD): "2026-07-09 CDT" (no invented clock time).
 */
(function wtmTimeFormat(global) {
  'use strict';

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function shortTzName(date) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(date);
      const part = parts.find((p) => p.type === 'timeZoneName');
      return part && part.value ? part.value : '';
    } catch (_) {
      return '';
    }
  }

  function isDateOnlyString(raw) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(raw || '').trim());
  }

  /**
   * Parse ISO / epoch / Date into a local Date. Date-only strings use local noon
   * so the calendar day does not slip across UTC boundaries.
   */
  function parseToDate(value) {
    if (value == null || value === '') return null;
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const s = String(value).trim();
    if (!s) return null;
    if (isDateOnlyString(s)) {
      const d = new Date(`${s}T12:00:00`);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  /**
   * @param {string|number|Date|null|undefined} value
   * @param {{ fallback?: string, dateOnly?: boolean }} [opts]
   * @returns {string}
   */
  function formatLocalStamp(value, opts) {
    const options = opts || {};
    const fallback = options.fallback != null ? options.fallback : '—';
    if (value == null || value === '') return fallback;

    const d = parseToDate(value);
    if (!d) return String(value);

    const y = d.getFullYear();
    const m = pad2(d.getMonth() + 1);
    const day = pad2(d.getDate());
    const tz = shortTzName(d);
    const dateOnly = options.dateOnly === true || isDateOnlyString(value);

    if (dateOnly) {
      return tz ? `${y}-${m}-${day} ${tz}` : `${y}-${m}-${day}`;
    }

    const hh = pad2(d.getHours());
    const mm = pad2(d.getMinutes());
    return tz ? `${y}-${m}-${day} ${hh}:${mm} ${tz}` : `${y}-${m}-${day} ${hh}:${mm}`;
  }

  function formatLocalNow() {
    return formatLocalStamp(new Date());
  }

  const api = {
    formatLocalStamp: formatLocalStamp,
    formatLocalNow: formatLocalNow,
    parseToDate: parseToDate,
    shortTzName: shortTzName,
    isDateOnlyString: isDateOnlyString,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.WTM_Time = api;
  global.WTM_formatLocalStamp = formatLocalStamp;
})(typeof window !== 'undefined' ? window : globalThis);
