<?php

namespace App\Models\Lcc;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model LCC Score
 * 
 * Menyimpan skor per kategori untuk setiap tim dalam session
 */
class Score extends Model
{
    protected $table = 'scores';

    protected $fillable = [
        'session_id',
        'team_id',
        'kategori',
        'baris',
        'nilai',
        'keterangan',
    ];

    protected $casts = [
        'baris' => 'integer',
        'nilai' => 'integer',
    ];

    /**
     * Relasi ke Session
     */
    public function session(): BelongsTo
    {
        return $this->belongsTo(Session::class, 'session_id');
    }

    /**
     * Relasi ke Team
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    /**
     * Scope untuk filter by kategori
     */
    public function scopeKategori($query, int $kategori)
    {
        return $query->where('kategori', $kategori);
    }

    /**
     * Get category name
     */
    public function getKategoriNameAttribute(): string
    {
        $names = [
            1 => 'Lemparan',
            2 => 'Rebutan',
            3 => 'Game',
            4 => 'Menulis Ayat',
            5 => 'IT Numerasi',
        ];

        return $names[$this->kategori] ?? 'Unknown';
    }

    /**
     * Validate score value based on category
     */
    public static function validateScore(int $kategori, int $nilai): bool
    {
        $rules = [
            1 => [-50, 0, 100], // Lemparan: -50, 0, 100
            2 => [-100, 100],   // Rebutan: -100, 100
            3 => [0, 50, 100],  // Game: 0, 50, 100
            4 => [0, 50, 100],  // Menulis: 0-100
            5 => [0, 25, 50],   // IT Numerasi: 0-50
        ];

        return in_array($nilai, $rules[$kategori] ?? []);
    }

    /**
     * Get possible scores for category
     */
    public static function getPossibleScores(int $kategori): array
    {
        $rules = [
            1 => [-50, 0, 100],
            2 => [-100, 100],
            3 => [0, 50, 100],
            4 => range(0, 100, 10),
            5 => [0, 25, 50],
        ];

        return $rules[$kategori] ?? [];
    }
}
