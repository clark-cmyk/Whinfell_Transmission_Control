/**
 * BBDM v2 Chunk 06 — five-module IA shell (Scan · D.I.G. · Litmus · Iterate · Articulator).
 * Presentation router only; pane content wired in later chunks.
 */
(function bbdmIaShell(global) {
  'use strict';

  const BUILD = 'BBDM-IA-SHELL-CHUNK06';

  const MODULE_CLASS = {
    scan: 'bbdm-module-scan',
    dig: 'bbdm-module-dig',
    litmus: 'bbdm-module-litmus',
    iterate: 'bbdm-module-iterate',
    articulator: 'bbdm-module-articulator',
  };

  const MODULE_REGISTRY = [
    { id: 'scan', label: 'Scan', hostId: 'bbdmScanHost', hint: 'Signal overview · risk dashboard · trade table' },
    { id: 'dig', label: 'D.I.G.', hostId: 'bbdmDigHost', hint: 'Deep Intelligence Gathering — statistical detail' },
    { id: 'litmus', label: 'Litmus', hostId: 'bbdmLitmusHost', hint: 'Corporate & industry reality check' },
    { id: 'iterate', label: 'Iterate', hostId: 'bbdmIterateHost', hint: 'Trade modeler & backtest' },
    { id: 'articulator', label: 'Articulator', hostId: 'bbdmArticulatorHost', hint: 'Hybrid commentary engine' },
  ];

  const DEFAULT_MODULE = 'scan';
  let activeModule = DEFAULT_MODULE;
  let activated = false;

  function el(id) { return document.getElementById(id); }

  function moduleIds() {
    return MODULE_REGISTRY.map((m) => m.id);
  }

  function isValidModule(id) {
    return Boolean(MODULE_CLASS[id]);
  }

  function syncTabUi() {
    document.querySelectorAll('[data-bbdm-module]').forEach((tab) => {
      const on = tab.dataset.bbdmModule === activeModule;
      tab.classList.toggle('bbdm-module-tab--active', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      if (tab.tagName === 'BUTTON') tab.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function syncPaneUi() {
    MODULE_REGISTRY.forEach((mod) => {
      const pane = el(mod.hostId);
      if (!pane) return;
      const on = mod.id === activeModule;
      pane.classList.toggle('bbdm-module-pane--active', on);
      pane.hidden = !on;
      pane.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
  }

  function setModule(module) {
    const key = isValidModule(module) ? module : DEFAULT_MODULE;
    activeModule = key;
    const body = document.body;
    Object.values(MODULE_CLASS).forEach((cls) => body.classList.remove(cls));
    body.classList.add(MODULE_CLASS[key]);
    syncTabUi();
    syncPaneUi();
    return key;
  }

  function getModule() {
    return activeModule;
  }

  function bindModuleTabs() {
    document.querySelectorAll('[data-bbdm-module]').forEach((tab) => {
      tab.addEventListener('click', (ev) => {
        if (tab.tagName === 'A') return;
        ev.preventDefault();
        const mod = tab.dataset.bbdmModule;
        if (mod) setModule(mod);
      });
    });
  }

  function bindLeftCollapse() {
    el('btnBbdmLeftCollapse')?.addEventListener('click', () => {
      document.body.classList.toggle('bbdm-left-collapsed');
    });
  }

  function hostHasRenderedContent(host) {
    return [...host.children].some((child) => {
      if (child.classList?.contains('bbdm-pane-placeholder')) return true;
      if (child.dataset?.bbdmMount) return Boolean(child.textContent?.trim() || child.children.length);
      return Boolean(child.textContent?.trim() || child.children.length);
    });
  }

  function mountPlaceholder(hostId, title, hint) {
    const host = el(hostId);
    if (!host || hostHasRenderedContent(host)) return false;
    if (host.querySelector('.bbdm-pane-placeholder')) return false;
    const block = document.createElement('div');
    block.className = 'bbdm-pane-placeholder';
    block.setAttribute('role', 'status');
    block.innerHTML = `
      <p class="bbdm-pane-placeholder__title">${title}</p>
      <p class="bbdm-pane-placeholder__hint">${hint}</p>`;
    host.appendChild(block);
    return true;
  }

  function ensureEmptyPaneMounts() {
    MODULE_REGISTRY.forEach((mod) => {
      if (mod.id === 'scan') return;
      mountPlaceholder(mod.hostId, mod.label, mod.hint);
    });
  }

  function activateShell() {
    if (activated) return true;
    const shell = el('bbdmIaShell');
    if (!shell) return false;
    try {
      document.body.classList.add('bbdm-shell-active');
      ensureEmptyPaneMounts();
      setModule(activeModule);
      activated = true;
      return true;
    } catch (err) {
      console.warn('[BBDM IaShell] activation failed — legacy layout', err);
      document.body.classList.remove('bbdm-shell-active');
      return false;
    }
  }

  function init() {
    bindModuleTabs();
    bindLeftCollapse();
    activateShell();
  }

  global.BBDM_IaShell = {
    BUILD,
    MODULE_REGISTRY,
    MODULE_CLASS,
    moduleIds,
    isValidModule,
    getModule,
    setModule,
    activateShell,
    init,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);