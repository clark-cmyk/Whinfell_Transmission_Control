/**
 * Articulate — composable intelligence layer.
 * Builds floor-trader analysis prompts from panel data, copies to clipboard, logs sessions.
 * Does not load raw data files (uses panel state / Ark stamps only).
 */
(function articulateModule(global) {
  'use strict';

  const BUILD = 'ARTICULATE-1.1.0-2026-07-10';
  const LOG_KEY = 'wtm_articulate_log_v1';
  const MAX_LOG_ENTRIES = 50;
  /** WeakMap of elements already wired — avoids double-binding on remount. */
  const wiredButtons = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

  const INSTRUCTIONS = [
    'You are an experienced floor trader turned analyst. Start with the original thesis in 2–3 quick sentences, including the key mental math.',
    '',
    'Then hammer the original thesis with sharp, direct questions. Challenge every major assumption. Force me to defend or abandon parts of it.',
    '',
    'After hammering the thesis, give me 2–3 crisp new lines of inquiry or trade ideas worth exploring next. Use plain trader language. Keep it concise.',
  ].join('\n');

  function notify(msg) {
    if (typeof global.showToast === 'function') global.showToast(msg);
    else console.log('[Articulate]', msg);
  }

  function nowIso() {
    try {
      return new Date().toISOString();
    } catch (_) {
      return String(Date.now());
    }
  }

  function makeId() {
    return `a_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function formatNum(n, digits) {
    const d = digits == null ? 2 : digits;
    if (n == null || Number.isNaN(Number(n))) return '—';
    return Number(n).toFixed(d);
  }

  /**
   * Build the product trader-style prompt.
   * @param {{ panelId?: string, subject?: string, snapshot?: string, dataBlock?: string }} opts
   */
  function buildPrompt(opts) {
    const o = opts || {};
    const subject = o.subject || o.panelId || 'Panel';
    const snapshot = o.snapshot || 'unknown';
    const dataBlock = (o.dataBlock && String(o.dataBlock).trim())
      ? String(o.dataBlock).trim()
      : '(no quantitative snapshot available)';

    return [
      `**WTC Analysis — ${subject}**`,
      `**Snapshot:** ${snapshot}`,
      '',
      '**Current Data:**',
      dataBlock,
      '',
      '**Instructions:**',
      INSTRUCTIONS,
    ].join('\n');
  }

  async function copyPrompt(promptText) {
    const text = String(promptText || '');
    if (!text) return false;
    try {
      if (global.navigator?.clipboard?.writeText) {
        await global.navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) { /* fall through */ }
    return false;
  }

  function readLogRaw() {
    try {
      const raw = global.localStorage?.getItem(LOG_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function writeLogRaw(entries) {
    try {
      global.localStorage?.setItem(LOG_KEY, JSON.stringify(entries));
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * @param {{ panelId?: string, moduleName?: string, subject?: string, snapshot?: string, prompt?: string, promptPreview?: string }} entry
   */
  function logSession(entry) {
    const e = entry || {};
    const prompt = e.prompt != null ? String(e.prompt) : '';
    const preview = e.promptPreview != null
      ? String(e.promptPreview)
      : (prompt ? prompt.slice(0, 200) : '');
    const row = {
      id: makeId(),
      at: nowIso(),
      panelId: e.panelId || 'unknown',
      moduleName: e.moduleName || e.subject || e.panelId || 'Unknown',
      snapshot: e.snapshot || null,
      promptPreview: preview,
      prompt: prompt || null,
    };
    const list = readLogRaw();
    list.unshift(row);
    while (list.length > MAX_LOG_ENTRIES) list.pop();
    writeLogRaw(list);
    return row;
  }

  function listSessions() {
    return readLogRaw().slice();
  }

  function clearSessions() {
    try {
      global.localStorage?.removeItem(LOG_KEY);
    } catch (_) { /* ignore */ }
    return true;
  }

  function snapshotFromArkOrState(state) {
    const ark = global.WTM_Ark;
    if (ark && typeof ark.getStamp === 'function') {
      const s = ark.getStamp() || {};
      if (s.snapshot_id || s.as_of) {
        return [s.snapshot_id, s.as_of].filter(Boolean).join(' · ') || null;
      }
    }
    const asOf = state?.provenance?.dataAsOf
      || state?.hydration?.as_of
      || state?.as_of
      || null;
    const snap = state?.provenance?.snapshotId || state?.hydration?.snapshot_id || null;
    return [snap, asOf].filter(Boolean).join(' · ') || null;
  }

  /**
   * Build data block from BasisWatch state / last model.
   */
  function contextFromBasisWatch(state) {
    const s = state || {};
    const model = s._basisWatchModel || null;
    const bw = s.basisWatch || {};
    const lines = [];

    if (model) {
      lines.push(`Asset: ${model.asset?.label || model.assetKey || bw.asset || '—'}`);
      lines.push(`View: ${model.view || bw.view || 'basis'}`);
      lines.push(`Mode: ${model.mode || bw.mode || '—'}`);
      lines.push(`Shape: ${model.shape || '—'}`);
      lines.push(`Contracts: ${model.contracts?.length ?? 0}`);
      if (model.front) {
        const f = model.front;
        lines.push(
          `Front: ${f.symbol || '—'} · F=${formatNum(f.futuresPrice || f.price, 2)} `
          + `· spot=${formatNum(f.spotPrice, 2)} · basis%=${formatNum(f.spotBasisPct ?? f.pctBasis, 3)} `
          + `· ann%=${formatNum(f.spotAnnualizedCarry ?? f.annBasis, 2)} · DTE=${f.dte ?? '—'}`
        );
      }
      if (model.hydrationAsOf || model.asOf) {
        const rawAsOf = model.hydrationAsOf || model.asOf;
        const asOf = typeof global.WTM_formatLocalStamp === 'function'
          ? global.WTM_formatLocalStamp(rawAsOf)
          : rawAsOf;
        lines.push(`As of: ${asOf}`);
      }
      if (model.dataNote) lines.push(`Note: ${model.dataNote}`);
      // Top few contracts for mental math
      const top = (model.contracts || []).slice(0, 5);
      if (top.length) {
        lines.push('Curve nodes (top 5):');
        top.forEach((c) => {
          lines.push(
            `  ${c.symbol}: F=${formatNum(c.futuresPrice || c.price, 2)} `
            + `basis%=${formatNum(c.spotBasisPct ?? c.pctBasis, 3)} `
            + `ann%=${formatNum(c.spotAnnualizedCarry ?? c.annBasis, 2)} DTE=${c.dte ?? '—'}`
          );
        });
      }
    } else {
      lines.push(`Asset: ${bw.asset || '—'}`);
      lines.push(`View: ${bw.view || 'basis'}`);
      lines.push('(BasisWatch model not rendered yet — limited snapshot)');
    }

    return {
      panelId: 'basis_watch',
      moduleName: 'BasisWatch',
      subject: `BasisWatch · ${model?.asset?.label || bw.asset || 'BTC/ETH'}`,
      snapshot: snapshotFromArkOrState(s) || model?.hydrationAsOf || model?.asOf || nowIso(),
      dataBlock: lines.join('\n'),
    };
  }

  /**
   * Build data block from BBDM report object.
   */
  function contextFromBbdm(report) {
    const r = report || {};
    const summary = r.summary || {};
    const vc = summary.verdict_counts || {};
    const trades = Array.isArray(r.trades) ? r.trades : [];
    const lines = [];

    lines.push(`Report as_of: ${r.as_of
      ? (typeof global.WTM_formatLocalStamp === 'function' ? global.WTM_formatLocalStamp(r.as_of) : r.as_of)
      : '—'}`);
    lines.push(`Window days: ${r.window_days ?? '—'}`);
    lines.push(
      `Verdicts: BANG=${vc.BANG || 0} WATCH=${vc.WATCH || 0} `
      + `PASS=${vc.PASS || 0} BLOCKED=${vc.BLOCKED || 0}`
    );
    if (summary.top_z != null) lines.push(`Top |Z|: ${formatNum(summary.top_z, 2)}`);
    lines.push(`Trade count: ${trades.length}`);

    const ranked = trades
      .slice()
      .sort((a, b) => (b.z_abs ?? -1) - (a.z_abs ?? -1))
      .slice(0, 8);
    if (ranked.length) {
      lines.push('Top trades by |Z|:');
      ranked.forEach((t) => {
        lines.push(
          `  ${t.id || t.name || 'trade'}: verdict=${t.verdict || '—'} `
          + `z=${formatNum(t.z_score ?? t.z, 2)} |z|=${formatNum(t.z_abs, 2)} `
          + `type=${t.trade_type || '—'}`
        );
      });
    }

    if (r._hydrationMeta) {
      const h = r._hydrationMeta;
      const hAsOf = h.as_of
        ? (typeof global.WTM_formatLocalStamp === 'function' ? global.WTM_formatLocalStamp(h.as_of) : h.as_of)
        : '—';
      lines.push(
        `Hydration meta: as_of=${hAsOf} snapshot=${h.snapshot_id || '—'} `
        + `freshness=${h.freshness_status || '—'} score=${h.score ?? '—'}`
      );
    }

    const snap = r.as_of
      || snapshotFromArkOrState({})
      || nowIso();

    return {
      panelId: 'bbdm',
      moduleName: 'Bang Bang Da',
      subject: 'Bang Bang Da · RV Z-score scanner',
      snapshot: snap,
      dataBlock: lines.join('\n'),
    };
  }

  /**
   * Build → copy → log for a panel context object.
   * @returns {Promise<{ ok: boolean, prompt: string, entry: object|null, copied: boolean }>}
   */
  async function runArticulate(context) {
    const ctx = context || {};
    const prompt = buildPrompt({
      panelId: ctx.panelId,
      subject: ctx.subject || ctx.moduleName || ctx.panelId,
      snapshot: ctx.snapshot,
      dataBlock: ctx.dataBlock,
    });
    const copied = await copyPrompt(prompt);
    const entry = logSession({
      panelId: ctx.panelId,
      moduleName: ctx.moduleName || ctx.subject,
      subject: ctx.subject,
      snapshot: ctx.snapshot,
      prompt: prompt,
    });
    if (copied) notify(`Articulate · ${entry.moduleName} prompt copied`);
    else {
      notify('Articulate · clipboard denied (prompt logged)');
      console.log(prompt);
    }
    return { ok: true, prompt, entry, copied };
  }

  async function runBasisWatch(state) {
    return runArticulate(contextFromBasisWatch(state));
  }

  async function runBbdm(report) {
    return runArticulate(contextFromBbdm(report));
  }

  /**
   * Build data block from a Litmus table (or full litmus block).
   * @param {object} table — litmus.tables[] entry
   * @param {object} [litmus] — parent litmus block (alignment / by_trade)
   */
  function contextFromLitmus(table, litmus) {
    const t = table || {};
    const L = litmus || {};
    const columns = Array.isArray(t.columns) ? t.columns : [];
    const rows = Array.isArray(t.rows) ? t.rows : [];
    const lines = [];

    lines.push(`Table: ${t.title || t.id || 'Litmus'}`);
    lines.push(`Trade: ${t.trade_id || '—'}`);
    lines.push(`Tier: ${t.tier || 'primary'}`);
    lines.push(`Columns: ${columns.join(', ') || '—'}`);
    lines.push(`Row count: ${rows.length}`);

    const tradeMeta = t.trade_id && L.by_trade ? L.by_trade[t.trade_id] : null;
    if (tradeMeta?.alignment) lines.push(`Alignment: ${tradeMeta.alignment}`);
    if (tradeMeta?.headline) lines.push(`Headline: ${tradeMeta.headline}`);

    const preview = rows.slice(0, 8);
    if (preview.length) {
      lines.push('Rows (up to 8):');
      preview.forEach((row) => {
        if (!row || typeof row !== 'object') return;
        const company = row.company || row.ticker || row.signal || row.metric || '—';
        const bits = [];
        if (row.current_gm_pct != null) bits.push(`GM%=${formatNum(row.current_gm_pct, 2)}`);
        if (row.avg_gm_3yr != null) bits.push(`3yr=${formatNum(row.avg_gm_3yr, 2)}`);
        if (row.gm_z_3yr != null) bits.push(`z=${formatNum(row.gm_z_3yr, 2)}`);
        if (row.quartile) bits.push(`Q=${row.quartile}`);
        if (row.cloud_multiplier != null) bits.push(`cloud×=${formatNum(row.cloud_multiplier, 2)}`);
        if (row.regime_signal) bits.push(`regime=${row.regime_signal}`);
        if (row.status) bits.push(`status=${row.status}`);
        if (row.funding_rate != null) bits.push(`funding=${formatNum(row.funding_rate, 6)}`);
        if (row.open_interest_usd != null) bits.push(`OI=$${formatNum(row.open_interest_usd, 0)}`);
        lines.push(`  ${company}: ${bits.join(' · ') || JSON.stringify(row).slice(0, 120)}`);
      });
    } else {
      lines.push('(no Litmus rows loaded)');
    }

    const snap = snapshotFromArkOrState({}) || nowIso();
    return {
      panelId: t.id || 'litmus',
      moduleName: 'Litmus',
      subject: `Litmus · ${t.title || t.trade_id || t.id || 'table'}`,
      snapshot: snap,
      dataBlock: lines.join('\n'),
    };
  }

  /** Whole Litmus module (all tables) — used by pane-level A button. */
  function contextFromLitmusBlock(litmus) {
    const L = litmus || {};
    const tables = Array.isArray(L.tables) ? L.tables : [];
    const lines = [];
    lines.push(`Litmus tables: ${tables.length}`);
    if (L.unprocessed_filing_count > 0) {
      lines.push(`Unprocessed filings: ${L.unprocessed_filing_count}`);
    }
    tables.forEach((t) => {
      const ctx = contextFromLitmus(t, L);
      lines.push('');
      lines.push(`--- ${t.title || t.id} ---`);
      lines.push(ctx.dataBlock);
    });
    return {
      panelId: 'litmus',
      moduleName: 'Litmus',
      subject: 'Litmus · corporate & market reality check',
      snapshot: snapshotFromArkOrState({}) || nowIso(),
      dataBlock: lines.join('\n') || '(no Litmus tables)',
    };
  }

  async function runLitmus(table, litmus) {
    return runArticulate(contextFromLitmus(table, litmus));
  }

  async function runLitmusBlock(litmus) {
    return runArticulate(contextFromLitmusBlock(litmus));
  }

  /**
   * Register a click handler on an A button for any section.
   * @param {Element} el
   * @param {function(): object|Promise<object>|object} getContext — returns Articulate context
   * @returns {boolean}
   */
  function registerButton(el, getContext) {
    if (!el || typeof el.addEventListener !== 'function') return false;
    if (wiredButtons && wiredButtons.has(el)) return true;

    const handler = async (ev) => {
      try {
        ev?.preventDefault?.();
        ev?.stopPropagation?.();
      } catch (_) { /* ignore */ }
      try {
        let ctx = typeof getContext === 'function' ? getContext(el) : getContext;
        if (ctx && typeof ctx.then === 'function') ctx = await ctx;
        if (!ctx || typeof ctx !== 'object') {
          notify('Articulate · no context for this section');
          return;
        }
        await runArticulate(ctx);
      } catch (err) {
        console.warn('[Articulate] registerButton failed', err);
        notify('Articulate · failed');
      }
    };

    el.addEventListener('click', handler);
    if (wiredButtons) wiredButtons.set(el, handler);
    el.setAttribute('data-articulate-registered', '1');
    if (!el.getAttribute('title')) {
      el.setAttribute('title', 'Articulate · copy trader analysis prompt');
    }
    if (!el.getAttribute('aria-label')) {
      el.setAttribute('aria-label', 'Articulate · copy trader analysis prompt');
    }
    return true;
  }

  /**
   * Find all [data-articulate-section] nodes under root and register them.
   * Each node may set data-articulate-panel / data-articulate-subject.
   * @param {ParentNode} root
   * @param {function(Element): object} getContextForEl
   */
  function registerAllIn(root, getContextForEl) {
    if (!root || typeof root.querySelectorAll !== 'function') return 0;
    const nodes = root.querySelectorAll('[data-articulate-section], [data-articulate-btn]');
    let n = 0;
    nodes.forEach((el) => {
      const getter = typeof getContextForEl === 'function'
        ? () => getContextForEl(el)
        : () => ({
          panelId: el.getAttribute('data-articulate-panel') || el.id || 'section',
          moduleName: el.getAttribute('data-articulate-module') || 'Section',
          subject: el.getAttribute('data-articulate-subject') || el.getAttribute('data-articulate-module') || 'Section',
          snapshot: snapshotFromArkOrState({}) || nowIso(),
          dataBlock: el.getAttribute('data-articulate-data') || '(section snapshot unavailable)',
        });
      if (registerButton(el, getter)) n += 1;
    });
    return n;
  }

  const api = {
    BUILD: BUILD,
    LOG_KEY: LOG_KEY,
    MAX_LOG_ENTRIES: MAX_LOG_ENTRIES,
    buildPrompt: buildPrompt,
    copyPrompt: copyPrompt,
    logSession: logSession,
    listSessions: listSessions,
    clearSessions: clearSessions,
    contextFromBasisWatch: contextFromBasisWatch,
    contextFromBbdm: contextFromBbdm,
    contextFromLitmus: contextFromLitmus,
    contextFromLitmusBlock: contextFromLitmusBlock,
    runArticulate: runArticulate,
    runBasisWatch: runBasisWatch,
    runBbdm: runBbdm,
    runLitmus: runLitmus,
    runLitmusBlock: runLitmusBlock,
    registerButton: registerButton,
    registerAllIn: registerAllIn,
  };

  global.WTM_Articulate = api;
})(typeof window !== 'undefined' ? window : globalThis);
