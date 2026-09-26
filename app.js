// PASANG URL WEB APP APPS SCRIPT ANDA DI SINI
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwjt8QdoMyrqDrYnUmx-P_s-JcS3fLAiaE2RoP4cbvvLmJFvNINPjVND1h1AQzO57KR/exec";

let masterSiswa = [];
let masterGuru = [];
let isOfflineListMinimized = false;

// FUNGSI PERPINDAHAN TAB
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

  const defaultBtnClass = "flex-1 py-2 text-center font-semibold text-xs rounded-lg text-slate-600 hover:bg-slate-100 transition-all cursor-pointer";
  const activeBtnClass = "flex-1 py-2 text-center font-semibold text-xs rounded-lg bg-indigo-600 text-white shadow cursor-pointer";

  // Sembunyikan semua elemen menggunakan display
  if (formG) formG.style.display = "none";
  if (formS) formS.style.display = "none";
  if (secP) secP.style.display = "none";

  // Reset tampilan tombol
  if (btnG) btnG.className = defaultBtnClass;
  if (btnS) btnS.className = defaultBtnClass;
  if (btnP) btnP.className = defaultBtnClass;

  // Tampilkan tab yang dipilih
  if (tab === 'guru') {
    if (formG) formG.style.display = "block";
    if (btnG) btnG.className = activeBtnClass;
  } else if (tab === 'siswa') {
    if (formS) formS.style.display = "block";
    if (btnS) btnS.className = activeBtnClass;
  } else if (tab === 'pantau') {
    if (secP) secP.style.display = "block";
    if (btnP) btnP.className = activeBtnClass;
    
    // Panggil data rekapitulasi monitoring
    if (typeof loadDataPantau === "function") {
      loadDataPantau();
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  setupRealtimeClock();
  checkOnlineStatus();
  loadMasterData();
  renderOfflineList();

  window.addEventListener("online", checkOnlineStatus);
  window.addEventListener("offline", checkOnlineStatus);
});

// 2. FUNGSI WAKTU REALTIME
function setupRealtimeClock() {
  const el = document.getElementById("tanggalWaktu");
  const update = () => {
    const now = new Date();
    if (el) el.value = now.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
  };
  update();
  setInterval(update, 1000);
}

// 3. STATUS KONEKSI ONLINE / OFFLINE
function checkOnlineStatus() {
  const badge = document.getElementById("statusKoneksi");
  if (!badge) return;
  if (navigator.onLine) {
    badge.className = "px-2.5 py-1 text-xs rounded-full bg-emerald-500 text-white font-medium flex items-center gap-1.5 shadow-sm";
    badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-white animate-pulse"></span> Online`;
  } else {
    badge.className = "px-2.5 py-1 text-xs rounded-full bg-rose-500 text-white font-medium flex items-center gap-1.5 shadow-sm";
    badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-white"></span> Offline`;
  }
}

// 4. MEMUAT DATA LAPORAN UNTUK TAB PANTAU (DAPAT DIPERINGKAS & DILENGKAPI PETUGAS PIKET)
async function loadDataPantau() {
  const container = document.getElementById("tabelLaporanContainer");
  if (!container) return;

  container.innerHTML = `
    <div class="text-center py-8 text-slate-500">
      <i class="fa-solid fa-spinner animate-spin text-2xl text-indigo-600 mb-2"></i>
      <p class="text-xs font-medium">Memuat data laporan terbaru dari Spreadsheet...</p>
    </div>`;

  try {
    const res = await fetch(`${SCRIPT_URL}?action=get_laporan`);
    const data = await res.json();

    if (data.status === 'success') {
      let html = "";

      // ==========================================
      // 1. TABEL REKAP LAPORAN GURU
      // ==========================================
      const totalGuru = data.guru && data.guru.length > 1 ? data.guru.length - 1 : 0;
      
      html += `
      <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-4">
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-bold text-xs text-slate-800 flex items-center gap-2">
            <span class="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <i class="fa-solid fa-chalkboard-user text-xs"></i>
            </span>
            Rekap Laporan Guru
          </h3>
          <span class="text-[11px] bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded-full border border-indigo-100">
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

        // Iterasi data dari yang terbaru (bottom-up)
        for (let i = data.guru.length - 1; i >= 1; i--) {
          const row = data.guru[i];
          const tgl = row[0] || '-';
          const petugas = row[1] || '-';
          const guruMapel = row[2] || '-';
          const jamKe = row[3] || '-';
          const jamMasuk = row[4] || '-';
          const status = row[5] || '-';
          const tugas = row[6] || '-';

          html += `
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="p-2.5 border-r text-slate-500 whitespace-nowrap text-[11px]">${tgl}</td>
              <td class="p-2.5 border-r font-medium text-slate-800">${petugas}</td>
              <td class="p-2.5 border-r font-semibold text-indigo-950">${guruMapel}</td>
              <td class="p-2.5 border-r text-center whitespace-nowrap">${jamKe}</td>
              <td class="p-2.5 border-r text-center whitespace-nowrap text-slate-500">${jamMasuk}</td>
              <td class="p-2.5 border-r text-center whitespace-nowrap">
                <span class="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-semibold text-[11px]">${status}</span>
              </td>
              <td class="p-2.5 text-slate-600">${tugas}</td>
            </tr>`;
        }
        html += `</tbody></table></div>`;
      } else {
        html += `<p class="text-xs text-slate-400 italic py-3 text-center bg-slate-50 rounded-lg">Belum ada laporan guru yang tercatat.</p>`;
      }
      html += `</div>`;

      // ==========================================
      // 2. TABEL REKAP LAPORAN SISWA
      // ==========================================
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
          <span class="text-[11px] bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-full border border-emerald-100">
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
          const row = data.siswa[i];
          const tgl = row[0] || '-';
          const petugas = row[1] || '-';
          const siswaKelas = row[2] || '-';
          const jamKe = row[3] || '-';
          const ket = row[4] || '-';

          html += `
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="p-2.5 border-r text-slate-500 whitespace-nowrap text-[11px]">${tgl}</td>
              <td class="p-2.5 border-r font-medium text-slate-800">${petugas}</td>
              <td class="p-2.5 border-r font-semibold text-slate-900">${siswaKelas}</td>
              <td class="p-2.5 border-r text-center whitespace-nowrap">${jamKe}</td>
              <td class="p-2.5 text-center whitespace-nowrap">
                <span class="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md font-semibold text-[11px]">${ket}</span>
              </td>
            </tr>`;
        }
        html += `</tbody></table></div>`;
      } else {
        html += `<p class="text-xs text-slate-400 italic py-3 text-center bg-slate-50 rounded-lg">Belum ada laporan siswa yang tercatat.</p>`;
      }
      html += `</div>`;

      container.innerHTML = html;
    }
  } catch (err) {
    container.innerHTML = `
      <div class="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-4 rounded-xl text-center">
        <i class="fa-solid fa-triangle-exclamation mr-1"></i> Gagal memuat data laporan. Pastikan koneksi internet aktif dan URL Web App sudah benar.
      </div>`;
  }
}

// 5. OFFLINE STORAGE & SINKRONISASI
window.toggleOfflineVisibility = function() {
  const wrapper = document.getElementById("offlineContentWrapper");
  const txt = document.getElementById("txtToggleList");
  const icon = document.getElementById("iconToggleList");

  if (!wrapper || !txt || !icon) return;
  isOfflineListMinimized = !isOfflineListMinimized;

  if (isOfflineListMinimized) {
    wrapper.classList.add("hidden");
    txt.innerText = "Tampilkan";
    icon.className = "fa-solid fa-chevron-down text-[10px]";
  } else {
    wrapper.classList.remove("hidden");
    txt.innerText = "Sembunyikan";
    icon.className = "fa-solid fa-chevron-up text-[10px]";
  }
};

window.deleteSingleOfflineItem = function(index) {
  let list = JSON.parse(localStorage.getItem("offline_queue")) || [];
  if (index >= 0 && index < list.length) {
    list.splice(index, 1);
    localStorage.setItem("offline_queue", JSON.stringify(list));
    renderOfflineList();
  }
};

window.clearAllOfflineData = function() {
  let list = JSON.parse(localStorage.getItem("offline_queue")) || [];
  if (list.length === 0) return;
  if (confirm(`Yakin ingin menghapus SELURUH ${list.length} catatan offline?`)) {
    localStorage.removeItem("offline_queue");
    renderOfflineList();
  }
};

async function loadMasterData() {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=get_master`);
    const data = await res.json();
    if (data.status === 'success') {
      masterSiswa = data.siswa || [];
      masterGuru = data.guru || [];
      localStorage.setItem("cache_siswa", JSON.stringify(masterSiswa));
      localStorage.setItem("cache_guru", JSON.stringify(masterGuru));
      renderDropdowns();
    }
  } catch (err) {
    masterSiswa = JSON.parse(localStorage.getItem("cache_siswa")) || [];
    masterGuru = JSON.parse(localStorage.getItem("cache_guru")) || [];
    renderDropdowns();
  }
}

function renderDropdowns() {
  const selectGuru = document.getElementById("selectGuru");
  if (selectGuru) {
    let htmlGuru = '<option value="">-- Pilih Nama Guru --</option>';
    masterGuru.forEach(g => {
      let nama = g.NAMA || g.Nama || g.nama;
      if (nama) htmlGuru += `<option value="${nama}">${nama}</option>`;
    });
    selectGuru.innerHTML = htmlGuru;
  }

  const selectSiswa = document.getElementById("selectSiswa");
  if (selectSiswa) {
    let htmlSiswa = '<option value="">-- Pilih Nama Siswa --</option>';
    masterSiswa.forEach(s => {
      let nama = s.NAMA || s.Nama || s.nama;
      let kelas = s.KELAS || s.Kelas || s.kelas || '';
      if (nama) {
        let label = kelas ? `${nama} - ${kelas}` : nama;
        htmlSiswa += `<option value="${label}">${label}</option>`;
      }
    });
    selectSiswa.innerHTML = htmlSiswa;
  }
}

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

function getGuruPayload() {
  const petugas = document.getElementById("petugasPiket").value.trim();
  if (!petugas) { alert("Nama Petugas Piket wajib diisi!"); return null; }

  const namaGuru = document.getElementById("selectGuru").value;
  const mapel = document.getElementById("selectGuruMapel").value;
  const jamKe = document.getElementById("guruJamKe").value;
  const status = document.getElementById("guruStatus").value;

  if (!namaGuru || !mapel || !jamKe || !status) {
    alert("Lengkapi seluruh kolom guru!");
    return null;
  }

  return {
    tipe: "guru",
    tanggal: new Date().toLocaleString("id-ID"),
    petugas_piket: petugas,
    nama_guru_mapel: `${namaGuru} [${mapel}]`,
    jam_ke: jamKe,
    jam_masuk: document.getElementById("guruJamMasuk").value || '-',
    status: status,
    tugas_materi: document.getElementById("guruTugas").value || '-'
  };
}

function getSiswaPayload() {
  const petugas = document.getElementById("petugasPiket").value.trim();
  if (!petugas) { alert("Nama Petugas Piket wajib diisi!"); return null; }

  const namaSiswa = document.getElementById("selectSiswa").value;
  const jamKe = document.getElementById("siswaJamKe").value;
  const status = document.getElementById("siswaStatus").value;

  if (!namaSiswa || !jamKe || !status) {
    alert("Lengkapi seluruh kolom siswa!");
    return null;
  }

  return {
    tipe: "siswa",
    tanggal: new Date().toLocaleString("id-ID"),
    petugas_piket: petugas,
    nama_siswa: namaSiswa,
    jam_ke: jamKe,
    status_keterangan: status
  };
}

window.simpanManualOffline = function(type) {
  const payload = type === 'guru' ? getGuruPayload() : getSiswaPayload();
  if (!payload) return;

  saveToLocalStorage(payload);
  alert("Catatan berhasil disimpan di HP!");

  if (type === 'guru') {
    document.getElementById("formGuru").reset();
    document.getElementById("selectGuruMapel").innerHTML = '<option value="">-- Pilih Guru Terlebih Dahulu --</option>';
  } else {
    document.getElementById("formSiswa").reset();
  }
};

window.handleSubmitedGuru = async function(e) {
  e.preventDefault();
  const payload = getGuruPayload();
  if (!payload) return;

  await sendData(payload, "simpan_laporan_guru");
  e.target.reset();
  document.getElementById("selectGuruMapel").innerHTML = '<option value="">-- Pilih Guru Terlebih Dahulu --</option>';
};

window.handleSubmitedSiswa = async function(e) {
  e.preventDefault();
  const payload = getSiswaPayload();
  if (!payload) return;

  await sendData(payload, "simpan_laporan_siswa");
  e.target.reset();
};

async function sendData(payload, action) {
  if (navigator.onLine) {
    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: action, ...payload })
      });
      alert("Laporan berhasil terkirim ke Google Spreadsheet!");
      return;
    } catch (e) {
      console.warn("Error pengiriman...", e);
    }
  }

  saveToLocalStorage(payload);
  alert("Offline! Data tersimpan sementara di HP.");
}

function saveToLocalStorage(item) {
  let list = JSON.parse(localStorage.getItem("offline_queue")) || [];
  list.push(item);
  localStorage.setItem("offline_queue", JSON.stringify(list));
  renderOfflineList();
}

function renderOfflineList() {
  const banner = document.getElementById("offlineBanner");
  const textCount = document.getElementById("offlineCountText");
  const container = document.getElementById("offlineListContainer");

  let list = JSON.parse(localStorage.getItem("offline_queue")) || [];

  if (list.length > 0) {
    if (banner) banner.classList.remove("hidden");
    if (textCount) textCount.innerText = `${list.length} Catatan Tersimpan di HP`;

    if (container) {
      let html = "";
      list.forEach((item, idx) => {
        let title = item.tipe === "guru" ? item.nama_guru_mapel : item.nama_siswa;
        let ket = item.tipe === "guru" ? `${item.status} (${item.jam_ke})` : `${item.status_keterangan} (${item.jam_ke})`;
        
        html += `
          <div class="p-2.5 bg-white border border-amber-200 rounded-lg flex justify-between items-center shadow-sm">
            <div class="overflow-hidden pr-2">
              <div class="flex items-center gap-1.5 mb-1">
                <span class="font-bold text-indigo-700 uppercase text-[9px] px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 rounded">${item.tipe}</span>
                <span class="font-semibold text-slate-800 text-xs truncate">${title}</span>
              </div>
              <p class="text-[11px] text-slate-500">${ket}</p>
            </div>
            <button type="button" onclick="deleteSingleOfflineItem(${idx})" class="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md border border-rose-200 transition-all cursor-pointer shrink-0">
              <i class="fa-solid fa-trash-can text-xs"></i>
            </button>
          </div>
        `;
      });
      container.innerHTML = html;
    }
  } else {
    if (banner) banner.classList.add("hidden");
  }
}

window.uploadDataOffline = async function() {
  let list = JSON.parse(localStorage.getItem("offline_queue")) || [];
  if (list.length === 0) return;

  const btn = document.getElementById("btnUploadBatch");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> Mengupload...`;
  }

  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action: "simpan_batch", items: list })
    });

    alert(`Berhasil mengunggah ${list.length} catatan ke Google Spreadsheet!`);
    localStorage.removeItem("offline_queue");
    renderOfflineList();
  } catch (err) {
    alert("Gagal mengunggah. Pastikan koneksi internet aktif!");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Upload Sekarang ke Spreadsheet`;
    }
  }
};
