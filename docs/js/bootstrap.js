// Safe bootstrap for disaggregated Whinfell Transmission Control
console.log('%c[Whinfell TC] Bootstrap loaded', 'color:lime;font-weight:bold');

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

window.addEventListener('error', (event) => {
  console.error('🚨 Boot error:', event.error || event.message);
  updateBootCheck('ERROR: ' + (event.error?.message || event.message), true);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled rejection:', event.reason);
  updateBootCheck('ERROR: ' + String(event.reason), true);
});

// Core.js loads synchronously after this file; confirm boot once renderAll is real.
(function confirmCoreBoot() {
  if (window.__WTM_BOOTED) {
    updateBootCheck('RENDER SUCCESS');
    window.appState.booted = true;
    return;
  }
  if (typeof window.renderAll === 'function' && window.renderAll.name === 'renderAll') {
    window.__WTM_BOOTED = true;
    window.appState.booted = true;
    updateBootCheck('RENDER SUCCESS');
    return;
  }
  setTimeout(confirmCoreBoot, 0);
})();