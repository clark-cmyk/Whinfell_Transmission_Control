/** Trade ideas — vertical list + single detail panel */
window.WMC = window.WMC || {};

WMC.Trades = {
  activeKey: 'core',

  init() {
    const root = document.getElementById('trades-root');
    if (!root) return;

    root.innerHTML = `
      <div class="wmc-trades-layout">
        <ul class="wmc-trade-list" id="tradeList" role="listbox"></ul>
        <div class="wmc-trade-detail" id="tradeDetail"></div>
      </div>
    `;

    WMC.Trades.renderList();
    WMC.Trades.renderDetail(WMC.Trades.activeKey);
  },

  renderList() {
    const list = document.getElementById('tradeList');
    if (!list) return;
    const variants = window.WMC_DATA.trade_variants;
    const postureCls = { execute: 'wmc-posture--execute', watch: 'wmc-posture--watch', pass: 'wmc-posture--pass' };

    list.innerHTML = Object.entries(variants).map(([key, v]) => `
      <li>
        <button type="button" class="wmc-trade-item${key === WMC.Trades.activeKey ? ' wmc-trade-item--active' : ''}"
          data-variant="${key}" role="option" aria-selected="${key === WMC.Trades.activeKey}">
          <span class="wmc-trade-item-name">${v.name}</span>
          <span class="wmc-posture-badge ${postureCls[v.posture] || ''}">${v.posture}</span>
        </button>
      </li>
    `).join('');

    list.querySelectorAll('.wmc-trade-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        WMC.Trades.activeKey = btn.dataset.variant;
        WMC.Trades.renderList();
        WMC.Trades.renderDetail(WMC.Trades.activeKey);
      });
    });
  },

  renderDetail(key) {
    const panel = document.getElementById('tradeDetail');
    if (!panel) return;
    const v = window.WMC_DATA.trade_variants[key];
    if (!v) return;

    const signalCls = {
      long: 'wmc-signal--long',
      short: 'wmc-signal--short',
      watch: 'wmc-signal--watch',
      neutral: 'wmc-signal--neutral',
    };
    const postureCls = { execute: 'wmc-posture--execute', watch: 'wmc-posture--watch', pass: 'wmc-posture--pass' };

    panel.innerHTML = `
      <h3 class="wmc-trade-detail-title">${v.name}</h3>
      <p class="wmc-signal ${signalCls[v.signal_dir] || 'wmc-signal--neutral'}">${v.signal}</p>
      <span class="wmc-posture-badge ${postureCls[v.posture] || ''}">${v.posture}</span>
      <dl class="wmc-detail-dl">
        <div class="wmc-detail-row"><dt>Sizing</dt><dd class="wmc-num">${v.sizing}</dd></div>
        <div class="wmc-detail-row"><dt>Stop</dt><dd class="wmc-num">${v.stop}</dd></div>
        <div class="wmc-detail-row"><dt>Target</dt><dd class="wmc-num">${v.target}</dd></div>
      </dl>
      <p class="wmc-rationale">${v.rationale}</p>
    `;
  },
};