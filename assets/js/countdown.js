/**
 * ============================================================
 * COUNTDOWN TIMER - PENTAS PAI KOTA BANDUNG 2026
 * ============================================================
 * Script untuk menghitung mundur waktu pelaksanaan event
 * Target: Mei - Juni 2026 (default: 1 Juni 2026)
 * ============================================================
 */

// Target tanggal pelaksanaan (1 Juni 2026)
const TARGET_DATE = new Date('2026-06-01T08:00:00').getTime();

/**
 * Fungsi untuk memperbarui countdown setiap detik
 */
function updateCountdown() {
    const now = new Date().getTime();
    const distance = TARGET_DATE - now;
    
    // Hitung hari, jam, menit, detik
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    // Update elemen HTML dengan format 2 digit
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    
    if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
    
    // Jika waktu sudah habis
    if (distance < 0) {
        if (daysEl) daysEl.textContent = '00';
        if (hoursEl) hoursEl.textContent = '00';
        if (minutesEl) minutesEl.textContent = '00';
        if (secondsEl) secondsEl.textContent = '00';
    }
}

// Jalankan countdown setiap detik
setInterval(updateCountdown, 1000);
updateCountdown(); // Jalankan sekali saat load
