# 🏆 PENTAS PAI KOTA BANDUNG 2026

Sistem Pendaftaran Online untuk Pekan Keterampilan dan Seni Pendidikan Agama Islam Tingkat Kota Bandung Tahun 2026.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Security](https://img.shields.io/badge/security-RSA--2048-orange)

---

## 📋 Fitur Utama

### 🔐 Keamanan Tingkat Tinggi
- **RSA-2048 Encryption** untuk data sensitif (NISN, no HP, email)
- **PBKDF2 100k iterasi** untuk autentikasi
- **Private Key Sharding** (3 shards untuk 3 panitia)
- **Rate Limiting** (10 request/jam per IP)
- **Race Condition Prevention** dengan LockService
- **Data Pseudonymization** untuk public log
- **Audit Trail** lengkap

### 📝 Fitur Pendaftaran
- **Multi-step Form** (3 langkah: Data Sekolah → Data Peserta → Lomba & Berkas)
- **8 Jenis Lomba**: LCCP, LDC, MTQ, MHQ, LKI, LPSB, LSQR, LPA
- **Upload Berkas** via Google Form
- **Cek Status** pendaftaran online
- **Responsive Design** untuk mobile dan desktop

### 👨‍💼 Admin Panel
- **Dashboard** dengan statistik real-time
- **Verifikasi/Tolak** pendaftaran
- **Filter & Search** data
- **Export** ke CSV/Excel/JSON
- **Audit Log** aktivitas

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  GitHub Pages   │────▶│ Google Apps Script│────▶│  Google Sheets  │
│  (Frontend)     │     │    (Backend)      │     │   (Database)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌──────────────────┐
│ Google reCAPTCHA│     │   Google Drive   │
│    (Security)   │     │ (File Storage)   │
└─────────────────┘     └──────────────────┘
```

### Teknologi Stack
- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript
- **Backend**: Google Apps Script
- **Database**: Google Sheets
- **File Storage**: Google Drive
- **Security**: Web Crypto API, reCAPTCHA v3
- **Hosting**: GitHub Pages (Gratis)

---

## 📁 Struktur Folder

```
pentas-pai-2026/
├── index.html              # Landing page
├── assets/
│   ├── css/               # Stylesheets
│   ├── js/
│   │   ├── main.js        # Fungsi umum
│   │   ├── crypto.js      # Modul enkripsi
│   │   ├── form.js        # Handler form
│   │   ├── countdown.js   # Countdown timer
│   │   └── admin.js       # Admin panel logic
│   └── images/            # Gambar/logo
├── pages/
│   ├── form.html          # Form pendaftaran
│   ├── status.html        # Cek status
│   └── admin.html         # Admin panel
├── scripts/
│   └── Code.gs            # Google Apps Script
├── docs/
│   ├── SETUP.md           # Panduan setup
│   └── PANDUAN_PANITIA.md # Panduan panitia
└── README.md              # Dokumentasi ini
```

---

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/username/pentas-pai-2026.git
cd pentas-pai-2026
```

### 2. Setup Google Sheets
- Buat spreadsheet baru di Google Sheets
- Copy kode dari `scripts/Code.gs` ke Google Apps Script
- Deploy sebagai Web App

### 3. Konfigurasi
Edit file `assets/js/main.js`:
```javascript
const CONFIG = {
    RECAPTCHA_SITE_KEY: 'your_recaptcha_site_key',
    GAS_WEB_APP_URL: 'your_gas_web_app_url',
    GOOGLE_FORM_URL: 'your_google_form_url'
};
```

### 4. Deploy ke GitHub Pages
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

Enable GitHub Pages di repository settings.

---

## 📖 Dokumentasi Lengkap

- [Panduan Setup](docs/SETUP.md) - Setup lengkap sistem
- [Panduan Panitia](docs/PANDUAN_PANITIA.md) - Panduan untuk panitia

---

## 🔒 Keamanan

### Enkripsi Data
Data sensitif dienkripsi menggunakan RSA-2048:
- NISN
- Nomor HP
- Email

### Autentikasi
- Password di-hash dengan PBKDF2 (100k iterasi)
- Session JWT dengan expiry 24 jam
- Tidak menyimpan password di localStorage

### Private Key Management
- Private key dipecah menjadi 3 shards
- Setiap shard dipegang oleh panitia berbeda
- Dekripsi memerlukan 3 shards sekaligus

---

## 🛠️ Maintenance

### Backup Berkala
- Backup Google Sheets harian
- Export data mingguan
- Simpan di tempat aman

### Monitoring
- Cek audit trail harian
- Monitor rate limit
- Review error log

---

## 🐛 Troubleshooting

### Form tidak bisa submit
- Cek reCAPTCHA Site Key
- Cek GAS Web App URL
- Cek console untuk error

### Data tidak muncul di admin
- Cek permission Web App (harus "Anyone")
- Cek spreadsheet ID
- Refresh halaman

### Enkripsi error
- Pastikan RSA_PUBLIC_KEY sudah diset
- Jalankan generateKeys() di console

---

## 📞 Kontak

**Panitia PENTAS PAI Kota Bandung 2026**
- Email: panitia@pentaspai.bdg
- Website: https://username.github.io/pentas-pai-2026

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

---

## 🙏 Terima Kasih

Dibuat dengan ❤️ untuk generasi berakhlak mulia.

**PENTAS PAI KOTA BANDUNG 2026**
*Wujudkan Generasi Beriman, Bertakwa, dan Berakhlak Mulia*
