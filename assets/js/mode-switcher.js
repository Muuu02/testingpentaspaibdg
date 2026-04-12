/**
 * ============================================================
 * DARK/LIGHT MODE SWITCHER
 * ============================================================
 * Menangani toggle dark/light mode dengan localStorage
 * ============================================================
 */

(function() {
  'use strict';

  const MODE_KEY = 'pentas-pai-theme';
  const DARK_MODE_CLASS = 'dark-mode'; // atau gunakan data-theme="dark"
  const LIGHT_ICON = '<i class="fas fa-sun"></i>';
  const DARK_ICON = '<i class="fas fa-moon"></i>';

  // Deteksi preferensi sistem
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Ambil dari localStorage atau fallback ke sistem
  let currentMode = localStorage.getItem(MODE_KEY);
  if (!currentMode) {
    currentMode = systemPrefersDark ? 'dark' : 'light';
  }

  // Terapkan mode ke dokumen
  function applyMode(mode) {
    if (mode === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
    updateToggleButton(mode);
  }

  // Update tampilan tombol toggle
  function updateToggleButton(mode) {
    const toggleBtns = document.querySelectorAll('[data-mode-toggle]');
    toggleBtns.forEach(btn => {
      const iconSpan = btn.querySelector('.mode-toggle-icon');
      if (iconSpan) {
        iconSpan.innerHTML = mode === 'dark' ? LIGHT_ICON : DARK_ICON;
      }
      btn.setAttribute('aria-label', mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  // Toggle mode
  function toggleMode() {
    const newMode = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    localStorage.setItem(MODE_KEY, newMode);
    applyMode(newMode);
  }

  // Inisialisasi tombol toggle yang ada di halaman
  function initToggleButtons() {
    const toggleBtns = document.querySelectorAll('[data-mode-toggle]');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', toggleMode);
    });
  }

  // Terapkan mode awal
  applyMode(currentMode);
  
  // Inisialisasi setelah DOM siap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initToggleButtons);
  } else {
    initToggleButtons();
  }

  // Ekspos fungsi toggle global jika diperlukan
  window.toggleDarkMode = toggleMode;
})();