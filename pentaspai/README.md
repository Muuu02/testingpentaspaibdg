# Pentas PAI Kota Bandung 2026

Sistem web pendaftaran & skoring lomba Pendidikan Agama Islam (PAI) tingkat SD Kota Bandung.

## 🛠️ Tech Stack

- **Backend**: Laravel 11 (PHP 8.2+)
- **Admin Panel**: FilamentPHP 3
- **Frontend**: Blade + Livewire 3 + TailwindCSS 3 + Alpine.js
- **Database**: MySQL 8 / MariaDB 10.11
- **AI Integration**: Google Gemini API
- **PDF/Excel**: DomPDF + Maatwebsite Excel

## ✨ Fitur Utama

### 1. Pendaftaran Online
- Auto-fill data sekolah via NPSN
- Multi-lomba registration
- Upload berkas dengan validasi
- AI-powered verification recommendation

### 2. Admin Panel (Filament)
- Role-based access control
- Verifikasi pendaftaran dengan AI assistance
- Generate nomor peserta otomatis
- Export Excel/PDF

### 3. LCC Scoring System
- Real-time scoring dengan polling 3 detik
- Timer & bel/siren control
- Leaderboard live update
- Tie-breaker otomatis

### 4. Card Builder
- GrapesJS drag-drop editor
- Custom template (A6, F4, A2)
- QR Code generation
- PDF export

### 5. AI Integration (Gemini)
- **Verifikasi Peserta**: Analisis konsistensi data dan dokumen
- **Document Analysis**: Klasifikasi dan validasi berkas upload
- **Essay Scoring**: Scoring rekomendasi untuk lomba tertulis
- **Anomaly Detection**: Deteksi pola skor mencurigakan
- **Feedback Generation**: Generate feedback otomatis untuk peserta

## 📁 Struktur Folder

```
pentaspai/
├── app/
│   ├── Facades/
│   │   └── Gemini.php
│   ├── Filament/
│   │   └── Resources/
│   ├── Http/
│   │   ├── Controllers/
│   │   └── Livewire/
│   │       └── Registration/
│   │           └── SchoolAutocomplete.php
│   ├── Models/
│   │   ├── Lcc/
│   │   ├── Pendaftaran.php
│   │   └── PesertaDetail.php
│   ├── Providers/
│   │   └── GeminiServiceProvider.php
│   └── Services/
│       └── AI/
│           └── GeminiService.php
├── config/
│   └── gemini.php
├── database/
│   └── migrations/
└── resources/
    └── views/
        └── livewire/
```

## 🚀 Installation

### Prerequisites
- PHP 8.2+
- Composer
- MySQL/MariaDB
- Node.js & NPM (optional untuk asset compilation)

### Steps

1. **Clone/Extract project**
```bash
cd /path/to/webroot
```

2. **Install dependencies**
```bash
composer install --no-dev --optimize-autoloader
```

3. **Setup environment**
```bash
cp .env.example .env
php artisan key:generate
```

4. **Configure database**
Edit `.env`:
```
DB_CONNECTION=mysql
DB_HOST=localhost
DB_DATABASE=pentaspai
DB_USERNAME=your_user
DB_PASSWORD=your_password
```

5. **Configure Gemini AI (Optional)**
```
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-pro
```

6. **Run migrations**
```bash
php artisan migrate --seed
```

7. **Set permissions**
```bash
chmod -R 775 storage/ bootstrap/cache/
```

8. **Access admin**
```
https://your-domain.com/admin
Default: admin / password (from seeder)
```

## 🔑 Gemini AI Configuration

Untuk mengaktifkan fitur AI:

1. Dapatkan API Key dari [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Set di `.env`:
```
GEMINI_API_KEY=AIzaSy...
GEMINI_ENABLE_VERIFICATION=true
```

3. Fitur yang tersedia:
   - ✅ Verifikasi otomatis data peserta
   - ✅ Analisis dokumen upload
   - ✅ Scoring esai rekomendasi
   - ✅ Deteksi anomaly skor
   - ✅ Generate feedback peserta

## 📊 Database Schema

### Core Tables
- `master_kecamatan` - Data kecamatan
- `master_sekolah` - Data sekolah SD
- `pendaftaran` - Pendaftaran lomba
- `peserta_detail` - Detail peserta (NISN encrypted)
- `nomor_undian` - Counter nomor undian
- `editions` - Multi-year support

### LCC Tables
- `events` - Event LCC
- `sessions` - Sesi/babak lomba
- `teams` - Tim peserta
- `scores` - Skor per kategori
- `activity_log` - Audit trail scoring

## 🔐 Security Features

- **NISN Encryption**: AES-256-CBC via Laravel Crypt
- **File Upload**: MIME validation, hash rename, ClamAV ready
- **Audit Trail**: Semua aksi admin tercatat
- **Rate Limiting**: 5 req/min per IP
- **reCAPTCHA v3**: Ready for integration

## 📝 Testing Checklist

- [ ] Form pendaftaran dengan NPSN auto-fill
- [ ] AI verification recommendation
- [ ] Upload berkas dengan validasi
- [ ] Verifikasi admin panel
- [ ] LCC scoring & timer
- [ ] Live score polling
- [ ] Card builder & PDF export

## 📄 License

Proprietary - KKG PAI Kota Bandung

## 👥 Credits

Developed for Pentas PAI Kota Bandung 2026
