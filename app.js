const SCRIPT_URL = "PASANG_URL_WEB_APP_HASIL_DEPLOY_BARU_DI_SINI";

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

// FUNGSI MEMBERSIHKAN FORMAT JAM ISO (SEPERTI 1899-12-30T...)
function formatJamDisplay(val) {
  if (!val || val === '-') return '-';
  var str = val.toString();
  if (str.includes('T') && str.includes('Z')) {
    try {
      var d = new Date(str);
      var jam = String(d.getHours()).padStart(2, '0');
      var menit = String(d.getMinutes()).padStart(2, '0');
      return jam + ":" + menit;
    } catch(e) {
      return str;
    }
  }
  return str;
}

// 2. AMBIL DATA DARI SPREADSHEET & RENDER REKAP
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
                <th class="p-2 border-r">Waktu</th>
                <th class="p-2 border-r">Petugas Piket</th>
                <th class="p-2 border-r">Guru & Mapel</th>
                <th class="p-2 border-r text-center">Jam Ke</th>
                <th class="p-2 border-r text-center">Jam Masuk</th>
                <th class="p-2 border-r text-center">Status</th>
                <th class="p-2">Tugas / Materi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white text-slate-700">`;

        for (let i = data.guru.length - 1; i >= 1; i--) {
          const r = data.guru[i];
          const jamClean = formatJamDisplay(r[4]);
          html += `
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="p-2 border-r text-slate-500 whitespace-nowrap text-[11px]">${r[0] || '-'}</td>
              <td class="p-2 border-r font-medium text-slate-800">${r[1] || '-'}</td>
              <td class="p-2 border-r font-semibold text-indigo-950">${r[2] || '-'}</td>
              <td class="p-2 border-r text-center whitespace-nowrap">${r[3] || '-'}</td>
              <td class="p-2 border-r text-center whitespace-nowrap font-medium text-slate-700">${jamClean}</td>
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
                <th class="p-2 border-r">Waktu</th>
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
      html += `</div></div>`;

      container.innerHTML = html;
    }
  } catch (err) {
    container.innerHTML = `<div class="p-4 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg text-center">Gagal memuat data laporan dari Spreadsheet.</div>`;
  }
}

// 3. FUNGSI EKSPOR KE PDF
window.exportToPDF = function() {
  const element = document.getElementById('pdfExportArea');
  if (!element) return;

  const opt = {
    margin:       8,
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

// FUNGSI UTAMA KIRIM DATA
async function sendDataToServer(payload) {
  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload)
    });
    alert("Laporan berhasil dikirim ke Google Spreadsheet!");
  } catch (err) {
    alert("Gagal mengirim data. Pastikan koneksi internet terhubung.");
  }
}
