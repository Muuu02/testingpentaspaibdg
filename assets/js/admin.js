/**
 * ============================================================
 * ADMIN PANEL - PENTAS PAI KOTA BANDUNG 2026
 * ============================================================
 * Script untuk admin panel dengan fitur lengkap
 * ============================================================
 */

// ============================================
// KONFIGURASI & STATE
// ============================================

let currentUser = null;
let currentPage = 1;
let itemsPerPage = 10;
let allData = [];
let filteredData = [];
let chartInstance = null;

// Data master
let kecamatanList = [];
let sekolahList = [];
let nomorUndianData = {};

// ============================================
// SESSION CHECK
// ============================================

(function checkSession() {
    const adminUser = sessionStorage.getItem('adminUser');
    const loginTime = sessionStorage.getItem('adminLoginTime');
    
    if (!adminUser || !loginTime) {
        window.location.href = 'login.html';
        return;
    }
    
    const elapsed = Date.now() - parseInt(loginTime);
    if (elapsed > 24 * 60 * 60 * 1000) {
        sessionStorage.clear();
        window.location.href = 'login.html';
        return;
    }
    
    try {
        currentUser = JSON.parse(adminUser);
    } catch (e) {
        window.location.href = 'login.html';
    }
})();

// ============================================
// INITIALIZATION
// ============================================

function showMainApp() {
    document.getElementById('mainApp').classList.remove('hidden');
    document.getElementById('adminName').textContent = currentUser.nama_lengkap || currentUser.username;
    document.getElementById('adminRole').textContent = getRoleLabel(currentUser.role);
    
    if (currentUser.role === 'super_admin') {
        document.getElementById('menuAkun').style.display = 'flex';
    }
    
    initDashboard();
    loadMasterData();
}

function getRoleLabel(role) {
    const labels = {
        'super_admin': 'Super Admin',
        'verifikator': 'Verifikator',
        'viewer': 'Viewer'
    };
    return labels[role] || role;
}

function logout() {
    sessionStorage.clear();
    window.location.href = 'login.html';
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('-translate-x-full');
}

// ============================================
// MASTER DATA
// ============================================

async function loadMasterData() {
    try {
        const response = await fetch(CONFIG.GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'getMasterData' })
        });
        const result = await response.json();
        
        if (result.success) {
            kecamatanList = result.kecamatan || [];
            sekolahList = result.sekolah || [];
            nomorUndianData = result.nomorUndian || {};
            
            populateKecamatanDropdowns();
            renderSekolahTable();
            renderNomorTable();
        }
    } catch (error) {
        console.error('Error loading master data:', error);
    }
}

function populateKecamatanDropdowns() {
    const selects = ['inputKecamatanNomor', 'inputKecamatanSekolah', 'filterKecamatan'];
    selects.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = '<option value="">Pilih Kecamatan</option>';
            kecamatanList.forEach(k => {
                select.innerHTML += `<option value="${k}">${k}</option>`;
            });
        }
    });
}

// ============================================
// DASHBOARD
// ============================================

async function initDashboard() {
    updateClock();
    setInterval(updateClock, 1000);
    await refreshData();
}

function updateClock() {
    const now = new Date();
    document.getElementById('currentTime').textContent = 
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

async function refreshData() {
    const icon = document.getElementById('refreshIcon');
    icon.classList.add('fa-spin');
    
    await loadPendaftaranData();
    updateStats();
    updateLombaChart();
    updateRecentActivity();
    renderTable();
    
    setTimeout(() => icon.classList.remove('fa-spin'), 500);
}

async function loadPendaftaranData() {
    try {
        const response = await fetch(CONFIG.GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'getAllData' })
        });
        const result = await response.json();
        
        if (result.success) {
            allData = result.data || [];
            filteredData = [...allData];
        } else {
            allData = [];
            filteredData = [];
        }
    } catch (error) {
        console.error('Error loading data:', error);
        allData = [];
        filteredData = [];
    }
}

function updateStats() {
    const total = allData.length;
    const menunggu = allData.filter(d => d.status === 'MENUNGGU_VERIFIKASI').length;
    const terverifikasi = allData.filter(d => d.status === 'TERVERIFIKASI').length;
    const ditolak = allData.filter(d => d.status === 'DITOLAK').length;
    
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statMenunggu').textContent = menunggu;
    document.getElementById('statTerverifikasi').textContent = terverifikasi;
    document.getElementById('statDitolak').textContent = ditolak;
    
    const badge = document.getElementById('badgeVerifikasi');
    if (menunggu > 0) {
        badge.textContent = menunggu;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function updateLombaChart() {
    const lombaCount = {
        lccp: 0, ldc: 0, mtq: 0, mhq: 0, lki: 0, lpsb: 0, lsqr: 0, lpa: 0
    };
    allData.forEach(d => { if (lombaCount[d.jenisLomba] !== undefined) lombaCount[d.jenisLomba]++; });
    
    const ctx = document.getElementById('lombaChart').getContext('2d');
    
    if (chartInstance) chartInstance.destroy();
    
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['LCCP', 'LDC', 'MTQ', 'MHQ', 'LKI', 'LPSB', 'LSQR', 'LPA'],
            datasets: [{
                label: 'Jumlah Pendaftar',
                data: Object.values(lombaCount),
                backgroundColor: '#10b981',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { labels: { color: '#f1f5f9' } }
            },
            scales: {
                y: { beginAtZero: true, ticks: { color: '#cbd5e1' }, grid: { color: '#334155' } },
                x: { ticks: { color: '#cbd5e1' }, grid: { display: false } }
            }
        }
    });
}

function updateRecentActivity() {
    const container = document.getElementById('recentActivity');
    const sorted = [...allData].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
    
    container.innerHTML = sorted.map(d => {
        const statusIcon = d.status === 'TERVERIFIKASI' ? 'fa-check-circle text-emerald-400' : 
                         d.status === 'DITOLAK' ? 'fa-times-circle text-red-400' : 'fa-clock text-amber-400';
        return `
            <div class="flex items-center p-3 rounded-lg" style="background-color: #0f172a;">
                <div class="w-8 h-8 bg-emerald-900/50 rounded-full flex items-center justify-center mr-3">
                    <i class="fas fa-user text-emerald-400"></i>
                </div>
                <div class="flex-1">
                    <p class="font-medium text-white text-sm">${d.namaPeserta}</p>
                    <p class="text-xs text-gray-400">${d.jenisLomba.toUpperCase()} - ${d.kecamatan}</p>
                </div>
                <div class="text-right">
                    <i class="fas ${statusIcon}"></i>
                    <p class="text-xs text-gray-400">${formatTanggalIndonesia(d.timestamp)}</p>
                </div>
            </div>
        `;
    }).join('') || '<p class="text-gray-400 text-center">Belum ada aktivitas</p>';
}

// ============================================
// TABLE & PAGINATION
// ============================================

function renderTable() {
    const tbody = document.getElementById('dataTableBody');
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredData.slice(start, end);
    
    const lombaNames = {
        lccp: 'LCC-PAI', ldc: 'LDC', mtq: 'MTQ', mhq: 'MHQ',
        lki: 'LKI', lpsb: 'LPSB', lsqr: 'LSQR', lpa: 'LPA'
    };
    
    tbody.innerHTML = pageData.map(d => `
        <tr>
            <td class="px-3 py-3 text-sm">${d.id}</td>
            <td class="px-3 py-3 text-sm">${d.namaPeserta}</td>
            <td class="px-3 py-3 text-sm hidden sm:table-cell">${d.namaSekolah}</td>
            <td class="px-3 py-3 text-sm">${lombaNames[d.jenisLomba] || d.jenisLomba}</td>
            <td class="px-3 py-3"><span class="status-badge ${getStatusClass(d.status)}">${getStatusLabel(d.status)}</span></td>
            <td class="px-3 py-3">
                <button onclick="showDetail('${d.id}')" class="text-emerald-400 hover:text-emerald-300 mr-2 touch-target">
                    <i class="fas fa-eye"></i>
                </button>
                ${canVerify() && d.status === 'MENUNGGU_VERIFIKASI' ? `
                    <button onclick="verifyData('${d.id}', 'TERVERIFIKASI')" class="text-emerald-400 hover:text-emerald-300 mr-2 touch-target">
                        <i class="fas fa-check"></i>
                    </button>
                    <button onclick="verifyData('${d.id}', 'DITOLAK')" class="text-red-400 hover:text-red-300 touch-target">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('') || '<tr><td colspan="6" class="text-center py-8 text-gray-400">Tidak ada data</td></tr>';
    
    document.getElementById('showingCount').textContent = pageData.length;
    document.getElementById('totalCount').textContent = filteredData.length;
    document.getElementById('pageInfo').textContent = currentPage;
    document.getElementById('btnPrev').disabled = currentPage === 1;
    document.getElementById('btnNext').disabled = end >= filteredData.length;
}

function getStatusClass(status) {
    return status === 'TERVERIFIKASI' ? 'status-terverifikasi' : 
           status === 'DITOLAK' ? 'status-ditolak' : 'status-menunggu';
}

function getStatusLabel(status) {
    return status === 'TERVERIFIKASI' ? 'Terverifikasi' : 
           status === 'DITOLAK' ? 'Ditolak' : 'Menunggu';
}

function canVerify() {
    return currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'verifikator');
}

function filterData() {
    const lomba = document.getElementById('filterLomba').value;
    const status = document.getElementById('filterStatus').value;
    
    filteredData = allData.filter(d => 
        (!lomba || d.jenisLomba === lomba) && (!status || d.status === status)
    );
    currentPage = 1;
    renderTable();
}

function searchData() {
    const query = document.getElementById('searchData').value.toLowerCase();
    filteredData = allData.filter(d => 
        d.namaPeserta.toLowerCase().includes(query) || d.id.toLowerCase().includes(query)
    );
    currentPage = 1;
    renderTable();
}

function prevPage() {
    if (currentPage > 1) { currentPage--; renderTable(); }
}

function nextPage() {
    if (currentPage < Math.ceil(filteredData.length / itemsPerPage)) {
        currentPage++; renderTable();
    }
}

// ============================================
// DETAIL & VERIFICATION
// ============================================

function showDetail(id) {
    const data = allData.find(d => d.id === id);
    if (!data) return;
    
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('detailContent');
    
    content.innerHTML = `
        <div class="grid md:grid-cols-2 gap-4">
            <div>
                <h4 class="font-bold text-emerald-400 mb-3">Informasi Pendaftaran</h4>
                <div class="space-y-2">
                    <div class="flex justify-between border-b border-gray-600 pb-2">
                        <span class="text-gray-400">ID</span>
                        <span class="text-white">${data.id}</span>
                    </div>
                    <div class="flex justify-between border-b border-gray-600 pb-2">
                        <span class="text-gray-400">Status</span>
                        <span class="text-white">${getStatusLabel(data.status)}</span>
                    </div>
                    <div class="flex justify-between border-b border-gray-600 pb-2">
                        <span class="text-gray-400">Tanggal</span>
                        <span class="text-white">${formatTanggalIndonesia(data.timestamp)}</span>
                    </div>
                    <div class="flex justify-between border-b border-gray-600 pb-2">
                        <span class="text-gray-400">Lomba</span>
                        <span class="text-white">${data.jenisLomba}</span>
                    </div>
                </div>
            </div>
            <div>
                <h4 class="font-bold text-emerald-400 mb-3">Data Peserta</h4>
                <div class="space-y-2">
                    <div class="flex justify-between border-b border-gray-600 pb-2">
                        <span class="text-gray-400">Nama</span>
                        <span class="text-white">${data.namaPeserta}</span>
                    </div>
                    <div class="flex justify-between border-b border-gray-600 pb-2">
                        <span class="text-gray-400">Sekolah</span>
                        <span class="text-white">${data.namaSekolah}</span>
                    </div>
                    <div class="flex justify-between border-b border-gray-600 pb-2">
                        <span class="text-gray-400">Kecamatan</span>
                        <span class="text-white">${data.kecamatan}</span>
                    </div>
                </div>
            </div>
        </div>
        ${canVerify() && data.status === 'MENUNGGU_VERIFIKASI' ? `
            <div class="mt-6 flex gap-3">
                <button onclick="verifyData('${data.id}', 'TERVERIFIKASI'); closeDetailModal();" 
                    class="flex-1 py-2 bg-emerald-700 text-white rounded-lg">Verifikasi</button>
                <button onclick="verifyData('${data.id}', 'DITOLAK'); closeDetailModal();" 
                    class="flex-1 py-2 bg-red-700 text-white rounded-lg">Tolak</button>
            </div>
        ` : ''}
    `;
    
    modal.classList.remove('hidden');
}

function closeDetailModal() {
    document.getElementById('detailModal').classList.add('hidden');
}

async function verifyData(id, status) {
    if (!canVerify()) {
        showNotification('Anda tidak memiliki akses', 'error');
        return;
    }
    
    const catatan = status === 'DITOLAK' ? prompt('Masukkan alasan penolakan:') : '';
    
    try {
        const response = await fetch(CONFIG.GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'updateStatus',
                id: id, status: status, catatan: catatan,
                verifiedBy: currentUser.username
            })
        });
        const result = await response.json();
        
        if (result.success) {
            showNotification(`Status berhasil diubah`, 'success');
            refreshData();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        showNotification('Gagal: ' + error.message, 'error');
    }
}

// ============================================
// NOMOR UNDIAN
// ============================================

function renderNomorTable() {
    const tbody = document.getElementById('nomorTableBody');
    const lombaCodes = ['lccp', 'ldc', 'mtq', 'mhq', 'lki', 'lpsb', 'lsqr', 'lpa'];
    
    tbody.innerHTML = kecamatanList.map(kec => `
        <tr>
            <td class="px-3 py-2">${kec}</td>
            ${lombaCodes.map(lomba => {
                const nomor = nomorUndianData[kec]?.[lomba] || '-';
                return `<td class="px-3 py-2 text-center">${nomor}</td>`;
            }).join('')}
        </tr>
    `).join('');
}

async function saveNomorUndian() {
    const kecamatan = document.getElementById('inputKecamatanNomor').value;
    const lomba = document.getElementById('inputLombaNomor').value;
    const nomor = document.getElementById('inputNomor').value;
    
    if (!kecamatan || !lomba || !nomor) {
        showNotification('Semua field wajib diisi', 'error');
        return;
    }
    
    try {
        const response = await fetch(CONFIG.GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'saveNomorUndian',
                kecamatan, lomba, nomor: parseInt(nomor)
            })
        });
        const result = await response.json();
        
        if (result.success) {
            showNotification('Nomor undian disimpan', 'success');
            loadMasterData();
        }
    } catch (error) {
        showNotification('Gagal menyimpan', 'error');
    }
}

async function publishNomorUndian() {
    try {
        await fetch(CONFIG.GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'publishNomorUndian' })
        });
        showNotification('Nomor undian dipublikasikan', 'success');
    } catch (error) {
        showNotification('Gagal publish', 'error');
    }
}

// ============================================
// DATA SEKOLAH
// ============================================

function renderSekolahTable() {
    const tbody = document.getElementById('sekolahTableBody');
    tbody.innerHTML = sekolahList.map(s => `
        <tr>
            <td class="px-3 py-2">${s.npsn}</td>
            <td class="px-3 py-2">${s.nama_sekolah}</td>
            <td class="px-3 py-2">${s.kecamatan}</td>
            <td class="px-3 py-2">${s.alamat_lengkap || '-'}</td>
            <td class="px-3 py-2">
                <button onclick="editSekolah('${s.npsn}')" class="text-emerald-400 mr-2"><i class="fas fa-edit"></i></button>
                <button onclick="deleteSekolah('${s.npsn}')" class="text-red-400"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function saveSekolah() {
    const npsn = document.getElementById('inputNPSN').value;
    const nama = document.getElementById('inputNamaSekolah').value;
    const kecamatan = document.getElementById('inputKecamatanSekolah').value;
    const alamat = document.getElementById('inputAlamatSekolah').value;
    
    if (!npsn || !nama || !kecamatan) {
        showNotification('NPSN, Nama, Kecamatan wajib', 'error');
        return;
    }
    
    try {
        const response = await fetch(CONFIG.GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'saveSekolah',
                npsn, nama_sekolah: nama, kecamatan, alamat_lengkap: alamat
            })
        });
        const result = await response.json();
        if (result.success) {
            showNotification('Data sekolah disimpan', 'success');
            loadMasterData();
        }
    } catch (error) {
        showNotification('Gagal menyimpan', 'error');
    }
}

function editSekolah(npsn) {
    const sekolah = sekolahList.find(s => s.npsn === npsn);
    if (sekolah) {
        document.getElementById('inputNPSN').value = sekolah.npsn;
        document.getElementById('inputNamaSekolah').value = sekolah.nama_sekolah;
        document.getElementById('inputKecamatanSekolah').value = sekolah.kecamatan;
        document.getElementById('inputAlamatSekolah').value = sekolah.alamat_lengkap || '';
    }
}

async function deleteSekolah(npsn) {
    if (!confirm('Yakin hapus sekolah ini?')) return;
    try {
        await fetch(CONFIG.GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'deleteSekolah', npsn })
        });
        showNotification('Sekolah dihapus', 'success');
        loadMasterData();
    } catch (error) {
        showNotification('Gagal menghapus', 'error');
    }
}

// ============================================
// PENGATURAN
// ============================================

async function toggleFormPendaftaran() {
    const toggle = document.getElementById('toggleFormSwitch');
    const isActive = toggle.classList.contains('active');
    
    try {
        const response = await fetch(CONFIG.GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'toggleForm',
                status: !isActive
            })
        });
        const result = await response.json();
        if (result.success) {
            toggle.classList.toggle('active');
            showNotification(`Form ${!isActive ? 'diaktifkan' : 'dinonaktifkan'}`, 'success');
        }
    } catch (error) {
        showNotification('Gagal mengubah status', 'error');
    }
}

async function saveWaAdmin() {
    const wa = document.getElementById('inputWaAdmin').value;
    try {
        await fetch(CONFIG.GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'saveConfig', setting: 'whatsapp_admin', value: wa })
        });
        showNotification('Nomor WA disimpan', 'success');
    } catch (error) {
        showNotification('Gagal menyimpan', 'error');
    }
}

// ============================================
// EXPORT
// ============================================

function exportData() {
    const status = document.getElementById('exportStatus').value;
    const lomba = document.getElementById('exportLomba').value;
    
    let data = allData;
    if (status) data = data.filter(d => d.status === status);
    if (lomba) data = data.filter(d => d.jenisLomba === lomba);
    
    const headers = ['ID', 'Nama', 'Sekolah', 'Kecamatan', 'Lomba', 'Status', 'Tanggal'];
    const rows = data.map(d => [d.id, d.namaPeserta, d.namaSekolah, d.kecamatan, d.jenisLomba, d.status, d.timestamp]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pendaftaran_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
}

// ============================================
// AKUN ADMIN
// ============================================

async function tambahAkun() {
    const username = document.getElementById('newUsername').value;
    const nama = document.getElementById('newNama').value;
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newRole').value;
    
    if (!username || !nama || !password || !role) {
        showNotification('Semua field wajib', 'error');
        return;
    }
    
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    try {
        const response = await fetch(CONFIG.GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'addAdmin',
                username, passwordHash, nama_lengkap: nama, role
            })
        });
        const result = await response.json();
        if (result.success) {
            showNotification('Akun ditambahkan', 'success');
            document.getElementById('newUsername').value = '';
            document.getElementById('newNama').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('newRole').value = '';
        }
    } catch (error) {
        showNotification('Gagal menambah akun', 'error');
    }
}
// ============================================
// KELOLA AKUN - LENGKAP
// ============================================

async function loadAkunList() {
    try {
        const response = await fetch(CONFIG.GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'getAdminList' })
        });
        const result = await response.json();
        if (result.success) {
            renderAkunTable(result.data);
        }
    } catch (error) {
        console.error('Gagal load akun:', error);
    }
}

function renderAkunTable(akunList) {
    const tbody = document.getElementById('akunTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = akunList.map(a => `
        <tr>
            <td class="px-3 py-2">${a.username}</td>
            <td class="px-3 py-2">${a.nama_lengkap}</td>
            <td class="px-3 py-2">${a.role}</td>
            <td class="px-3 py-2">
                <span class="status-badge ${a.status === 'aktif' ? 'status-terverifikasi' : 'status-ditolak'}">${a.status}</span>
            </td>
            <td class="px-3 py-2">
                ${a.username !== 'admin' ? `
                    <button onclick="toggleStatusAkun('${a.username}', '${a.status}')" class="text-amber-400 mr-2" title="Toggle Status">
                        <i class="fas ${a.status === 'aktif' ? 'fa-ban' : 'fa-check'}"></i>
                    </button>
                    <button onclick="resetPasswordAdmin('${a.username}')" class="text-blue-400 mr-2" title="Reset Password">
                        <i class="fas fa-key"></i>
                    </button>
                    <button onclick="hapusAkun('${a.username}')" class="text-red-400" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : '<span class="text-gray-500 text-xs">Default</span>'}
            </td>
        </tr>
    `).join('');
}

async function toggleStatusAkun(username, currentStatus) {
    const newStatus = currentStatus === 'aktif' ? 'nonaktif' : 'aktif';
    if (!confirm(`Ubah status ${username} menjadi ${newStatus}?`)) return;
    
    try {
        const response = await fetch(CONFIG.GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'updateAdminStatus', username, status: newStatus })
        });
        const result = await response.json();
        if (result.success) {
            showNotification(`Status ${username} diubah`, 'success');
            loadAkunList();
        }
    } catch (error) {
        showNotification('Gagal mengubah status', 'error');
    }
}

async function resetPasswordAdmin(username) {
    const newPass = prompt(`Masukkan password baru untuk ${username}:`);
    if (!newPass) return;
    
    const encoder = new TextEncoder();
    const data = encoder.encode(newPass);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    try {
        const response = await fetch(CONFIG.GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'resetAdminPassword', username, passwordHash })
        });
        const result = await response.json();
        if (result.success) {
            showNotification(`Password ${username} direset`, 'success');
        }
    } catch (error) {
        showNotification('Gagal reset password', 'error');
    }
}

async function hapusAkun(username) {
    if (!confirm(`Yakin hapus akun ${username}?`)) return;
    
    try {
        const response = await fetch(CONFIG.GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'deleteAdmin', username })
        });
        const result = await response.json();
        if (result.success) {
            showNotification(`Akun ${username} dihapus`, 'success');
            loadAkunList();
        }
    } catch (error) {
        showNotification('Gagal menghapus akun', 'error');
    }
}
// ============================================
// NAVIGATION
// ============================================

function showSection(section) {
    document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
    document.querySelector(`a[href="#${section}"]`)?.classList.add('active');
    
    document.querySelectorAll('.section-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`${section}Section`).classList.remove('hidden');
    
    const titles = {
        dashboard: 'Dashboard', pendaftaran: 'Data Pendaftaran', verifikasi: 'Verifikasi',
        nomor: 'Nomor Undian', sekolah: 'Data Sekolah', pengaturan: 'Pengaturan',
        export: 'Export Data', akun: 'Kelola Akun'
    };
    document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';
    
    if (section === 'verifikasi') {
        renderVerifikasiList();
        if (section === 'akun') {
        loadAkunList();
    }
}

function renderVerifikasiList() {
    const container = document.getElementById('verifikasiList');
    const menunggu = allData.filter(d => d.status === 'MENUNGGU_VERIFIKASI');
    
    container.innerHTML = menunggu.map(d => `
        <div class="flex items-center justify-between p-4 rounded-lg" style="background-color: #0f172a;">
            <div>
                <p class="font-semibold text-white">${d.namaPeserta} - ${d.jenisLomba}</p>
                <p class="text-sm text-gray-400">${d.namaSekolah}, ${d.kecamatan}</p>
            </div>
            <div class="flex gap-2">
                <button onclick="verifyData('${d.id}', 'TERVERIFIKASI')" class="px-3 py-2 bg-emerald-700 text-white rounded-lg">Verifikasi</button>
                <button onclick="verifyData('${d.id}', 'DITOLAK')" class="px-3 py-2 bg-red-700 text-white rounded-lg">Tolak</button>
            </div>
        </div>
    `).join('') || '<p class="text-gray-400 text-center">Tidak ada pendaftaran menunggu verifikasi</p>';
}

// ============================================
// START APP
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    if (currentUser) {
        showMainApp();
    } else {
        window.location.href = 'login.html';
    }
});
