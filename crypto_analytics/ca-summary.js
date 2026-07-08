/**
 * CME Crypto Analytics — shared summary strip.
 * @module CASummary
 */
(function cryptoAnalyticsSummary(global) {
  'use strict';

  const M = global.CAModels;

  function el(id) {
    return document.getElementById(id);
  }

  function renderSummary(asset, row) {
    const title = el('caSummaryTitle');
    const body = el('caSummaryBody');
    if (!title || !body) return;

    title.textContent = `LATEST ANNUALIZED BASIS FOR ${asset}`;

    if (!row) {
      body.innerHTML = '<tr><td colspan="6" style="color:#555">—</td></tr>';
      return;
    }

    const snap = M.buildBasisSnapshotRow(row) || row;
    body.innerHTML = `
      <tr>
        <td>${snap.contract_symbol || '—'}</td>
        <td>${M.formatDateMDY(snap.expiry_date)}</td>
        <td>${snap.dte ?? '—'}</td>
        <td>${M.formatPrice(snap.future_price)}</td>
        <td>${M.formatPrice(snap.spot_marker)}</td>
        <td class="ca-summary-highlight">${M.formatPct(snap.annualized_basis_pct)}</td>
      </tr>`;
  }

  global.CASummary = { renderSummary };
})(typeof window !== 'undefined' ? window : globalThis);