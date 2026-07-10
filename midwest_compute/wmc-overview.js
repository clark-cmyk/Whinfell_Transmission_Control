/** Overview zone — thesis, as-of, KPIs */
window.WMC = window.WMC || {};

WMC.Overview = {
  init() {
    const root = document.getElementById('overview-root');
    if (!root) return;
    const { meta, kpis } = window.WMC_DATA;
    const hero = kpis.find((k) => k.hero) || kpis[2];
    const secondary = kpis.filter((k) => !k.hero);

    root.innerHTML = `
      <p class="wmc-thesis">${meta.thesis}</p>
      <p class="wmc-meta-line">As of <span class="wmc-num">${typeof window.WTM_formatLocalStamp === 'function' ? window.WTM_formatLocalStamp(meta.as_of) : meta.as_of}</span> · Barchart, Koyfin, MISO API, GPU indices${meta.task_force_source ? ` · Task Force <span class="wmc-num">${meta.task_force_source}</span>` : ''}</p>
      <div class="wmc-hero-kpi">
        <span class="wmc-hero-label">${hero.label}</span>
        <span class="wmc-hero-value wmc-num">${hero.value}<span class="wmc-hero-unit">${hero.unit}</span></span>
        <span class="wmc-hero-delta wmc-delta--${hero.dir}">${hero.delta}</span>
      </div>
      <div class="wmc-kpi-row">
        ${secondary.map((k) => `
          <div class="wmc-kpi">
            <span class="wmc-kpi-label">${k.label}</span>
            <span class="wmc-kpi-value wmc-num">${k.value}<span class="wmc-kpi-unit">${k.unit}</span></span>
            <span class="wmc-kpi-delta wmc-delta--${k.dir}">${k.delta}</span>
          </div>
        `).join('')}
      </div>
    `;
  },
};