<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Model NomorUndian
 * 
 * Menyimpan nomor urut undian per kecamatan dan lomba
 */
class NomorUndian extends Model
{
    protected $table = 'nomor_undian';

    protected $fillable = [
        'kecamatan',
        'lccp',
        'ldc',
        'mtq',
        'mhq',
        'lki',
        'lpsb',
        'lsqr',
        'lpa',
        'published',
    ];

    protected $casts = [
        'published' => 'integer',
    ];

    /**
     * Kode lomba yang tersedia
     */
    const KODE_LOMBA = [
        'lccp' => 'Lomba Cerdas Cermat PAI Putra',
        'ldc' => 'Lomba Dai Cilik',
        'mtq' => 'Musabaqah Tilawatil Quran',
        'mhq' => 'Musabaqah Hifdzil Quran',
        'lki' => 'Lomba Kaligrafi Islam',
        'lpsb' => 'Lomba Pidato Bahasa Arab',
        'lsqr' => 'Lomba Syarhil Quran',
        'lpa' => 'Lomba Pidato Bahasa Inggris',
    ];

    /**
     * Get next nomor for lomba
     */
    public function getNextNomor(string $kodeLomba): int
    {
        $current = $this->$kodeLomba ?? 0;
        return $current + 1;
    }

    /**
     * Increment nomor untuk lomba tertentu
     */
    public function incrementNomor(string $kodeLomba): int
    {
        $this->increment($kodeLomba);
        return $this->$kodeLomba;
    }

    /**
     * Scope untuk filter by published status
     */
    public function scopePublished($query, bool $published = true)
    {
        return $query->where('published', $published ? 1 : 0);
    }

    /**
     * Get all lomba codes
     */
    public static function getLombaCodes(): array
    {
        return array_keys(self::KODE_LOMBA);
    }

    /**
     * Get lomba name by code
     */
    public static function getLombaName(string $code): string
    {
        return self::KODE_LOMBA[$code] ?? 'Unknown';
    }
}
