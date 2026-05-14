<?php

namespace App\Facades;

use Illuminate\Support\Facades\Facade;

/**
 * @see \App\Services\AI\GeminiService
 */
class Gemini extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'gemini';
    }
}
