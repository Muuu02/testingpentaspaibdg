<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Model MasterSekolah
 * 
 * Data master sekolah SD se-Kota Bandung
 */
class MasterSekolah extends Model
{
    protected $table = 'master_sekolah';
    protected $primaryKey = 'npsn';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'npsn',
        'nama_sekolah',
        'jenjang',
        'kecamatan',
        'alamat_lengkap',
        'status',
    ];

    /**
     * Relasi ke Pendaftaran
     */
    public function pendaftarans(): HasMany
    {
        return $this->hasMany(Pendaftaran::class, 'npsn', 'npsn');
    }

    /**
     * Scope untuk filter by kecamatan
     */
    public function scopeKecamatan($query, string $kecamatan)
    {
        return $query->where('kecamatan', $kecamatan);
    }

    /**
     * Scope untuk search nama sekolah
     */
    public function scopeSearch($query, string $keyword)
    {
        return $query->where(function ($q) use ($keyword) {
            $q->where('nama_sekolah', 'like', "%{$keyword}%")
              ->orWhere('npsn', 'like', "%{$keyword}%");
        });
    }

    /**
     * Get full address attribute
     */
    public function getAlamatLengkapAttribute($value): string
    {
        return $value ?? '';
    }
}
