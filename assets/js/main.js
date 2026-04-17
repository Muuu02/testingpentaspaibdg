/**
 * ============================================================
 * MAIN JAVASCRIPT - PENTAS PAI KOTA BANDUNG 2026
 * ============================================================
 * File utama yang berisi konfigurasi, data lomba, dan utilitas global.
 * Semua fetch menggunakan Content-Type: text/plain untuk menghindari CORS preflight.
 * ============================================================
 */

// ============================================
// KONFIGURASI GLOBAL
// ============================================
const CONFIG = {
    // Ganti dengan URL Google Apps Script Web App Anda
    GAS_WEB_APP_URL: localStorage.getItem('GAS_WEB_APP_URL') || 
        'https://script.google.com/macros/s/AKfycbyo1VOHEB9ejRu55vjDFf36xHsVly-jyOG85HLQva87EryD9CGmRz28U1AyLQ-9WA63/exec',
    
    // Google Form untuk upload berkas (opsional)
    GOOGLE_FORM_UPLOAD_URL: 'https://forms.gle/YOUR_FORM_ID',
    
    // Site Key reCAPTCHA v3 (test key)
    RECAPTCHA_SITE_KEY: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
    
    // Default nomor WhatsApp admin (akan di-override dari CONFIG_SISTEM)
    WHATSAPP_ADMIN: '6281234567890',
    
    // Status form pendaftaran (default aktif)
    FORM_ACTIVE: true
};

// ============================================
// DATA JENIS LOMBA (Sesuai Juknis)
// ============================================
const LOMBA_DATA = {
    lccp: {
        kode: 'LCCP',
        nama: 'LCC-PAI (Lomba Cerdas Cermat PAI)',
        icon: 'fa-brain',
        jenis: 'regu',
        jumlahPeserta: 3,
        gender: 'bebas',
        deskripsi: 'Lomba Cerdas Cermat Pendidikan Agama Islam menguji pengetahuan peserta tentang materi PAI dari kelas 1 sampai 6.',
        materi: ['Materi PAI kelas 1-6', 'Capaian Pembelajaran Kurikulum Merdeka', 'Pengetahuan umum keagamaan'],
        mekanisme: [
            'Babak Penyisihan: Soal lemparan (10) dan rebutan (10)',
            'Babak Semifinal: Soal lemparan, rebutan, game, IT, menulis ayat',
            'Babak Final: Soal lemparan, rebutan (15), mengurutkan ayat, game, literasi'
        ],
        penilaian: {
            'Soal Lemparan': 'Benar +100, Salah 0',
            'Soal Rebutan': 'Benar +100, Salah -100',
            'Menekan Bel Dini': '-25 poin'
        },
        waktu: 'Sesuai babak',
        peraturan: [
            'Peserta wajib membawa gadget dengan kuota internet',
            'Jawaban tidak boleh diulang',
            'Jeda waktu menjawab maks 10 detik'
        ]
    },
    ldc: {
        kode: 'LDC',
        nama: 'LDC (Lomba Da\'i Cilik)',
        icon: 'fa-microphone',
        jenis: 'perorangan',
        jumlahPeserta: 1,
        gender: 'pilih',
        deskripsi: 'Lomba pidato/ceramah dengan tema-tema keislaman yang menginspirasi.',
        materi: [
            'Peduli dan berbagi', 'Menjadi pemimpin yang dicintai', 'Cerdas bergaul sesuai ajaran Islam',
            'Mencintai orang tua dan guru', 'Menjaga masa depan dengan mencintai alam',
            'Aksi jarimu di media sosial', 'Mencintai Rasulullah', 'Menjaga persatuan', 'Pemuda impian masa depan'
        ],
        mekanisme: [
            'Tampil berdasarkan nomor undian', 'Menyerahkan teks pidato 3 rangkap',
            'Waktu 7-10 menit', 'Tanpa membaca teks'
        ],
        penilaian: {
            'Kesesuaian tema & isi': '30', 'Sistematika': '30', 'Penguasaan Materi': '40',
            'Gaya bahasa': '30', 'Ekspresi & retorika': '30', 'Ketepatan ayat/Hadits': '30',
            'Ketepatan waktu': '10', 'TOTAL': '200'
        },
        waktu: '7-10 menit',
        peraturan: [
            'Boleh sisipan bahasa daerah, Arab, atau Inggris',
            'Tidak boleh membaca teks', 'Bahasa Indonesia yang baik'
        ]
    },
    mtq: {
        kode: 'MTQ',
        nama: 'MTQ (Musabaqah Tilawatil Qur\'an)',
        icon: 'fa-book-quran',
        jenis: 'perorangan',
        jumlahPeserta: 1,
        gender: 'pilih',
        deskripsi: 'Lomba membaca Al-Qur\'an dengan lagu dan tajwid yang baik.',
        maqro: [
            'Q.S. Al-Baqarah: 255', 'Q.S. Ali-Imran: 31', 'Q.S. Ali-Imran: 144',
            'Q.S. Ar-Rahman: 1', 'Q.S. Al-Kahfi: 1', 'Q.S. Al-Isra: 78'
        ],
        mekanisme: [
            'Dipanggil sesuai nomor undian', 'Membaca maqro pilihan',
            'Minimal 3 lagu, Bayati wajib pembuka dan penutup', 'Waktu maks 8 menit'
        ],
        penilaian: {
            'Tajwid': '60', 'Fashahah wal Adab': '40', 'Suara': '40',
            'Lagu/Nagmah': '60', 'TOTAL': '200'
        },
        waktu: 'Maksimal 8 menit',
        peraturan: [
            'Bayati wajib pembuka dan penutup', 'Minimal 3 lagu',
            'Mempertimbangkan kesalahan jali dan khafi'
        ]
    },
    mhq: {
        kode: 'MHQ',
        nama: 'MHQ (Musabaqah Hifzhul Qur\'an)',
        icon: 'fa-memory',
        jenis: 'perorangan',
        jumlahPeserta: 1,
        gender: 'pilih',
        deskripsi: 'Lomba hafalan Al-Qur\'an juz 30.',
        materi: ['Hafalan Wajib: Surat Al-Insyiqaq', 'Hafalan Pilihan: Surat-surat juz 30'],
        mekanisme: [
            'Membaca surat wajib', 'Menyambung 3 ayat', 'Melafalkan 2 surat penuh',
            'Menyambung akhir ayat ke surat berikutnya', 'Menyebutkan nama surat dari ayat'
        ],
        penilaian: {
            'Tajwid': '50', 'Fashahah wal Adab': '50', 'Tahfidz': '100', 'TOTAL': '200'
        },
        waktu: 'Sesuai ketentuan',
        peraturan: ['Jika nilai sama, juara ditentukan dari nilai tahfidz tertinggi']
    },
    lki: {
        kode: 'LKI',
        nama: 'LKI (Lomba Kaligrafi Islam)',
        icon: 'fa-pen-fancy',
        jenis: 'perorangan',
        jumlahPeserta: 1,
        gender: 'pilih',
        deskripsi: 'Lomba seni tulis kaligrafi Islam dengan khat Naskhi.',
        materi: ['Materi: Q.S. Al-Insyirah', 'Khat Naskhi'],
        mekanisme: [
            'Peserta membuat kaligrafi secara bersamaan', 'Kertas A3 disediakan panitia',
            'Waktu 240 menit', 'Peserta membawa spidol kecil hitam'
        ],
        penilaian: {
            'Ketepatan Kaidah': '100', 'Kebersihan & Keindahan': '10',
            'Keserasian Warna & Ornamen': '90', 'TOTAL': '200'
        },
        waktu: 'Maksimal 4 jam',
        peraturan: [
            'Variasi ornamen bebas', 'Dilarang menggunakan alat cetak (mal/stempel)',
            'Peserta membawa alat tulis sendiri'
        ]
    },
    lpsb: {
        kode: 'LPSB',
        nama: 'LPSB (Lomba Praktik Shalat Berjama\'ah)',
        icon: 'fa-praying-hands',
        jenis: 'regu',
        jumlahPeserta: 3,
        gender: '2putra1putri',
        deskripsi: 'Lomba praktik shalat Maghrib berjamaah 3 rakaat.',
        materi: ['Shalat Maghrib 3 rakaat', 'Rakaat 1: Al-Kafirun', 'Rakaat 2: Al-Lahab'],
        mekanisme: [
            'Praktik shalat Maghrib berjamaah', 'Dibagi 2 ruangan',
            'Penilaian dari Takbiratul Ihram hingga Salam'
        ],
        penilaian: {
            'Kesempurnaan bacaan': '100', 'Kesempurnaan gerakan': '100',
            'Pakaian': '50', 'TOTAL': '250'
        },
        waktu: 'Sesuai praktik',
        peraturan: ['Imam mengeraskan suara (jahr)', '2 putra + 1 putri', 'Minimal 1 Imam']
    },
    lsqr: {
        kode: 'LSQR',
        nama: 'LSQR (Lomba Seni Qasidah Rebana)',
        icon: 'fa-drum',
        jenis: 'grup',
        jumlahPesertaMin: 9,
        jumlahPesertaMax: 11,
        gender: 'homogen',
        deskripsi: 'Lomba seni musik islami dengan alat rebana.',
        materi: ['Lagu Wajib: "Jasa Guru" (Nidaria)'],
        mekanisme: [
            'Tampil berdasarkan nomor undian', 'Wajib menyanyikan lagu wajib',
            'Alat musik: rebana', 'Opening dan closing tidak dinilai'
        ],
        penilaian: {
            'Vocal': '350', 'Instrumen': '250', 'Penampilan': '200', 'TOTAL': '800'
        },
        waktu: 'Sesuai ketentuan',
        peraturan: [
            'Anggota grup harus homogen gender', '9-11 orang',
            'Grup campuran tidak diperbolehkan'
        ]
    },
    lpa: {
        kode: 'LPA',
        nama: 'LPA (Lomba Praktik Adzan)',
        icon: 'fa-bullhorn',
        jenis: 'perorangan',
        jumlahPeserta: 1,
        gender: 'putra',
        deskripsi: 'Lomba adzan dengan irama dan tajwid yang baik.',
        materi: ['Adzan lengkap', 'Doa sesudah adzan'],
        mekanisme: [
            'Hadir 15 menit sebelum acara', 'Dipanggil sesuai nomor undian',
            'Nada bebas', 'Waktu maks 8 menit'
        ],
        penilaian: {
            'Tajwid & Fashohah': '100', 'Irama & Suara': '100',
            'Adab & Kerapihan': '20', 'Doa sesudah adzan': '20', 'TOTAL': '250'
        },
        waktu: 'Maksimal 8 menit',
        peraturan: [
            'Pakaian muslim rapi dan sopan', 'Tidak ada pengulangan jika salah',
            'Doa sesudah adzan dengan suara keras', 'Khusus putra'
        ]
    }
};

// ============================================
// FUNGSI UTILITAS
// ============================================

/**
 * Menampilkan notifikasi toast
 */
function showNotification(message, type = 'info', duration = 5000) {
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();
    
    const colors = {
        success: 'bg-emerald-500', error: 'bg-red-500',
        warning: 'bg-amber-500', info: 'bg-blue-500'
    };
    const icons = {
        success: 'fa-check-circle', error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle', info: 'fa-info-circle'
    };
    
    const notification = document.createElement('div');
    notification.className = `notification-toast fixed top-20 right-4 ${colors[type]} text-white px-4 md:px-6 py-3 md:py-4 rounded-xl shadow-2xl z-50 flex items-center max-w-sm`;
    notification.innerHTML = `
        <i class="fas ${icons[type]} text-lg md:text-xl mr-3"></i>
        <span class="font-medium text-sm">${message}</span>
        <button onclick="this.parentElement.remove()" class="ml-4 text-white/80 hover:text-white">
            <i class="fas fa-times"></i>
        </button>
    `;
    document.body.appendChild(notification);
    
    if (duration > 0) {
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
}

/**
 * Format tanggal Indonesia
 */
function formatTanggalIndonesia(date) {
    const d = new Date(date);
    if (isNaN(d)) return date;
    const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                   'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Validasi NISN (10 digit)
 */
function validasiNISN(nisn) {
    return /^\d{10}$/.test(nisn);
}

/**
 * Validasi nomor HP Indonesia
 */
function validasiNoHP(noHP) {
    return /^(\+62|62|0)8[1-9][0-9]{6,11}$/.test(noHP.replace(/\s/g, ''));
}

/**
 * Validasi email
 */
function validasiEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Mask data sensitif
 */
function maskData(data, visibleChars = 4) {
    if (!data || data.length <= visibleChars) return data;
    return '*'.repeat(data.length - visibleChars) + data.slice(-visibleChars);
}

/**
 * Mask email
 */
function maskEmail(email) {
    if (!email) return '';
    const [username, domain] = email.split('@');
    if (!domain) return email;
    const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
    return `${maskedUsername}@${domain}`;
}

/**
 * Generate ID Pendaftaran unik
 */
function generatePendaftaranID() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PPAI-${timestamp}-${random}`;
}

// ============================================
// FUNGSI DETAIL LOMBA (Modal)
// ============================================

function showLombaDetail(lombaId) {
    const data = LOMBA_DATA[lombaId];
    if (!data) return;
    
    const modal = document.getElementById('lombaModal');
    const title = document.getElementById('modalTitle');
    const content = document.getElementById('modalContent');
    
    title.innerHTML = `<i class="fas ${data.icon} mr-3"></i>${data.nama}`;
    
    let materiHtml = '';
    if (data.maqro) {
        materiHtml = `
            <div>
                <h4 class="text-lg font-bold text-emerald-400 mb-3"><i class="fas fa-book mr-2"></i>Pilihan Maqro</h4>
                <ul class="space-y-2">
                    ${data.maqro.map((m, i) => `<li class="flex items-start"><span class="bg-emerald-900/50 text-emerald-300 rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">${i+1}</span><span class="text-gray-300">${m}</span></li>`).join('')}
                </ul>
            </div>
        `;
    } else if (data.materi) {
        materiHtml = `
            <div>
                <h4 class="text-lg font-bold text-emerald-400 mb-3"><i class="fas fa-book mr-2"></i>Materi</h4>
                <ul class="space-y-2">
                    ${data.materi.map(m => `<li class="flex items-start"><i class="fas fa-check text-emerald-400 mt-1 mr-2"></i><span class="text-gray-300">${m}</span></li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    let penilaianHtml = '';
    if (data.penilaian) {
        penilaianHtml = `
            <div>
                <h4 class="text-lg font-bold text-emerald-400 mb-3"><i class="fas fa-star mr-2"></i>Sistem Penilaian</h4>
                <div class="bg-gray-800 rounded-xl p-4">
                    <table class="w-full text-sm">
                        ${Object.entries(data.penilaian).map(([k, v]) => `
                            <tr class="border-b border-gray-600 last:border-0">
                                <td class="py-2 text-gray-300">${k}</td>
                                <td class="py-2 text-right font-semibold text-emerald-400">${v}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            </div>
        `;
    }
    
    content.innerHTML = `
        <div class="space-y-6 text-gray-200">
            <div class="bg-emerald-900/30 rounded-xl p-4 md:p-6 border border-emerald-700">
                <p class="text-gray-300">${data.deskripsi}</p>
                <div class="mt-4 flex flex-wrap gap-2">
                    <span class="px-3 py-1 bg-emerald-800 text-emerald-200 text-sm rounded-full"><i class="fas fa-users mr-1"></i>${data.jenis === 'regu' ? `${data.jumlahPeserta} orang` : data.jenis === 'grup' ? '9-11 orang' : '1 orang'}</span>
                    <span class="px-3 py-1 bg-amber-700 text-amber-200 text-sm rounded-full"><i class="fas fa-clock mr-1"></i>${data.waktu}</span>
                    ${data.gender === 'pilih' ? '<span class="px-3 py-1 bg-blue-800 text-blue-200 text-sm rounded-full">Putra/Putri</span>' : ''}
                    ${data.gender === 'putra' ? '<span class="px-3 py-1 bg-blue-800 text-blue-200 text-sm rounded-full">Putra</span>' : ''}
                    ${data.gender === '2putra1putri' ? '<span class="px-3 py-1 bg-purple-800 text-purple-200 text-sm rounded-full">2 Putra + 1 Putri</span>' : ''}
                    ${data.gender === 'homogen' ? '<span class="px-3 py-1 bg-indigo-800 text-indigo-200 text-sm rounded-full">Homogen</span>' : ''}
                </div>
            </div>
            ${materiHtml}
            <div>
                <h4 class="text-lg font-bold text-emerald-400 mb-3"><i class="fas fa-cogs mr-2"></i>Mekanisme</h4>
                <ul class="space-y-2">
                    ${data.mekanisme.map(m => `<li class="flex items-start"><i class="fas fa-chevron-right text-amber-400 mt-1 mr-2"></i><span class="text-gray-300">${m}</span></li>`).join('')}
                </ul>
            </div>
            ${penilaianHtml}
            <div>
                <h4 class="text-lg font-bold text-emerald-400 mb-3"><i class="fas fa-exclamation-triangle mr-2"></i>Peraturan</h4>
                <ul class="space-y-2">
                    ${data.peraturan.map(p => `<li class="flex items-start"><i class="fas fa-info-circle text-amber-400 mt-1 mr-2"></i><span class="text-gray-300">${p}</span></li>`).join('')}
                </ul>
            </div>
            <div class="flex justify-center pt-4">
                <a href="pages/form.html?lomba=${lombaId}" class="btn-primary px-8 py-3 rounded-full text-white font-bold inline-flex items-center">
                    <i class="fas fa-paper-plane mr-2"></i>Daftar Lomba Ini
                </a>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeLombaModal() {
    const modal = document.getElementById('lombaModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

// ============================================
// INISIALISASI UMUM
// ============================================

function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
}

function initNavbarScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('shadow-xl', window.scrollY > 50);
    });
}

function initMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const menu = document.getElementById('mobileMenu');
    if (!btn || !menu) return;
    btn.addEventListener('click', () => menu.classList.toggle('hidden'));
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => menu.classList.add('hidden')));
}

function initFloatingWhatsApp() {
    if (document.querySelector('.whatsapp-float')) return;
    const waFloat = document.createElement('a');
    waFloat.href = `https://wa.me/${CONFIG.WHATSAPP_ADMIN}?text=Halo%20Panitia%20PENTAS%20PAI%202026%2C%20saya%20ingin%20bertanya...`;
    waFloat.target = '_blank';
    waFloat.className = 'whatsapp-float fixed bottom-20 right-6 w-14 h-14 md:w-16 md:h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg z-40 animate-pulse';
    waFloat.innerHTML = '<i class="fab fa-whatsapp text-3xl md:text-4xl text-white"></i>';
    waFloat.setAttribute('aria-label', 'Chat via WhatsApp');
    document.body.appendChild(waFloat);
}

// ============================================
// LOAD CONFIG DARI GAS (dengan text/plain)
// ============================================

async function loadSystemConfig() {
    try {
        const response = await fetch(CONFIG.GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'getConfig' })
        });
        const result = await response.json();
        if (result.success && result.data) {
            if (result.data.whatsapp_admin) CONFIG.WHATSAPP_ADMIN = result.data.whatsapp_admin;
            if (result.data.form_pendaftaran !== undefined) {
                CONFIG.FORM_ACTIVE = result.data.form_pendaftaran === 'aktif';
            }
            initFloatingWhatsApp();
        }
    } catch (error) {
        console.warn('Gagal load config, menggunakan default', error);
        initFloatingWhatsApp();
    }
}

// ============================================
// DOM CONTENT LOADED
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initNavbarScroll();
    initMobileMenu();
    
    if (CONFIG.GAS_WEB_APP_URL && !CONFIG.GAS_WEB_APP_URL.includes('YOUR_SCRIPT_ID')) {
        loadSystemConfig();
    } else {
        initFloatingWhatsApp();
    }
    
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('lombaModal');
        if (e.target === modal) closeLombaModal();
    });
});

// Export untuk modul (jika diperlukan)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, LOMBA_DATA, showNotification, formatTanggalIndonesia, validasiNISN, validasiNoHP, validasiEmail, maskData, generatePendaftaranID };
}
