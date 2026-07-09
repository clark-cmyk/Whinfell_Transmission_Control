/**
 * Articulate — composable intelligence layer.
 * Builds floor-trader analysis prompts from panel data, copies to clipboard, logs sessions.
 * Does not load raw data files (uses panel state / Ark stamps only).
 */
(function articulateModule(global) {
  'use strict';

  const BUILD = 'ARTICULATE-1.0.0-2026-07-09';
  const LOG_KEY = 'wtm_articulate_log_v1';
  const MAX_LOG_ENTRIES = 50;

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
        lines.push(`As of: ${model.hydrationAsOf || model.asOf}`);
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

    lines.push(`Report as_of: ${r.as_of || '—'}`);
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
      lines.push(
        `Hydration meta: as_of=${h.as_of || '—'} snapshot=${h.snapshot_id || '—'} `
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
    runArticulate: runArticulate,
    runBasisWatch: runBasisWatch,
    runBbdm: runBbdm,
  };

  global.WTM_Articulate = api;
})(typeof window !== 'undefined' ? window : globalThis);
