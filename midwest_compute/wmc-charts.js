/** Chart placeholders — WTC deep-links + sparklines */
window.WMC = window.WMC || {};

WMC.Charts = {
  init() {
    WMC.Charts.render();
    if (typeof window.addEventListener === 'function') {
      window.addEventListener('resize', WMC.Charts.redrawSparklines);
    }
  },

  render() {
    const host = document.getElementById('chartPlaceholders');
    if (!host) return;

    host.innerHTML = window.WMC_DATA.chart_placeholders.map((c, i) => `
      <article class="wmc-chart-card">
        <a href="./index.html${c.wtc_hash}" target="_blank" rel="noopener">
          <h3 class="wmc-chart-title">${c.title}</h3>
          <p class="wmc-chart-desc">${c.desc}</p>
          <canvas class="wmc-mini-chart" id="spark-${i}" data-spark-seed="${c.panel}" aria-hidden="true"></canvas>
          <span class="wmc-chart-link">Open in WTC → ${c.panel}</span>
        </a>
      </article>
    `).join('');

    requestAnimationFrame(WMC.Charts.redrawSparklines);
  },

  redrawSparklines() {
    window.WMC_DATA.chart_placeholders.forEach((_, i) => {
      const c = document.getElementById(`spark-${i}`);
      if (c) WMC.Utils.drawSparkline(c);
    });
  },
};