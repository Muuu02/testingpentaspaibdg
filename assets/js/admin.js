/**
 * ============================================================
 * ADMIN PANEL - PENTAS PAI KOTA BANDUNG 2026
 * ============================================================
 * Script untuk admin panel dengan autentikasi database-based
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
let loginAttempts = 0;
const MAX_LOGIN_ATTEMPTS = 5;

// Session state (in memory only)
let sessionToken = null;
let sessionExpiry = null;

// ============================================
// AUTHENTICATION
// ============================================

/**
 * Hash password menggunakan SHA-256 (client-side)
 * @param {string} password - Password plaintext
 * @returns {Promise<string>} - SHA-256 hash
 */
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate JWT token sederhana
 * @param {Object} payload - Data payload
 * @param {string} secret - Secret key
 * @returns {Promise<string>} - JWT token
 */
async function generateJWT(payload, secret) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    
    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(`${encodedHeader}.${encodedPayload}`)
    );
    
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
    return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

/**
 * Handle login form submission
 * @param {Event} e 
 */
async function handleLogin(e) {
    e.preventDefault();
    
    if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        showLoginError('Batas percobaan login tercapai. Coba lagi 1 jam lagi.');
        return;
    }
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');
    const loginAttemptsDiv = document.getElementById('loginAttempts');
    
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Memverifikasi...';
    
    try {
        // Hash password client-side
        const passwordHash = await hashPassword(password);
        
        // Verify with server
        const response = await fetch(CONFIG.GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'login',
                username: username,
                passwordHash: passwordHash
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Login berhasil
            currentUser = result.user;
            loginAttempts = 0;
            
            // Generate session (24 jam)
            const payload = {
                username: username,
                role: result.user.role,
                iat: Date.now(),
                exp: Date.now() + (24 * 60 * 60 * 1000)
            };
            
            sessionToken = await generateJWT(payload, 'pentaspai2026-secret');
            sessionExpiry = payload.exp;
            
            showMainApp();
        } else {
            // Login gagal
            loginAttempts++;
            const remaining = MAX_LOGIN_ATTEMPTS - loginAttempts;
            
            showLoginError(result.message || 'Username atau password salah');
            
            if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
                loginAttemptsDiv.classList.remove('hidden');
                document.getElementById('attemptsText').textContent = 'Batas percobaan tercapai. Coba lagi 1 jam lagi.';
            } else {
                loginAttemptsDiv.classList.remove('hidden');
                document.getElementById('attemptsText').textContent = `Percobaan tersisa: ${remaining}`;
            }
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showLoginError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Login';
    }
}

function showLoginError(message) {
    const loginError = document.getElementById('loginError');
    document.getElementById('loginErrorText').textContent = message;
    loginError.classList.remove('hidden');
}

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggleIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

function showMainApp() {
    document.getElementById('loginOverlay').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    // Set admin info
    document.getElementById('adminName').textContent = currentUser.nama_lengkap || currentUser.username;
    document.getElementById('adminRole').textContent = getRoleLabel(currentUser.role);
    
    // Show/hide super admin menu
    if (currentUser.role === 'super_admin') {
        document.getElementById('menuAkun').style.display = 'flex';
    }
    
    // Initialize dashboard
    initDashboard();
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
    currentUser = null;
    sessionToken = null;
    sessionExpiry = null;
    location.reload();
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('-translate-x-full');
}

// ============================================
// DASHBOARD
// ============================================

async function initDashboard() {
    updateClock();
    setInterval(updateClock, 1000);
    
    await loadData();
    updateStats();
    updateLombaChart();
    updateRecentActivity();
    renderTable();
    populateKecamatanFilter();
}

function updateClock() {
    const now = new Date();
    document.getElementById('currentTime').textContent = 
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

async function loadData() {
    try {
        const response = await fetch(CONFIG.GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'getAllData',
                token: sessionToken
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            allData = result.data || [];
            filteredData = [...allData];
        } else {
            loadDemoData();
        }
    } catch (error) {
        console.error('Error loading data:', error);
        loadDemoData();
    }
}

function loadDemoData() {
    allData = [
        { id: 'PPAI-ABC123-XYZ', namaPeserta: 'Ahmad Fauzi', namaSekolah: 'SD Negeri 1 Bandung', kecamatan: 'Coblong', jenisLomba: 'mtq', status: 'MENUNGGU_VERIFIKASI', timestamp: '2026-03-15T10:30:00' },
        { id: 'PPAI-DEF456-UVW', namaPeserta: 'Siti Aminah', namaSekolah: 'SD Negeri 2 Bandung', kecamatan: 'Sukajadi', jenisLomba: 'ldc', status: 'TERVERIFIKASI', timestamp: '2026-03-14T14:20:00' },
        { id: 'PPAI-GHI789-RST', namaPeserta: 'Muhammad Rizky', namaSekolah: 'SD Negeri 3 Bandung', kecamatan: 'Andir', jenisLomba: 'lccp', status: 'MENUNGGU_VERIFIKASI', timestamp: '2026-03-15T09:15:00' },
    ];
    filteredData = [...allData];
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
    }
}

function updateLombaChart() {
    const lombaCount = {};
    allData.forEach(d => {
        lombaCount[d.jenisLomba] = (lombaCount[d.jenisLomba] || 0) + 1;
    });
    
    const lombaNames = {
        lccp: 'LCC-PAI', ldc: 'LDC', mtq: 'MTQ', mhq: 'MHQ',
        lki: 'LKI', lpsb: 'LPSB', lsqr: 'LSQR', lpa: 'LPA'
    };
    
    const container = document.getElementById('lombaChart');
    const total = allData.length || 1;
    
    container.innerHTML = Object.entries(lombaCount).map(([lomba, count]) => {
        const percentage = (count / total * 100).toFixed(1);
        return `
            <div class="flex items-center">
                <span class="w-16 md:w-20 text-xs md:text-sm font-medium">${lombaNames[lomba] || lomba}</span>
                <div class="flex-1 mx-2 md:mx-3">
                    <div class="h-3 md:h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div class="h-full bg-emerald-600 rounded-full" style="width: ${percentage}%"></div>
                    </div>
                </div>
                <span class="w-8 text-xs md:text-sm text-right">${count}</span>
            </div>
        `;
    }).join('') || '<p class="text-gray-500 text-center">Belum ada data</p>';
}

function updateRecentActivity() {
    const container = document.getElementById('recentActivity');
    const sorted = [...allData].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
    
    container.innerHTML = sorted.map(d => {
        const statusClass = d.status === 'TERVERIFIKASI' ? 'text-emerald-600' : 
                           d.status === 'DITOLAK' ? 'text-red-600' : 'text-amber-600';
        const statusIcon = d.status === 'TERVERIFIKASI' ? 'fa-check-circle' : 
                          d.status === 'DITOLAK' ? 'fa-times-circle' : 'fa-clock';
        
        return `
            <div class="flex items-center p-3 bg-gray-50 rounded-lg">
                <div class="w-8 h-8 md:w-10 md:h-10 bg-emerald-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <i class="fas fa-user text-emerald-600 text-sm md:text-base"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-900 text-sm truncate">${d.namaPeserta}</p>
                    <p class="text-xs text-gray-500">${d.jenisLomba.toUpperCase()} - ${d.kecamatan}</p>
                </div>
                <div class="text-right flex-shrink-0">
                    <i class="fas ${statusIcon} ${statusClass}"></i>
                    <p class="text-xs text-gray-400">${formatTanggalIndonesia(d.timestamp)}</p>
                </div>
            </div>
        `;
    }).join('') || '<p class="text-gray-500 text-center">Belum ada aktivitas</p>';
}

// ============================================
// TABLE & PAGINATION
// ============================================

function populateKecamatanFilter() {
    const kecamatans = [...new Set(allData.map(d => d.kecamatan))].sort();
    const select = document.getElementById('inputKecamatan');
    
    kecamatans.forEach(k => {
        const option = document.createElement('option');
        option.value = k;
        option.textContent = k;
        select.appendChild(option);
    });
}

function renderTable() {
    const tbody = document.getElementById('dataTableBody');
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredData.slice(start, end);
    
    const lombaNames = {
        lccp: 'LCC-PAI', ldc: 'LDC', mtq: 'MTQ', mhq: 'MHQ',
        lki: 'LKI', lpsb: 'LPSB', lsqr: 'LSQR', lpa: 'LPA'
    };
    
    const statusClasses = {
        'MENUNGGU_VERIFIKASI': 'status-menunggu',
        'TERVERIFIKASI': 'status-terverifikasi',
        'DITOLAK': 'status-ditolak'
    };
    
    const statusLabels = {
        'MENUNGGU_VERIFIKASI': 'Menunggu',
        'TERVERIFIKASI': 'Terverifikasi',
        'DITOLAK': 'Ditolak'
    };
    
    tbody.innerHTML = pageData.map(d => `
        <tr class="border-b hover:bg-emerald-50 transition">
            <td class="px-3 md:px-4 py-3 text-xs md:text-sm font-medium text-gray-900">${d.id}</td>
            <td class="px-3 md:px-4 py-3 text-xs md:text-sm">${d.namaPeserta}</td>
            <td class="px-3 md:px-4 py-3 text-xs md:text-sm hidden sm:table-cell">${d.namaSekolah}</td>
            <td class="px-3 md:px-4 py-3 text-xs md:text-sm">${lombaNames[d.jenisLomba] || d.jenisLomba}</td>
            <td class="px-3 md:px-4 py-3">
                <span class="status-badge ${statusClasses[d.status]}">${statusLabels[d.status]}</span>
            </td>
            <td class="px-3 md:px-4 py-3">
                <button onclick="showDetail('${d.id}')" class="text-emerald-600 hover:text-emerald-800 mr-2 touch-target" title="Detail">
                    <i class="fas fa-eye"></i>
                </button>
                ${currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'verifikator') && d.status === 'MENUNGGU_VERIFIKASI' ? `
                    <button onclick="verifyData('${d.id}', 'TERVERIFIKASI')" class="text-emerald-600 hover:text-emerald-800 mr-2 touch-target" title="Verifikasi">
                        <i class="fas fa-check"></i>
                    </button>
                    <button onclick="verifyData('${d.id}', 'DITOLAK')" class="text-red-600 hover:text-red-800 touch-target" title="Tolak">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('') || '<tr><td colspan="6" class="text-center py-8 text-gray-500">Tidak ada data</td></tr>';
    
    document.getElementById('showingCount').textContent = pageData.length;
    document.getElementById('totalCount').textContent = filteredData.length;
    document.getElementById('pageInfo').textContent = currentPage;
    
    document.getElementById('btnPrev').disabled = currentPage === 1;
    document.getElementById('btnNext').disabled = end >= filteredData.length;
}

function filterData() {
    const lomba = document.getElementById('filterLomba').value;
    const status = document.getElementById('filterStatus').value;
    
    filteredData = allData.filter(d => {
        return (!lomba || d.jenisLomba === lomba) &&
               (!status || d.status === status);
    });
    
    currentPage = 1;
    renderTable();
}

function searchData() {
    const query = document.getElementById('searchData').value.toLowerCase();
    
    filteredData = allData.filter(d => 
        d.namaPeserta.toLowerCase().includes(query) ||
        d.id.toLowerCase().includes(query)
    );
    
    currentPage = 1;
    renderTable();
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
}

function nextPage() {
    const maxPage = Math.ceil(filteredData.length / itemsPerPage);
    if (currentPage < maxPage) {
        currentPage++;
        renderTable();
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
    
    const statusLabels = {
        'MENUNGGU_VERIFIKASI': 'Menunggu Verifikasi',
        'TERVERIFIKASI': 'Terverifikasi',
        'DITOLAK': 'Ditolak'
    };
    
    const lombaNames = {
        lccp: 'LCC-PAI', ldc: 'LDC', mtq: 'MTQ', mhq: 'MHQ',
        lki: 'LKI', lpsb: 'LPSB', lsqr: 'LSQR', lpa: 'LPA'
    };
    
    content.innerHTML = `
        <div class="grid md:grid-cols-2 gap-4 md:gap-6">
            <div>
                <h4 class="font-bold text-emerald-700 mb-3 md:mb-4">Informasi Pendaftaran</h4>
                <div class="space-y-2 md:space-y-3">
                    <div class="flex justify-between border-b pb-2">
                        <span class="text-gray-600 text-sm">ID Pendaftaran</span>
                        <span class="font-medium text-gray-900 text-sm">${data.id}</span>
                    </div>
                    <div class="flex justify-between border-b pb-2">
                        <span class="text-gray-600 text-sm">Status</span>
                        <span class="font-medium text-gray-900 text-sm">${statusLabels[data.status]}</span>
                    </div>
                    <div class="flex justify-between border-b pb-2">
                        <span class="text-gray-600 text-sm">Tanggal Daftar</span>
                        <span class="font-medium text-gray-900 text-sm">${formatTanggalIndonesia(data.timestamp)}</span>
                    </div>
                    <div class="flex justify-between border-b pb-2">
                        <span class="text-gray-600 text-sm">Jenis Lomba</span>
                        <span class="font-medium text-gray-900 text-sm">${lombaNames[data.jenisLomba] || data.jenisLomba}</span>
                    </div>
                </div>
            </div>
            <div>
                <h4 class="font-bold text-emerald-700 mb-3 md:mb-4">Data Peserta</h4>
                <div class="space-y-2 md:space-y-3">
                    <div class="flex justify-between border-b pb-2">
                        <span class="text-gray-600 text-sm">Nama Peserta</span>
                        <span class="font-medium text-gray-900 text-sm">${data.namaPeserta}</span>
                    </div>
                    <div class="flex justify-between border-b pb-2">
                        <span class="text-gray-600 text-sm">Sekolah</span>
                        <span class="font-medium text-gray-900 text-sm">${data.namaSekolah}</span>
                    </div>
                    <div class="flex justify-between border-b pb-2">
                        <span class="text-gray-600 text-sm">Kecamatan</span>
                        <span class="font-medium text-gray-900 text-sm">${data.kecamatan}</span>
                    </div>
                </div>
            </div>
        </div>
        
        ${currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'verifikator') && data.status === 'MENUNGGU_VERIFIKASI' ? `
            <div class="mt-4 md:mt-6 flex gap-3 md:gap-4">
                <button onclick="verifyData('${data.id}', 'TERVERIFIKASI'); closeDetailModal();" 
                    class="flex-1 py-2 md:py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition touch-target text-sm">
                    <i class="fas fa-check mr-2"></i>Verifikasi
                </button>
                <button onclick="verifyData('${data.id}', 'DITOLAK'); closeDetailModal();" 
                    class="flex-1 py-2 md:py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition touch-target text-sm">
                    <i class="fas fa-times mr-2"></i>Tolak
                </button>
            </div>
        ` : ''}
    `;
    
    modal.classList.remove('hidden');
}

function closeDetailModal() {
    document.getElementById('detailModal').classList.add('hidden');
}

async function verifyData(id, status) {
    if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'verifikator')) {
        showNotification('Anda tidak memiliki akses untuk verifikasi', 'error');
        return;
    }
    
    const catatan = status === 'DITOLAK' ? prompt('Masukkan alasan penolakan:') : '';
    
    try {
        const response = await fetch(CONFIG.GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'updateStatus',
                token: sessionToken,
                id: id,
                status: status,
                catatan: catatan,
                verifiedBy: currentUser.username
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`Status berhasil diubah menjadi ${status}`, 'success');
            await loadData();
            updateStats();
            renderTable();
            updateLombaChart();
            updateRecentActivity();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        showNotification('Gagal mengubah status: ' + error.message, 'error');
    }
}

// ============================================
// NOMOR PESERTA
// ============================================

async function saveNomorPeserta() {
    if (!currentUser || currentUser.role === 'viewer') {
        showNotification('Anda tidak memiliki akses untuk mengubah nomor', 'error');
        return;
    }
    
    const kecamatan = document.getElementById('inputKecamatan').value;
    const lomba = document.getElementById('inputLomba').value;
    const nomor = document.getElementById('inputNomor').value;
    
    if (!kecamatan || !lomba || !nomor) {
        showNotification('Semua field wajib diisi', 'error');
        return;
    }
    
    try {
        const response = await fetch(CONFIG.GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'saveNomorPeserta',
                token: sessionToken,
                kecamatan: kecamatan,
                lomba: lomba,
                nomor: parseInt(nomor)
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Nomor peserta berhasil disimpan', 'success');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        showNotification('Gagal menyimpan nomor: ' + error.message, 'error');
    }
}

// ============================================
// EXPORT
// ============================================

function exportData(format) {
    const status = document.getElementById('exportStatus').value;
    const lomba = document.getElementById('exportLomba').value;
    
    let dataToExport = allData;
    
    if (status) dataToExport = dataToExport.filter(d => d.status === status);
    if (lomba) dataToExport = dataToExport.filter(d => d.jenisLomba === lomba);
    
    if (format === 'csv') {
        exportToCSV(dataToExport);
    }
}

function exportToCSV(data) {
    const headers = ['ID', 'Nama Peserta', 'Sekolah', 'Kecamatan', 'Jenis Lomba', 'Status', 'Tanggal Daftar'];
    const rows = data.map(d => [
        d.id, d.namaPeserta, d.namaSekolah, d.kecamatan, d.jenisLomba, d.status, d.timestamp
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    downloadFile(csv, 'pendaftaran_pentas_pai.csv', 'text/csv');
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
        dashboard: 'Dashboard',
        pendaftaran: 'Data Pendaftaran',
        verifikasi: 'Verifikasi',
        nomor: 'Nomor Peserta',
        export: 'Export Data',
        akun: 'Kelola Akun'
    };
    document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';
}

async function refreshData() {
    const icon = document.getElementById('refreshIcon');
    icon.classList.add('fa-spin');
    
    await loadData();
    updateStats();
    updateLombaChart();
    updateRecentActivity();
    renderTable();
    
    setTimeout(() => icon.classList.remove('fa-spin'), 500);
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
});
