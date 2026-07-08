/** Boot registry — init all components */
window.WMC = window.WMC || {};

WMC.boot = async function boot() {
  try {
    if (WMC.Hydrate?.load) await WMC.Hydrate.load();
  } catch (err) {
    console.warn('[WMC boot] hydrate skipped', err);
  }

  const chain = [
    { name: 'Nav', owner: WMC.Nav, fn: WMC.Nav?.init },
    { name: 'Overview', owner: WMC.Overview, fn: WMC.Overview?.init },
    { name: 'Explainer', owner: WMC.Explainer, fn: WMC.Explainer?.init },
    { name: 'Basis', owner: WMC.Basis, fn: WMC.Basis?.init },
    { name: 'Trades', owner: WMC.Trades, fn: WMC.Trades?.init },
    { name: 'Risk', owner: WMC.Risk, fn: WMC.Risk?.init },
    { name: 'Charts', owner: WMC.Charts, fn: WMC.Charts?.init },
    { name: 'Sources', owner: WMC.Sources, fn: WMC.Sources?.init },
  ];

  chain.forEach(({ name, owner, fn }) => {
    if (typeof fn !== 'function') {
      console.warn(`[WMC boot] skip ${name}: init missing — check script load order`);
      return;
    }
    try {
      fn.call(owner || WMC);
    } catch (err) {
      console.error(`[WMC boot] ${name}`, err);
    }
  });

  if (window.WTM_DeskOps?.wireAll) window.WTM_DeskOps.wireAll();
  if (window.WTM_AutoCollect?.wireAll) window.WTM_AutoCollect.wireAll();
};

if (!window.__wmcDeskRefreshBound) {
  window.__wmcDeskRefreshBound = true;
  window.addEventListener('whinfell-desk-refresh', () => {
    if (typeof WMC.refreshAfterCollect === 'function') {
      WMC.refreshAfterCollect().catch((err) => console.warn('[WMC] desk refresh failed', err));
    }
  });
}

/** Re-hydrate and re-render data-bound zones after a successful CSV collect. */
WMC.refreshAfterCollect = async function refreshAfterCollect() {
  let hydrated = false;
  try {
    if (WMC.Hydrate?.load) hydrated = await WMC.Hydrate.load();
  } catch (err) {
    console.warn('[WMC refresh] hydrate skipped', err);
  }

  try { WMC.Overview?.init?.(); } catch (err) { console.warn('[WMC refresh] overview', err); }
  try { WMC.Basis?.render?.(); } catch (err) { console.warn('[WMC refresh] basis', err); }
  try { WMC.Trades?.init?.(); } catch (err) { console.warn('[WMC refresh] trades', err); }
  try { WMC.Charts?.render?.(); } catch (err) { console.warn('[WMC refresh] charts', err); }
  try { WMC.Nav?.updateDate?.(); } catch (err) { console.warn('[WMC refresh] nav date', err); }

  return { hydrated, refreshed: true };
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { WMC.boot(); });
} else {
  WMC.boot();
}