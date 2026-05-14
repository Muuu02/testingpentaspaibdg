<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * Model Pendaftaran
 * 
 * Menyimpan data pendaftaran lomba
 */
class Pendaftaran extends Model
{
    protected $table = 'pendaftaran';
    protected $primaryKey = 'id_pendaftaran';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_pendaftaran',
        'timestamp',
        'kode_lomba',
        'npsn',
        'nama_sekolah',
        'kecamatan',
        'kecamatan_code',
        'alamat_lengkap',
        'nama_pendamping',
        'no_hp_pendamping',
        'status_verifikasi',
        'catatan_verifikasi',
        'ai_verification_result',
        'ai_confidence_score',
        'verified_by',
        'verified_at',
        'edition_id',
    ];

    protected $casts = [
        'timestamp' => 'datetime',
        'verified_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Boot method untuk auto-generate ID
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id_pendaftaran)) {
                $model->id_pendaftaran = self::generateId();
            }
            if (empty($model->timestamp)) {
                $model->timestamp = now();
            }
        });
    }

    /**
     * Generate ID pendaftaran format: PPAI-{random8}-{random4}
     */
    public static function generateId(): string
    {
        return sprintf(
            'PPAI-%s-%s',
            strtoupper(Str::random(8)),
            strtoupper(Str::random(4))
        );
    }

    /**
     * Relasi ke PesertaDetail
     */
    public function pesertaDetails(): HasMany
    {
        return $this->hasMany(PesertaDetail::class, 'id_pendaftaran', 'id_pendaftaran');
    }

    /**
     * Relasi ke Master Sekolah
     */
    public function sekolah()
    {
        return $this->belongsTo(MasterSekolah::class, 'npsn', 'npsn');
    }

    /**
     * Scope untuk filter by status verifikasi
     */
    public function scopeStatus($query, string $status)
    {
        return $query->where('status_verifikasi', $status);
    }

    /**
     * Scope untuk filter by kecamatan
     */
    public function scopeKecamatan($query, string $kecamatan)
    {
        return $query->where('kecamatan', $kecamatan);
    }

    /**
     * Scope untuk filter by tahun (edition)
     */
    public function scopeTahun($query, int $tahun)
    {
        return $query->whereHas('edition', function ($q) use ($tahun) {
            $q->where('tahun', $tahun);
        });
    }

    /**
     * Generate nomor undian untuk peserta
     */
    public function generateNomorUndian(): array
    {
        $nomor = [];
        $kecamatan = $this->kecamatan;
        $kodeLomba = $this->kode_lomba;

        // Increment counter di tabel nomor_undian
        $nomorUndian = \App\Models\NomorUndian::firstOrCreate(
            ['kecamatan' => $kecamatan],
            [
                'lccp' => 0,
                'ldc' => 0,
                'mtq' => 0,
                'mhq' => 0,
                'lki' => 0,
                'lpsb' => 0,
                'lsqr' => 0,
                'lpa' => 0,
            ]
        );

        $nomorUndian->increment($kodeLomba);
        
        $kodeKec = \App\Models\MasterKecamatan::where('nama_kecamatan', $kecamatan)
            ->value('kode_3huruf') ?? 'XXX';

        $nomor[$kodeLomba] = sprintf(
            'PAI%d-%s-%s-%03d',
            date('Y'),
            strtoupper($kodeKec),
            strtoupper($kodeLomba),
            $nomorUndian->$kodeLomba
        );

        return $nomor;
    }

    /**
     * Update status verifikasi dengan AI recommendation
     */
    public function updateVerification(string $status, ?string $catatan = null, ?array $aiResult = null): bool
    {
        $this->status_verifikasi = $status;
        $this->catatan_verifikasi = $catatan;
        
        if ($aiResult) {
            $this->ai_verification_result = json_encode($aiResult);
            $this->ai_confidence_score = $aiResult['confidence'] ?? 0;
        }
        
        $this->verified_at = now();
        
        return $this->save();
    }

    /**
     * Get AI verification result as array
     */
    public function getAiVerificationResultAttribute($value): ?array
    {
        if (!empty($value)) {
            return json_decode($value, true);
        }
        return null;
    }

    /**
     * Check if AI recommended verification
     */
    public function isAiVerified(): bool
    {
        $result = $this->ai_verification_result;
        return $result && ($result['verified'] ?? false) && ($result['confidence'] ?? 0) >= 0.7;
    }
}
