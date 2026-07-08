/** Basis tracker — sortable table */
window.WMC = window.WMC || {};

WMC.Basis = {
  sortCol: 'z_score',
  sortDir: -1,

  init() {
    WMC.Basis.render();
    document.querySelectorAll('#basisTable th[data-sort]').forEach((th) => {
      th.addEventListener('click', () => {
        const col = th.dataset.sort;
        if (WMC.Basis.sortCol === col) WMC.Basis.sortDir *= -1;
        else { WMC.Basis.sortCol = col; WMC.Basis.sortDir = -1; }
        WMC.Basis.render();
      });
    });
  },

  sortRows(rows) {
    const { sortCol, sortDir } = WMC.Basis;
    return [...rows].sort((a, b) => {
      const av = a[sortCol];
      const bv = b[sortCol];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === 'string') return sortDir * av.localeCompare(bv);
      return sortDir * (av - bv);
    });
  },

  render() {
    const body = document.getElementById('basisBody');
    if (!body) return;
    const { fmt, dislocClass, cellClass } = WMC.Utils;
    const rows = WMC.Basis.sortRows(window.WMC_DATA.basis_tracker);

    body.innerHTML = rows.map((r) => `
      <tr>
        <td class="wmc-leg-name">${r.leg}</td>
        <td class="wmc-num ${cellClass('compute', r.compute, r)}">${fmt(r.compute)}</td>
        <td class="wmc-num ${cellClass('miso_power', r.miso_power, r)}">${fmt(r.miso_power)}</td>
        <td class="wmc-num ${cellClass('hy_gas', r.hy_gas, r)}">${fmt(r.hy_gas)}</td>
        <td class="wmc-num ${cellClass('hg_copper', r.hg_copper, r)}">${fmt(r.hg_copper)}</td>
        <td class="wmc-num ${cellClass('btc_basis', r.btc_basis, r)}">${r.btc_basis != null ? (r.btc_basis * 100).toFixed(1) + '%' : '—'}</td>
        <td class="wmc-num ${cellClass('z_score', r.z_score, r)}">${fmt(r.z_score, 1)}</td>
        <td><span class="wmc-disloc ${dislocClass(r.dislocation)}">${r.dislocation}</span></td>
      </tr>
    `).join('');

    document.querySelectorAll('#basisTable th').forEach((th) => {
      th.classList.toggle('wmc-sorted', th.dataset.sort === WMC.Basis.sortCol);
      const icon = th.querySelector('.wmc-sort-icon');
      if (icon) {
        icon.textContent = th.dataset.sort === WMC.Basis.sortCol
          ? (WMC.Basis.sortDir > 0 ? '↑' : '↓')
          : '↕';
      }
    });
  },
};