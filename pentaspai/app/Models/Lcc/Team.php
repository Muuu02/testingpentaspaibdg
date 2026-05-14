<?php

namespace App\Models\Lcc;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Model LCC Team
 * 
 * Menyimpan data tim/regu peserta LCC
 */
class Team extends Model
{
    protected $table = 'teams';

    protected $fillable = [
        'no_peserta',
        'nama_sekolah',
        'kecamatan',
        'nama_tim',
        'anggota_1',
        'anggota_2',
        'anggota_3',
        'pendamping',
        'kategori', // putra/putri
    ];

    /**
     * Relasi ke Session Teams
     */
    public function sessionTeams(): HasMany
    {
        return $this->hasMany(SessionTeam::class, 'team_id');
    }

    /**
     * Relasi ke Scores
     */
    public function scores(): HasMany
    {
        return $this->hasMany(Score::class, 'team_id');
    }

    /**
     * Get total score across all sessions
     */
    public function getTotalScoreAttribute(): int
    {
        return $this->scores()->sum('nilai');
    }

    /**
     * Scope untuk filter by kecamatan
     */
    public function scopeKecamatan($query, string $kecamatan)
    {
        return $query->where('kecamatan', $kecamatan);
    }

    /**
     * Scope untuk search nama sekolah/tim
     */
    public function scopeSearch($query, string $keyword)
    {
        return $query->where(function ($q) use ($keyword) {
            $q->where('nama_sekolah', 'like', "%{$keyword}%")
              ->orWhere('nama_tim', 'like', "%{$keyword}%")
              ->orWhere('no_peserta', 'like', "%{$keyword}%");
        });
    }

    /**
     * Format team name for display
     */
    public function getDisplayNameAttribute(): string
    {
        return $this->nama_tim ?? $this->nama_sekolah ?? "Tim {$this->no_peserta}";
    }
}
