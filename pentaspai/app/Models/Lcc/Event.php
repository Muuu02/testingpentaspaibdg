<?php

namespace App\Models\Lcc;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model LCC Event
 * 
 * Menyimpan data event LCC-PAI (Lomba Cerdas Cermat)
 */
class Event extends Model
{
    protected $table = 'events';

    protected $fillable = [
        'nama_event',
        'tahun',
        'status',
        'created_by',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Status constants
     */
    const STATUS_DRAFT = 'draft';
    const STATUS_ACTIVE = 'active';
    const STATUS_COMPLETED = 'completed';
    const STATUS_ARCHIVED = 'archived';

    /**
     * Relasi ke Sessions
     */
    public function sessions(): HasMany
    {
        return $this->hasMany(Session::class, 'event_id');
    }

    /**
     * Scope untuk filter by status
     */
    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope untuk active events only
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Check if event is active
     */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /**
     * Get all teams in this event
     */
    public function teams()
    {
        return Team::whereHas('sessions', function ($q) {
            $q->where('event_id', $this->id);
        });
    }

    /**
     * Start event
     */
    public function start(): bool
    {
        $this->status = self::STATUS_ACTIVE;
        return $this->save();
    }

    /**
     * Complete event
     */
    public function complete(): bool
    {
        $this->status = self::STATUS_COMPLETED;
        return $this->save();
    }

    /**
     * Archive event
     */
    public function archive(): bool
    {
        $this->status = self::STATUS_ARCHIVED;
        return $this->save();
    }
}
