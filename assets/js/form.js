/**
 * ============================================================
 * FORM HANDLER - PENTAS PAI KOTA BANDUNG 2026
 * ============================================================
 * Fitur lengkap: Auto-save, Navigasi Warning, Validasi File,
 * Preview, LDC (Tema & Teks Pidato), Upload Berkas Base64,
 * Konfirmasi Submit, Tombol Kembali ke Atas.
 * ============================================================
 */

// State
let currentStep = 1;
const totalSteps = 4;
let selectedLomba = null;
let formData = {};

// DOM
const form = document.getElementById('pendaftaranForm');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const submitBtn = document.getElementById('submitBtn');
const persetujuanCheckbox = document.getElementById('persetujuanCheckbox');

// ============================================
// AUTO‑SAVE
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
        if (confirm('Lanjutkan mengisi data yang tersimpan?')) {
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
// NAVIGATION WARNING
// ============================================
function beforeUnloadHandler(e) {
    if (autoSaveEnabled && Object.keys(formData).length > 0) {
        e.preventDefault();
        e.returnValue = '';
        return '';
    }
}
window.addEventListener('beforeunload', beforeUnloadHandler);
function disableNavigationWarning() {
    autoSaveEnabled = false;
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    localStorage.removeItem(AUTO_SAVE_KEY);
}

// ============================================
// VALIDASI & PREVIEW FILE
// ============================================
function validateFileSize(input, maxSizeMB = 2) {
    const file = input.files[0];
    if (!file) return true;
    if (file.size > maxSizeMB * 1024 * 1024) {
        showNotification(`Ukuran maksimal ${maxSizeMB}MB`, 'error');
        input.value = '';
        return false;
    }
    return true;
}

function previewFile(input, previewId) {
    const file = input.files[0];
    const preview = document.getElementById(previewId);
    if (!preview) return;
    if (!file) {
        preview.classList.add('hidden');
        preview.src = '#';
        return;
    }
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => {
            preview.src = e.target.result;
            preview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    } else {
        preview.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 384 512\'%3E%3Cpath fill=\'%23ef4444\' d=\'M64 0C28.7 0 0 28.7 0 64L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-288-128 0c-17.7 0-32-14.3-32-32L224 0 64 0zM256 0l0 128 128 0L256 0z\'/%3E%3C/svg%3E';
        preview.classList.remove('hidden');
    }
}

function simpanBase64(input, fieldName) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => { formData[fieldName] = e.target.result; };
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
function prevStep(step) { currentStep--; updateStepUI(); saveDraft(); }

function updateStepUI() {
    progressBar.style.width = `${(currentStep/totalSteps)*100}%`;
    progressText.textContent = `Step ${currentStep} dari ${totalSteps}`;
    document.querySelectorAll('.step-indicator').forEach((el, i) => {
        el.classList.remove('active', 'completed');
        if (i+1 === currentStep) el.classList.add('active');
        else if (i+1 < currentStep) el.classList.add('completed');
    });
    document.querySelectorAll('.step-line').forEach((el, i) => {
        el.classList.toggle('completed', i < currentStep-1);
    });
    document.querySelectorAll('.form-step').forEach(el => {
        el.classList.toggle('active', parseInt(el.dataset.step) === currentStep);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateStep(step) {
    const fields = document.querySelectorAll(`.form-step[data-step="${step}"] [required]`);
    let valid = true;
    fields.forEach(f => {
        f.classList.remove('error');
        if (!f.value.trim()) { f.classList.add('error'); valid = false; }
        if (f.name === 'npsn' && !/^\d{8}$/.test(f.value)) { f.classList.add('error'); showNotification('NPSN 8 digit', 'error'); valid = false; }
        if (f.name === 'hpPendamping' && !validasiNoHP(f.value)) { f.classList.add('error'); showNotification('Nomor HP tidak valid', 'error'); valid = false; }
        if (f.name.startsWith('nisn') && !validasiNISN(f.value)) { f.classList.add('error'); showNotification('NISN 10 digit', 'error'); valid = false; }
    });
    if (step === 1 && !selectedLomba) { showNotification('Pilih lomba', 'error'); valid = false; }
    if (!valid) showNotification('Lengkapi field wajib', 'error');
    return valid;
}

function saveStepData(step) {
    document.querySelectorAll(`.form-step[data-step="${step}"] [name]`).forEach(input => {
        if (input.type === 'checkbox') formData[input.name] = input.checked;
        else if (input.type !== 'file') formData[input.name] = input.value.trim();
    });
}

// ============================================
// FETCH NPSN
// ============================================
async function fetchSekolahByNPSN() {
    const npsn = document.getElementById('npsnInput').value.trim();
    if (!/^\d{8}$/.test(npsn)) { showNotification('NPSN 8 digit', 'error'); return; }
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    try {
        const res = await fetch(CONFIG.GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'getSekolahByNPSN', npsn })
        });
        const data = await res.json();
        if (data.success && data.data) {
            document.getElementById('namaSekolahInput').value = data.data.nama_sekolah || '';
            document.getElementById('kecamatanInput').value = data.data.kecamatan || '';
            document.getElementById('alamatSekolahInput').value = data.data.alamat_lengkap || '';
            showNotification('Data ditemukan', 'success');
            saveDraft();
        } else {
            showNotification('NPSN tidak ditemukan', 'warning');
        }
    } catch (e) {
        showNotification('Gagal fetch', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-search"></i> Cek';
    }
}

// ============================================
// DYNAMIC PESERTA FORM
// ============================================
function renderDynamicPesertaForm() {
    const lomba = LOMBA_DATA[selectedLomba];
    document.getElementById('infoLombaTerpilih').textContent = lomba.nama;
    const container = document.getElementById('dynamicPesertaForm');
    let html = '';
    const infoJumlah = document.getElementById('infoJumlahPeserta');

    if (selectedLomba === 'lccp') {
        infoJumlah.textContent = '3 orang (bebas gender)';
        html += `<div class="mb-4"><label class="block text-sm font-semibold text-gray-200 mb-2">Nama Regu <span class="text-red-400">*</span></label><input type="text" name="namaRegu" required class="input-field w-full px-4 py-3 rounded-xl" placeholder="Nama regu"></div>`;
        for (let i=1; i<=3; i++) html += generateAnggotaCard(i, 'Anggota', true, true);
    }
    else if (selectedLomba === 'lpsb') {
        infoJumlah.textContent = '3 orang (2 Putra + 1 Putri)';
        html += `<div class="mb-4"><label class="block text-sm font-semibold text-gray-200 mb-2">Nama Regu <span class="text-red-400">*</span></label><input type="text" name="namaRegu" required class="input-field w-full px-4 py-3 rounded-xl" placeholder="Nama regu"></div>`;
        html += generateAnggotaCard(1, 'Anggota Putra 1', true, true, true);
        html += generateAnggotaCard(2, 'Anggota Putra 2', true, true, true);
        html += generateAnggotaCard(3, 'Anggota Putri', false, true, true);
    }
    else if (selectedLomba === 'lsqr') {
        infoJumlah.textContent = '9-11 orang (homogen gender)';
        html += `<div class="mb-4"><label class="block text-sm font-semibold text-gray-200 mb-2">Nama Grup <span class="text-red-400">*</span></label><input type="text" name="namaGrup" required class="input-field w-full px-4 py-3 rounded-xl" placeholder="Nama grup"></div>
                 <div class="mb-4"><label class="block text-sm font-semibold text-gray-200 mb-2">Gender Grup <span class="text-red-400">*</span></label><select name="genderGrup" required class="input-field w-full px-4 py-3 rounded-xl"><option value="">Pilih</option><option value="L">Putra</option><option value="P">Putri</option></select></div>`;
        for (let i=1; i<=11; i++) html += generateAnggotaCard(i, `Anggota ${i}`, true, i<=9, false, i>9);
        html += `<div class="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4"><p class="text-sm text-yellow-300"><i class="fas fa-info-circle mr-2"></i>Minimal 9 anggota wajib.</p></div>`;
    }
    else if (['ldc','mtq','mhq','lki'].includes(selectedLomba)) {
        infoJumlah.textContent = '1 orang';
        html += `<div class="mb-4"><label class="block text-sm font-semibold text-gray-200 mb-2">Kategori Lomba <span class="text-red-400">*</span></label><select name="jenisKelamin" required class="input-field w-full px-4 py-3 rounded-xl"><option value="">Pilih</option><option value="L">Putra</option><option value="P">Putri</option></select></div>`;
        if (selectedLomba === 'mtq') html += `<div class="mb-4"><label class="block text-sm font-semibold text-gray-200 mb-2">Maqro <span class="text-red-400">*</span></label><select name="maqro" required class="input-field w-full px-4 py-3 rounded-xl">${lomba.maqro.map((m,i)=>`<option value="${i+1}">${m}</option>`).join('')}</select></div>`;
        if (selectedLomba === 'ldc') {
            const tema = ['Peduli dan berbagi...','Menjadi pemimpin...','Cerdas bergaul...','Mencintai orang tua...','Cinta kepada guru...','Menjaga alam...','Aksi di medsos...','Mencintai Rasulullah...','Menjaga persatuan...','Pemuda impian...'];
            html += `<div class="mb-4"><label class="block text-sm font-semibold text-gray-200 mb-2">Tema Pidato <span class="text-red-400">*</span></label><select name="temaPidato" required class="input-field w-full px-4 py-3 rounded-xl"><option value="">Pilih</option>${tema.map(t=>`<option value="${t}">${t}</option>`).join('')}</select></div>`;
            html += `<div class="mb-4"><label class="block text-sm font-semibold text-gray-200 mb-2">Upload Teks Pidato (PDF) <span class="text-red-400">*</span></label><input type="file" name="teksPidato" id="teksPidatoInput" accept=".pdf" required onchange="if(validateFileSize(this)){previewFile(this,'previewTeksPidato');simpanBase64(this,'teksPidatoBase64');}" class="input-field w-full px-4 py-3 rounded-xl bg-gray-700"><img id="previewTeksPidato" class="foto-preview mt-2 hidden" src="#" alt="Preview"></div>`;
        }
        html += generateAnggotaCard(1, 'Data Peserta', true, true);
    }
    else if (selectedLomba === 'lpa') {
        infoJumlah.textContent = '1 Putra';
        html += `<div class="mb-4"><label class="block text-sm font-semibold text-gray-200 mb-2">Jenis Kelamin</label><input type="text" value="Putra" readonly class="input-field w-full px-4 py-3 rounded-xl bg-gray-700"><input type="hidden" name="jenisKelamin" value="L"></div>`;
        html += generateAnggotaCard(1, 'Data Peserta', true, true);
    }
    container.innerHTML = html;
    // isi draft
    for (let [k,v] of Object.entries(formData)) {
        const f = document.querySelector(`[name="${k}"]`);
        if (f) { if (f.type==='checkbox') f.checked=v; else f.value=v; }
    }
}

function generateAnggotaCard(index, label, showGender, isRequired, showPeran=false, isOptional=false) {
    const req = isRequired ? 'required' : '';
    const mark = isRequired ? '<span class="text-red-400">*</span>' : '<span class="text-gray-400">(opsional)</span>';
    let peran = '';
    if (showPeran) peran = label.includes('Putri') ? `<div><label class="block text-sm font-semibold text-gray-200 mb-2">Peran ${mark}</label><select name="peran${index}" ${req} class="input-field w-full px-4 py-3 rounded-xl"><option value="">Pilih</option><option value="Makmum">Makmum</option></select></div>` : `<div><label class="block text-sm font-semibold text-gray-200 mb-2">Peran ${mark}</label><select name="peran${index}" ${req} class="input-field w-full px-4 py-3 rounded-xl"><option value="">Pilih</option><option value="Imam">Imam</option><option value="Makmum">Makmum</option></select></div>`;
    return `<div class="anggota-card rounded-xl p-4 md:p-6 ${isOptional?'opacity-75':''}"><div class="flex items-center justify-between mb-4"><h4 class="font-bold text-emerald-400">${label}</h4>${index>1&&!showPeran?`<button type="button" onclick="copyFromFirst(${index})" class="text-sm text-emerald-400"><i class="fas fa-copy mr-1"></i>Copy</button>`:''}</div><div class="grid md:grid-cols-2 gap-4"><div class="md:col-span-2"><label class="block text-sm font-semibold text-gray-200 mb-2">Nama Lengkap ${mark}</label><input type="text" name="nama${index}" ${req} class="input-field w-full px-4 py-3 rounded-xl" placeholder="Nama"></div><div><label class="block text-sm font-semibold text-gray-200 mb-2">NISN ${mark}</label><input type="text" name="nisn${index}" ${req} maxlength="10" class="input-field w-full px-4 py-3 rounded-xl" placeholder="10 digit"></div><div><label class="block text-sm font-semibold text-gray-200 mb-2">Tanggal Lahir ${mark}</label><input type="date" name="ttl${index}" ${req} class="input-field w-full px-4 py-3 rounded-xl"></div>${showGender?`<div><label class="block text-sm font-semibold text-gray-200 mb-2">Jenis Kelamin ${mark}</label><select name="jk${index}" ${req} class="input-field w-full px-4 py-3 rounded-xl"><option value="">Pilih</option><option value="L">Putra</option><option value="P">Putri</option></select></div>`:`<div><label class="block text-sm font-semibold text-gray-200 mb-2">Jenis Kelamin</label><input type="text" value="Putri" readonly class="input-field w-full px-4 py-3 rounded-xl bg-gray-700"><input type="hidden" name="jk${index}" value="P"></div>`}<div><label class="block text-sm font-semibold text-gray-200 mb-2">Kelas ${mark}</label><select name="kelas${index}" ${req} class="input-field w-full px-4 py-3 rounded-xl"><option value="">Pilih</option><option value="3">Kelas 3</option><option value="4">Kelas 4</option><option value="5">Kelas 5</option></select></div>${peran}<div class="md:col-span-2"><label class="block text-sm font-semibold text-gray-200 mb-2">Upload Foto ${mark}</label><input type="file" name="foto${index}" id="fotoInput${index}" ${req} accept="image/*" onchange="if(validateFileSize(this)){previewFile(this,'preview${index}');simpanBase64(this,'fotoData${index}');}" class="input-field w-full px-4 py-3 rounded-xl bg-gray-700"><img id="preview${index}" class="foto-preview mt-2 hidden" src="#" alt="Preview"></div></div></div>`;
}

function copyFromFirst(idx) {
    ['nama','ttl','jk','kelas'].forEach(f=>{ const s=document.querySelector(`[name="${f}1"]`), t=document.querySelector(`[name="${f}${idx}"]`); if(s&&t)t.value=s.value; });
    showNotification('Disalin','success');
}

// ============================================
// RESUME
// ============================================
function renderResume() {
    const lomba = LOMBA_DATA[selectedLomba];
    document.getElementById('resumeLomba').textContent = lomba.nama;
    document.getElementById('resumeKecamatan').textContent = formData.kecamatan||'-';
    document.getElementById('resumeSekolah').textContent = formData.namaSekolah||'-';
    document.getElementById('resumeNpsn').textContent = formData.npsn||'-';
    document.getElementById('resumeNamaPendamping').textContent = formData.namaPendamping||'-';
    document.getElementById('resumeHpPendamping').textContent = formData.hpPendamping||'-';

    let pesertaHtml = '', count=1;
    if (selectedLomba==='lccp'||selectedLomba==='lpsb') count=3; else if (selectedLomba==='lsqr') { count=11; for(let i=9;i<=11;i++) if(!formData[`nama${i}`]){ count=i-1; break; } }
    for(let i=1;i<=count;i++) {
        if(!formData[`nama${i}`]) continue;
        const jk = formData[`jk${i}`]==='L'?'Putra':'Putri';
        const peran = formData[`peran${i}`]?` (${formData[`peran${i}`]})`:'';
        const foto = formData[`fotoData${i}`]?`<img src="${formData[`fotoData${i}`]}" class="foto-preview mt-2">`:'';
        pesertaHtml += `<div class="flex justify-between py-2 border-b border-gray-600"><div><p class="font-semibold text-white">${formData[`nama${i}`]}${peran}</p><p class="text-sm text-gray-300">NISN: ${formData[`nisn${i}`]} | ${jk} | Kelas ${formData[`kelas${i}`]}</p>${foto}</div></div>`;
    }
    document.getElementById('resumePesertaContainer').innerHTML = pesertaHtml || '<p class="text-gray-400">Tidak ada data</p>';

    const berkasStatus = [];
    if (formData.raporBase64) berkasStatus.push('✅ Rapor');
    if (formData.skBase64) berkasStatus.push('✅ SK Juara');
    if (formData.aktaBase64) berkasStatus.push('✅ Akta/KK');
    if (selectedLomba==='ldc' && formData.teksPidatoBase64) berkasStatus.push('✅ Teks Pidato');
    document.getElementById('berkasStatus').innerHTML = berkasStatus.length ? berkasStatus.join(' · ') : '⚠️ Belum semua berkas diunggah';
}

// ============================================
// SUBMIT
// ============================================
async function handleFormSubmit(e) {
    e.preventDefault();
    if (!persetujuanCheckbox.checked) { showNotification('Setujui pernyataan','error'); return; }
    if (!confirm('Data sudah benar?')) return;
    document.getElementById('loadingOverlay').classList.remove('hidden');
    try {
        saveStepData(4);
        const id = generatePendaftaranID();
        formData.id = id; formData.timestamp = new Date().toISOString();
        const submission = prepareSubmissionData();
        const res = await fetch(CONFIG.GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'submitPendaftaran', data: submission })
        });
        const result = await res.json();
        if (result.success) {
            disableNavigationWarning();
            showSuccessModal(id);
        } else throw new Error(result.message);
    } catch(e) {
        showNotification('Error: '+e.message,'error');
    } finally {
        document.getElementById('loadingOverlay').classList.add('hidden');
    }
}

function prepareSubmissionData() {
    const lomba = LOMBA_DATA[selectedLomba];
    const peserta = []; let max = lomba.jumlahPeserta||1;
    if (selectedLomba==='lsqr') max=11; else if (selectedLomba==='lccp'||selectedLomba==='lpsb') max=3;
    for(let i=1;i<=max;i++) if(formData[`nama${i}`]) peserta.push({
        nama: formData[`nama${i}`], nisn: formData[`nisn${i}`], ttl: formData[`ttl${i}`], jk: formData[`jk${i}`],
        kelas: formData[`kelas${i}`], peran: formData[`peran${i}`]||null, maqro: formData[`maqro`]||null,
        statusWajib: i<=9?'WAJIB':'CADANGAN', fotoData: formData[`fotoData${i}`]||null
    });
    const ldcData = selectedLomba==='ldc' ? { temaPidato: formData.temaPidato, teksPidatoData: formData.teksPidatoBase64 } : {};
    return {
        id: formData.id, timestamp: formData.timestamp, jenisLomba: selectedLomba, namaLomba: lomba.nama,
        npsn: formData.npsn, namaSekolah: formData.namaSekolah, kecamatan: formData.kecamatan, alamatSekolah: formData.alamatSekolah,
        namaPendamping: formData.namaPendamping, hpPendamping: formData.hpPendamping,
        namaRegu: formData.namaRegu, namaGrup: formData.namaGrup, genderGrup: formData.genderGrup, maqro: formData.maqro,
        peserta, jumlahPeserta: peserta.length,
        berkas: { rapor: formData.raporBase64, sk: formData.skBase64, akta: formData.aktaBase64 },
        ldc: ldcData, status: 'MENUNGGU_VERIFIKASI'
    };
}

function showSuccessModal(id) {
    document.getElementById('successId').textContent = id;
    document.getElementById('buktiLomba').textContent = LOMBA_DATA[selectedLomba].kode;
    document.getElementById('buktiKecamatan').textContent = formData.kecamatan;
    document.getElementById('buktiSekolah').textContent = formData.namaSekolah;
    document.getElementById('qrcode').innerHTML = '';
    new QRCode(document.getElementById('qrcode'), { text: id, width:128, height:128, colorDark:'#065f46', colorLight:'#ffffff' });
    document.getElementById('successModal').classList.remove('hidden');
}
function printBukti() { /* ... seperti sebelumnya ... */ }
function shareWhatsApp() { /* ... */ }

// ============================================
// SCROLL TOP
// ============================================
function initScrollTop() {
    const btn = document.getElementById('btnScrollTop');
    if (!btn) return;
    window.addEventListener('scroll', () => btn.classList.toggle('hidden', window.scrollY<=300));
    btn.addEventListener('click', () => window.scrollTo({top:0,behavior:'smooth'}));
}

// ============================================
// INIT LOMBA SELECTION (DIPERBAIKI)
// ============================================
function initLombaSelection() {
    const lombaOptions = document.querySelectorAll('.lomba-option');
    const jenisLombaInput = document.getElementById('jenisLombaInput');
    if (!lombaOptions.length) return;
    
    lombaOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            lombaOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            selectedLomba = this.dataset.lomba;
            if (jenisLombaInput) jenisLombaInput.value = selectedLomba;
            saveDraft();
        });
    });
    
    // Preselect dari URL
    const urlParams = new URLSearchParams(window.location.search);
    const preselectedLomba = urlParams.get('lomba');
    if (preselectedLomba) {
        const option = document.querySelector(`.lomba-option[data-lomba="${preselectedLomba}"]`);
        if (option) option.click();
    }
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initLombaSelection();
    form.addEventListener('submit', handleFormSubmit);
    if (persetujuanCheckbox) {
        persetujuanCheckbox.addEventListener('change', ()=> {
            if (submitBtn) submitBtn.disabled = !persetujuanCheckbox.checked;
        });
    }
    if (loadDraft()) restoreFormFromDraft();
    form.addEventListener('input', ()=>{ saveStepData(currentStep); saveDraft(); });
    form.addEventListener('change', ()=>{ saveStepData(currentStep); saveDraft(); });
    initScrollTop();
});
