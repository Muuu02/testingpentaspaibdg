<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Gemini AI Configuration
    |--------------------------------------------------------------------------
    */

    'api_key' => env('GEMINI_API_KEY'),
    
    'model' => env('GEMINI_MODEL', 'gemini-pro'),
    
    'base_url' => 'https://generativelanguage.googleapis.com/v1beta',

    /*
    |--------------------------------------------------------------------------
    | Feature Flags for AI Integration
    |--------------------------------------------------------------------------
    */
    
    'features' => [
        // Verifikasi otomatis data peserta berdasarkan dokumen upload
        'participant_verification' => env('GEMINI_ENABLE_VERIFICATION', true),
        
        // Analisis dan scoring rekomendasi untuk lomba esai/tertulis
        'essay_scoring' => env('GEMINI_ENABLE_ESSAY_SCORING', false),
        
        // Generate feedback otomatis untuk peserta
        'feedback_generation' => env('GEMINI_ENABLE_FEEDBACK', false),
        
        // Klasifikasi dan validasi berkas upload
        'document_classification' => env('GEMINI_ENABLE_DOCUMENT_CLASSIFICATION', true),
        
        // Deteksi anomaly pada skor (kecurangan)
        'score_anomaly_detection' => env('GEMINI_ENABLE_ANOMALY_DETECTION', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting
    |--------------------------------------------------------------------------
    */
    
    'requests_per_minute' => env('GEMINI_RATE_LIMIT', 60),
    
    'timeout_seconds' => env('GEMINI_TIMEOUT', 30),

];
