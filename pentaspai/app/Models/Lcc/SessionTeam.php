<?php

namespace App\Models\Lcc;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model LCC SessionTeam
 * 
 * Pivot table untuk relasi many-to-many antara Session dan Team
 * dengan tracking qualification dan ranking
 */
class SessionTeam extends Model
{
    protected $table = 'session_teams';

    protected $fillable = [
        'session_id',
        'team_id',
        'is_qualified',
        'final_rank',
        'final_score',
    ];

    protected $casts = [
        'is_qualified' => 'boolean',
        'final_rank' => 'integer',
        'final_score' => 'integer',
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
     * Scope untuk qualified teams only
     */
    public function scopeQualified($query)
    {
        return $query->where('is_qualified', true);
    }

    /**
     * Qualify this team
     */
    public function qualify(): bool
    {
        $this->is_qualified = true;
        return $this->save();
    }

    /**
     * Disqualify this team
     */
    public function disqualify(): bool
    {
        $this->is_qualified = false;
        return $this->save();
    }

    /**
     * Update rank and score
     */
    public function updateRanking(int $rank, int $score): bool
    {
        $this->final_rank = $rank;
        $this->final_score = $score;
        return $this->save();
    }
}
