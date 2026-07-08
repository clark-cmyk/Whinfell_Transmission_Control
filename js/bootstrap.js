// Safe bootstrap for disaggregated Whinfell Transmission Control
console.log('%c[Whinfell TC] Bootstrap loaded', 'color:lime;font-weight:bold');

(function initSafeBootFlag() {
  try {
    const params = new URLSearchParams(location.search);
    if (params.get('safe_boot') === '1') window.WHINFELL_SAFE_BOOT = true;
    else if (params.get('safe_boot') === '0') window.WHINFELL_SAFE_BOOT = false;
  } catch (_) { /* ignore */ }
})();

window.appState = window.appState || {
  currentView: 'transmissionLadder',
  debug: true,
  booted: false,
};

window.__WTM_BOOTED = false;

function updateBootCheck(message, isError) {
  const check = document.getElementById('js-boot-check');
  if (!check) return;
  check.textContent = message;
  check.style.color = isError ? '#f56565' : 'lime';
  check.classList.toggle('boot-check--error', !!isError);
  if (!isError && message === 'RENDER SUCCESS') {
    check.classList.add('boot-check--ok');
    setTimeout(() => check.classList.add('boot-check--hidden'), 2500);
  }
}

window.renderAll = window.renderAll || function stubRenderAll() {
  console.log('%c[STUB] renderAll called — waiting for core.js', 'color:orange');
  updateBootCheck('STUB RENDER - loading core...');
};

window.updateBootCheck = updateBootCheck;

window.addEventListener('error', (event) => {
  console.error('🚨 Boot error:', event.error || event.message);
  updateBootCheck('ERROR: ' + (event.error?.message || event.message), true);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled rejection:', event.reason);
  updateBootCheck('ERROR: ' + String(event.reason), true);
});

// Core.js runs boot sequence asynchronously; avoid infinite poll on stub renderAll.
(function confirmCoreBoot(attempt) {
  const n = attempt || 0;
  if (window.__WTM_BOOT_COMPLETE) {
    updateBootCheck('RENDER SUCCESS');
    window.appState.booted = true;
    return;
  }
  if (window.__WTM_BOOT_FAILED) {
    return;
  }
  if (n >= 60) {
    updateBootCheck('BOOT TIMEOUT — open ?safe_boot=1&boot_log=1', true);
    window.__WTM_BOOT_FAILED = true;
    return;
  }
  setTimeout(() => confirmCoreBoot(n + 1), 50);
})(0);