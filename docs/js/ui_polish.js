/** UI polish + renderVisualizationDiagnostics self-test */
(function () {
  'use strict';

  let rvTooltip;

  function ensureTooltip() {
    if (rvTooltip) return rvTooltip;
    rvTooltip = document.createElement('div');
    rvTooltip.id = 'rvChartTooltip';
    rvTooltip.className = 'rv-chart-tooltip';
    document.body.appendChild(rvTooltip);
    return rvTooltip;
  }

  function enhanceRvCanvas() {
    const canvas = document.getElementById('cockpitRvCanvas');
    if (!canvas || canvas._polishBound) return;
    canvas._polishBound = true;
    const tip = ensureTooltip();
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width) return;
      const x = (e.clientX - rect.left) / rect.width;
      tip.style.display = 'block';
      tip.style.left = `${e.clientX + 12}px`;
      tip.style.top = `${e.clientY + 12}px`;
      tip.textContent = `RV probe · x=${(x * 100).toFixed(0)}% · ${document.getElementById('cockpitChartValue')?.textContent || '—'}`;
    });
    canvas.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
  }

  function addChartExportButtons() {
    const area = document.getElementById('cockpitChartArea');
    if (!area || area.querySelector('.chart-export-btn')) return;
    const bar = document.createElement('div');
    bar.className = 'flex gap-1 justify-end mb-1';
    bar.innerHTML = '<button type="button" class="chart-export-btn" data-export="rv-png">Export RV PNG</button><button type="button" class="chart-export-btn" data-export="rv-csv">Export RV CSV</button>';
    area.prepend(bar);
    bar.querySelector('[data-export="rv-png"]')?.addEventListener('click', () => {
      const c = document.getElementById('cockpitRvCanvas');
      if (!c) return;
      const a = document.createElement('a');
      a.download = 'whinfell-rv-chart.png';
      a.href = c.toDataURL('image/png');
      a.click();
    });
    bar.querySelector('[data-export="rv-csv"]')?.addEventListener('click', () => {
      const val = document.getElementById('cockpitChartValue')?.textContent || '';
      const blob = new Blob([`reading,${val}\n`], { type: 'text/csv' });
      const a = document.createElement('a');
      a.download = 'whinfell-rv-reading.csv';
      a.href = URL.createObjectURL(blob);
      a.click();
    });
  }

  function fixWorkspaceToggle() {
    const btn = document.getElementById('btnWorkspaceToggle');
    if (!btn || btn._polishBound) return;
    btn._polishBound = true;
    btn.classList.add('workspace-toggle--legacy');
    const sync = () => {
      const legacyVisible = !document.getElementById('legacyConsoleZone')?.classList.contains('zone-hidden');
      btn.setAttribute('aria-pressed', legacyVisible ? 'true' : 'false');
      btn.title = legacyVisible ? 'Return to Node Cockpits' : 'Open legacy intake + tracer console';
    };
    sync();
    btn.addEventListener('click', () => setTimeout(sync, 0));
  }

  window.renderVisualizationDiagnostics = function renderVisualizationDiagnostics() {
    const checks = [];
    const ok = (name, pass, detail) => checks.push({ name, pass, detail });

    ok('cockpitRvCanvas', !!document.getElementById('cockpitRvCanvas'), 'RV canvas present');
    ok('basisWatchPanel', !!document.getElementById('basisWatchPanel'), 'BasisWatch panel present');
    ok('aiComputePanel', !!document.getElementById('panel-aicompute'), 'AI Compute panel present');
    ok('v15DeskPanel', !!document.getElementById('panel-v15desk'), 'v1.5 Desk panel present');
    ok('WTM_BasisWatch', typeof window.WTM_BasisWatch !== 'undefined', window.WTM_BasisWatch?.BW_BUILD || 'missing');
    ok('WTM_AICompute', typeof window.WTM_AICompute !== 'undefined', 'module loaded');
    ok('hydration', !!(window.appState?.hydration?.node_cockpits), window.appState?.provenance?.hydratedAt || 'not hydrated');
    ok('renderAll', typeof window.renderAll === 'function', window.renderAll?.name || 'stub');
    ok('legacyToggle', !!document.getElementById('btnWorkspaceToggle'), document.getElementById('btnWorkspaceToggle')?.textContent || '');

    const canvas = document.getElementById('cockpitRvCanvas');
    if (canvas) ok('rvCanvasSize', canvas.width > 0 && canvas.height > 0, `${canvas.width}x${canvas.height}`);

    const passed = checks.filter(c => c.pass).length;
    const report = { ok: passed === checks.length, passed, total: checks.length, checks, at: new Date().toISOString() };
    window.__vizDiagnostics = report;

    let badge = document.getElementById('vizDiagnosticsBadge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'vizDiagnosticsBadge';
      badge.className = 'viz-diagnostics';
      document.body.appendChild(badge);
    }
    badge.className = `viz-diagnostics ${report.ok ? 'viz-diagnostics--ok' : 'viz-diagnostics--warn'}`;
    badge.textContent = `Viz ${passed}/${checks.length} · ${report.ok ? 'OK' : 'WARN'}`;
    badge.title = checks.map(c => `${c.pass ? '✓' : '✗'} ${c.name}: ${c.detail}`).join('\n');
    global.WTM_IaShell?.syncDepthLaddersStatus?.();
    return report;
  };

  function polishPass() {
    enhanceRvCanvas();
    addChartExportButtons();
    fixWorkspaceToggle();
  }

  function schedulePolishPass() {
    if (schedulePolishPass._queued) return;
    schedulePolishPass._queued = true;
    setTimeout(() => {
      schedulePolishPass._queued = false;
      polishPass();
    }, 0);
  }

  function installHook() {
    installHook._n = (installHook._n || 0) + 1;
    if (!window.__WTM_CORE_READY && installHook._n < 300) {
      setTimeout(installHook, 16);
      return;
    }
    if (typeof window.renderAll !== 'function') return;
    if (window.renderAll._wtmPolishWrapped) return;
    const orig = window.renderAll;
    function wrappedRenderAll() {
      const r = orig.apply(this, arguments);
      schedulePolishPass();
      return r;
    }
    wrappedRenderAll._wtmPolishWrapped = true;
    window.renderAll = wrappedRenderAll;
    schedulePolishPass();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installHook);
  else installHook();
})();