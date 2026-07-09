/** Merge Task Force compute_gpu feed from hydration bundle into WMC_DATA */
window.WMC = window.WMC || {};

WMC.Hydrate = {
  async load(url = 'data/hydration/latest.json') {
    try {
      const bust = `${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`;
      const res = await fetch(bust, { cache: 'no-store' });
      if (!res.ok) return false;
      const bundle = await res.json();
      const feed = window.WTM_TaskForceFeed;
      if (!feed?.mergeWmcData) return false;
      const panels = bundle.task_force_panels || feed.extractTaskForcePanels?.(bundle.task_force);
      if (!panels?.specialists?.compute_gpu) return false;
      const preserved = {
        explainer: window.WMC_DATA?.explainer,
        corporate_comps: window.WMC_DATA?.corporate_comps,
      };
      window.WMC_DATA = feed.mergeWmcData(window.WMC_DATA, panels);
      if (preserved.explainer && !window.WMC_DATA.explainer) {
        window.WMC_DATA.explainer = preserved.explainer;
      }
      if (preserved.corporate_comps && !window.WMC_DATA.corporate_comps) {
        window.WMC_DATA.corporate_comps = preserved.corporate_comps;
      }
      return true;
    } catch (err) {
      console.warn('[WMC Hydrate]', err);
      return false;
    }
  },
};