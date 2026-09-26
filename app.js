const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyeTlJJl3DhVpYV8Et_sYZN4o5Quiugzx-hrOmQ6IvtqYNUhfb_ya_VXBQhl2tmwPmj/exec";

let masterSiswa = [];
let masterGuru = [];
let offlineQueue = JSON.parse(localStorage.getItem("piket_offline_queue") || "[]");

// 1. INISIALISASI & JAM REALTIME
document.addEventListener("DOMContentLoaded", () => {
  startClock();
  generateJamKeOptions();
  loadMasterData();
  renderOfflineQueue();
  
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
  updateOnlineStatus();
});

function startClock() {
  const update = () => {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    document.getElementById("clockDisplay").innerText = now.toLocaleDateString("id-ID", options);
  };
  update();
  setInterval(update, 1000);
}

function updateOnlineStatus() {
  const el = document.getElementById("statusKoneksi");
  if (navigator.onLine) {
    el.className = "px-2.5 py-1 text-[10px] rounded-full bg-emerald-500 text-white font-semibold flex items-center gap-1 shadow-sm";
    el.innerHTML = `<i class="fa-solid fa-wifi"></i> Online`;
  } else {
    el.className = "px-2.5 py-1 text-[10px] rounded-full bg-rose-500 text-white font-semibold flex items-center gap-1 shadow-sm";
    el.innerHTML = `<i class="fa-solid fa-plane"></i> Offline`;
  }
}

// 2. DROPDOWN JAM KE- (1 S/D 12 & KOMBINASI)
function generateJamKeOptions() {
  const options = ['<option value="">-- Pilih Jam Ke --</option>'];
  for (let i = 1; i <= 12; i++) {
    options.push(`<option value="${i}">Jam Ke-${i}</option>`);
  }
  options.push('<option value="1-2">Jam Ke-1-2</option>');
  options.push('<option value="3-4">Jam Ke-3-4</option>');
  options.push('<option value="5-6">Jam Ke-5-6</option>');
  options.push('<option value="7-8">Jam Ke-7-8</option>');
  options.push('<option value="Full">Penuh / Seharian</option>');

  document.getElementById("guruJamKe").innerHTML = options.join('');
  document.getElementById("siswaJamKe").innerHTML = options.join('');
}

// 3. SWITCH TAB MENU
window.switchTab = function(e, tab) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  const formG = document.getElementById("formGuru");
  const formS = document.getElementById("formSiswa");
  const secP = document.getElementById("sectionPantau");

  const btnG = document.getElementById("tabBtnGuru");
  const btnS = document.getElementById("tabBtnSiswa");
  const btnP = document.getElementById("tabBtnPantau");

  const defaultClass = "flex-1 py-2 text-center font-semibold text-xs rounded-lg text-slate-600 hover:bg-slate-200 transition-all cursor-pointer";
  const activeClass = "flex-1 py-2 text-center font-semibold text-xs rounded-lg bg-indigo-600 text-white shadow cursor-pointer";

  if (formG) formG.style.display = "none";
  if (formS) formS.style.display = "none";
  if (secP) secP.style.display = "none";

  if (btnG) btnG.className = defaultClass;
  if (btnS) btnS.className = defaultClass;
  if (btnP) btnP.className = defaultClass;

  if (tab === 'guru') {
    if (formG) formG.style.display = "block";
    if (btnG) btnG.className = activeClass;
  } else if (tab === 'siswa') {
    if (formS) formS.style.display = "block";
    if (btnS) btnS.className = activeClass;
  } else if (tab === 'pantau') {
    if (secP) secP.style.display = "block";
    if (btnP) btnP.className = activeClass;
    loadDataPantau();
  }
};

// 4. MEMUAT MASTER DATA GURU & SISWA DARI EXCEL/SHEET
async function loadMasterData() {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=get_master`);
    const data = await res.json();
    if (data.status === 'success') {
      masterSiswa = data.siswa || [];
      masterGuru = data.guru || [];
      renderDropdowns();
    }
  } catch (err) {
    console.log("Gagal memuat master data online");
  }
}

function renderDropdowns() {
  const selectGuru = document.getElementById("selectGuru");
  if (selectGuru) {
    let html = '<option value="">-- Pilih Nama Guru --</option>';
    masterGuru.forEach(g => {
      let n = g.NAMA || g.Nama || g.nama;
      if (n) html += `<option value="${n}">${n}</option>`;
    });
    selectGuru.innerHTML = html;
  }

  const selectSiswa = document.getElementById("selectSiswa");
  if (selectSiswa) {
    let html = '<option value="">-- Pilih Nama Siswa --</option>';
    masterSiswa.forEach(s => {
      let n = s.NAMA || s.Nama || s.nama;
      let k = s.KELAS || s.Kelas || s.kelas || '';
      if (n) html += `<option value="${n}${k ? ' (' + k + ')' : ''}">${n}${k ? ' (' + k + ')' : ''}</option>`;
    });
    selectSiswa.innerHTML = html;
  }
}

// DROPDOWN MAPEL OTOMATIS BERDASARKAN GURU YANG DIPILIH
window.onGuruSelectChanged = function() {
  const selectedNama = document.getElementById("selectGuru").value;
  const selectMapel = document.getElementById("selectGuruMapel");

  if (!selectedNama) {
    selectMapel.innerHTML = '<option value="">-- Pilih Guru Terlebih Dahulu --</option>';
    return;
  }

  const guruObj = masterGuru.find(g => (g.NAMA || g.Nama || g.nama) === selectedNama);
  if (guruObj) {
    let mapelStr = guruObj.MAPEL || guruObj.Mapel || guruObj.mapel || "";
    if (mapelStr) {
      let listMapel = mapelStr.toString().split(',').map(m => m.trim()).filter(m => m !== '');
      let html = '<option value="">-- Pilih Mapel --</option>';
      listMapel.forEach(m => { html += `<option value="${m}">${m}</option>`; });
      selectMapel.innerHTML = html;
    } else {
      selectMapel.innerHTML = '<option value="Umum">Umum / Tanpa Mapel</option>';
    }
  } else {
    selectMapel.innerHTML = '<option value="Umum">Umum / Tanpa Mapel</option>';
  }
};

// 5. PENANGANAN SIMPAN OFFLINE & KELOLA QUEUE
function saveToOfflineQueue(item) {
  offlineQueue.push(item);
  localStorage.setItem("piket_offline_queue", JSON.stringify(offlineQueue));
  renderOfflineQueue();
  alert("Catatan berhasil disimpan ke Offline Queue!");
}

function renderOfflineQueue() {
  const panel = document.getElementById("panelOffline");
  const countEl = document.getElementById("offlineCount");
  const bodyEl = document.getElementById("offlineBody");

  if (offlineQueue.length === 0) {
    panel.classList.add("hidden");
    return;
  }

  panel.classList.remove("hidden");
  countEl.innerText = offlineQueue.length;

  let html = "";
  offlineQueue.forEach((item, index) => {
    const isGuru = item.action === "simpan_laporan_guru";
    html += `
    <div class="bg-white p-2.5 rounded-lg border border-amber-200 flex justify-between items-center text-xs shadow-sm">
      <div>
        <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${isGuru ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}">
          ${isGuru ? 'GURU' : 'SISWA'}
        </span>
        <span class="font-bold text-slate-800 ml-1.5">${isGuru ? item.nama_guru_mapel : item.nama_siswa}</span>
        <p class="text-[11px] text-slate-500 mt-0.5">Jam: ${item.jam_ke} | Ket: ${isGuru ? item.status : item.status_keterangan}</p>
      </div>
      <div class="flex items-center gap-1">
        <button type="button" onclick="editOfflineItem(${index})" class="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px]">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button type="button" onclick="deleteOfflineItem(${index})" class="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded text-[11px]">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>`;
  });

  bodyEl.innerHTML = html;
}

window.toggleOfflinePanel = function() {
  const body = document.getElementById("offlineBody");
  const icon = document.getElementById("iconMinimize");
  body.classList.toggle("hidden");
  icon.classList.toggle("rotate-180");
};

window.deleteOfflineItem = function(index) {
  if (confirm("Hapus catatan offline ini?")) {
    offlineQueue.splice(index, 1);
    localStorage.setItem("piket_offline_queue", JSON.stringify(offlineQueue));
    renderOfflineQueue();
  }
};

window.editOfflineItem = function(index) {
  const item = offlineQueue[index];
  document.getElementById("petugasPiket").value = item.petugas_piket || '';

  if (item.action === "simpan_laporan_guru") {
    switchTab(null, 'guru');
    document.getElementById("guruJamKe").value = item.jam_ke || '';
    document.getElementById("guruJamMasuk").value = item.jam_masuk !== '-' ? item.jam_masuk : '';
    document.getElementById("guruStatus").value = item.status || 'Hadir';
    document.getElementById("guruTugas").value = item.tugas_materi !== '-' ? item.tugas_materi : '';
  } else {
    switchTab(null, 'siswa');
    document.getElementById("selectSiswa").value = item.nama_siswa || '';
    document.getElementById("siswaJamKe").value = item.jam_ke || '';
    document.getElementById("siswaStatus").value = item.status_keterangan || 'Izin Pulang';
  }

  // Hapus dari antrean karena dimasukkan kembali ke form untuk diedit
  offlineQueue.splice(index, 1);
  localStorage.setItem("piket_offline_queue", JSON.stringify(offlineQueue));
  renderOfflineQueue();
};

// UPLOAD SELURUH CATATAN OFFLINE KE SPREADSHEET
window.syncOfflineData = async function(e) {
  if (e) e.stopPropagation();
  if (!navigator.onLine) {
    alert("Koneksi masih offline. Mohon sambungkan ke internet terlebih dahulu.");
    return;
  }

  if (offlineQueue.length === 0) return;

  if (!confirm(`Upload ${offlineQueue.length} catatan offline ke Google Sheets?`)) return;

  let successCount = 0;
  let remaining = [];

  for (let item of offlineQueue) {
    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(item)
      });
      successCount++;
    } catch (err) {
      remaining.push(item);
    }
  }

  offlineQueue = remaining;
  localStorage.setItem("piket_offline_queue", JSON.stringify(offlineQueue));
  renderOfflineQueue();

  alert(`Berhasil mengunggah ${successCount} catatan ke Google Sheets!`);
  if (document.getElementById("sectionPantau").style.display !== "none") {
    loadDataPantau();
  }
};

// SIMPAN OFFLINE ACTION (TOMBOL AMBER)
window.simpanGuruOffline = function() {
  const petugas = document.getElementById("petugasPiket").value.trim();
  const namaGuru = document.getElementById("selectGuru").value;
  const mapel = document.getElementById("selectGuruMapel").value;
  const jamKe = document.getElementById("guruJamKe").value;

  if (!petugas || !namaGuru || !mapel || !jamKe) {
    alert("Harap lengkapi Petugas Piket, Guru, Mapel, dan Jam Ke!");
    return;
  }

  const payload = {
    action: "simpan_laporan_guru",
    tanggal: new Date().toLocaleString("id-ID"),
    petugas_piket: petugas,
    nama_guru_mapel: `${namaGuru} [${mapel}]`,
    jam_ke: jamKe,
    jam_masuk: document.getElementById("guruJamMasuk").value || '-',
    status: document.getElementById("guruStatus").value,
    tugas_materi: document.getElementById("guruTugas").value || '-'
  };

  saveToOfflineQueue(payload);
  document.getElementById("formGuru").reset();
};

window.simpanSiswaOffline = function() {
  const petugas = document.getElementById("petugasPiket").value.trim();
  const namaSiswa = document.getElementById("selectSiswa").value;
  const jamKe = document.getElementById("siswaJamKe").value;

  if (!petugas || !namaSiswa || !jamKe) {
    alert("Harap lengkapi Petugas Piket, Siswa, dan Jam Ke!");
    return;
  }

  const payload = {
    action: "simpan_laporan_siswa",
    tanggal: new Date().toLocaleString("id-ID"),
    petugas_piket: petugas,
    nama_siswa: namaSiswa,
    jam_ke: jamKe,
    status_keterangan: document.getElementById("siswaStatus").value
  };

  saveToOfflineQueue(payload);
  document.getElementById("formSiswa").reset();
};

// 6. SUBMIT LANGSUNG (UPLOAD KE GOOGLE APPS SCRIPT)
window.handleSubmitedGuru = async function(e) {
  e.preventDefault();
  const petugas = document.getElementById("petugasPiket").value.trim();
  const namaGuru = document.getElementById("selectGuru").value;
  const mapel = document.getElementById("selectGuruMapel").value;
  const jamKe = document.getElementById("guruJamKe").value;

  if (!petugas || !namaGuru || !mapel || !jamKe) {
    alert("Harap isi Petugas Piket, Guru, Mapel, dan Jam Ke!");
    return;
  }

  const payload = {
    action: "simpan_laporan_guru",
    tanggal: new Date().toLocaleString("id-ID"),
    petugas_piket: petugas,
    nama_guru_mapel: `${namaGuru} [${mapel}]`,
    jam_ke: jamKe,
    jam_masuk: document.getElementById("guruJamMasuk").value || '-',
    status: document.getElementById("guruStatus").value,
    tugas_materi: document.getElementById("guruTugas").value || '-'
  };

  await sendDataToServer(payload);
  e.target.reset();
};

window.handleSubmitedSiswa = async function(e) {
  e.preventDefault();
  const petugas = document.getElementById("petugasPiket").value.trim();
  const namaSiswa = document.getElementById("selectSiswa").value;
  const jamKe = document.getElementById("siswaJamKe").value;

  if (!petugas || !namaSiswa || !jamKe) {
    alert("Harap isi Petugas Piket, Siswa, dan Jam Ke!");
    return;
  }

  const payload = {
    action: "simpan_laporan_siswa",
    tanggal: new Date().toLocaleString("id-ID"),
    petugas_piket: petugas,
    nama_siswa: namaSiswa,
    jam_ke: jamKe,
    status_keterangan: document.getElementById("siswaStatus").value
  };

  await sendDataToServer(payload);
  e.target.reset();
};

async function sendDataToServer(payload) {
  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload)
    });
    alert("Laporan berhasil tersimpan ke Google Spreadsheet!");
  } catch (err) {
    alert("Gagal terhubung. Menyimpan otomatis ke Catatan Offline.");
    saveToOfflineQueue(payload);
  }
}

// 7. MEMUAT DATA UNTUK TAB PANTAU
async function loadDataPantau() {
  const container = document.getElementById("tabelLaporanContainer");
  if (!container) return;

  container.innerHTML = `
    <div class="text-center py-8 text-slate-500">
      <i class="fa-solid fa-spinner animate-spin text-2xl text-indigo-600 mb-2"></i>
      <p class="text-xs font-medium">Memuat data rekapitulasi dari Spreadsheet...</p>
    </div>`;

  try {
    const res = await fetch(`${SCRIPT_URL}?action=get_laporan`);
    const data = await res.json();

    if (data.status === 'success') {
      let html = `<div class="space-y-4">`;

      // --- TABEL GURU ---
      const totalGuru = data.guru && data.guru.length > 1 ? data.guru.length - 1 : 0;
      html += `
      <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-bold text-xs text-slate-800 flex items-center gap-2">
            <span class="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <i class="fa-solid fa-chalkboard-user text-xs"></i>
            </span>
            Rekap Laporan Guru
          </h3>
          <span class="text-[11px] bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-100">
            ${totalGuru} Catatan
          </span>
        </div>`;

      if (totalGuru > 0) {
        html += `
        <div class="overflow-x-auto rounded-lg border border-slate-200">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th class="p-2.5 border-r">Waktu</th>
                <th class="p-2.5 border-r">Petugas Piket</th>
                <th class="p-2.5 border-r">Guru & Mapel</th>
                <th class="p-2.5 border-r text-center">Jam Ke</th>
                <th class="p-2.5 border-r text-center">Jam Masuk</th>
                <th class="p-2.5 border-r text-center">Status</th>
                <th class="p-2.5">Tugas / Materi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white text-slate-700">`;

        for (let i = data.guru.length - 1; i >= 1; i--) {
          const r = data.guru[i];
          html += `
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="p-2.5 border-r text-slate-500 whitespace-nowrap text-[11px]">${r[0] || '-'}</td>
              <td class="p-2.5 border-r font-medium text-slate-800">${r[1] || '-'}</td>
              <td class="p-2.5 border-r font-semibold text-indigo-950">${r[2] || '-'}</td>
              <td class="p-2.5 border-r text-center whitespace-nowrap">${r[3] || '-'}</td>
              <td class="p-2.5 border-r text-center whitespace-nowrap font-medium text-slate-700">${cleanJamDisplay(r[4])}</td>
              <td class="p-2.5 border-r text-center whitespace-nowrap">
                <span class="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold text-[10px]">${r[5] || '-'}</span>
              </td>
              <td class="p-2.5 text-slate-600">${r[6] || '-'}</td>
            </tr>`;
        }
        html += `</tbody></table></div>`;
      } else {
        html += `<p class="text-xs text-slate-400 italic py-3 text-center bg-slate-50 rounded-lg">Belum ada laporan guru.</p>`;
      }
      html += `</div>`;

      // --- TABEL SISWA ---
      const totalSiswa = data.siswa && data.siswa.length > 1 ? data.siswa.length - 1 : 0;
      html += `
      <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-bold text-xs text-slate-800 flex items-center gap-2">
            <span class="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <i class="fa-solid fa-user-graduate text-xs"></i>
            </span>
            Rekap Laporan Siswa
          </h3>
          <span class="text-[11px] bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-100">
            ${totalSiswa} Catatan
          </span>
        </div>`;

      if (totalSiswa > 0) {
        html += `
        <div class="overflow-x-auto rounded-lg border border-slate-200">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th class="p-2.5 border-r">Waktu</th>
                <th class="p-2.5 border-r">Petugas Piket</th>
                <th class="p-2.5 border-r">Siswa & Kelas</th>
                <th class="p-2.5 border-r text-center">Jam Ke</th>
                <th class="p-2.5 text-center">Keterangan</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white text-slate-700">`;

        for (let i = data.siswa.length - 1; i >= 1; i--) {
          const r = data.siswa[i];
          html += `
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="p-2.5 border-r text-slate-500 whitespace-nowrap text-[11px]">${r[0] || '-'}</td>
              <td class="p-2.5 border-r font-medium text-slate-800">${r[1] || '-'}</td>
              <td class="p-2.5 border-r font-semibold text-slate-900">${r[2] || '-'}</td>
              <td class="p-2.5 border-r text-center whitespace-nowrap">${r[3] || '-'}</td>
              <td class="p-2.5 text-center whitespace-nowrap">
                <span class="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-semibold text-[10px]">${r[4] || '-'}</span>
              </td>
            </tr>`;
        }
        html += `</tbody></table></div>`;
      } else {
        html += `<p class="text-xs text-slate-400 italic py-3 text-center bg-slate-50 rounded-lg">Belum ada laporan siswa.</p>`;
      }
      html += `</div></div>`;

      container.innerHTML = html;
    }
  } catch (err) {
    container.innerHTML = `<div class="p-4 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg text-center">Gagal memuat data laporan dari Spreadsheet.</div>`;
  }
}

function cleanJamDisplay(val) {
  if (!val || val === '-') return '-';
  let str = val.toString();
  if (str.includes('T') && str.includes('Z')) {
    try {
      let d = new Date(str);
      let jam = String(d.getHours()).padStart(2, '0');
      let menit = String(d.getMinutes()).padStart(2, '0');
      return `${jam}:${menit}`;
    } catch(e) {
      return str;
    }
  }
  return str;
}
