<?php

namespace App\Models\Lcc;

use Illuminate\Database\Eloquent\Model;

/**
 * Model LCC SirenLog
 * 
 * Log trigger bel/siren untuk sesi lomba
 */
class SirenLog extends Model
{
    protected $table = 'siren_log';

    protected $fillable = [
        'session_id',
        'triggered_at',
        'duration',
        'triggered_by',
    ];

    protected $casts = [
        'triggered_at' => 'datetime',
        'duration' => 'integer',
    ];

    /**
     * Trigger types
     */
    const TYPE_START = 'start';
    const TYPE_WARNING = 'warning';
    const TYPE_END = 'end';
    const TYPE_CORRECTION = 'correction';

    /**
     * Scope untuk filter by session
     */
    public function scopeSession($query, int $sessionId)
    {
        return $query->where('session_id', $sessionId);
    }

    /**
     * Scope untuk today only
     */
    public function scopeToday($query)
    {
        return $query->whereDate('triggered_at', today());
    }

    /**
     * Log siren trigger
     */
    public static function logTrigger(
        int $sessionId,
        string $triggeredBy = 'system',
        int $duration = 3
    ): self {
        return static::create([
            'session_id' => $sessionId,
            'triggered_at' => now(),
            'duration' => $duration,
            'triggered_by' => $triggeredBy,
        ]);
    }

    /**
     * Get triggers count for session today
     */
    public static function getTodayCount(int $sessionId): int
    {
        return static::where('session_id', $sessionId)
            ->whereDate('triggered_at', today())
            ->count();
    }
}
