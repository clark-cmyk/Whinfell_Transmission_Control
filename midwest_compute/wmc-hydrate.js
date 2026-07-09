/** Merge Task Force compute_gpu feed from hydration bundle into WMC_DATA.
 * Raw hydration load is owned by The Ark (WTM_Ark) — no direct fetch here.
 */
window.WMC = window.WMC || {};

WMC.Hydrate = {
  /**
   * Load hydration via Ark and merge compute_gpu into WMC_DATA.
   * @param {string} [url] unused legacy arg (path owned by Ark); kept for call-site compat
   * @returns {Promise<boolean>}
   */
  async load(url = 'data/hydration/latest.json') {
    try {
      const ark = window.WTM_Ark;
      if (!ark || typeof ark.loadHydration !== 'function') {
        console.warn('[WMC Hydrate] WTM_Ark unavailable — hydration load skipped');
        return false;
      }

      // Prefer Ark cache when warm (DeskOps/core may already have loaded).
      const force = !ark.getHydration?.();
      const result = await ark.loadHydration({ force });
      const bundle = (result && result.ok && result.data)
        ? result.data
        : (ark.getHydration?.() || null);
      if (!bundle || typeof bundle !== 'object') return false;

      // url kept for API compat; Ark owns the canonical path.
      void url;

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
