<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

/**
 * Model PesertaDetail
 * 
 * Menyimpan data detail peserta lomba dengan enkripsi NISN
 */
class PesertaDetail extends Model
{
    protected $table = 'peserta_detail';

    protected $fillable = [
        'id_pendaftaran',
        'no_urut_peserta',
        'nama',
        'nisn',
        'nisn_hash',
        'jenis_kelamin',
        'kelas',
        'ttl',
        'peran',
        'maqro',
        'status_wajib',
    ];

    protected $casts = [
        'ttl' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Mutator untuk enkripsi NISN (AES-256-CBC)
     */
    public function setNisnAttribute($value): void
    {
        if (!empty($value)) {
            $this->attributes['nisn'] = Crypt::encryptString($value);
            $this->attributes['nisn_hash'] = hash('sha256', $value);
        }
    }

    /**
     * Accessor untuk dekripsi NISN
     */
    public function getNisnAttribute($value): ?string
    {
        if (!empty($value)) {
            try {
                return Crypt::decryptString($value);
            } catch (\Exception $e) {
                return null;
            }
        }
        return null;
    }

    /**
     * Relasi ke Pendaftaran
     */
    public function pendaftaran(): BelongsTo
    {
        return $this->belongsTo(Pendaftaran::class, 'id_pendaftaran', 'id_pendaftaran');
    }

    /**
     * Scope untuk mencari berdasarkan NISN hash (tanpa dekripsi)
     */
    public function scopeByNisn($query, string $nisn)
    {
        $hash = hash('sha256', $nisn);
        return $query->where('nisn_hash', $hash);
    }

    /**
     * Cek apakah NISN valid (10 digit angka)
     */
    public static function validateNisn(string $nisn): bool
    {
        return preg_match('/^\d{10}$/', $nisn) === 1;
    }

    /**
     * Generate nomor peserta lengkap
     */
    public function getNomorPesertaLengkapAttribute(): string
    {
        if ($this->pendaftaran) {
            return sprintf(
                'PAI%d-%s-%s-%03d',
                date('Y'),
                strtoupper($this->pendaftaran->kecamatan_code ?? 'XXX'),
                strtoupper($this->pendaftaran->kode_lomba ?? 'XXX'),
                $this->no_urut_peserta
            );
        }
        return 'N/A';
    }
}
