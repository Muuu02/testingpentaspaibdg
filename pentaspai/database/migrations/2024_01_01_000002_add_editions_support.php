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
        // Tabel Card Templates (untuk GrapesJS builder)
        Schema::create('card_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['kartu_peserta', 'nametag', 'format_penilaian', 'sertifikat']);
            $table->enum('paper_size', ['A6', 'F4', 'A4', 'A2'])->default('A6');
            $table->json('content'); // GrapesJS JSON content
            $table->json('settings')->nullable(); // Custom settings (font, colors, etc)
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('edition_id')->nullable();
            $table->timestamps();
            
            $table->foreign('edition_id')->references('id')->on('editions');
        });

        // Tabel Participant Files (berkas upload)
        Schema::create('participant_files', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('peserta_detail_id');
            $table->enum('jenis_berkas', ['rapor', 'sk_juara', 'akta_kelahiran', 'foto', 'lainnya']);
            $table->string('file_path'); // Path ke storage/private/
            $table->string('file_name_original');
            $table->string('file_name_hash'); // Hash rename
            $table->string('mime_type');
            $table->integer('file_size'); // bytes
            $table->string('checksum')->nullable(); // SHA-256 untuk validasi
            $table->timestamp('scanned_at')->nullable(); // ClamAV scan timestamp
            $table->boolean('is_clean')->default(true);
            $table->timestamps();
            
            $table->foreign('peserta_detail_id')->references('id')->on('peserta_detail')->onDelete('cascade');
            $table->index(['peserta_detail_id', 'jenis_berkas']);
        });

        // Tabel Scoring Criteria (configurable per lomba)
        Schema::create('scoring_criteria', function (Blueprint $table) {
            $table->id();
            $table->string('kode_lomba');
            $table->string('kategori');
            $table->integer('max_score');
            $table->integer('weight')->default(100); // Bobot dalam persen
            $table->text('deskripsi')->nullable();
            $table->json('rubrik')->nullable(); // Detailed rubric
            $table->unsignedBigInteger('edition_id')->nullable();
            $table->timestamps();
            
            $table->foreign('edition_id')->references('id')->on('editions');
            $table->unique(['kode_lomba', 'kategori', 'edition_id']);
        });

        // Tabel WhatsApp Logs
        Schema::create('whatsapp_logs', function (Blueprint $table) {
            $table->id();
            $table->string('recipient'); // Nomor HP
            $table->string('message_type')->default('text');
            $table->text('message');
            $table->string('status')->default('pending'); // pending, sent, delivered, failed
            $table->string('provider_response')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
            
            $table->index(['status', 'created_at']);
        });

        // Tabel Technical Meeting
        Schema::create('technical_meetings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('edition_id');
            $table->string('judul');
            $table->text('deskripsi')->nullable();
            $table->datetime('tanggal_waktu');
            $table->string('link_zoom')->nullable();
            $table->string('pdf_juknis_path')->nullable();
            $table->boolean('is_published')->default(false);
            $table->timestamps();
            
            $table->foreign('edition_id')->references('id')->on('editions');
        });

        // Tabel TM Attendance
        Schema::create('tm_attendances', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('technical_meeting_id');
            $table->string('npsn');
            $table->string('nama_sekolah');
            $table->string('nama_perwakilan');
            $table->string('jabatan')->nullable();
            $table->string('no_hp');
            $table->boolean('confirmed')->default(false);
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamps();
            
            $table->foreign('technical_meeting_id')->references('id')->on('technical_meetings')->onDelete('cascade');
            $table->unique(['technical_meeting_id', 'npsn']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tm_attendances');
        Schema::dropIfExists('technical_meetings');
        Schema::dropIfExists('whatsapp_logs');
        Schema::dropIfExists('scoring_criteria');
        Schema::dropIfExists('participant_files');
        Schema::dropIfExists('card_templates');
    }
};
