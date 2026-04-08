/**
 * ============================================================
 * MAIN JAVASCRIPT - PENTAS PAI KOTA BANDUNG 2026
 * ============================================================
 * File utama yang berisi fungsionalitas umum website
 * ============================================================
 */

// ============================================
// KONFIGURASI GLOBAL
// ============================================
const CONFIG = {
    // Ganti dengan Site Key reCAPTCHA v3 Anda
    RECAPTCHA_SITE_KEY: localStorage.getItem('RECAPTCHA_SITE_KEY') || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
    
    // URL Google Apps Script Web App
    GAS_WEB_APP_URL: localStorage.getItem('GAS_WEB_APP_URL') || 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
    
    // URL Google Form untuk upload file
    GOOGLE_FORM_URL: localStorage.getItem('GOOGLE_FORM_URL') || '',
    
    // Public Key RSA untuk enkripsi
    RSA_PUBLIC_KEY: localStorage.getItem('RSA_PUBLIC_KEY') || null
};

// ============================================
// DATA JENIS LOMBA
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
        materi: [
            'Materi PAI kelas 1 sampai 6',
            'Capaian Pembelajaran (CP) Kurikulum Merdeka',
            'Pengetahuan umum keagamaan'
        ],
        mekanisme: [
            'Babak Penyisihan: Soal lemparan (10 soal) dan soal rebutan (10 soal)',
            'Babak Semifinal: Soal lemparan, rebutan, game, IT, dan menulis ayat',
            'Babak Final: Soal lemparan, rebutan (15 soal), mengurutkan ayat, game, literasi'
        ],
        penilaian: {
            'Soal Lemparan': 'Benar: +100, Salah: 0',
            'Soal Rebutan': 'Benar: +100, Salah: -100',
            'Menekan Bel Dini': '-25 poin'
        },
        waktu: 'Sesuai babak',
        peraturan: [
            'Peserta wajib membawa gadget dengan kuota internet untuk babak semifinal/final',
            'Jawaban tidak boleh diulang',
            'Jeda waktu menjawab maksimal 10 detik'
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
            'Peduli dan berbagi kepada yang membutuhkan',
            'Menjadi pemimpin yang dicintai',
            'Cerdas bergaul sesuai ajaran Islam',
            'Mencintai kedua orang tua',
            'Cinta kepada guru',
            'Menjaga masa depan dengan mencintai alam',
            'Aksi jarimu di media sosial adalah hisabmu di akhirat',
            'Mencintai Rasulullah saw.',
            'Menjaga persatuan dengan tasamuh',
            'Pemuda-pemudi impian masa depan'
        ],
        mekanisme: [
            'Peserta tampil berdasarkan nomor undian',
            'Menyerahkan teks pidato 3 rangkap kepada juri',
            'Waktu 7-10 menit per peserta',
            'Disampaikan tanpa membaca teks'
        ],
        penilaian: {
            'Kesesuaian tema dan isi': '30 poin',
            'Sistematika': '30 poin',
            'Penguasaan Materi': '40 poin',
            'Gaya bahasa': '30 poin',
            'Ekspresi dan retorika': '30 poin',
            'Ketepatan ayat/Hadits': '30 poin',
            'Ketepatan waktu': '10 poin',
            'TOTAL': '200 poin'
        },
        waktu: '7-10 menit',
        peraturan: [
            'Diperbolehkan sisipan bahasa daerah, Arab, atau Inggris',
            'Tidak boleh membaca teks',
            'Bahasa Indonesia yang baik dan benar'
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
            'Q.S. Al-Baqarah mulai ayat 255',
            'Q.S. Ali-Imran mulai ayat 31',
            'Q.S. Ali-Imran mulai ayat 144',
            'Q.S. Ar-Rahman mulai ayat 1',
            'Q.S. Al-Kahfi mulai ayat 1',
            'Q.S. Al-Isra mulai ayat 78'
        ],
        mekanisme: [
            'Peserta dipanggil berdasarkan nomor urut undian',
            'Membacakan ayat sesuai maqro yang dipilih',
            'Minimal 3 lagu, Bayati wajib sebagai pembuka dan penutup',
            'Waktu maksimal 8 menit'
        ],
        penilaian: {
            'Tajwid (Makhraj, Sifat, Ahkam)': '60 poin',
            'Fashahah wal Adab': '40 poin',
            'Suara (Vokal, Kejernihan, Kehalusan)': '40 poin',
            'Lagu/Nagmah': '60 poin',
            'TOTAL': '200 poin'
        },
        waktu: 'Maksimal 8 menit',
        peraturan: [
            'Bayati sebagai lagu wajib pembuka dan penutup',
            'Minimal 3 lagu',
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
        deskripsi: 'Lomba hafalan Al-Qur\'an yang menguji kemampuan menghafal.',
        materi: [
            'Hafalan Wajib: Surat Al-Insyiqaq',
            'Hafalan Pilihan: Surat-surat juz 30 (Al-Buruj s.d. An-Nas)'
        ],
        mekanisme: [
            'Membaca surat wajib Al-Insyiqaq',
            'Menyambung 3 ayat dari surat panjang, sedang, pendek',
            'Melafalkan 2 surat penuh (panjang dan pendek)',
            'Menyambung akhir ayat ke surat berikutnya',
            'Menyebutkan 3 nama surat dari ayat yang dibacakan'
        ],
        penilaian: {
            'Tajwid': '50 poin',
            'Fashahah wal Adab': '50 poin',
            'Tahfidz (Hafalan)': '100 poin',
            'TOTAL': '200 poin'
        },
        waktu: 'Sesuai ketentuan',
        peraturan: [
            'Jika nilai sama, juara ditentukan dari nilai tahfidz tertinggi'
        ]
    },
    lki: {
        kode: 'LKI',
        nama: 'LKI (Lomba Kaligrafi Islam)',
        icon: 'fa-pen-fancy',
        jenis: 'perorangan',
        jumlahPeserta: 1,
        gender: 'pilih',
        deskripsi: 'Lomba seni tulis kaligrafi Islam dengan khat Naskhi.',
        materi: [
            'Materi: Q.S. Al-Insyirah',
            'Jenis Tulisan: Khat Naskhi'
        ],
        mekanisme: [
            'Peserta membuat kaligrafi secara bersamaan',
            'Kertas ukuran A3 disediakan panitia',
            'Waktu pengerjaan maksimal 240 menit (4 jam)',
            'Peserta wajib membawa spidol kecil warna hitam'
        ],
        penilaian: {
            'Ketetapan Kaidah Tulisan': '100 poin',
            'Kebersihan, Keindahan': '10 poin',
            'Keserasian Warna & Ornamen': '90 poin',
            'TOTAL': '200 poin'
        },
        waktu: 'Maksimal 4 jam',
        peraturan: [
            'Variasi ornamen bebas',
            'Dilarang menggunakan alat cetak (mal/stempel)',
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
        materi: [
            'Shalat Maghrib 3 rakaat berjamaah',
            'Rakaat 1: Surah Al-Kafirun',
            'Rakaat 2: Surah Al-Lahab'
        ],
        mekanisme: [
            'Peserta melaksanakan praktik shalat Maghrib',
            'Dibagi 2 ruangan (1-15 dan 16-30)',
            'Juara tiap ruang ke babak final',
            'Penilaian dari Takbiratul Ihram hingga Salam'
        ],
        penilaian: {
            'Kesempurnaan bacaan': '100 poin',
            'Kesempurnaan gerakan': '100 poin',
            'Pakaian': '50 poin',
            'TOTAL': '250 poin'
        },
        waktu: 'Sesuai praktik',
        peraturan: [
            'Imam mengeraskan suara (jahr)',
            'Shalat 3 rakaat sempurna',
            '2 putra + 1 putri',
            'Minimal 1 Imam'
        ]
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
        materi: [
            'Lagu Wajib: "Jasa Guru" (Nidaria)'
        ],
        mekanisme: [
            'Tampil berdasarkan nomor urut undian',
            'Wajib menyanyikan lagu wajib "Jasa Guru"',
            'Alat musik: rebana',
            'Opening dan closing tidak dinilai'
        ],
        penilaian: {
            'Vocal (Kualitas, Nada, Artikulasi, Improvisasi, Ekspresi)': '350 poin',
            'Instrumen (Teknik, Kreasi, Kekompakan)': '250 poin',
            'Penampilan (Busana, Kekompakan, Gerakan)': '200 poin',
            'TOTAL': '800 poin'
        },
        waktu: 'Sesuai ketentuan',
        peraturan: [
            'Anggota grup harus homogen (semua laki-laki atau semua perempuan)',
            '9-11 orang per grup',
            'Grup campuran tidak diperbolehkan',
            'Minimal 9 anggota wajib'
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
        materi: [
            'Adzan lengkap',
            'Doa sesudah adzan'
        ],
        mekanisme: [
            'Peserta hadir 15 menit sebelum acara',
            'Dipanggil berdasarkan nomor undian',
            'Nada bebas',
            'Maksimal waktu 8 menit'
        ],
        penilaian: {
            'Tajwid dan Fashohah': '100 poin',
            'Irama & Suara': '100 poin',
            'Adab dan Kerapihan': '20 poin',
            'Doa sesudah adzan': '20 poin',
            'TOTAL': '250 poin'
        },
        waktu: 'Maksimal 8 menit',
        peraturan: [
            'Pakaian muslim rapi dan sopan',
            'Tidak ada pengulangan jika salah',
            'Doa sesudah adzan dengan suara keras',
            'Khusus putra'
        ]
    }
};

// ============================================
// FUNGSI UTILITAS
// ============================================

/**
 * Fungsi untuk menampilkan detail lomba dalam modal
 * @param {string} lombaId - ID jenis lomba
 */
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
                <h4 class="text-lg font-bold text-emerald-700 mb-3">
                    <i class="fas fa-book mr-2"></i>Pilihan Maqro
                </h4>
                <ul class="space-y-2">
                    ${data.maqro.map((m, i) => `<li class="flex items-start"><span class="bg-emerald-100 text-emerald-700 rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2 flex-shrink-0">${i+1}</span><span>${m}</span></li>`).join('')}
                </ul>
            </div>
        `;
    } else if (data.materi) {
        materiHtml = `
            <div>
                <h4 class="text-lg font-bold text-emerald-700 mb-3">
                    <i class="fas fa-book mr-2"></i>Materi
                </h4>
                <ul class="space-y-2">
                    ${data.materi.map(m => `<li class="flex items-start"><i class="fas fa-check text-emerald-600 mt-1 mr-2"></i><span>${m}</span></li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    content.innerHTML = `
        <div class="space-y-6">
            <div class="bg-emerald-50 rounded-xl p-4 md:p-6">
                <p class="text-gray-700">${data.deskripsi}</p>
                <div class="mt-4 flex flex-wrap gap-2">
                    <span class="px-3 py-1 bg-emerald-600 text-white text-sm rounded-full">
                        <i class="fas fa-users mr-1"></i>${data.jenis === 'regu' ? `${data.jumlahPeserta} orang` : data.jenis === 'grup' ? '9-11 orang' : '1 orang'}
                    </span>
                    <span class="px-3 py-1 bg-amber-400 text-emerald-900 text-sm rounded-full">
                        <i class="fas fa-clock mr-1"></i>${data.waktu}
                    </span>
                    ${data.gender === 'pilih' ? '<span class="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">Putra/Putri</span>' : ''}
                    ${data.gender === 'putra' ? '<span class="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">Putra</span>' : ''}
                    ${data.gender === '2putra1putri' ? '<span class="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">2 Putra + 1 Putri</span>' : ''}
                    ${data.gender === 'homogen' ? '<span class="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full">Homogen</span>' : ''}
                </div>
            </div>
            
            ${materiHtml}
            
            <div>
                <h4 class="text-lg font-bold text-emerald-700 mb-3">
                    <i class="fas fa-cogs mr-2"></i>Mekanisme
                </h4>
                <ul class="space-y-2">
                    ${data.mekanisme.map(m => `<li class="flex items-start"><i class="fas fa-chevron-right text-amber-500 mt-1 mr-2"></i><span>${m}</span></li>`).join('')}
                </ul>
            </div>
            
            <div>
                <h4 class="text-lg font-bold text-emerald-700 mb-3">
                    <i class="fas fa-star mr-2"></i>Sistem Penilaian
                </h4>
                <div class="bg-gray-50 rounded-xl p-4">
                    <table class="w-full text-sm">
                        ${Object.entries(data.penilaian).map(([k, v]) => `
                            <tr class="border-b last:border-0">
                                <td class="py-2 text-gray-700">${k}</td>
                                <td class="py-2 text-right font-semibold text-emerald-700">${v}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            </div>
            
            <div>
                <h4 class="text-lg font-bold text-emerald-700 mb-3">
                    <i class="fas fa-exclamation-triangle mr-2"></i>Peraturan
                </h4>
                <ul class="space-y-2">
                    ${data.peraturan.map(p => `<li class="flex items-start"><i class="fas fa-info-circle text-amber-500 mt-1 mr-2"></i><span>${p}</span></li>`).join('')}
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

/**
 * Fungsi untuk menutup modal detail lomba
 */
function closeLombaModal() {
    const modal = document.getElementById('lombaModal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

/**
 * Fungsi untuk menampilkan notifikasi
 * @param {string} message - Pesan notifikasi
 * @param {string} type - Tipe notifikasi (success, error, warning, info)
 * @param {number} duration - Durasi tampil dalam ms
 */
function showNotification(message, type = 'info', duration = 5000) {
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();
    
    const colors = {
        success: 'bg-emerald-500',
        error: 'bg-red-500',
        warning: 'bg-amber-500',
        info: 'bg-blue-500'
    };
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const notification = document.createElement('div');
    notification.className = `notification-toast fixed top-20 right-4 ${colors[type]} text-white px-4 md:px-6 py-3 md:py-4 rounded-xl shadow-2xl z-50 flex items-center max-w-sm animate-slide-in`;
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
 * Fungsi untuk format tanggal Indonesia
 * @param {string|Date} date - Tanggal
 * @returns {string} Tanggal format Indonesia
 */
function formatTanggalIndonesia(date) {
    const d = new Date(date);
    const bulan = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Fungsi untuk validasi NISN
 * @param {string} nisn - Nomor NISN
 * @returns {boolean} Valid atau tidak
 */
function validasiNISN(nisn) {
    return /^\d{10}$/.test(nisn);
}

/**
 * Fungsi untuk validasi nomor HP Indonesia
 * @param {string} noHP - Nomor HP
 * @returns {boolean} Valid atau tidak
 */
function validasiNoHP(noHP) {
    return /^(\+62|62|0)8[1-9][0-9]{6,11}$/.test(noHP);
}

/**
 * Fungsi untuk validasi email
 * @param {string} email - Alamat email
 * @returns {boolean} Valid atau tidak
 */
function validasiEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Fungsi untuk masking data sensitif
 * @param {string} data - Data yang akan di-mask
 * @param {number} visibleChars - Jumlah karakter yang terlihat di akhir
 * @returns {string} Data yang sudah di-mask
 */
function maskData(data, visibleChars = 4) {
    if (!data || data.length <= visibleChars) return data;
    const masked = '*'.repeat(data.length - visibleChars);
    return masked + data.slice(-visibleChars);
}

/**
 * Fungsi untuk generate ID pendaftaran
 * @returns {string} ID unik
 */
function generatePendaftaranID() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PPAI-${timestamp}-${random}`;
}

// ============================================
// SCROLL ANIMATION
// ============================================

/**
 * Fungsi untuk mengaktifkan animasi scroll reveal
 */
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    document.querySelectorAll('.scroll-reveal').forEach(el => {
        observer.observe(el);
    });
}

// ============================================
// NAVBAR SCROLL EFFECT
// ============================================

/**
 * Fungsi untuk efek navbar saat scroll
 */
function initNavbarScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('shadow-xl');
        } else {
            navbar.classList.remove('shadow-xl');
        }
    });
}

// ============================================
// MOBILE MENU
// ============================================

/**
 * Fungsi untuk inisialisasi mobile menu
 */
function initMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const menu = document.getElementById('mobileMenu');
    
    if (!btn || !menu) return;
    
    btn.addEventListener('click', () => {
        menu.classList.toggle('hidden');
    });
    
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.add('hidden');
        });
    });
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initNavbarScroll();
    initMobileMenu();
});

// Export fungsi untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        LOMBA_DATA,
        showNotification,
        formatTanggalIndonesia,
        validasiNISN,
        validasiNoHP,
        validasiEmail,
        maskData,
        generatePendaftaranID
    };
}
