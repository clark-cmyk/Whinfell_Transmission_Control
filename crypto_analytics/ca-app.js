/**
 * CME Crypto Analytics — application state, routing, and boot.
 * @module CAApp
 */
(function cryptoAnalyticsApp(global) {
  'use strict';

  const M = global.CAModels;
  const D = global.CAData;
  const Summary = global.CASummary;

  const bounds = D.defaultHistoryBounds();

  const state = {
    asset: 'BTC',
    activeView: 'chart',
    startDate: bounds.start,
    endDate: bounds.end,
    valuationDate: D.defaultValuationDate(),
    zoomPreset: '1Y',
    selectedPoint: null,
    history: [],
  };

  let basisChart = null;
  let forwardCurve = null;
  let spotCurve = null;

  function el(id) { return document.getElementById(id); }

  function pinSummaryFromPoint(pt) {
    if (!pt) return;
    state.selectedPoint = {
      contractSymbol: pt.front_contract_symbol || pt.contract_symbol,
      expiryDate: pt.expiry_date,
      tradeDate: pt.trade_date,
    };
    const row = {
      asset: state.asset,
      front_contract_symbol: pt.front_contract_symbol || pt.contract_symbol,
      contract_symbol: pt.contract_symbol || pt.front_contract_symbol,
      expiry_date: pt.expiry_date,
      dte: pt.dte,
      future_price: pt.future_price,
      spot_marker: pt.spot_marker,
      annualized_basis_pct: pt.annualized_basis_pct ?? pt.annualized_rate_pct,
      trade_date: pt.trade_date || state.valuationDate,
    };
    Summary.renderSummary(state.asset, row);
  }

  function defaultSummaryRow() {
    if (state.activeView === 'chart' && state.history.length) {
      const last = state.history[state.history.length - 1];
      pinSummaryFromPoint(last);
      return;
    }
    const date = state.valuationDate;
    D.fetchForwardCurve(state.asset, date).then((payload) => {
      const front = payload.points[0];
      if (front) {
        pinSummaryFromPoint({
          ...front,
          front_contract_symbol: front.contract_symbol,
          annualized_basis_pct: front.annualized_rate_pct,
        });
      }
    });
  }

  function setActiveView(view) {
    state.activeView = view;
    document.querySelectorAll('.ca-nav-item').forEach((btn) => {
      btn.classList.toggle('ca-nav-item--active', btn.dataset.caView === view);
    });
    el('caPanelChart')?.classList.toggle('ca-viz-panel--active', view === 'chart');
    el('caPanelForward')?.classList.toggle('ca-viz-panel--active', view === 'forwardCurve');
    el('caPanelSpot')?.classList.toggle('ca-viz-panel--active', view === 'spotCurve');
    el('caChartControls')?.classList.toggle('ca-controls--hidden', view !== 'chart');
    el('caCurveControls')?.classList.toggle('ca-controls--hidden', view === 'chart');
    refreshActiveView();
  }

  function applyZoom(preset) {
    state.zoomPreset = preset;
    const range = M.zoomPresetRange(preset, state.endDate, bounds.start);
    state.startDate = range.start;
    state.endDate = range.end;
    el('caStartDate').value = state.startDate;
    el('caEndDate').value = state.endDate;
    document.querySelectorAll('.ca-zoom-btn').forEach((b) => {
      b.classList.toggle('ca-zoom-btn--active', b.dataset.zoom === preset);
    });
    loadHistory();
  }

  function loadHistory() {
    return D.fetchBasisHistory(state.asset, bounds.start, state.endDate).then((payload) => {
      state.history = payload.points;
      const win = M.zoomPresetRange(state.zoomPreset, state.endDate, bounds.start);
      if (state.startDate < bounds.start) state.startDate = bounds.start;
      basisChart?.setData(state.history, { start: state.startDate, end: state.endDate });
      if (!state.selectedPoint || state.activeView === 'chart') {
        const visible = state.history.filter((p) => p.trade_date >= state.startDate && p.trade_date <= state.endDate);
        if (visible.length) pinSummaryFromPoint(visible[visible.length - 1]);
      }
    });
  }

  function loadForwardCurve() {
    return D.fetchForwardCurve(state.asset, state.valuationDate).then((payload) => {
      forwardCurve?.setData(payload.points);
      if (state.activeView === 'forwardCurve' && !state.selectedPoint) {
        const pt = payload.points[0];
        if (pt) pinSummaryFromPoint({ ...pt, front_contract_symbol: pt.contract_symbol, annualized_basis_pct: pt.annualized_rate_pct });
      }
    });
  }

  function loadSpotCurve() {
    return D.fetchSpotCurve(state.asset, state.valuationDate).then((payload) => {
      spotCurve?.setData(payload.points);
      if (state.activeView === 'spotCurve' && !state.selectedPoint) {
        const pt = payload.points[0];
        if (pt) pinSummaryFromPoint({ ...pt, front_contract_symbol: pt.contract_symbol, annualized_basis_pct: pt.annualized_rate_pct });
      }
    });
  }

  function refreshActiveView() {
    state.selectedPoint = null;
    if (state.activeView === 'chart') loadHistory();
    else if (state.activeView === 'forwardCurve') loadForwardCurve();
    else if (state.activeView === 'spotCurve') loadSpotCurve();
  }

  function bindUI() {
    el('caAsset').addEventListener('change', (e) => {
      state.asset = e.target.value;
      state.selectedPoint = null;
      refreshActiveView();
    });

    document.querySelectorAll('.ca-nav-item').forEach((btn) => {
      btn.addEventListener('click', () => setActiveView(btn.dataset.caView));
    });

    document.querySelectorAll('.ca-zoom-btn').forEach((btn) => {
      btn.addEventListener('click', () => applyZoom(btn.dataset.zoom));
    });

    el('caStartDate').addEventListener('change', (e) => {
      state.startDate = e.target.value;
      state.zoomPreset = '';
      document.querySelectorAll('.ca-zoom-btn').forEach((b) => b.classList.remove('ca-zoom-btn--active'));
      basisChart?.setWindow(state.startDate, state.endDate);
    });

    el('caEndDate').addEventListener('change', (e) => {
      state.endDate = e.target.value;
      state.zoomPreset = '';
      document.querySelectorAll('.ca-zoom-btn').forEach((b) => b.classList.remove('ca-zoom-btn--active'));
      loadHistory();
    });

    el('caValuationDate').addEventListener('change', (e) => {
      state.valuationDate = e.target.value;
      state.selectedPoint = null;
      if (state.activeView === 'forwardCurve') loadForwardCurve();
      else if (state.activeView === 'spotCurve') loadSpotCurve();
    });

    const cb = {
      getAsset: () => state.asset,
      onHover: (pt) => { if (pt && !state.selectedPoint) Summary.renderSummary(state.asset, { ...pt, contract_symbol: pt.front_contract_symbol || pt.contract_symbol }); },
      onPin: pinSummaryFromPoint,
      onWindowChange: (win) => {
        state.startDate = win.start;
        state.endDate = win.end;
        el('caStartDate').value = win.start;
        el('caEndDate').value = win.end;
      },
    };

    basisChart = global.CABasisChart.createBasisChart(el('caPanelChart'), cb);
    forwardCurve = global.CAForwardCurve.createForwardCurve(el('caPanelForward'), cb);
    spotCurve = global.CASpotCurve.createSpotCurve(el('caPanelSpot'), cb);
  }

  function init() {
    el('caStartDate').value = state.startDate;
    el('caEndDate').value = state.endDate;
    el('caValuationDate').value = state.valuationDate;
    el('caAsset').value = state.asset;
    bindUI();
    applyZoom('1Y');
    setActiveView('chart');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.CAApp = { state, init, refreshActiveView };
})(typeof window !== 'undefined' ? window : globalThis);