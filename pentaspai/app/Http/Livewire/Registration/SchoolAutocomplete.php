<?php

namespace App\Http\Livewire\Registration;

use Livewire\Component;
use App\Models\MasterSekolah;
use App\Models\MasterKecamatan;
use App\Facades\Gemini;

/**
 * School Autocomplete Component
 * 
 * Livewire component untuk auto-complete NPSN dan nama sekolah
 */
class SchoolAutocomplete extends Component
{
    public $npsn = '';
    public $nama_sekolah = '';
    public $kecamatan = '';
    public $alamat_lengkap = '';
    public $jenjang = '';
    public $status_sekolah = '';
    
    public $searching = false;
    public $schoolFound = false;
    public $aiVerificationEnabled = true;

    protected $rules = [
        'npsn' => 'required|digits:8',
        'nama_sekolah' => 'required|string|min:3',
    ];

    /**
     * Search school by NPSN
     */
    public function searchByNpsn(): void
    {
        if (strlen($this->npsn) < 8) {
            return;
        }

        $this->searching = true;

        $school = MasterSekolah::find($this->npsn);

        if ($school) {
            $this->nama_sekolah = $school->nama_sekolah;
            $this->kecamatan = $school->kecamatan;
            $this->alamat_lengkap = $school->alamat_lengkap ?? '';
            $this->jenjang = $school->jenjang;
            $this->status_sekolah = $school->status;
            $this->schoolFound = true;

            // Trigger AI verification jika enabled
            if ($this->aiVerificationEnabled && config('gemini.features.participant_verification')) {
                $this->verifyWithAI();
            }
        } else {
            $this->resetSchoolData();
            $this->schoolFound = false;
        }

        $this->searching = false;
        
        $this->dispatch('school-found', found: $this->schoolFound);
    }

    /**
     * Search school by name (autocomplete)
     */
    public function searchByName(string $value): array
    {
        if (strlen($value) < 3) {
            return [];
        }

        $schools = MasterSekolah::search($value)
            ->limit(10)
            ->get()
            ->map(function ($school) {
                return [
                    'npsn' => $school->npsn,
                    'nama_sekolah' => $school->nama_sekolah,
                    'kecamatan' => $school->kecamatan,
                ];
            })
            ->toArray();

        return $schools;
    }

    /**
     * Select school from autocomplete
     */
    public function selectSchool(string $npsn): void
    {
        $school = MasterSekolah::find($npsn);

        if ($school) {
            $this->npsn = $school->npsn;
            $this->nama_sekolah = $school->nama_sekolah;
            $this->kecamatan = $school->kecamatan;
            $this->alamat_lengkap = $school->alamat_lengkap ?? '';
            $this->jenjang = $school->jenjang;
            $this->status_sekolah = $school->status;
            $this->schoolFound = true;
        }
    }

    /**
     * Verify with AI Gemini
     */
    protected function verifyWithAI(): void
    {
        $gemini = new \App\Services\AI\GeminiService();
        
        if (!$gemini->isAvailable()) {
            return;
        }

        $participantData = [
            'sekolah' => $this->nama_sekolah,
            'kecamatan' => $this->kecamatan,
            'jenjang' => $this->jenjang,
            'status' => $this->status_sekolah,
        ];

        $result = $gemini->verifyParticipant($participantData);

        // Dispatch event dengan hasil verifikasi AI
        $this->dispatch('ai-verification', result: $result);
    }

    /**
     * Reset school data
     */
    public function resetSchoolData(): void
    {
        $this->nama_sekolah = '';
        $this->kecamatan = '';
        $this->alamat_lengkap = '';
        $this->jenjang = '';
        $this->status_sekolah = '';
        $this->schoolFound = false;
    }

    /**
     * Clear search
     */
    public function clearSearch(): void
    {
        $this->reset();
        $this->schoolFound = false;
    }

    /**
     * Get kecamatan code
     */
    public function getKecamatanCodeProperty(): ?string
    {
        if (!empty($this->kecamatan)) {
            return MasterKecamatan::getKodeByNama($this->kecamatan);
        }
        return null;
    }

    public function render()
    {
        return view('livewire.registration.school-autocomplete');
    }
}
