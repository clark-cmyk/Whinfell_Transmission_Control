/** Sources / data dictionary footer */
window.WMC = window.WMC || {};

WMC.Sources = {
  init() {
    const grid = document.getElementById('dictGrid');
    if (!grid) return;

    grid.innerHTML = Object.entries(window.WMC_DATA.sources).map(([, s]) => `
      <div class="wmc-dict-item">
        <strong>${s.label}</strong>
        <a href="${s.url}" target="_blank" rel="noopener">${s.url}</a>
        <p class="wmc-dict-fields">Fields: <code>${s.field}</code></p>
      </div>
    `).join('');
  },
};