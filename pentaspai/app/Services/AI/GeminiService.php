<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

/**
 * Gemini AI Service
 * 
 * Integrasi dengan Google Gemini API untuk berbagai fitur:
 * - Verifikasi data peserta otomatis
 * - Analisis dokumen upload
 * - Scoring rekomendasi untuk esai
 * - Deteksi anomaly pada skor
 */
class GeminiService
{
    protected string $apiKey;
    protected string $model;
    protected string $baseUrl;
    protected int $timeout;

    public function __construct()
    {
        $this->apiKey = config('gemini.api_key');
        $this->model = config('gemini.model', 'gemini-pro');
        $this->baseUrl = config('gemini.base_url');
        $this->timeout = config('gemini.timeout_seconds', 30);
    }

    /**
     * Verifikasi data peserta berdasarkan informasi yang diberikan
     * 
     * @param array $participantData Data peserta (nama, nisn, sekolah, dll)
     * @param array $documentsInfo Informasi dokumen yang diupload
     * @return array ['verified' => bool, 'confidence' => float, 'reasons' => array]
     */
    public function verifyParticipant(array $participantData, array $documentsInfo = []): array
    {
        if (!$this->apiKey) {
            return [
                'verified' => false,
                'confidence' => 0,
                'reasons' => ['Gemini API key tidak dikonfigurasi'],
                'fallback' => true,
            ];
        }

        try {
            $prompt = $this->buildVerificationPrompt($participantData, $documentsInfo);
            
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post("{$this->baseUrl}/models/{$this->model}:generateContent?key={$this->apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'temperature' => 0.3,
                    'topK' => 40,
                    'topP' => 0.95,
                    'maxOutputTokens' => 1024,
                ],
            ]);

            if ($response->successful()) {
                $result = $response->json();
                return $this->parseVerificationResponse($result);
            }

            Log::error('Gemini API Error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [
                'verified' => false,
                'confidence' => 0,
                'reasons' => ['Gagal menghubungi AI service'],
                'error' => true,
            ];

        } catch (Exception $e) {
            Log::error('Gemini Service Exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'verified' => false,
                'confidence' => 0,
                'reasons' => ['Terjadi kesalahan pada AI service'],
                'exception' => true,
            ];
        }
    }

    /**
     * Analisis dan klasifikasi dokumen upload
     * 
     * @param string $documentText Teks hasil OCR dari dokumen
     * @param string $documentType Tipe dokumen yang diharapkan
     * @return array ['type' => string, 'valid' => bool, 'extracted_data' => array]
     */
    public function analyzeDocument(string $documentText, string $documentType): array
    {
        if (!$this->apiKey) {
            return [
                'type' => 'unknown',
                'valid' => false,
                'extracted_data' => [],
                'fallback' => true,
            ];
        }

        try {
            $prompt = "Analisis dokumen berikut yang seharusnya berupa {$documentType}. 
            Identifikasi apakah dokumen ini valid dan ekstrak informasi penting.
            
            Konten dokumen:
            {$documentText}
            
            Berikan respons dalam format JSON:
            {
                \"document_type\": \"tipe dokumen teridentifikasi\",
                \"is_valid\": true/false,
                \"confidence\": 0.0-1.0,
                \"extracted_data\": {
                    \"nama\": \"...\",
                    \"nisn\": \"...\",
                    \"tanggal\": \"...\",
                    \"instansi\": \"...\"
                },
                \"issues\": [\"daftar masalah jika ada\"]
            }";

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post("{$this->baseUrl}/models/{$this->model}:generateContent?key={$this->apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'temperature' => 0.2,
                    'response_format' => ['type' => 'JSON'],
                ],
            ]);

            if ($response->successful()) {
                $result = $response->json();
                $content = $result['candidates'][0]['content']['parts'][0]['text'] ?? '';
                
                // Extract JSON from response
                preg_match('/\{.*\}/s', $content, $matches);
                if (isset($matches[0])) {
                    return json_decode($matches[0], true) ?? [
                        'type' => 'unknown',
                        'valid' => false,
                        'extracted_data' => [],
                    ];
                }
            }

            return [
                'type' => 'unknown',
                'valid' => false,
                'extracted_data' => [],
                'error' => true,
            ];

        } catch (Exception $e) {
            Log::error('Gemini Document Analysis Exception', [
                'message' => $e->getMessage(),
            ]);

            return [
                'type' => 'unknown',
                'valid' => false,
                'extracted_data' => [],
                'exception' => true,
            ];
        }
    }

    /**
     * Scoring rekomendasi untuk jawaban esai/tertulis
     * 
     * @param string $question Pertanyaan soal
     * @param string $answer Jawaban peserta
     * @param array $rubric Kriteria penilaian
     * @return array ['score' => int, 'max_score' => int, 'feedback' => string, 'breakdown' => array]
     */
    public function scoreEssay(string $question, string $answer, array $rubric = []): array
    {
        if (!$this->apiKey) {
            return [
                'score' => 0,
                'max_score' => 100,
                'feedback' => 'AI scoring tidak tersedia',
                'fallback' => true,
            ];
        }

        try {
            $rubricText = !empty($rubric) 
                ? "Rubrik penilaian:\n" . json_encode($rubric, JSON_PRETTY_PRINT)
                : "Gunakan kriteria: kebenaran isi (40%), kelengkapan (30%), kejelasan (20%), tata bahasa (10%)";

            $prompt = "Sebagai juri lomba Pendidikan Agama Islam, nilai jawaban berikut:
            
            Soal: {$question}
            
            Jawaban Peserta:
            {$answer}
            
            {$rubricText}
            
            Berikan respons dalam format JSON:
            {
                \"score\": 0-100,
                \"max_score\": 100,
                \"feedback\": \"Feedback konstruktif untuk peserta\",
                \"breakdown\": {
                    \"kebenaran_isi\": 0-40,
                    \"kelengkapan\": 0-30,
                    \"kejelasan\": 0-20,
                    \"tata_bahasa\": 0-10
                },
                \"strengths\": [\"poin kuat jawaban\"],
                \"weaknesses\": [\"poin yang perlu diperbaiki\"]
            }";

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post("{$this->baseUrl}/models/{$this->model}:generateContent?key={$this->apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'temperature' => 0.3,
                    'response_format' => ['type' => 'JSON'],
                ],
            ]);

            if ($response->successful()) {
                $result = $response->json();
                $content = $result['candidates'][0]['content']['parts'][0]['text'] ?? '';
                
                preg_match('/\{.*\}/s', $content, $matches);
                if (isset($matches[0])) {
                    return json_decode($matches[0], true) ?? [
                        'score' => 0,
                        'max_score' => 100,
                        'feedback' => 'Gagal memproses scoring',
                        'breakdown' => [],
                    ];
                }
            }

            return [
                'score' => 0,
                'max_score' => 100,
                'feedback' => 'Gagal melakukan scoring',
                'error' => true,
            ];

        } catch (Exception $e) {
            Log::error('Gemini Essay Scoring Exception', [
                'message' => $e->getMessage(),
            ]);

            return [
                'score' => 0,
                'max_score' => 100,
                'feedback' => 'Terjadi kesalahan pada AI service',
                'exception' => true,
            ];
        }
    }

    /**
     * Deteksi anomaly pada pola skor (potensi kecurangan)
     * 
     * @param array $scores Array skor tim/peserta
     * @param string $category Kategori lomba
     * @return array ['has_anomaly' => bool, 'confidence' => float, 'details' => array]
     */
    public function detectScoreAnomaly(array $scores, string $category): array
    {
        if (!$this->apiKey) {
            return [
                'has_anomaly' => false,
                'confidence' => 0,
                'details' => [],
                'fallback' => true,
            ];
        }

        try {
            $prompt = "Analisis pola skor berikut untuk lomba {$category} dan deteksi kemungkinan anomaly atau kecurangan:
            
            Data Skor:
            " . json_encode($scores, JSON_PRETTY_PRINT) . "
            
            Pertimbangkan:
            - Perbedaan skor yang tidak wajar antar peserta
            - Pola jawaban yang mencurigakan
            - Lonjakan skor yang tidak konsisten
            
            Berikan respons dalam format JSON:
            {
                \"has_anomaly\": true/false,
                \"confidence\": 0.0-1.0,
                \"suspicious_entries\": [\"id atau nama yang mencurigakan\"],
                \"anomaly_types\": [\"jenis anomaly terdeteksi\"],
                \"recommendations\": [\"tindakan yang disarankan\"],
                \"statistical_notes\": \"catatan statistik\"
            }";

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post("{$this->baseUrl}/models/{$this->model}:generateContent?key={$this->apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'temperature' => 0.2,
                    'response_format' => ['type' => 'JSON'],
                ],
            ]);

            if ($response->successful()) {
                $result = $response->json();
                $content = $result['candidates'][0]['content']['parts'][0]['text'] ?? '';
                
                preg_match('/\{.*\}/s', $content, $matches);
                if (isset($matches[0])) {
                    return json_decode($matches[0], true) ?? [
                        'has_anomaly' => false,
                        'confidence' => 0,
                        'details' => [],
                    ];
                }
            }

            return [
                'has_anomaly' => false,
                'confidence' => 0,
                'details' => [],
                'error' => true,
            ];

        } catch (Exception $e) {
            Log::error('Gemini Anomaly Detection Exception', [
                'message' => $e->getMessage(),
            ]);

            return [
                'has_anomaly' => false,
                'confidence' => 0,
                'details' => [],
                'exception' => true,
            ];
        }
    }

    /**
     * Generate feedback otomatis untuk peserta
     * 
     * @param string $category Kategori lomba
     * @param array $performanceData Data performa peserta
     * @return string Feedback dalam bahasa Indonesia
     */
    public function generateFeedback(string $category, array $performanceData): string
    {
        if (!$this->apiKey) {
            return 'Terima kasih atas partisipasi Anda dalam lomba ini.';
        }

        try {
            $prompt = "Buat feedback konstruktif dan memotivasi untuk peserta lomba {$category} dengan data performa:
            
            " . json_encode($performanceData, JSON_PRETTY_PRINT) . "
            
            Gunakan bahasa Indonesia yang baik, santai namun profesional. Sertakan:
            1. Apresiasi atas usaha peserta
            2. Poin kuat yang ditunjukkan
            3. Saran pengembangan untuk masa depan
            4. Kalimat motivasi
            
            Maksimal 150 kata.";

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post("{$this->baseUrl}/models/{$this->model}:generateContent?key={$this->apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'temperature' => 0.7,
                    'maxOutputTokens' => 256,
                ],
            ]);

            if ($response->successful()) {
                $result = $response->json();
                return $result['candidates'][0]['content']['parts'][0]['text'] ?? 'Terima kasih atas partisipasi Anda.';
            }

            return 'Terima kasih atas partisipasi Anda dalam lomba ini.';

        } catch (Exception $e) {
            Log::error('Gemini Feedback Generation Exception', [
                'message' => $e->getMessage(),
            ]);

            return 'Terima kasih atas partisipasi Anda dalam lomba ini.';
        }
    }

    /**
     * Build prompt untuk verifikasi peserta
     */
    protected function buildVerificationPrompt(array $participantData, array $documentsInfo): string
    {
        $prompt = "Sebagai sistem verifikasi otomatis untuk lomba Pendidikan Agama Islam, analisis data peserta berikut:
        
        DATA PESERTA:
        - Nama: " . ($participantData['nama'] ?? 'N/A') . "
        - NISN: " . ($participantData['nisn'] ?? 'N/A') . "
        - Sekolah: " . ($participantData['sekolah'] ?? 'N/A') . "
        - Kecamatan: " . ($participantData['kecamatan'] ?? 'N/A') . "
        - Kelas: " . ($participantData['kelas'] ?? 'N/A') . "
        - Lomba: " . ($participantData['lomba'] ?? 'N/A') . "
        
        DOKUMEN YANG DIUPLOAD:
        " . (!empty($documentsInfo) ? json_encode($documentsInfo, JSON_PRETTY_PRINT) : 'Tidak ada informasi dokumen') . "
        
        TUGAS ANDA:
        1. Verifikasi konsistensi data
        2. Identifikasi potensi ketidaksesuaian
        3. Berikan rekomendasi: TERVERIFIED atau PERLU REVIEW
        
        Berikan respons dalam format JSON:
        {
            \"verified\": true/false,
            \"confidence\": 0.0-1.0,
            \"reasons\": [\"alasan verifikasi\"],
            \"flags\": [\"flag masalah jika ada\"],
            \"recommendation\": \"TERVERIFIED|PERLU_REVIEW|TOLAK\",
            \"notes\": \"catatan tambahan\"
        }
        
        Perhatikan:
        - Format NISN harus 10 digit angka
        - Usia peserta harus sesuai jenjang SD
        - Dokumen harus relevan dengan jenis yang diminta";

        return $prompt;
    }

    /**
     * Parse response dari Gemini API untuk verifikasi
     */
    protected function parseVerificationResponse(array $result): array
    {
        try {
            $content = $result['candidates'][0]['content']['parts'][0]['text'] ?? '';
            
            // Extract JSON from response
            preg_match('/\{.*\}/s', $content, $matches);
            
            if (isset($matches[0])) {
                $parsed = json_decode($matches[0], true);
                
                if (is_array($parsed)) {
                    return [
                        'verified' => $parsed['verified'] ?? false,
                        'confidence' => $parsed['confidence'] ?? 0,
                        'reasons' => $parsed['reasons'] ?? [],
                        'flags' => $parsed['flags'] ?? [],
                        'recommendation' => $parsed['recommendation'] ?? 'PERLU_REVIEW',
                        'notes' => $parsed['notes'] ?? '',
                    ];
                }
            }
            
            // Fallback: parse manual
            $verified = stripos($content, 'terverifikasi') !== false || stripos($content, 'verified') !== false;
            $confidence = $verified ? 0.7 : 0.3;
            
            return [
                'verified' => $verified,
                'confidence' => $confidence,
                'reasons' => [$content],
                'recommendation' => $verified ? 'TERVERIFIED' : 'PERLU_REVIEW',
            ];

        } catch (Exception $e) {
            Log::error('Failed to parse Gemini verification response', [
                'error' => $e->getMessage(),
            ]);

            return [
                'verified' => false,
                'confidence' => 0,
                'reasons' => ['Gagal memparse respons AI'],
                'error' => true,
            ];
        }
    }

    /**
     * Cek apakah service tersedia
     */
    public function isAvailable(): bool
    {
        return !empty($this->apiKey);
    }

    /**
     * Get usage statistics (jika didukung API)
     */
    public function getUsageStats(): array
    {
        // Implementasi optional untuk tracking usage
        return [
            'available' => $this->isAvailable(),
            'model' => $this->model,
            'rate_limit' => config('gemini.requests_per_minute', 60),
        ];
    }
}
