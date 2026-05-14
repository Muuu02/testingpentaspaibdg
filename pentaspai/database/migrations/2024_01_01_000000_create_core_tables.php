<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Tabel Master Kecamatan
        Schema::create('master_kecamatan', function (Blueprint $table) {
            $table->id();
            $table->string('nama_kecamatan')->unique();
            $table->string('kode_3huruf', 3)->unique();
            $table->timestamps();
        });

        // Tabel Master Sekolah
        Schema::create('master_sekolah', function (Blueprint $table) {
            $table->string('npsn', 20)->primary();
            $table->string('nama_sekolah');
            $table->enum('jenjang', ['SD', 'SMP', 'SMA'])->default('SD');
            $table->string('kecamatan');
            $table->text('alamat_lengkap')->nullable();
            $table->enum('status', ['Negeri', 'Swasta'])->default('Negeri');
            $table->timestamps();
            
            $table->foreign('kecamatan')->references('nama_kecamatan')->on('master_kecamatan');
        });

        // Tabel Editions (Multi-year support)
        Schema::create('editions', function (Blueprint $table) {
            $table->id();
            $table->year('tahun')->unique();
            $table->enum('status', ['draft', 'active', 'completed', 'archived'])->default('draft');
            $table->timestamps();
        });

        // Tabel Pendaftaran
        Schema::create('pendaftaran', function (Blueprint $table) {
            $table->string('id_pendaftaran', 20)->primary();
            $table->timestamp('timestamp')->useCurrent();
            $table->string('kode_lomba', 10);
            $table->string('npsn', 20);
            $table->string('nama_sekolah');
            $table->string('kecamatan');
            $table->string('kecamatan_code', 3)->nullable();
            $table->text('alamat_lengkap')->nullable();
            $table->string('nama_pendamping');
            $table->string('no_hp_pendamping', 20);
            $table->enum('status_verifikasi', ['pending', 'verified', 'rejected', 'needs_review'])->default('pending');
            $table->text('catatan_verifikasi')->nullable();
            $table->json('ai_verification_result')->nullable();
            $table->decimal('ai_confidence_score', 5, 4)->nullable();
            $table->string('verified_by')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->unsignedBigInteger('edition_id')->nullable();
            $table->timestamps();
            
            $table->foreign('npsn')->references('npsn')->on('master_sekolah');
            $table->foreign('edition_id')->references('id')->on('editions');
            $table->index(['status_verifikasi', 'kecamatan']);
        });

        // Tabel Peserta Detail
        Schema::create('peserta_detail', function (Blueprint $table) {
            $table->id();
            $table->string('id_pendaftaran', 20);
            $table->integer('no_urut_peserta');
            $table->string('nama');
            $table->text('nisn')->nullable(); // Encrypted
            $table->string('nisn_hash', 64)->nullable(); // SHA-256 hash for lookup
            $table->enum('jenis_kelamin', ['L', 'P']);
            $table->string('kelas');
            $table->date('ttl')->nullable(); // Tempat Tanggal Lahir
            $table->string('peran')->nullable(); // Untuk LSQR: imam, muadzin, etc
            $table->string('maqro')->nullable(); // Untuk MTQ/MHQ
            $table->boolean('status_wajib')->default(true);
            $table->timestamps();
            
            $table->foreign('id_pendaftaran')->references('id_pendaftaran')->on('pendaftaran')->onDelete('cascade');
            $table->index(['id_pendaftaran', 'nisn_hash']);
        });

        // Tabel Nomor Undian
        Schema::create('nomor_undian', function (Blueprint $table) {
            $table->id();
            $table->string('kecamatan')->unique();
            $table->integer('lccp')->default(0);
            $table->integer('ldc')->default(0);
            $table->integer('mtq')->default(0);
            $table->integer('mhq')->default(0);
            $table->integer('lki')->default(0);
            $table->integer('lpsb')->default(0);
            $table->integer('lsqr')->default(0);
            $table->integer('lpa')->default(0);
            $table->tinyInteger('published')->default(0);
            $table->timestamps();
            
            $table->foreign('kecamatan')->references('nama_kecamatan')->on('master_kecamatan');
        });

        // Tabel Admin Accounts
        Schema::create('admin_accounts', function (Blueprint $table) {
            $table->string('username', 50)->primary();
            $table->string('password_hash', 64); // SHA-256
            $table->string('nama_lengkap');
            $table->enum('role', ['super_admin', 'verifikator', 'viewer', 'juri', 'operator'])->default('viewer');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamp('last_login_at')->nullable();
            $table->timestamps();
        });

        // Tabel Config Sistem
        Schema::create('config_sistem', function (Blueprint $table) {
            $table->string('setting', 100)->primary();
            $table->text('value')->nullable();
            $table->string('keterangan')->nullable();
            $table->timestamps();
        });

        // Tabel Audit Trail
        Schema::create('audit_trail', function (Blueprint $table) {
            $table->id();
            $table->timestamp('timestamp')->useCurrent();
            $table->string('admin', 50);
            $table->string('aksi', 100);
            $table->string('id_terkait', 50)->nullable();
            $table->text('detail')->nullable();
            $table->ipAddress('ip_address')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_trail');
        Schema::dropIfExists('config_sistem');
        Schema::dropIfExists('admin_accounts');
        Schema::dropIfExists('nomor_undian');
        Schema::dropIfExists('peserta_detail');
        Schema::dropIfExists('pendaftaran');
        Schema::dropIfExists('editions');
        Schema::dropIfExists('master_sekolah');
        Schema::dropIfExists('master_kecamatan');
    }
};
