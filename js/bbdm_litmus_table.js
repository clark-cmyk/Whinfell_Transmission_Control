/**
 * BBDM v2 Chunk 23 — Litmus shared table renderer (spec §5).
 * Column registry + litmus.tables[] mount + per-table Copy (TSV).
 */
(function bbdmLitmusTable(global) {
  'use strict';

  const BUILD = 'BBDM-LITMUS-TABLE-CHUNK23';

  const COLUMN_REGISTRY = Object.freeze({
    company: { label: 'Company', format: 'text', group: 'midwest' },
    segment: { label: 'Segment', format: 'text', group: 'midwest' },
    current_gm_pct: { label: 'Current GM%', format: 'pct', group: 'midwest' },
    avg_gm_3yr: { label: '3yr Avg', format: 'pct', group: 'midwest' },
    gm_z_3yr: { label: '3yr Z-Score', format: 'z', group: 'midwest' },
    quartile: { label: 'Quartile', format: 'text', group: 'midwest' },
    cloud_multiplier: { label: 'Cloud Multiplier', format: 'number', editable: true, group: 'midwest' },
    regime_signal: { label: 'Regime Signal', format: 'text', group: 'midwest' },
    status: { label: 'Status', format: 'status', group: 'shared' },
    signal: { label: 'Signal', format: 'text', group: 'crypto_market' },
    venue: { label: 'Venue', format: 'text', group: 'crypto_market' },
    funding_rate: { label: 'Funding Rate', format: 'rate', group: 'crypto_market' },
    open_interest_usd: { label: 'Open Interest ($)', format: 'usd', group: 'crypto_market' },
    metric: { label: 'Metric', format: 'text', group: 'miner' },
    value: { label: 'Value', format: 'number', group: 'miner' },
    unit: { label: 'Unit', format: 'text', group: 'miner' },
    trend: { label: 'Trend', format: 'text', group: 'miner' },
    indicator: { label: 'Indicator', format: 'text', group: 'eth_institutional' },
    reading: { label: 'Reading', format: 'text', group: 'eth_institutional' },
    source: { label: 'Source', format: 'text', group: 'eth_institutional' },
    spread_bps: { label: 'Spread (bps)', format: 'bps', group: 'sofr' },
    bank_nim: { label: 'Bank NIM', format: 'pct', group: 'sofr' },
    rrp_usage: { label: 'RRP Usage', format: 'text', group: 'sofr' },
    reserves_trend: { label: 'Reserves Trend', format: 'text', group: 'sofr' },
    financials_gm: { label: 'Financials GM', format: 'pct', group: 'curve' },
    industrials_gm: { label: 'Industrials GM', format: 'pct', group: 'curve' },
    cyclical_defensive_gap: { label: 'Cyclical vs Defensive Margin Gap', format: 'pct', group: 'curve' },
  });

  const TABLE_PROFILES = Object.freeze({
    midwest_corporate: {
      columns: ['company', 'segment', 'current_gm_pct', 'avg_gm_3yr', 'gm_z_3yr', 'quartile', 'cloud_multiplier', 'regime_signal', 'status'],
      tradeIds: ['midwest_basis', 'midwest_calendar'],
    },
    market_signals: {
      columns: ['signal', 'venue', 'funding_rate', 'open_interest_usd', 'status'],
      tradeIds: ['btc_basis', 'btc_calendar', 'eth_basis', 'eth_calendar'],
    },
    miner_signals: {
      columns: ['metric', 'value', 'unit', 'trend', 'status'],
      tradeIds: ['btc_basis', 'btc_calendar'],
    },
    eth_institutional: {
      columns: ['indicator', 'reading', 'source', 'status'],
      tradeIds: ['eth_basis', 'eth_calendar'],
    },
    sofr_fed_funds: {
      columns: ['signal', 'spread_bps', 'bank_nim', 'rrp_usage', 'reserves_trend', 'status'],
      tradeIds: ['sofr_fed_funds'],
    },
    curve_2s10s: {
      columns: ['signal', 'spread_bps', 'financials_gm', 'industrials_gm', 'bank_nim', 'cyclical_defensive_gap', 'status'],
      tradeIds: ['curve_2s10s'],
    },
  });

  const ALIGNMENT_LABELS = Object.freeze({
    confirm: 'Confirms signal',
    neutral: 'Neutral',
    contradict: 'Contradicts signal',
  });

  let copyToastTimer = null;

  function columnLabel(key) {
    return COLUMN_REGISTRY[key]?.label || String(key).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function isEditableColumn(key) {
    return Boolean(COLUMN_REGISTRY[key]?.editable);
  }

  function profileForColumns(columns) {
    const cols = (columns || []).join(',');
    for (const [id, profile] of Object.entries(TABLE_PROFILES)) {
      if (profile.columns.join(',') === cols) return id;
    }
    return null;
  }

  function formatCellValue(key, raw) {
    if (raw == null || raw === '') return '—';
    const fmt = COLUMN_REGISTRY[key]?.format || 'text';
    const n = Number(raw);
    switch (fmt) {
      case 'pct':
        return Number.isFinite(n) ? `${n.toFixed(1)}%` : String(raw);
      case 'z':
        return Number.isFinite(n) ? (n >= 0 ? `+${n.toFixed(2)}` : n.toFixed(2)) : String(raw);
      case 'rate':
        return Number.isFinite(n) ? `${(n * 100).toFixed(4)}%` : String(raw);
      case 'usd':
        if (!Number.isFinite(n)) return String(raw);
        if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
        if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
        return `$${n.toFixed(0)}`;
      case 'bps':
        return Number.isFinite(n) ? `${n.toFixed(1)} bps` : String(raw);
      case 'number':
        return Number.isFinite(n) ? (Number.isInteger(n) ? String(n) : n.toFixed(2)) : String(raw);
      case 'status':
        return String(raw).replace(/_/g, ' ');
      default:
        return String(raw);
    }
  }

  function escapeCsvCell(value) {
    const s = value == null ? '' : String(value);
    if (/[",\n\t]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  function tableToTsv(table) {
    const columns = table?.columns || [];
    const rows = table?.rows || [];
    const header = columns.map((col) => columnLabel(col)).join('\t');
    const body = rows.map((row) => columns.map((col) => {
      const raw = row?.[col];
      if (raw == null) return '';
      return isEditableColumn(col) ? String(raw) : formatCellValue(col, raw);
    }).join('\t')).join('\n');
    return body ? `${header}\n${body}` : header;
  }

  async function copyTable(table) {
    const text = tableToTsv(table);
    if (global.navigator?.clipboard?.writeText) {
      await global.navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  }

  function showCopyToast(mount, message) {
    const host = typeof mount === 'string' ? global.document?.querySelector(mount) : mount;
    if (!host) return;
    let toast = host.querySelector('.bbdm-litmus-copy-toast');
    if (!toast) {
      toast = global.document.createElement('div');
      toast.className = 'bbdm-litmus-copy-toast';
      host.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('bbdm-litmus-copy-toast--visible');
    if (copyToastTimer) global.clearTimeout(copyToastTimer);
    copyToastTimer = global.setTimeout(() => {
      toast.classList.remove('bbdm-litmus-copy-toast--visible');
    }, 1800);
  }

  function renderEditableInput(col, row, rowIndex, tableId) {
    const input = global.document.createElement('input');
    input.type = 'number';
    input.step = '0.1';
    input.min = '0';
    input.className = 'bbdm-litmus-input';
    input.value = row[col] == null ? '' : String(row[col]);
    input.dataset.litmusTable = tableId;
    input.dataset.litmusRow = String(rowIndex);
    input.dataset.litmusCol = col;
    input.setAttribute('aria-label', `${columnLabel(col)} row ${rowIndex + 1}`);
    return input;
  }

  function renderLitmusTable(table, opts = {}) {
    const columns = table?.columns || [];
    const rows = table?.rows || [];
    const tableId = table?.id || 'litmus-table';
    const collapsed = Boolean(table?.collapsed) && !opts.forceExpand;

    const wrap = global.document.createElement('section');
    wrap.className = 'bbdm-litmus-table' + (collapsed ? ' bbdm-litmus-table--collapsed' : '');
    wrap.dataset.litmusTableId = tableId;
    if (table?.trade_id) wrap.dataset.litmusTradeId = table.trade_id;
    if (table?.tier) wrap.dataset.litmusTier = table.tier;

    const head = global.document.createElement('header');
    head.className = 'bbdm-litmus-table__head';

    const titleBlock = global.document.createElement('div');
    titleBlock.className = 'bbdm-litmus-table__title-block';
    const title = global.document.createElement('h3');
    title.className = 'bbdm-litmus-table__title';
    title.textContent = table?.title || 'Litmus table';
    titleBlock.appendChild(title);

    if (table?.tier === 'secondary') {
      const tier = global.document.createElement('span');
      tier.className = 'bbdm-litmus-table__tier';
      tier.textContent = 'Nice-to-have';
      titleBlock.appendChild(tier);
    }

    head.appendChild(titleBlock);

    const actions = global.document.createElement('div');
    actions.className = 'bbdm-litmus-table__actions';

    if (table?.collapsed != null) {
      const toggle = global.document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'bbdm-litmus-btn bbdm-litmus-btn--ghost';
      toggle.textContent = collapsed ? 'Expand' : 'Collapse';
      toggle.addEventListener('click', () => {
        wrap.classList.toggle('bbdm-litmus-table--collapsed');
        toggle.textContent = wrap.classList.contains('bbdm-litmus-table--collapsed') ? 'Expand' : 'Collapse';
      });
      actions.appendChild(toggle);
    }

    const copyBtn = global.document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'bbdm-litmus-btn bbdm-litmus-btn--copy';
    copyBtn.textContent = 'Copy';
    copyBtn.setAttribute('aria-label', `Copy ${table?.title || 'table'} as TSV`);
    copyBtn.addEventListener('click', async () => {
      try {
        const ok = await copyTable(table);
        copyBtn.textContent = ok ? 'Copied' : 'Copy failed';
        global.setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1400);
      } catch (_) {
        copyBtn.textContent = 'Copy failed';
        global.setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1400);
      }
    });
    actions.appendChild(copyBtn);
    head.appendChild(actions);
    wrap.appendChild(head);

    const body = global.document.createElement('div');
    body.className = 'bbdm-litmus-table__body';

    const scroll = global.document.createElement('div');
    scroll.className = 'bbdm-litmus-table__scroll';

    const elTable = global.document.createElement('table');
    elTable.className = 'bbdm-litmus-grid';
    elTable.setAttribute('aria-label', table?.title || 'Litmus table');

    const thead = global.document.createElement('thead');
    const headRow = global.document.createElement('tr');
    columns.forEach((col) => {
      const th = global.document.createElement('th');
      th.scope = 'col';
      th.textContent = columnLabel(col);
      if (isEditableColumn(col)) th.classList.add('bbdm-litmus-grid__editable-col');
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    elTable.appendChild(thead);

    const tbody = global.document.createElement('tbody');
    if (!rows.length) {
      const tr = global.document.createElement('tr');
      const td = global.document.createElement('td');
      td.colSpan = Math.max(columns.length, 1);
      td.className = 'bbdm-litmus-grid__empty';
      td.textContent = 'No rows loaded — run data collect or Koyfin export.';
      tr.appendChild(td);
      tbody.appendChild(tr);
    } else {
      rows.forEach((row, rowIndex) => {
        const tr = global.document.createElement('tr');
        columns.forEach((col) => {
          const td = global.document.createElement('td');
          if (isEditableColumn(col) && opts.editable !== false) {
            td.appendChild(renderEditableInput(col, row, rowIndex, tableId));
          } else {
            td.textContent = formatCellValue(col, row?.[col]);
            if (col === 'status') td.classList.add('bbdm-litmus-grid__status');
          }
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    }
    elTable.appendChild(tbody);
    scroll.appendChild(elTable);
    body.appendChild(scroll);
    wrap.appendChild(body);

    return wrap;
  }

  function filterTables(litmus, opts = {}) {
    const tables = litmus?.tables || [];
    if (opts.tradeId) return tables.filter((t) => t.trade_id === opts.tradeId);
    if (opts.tableIds?.length) return tables.filter((t) => opts.tableIds.includes(t.id));
    return tables;
  }

  function renderLitmusBlock(litmus, opts = {}) {
    const root = global.document.createElement('div');
    root.className = 'bbdm-litmus-block' + (opts.compact ? ' bbdm-litmus-block--compact' : '');

    const tables = filterTables(litmus, opts);
    const byTrade = litmus?.by_trade || {};
    const tradeId = opts.tradeId;
    const entry = tradeId ? byTrade[tradeId] : null;

    if (entry?.alignment || entry?.headline) {
      const meta = global.document.createElement('div');
      meta.className = 'bbdm-litmus-block__meta';
      if (entry.alignment) {
        const badge = global.document.createElement('span');
        badge.className = `bbdm-litmus-align bbdm-litmus-align--${entry.alignment}`;
        badge.textContent = ALIGNMENT_LABELS[entry.alignment] || entry.alignment;
        meta.appendChild(badge);
      }
      if (entry.headline) {
        const headline = global.document.createElement('p');
        headline.className = 'bbdm-litmus-block__headline';
        headline.textContent = entry.headline;
        meta.appendChild(headline);
      }
      root.appendChild(meta);
    }

    if (litmus?.unprocessed_filing_count > 0) {
      const filing = global.document.createElement('div');
      filing.className = 'bbdm-litmus-filing-alert';
      const dot = global.document.createElement('span');
      dot.className = 'bbdm-litmus-filing-dot';
      dot.setAttribute('aria-hidden', 'true');
      const label = global.document.createElement('span');
      label.textContent = `${litmus.unprocessed_filing_count} unprocessed filing(s)`;
      filing.appendChild(dot);
      filing.appendChild(label);
      root.appendChild(filing);
    }

    if (!tables.length) {
      const empty = global.document.createElement('p');
      empty.className = 'bbdm-litmus-block__empty';
      empty.textContent = tradeId
        ? `No Litmus tables for ${tradeId}.`
        : 'No Litmus tables in report.';
      root.appendChild(empty);
      return root;
    }

    tables.forEach((table) => {
      root.appendChild(renderLitmusTable(table, opts));
    });
    return root;
  }

  function resolveMount(mount) {
    if (!mount) return null;
    if (typeof mount === 'string') return global.document.querySelector(mount) || global.document.getElementById(mount.replace(/^#/, ''));
    return mount;
  }

  function mount(mount, litmus, opts = {}) {
    const el = resolveMount(mount);
    if (!el || !litmus) return false;
    el.querySelectorAll('.bbdm-pane-placeholder').forEach((node) => node.remove());
    el.replaceChildren(renderLitmusBlock(litmus, opts));
    return true;
  }

  function mountTradeLitmus(mounts, litmus, tradeId) {
    const dig = resolveMount(mounts?.dig || '#bbdmDigLitmus');
    const iterate = resolveMount(mounts?.iterate || '#bbdmIterateLitmus');
    let ok = false;
    if (dig) ok = mount(dig, litmus, { tradeId, editable: true }) || ok;
    if (iterate) ok = mount(iterate, litmus, { tradeId, compact: true, editable: false }) || ok;
    return ok;
  }

  function mountLitmusPane(litmus) {
    const host = resolveMount('#bbdmLitmusHost');
    if (!host || !litmus) return false;
    host.querySelectorAll('.bbdm-pane-placeholder').forEach((node) => node.remove());
    let stack = host.querySelector('#bbdmLitmusStack');
    if (!stack) {
      stack = global.document.createElement('div');
      stack.id = 'bbdmLitmusStack';
      stack.className = 'bbdm-litmus-stack';
      host.prepend(stack);
    }
    return mount(stack, litmus, { forceExpand: true });
  }

  global.BBDM_LitmusTable = Object.freeze({
    BUILD,
    COLUMN_REGISTRY,
    TABLE_PROFILES,
    columnLabel,
    isEditableColumn,
    profileForColumns,
    formatCellValue,
    tableToTsv,
    copyTable,
    renderLitmusTable,
    renderLitmusBlock,
    filterTables,
    mount,
    mountTradeLitmus,
    mountLitmusPane,
  });
})(typeof window !== 'undefined' ? window : globalThis);