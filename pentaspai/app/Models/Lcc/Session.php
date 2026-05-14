<?php

namespace App\Models\Lcc;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

/**
 * Model LCC Session
 * 
 * Menyimpan data sesi/babak lomba LCC dengan timer dan scoring
 */
class Session extends Model
{
    protected $table = 'sessions';

    protected $fillable = [
        'event_id',
        'nama_sesi',
        'babak',
        'status',
        'timer_duration',
        'timer_start_at',
        'timer_running',
        'completed_at',
        'winner_team_id',
        'qualified_count',
    ];

    protected $casts = [
        'timer_duration' => 'integer',
        'timer_start_at' => 'datetime',
        'completed_at' => 'datetime',
        'timer_running' => 'boolean',
        'qualified_count' => 'integer',
    ];

    /**
     * Babak constants
     */
    const BABAK_PENYISIHAN = 'penyisihan';
    const BABAK_SEMIFINAL = 'semifinal';
    const BABAK_FINAL = 'final';

    /**
     * Status constants
     */
    const STATUS_DRAFT = 'draft';
    const STATUS_ACTIVE = 'active';
    const STATUS_COMPLETED = 'completed';
    const STATUS_PAUSED = 'paused';

    /**
     * Kategori skor
     */
    const KATEGORI_LEMPARAN = 1;
    const KATEGORI_REBUTAN = 2;
    const KATEGORI_GAME = 3;
    const KATEGORI_MENULIS = 4;
    const KATEGORI_IT_NUMERASI = 5;

    /**
     * Relasi ke Event
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class, 'event_id');
    }

    /**
     * Relasi ke Teams dalam session ini
     */
    public function sessionTeams(): HasMany
    {
        return $this->hasMany(SessionTeam::class, 'session_id');
    }

    /**
     * Relasi ke Scores
     */
    public function scores(): HasMany
    {
        return $this->hasMany(Score::class, 'session_id');
    }

    /**
     * Relasi ke Activity Log
     */
    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class, 'session_id');
    }

    /**
     * Scope untuk filter by status
     */
    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope untuk active sessions only
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Start timer
     */
    public function startTimer(?int $duration = null): bool
    {
        $this->timer_running = true;
        $this->timer_start_at = now();
        
        if ($duration) {
            $this->timer_duration = $duration;
        }
        
        return $this->save();
    }

    /**
     * Pause timer
     */
    public function pauseTimer(): bool
    {
        $this->timer_running = false;
        return $this->save();
    }

    /**
     * Stop timer dan complete session
     */
    public function stopTimer(): bool
    {
        $this->timer_running = false;
        $this->completed_at = now();
        $this->status = self::STATUS_COMPLETED;
        return $this->save();
    }

    /**
     * Get remaining time in seconds
     */
    public function getRemainingTimeAttribute(): int
    {
        if (!$this->timer_running || !$this->timer_start_at) {
            return $this->timer_duration ?? 0;
        }

        $elapsed = Carbon::now()->diffInSeconds($this->timer_start_at, false);
        $remaining = ($this->timer_duration ?? 0) - $elapsed;

        return max(0, $remaining);
    }

    /**
     * Check if timer is expired
     */
    public function isTimerExpired(): bool
    {
        return $this->remaining_time <= 0;
    }

    /**
     * Get formatted remaining time (MM:SS)
     */
    public function getFormattedTimeAttribute(): string
    {
        $minutes = floor($this->remaining_time / 60);
        $seconds = $this->remaining_time % 60;
        return sprintf('%02d:%02d', $minutes, $seconds);
    }

    /**
     * Calculate total scores for all teams
     */
    public function calculateScores(): void
    {
        foreach ($this->sessionTeams as $sessionTeam) {
            $totalScore = $this->scores()
                ->where('team_id', $sessionTeam->team_id)
                ->sum('nilai');
            
            $sessionTeam->final_score = $totalScore;
            $sessionTeam->save();
        }
    }

    /**
     * Trigger siren/bel
     */
    public function triggerSiren(string $triggeredBy = 'system'): void
    {
        SirenLog::create([
            'session_id' => $this->id,
            'triggered_at' => now(),
            'duration' => 3, // default 3 seconds
            'triggered_by' => $triggeredBy,
        ]);
    }
}
