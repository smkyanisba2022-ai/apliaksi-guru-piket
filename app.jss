// GANTI DENGAN URL WEB APP GOOGLE APPS SCRIPT ANDA
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyhSyXZ-2iZENRsfSwS2KybTrwWkDk7OrUZ6UIbjNIOpZ3i8AZ24s_9R7sCX3h_psBO/exec";

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

// Cek Status Koneksi Internet
function checkOnlineStatus() {
  const badge = document.getElementById("statusKoneksi");
  if (navigator.onLine) {
    badge.className = "px-2.5 py-1 text-xs rounded-full bg-emerald-500 text-white font-medium flex items-center gap-1.5 shadow-sm";
    badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-white animate-pulse"></span> Online`;
  } else {
    badge.className = "px-2.5 py-1 text-xs rounded-full bg-rose-500 text-white font-medium flex items-center gap-1.5 shadow-sm";
    badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-white"></span> Offline`;
  }
}

// Switch Tab Form
function switchTab(tab) {
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
}

// Fetch Master Data
async function loadMasterData() {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=get_master`);
    const data = await res.json();
    if (data.status === 'success') {
      masterSiswa = data.siswa || [];
      masterGuru = data.guru || [];
      localStorage.setItem("cache_siswa", JSON.stringify(masterSiswa));
      localStorage.setItem("cache_guru", JSON.stringify(masterGuru));
      populateDropdowns();
    }
  } catch (err) {
    console.warn("Koneksi gagal, membaca dari cache lokal...", err);
    masterSiswa = JSON.parse(localStorage.getItem("cache_siswa")) || [];
    masterGuru = JSON.parse(localStorage.getItem("cache_guru")) || [];
    populateDropdowns();
  }
}

function populateDropdowns() {
  const selSiswa = document.getElementById("selectSiswa");
  const selGuru = document.getElementById("selectGuru");

  if (selSiswa && masterSiswa.length > 0) {
    let html = '<option value="">-- Pilih Nama Siswa --</option>';
    masterSiswa.forEach(s => {
      if(s.NAMA) html += `<option value="${s.NAMA}">${s.NAMA} (${s.KELAS || '-'})</option>`;
    });
    selSiswa.innerHTML = html;
  }

  if (selGuru && masterGuru.length > 0) {
    let html = '<option value="">-- Pilih Guru & Mapel --</option>';
    masterGuru.forEach(g => {
      if(g.NAMA) {
        let val = `${g.NAMA}${g.MAPEL ? ' - ' + g.MAPEL : ''}`;
        html += `<option value="${val}">${val}</option>`;
      }
    });
    selGuru.innerHTML = html;
  }
}

// Submit Laporan Guru
async function handleSubmitedGuru(e) {
  e.preventDefault();
  const petugas = document.getElementById("petugasPiket").value;
  if (!petugas) { alert("Harap isi nama Petugas Piket terlebih dahulu!"); return; }

  const payload = {
    tipe: "guru",
    tanggal: new Date().toLocaleString("id-ID"),
    petugas_piket: petugas,
    nama_guru_mapel: document.getElementById("selectGuru").value,
    jam_ke: document.getElementById("guruJamKe").value,
    jam_masuk: document.getElementById("guruJamMasuk").value,
    status: document.getElementById("guruStatus").value,
    tugas_materi: document.getElementById("guruTugas").value
  };

  await sendData(payload, "simpan_laporan_guru");
  e.target.reset();
}

// Submit Laporan Siswa
async function handleSubmitedSiswa(e) {
  e.preventDefault();
  const petugas = document.getElementById("petugasPiket").value;
  if (!petugas) { alert("Harap isi nama Petugas Piket terlebih dahulu!"); return; }

  const payload = {
    tipe: "siswa",
    tanggal: new Date().toLocaleString("id-ID"),
    petugas_piket: petugas,
    nama_siswa: document.getElementById("selectSiswa").value,
    jam_ke: document.getElementById("siswaJamKe").value,
    status_keterangan: document.getElementById("siswaStatus").value
  };

  await sendData(payload, "simpan_laporan_siswa");
  e.target.reset();
}

// Kirim Data / Auto Offline Fallback
async function sendData(payload, action) {
  if (navigator.onLine) {
    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ action: action, ...payload })
      });
      const data = await res.json();
      if (data.status === "success") {
        alert(" Data berhasil disimpan langsung ke Spreadsheet!");
        return;
      }
    } catch (e) {
      console.log("Error koneksi, menyimpan offline...", e);
    }
  }

  // Jika offline
  saveToLocalStorage(payload);
  alert(" Koneksi tidak stabil/offline. Data tersimpan di HP!");
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
    banner.classList.remove("hidden");
    if(textCount) textCount.innerText = `${list.length} Catatan Tersimpan di HP`;

    let html = "";
    list.forEach((item, idx) => {
      let sub = item.tipe === "guru" ? item.nama_guru_mapel : item.nama_siswa;
      html += `
        <div class="p-2.5 bg-slate-50 border rounded-lg flex justify-between items-center">
          <div>
            <span class="font-bold text-indigo-600 uppercase text-[10px] px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 rounded">${item.tipe}</span>
            <span class="font-medium text-slate-700 ml-1">${sub}</span>
            <p class="text-[11px] text-slate-500">${item.status || item.status_keterangan} (Jam Ke: ${item.jam_ke})</p>
          </div>
          <span class="text-[10px] text-slate-400">#${idx + 1}</span>
        </div>
      `;
    });
    container.innerHTML = html;
  } else {
    banner.classList.add("hidden");
    container.innerHTML = `<p class="text-slate-400 italic">Tidak ada catatan offline terpending.</p>`;
  }
}

// BATCH UPLOAD: Mengupload SEMUA catatan offline sekaligus
async function uploadDataOffline() {
  let list = JSON.parse(localStorage.getItem("offline_queue")) || [];

  if (list.length === 0) {
    alert("Tidak ada data offline untuk diunggah.");
    return;
  }

  const btn = document.getElementById("btnUploadBatch");
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> Mengupload...`;

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
      alert(` Berhasil mengunggah total ${list.length} catatan ke Google Spreadsheet!`);
      localStorage.removeItem("offline_queue");
      renderOfflineList();
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    alert("Gagal mengunggah data offline. Pastikan koneksi internet stabil!");
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-upload"></i> Upload Sekarang`;
  }
}

function clearOfflineData() {
  if (confirm("Apakah Anda yakin ingin menghapus seluruh catatan offline dari HP?")) {
    localStorage.removeItem("offline_queue");
    renderOfflineList();
  }
}
