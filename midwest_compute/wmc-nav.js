/** Sticky nav, section jump, scroll-spy */
window.WMC = window.WMC || {};

WMC.Nav = {
  SECTIONS: [
    { id: 'overview', label: 'Overview' },
    { id: 'basis', label: 'Basis tracker' },
    { id: 'trades', label: 'Trade ideas' },
    { id: 'risk', label: 'Risk' },
    { id: 'risk-corr', label: 'Risk · Correlations', parent: 'risk' },
    { id: 'risk-var', label: 'Risk · VaR', parent: 'risk' },
    { id: 'risk-exposure', label: 'Risk · Exposure', parent: 'risk' },
    { id: 'charts', label: 'Charts' },
    { id: 'sources', label: 'Sources' },
  ],

  PRIMARY: ['overview', 'basis', 'trades', 'risk', 'charts', 'sources'],

  init() {
    const root = document.getElementById('nav-root');
    if (!root) return;

    root.innerHTML = `
      <div class="wmc-nav-inner">
        <div class="wmc-nav-brand">
          <span class="wmc-nav-title">Midwest Compute Crush</span>
          <span class="wmc-nav-date" id="wmcNavDate"></span>
        </div>
        <label class="wmc-nav-jump">
          <span class="wmc-sr-only">Jump to section</span>
          <select id="wmcJumpSelect" aria-label="Jump to section">
            ${WMC.Nav.PRIMARY.map((id) => {
              const s = WMC.Nav.SECTIONS.find((x) => x.id === id);
              return `<option value="${id}">${s.label}</option>`;
            }).join('')}
          </select>
        </label>
        <nav class="wmc-side-nav" aria-label="Section links">
          ${WMC.Nav.PRIMARY.map((id) => {
            const s = WMC.Nav.SECTIONS.find((x) => x.id === id);
            return `<a href="#${id}" class="wmc-side-link" data-section="${id}">${s.label}</a>`;
          }).join('')}
        </nav>
        <div class="wmc-nav-actions">
          <button type="button" class="wmc-btn wmc-btn--agent wtm-collect-agent-status wtm-collect-agent--offline" id="btnCollectAgentStatus" title="Collect agent status (127.0.0.1:8767) — click when offline for start command">Agent ○</button>
          <button type="button" class="wmc-btn wmc-btn--collect wtm-collect-btn" id="btnMorningCollect" title="Barchart + Koyfin CSV fetch → drop → hydrate chain">Collect CSVs</button>
          <button type="button" class="wmc-btn wmc-btn--refresh wtm-refresh-btn" id="btnDeskRefresh" title="Reload hydration, curve, and all desk panels">Refresh data</button>
          <button type="button" class="wmc-btn" id="btnExportJson">Export JSON</button>
          <a href="./index.html" class="wmc-btn wmc-btn--ghost">Transmission Control</a>
        </div>
      </div>
    `;

    document.getElementById('wmcJumpSelect').addEventListener('change', (e) => {
      WMC.Nav.scrollTo(e.target.value);
    });

    root.querySelectorAll('.wmc-side-link').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        WMC.Nav.scrollTo(a.dataset.section);
      });
    });

    document.getElementById('btnExportJson').addEventListener('click', () => WMC.Export.download());

    WMC.Nav.updateDate();
    setInterval(WMC.Nav.updateDate, 60000);
    WMC.Nav.bindScrollSpy();
  },

  updateDate() {
    const el = document.getElementById('wmcNavDate');
    if (el) el.textContent = WMC.Utils.liveDateString();
  },

  scrollTo(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const sel = document.getElementById('wmcJumpSelect');
    const primary = WMC.Nav.PRIMARY.includes(id) ? id : (WMC.Nav.SECTIONS.find((s) => s.id === id)?.parent || id);
    if (sel && WMC.Nav.PRIMARY.includes(primary)) sel.value = primary;
  },

  bindScrollSpy() {
    const zones = WMC.Nav.PRIMARY.map((id) => document.getElementById(id)).filter(Boolean);
    if (!zones.length || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (!visible.length) return;
        const id = visible[0].target.id;
        const sel = document.getElementById('wmcJumpSelect');
        if (sel && WMC.Nav.PRIMARY.includes(id)) sel.value = id;
        document.querySelectorAll('.wmc-side-link').forEach((a) => {
          a.classList.toggle('wmc-side-link--active', a.dataset.section === id);
        });
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5] },
    );

    zones.forEach((z) => observer.observe(z));
  },
};