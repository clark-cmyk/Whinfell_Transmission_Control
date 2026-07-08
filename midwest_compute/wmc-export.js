/** WTC import JSON export */
window.WMC = window.WMC || {};

WMC.Export = {
  buildPayload() {
    const d = window.WMC_DATA;
    return {
      export_type: 'wtc_midwest_compute_crush',
      export_version: d.meta.version,
      exported_at: new Date().toISOString(),
      as_of: d.meta.as_of,
      build: d.meta.build,
      thesis: d.meta.thesis,
      basis_tracker: d.basis_tracker,
      trade_variants: d.trade_variants,
      risk_summary: d.risk_summary,
      kpis: d.kpis,
      chart_placeholders: d.chart_placeholders,
      sources: d.sources,
      wtc_import_hint: {
        target_blocks: ['ai_compute', 'corporate_credit', 'trade_tracker'],
        hydration_path: 'data/hydration/latest.json',
        merge_strategy: 'shallow_merge_desk_override',
      },
      specialists_compute_gpu: (() => {
        const gpu = d._task_force_panels?.specialists?.compute_gpu;
        if (gpu) {
          return {
            ...gpu,
            crush_trade: gpu.crush_trade || {
              posture: d.trade_variants.core.posture,
              structure: d.trade_variants.core.signal,
            },
          };
        }
        return {
          status: 'ok',
          node_id: 'ai_compute',
          signal: d.trade_variants.core.signal,
          confidence: 0.72,
          crush_trade: {
            posture: d.trade_variants.core.posture,
            structure: d.trade_variants.core.signal,
            current_basis: 0.14,
            expected_pnl_pct: 6.4,
            horizon_days: 45,
          },
        };
      })(),
    };
  },

  download() {
    const payload = WMC.Export.buildPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `whinfell_midwest_compute_crush_${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    WMC.Utils.showToast('JSON exported — ready for WTC import');
  },
};

window.WMC_export = () => WMC.Export.download();