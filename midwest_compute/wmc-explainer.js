/** Reference zone — explainer + corporate comps */
window.WMC = window.WMC || {};

WMC.Explainer = {
  init() {
    WMC.Explainer.renderExplainer();
    WMC.Explainer.renderComps();
    WMC.Explainer.bindDisclosureRetry();
  },

  bindDisclosureRetry() {
    const details = document.getElementById('crush-reference');
    if (!details || details._wmcExplainerBound) return;
    details._wmcExplainerBound = true;
    details.addEventListener('toggle', () => {
      if (!details.open) return;
      const er = document.getElementById('explainer-root');
      const cr = document.getElementById('comps-root');
      if (er && er.childElementCount === 0) WMC.Explainer.renderExplainer();
      if (cr && cr.childElementCount === 0) WMC.Explainer.renderComps();
    });
  },

  isExplainerReady(data) {
    return !!(
      data
      && typeof data === 'object'
      && data.title
      && data.components?.items?.length
      && data.drivers?.items?.length
      && data.formulas?.length
      && data.sensitivity?.scenarios?.length
      && data.risks?.items?.length
    );
  },

  isCompsReady(data) {
    return !!(
      data
      && typeof data === 'object'
      && Array.isArray(data.crush_operators)
      && data.crush_operators.length > 0
      && Array.isArray(data.margin_analogs)
      && data.margin_analogs.length > 0
    );
  },

  renderDiagnostic(root, heading, message) {
    if (!root) return;
    root.innerHTML = `
      <div class="wmc-panel wmc-explainer-diagnostic" role="status">
        <h2 class="wmc-zone-title">${heading}</h2>
        <p class="wmc-explainer-intro wmc-explainer-diagnostic-msg">${message}</p>
      </div>
    `;
  },

  renderExplainer() {
    const root = document.getElementById('explainer-root');
    if (!root) {
      console.warn('[WMC Explainer] #explainer-root not found at render time');
      return;
    }

    const data = window.WMC_DATA?.explainer;
    if (!WMC.Explainer.isExplainerReady(data)) {
      const keys = window.WMC_DATA ? Object.keys(window.WMC_DATA).join(', ') : 'WMC_DATA missing';
      WMC.Explainer.renderDiagnostic(
        root,
        'Explainer unavailable',
        `WMC_DATA.explainer is missing or incomplete. Available keys: ${keys}. Expected paths: explainer.title, explainer.components.items, explainer.formulas, explainer.sensitivity.scenarios, explainer.risks.items. Check midwest_compute/wmc-data.js load order before wmc-boot.js.`,
      );
      return;
    }

    try {
      const components = data.components;
      const drivers = data.drivers;
      const sensitivity = data.sensitivity;
      const risks = data.risks;

      root.innerHTML = `
        <div class="wmc-panel wmc-explainer-panel">
          <h2 class="wmc-zone-title">${data.title}</h2>

          <div class="wmc-subpanel">
            <h3 class="wmc-subpanel-title">${components.title}</h3>
            <p class="wmc-explainer-intro">${components.intro}</p>
            <ul class="wmc-explainer-list">
              ${components.items.map((item) => `
                <li><strong>${item.leg}</strong> — ${item.detail}</li>
              `).join('')}
            </ul>
          </div>

          <div class="wmc-subpanel">
            <h3 class="wmc-subpanel-title">${drivers.title}</h3>
            <ul class="wmc-explainer-list">
              ${drivers.items.map((item) => `<li>${item}</li>`).join('')}
            </ul>
          </div>

          <div class="wmc-subpanel">
            <h3 class="wmc-subpanel-title">Formulas</h3>
            <div class="wmc-formula-grid">
              ${data.formulas.map((f) => `
                <div class="wmc-formula-block">
                  <span class="wmc-formula-name">${f.name}</span>
                  <code class="wmc-formula-expr wmc-num">${f.expression}</code>
                  <p class="wmc-formula-note">${f.note}</p>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="wmc-subpanel">
            <h3 class="wmc-subpanel-title">${sensitivity.title}</h3>
            <ul class="wmc-explainer-list wmc-explainer-list--scenarios">
              ${sensitivity.scenarios.map((s) => `
                <li><strong>${s.label}</strong> — ${s.impact}</li>
              `).join('')}
            </ul>
          </div>

          <div class="wmc-subpanel">
            <h3 class="wmc-subpanel-title">${risks.title}</h3>
            <ul class="wmc-explainer-list wmc-explainer-list--risks">
              ${risks.items.map((item) => `<li>${item}</li>`).join('')}
            </ul>
          </div>
        </div>
      `;
    } catch (err) {
      console.error('[WMC Explainer] renderExplainer failed', err);
      WMC.Explainer.renderDiagnostic(
        root,
        'Explainer render error',
        `renderExplainer threw: ${err?.message || err}. See console for stack trace.`,
      );
    }
  },

  renderComps() {
    const root = document.getElementById('comps-root');
    if (!root) {
      console.warn('[WMC Explainer] #comps-root not found at render time');
      return;
    }

    const data = window.WMC_DATA?.corporate_comps;
    if (!WMC.Explainer.isCompsReady(data)) {
      const keys = window.WMC_DATA ? Object.keys(window.WMC_DATA).join(', ') : 'WMC_DATA missing';
      WMC.Explainer.renderDiagnostic(
        root,
        'Corporate comps unavailable',
        `WMC_DATA.corporate_comps is missing or empty. Available keys: ${keys}. Expected: corporate_comps.crush_operators[] and corporate_comps.margin_analogs[]. Check midwest_compute/wmc-data.js and hydration merge preserve these paths.`,
      );
      return;
    }

    try {
      const renderCategory = (title, items) => `
        <div class="wmc-comp-category">
          <h3 class="wmc-subpanel-title">${title}</h3>
          <div class="wmc-comp-grid">
            ${items.map((c) => `
              <div class="wmc-comp-card">
                <div class="wmc-comp-head">
                  <strong class="wmc-comp-name">${c.name}</strong>
                  <span class="wmc-comp-ticker wmc-num">${c.ticker}</span>
                </div>
                <p class="wmc-comp-role">${c.role}</p>
                <p class="wmc-comp-field"><span class="wmc-comp-label">Crush linkage</span> ${c.crush_linkage}</p>
                <p class="wmc-comp-field"><span class="wmc-comp-label">Margin note</span> ${c.margin_note}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      root.innerHTML = `
        <div class="wmc-panel wmc-comps-panel">
          <h2 class="wmc-zone-title">Corporate Sample (Comps)</h2>
          <p class="wmc-explainer-intro">Desk reference comps for crush-style operators and gross-margin analogs influenced by Midwest cost/price dynamics. Registry: <code>DATA_DICTIONARY_v1.5.md</code> · Corporate Comps – Crush Analogs.</p>
          ${renderCategory('Category 1: Crush-like Operators', data.crush_operators)}
          ${renderCategory('Category 2: Gross Margin Profile Analogs', data.margin_analogs)}
        </div>
      `;
    } catch (err) {
      console.error('[WMC Explainer] renderComps failed', err);
      WMC.Explainer.renderDiagnostic(
        root,
        'Corporate comps render error',
        `renderComps threw: ${err?.message || err}. See console for stack trace.`,
      );
    }
  },
};