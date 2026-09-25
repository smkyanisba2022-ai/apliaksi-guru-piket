// GANTI DENGAN URL WEB APP GOOGLE APPS SCRIPT ANDA
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz1j9f9PX8hixAeTk21NDdX-0CHv-rAWSPe092zCWrSfEUTtt6tYoX7caoK21LkAv_R/exec";

let masterSiswa = [];
let masterGuru = [];

document.addEventListener("DOMContentLoaded", () => {
  setupRealtimeClock();
  checkOnlineStatus();
  loadMasterData();
  renderOfflineList();

  window.addEventListener("online", checkOnlineStatus);
  window.addEventListener("offline", checkOnlineStatus);
});

// Jam Realtime
function setupRealtimeClock() {
  const el = document.getElementById("tanggalWaktu");
  const update = () => {
    const now = new Date();
    if (el) el.value = now.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
  };
  update();
  setInterval(update, 1000);
}

// Indicator Status Online / Offline
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

// Switch Tab
window.switchTab = function(tab) {
  const formG = document.getElementById("formGuru");
  const formS = document.getElementById("formSiswa");
  const btnG = document.getElementById("tabBtnGuru");
  const btnS = document.getElementById("tabBtnSiswa");

  if (tab === 'guru') {
    formG.classList.remove("hidden");
    formS.classList.add("hidden");
    btnG.className = "flex-1 py-2.5 text-center font-semibold text-sm rounded-lg transition-all bg-indigo-600 text-white shadow";
    btnS.className = "flex-1 py-2.5 text-center font-semibold text-sm rounded-lg text-slate-600 hover:bg-slate-100 transition-all";
  } else {
    formS.classList.remove("hidden");
    formG.classList.add("hidden");
    btnS.className = "flex-1 py-2.5 text-center font-semibold text-sm rounded-lg transition-all bg-indigo-600 text-white shadow";
    btnG.className = "flex-1 py-2.5 text-center font-semibold text-sm rounded-lg text-slate-600 hover:bg-slate-100 transition-all";
  }
};

// Ambil Master Data
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
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    console.warn("Memuat dari penyimpanan lokal (Offline)...", err);
    masterSiswa = JSON.parse(localStorage.getItem("cache_siswa")) || [];
    masterGuru = JSON.parse(localStorage.getItem("cache_guru")) || [];
    renderDropdowns();
  }
}

// Render Dropdown Utama
function renderDropdowns() {
  // Render Guru
  const selectGuru = document.getElementById("selectGuru");
  if (selectGuru) {
    let htmlGuru = '<option value="">-- Pilih Nama Guru --</option>';
    masterGuru.forEach(g => {
      let nama = g.NAMA || g.Nama || g.nama;
      if (nama) {
        htmlGuru += `<option value="${nama}">${nama}</option>`;
      }
    });
    selectGuru.innerHTML = htmlGuru;
  }

  // Render Siswa
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

// Saat nama guru dipilih -> Cari mapel di masterGuru (pembacaan Fleksibel/Case-Insensitive)
window.onGuruSelectChanged = function() {
  const selectedNama = document.getElementById("selectGuru").value;
  const selectMapel = document.getElementById("selectGuruMapel");

  if (!selectedNama) {
    selectMapel.innerHTML = '<option value="">-- Pilih Guru Terlebih Dahulu --</option>';
    return;
  }

  const guruObj = masterGuru.find(g => {
    let n = g.NAMA || g.Nama || g.nama;
    return n === selectedNama;
  });

  if (guruObj) {
    let mapelStr = guruObj.MAPEL || guruObj.Mapel || guruObj.mapel || "";
    if (mapelStr) {
      let listMapel = mapelStr.toString().split(',').map(m => m.trim()).filter(m => m !== '');
      let html = '<option value="">-- Pilih Mapel --</option>';
      listMapel.forEach(m => {
        html += `<option value="${m}">${m}</option>`;
      });
      selectMapel.innerHTML = html;
    } else {
      selectMapel.innerHTML = '<option value="Umum">Umum / Tanpa Mapel</option>';
    }
  } else {
    selectMapel.innerHTML = '<option value="Umum">Umum / Tanpa Mapel</option>';
  }
};

// Validasi Payload Guru
function getGuruPayload() {
  const petugas = document.getElementById("petugasPiket").value.trim();
  if (!petugas) { alert("Nama Petugas Piket wajib diisi!"); return null; }

  const namaGuru = document.getElementById("selectGuru").value;
  const mapel = document.getElementById("selectGuruMapel").value;
  const jamKe = document.getElementById("guruJamKe").value;
  const status = document.getElementById("guruStatus").value;

  if (!namaGuru) { alert("Pilih Nama Guru terlebih dahulu!"); return null; }
  if (!mapel) { alert("Pilih Mata Pelajaran!"); return null; }
  if (!jamKe) { alert("Pilih Jam Ke-!"); return null; }
  if (!status) { alert("Pilih Status / Keterangan!"); return null; }

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

// Validasi Payload Siswa
function getSiswaPayload() {
  const petugas = document.getElementById("petugasPiket").value.trim();
  if (!petugas) { alert("Nama Petugas Piket wajib diisi!"); return null; }

  const namaSiswa = document.getElementById("selectSiswa").value;
  const jamKe = document.getElementById("siswaJamKe").value;
  const status = document.getElementById("siswaStatus").value;

  if (!namaSiswa) { alert("Pilih Nama Siswa terlebih dahulu!"); return null; }
  if (!jamKe) { alert("Pilih Jam Ke-!"); return null; }
  if (!status) { alert("Pilih Status / Keterangan!"); return null; }

  return {
    tipe: "siswa",
    tanggal: new Date().toLocaleString("id-ID"),
    petugas_piket: petugas,
    nama_siswa: namaSiswa,
    jam_ke: jamKe,
    status_keterangan: status
  };
}

// Simpan Offline Manual
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

// Form Handler (Upload Langsung)
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

// Kirim Data
async function sendData(payload, action) {
  if (navigator.onLine) {
    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: action, ...payload })
      });
      const data = await res.json();
      if (data.status === "success") {
        alert("Laporan berhasil terkirim ke Google Spreadsheet!");
        return;
      }
    } catch (e) {
      console.log("Kirim online gagal, menyimpan ke offline...", e);
    }
  }

  saveToLocalStorage(payload);
  alert("Koneksi bermasalah / Offline. Data berhasil tersimpan di HP!");
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
        let sub = item.tipe === "guru" ? item.nama_guru_mapel : item.nama_siswa;
        html += `
          <div class="p-2 bg-white border border-amber-200 rounded flex justify-between items-center shadow-sm">
            <div>
              <span class="font-bold text-indigo-700 uppercase text-[9px] px-1 py-0.5 bg-indigo-50 border border-indigo-200 rounded">${item.tipe}</span>
              <span class="font-semibold text-slate-800 ml-1 text-xs">${sub}</span>
              <p class="text-[10px] text-slate-500">${item.status || item.status_keterangan} (${item.jam_ke})</p>
            </div>
            <span class="text-[10px] font-bold text-slate-400">#${idx + 1}</span>
          </div>
        `;
      });
      container.innerHTML = html;
    }
  } else {
    if (banner) banner.classList.add("hidden");
  }
}

// Upload Batch Offline
window.uploadDataOffline = async function() {
  let list = JSON.parse(localStorage.getItem("offline_queue")) || [];

  if (list.length === 0) {
    alert("Tidak ada catatan offline yang tersimpan.");
    return;
  }

  const btn = document.getElementById("btnUploadBatch");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> Mengupload...`;
  }

  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "simpan_batch",
        items: list
      })
    });

    const data = await res.json();

    if (data.status === "success") {
      alert(`Berhasil mengunggah ${list.length} catatan ke Google Spreadsheet!`);
      localStorage.removeItem("offline_queue");
      renderOfflineList();
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    alert("Gagal mengunggah. Pastikan koneksi internet aktif!");
    console.error(err);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Upload Sekarang ke Spreadsheet`;
    }
  }
};

window.clearOfflineData = function() {
  if (confirm("Hapus seluruh daftar catatan offline dari HP?")) {
    localStorage.removeItem("offline_queue");
    renderOfflineList();
  }
};
