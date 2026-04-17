/**
 * ============================================================
 * ADMIN PANEL - PENTAS PAI KOTA BANDUNG 2026
 * ============================================================
 * Fitur lengkap: Dashboard, Pendaftaran, Nomor Undian, Sekolah,
 * Pengaturan, Export, Kelola Akun, Mobile Sidebar.
 * ============================================================
 */

// ============================================
// STATE & KONFIGURASI
// ============================================
let currentUser = null;
let currentPage = 1;
const itemsPerPage = 10;
let allData = [];
let filteredData = [];
let chartInstance = null;
let kecamatanList = [];
let sekolahList = [];
let nomorUndianData = {};

// ============================================
// SESSION CHECK
// ============================================
(function checkSession() {
    const adminUser = sessionStorage.getItem('adminUser');
    const loginTime = sessionStorage.getItem('adminLoginTime');
    if (!adminUser || !loginTime) { window.location.href = 'login.html'; return; }
    if (Date.now() - parseInt(loginTime) > 24*60*60*1000) { sessionStorage.clear(); window.location.href = 'login.html'; return; }
    try { currentUser = JSON.parse(adminUser); } catch (e) { window.location.href = 'login.html'; }
})();

// ============================================
// INIT
// ============================================
function showMainApp() {
    document.getElementById('adminName').textContent = currentUser.nama_lengkap || currentUser.username;
    document.getElementById('adminRole').textContent = getRoleLabel(currentUser.role);
    if (currentUser.role === 'super_admin') document.getElementById('menuAkun').style.display = 'flex';
    initDashboard();
    loadMasterData();
}

function getRoleLabel(role) {
    return { super_admin: 'Super Admin', verifikator: 'Verifikator', viewer: 'Viewer' }[role] || role;
}

function logout() { sessionStorage.clear(); window.location.href = 'login.html'; }

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }

// ============================================
// MASTER DATA
// ============================================
async function loadMasterData() {
    try {
        const res = await fetch(CONFIG.GAS_WEB_APP_URL, {
            method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'getMasterData' })
        });
        const data = await res.json();
        if (data.success) {
            kecamatanList = data.kecamatan || [];
            sekolahList = data.sekolah || [];
            nomorUndianData = data.nomorUndian || {};
            populateKecamatanDropdowns();
            renderSekolahTable();
            renderNomorTable();
        }
    } catch (e) { console.error(e); }
}

function populateKecamatanDropdowns() {
    ['inputKecamatanNomor','inputKecamatanSekolah'].forEach(id => {
        const s = document.getElementById(id); if (!s) return;
        s.innerHTML = '<option value="">Pilih Kecamatan</option>';
        kecamatanList.forEach(k => s.innerHTML += `<option value="${k}">${k}</option>`);
    });
}

// ============================================
// DASHBOARD
// ============================================
function initDashboard() {
    updateClock(); setInterval(updateClock, 1000);
    refreshData();
}
function updateClock() { document.getElementById('currentTime').textContent = new Date().toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' }); }

async function refreshData() {
    document.getElementById('refreshIcon').classList.add('fa-spin');
    await loadPendaftaranData();
    updateStats(); updateLombaChart(); updateRecentActivity(); renderTable();
    setTimeout(() => document.getElementById('refreshIcon').classList.remove('fa-spin'), 500);
}

async function loadPendaftaranData() {
    try {
        const res = await fetch(CONFIG.GAS_WEB_APP_URL, {
            method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'getAllData' })
        });
        const data = await res.json();
        allData = data.success ? data.data || [] : [];
        filteredData = [...allData];
    } catch (e) { allData = []; filteredData = []; }
}

function updateStats() {
    document.getElementById('statTotal').textContent = allData.length;
    document.getElementById('statMenunggu').textContent = allData.filter(d=>d.status==='MENUNGGU_VERIFIKASI').length;
    document.getElementById('statTerverifikasi').textContent = allData.filter(d=>d.status==='TERVERIFIKASI').length;
    document.getElementById('statDitolak').textContent = allData.filter(d=>d.status==='DITOLAK').length;
}

function updateLombaChart() {
    const counts = { lccp:0, ldc:0, mtq:0, mhq:0, lki:0, lpsb:0, lsqr:0, lpa:0 };
    allData.forEach(d => { if (counts[d.jenisLomba] !== undefined) counts[d.jenisLomba]++; });
    const ctx = document.getElementById('lombaChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
        type: 'bar', data: { labels: ['LCCP','LDC','MTQ','MHQ','LKI','LPSB','LSQR','LPA'], datasets: [{ label:'Jumlah', data:Object.values(counts), backgroundColor:'#10b981' }] },
        options: { responsive:true, plugins:{ legend:{ labels:{ color:'#f1f5f9' } } }, scales:{ y:{ ticks:{ color:'#cbd5e1' }, grid:{ color:'#334155' } }, x:{ ticks:{ color:'#cbd5e1' } } } }
    });
}

function updateRecentActivity() {
    const container = document.getElementById('recentActivity');
    const sorted = [...allData].sort((a,b)=> new Date(b.timestamp) - new Date(a.timestamp)).slice(0,10);
    container.innerHTML = sorted.map(d => `
        <div class="flex items-center p-3 rounded-lg bg-gray-900">
            <div class="w-8 h-8 bg-emerald-900/50 rounded-full flex items-center justify-center mr-3"><i class="fas fa-user text-emerald-400"></i></div>
            <div class="flex-1"><p class="text-white text-sm">${d.namaPeserta}</p><p class="text-xs text-gray-400">${d.jenisLomba} - ${d.kecamatan}</p></div>
            <i class="fas ${d.status==='TERVERIFIKASI'?'fa-check-circle text-emerald-400':d.status==='DITOLAK'?'fa-times-circle text-red-400':'fa-clock text-amber-400'}"></i>
        </div>
    `).join('') || '<p class="text-gray-400 text-center">Belum ada aktivitas</p>';
}

// ============================================
// TABLE
// ============================================
function renderTable() {
    const tbody = document.getElementById('dataTableBody');
    const page = filteredData.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage);
    const lombaNames = { lccp:'LCC-PAI', ldc:'LDC', mtq:'MTQ', mhq:'MHQ', lki:'LKI', lpsb:'LPSB', lsqr:'LSQR', lpa:'LPA' };
    tbody.innerHTML = page.map(d => `
        <tr><td>${d.id}</td><td>${d.namaPeserta}</td><td class="hidden sm:table-cell">${d.namaSekolah}</td><td>${lombaNames[d.jenisLomba]||d.jenisLomba}</td>
        <td><span class="status-badge ${d.status==='TERVERIFIKASI'?'status-terverifikasi':d.status==='DITOLAK'?'status-ditolak':'status-menunggu'}">${d.status==='TERVERIFIKASI'?'Terverifikasi':d.status==='DITOLAK'?'Ditolak':'Menunggu'}</span></td>
        <td><button onclick="showDetail('${d.id}')" class="text-emerald-400 mr-2"><i class="fas fa-eye"></i></button>${canVerify()&&d.status==='MENUNGGU_VERIFIKASI'?`<button onclick="verifyData('${d.id}','TERVERIFIKASI')" class="text-emerald-400 mr-2"><i class="fas fa-check"></i></button><button onclick="verifyData('${d.id}','DITOLAK')" class="text-red-400"><i class="fas fa-times"></i></button>`:''}</td></tr>
    `).join('') || '<tr><td colspan="6" class="text-center py-8 text-gray-400">Tidak ada data</td></tr>';
    document.getElementById('showingCount').textContent = page.length;
    document.getElementById('totalCount').textContent = filteredData.length;
    document.getElementById('pageInfo').textContent = currentPage;
    document.getElementById('btnPrev').disabled = currentPage === 1;
    document.getElementById('btnNext').disabled = currentPage * itemsPerPage >= filteredData.length;
}
function canVerify() { return currentUser && (currentUser.role==='super_admin'||currentUser.role==='verifikator'); }
function filterData() {
    const l = document.getElementById('filterLomba').value, s = document.getElementById('filterStatus').value;
    filteredData = allData.filter(d => (!l||d.jenisLomba===l) && (!s||d.status===s));
    currentPage = 1; renderTable();
}
function searchData() {
    const q = document.getElementById('searchData').value.toLowerCase();
    filteredData = allData.filter(d => d.namaPeserta.toLowerCase().includes(q) || d.id.toLowerCase().includes(q));
    currentPage = 1; renderTable();
}
function prevPage() { if (currentPage>1) { currentPage--; renderTable(); } }
function nextPage() { if (currentPage*itemsPerPage < filteredData.length) { currentPage++; renderTable(); } }

// ============================================
// DETAIL & VERIFIKASI
// ============================================
function showDetail(id) {
    const d = allData.find(d=>d.id===id); if(!d) return;
    let peserta = [], berkas = null;
    try { const p = JSON.parse(d.data_peserta_json||'{}'); peserta = p.peserta||[]; berkas = p.berkas||null; } catch(e){}
    const pesertaHtml = peserta.map(p=>`
        <div class="flex items-start gap-3 border-b border-gray-600 pb-3 mb-3">
            ${p.fotoData?`<img src="${p.fotoData}" class="w-16 h-16 object-cover rounded border border-emerald-500">`:'<div class="w-16 h-16 bg-gray-700 rounded flex items-center justify-center"><i class="fas fa-user text-2xl text-gray-400"></i></div>'}
            <div><p class="font-semibold text-white">${p.nama} (${p.jk==='L'?'L':'P'})</p><p class="text-sm text-gray-300">NISN: ${p.nisn} | Kelas: ${p.kelas}</p>${p.peran?`<p class="text-sm text-amber-400">Peran: ${p.peran}</p>`:''}</div>
        </div>
    `).join('');
    const berkasHtml = berkas ? `
        <div class="mt-4 p-4 bg-gray-900 rounded"><h4 class="text-emerald-400 mb-2">Berkas</h4>
            ${berkas.rapor?`<a href="${berkas.rapor}" target="_blank" class="block text-blue-400"><i class="fas fa-file-alt mr-2"></i>Rapor</a>`:''}
            ${berkas.sk?`<a href="${berkas.sk}" target="_blank" class="block text-blue-400"><i class="fas fa-trophy mr-2"></i>SK Juara</a>`:''}
            ${berkas.akta?`<a href="${berkas.akta}" target="_blank" class="block text-blue-400"><i class="fas fa-id-card mr-2"></i>Akta/KK</a>`:''}
        </div>` : '';
    document.getElementById('detailContent').innerHTML = `
        <div class="grid md:grid-cols-2 gap-4">
            <div><h4 class="text-emerald-400 mb-2">Info</h4><div class="space-y-1 text-sm"><div class="flex justify-between"><span class="text-gray-400">ID</span><span class="text-white">${d.id}</span></div><div class="flex justify-between"><span class="text-gray-400">Status</span><span class="text-white">${d.status}</span></div><div class="flex justify-between"><span class="text-gray-400">Tanggal</span><span class="text-white">${formatTanggalIndonesia(d.timestamp)}</span></div><div class="flex justify-between"><span class="text-gray-400">Lomba</span><span class="text-white">${d.jenisLomba}</span></div></div></div>
            <div><h4 class="text-emerald-400 mb-2">Sekolah</h4><div class="space-y-1 text-sm"><div class="flex justify-between"><span class="text-gray-400">Sekolah</span><span class="text-white">${d.namaSekolah}</span></div><div class="flex justify-between"><span class="text-gray-400">NPSN</span><span class="text-white">${d.npsn}</span></div><div class="flex justify-between"><span class="text-gray-400">Kecamatan</span><span class="text-white">${d.kecamatan}</span></div><div class="flex justify-between"><span class="text-gray-400">Pendamping</span><span class="text-white">${d.namaPendamping} (${d.hpPendamping})</span></div></div></div>
        </div>
        <div class="mt-4"><h4 class="text-emerald-400 mb-2">Peserta (${peserta.length})</h4><div class="max-h-60 overflow-y-auto">${pesertaHtml||'<p class="text-gray-400">Tidak ada data</p>'}</div></div>
        ${berkasHtml}
        ${canVerify()&&d.status==='MENUNGGU_VERIFIKASI'?`<div class="mt-6 flex gap-3"><button onclick="verifyData('${d.id}','TERVERIFIKASI');closeDetailModal()" class="flex-1 py-2 bg-emerald-700 text-white rounded">Verifikasi</button><button onclick="verifyData('${d.id}','DITOLAK');closeDetailModal()" class="flex-1 py-2 bg-red-700 text-white rounded">Tolak</button></div>`:''}
    `;
    document.getElementById('detailModal').classList.remove('hidden');
}
function closeDetailModal() { document.getElementById('detailModal').classList.add('hidden'); }

async function verifyData(id, status) {
    if (!canVerify()) return showNotification('Tidak ada akses','error');
    const catatan = status==='DITOLAK' ? prompt('Alasan penolakan:') : '';
    try {
        const res = await fetch(CONFIG.GAS_WEB_APP_URL, {
            method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'},
            body:JSON.stringify({ action:'updateStatus', id, status, catatan, verifiedBy:currentUser.username })
        });
        const data = await res.json();
        if (data.success) { showNotification('Status diperbarui','success'); refreshData(); }
        else throw new Error(data.message);
    } catch(e) { showNotification('Gagal: '+e.message,'error'); }
}

// ============================================
// NOMOR UNDIAN
// ============================================
function renderNomorTable() {
    const tbody = document.getElementById('nomorTableBody');
    const cols = ['lccp','ldc','mtq','mhq','lki','lpsb','lsqr','lpa'];
    tbody.innerHTML = kecamatanList.map(k => `<tr><td>${k}</td>${cols.map(c=>`<td class="text-center">${nomorUndianData[k]?.[c]||'-'}</td>`).join('')}</tr>`).join('');
}
async function saveNomorUndian() {
    const k = document.getElementById('inputKecamatanNomor').value;
    const l = document.getElementById('inputLombaNomor').value;
    const n = document.getElementById('inputNomor').value;
    if(!k||!l||!n) return showNotification('Lengkapi field','error');
    try {
        await fetch(CONFIG.GAS_WEB_APP_URL, {
            method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'},
            body:JSON.stringify({ action:'saveNomorUndian', kecamatan:k, lomba:l, nomor:parseInt(n) })
        });
        showNotification('Nomor disimpan','success'); loadMasterData();
    } catch(e) { showNotification('Gagal','error'); }
}
async function publishNomorUndian() {
    try {
        await fetch(CONFIG.GAS_WEB_APP_URL, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({ action:'publishNomorUndian' }) });
        showNotification('Dipublikasikan','success');
    } catch(e) { showNotification('Gagal','error'); }
}

// ============================================
// SEKOLAH
// ============================================
function renderSekolahTable() {
    const tbody = document.getElementById('sekolahTableBody');
    tbody.innerHTML = sekolahList.map(s=>`<tr><td>${s.npsn}</td><td>${s.nama_sekolah}</td><td>${s.kecamatan}</td><td>${s.alamat_lengkap||'-'}</td><td><button onclick="editSekolah('${s.npsn}')" class="text-emerald-400 mr-2"><i class="fas fa-edit"></i></button><button onclick="deleteSekolah('${s.npsn}')" class="text-red-400"><i class="fas fa-trash"></i></button></td></tr>`).join('');
}
async function saveSekolah() {
    const npsn = document.getElementById('inputNPSN').value;
    const nama = document.getElementById('inputNamaSekolah').value;
    const kec = document.getElementById('inputKecamatanSekolah').value;
    const alamat = document.getElementById('inputAlamatSekolah').value;
    if(!npsn||!nama||!kec) return showNotification('NPSN, Nama, Kecamatan wajib','error');
    try {
        await fetch(CONFIG.GAS_WEB_APP_URL, {
            method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'},
            body:JSON.stringify({ action:'saveSekolah', npsn, nama_sekolah:nama, kecamatan:kec, alamat_lengkap:alamat })
        });
        showNotification('Sekolah disimpan','success'); loadMasterData();
    } catch(e) { showNotification('Gagal','error'); }
}
function editSekolah(npsn) {
    const s = sekolahList.find(s=>s.npsn===npsn);
    if(s) {
        document.getElementById('inputNPSN').value = s.npsn;
        document.getElementById('inputNamaSekolah').value = s.nama_sekolah;
        document.getElementById('inputKecamatanSekolah').value = s.kecamatan;
        document.getElementById('inputAlamatSekolah').value = s.alamat_lengkap||'';
    }
}
async function deleteSekolah(npsn) {
    if(!confirm('Yakin hapus?')) return;
    try { await fetch(CONFIG.GAS_WEB_APP_URL, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({ action:'deleteSekolah', npsn }) }); showNotification('Dihapus','success'); loadMasterData(); } catch(e) { showNotification('Gagal','error'); }
}

// ============================================
// PENGATURAN
// ============================================
async function toggleFormPendaftaran() {
    const t = document.getElementById('toggleFormSwitch');
    const isActive = t.classList.contains('active');
    try {
        await fetch(CONFIG.GAS_WEB_APP_URL, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({ action:'toggleForm', status:!isActive }) });
        t.classList.toggle('active');
        showNotification(`Form ${!isActive?'aktif':'nonaktif'}`,'success');
    } catch(e) { showNotification('Gagal','error'); }
}
async function saveWaAdmin() {
    const wa = document.getElementById('inputWaAdmin').value;
    try {
        await fetch(CONFIG.GAS_WEB_APP_URL, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({ action:'saveConfig', setting:'whatsapp_admin', value:wa }) });
        showNotification('Nomor WA disimpan','success');
    } catch(e) { showNotification('Gagal','error'); }
}

// ============================================
// EXPORT
// ============================================
function exportData() {
    const s = document.getElementById('exportStatus').value;
    const l = document.getElementById('exportLomba').value;
    let data = allData.filter(d => (!s||d.status===s) && (!l||d.jenisLomba===l));
    const csv = [['ID','Nama','Sekolah','Kecamatan','Lomba','Status','Tanggal']].concat(data.map(d=>[d.id,d.namaPeserta,d.namaSekolah,d.kecamatan,d.jenisLomba,d.status,d.timestamp])).map(r=>r.join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `pendaftaran_${new Date().toISOString().slice(0,10)}.csv`; a.click();
}

// ============================================
// KELOLA AKUN
// ============================================
async function loadAkunList() {
    try {
        const res = await fetch(CONFIG.GAS_WEB_APP_URL, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({ action:'getAdminList' }) });
        const data = await res.json();
        if (data.success) renderAkunTable(data.data);
    } catch(e) { console.error(e); }
}
function renderAkunTable(list) {
    const tbody = document.getElementById('akunTableBody');
    tbody.innerHTML = list.map(a=>`<tr><td>${a.username}</td><td>${a.nama_lengkap}</td><td>${a.role}</td><td><span class="status-badge ${a.status==='aktif'?'status-terverifikasi':'status-ditolak'}">${a.status}</span></td><td>${a.username!=='admin'?`<button onclick="toggleStatusAkun('${a.username}','${a.status}')" class="text-amber-400 mr-2"><i class="fas ${a.status==='aktif'?'fa-ban':'fa-check'}"></i></button><button onclick="resetPasswordAdmin('${a.username}')" class="text-blue-400 mr-2"><i class="fas fa-key"></i></button><button onclick="hapusAkun('${a.username}')" class="text-red-400"><i class="fas fa-trash"></i></button>`:'<span class="text-gray-500">Default</span>'}</td></tr>`).join('');
}
async function toggleStatusAkun(u, s) {
    const ns = s==='aktif'?'nonaktif':'aktif';
    if (!confirm(`Ubah ${u} ke ${ns}?`)) return;
    try {
        await fetch(CONFIG.GAS_WEB_APP_URL, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({ action:'updateAdminStatus', username:u, status:ns }) });
        showNotification('Status diubah','success'); loadAkunList();
    } catch(e) { showNotification('Gagal','error'); }
}
async function resetPasswordAdmin(u) {
    const p = prompt('Password baru:');
    if (!p) return;
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(p));
    const ph = Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
    try {
        await fetch(CONFIG.GAS_WEB_APP_URL, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({ action:'resetAdminPassword', username:u, passwordHash:ph }) });
        showNotification('Password direset','success');
    } catch(e) { showNotification('Gagal','error'); }
}
async function hapusAkun(u) {
    if (!confirm(`Hapus akun ${u}?`)) return;
    try {
        await fetch(CONFIG.GAS_WEB_APP_URL, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({ action:'deleteAdmin', username:u }) });
        showNotification('Akun dihapus','success'); loadAkunList();
    } catch(e) { showNotification('Gagal','error'); }
}
async function tambahAkun() {
    const u = document.getElementById('newUsername').value;
    const n = document.getElementById('newNama').value;
    const p = document.getElementById('newPassword').value;
    const r = document.getElementById('newRole').value;
    if (!u||!n||!p||!r) return showNotification('Lengkapi field','error');
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(p));
    const ph = Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
    try {
        await fetch(CONFIG.GAS_WEB_APP_URL, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({ action:'addAdmin', username:u, passwordHash:ph, nama_lengkap:n, role:r }) });
        showNotification('Akun ditambah','success'); loadAkunList();
        ['newUsername','newNama','newPassword','newRole'].forEach(id=>document.getElementById(id).value='');
    } catch(e) { showNotification('Gagal','error'); }
}

// ============================================
// NAVIGATION
// ============================================
function showSection(s) {
    document.querySelectorAll('.sidebar-link').forEach(l=>l.classList.remove('active'));
    document.querySelector(`a[href="#${s}"]`)?.classList.add('active');
    document.querySelectorAll('.section-content').forEach(c=>c.classList.add('hidden'));
    document.getElementById(`${s}Section`).classList.remove('hidden');
    document.getElementById('pageTitle').textContent = { dashboard:'Dashboard', pendaftaran:'Data Pendaftaran', nomor:'Nomor Undian', sekolah:'Data Sekolah', pengaturan:'Pengaturan', export:'Export Data', akun:'Kelola Akun' }[s]||'Dashboard';
    if (s==='akun') loadAkunList();
    if (window.innerWidth < 768) document.getElementById('sidebar').classList.remove('open');
}

// Start
document.addEventListener('DOMContentLoaded', () => currentUser ? showMainApp() : window.location.href = 'login.html');
