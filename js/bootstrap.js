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
window.__WTM_LAST_RENDER_OK = null;
window.__WTM_BOOT_GUARD = window.__WTM_BOOT_GUARD || null;

/** Poll budget: hydrate can exceed 3s on cold hard-refresh (COMET / Chrome). */
const BOOT_POLL_MS = 50;
const BOOT_POLL_SOFT = 120;   // 6s — show "still booting" hint, keep waiting
const BOOT_POLL_HARD = 600;   // 30s — only then mark timeout failure

function updateBootCheck(message, isError) {
  const check = document.getElementById('js-boot-check');
  if (!check) return;
  check.textContent = message;
  check.style.color = isError ? '#f56565' : 'lime';
  check.classList.toggle('boot-check--error', !!isError);
  if (!isError && message === 'RENDER SUCCESS') {
    check.classList.remove('boot-check--error');
    check.classList.add('boot-check--ok');
    check.classList.remove('boot-check--hidden');
    setTimeout(() => check.classList.add('boot-check--hidden'), 2500);
  }
}

window.renderAll = window.renderAll || function stubRenderAll() {
  console.log('%c[STUB] renderAll called — waiting for core.js', 'color:orange');
  updateBootCheck('STUB RENDER - loading core...');
};

window.updateBootCheck = updateBootCheck;

window.addEventListener('error', (event) => {
  // Ignore resource/load noise; only surface script errors that break boot.
  if (event && event.filename === '' && !event.error) return;
  console.error('🚨 Boot error:', event.error || event.message);
  // Do not sticky-overwrite RENDER SUCCESS after a healthy boot for non-fatal page noise.
  if (window.__WTM_BOOT_COMPLETE && window.__WTM_LAST_RENDER_OK) return;
  updateBootCheck('ERROR: ' + (event.error?.message || event.message), true);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled rejection:', event.reason);
  if (window.__WTM_BOOT_COMPLETE && window.__WTM_LAST_RENDER_OK) return;
  updateBootCheck('ERROR: ' + String(event.reason), true);
});

// Core.js runs boot sequence asynchronously; wait long enough for auto-hydrate.
(function confirmCoreBoot(attempt) {
  const n = attempt || 0;
  if (window.__WTM_BOOT_COMPLETE) {
    // Prefer core's own success/failure signal; only force SUCCESS if last paint ok.
    if (window.__WTM_LAST_RENDER_OK === false) {
      updateBootCheck('RENDER FALLBACK', true);
    } else {
      updateBootCheck('RENDER SUCCESS');
    }
    window.appState.booted = true;
    window.__WTM_BOOT_FAILED = false;
    return;
  }
  // Genuine core failure (runBootSequence catch) — stop polling; badge already set.
  if (window.__WTM_BOOT_FAILED && !window.__WTM_BOOT_COMPLETE) {
    return;
  }
  if (n === BOOT_POLL_SOFT && !window.__WTM_BOOT_COMPLETE) {
    const phase = window.__WTM_CORE_READY ? 'hydrating…' : 'loading core…';
    updateBootCheck(`BOOT: ${phase} (?boot_log=1)`, false);
  }
  if (n >= BOOT_POLL_HARD) {
    // Only hard-fail if core never finished. Do not mark failed while hydrate is in flight
    // after core is ready — that was the false BOOT TIMEOUT on slow hard-refresh.
    if (!window.__WTM_BOOT_COMPLETE && !window.__WTM_CORE_READY) {
      updateBootCheck('BOOT TIMEOUT — open ?safe_boot=1&boot_log=1', true);
      window.__WTM_BOOT_FAILED = true;
      return;
    }
    if (!window.__WTM_BOOT_COMPLETE && window.__WTM_CORE_READY) {
      updateBootCheck('BOOT: waiting on hydrate… (?boot_log=1)', false);
      // Keep polling a bit longer while core is alive.
      if (n < BOOT_POLL_HARD + 200) {
        setTimeout(() => confirmCoreBoot(n + 1), BOOT_POLL_MS);
        return;
      }
      updateBootCheck('BOOT TIMEOUT — open ?safe_boot=1&boot_log=1', true);
      window.__WTM_BOOT_FAILED = true;
      return;
    }
  }
  setTimeout(() => confirmCoreBoot(n + 1), BOOT_POLL_MS);
})(0);
