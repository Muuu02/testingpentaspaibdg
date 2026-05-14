<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Model MasterKecamatan
 * 
 * Data master kecamatan se-Kota Bandung dengan kode 3 huruf
 */
class MasterKecamatan extends Model
{
    protected $table = 'master_kecamatan';

    protected $fillable = [
        'nama_kecamatan',
        'kode_3huruf',
    ];

    /**
     * Kode kecamatan untuk Cibiru
     */
    const CIBIRU = 'CBL';
    
    /**
     * Kode kecamatan untuk Baleendah
     */
    const BALEENDAH = 'BCP';

    /**
     * Get kode for nama kecamatan
     */
    public static function getKodeByNama(string $nama): ?string
    {
        return static::where('nama_kecamatan', $nama)->value('kode_3huruf');
    }

    /**
     * Get nama by kode
     */
    public static function getNamaByKode(string $kode): ?string
    {
        return static::where('kode_3huruf', $kode)->value('nama_kecamatan');
    }

    /**
     * Scope untuk filter by kode
     */
    public function scopeKode($query, string $kode)
    {
        return $query->where('kode_3huruf', $kode);
    }
}
