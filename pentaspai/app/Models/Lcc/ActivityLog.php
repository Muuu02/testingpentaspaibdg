<?php

namespace App\Models\Lcc;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model LCC ActivityLog
 * 
 * Log aktivitas scoring untuk audit trail
 */
class ActivityLog extends Model
{
    protected $table = 'activity_log';

    protected $fillable = [
        'session_id',
        'team_name',
        'category_name',
        'points',
        'action',
        'user_id',
        'details',
    ];

    protected $casts = [
        'points' => 'integer',
        'created_at' => 'datetime',
        'details' => 'array',
    ];

    /**
     * Relasi ke Session
     */
    public function session(): BelongsTo
    {
        return $this->belongsTo(Session::class, 'session_id');
    }

    /**
     * Scope untuk filter by session
     */
    public function scopeSession($query, int $sessionId)
    {
        return $query->where('session_id', $sessionId);
    }

    /**
     * Scope untuk filter by team
     */
    public function scopeTeam($query, string $teamName)
    {
        return $query->where('team_name', $teamName);
    }

    /**
     * Log score addition
     */
    public static function logScore(
        int $sessionId,
        string $teamName,
        string $categoryName,
        int $points,
        string $action = 'add',
        ?int $userId = null,
        array $details = []
    ): self {
        return static::create([
            'session_id' => $sessionId,
            'team_name' => $teamName,
            'category_name' => $categoryName,
            'points' => $points,
            'action' => $action,
            'user_id' => $userId,
            'details' => $details,
        ]);
    }

    /**
     * Get formatted action description
     */
    public function getActionDescriptionAttribute(): string
    {
        $actions = [
            'add' => 'Penambahan skor',
            'subtract' => 'Pengurangan skor',
            'correction' => 'Koreksi skor',
            'nullify' => 'Pembatalan skor',
        ];

        return $actions[$this->action] ?? $this->action;
    }
}
