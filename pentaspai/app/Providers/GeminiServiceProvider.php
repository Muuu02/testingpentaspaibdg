<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\AI\GeminiService;

class GeminiServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton('gemini', function ($app) {
            return new GeminiService();
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Publish config
        $this->publishes([
            __DIR__ . '/../../config/gemini.php' => config_path('gemini.php'),
        ], 'gemini-config');
    }
}
