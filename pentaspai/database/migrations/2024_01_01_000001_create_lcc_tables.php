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
        // Tabel LCC Events
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('nama_event');
            $table->year('tahun');
            $table->enum('status', ['draft', 'active', 'completed', 'archived'])->default('draft');
            $table->string('created_by')->nullable();
            $table->timestamps();
            
            $table->index(['tahun', 'status']);
        });

        // Tabel LCC Sessions
        Schema::create('sessions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('event_id');
            $table->string('nama_sesi');
            $table->enum('babak', ['penyisihan', 'semifinal', 'final']);
            $table->enum('status', ['draft', 'active', 'paused', 'completed'])->default('draft');
            $table->integer('timer_duration')->default(0); // dalam detik
            $table->timestamp('timer_start_at')->nullable();
            $table->boolean('timer_running')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->unsignedBigInteger('winner_team_id')->nullable();
            $table->integer('qualified_count')->default(0);
            $table->timestamps();
            
            $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');
            $table->index(['event_id', 'status']);
        });

        // Tabel LCC Teams
        Schema::create('teams', function (Blueprint $table) {
            $table->id();
            $table->string('no_peserta', 50)->unique();
            $table->string('nama_sekolah');
            $table->string('kecamatan');
            $table->string('nama_tim')->nullable();
            $table->string('anggota_1')->nullable();
            $table->string('anggota_2')->nullable();
            $table->string('anggota_3')->nullable();
            $table->string('pendamping')->nullable();
            $table->enum('kategori', ['putra', 'putri'])->default('putra');
            $table->timestamps();
            
            $table->index(['kecamatan', 'kategori']);
        });

        // Tabel Session-Team Pivot
        Schema::create('session_teams', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('session_id');
            $table->unsignedBigInteger('team_id');
            $table->boolean('is_qualified')->default(false);
            $table->integer('final_rank')->nullable();
            $table->integer('final_score')->default(0);
            $table->timestamps();
            
            $table->foreign('session_id')->references('id')->on('sessions')->onDelete('cascade');
            $table->foreign('team_id')->references('id')->on('teams')->onDelete('cascade');
            $table->unique(['session_id', 'team_id']);
            $table->index(['session_id', 'is_qualified']);
        });

        // Tabel LCC Scores
        Schema::create('scores', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('session_id');
            $table->unsignedBigInteger('team_id');
            $table->tinyInteger('kategori'); // 1=Lemparan, 2=Rebutan, 3=Game, 4=Menulis, 5=IT Numerasi
            $table->integer('baris')->default(0);
            $table->integer('nilai')->default(0);
            $table->string('keterangan')->nullable();
            $table->timestamps();
            
            $table->foreign('session_id')->references('id')->on('sessions')->onDelete('cascade');
            $table->foreign('team_id')->references('id')->on('teams')->onDelete('cascade');
            $table->index(['session_id', 'team_id', 'kategori']);
        });

        // Tabel Activity Log
        Schema::create('activity_log', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('session_id');
            $table->string('team_name');
            $table->string('category_name');
            $table->integer('points');
            $table->string('action')->default('add');
            $table->string('user_id')->nullable();
            $table->json('details')->nullable();
            $table->timestamp('created_at')->useCurrent();
            
            $table->foreign('session_id')->references('id')->on('sessions')->onDelete('cascade');
            $table->index(['session_id', 'created_at']);
        });

        // Tabel Siren Log
        Schema::create('siren_log', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('session_id');
            $table->timestamp('triggered_at')->useCurrent();
            $table->integer('duration')->default(3); // detik
            $table->string('triggered_by')->default('system');
            
            $table->foreign('session_id')->references('id')->on('sessions')->onDelete('cascade');
            $table->index(['session_id', 'triggered_at']);
        });

        // Tabel Timer Status (untuk sync realtime)
        Schema::create('timer_status', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('session_id')->unique();
            $table->integer('duration')->default(0);
            $table->timestamp('start_at')->nullable();
            $table->enum('status', ['stopped', 'running', 'paused', 'expired'])->default('stopped');
            $table->timestamps();
            
            $table->foreign('session_id')->references('id')->on('sessions')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('timer_status');
        Schema::dropIfExists('siren_log');
        Schema::dropIfExists('activity_log');
        Schema::dropIfExists('scores');
        Schema::dropIfExists('session_teams');
        Schema::dropIfExists('teams');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('events');
    }
};
