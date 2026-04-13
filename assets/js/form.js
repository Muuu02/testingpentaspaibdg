/**
 * ============================================================
 * FORM HANDLER - PENTAS PAI KOTA BANDUNG 2026
 * ============================================================
 * Fitur: Auto-save, Peringatan Navigasi, Validasi File, Preview,
 * Konfirmasi Submit, Kategori Lomba, dan KHUSUS LDC:
 * - Tema Pidato (dropdown)
 * - Upload Teks Pidato (PDF)
 * ============================================================
 */

// State form
let currentStep = 1;
const totalSteps = 4;
let selectedLomba = null;
let formData = {};

// DOM Elements
const form = document.getElementById('pendaftaranForm');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const submitBtn = document.getElementById('submitBtn');
const persetujuanCheckbox = document.getElementById('persetujuanCheckbox');

// ============================================
// AUTO‑SAVE (A2)
// ============================================
const AUTO_SAVE_KEY = 'pentas_pai_form_draft';
let autoSaveEnabled = true;

function saveDraft() {
    if (!autoSaveEnabled) return;
    const draft = {
        currentStep,
        selectedLomba,
        formData,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(draft));
}

function loadDraft() {
    const saved = localStorage.getItem(AUTO_SAVE_KEY);
    if (!saved) return false;

    try {
        const draft = JSON.parse(saved);
        if (confirm('Anda memiliki data formulir yang belum selesai. Lanjutkan mengisi?')) {
            currentStep = draft.currentStep;
            selectedLomba = draft.selectedLomba;
            formData = draft.formData;
            return true;
        } else {
            localStorage.removeItem(AUTO_SAVE_KEY);
        }
    } catch (e) {
        localStorage.removeItem(AUTO_SAVE_KEY);
    }
    return false;
}

function restoreFormFromDraft() {
    for (const [key, value] of Object.entries(formData)) {
        const field = document.querySelector(`[name="${key}"]`);
        if (field) {
            if (field.type === 'checkbox') field.checked = value;
            else field.value = value;
        }
    }
    if (selectedLomba) {
        const opt = document.querySelector(`.lomba-option[data-lomba="${selectedLomba}"]`);
        if (opt) opt.classList.add('selected');
        document.getElementById('jenisLombaInput').value = selectedLomba;
    }
    updateStepUI();
    if (currentStep === 3) renderDynamicPesertaForm();
    if (currentStep === 4) renderResume();
}

// ============================================
// PERINGATAN NAVIGASI (A3)
// ============================================
function beforeUnloadHandler(e) {
    if (autoSaveEnabled && Object.keys(formData).length > 0) {
        e.preventDefault();
        e.returnValue = 'Perubahan yang Anda buat belum disimpan. Yakin ingin meninggalkan halaman?';
        return e.returnValue;
    }
}
window.addEventListener('beforeunload', beforeUnloadHandler);

function disableNavigationWarning() {
    autoSaveEnabled = false;
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    localStorage.removeItem(AUTO_SAVE_KEY);
}

// ============================================
// VALIDASI UKURAN FILE & PREVIEW (A4, A5)
// ============================================
function validateFileSize(input, maxSizeMB = 2) {
    const file = input.files[0];
    if (!file) return true;
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
        showNotification(`Ukuran file maksimal ${maxSizeMB}MB`, 'error');
        input.value = '';
        return false;
    }
    return true;
}

// Fungsi untuk menangani preview file (gambar atau ikon PDF) dan menyimpan Base64
function handleFileUpload(input, previewId, storageKey) {
    if (!validateFileSize(input)) {
        if (previewId) {
            const preview = document.getElementById(previewId);
            if (preview) preview.classList.add('hidden');
        }
        return;
    }

    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        // Simpan Base64 ke formData
        if (storageKey) {
            formData[storageKey] = e.target.result;
        }
        // Tampilkan preview jika ada previewId
        if (previewId) {
            const preview = document.getElementById(previewId);
            if (!preview) return;
            if (file.type.startsWith('image/')) {
                preview.src = e.target.result;
            } else {
                // Ikon PDF generik
                preview.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 384 512\'%3E%3Cpath fill=\'%23ef4444\' d=\'M64 0C28.7 0 0 28.7 0 64L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-288-128 0c-17.7 0-32-14.3-32-32L224 0 64 0zM256 0l0 128 128 0L256 0z\'/%3E%3C/svg%3E';
            }
            preview.classList.remove('hidden');
        }
    };
    reader.readAsDataURL(file);
}

// ============================================
// STEP NAVIGATION
// ============================================
function nextStep(step) {
    if (!validateStep(step)) return;
    saveStepData(step);
    currentStep++;
    updateStepUI();
    if (currentStep === 3) renderDynamicPesertaForm();
    if (currentStep === 4) renderResume();
    saveDraft();
}

function prevStep(step) {
    currentStep--;
    updateStepUI();
    saveDraft();
}

function updateStepUI() {
    const progress = (currentStep / totalSteps) * 100;
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `Step ${currentStep} dari ${totalSteps}`;

    document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
        const stepNum = index + 1;
        indicator.classList.remove('active', 'completed');
        if (stepNum === currentStep) indicator.classList.add('active');
        else if (stepNum < currentStep) indicator.classList.add('completed');
    });

    document.querySelectorAll('.step-line').forEach((line, index) => {
        line.classList.remove('completed');
        if (index < currentStep - 1) line.classList.add('completed');
    });

    document.querySelectorAll('.form-step').forEach(stepEl => {
        stepEl.classList.remove('active');
        if (parseInt(stepEl.dataset.step) === currentStep) stepEl.classList.add('active');
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateStep(step) {
    const stepEl = document.querySelector(`.form-step[data-step="${step}"]`);
    const requiredFields = stepEl.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        field.classList.remove('error');
        if (!field.value.trim()) {
            field.classList.add('error');
            isValid = false;
        }

        if (field.name === 'npsn' && field.value && !/^\d{8}$/.test(field.value)) {
            field.classList.add('error');
            showNotification('NPSN harus 8 digit angka', 'error');
            isValid = false;
        }
        if (field.name === 'hpPendamping' && field.value && !validasiNoHP(field.value)) {
            field.classList.add('error');
            showNotification('Format nomor HP tidak valid', 'error');
            isValid = false;
        }
        if (field.name.startsWith('nisn') && field.value && !validasiNISN(field.value)) {
            field.classList.add('error');
            showNotification('NISN harus 10 digit angka', 'error');
            isValid = false;
        }
    });

    if (step === 1 && !selectedLomba) {
        showNotification('Silakan pilih jenis lomba', 'error');
        isValid = false;
    }

    if (!isValid) showNotification('Mohon lengkapi semua field yang wajib diisi', 'error');
    return isValid;
}

function saveStepData(step) {
    const stepEl = document.querySelector(`.form-step[data-step="${step}"]`);
    const inputs = stepEl.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input.name && input.type !== 'checkbox' && input.type !== 'file') {
            formData[input.name] = input.value.trim();
        }
        if (input.type === 'checkbox') {
            formData[input.name] = input.checked;
        }
    });
}

// ============================================
// LOMBA SELECTION
// ============================================
function initLombaSelection() {
    const lombaOptions = document.querySelectorAll('.lomba-option');
    const jenisLombaInput = document.getElementById('jenisLombaInput');

    lombaOptions.forEach(option => {
        option.addEventListener('click', () => {
            lombaOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedLomba = option.dataset.lomba;
            jenisLombaInput.value = selectedLomba;
            saveDraft();
        });
    });

    const urlParams = new URLSearchParams(window.location.search);
    const preselectedLomba = urlParams.get('lomba');
    if (preselectedLomba) {
        const option = document.querySelector(`.lomba-option[data-lomba="${preselectedLomba}"]`);
        if (option) option.click();
    }
}

// ============================================
// FETCH SEKOLAH DARI NPSN
// ============================================
async function fetchSekolahByNPSN() {
    const npsn = document.getElementById('npsnInput').value.trim();
    if (!/^\d{8}$/.test(npsn)) {
        showNotification('NPSN harus 8 digit angka', 'error');
        return;
    }

    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        const response = await fetch(CONFIG.GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'getSekolahByNPSN', npsn: npsn })
        });
        const result = await response.json();

        if (result.success && result.data) {
            document.getElementById('namaSekolahInput').value = result.data.nama_sekolah || '';
            document.getElementById('kecamatanInput').value = result.data.kecamatan || '';
            document.getElementById('alamatSekolahInput').value = result.data.alamat_lengkap || '';
            showNotification('Data sekolah ditemukan', 'success');
            saveDraft();
        } else {
            showNotification('NPSN tidak ditemukan. Silakan ajukan penambahan data.', 'warning');
        }
    } catch (error) {
        console.error('Error fetch NPSN:', error);
        showNotification('Gagal mengambil data sekolah', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-search"></i> Cek';
    }
}

// ============================================
// DYNAMIC PESERTA FORM (termasuk LDC khusus)
// ============================================
function renderDynamicPesertaForm() {
    if (!selectedLomba) return;

    const lombaData = LOMBA_DATA[selectedLomba];
    const container = document.getElementById('dynamicPesertaForm');
    const infoLomba = document.getElementById('infoLombaTerpilih');
    const infoJumlah = document.getElementById('infoJumlahPeserta');

    infoLomba.textContent = lombaData.nama;

    let html = '';

    // LCCP
    if (selectedLomba === 'lccp') {
        infoJumlah.textContent = '3 orang (bebas gender)';
        html += `
            <div class="mb-4">
                <label class="block text-sm font-semibold text-gray-200 mb-2">Nama Regu <span class="text-red-400">*</span></label>
                <input type="text" name="namaRegu" required class="input-field w-full px-4 py-3 rounded-xl" placeholder="Nama regu">
            </div>
        `;
        for (let i = 1; i <= 3; i++) html += generateAnggotaCard(i, 'Anggota', true, true);
    }

    // LPSB
    else if (selectedLomba === 'lpsb') {
        infoJumlah.textContent = '3 orang (2 Putra + 1 Putri)';
        html += `
            <div class="mb-4">
                <label class="block text-sm font-semibold text-gray-200 mb-2">Nama Regu <span class="text-red-400">*</span></label>
                <input type="text" name="namaRegu" required class="input-field w-full px-4 py-3 rounded-xl" placeholder="Nama regu">
            </div>
        `;
        html += generateAnggotaCard(1, 'Anggota Putra 1', true, true, true);
        html += generateAnggotaCard(2, 'Anggota Putra 2', true, true, true);
        html += generateAnggotaCard(3, 'Anggota Putri', false, true, true);
    }

    // LSQR
    else if (selectedLomba === 'lsqr') {
        infoJumlah.textContent = '9-11 orang (homogen gender)';
        html += `
            <div class="mb-4">
                <label class="block text-sm font-semibold text-gray-200 mb-2">Nama Grup <span class="text-red-400">*</span></label>
                <input type="text" name="namaGrup" required class="input-field w-full px-4 py-3 rounded-xl" placeholder="Nama grup">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-semibold text-gray-200 mb-2">Gender Grup <span class="text-red-400">*</span></label>
                <select name="genderGrup" required class="input-field w-full px-4 py-3 rounded-xl">
                    <option value="">Pilih Gender</option>
                    <option value="L">Putra (Semua Laki-laki)</option>
                    <option value="P">Putri (Semua Perempuan)</option>
                </select>
            </div>
        `;
        for (let i = 1; i <= 11; i++) {
            const isRequired = i <= 9;
            html += generateAnggotaCard(i, `Anggota ${i}`, true, isRequired, false, i > 9);
        }
        html += `
            <div class="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
                <p class="text-sm text-yellow-300"><i class="fas fa-info-circle mr-2"></i>Minimal 9 anggota wajib diisi. Anggota 10-11 opsional.</p>
            </div>
        `;
    }

    // Perorangan (LDC, MTQ, MHQ, LKI)
    else if (['ldc', 'mtq', 'mhq', 'lki'].includes(selectedLomba)) {
        infoJumlah.textContent = '1 orang';
        html += `
            <div class="mb-4">
                <label class="block text-sm font-semibold text-gray-200 mb-2">Kategori Lomba <span class="text-red-400">*</span></label>
                <select name="jenisKelamin" required class="input-field w-full px-4 py-3 rounded-xl">
                    <option value="">Pilih</option>
                    <option value="L">Putra</option>
                    <option value="P">Putri</option>
                </select>
            </div>
        `;

        // Khusus MTQ: Maqro
        if (selectedLomba === 'mtq') {
            html += `
                <div class="mb-4">
                    <label class="block text-sm font-semibold text-gray-200 mb-2">Pilihan Maqro <span class="text-red-400">*</span></label>
                    <select name="maqro" required class="input-field w-full px-4 py-3 rounded-xl">
                        <option value="">Pilih Maqro</option>
                        ${lombaData.maqro.map((m, i) => `<option value="${i+1}">${m}</option>`).join('')}
                    </select>
                </div>
            `;
        }

        // Khusus LDC: Tema Pidato & Upload Teks Pidato
        if (selectedLomba === 'ldc') {
            const temaOptions = [
                'Peduli dan berbagi kepada yang membutuhkan',
                'Menjadi pemimpin yang dicintai',
                'Cerdas bergaul sesuai ajaran Islam',
                'Mencintai kedua orang tua',
                'Cinta kepada guru',
                'Menjaga masa depan dengan mencintai alam',
                'Aksi jarimu di media sosial adalah hisabmu di akhirat',
                'Mencintai Rasulullah saw.',
                'Menjaga persatuan dengan tasamuh',
                'Pemuda-pemudi impian masa depan'
            ];
            html += `
                <div class="mb-4">
                    <label class="block text-sm font-semibold text-gray-200 mb-2">Tema Pidato <span class="text-red-400">*</span></label>
                    <select name="temaPidato" required class="input-field w-full px-4 py-3 rounded-xl">
                        <option value="">Pilih Tema</option>
                        ${temaOptions.map(t => `<option value="${t}">${t}</option>`).join('')}
                    </select>
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-semibold text-gray-200 mb-2">Upload Teks Pidato (PDF) <span class="text-red-400">*</span></label>
                    <input type="file" name="teksPidato" id="teksPidatoInput" accept=".pdf" required
                        onchange="handleFileUpload(this, 'previewTeksPidato', 'teksPidatoData')"
                        class="input-field w-full px-4 py-3 rounded-xl bg-gray-700">
                    <p class="text-xs text-gray-400 mt-1">Format PDF, maks 2MB</p>
                    <img id="previewTeksPidato" class="foto-preview mt-2 hidden" src="#" alt="Preview Teks Pidato">
                </div>
            `;
        }

        html += generateAnggotaCard(1, 'Data Peserta', true, true);
    }

    // LPA
    else if (selectedLomba === 'lpa') {
        infoJumlah.textContent = '1 Putra';
        html += `
            <div class="mb-4">
                <label class="block text-sm font-semibold text-gray-200 mb-2">Jenis Kelamin</label>
                <input type="text" value="Putra" readonly class="input-field w-full px-4 py-3 rounded-xl bg-gray-700">
                <input type="hidden" name="jenisKelamin" value="L">
            </div>
        `;
        html += generateAnggotaCard(1, 'Data Peserta', true, true);
    }

    container.innerHTML = html;

    if (selectedLomba === 'lccp') addCopyFunctionality();

    document.querySelectorAll('input[name^="nisn"]').forEach(input => {
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
        });
    });

    // Isi ulang field dari draft
    for (const [key, value] of Object.entries(formData)) {
        const field = document.querySelector(`[name="${key}"]`);
        if (field) {
            if (field.type === 'checkbox') field.checked = value;
            else field.value = value;
        }
    }
}

function generateAnggotaCard(index, label, showGender, isRequired, showPeran = false, isOptional = false) {
    const requiredAttr = isRequired ? 'required' : '';
    const requiredMark = isRequired ? '<span class="text-red-400">*</span>' : '<span class="text-gray-400">(opsional)</span>';
    const genderValue = showGender ? '' : 'value="P" readonly';
    const genderClass = showGender ? '' : 'bg-gray-700 text-gray-300';

    let peranHtml = '';
    if (showPeran) {
        const isPutri = label.includes('Putri');
        peranHtml = isPutri ? `
            <div>
                <label class="block text-sm font-semibold text-gray-200 mb-2">Peran ${requiredMark}</label>
                <select name="peran${index}" ${requiredAttr} class="input-field w-full px-4 py-3 rounded-xl">
                    <option value="">Pilih Peran</option>
                    <option value="Makmum">Makmum</option>
                </select>
            </div>
        ` : `
            <div>
                <label class="block text-sm font-semibold text-gray-200 mb-2">Peran ${requiredMark}</label>
                <select name="peran${index}" ${requiredAttr} class="input-field w-full px-4 py-3 rounded-xl">
                    <option value="">Pilih Peran</option>
                    <option value="Imam">Imam</option>
                    <option value="Makmum">Makmum</option>
                </select>
            </div>
        `;
    }

    return `
        <div class="anggota-card rounded-xl p-4 md:p-6 ${isOptional ? 'opacity-75' : ''}">
            <div class="flex items-center justify-between mb-4">
                <h4 class="font-bold text-emerald-400">${label}</h4>
                ${index > 1 && !showPeran ? `<button type="button" onclick="copyFromFirst(${index})" class="text-sm text-emerald-400 hover:text-emerald-300"><i class="fas fa-copy mr-1"></i>Copy dari Anggota 1</button>` : ''}
            </div>
            <div class="grid md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                    <label class="block text-sm font-semibold text-gray-200 mb-2">Nama Lengkap ${requiredMark}</label>
                    <input type="text" name="nama${index}" ${requiredAttr} class="input-field w-full px-4 py-3 rounded-xl" placeholder="Nama lengkap sesuai ijazah">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-200 mb-2">NISN ${requiredMark}</label>
                    <input type="text" name="nisn${index}" ${requiredAttr} maxlength="10" class="input-field w-full px-4 py-3 rounded-xl" placeholder="10 digit NISN">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-200 mb-2">Tanggal Lahir ${requiredMark}</label>
                    <input type="date" name="ttl${index}" ${requiredAttr} class="input-field w-full px-4 py-3 rounded-xl">
                </div>
                ${showGender ? `
                <div>
                    <label class="block text-sm font-semibold text-gray-200 mb-2">Jenis Kelamin ${requiredMark}</label>
                    <select name="jk${index}" ${requiredAttr} class="input-field w-full px-4 py-3 rounded-xl">
                        <option value="">Pilih</option>
                        <option value="L">Putra</option>
                        <option value="P">Putri</option>
                    </select>
                </div>
                ` : `
                <div>
                    <label class="block text-sm font-semibold text-gray-200 mb-2">Jenis Kelamin</label>
                    <input type="text" ${genderValue} readonly class="input-field w-full px-4 py-3 rounded-xl ${genderClass}">
                    <input type="hidden" name="jk${index}" value="P">
                </div>
                `}
                <div>
                    <label class="block text-sm font-semibold text-gray-200 mb-2">Kelas ${requiredMark}</label>
                    <select name="kelas${index}" ${requiredAttr} class="input-field w-full px-4 py-3 rounded-xl">
                        <option value="">Pilih</option>
                        <option value="3">Kelas 3</option>
                        <option value="4">Kelas 4</option>
                        <option value="5">Kelas 5</option>
                    </select>
                </div>
                ${peranHtml}
                <div class="md:col-span-2">
                    <label class="block text-sm font-semibold text-gray-200 mb-2">Upload Foto ${requiredMark}</label>
                    <input type="file" name="foto${index}" id="fotoInput${index}" ${requiredAttr} accept="image/*" 
                        onchange="handleFileUpload(this, 'preview${index}', 'fotoData${index}')"
                        class="input-field w-full px-4 py-3 rounded-xl bg-gray-700">
                    <p class="text-xs text-gray-400 mt-1">Format: JPG/PNG, maks 2MB</p>
                    <img id="preview${index}" class="foto-preview mt-2 hidden" src="#" alt="Preview Foto">
                </div>
            </div>
        </div>
    `;
}

function addCopyFunctionality() {}
function copyFromFirst(targetIndex) {
    const fields = ['nama', 'ttl', 'jk', 'kelas'];
    fields.forEach(field => {
        const source = document.querySelector(`[name="${field}1"]`);
        const target = document.querySelector(`[name="${field}${targetIndex}"]`);
        if (source && target) target.value = source.value;
    });
    showNotification('Data berhasil disalin dari Anggota 1', 'success');
    saveDraft();
}

// ============================================
// RESUME
// ============================================
function renderResume() {
    const lombaData = LOMBA_DATA[selectedLomba];

    document.getElementById('resumeLomba').textContent = lombaData.nama;
    document.getElementById('resumeKecamatan').textContent = formData.kecamatan;
    document.getElementById('resumeSekolah').textContent = formData.namaSekolah;
    document.getElementById('resumeNpsn').textContent = formData.npsn;
    document.getElementById('resumeNamaPendamping').textContent = formData.namaPendamping;
    document.getElementById('resumeHpPendamping').textContent = formData.hpPendamping;

    const container = document.getElementById('resumePesertaContainer');
    let html = '';

    if (selectedLomba === 'lccp' || selectedLomba === 'lpsb') {
        html += `<p class="font-semibold text-white mb-2">Nama Regu: ${formData.namaRegu || '-'}</p>`;
    }
    if (selectedLomba === 'lsqr') {
        html += `<p class="font-semibold text-white mb-2">Nama Grup: ${formData.namaGrup || '-'}</p>`;
        html += `<p class="text-sm text-gray-300 mb-3">Gender: ${formData.genderGrup === 'L' ? 'Putra' : 'Putri'}</p>`;
    }
    if (selectedLomba === 'ldc') {
        html += `<p class="text-sm text-gray-300 mb-2"><i class="fas fa-microphone mr-1"></i>Tema Pidato: ${formData.temaPidato || '-'}</p>`;
    }

    let pesertaCount = 1;
    if (selectedLomba === 'lccp' || selectedLomba === 'lpsb') pesertaCount = 3;
    else if (selectedLomba === 'lsqr') {
        pesertaCount = 11;
        for (let i = 9; i <= 11; i++) {
            if (!formData[`nama${i}`]) { pesertaCount = i - 1; break; }
        }
    }

    for (let i = 1; i <= pesertaCount; i++) {
        if (!formData[`nama${i}`]) continue;
        const jk = formData[`jk${i}`] === 'L' ? 'Putra' : 'Putri';
        const peran = formData[`peran${i}`] ? ` (${formData[`peran${i}`]})` : '';
        let fotoHtml = '';
        if (formData[`fotoData${i}`]) {
            fotoHtml = `<img src="${formData[`fotoData${i}`]}" class="foto-preview mt-2" alt="Foto ${formData[`nama${i}`]}">`;
        }
        html += `
            <div class="flex items-start justify-between py-2 border-b border-gray-600 last:border-0">
                <div>
                    <p class="font-semibold text-white">${formData[`nama${i}`]}${peran}</p>
                    <p class="text-sm text-gray-300">NISN: ${formData[`nisn${i}`]} | ${jk} | Kelas ${formData[`kelas${i}`]}</p>
                    ${fotoHtml}
                </div>
            </div>
        `;
    }

    container.innerHTML = html || '<p class="text-gray-400">Tidak ada data peserta</p>';
}

// ============================================
// UPLOAD BERKAS (dummy, sesuaikan)
// ============================================
async function uploadAllBerkas() {
    // Implementasi upload berkas (rapor, SK, akta) dan untuk LDC: teks pidato
    return {};
}

// ============================================
// SUBMIT (A7: konfirmasi)
// ============================================
async function handleFormSubmit(e) {
    e.preventDefault();

    if (!persetujuanCheckbox.checked) {
        showNotification('Anda harus menyetujui pernyataan', 'error');
        return;
    }

    if (!confirm('Apakah semua data sudah benar? Data yang sudah disubmit tidak dapat diubah tanpa bantuan admin.')) {
        return;
    }

    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.classList.remove('hidden');

    try {
        saveStepData(4);
        const pendaftaranId = generatePendaftaranID();
        formData.id = pendaftaranId;
        formData.timestamp = new Date().toISOString();

        const berkasUrls = await uploadAllBerkas();
        formData.berkas = berkasUrls;

        const submissionData = prepareSubmissionData();

        const response = await fetch(CONFIG.GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'submitPendaftaran', data: submissionData })
        });

        const result = await response.json();
        if (result.success) {
            disableNavigationWarning();
            showSuccessModal(pendaftaranId);
        } else {
            throw new Error(result.message || 'Gagal menyimpan data');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Terjadi kesalahan: ' + error.message, 'error');
    } finally {
        loadingOverlay.classList.add('hidden');
    }
}

function prepareSubmissionData() {
    const lombaData = LOMBA_DATA[selectedLomba];
    const peserta = [];
    let maxPeserta = lombaData.jumlahPeserta || 1;
    if (selectedLomba === 'lsqr') maxPeserta = 11;
    if (selectedLomba === 'lccp' || selectedLomba === 'lpsb') maxPeserta = 3;

    for (let i = 1; i <= maxPeserta; i++) {
        if (formData[`nama${i}`]) {
            peserta.push({
                nama: formData[`nama${i}`],
                nisn: formData[`nisn${i}`],
                ttl: formData[`ttl${i}`],
                jk: formData[`jk${i}`],
                kelas: formData[`kelas${i}`],
                peran: formData[`peran${i}`] || null,
                maqro: formData[`maqro`] || null,
                statusWajib: i <= 9 ? 'WAJIB' : 'CADANGANO',
                fotoData: formData[`fotoData${i}`] || null
            });
        }
    }

    // Data khusus LDC
    const ldcData = selectedLomba === 'ldc' ? {
        temaPidato: formData.temaPidato || null,
        teksPidatoData: formData.teksPidatoData || null
    } : {};

    return {
        id: formData.id,
        timestamp: formData.timestamp,
        jenisLomba: selectedLomba,
        namaLomba: lombaData.nama,
        npsn: formData.npsn,
        namaSekolah: formData.namaSekolah,
        kecamatan: formData.kecamatan,
        alamatSekolah: formData.alamatSekolah,
        namaPendamping: formData.namaPendamping,
        hpPendamping: formData.hpPendamping,
        namaRegu: formData.namaRegu || null,
        namaGrup: formData.namaGrup || null,
        genderGrup: formData.genderGrup || null,
        maqro: formData.maqro || null,
        peserta: peserta,
        jumlahPeserta: peserta.length,
        berkas: formData.berkas || null,
        ldc: ldcData,
        status: 'MENUNGGU_VERIFIKASI'
    };
}

function showSuccessModal(id) {
    const modal = document.getElementById('successModal');
    document.getElementById('successId').textContent = id;
    document.getElementById('buktiLomba').textContent = LOMBA_DATA[selectedLomba].kode;
    document.getElementById('buktiKecamatan').textContent = formData.kecamatan;
    document.getElementById('buktiSekolah').textContent = formData.namaSekolah;
    const qr = document.getElementById('qrcode');
    qr.innerHTML = '';
    new QRCode(qr, { text: id, width: 128, height: 128, colorDark: '#065f46', colorLight: '#ffffff' });
    modal.classList.remove('hidden');
}

function printBukti() {
    const bukti = document.getElementById('buktiPendaftaran').cloneNode(true);
    const win = window.open('', '_blank', 'width=800,height=600');
    win.document.write(`
        <!DOCTYPE html><html><head><title>Bukti Pendaftaran</title>
        <script src="https://cdn.tailwindcss.com"><\/script>
        </head><body class="bg-gray-900 p-6 flex justify-center"><div class="max-w-md">${bukti.outerHTML}</div></body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
}

function shareWhatsApp() {
    const id = document.getElementById('successId').textContent;
    const lomba = LOMBA_DATA[selectedLomba].kode;
    const text = `*Bukti Pendaftaran PENTAS PAI 2026*%0A%0AID: ${id}%0AMata Lomba: ${lomba}%0ASekolah: ${formData.namaSekolah}%0AKecamatan: ${formData.kecamatan}`;
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

// ============================================
// TOMBOL KEMBALI KE ATAS (A9)
// ============================================
function initScrollToTop() {
    const btn = document.getElementById('btnScrollTop');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        btn.classList.toggle('hidden', window.scrollY <= 300);
        btn.classList.toggle('flex', window.scrollY > 300);
    });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ============================================
// INISIALISASI UTAMA
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initLombaSelection();
    form.addEventListener('submit', handleFormSubmit);
    persetujuanCheckbox.addEventListener('change', () => {
        submitBtn.disabled = !persetujuanCheckbox.checked;
    });
    document.querySelector('input[name="npsn"]')?.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8);
    });

    if (loadDraft()) {
        restoreFormFromDraft();
    }
    form.addEventListener('input', () => { saveStepData(currentStep); saveDraft(); });
    form.addEventListener('change', () => { saveStepData(currentStep); saveDraft(); });

    initScrollToTop();
});
