<div class="space-y-4">
    <!-- NPSN Input -->
    <div>
        <label for="npsn" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            NPSN Sekolah <span class="text-red-500">*</span>
        </label>
        <div class="mt-1 flex gap-2">
            <input 
                type="text" 
                id="npsn"
                wire:model="npsn"
                wire:blur="searchByNpsn"
                wire:loading.attr="disabled"
                placeholder="8 digit NPSN"
                maxlength="8"
                class="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-800 dark:border-gray-600 sm:text-sm"
            />
            <button 
                wire:click="searchByNpsn"
                wire:loading.attr="disabled"
                type="button"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
                <svg wire:loading.remove wire:target="searchByNpsn" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <svg wire:loading wire:target="searchByNpsn" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </button>
        </div>
        @error('npsn') <span class="text-red-500 text-xs mt-1">{{ $message }}</span> @enderror
    </div>

    <!-- School Found Status -->
    @if($schoolFound)
        <div class="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-green-800 dark:text-green-200">Sekolah Ditemukan</h3>
                    <p class="mt-1 text-sm text-green-700 dark:text-green-300">{{ $nama_sekolah }}</p>
                </div>
            </div>
        </div>
    @endif

    <!-- School Info (Readonly) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Sekolah</label>
            <input 
                type="text" 
                wire:model="nama_sekolah"
                readonly
                class="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 sm:text-sm"
            />
        </div>
        
        <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Kecamatan</label>
            <input 
                type="text" 
                wire:model="kecamatan"
                readonly
                class="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 sm:text-sm"
            />
        </div>

        <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Alamat Lengkap</label>
            <textarea 
                wire:model="alamat_lengkap"
                rows="2"
                readonly
                class="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 sm:text-sm"
            ></textarea>
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Jenjang</label>
            <input 
                type="text" 
                wire:model="jenjang"
                readonly
                class="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 sm:text-sm"
            />
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
            <input 
                type="text" 
                wire:model="status_sekolah"
                readonly
                class="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 sm:text-sm"
            />
        </div>
    </div>

    <!-- AI Verification Badge -->
    @if(config('gemini.features.participant_verification'))
        <div x-data="{ showing: false }" 
             @ai-verification.window="
                 console.log('AI Result:', $event.detail.result);
                 showing = true;
             "
             x-show="showing"
             class="mt-4 p-4 rounded-lg border {{ $schoolFound ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 bg-gray-50' }}">
            <div class="flex items-start">
                <svg class="h-5 w-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
                <div class="ml-3 flex-1">
                    <h4 class="text-sm font-medium text-blue-800 dark:text-blue-200">AI Verification</h4>
                    <p class="mt-1 text-xs text-blue-700 dark:text-blue-300">
                        Sistem akan memverifikasi data sekolah secara otomatis menggunakan AI untuk memastikan kevalidan data.
                    </p>
                </div>
            </div>
        </div>
    @endif
</div>
