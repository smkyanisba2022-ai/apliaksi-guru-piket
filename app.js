// GANTI DENGAN URL WEB APP HASIL DEPLOY BARU
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzNvQXcypmUlXTgQAClC5-5c198IaeiHPoCT081vYo4uX5fd8qVJfdDkr0_jwe0-k4Y/exec";

let masterSiswa = [];
let masterGuru = [];

// 1. FUNGSI SWITCH TAB
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

  const defaultClass = "flex-1 py-2 text-center font-semibold text-xs rounded-lg text-slate-600 hover:bg-slate-100 transition-all cursor-pointer";
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

document.addEventListener("DOMContentLoaded", () => {
  setupRealtimeClock();
  checkOnlineStatus();
  loadMasterData();
  renderOfflineList();

  window.addEventListener("online", checkOnlineStatus);
  window.addEventListener("offline", checkOnlineStatus);
});

function setupRealtimeClock() {
  const el = document.getElementById("tanggalWaktu");
  const update = () => {
    const now = new Date();
    if (el) el.value = now.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
  };
  update();
  setInterval(update, 1000);
}

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

// 2. AMBIL DATA REKAP & SIMPAN KE PANTAU
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
      let html = "";

      // Tombol Cetak PDF
      html += `
      <div class="flex justify-end mb-3">
        <button type="button" onclick="exportToPDF()" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer">
          <i class="fa-solid fa-file-pdf"></i> Simpan Rekap PDF
        </button>
      </div>
      <div id="pdfExportArea" class="space-y-4">`;

      // --- TABEL REKAP GURU ---
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
                <th class="p-2 border-r">Tanggal/Waktu</th>
                <th class="p-2 border-r">Petugas Piket</th>
                <th class="p-2 border-r">Guru & Mapel</th>
                <th class="p-2 border-r text-center">Jam Ke</th>
                <th class="p-2 border-r text-center">Jam Masuk</th>
                <th class="p-2 border-r text-center">Status</th>
                <th class="p-2">Tugas/Materi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white text-slate-700">`;

        for (let i = data.guru.length - 1; i >= 1; i--) {
          const r = data.guru[i];
          html += `
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="p-2 border-r text-slate-500 whitespace-nowrap text-[11px]">${r[0] || '-'}</td>
              <td class="p-2 border-r font-medium text-slate-800">${r[1] || '-'}</td>
              <td class="p-2 border-r font-semibold text-indigo-950">${r[2] || '-'}</td>
              <td class="p-2 border-r text-center whitespace-nowrap">${r[3] || '-'}</td>
              <td class="p-2 border-r text-center whitespace-nowrap text-slate-500">${r[4] || '-'}</td>
              <td class="p-2 border-r text-center whitespace-nowrap">
                <span class="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold text-[10px]">${r[5] || '-'}</span>
              </td>
              <td class="p-2 text-slate-600">${r[6] || '-'}</td>
            </tr>`;
        }
        html += `</tbody></table></div>`;
      } else {
        html += `<p class="text-xs text-slate-400 italic py-3 text-center bg-slate-50 rounded-lg">Belum ada laporan guru.</p>`;
      }
      html += `</div>`;

      // --- TABEL REKAP SISWA ---
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
                <th class="p-2 border-r">Tanggal/Waktu</th>
                <th class="p-2 border-r">Petugas Piket</th>
                <th class="p-2 border-r">Siswa & Kelas</th>
                <th class="p-2 border-r text-center">Jam Ke</th>
                <th class="p-2 text-center">Keterangan</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white text-slate-700">`;

        for (let i = data.siswa.length - 1; i >= 1; i--) {
          const r = data.siswa[i];
          html += `
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="p-2 border-r text-slate-500 whitespace-nowrap text-[11px]">${r[0] || '-'}</td>
              <td class="p-2 border-r font-medium text-slate-800">${r[1] || '-'}</td>
              <td class="p-2 border-r font-semibold text-slate-900">${r[2] || '-'}</td>
              <td class="p-2 border-r text-center whitespace-nowrap">${r[3] || '-'}</td>
              <td class="p-2 text-center whitespace-nowrap">
                <span class="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-semibold text-[10px]">${r[4] || '-'}</span>
              </td>
            </tr>`;
        }
        html += `</tbody></table></div>`;
      } else {
        html += `<p class="text-xs text-slate-400 italic py-3 text-center bg-slate-50 rounded-lg">Belum ada laporan siswa.</p>`;
      }
      html += `</div></div>`; // Tutup pdfExportArea

      container.innerHTML = html;
    }
  } catch (err) {
    container.innerHTML = `<div class="p-4 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg text-center">Gagal memuat data laporan dari Spreadsheet.</div>`;
  }
}

// 3. FITUR EXPORT REKAP KE PDF
window.exportToPDF = function() {
  const element = document.getElementById('pdfExportArea');
  if (!element) return;

  const opt = {
    margin:       10,
    filename:     `Rekap_Piket_${new Date().toISOString().slice(0,10)}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
  };

  html2pdf().set(opt).from(element).save();
};

// 4. PENANGANAN SUBMIT FORM
window.handleSubmitedGuru = async function(e) {
  e.preventDefault();
  const petugas = document.getElementById("petugasPiket").value.trim();
  const namaGuru = document.getElementById("selectGuru").value;
  const mapel = document.getElementById("selectGuruMapel").value;
  const jamKe = document.getElementById("guruJamKe").value;
  const status = document.getElementById("guruStatus").value;

  if (!petugas || !namaGuru || !mapel || !jamKe || !status) {
    alert("Harap lengkapi semua isian Form Guru!");
    return;
  }

  const payload = {
    action: "simpan_laporan_guru",
    tanggal: new Date().toLocaleString("id-ID"),
    petugas_piket: petugas,
    nama_guru_mapel: `${namaGuru} [${mapel}]`,
    jam_ke: jamKe,
    jam_masuk: document.getElementById("guruJamMasuk")?.value || '-',
    status: status,
    tugas_materi: document.getElementById("guruTugas")?.value || '-'
  };

  await sendDataToServer(payload);
  e.target.reset();
};

window.handleSubmitedSiswa = async function(e) {
  e.preventDefault();
  const petugas = document.getElementById("petugasPiket").value.trim();
  const namaSiswa = document.getElementById("selectSiswa").value;
  const jamKe = document.getElementById("siswaJamKe").value;
  const status = document.getElementById("siswaStatus").value;

  if (!petugas || !namaSiswa || !jamKe || !status) {
    alert("Harap lengkapi semua isian Form Siswa!");
    return;
  }

  const payload = {
    action: "simpan_laporan_siswa",
    tanggal: new Date().toLocaleString("id-ID"),
    petugas_piket: petugas,
    nama_siswa: namaSiswa,
    jam_ke: jamKe,
    status_keterangan: status
  };

  await sendDataToServer(payload);
  e.target.reset();
};

// FUNGSI UTAMA KIRIM DATA SECARA ONLINE / OFFLINE
async function sendDataToServer(payload) {
  if (navigator.onLine) {
    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload)
      });
      alert("Laporan berhasil tersimpan ke Google Spreadsheet!");
      return;
    } catch (err) {
      console.error(err);
    }
  }

  // Simpan Offline jika koneksi gagal
  let list = JSON.parse(localStorage.getItem("offline_queue")) || [];
  list.push(payload);
  localStorage.setItem("offline_queue", JSON.stringify(list));
  alert("Data tersimpan sementara di memori offline HP/Laptop!");
  renderOfflineList();
}

// 5. MASTER DATA & OFFLINE QUEUE
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
      if (n) html += `<option value="${n}${k ? ' - ' + k : ''}">${n}${k ? ' - ' + k : ''}</option>`;
    });
    selectSiswa.innerHTML = html;
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

function renderOfflineList() {
  const banner = document.getElementById("offlineBanner");
  const textCount = document.getElementById("offlineCountText");
  let list = JSON.parse(localStorage.getItem("offline_queue")) || [];

  if (list.length > 0) {
    if (banner) banner.classList.remove("hidden");
    if (textCount) textCount.innerText = `${list.length} Catatan Tersimpan di HP`;
  } else {
    if (banner) banner.classList.add("hidden");
  }
}
