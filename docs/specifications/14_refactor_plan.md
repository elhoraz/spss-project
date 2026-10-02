# SPECIFICATION 14: IMPLEMENTATION ROADMAP & REFACTOR PLAN
**7-Wave Phased Architecture Execution Plan, Risk Mitigation & Quality Assurance Gates**
**Standard Reference:** IBM SPSS Statistics 28/29 Professional Desktop  
**Version:** 3.0.0-PRO  

---

## 1. Roadmap 7 Gelombang (Wave-by-Wave Architecture Roadmap)

```
[ WAVE 1: Critical Desktop UX & Ergonomics ] ───► Paling mendesak untuk nuansa desktop
  ├── Context Menu Desktop Klik Kanan (Cut, Copy, Paste, Insert, Clear, Sort)
  ├── Full Row & Column Header Selection Highlights
  └── Row-Number Strikethrough Visuals untuk Kasus Terfilter (filter_$ == 0)

[ WAVE 2: Data Editor & Variable View Polish ]
  ├── Multi-Cell Drag Range Selection Matrix [(r1, c1) -> (r2, c2)]
  └── In-Cell Instant Dropdown Editors untuk Atribut Variable View

[ WAVE 3: Analysis Dialog Sub-Windows System ]
  ├── Sub-Dialog Modals Bertingkat: [ Statistics... ], [ Plots... ], [ Options... ]
  └── Memory State Synchronization antar Sub-Dialog

[ WAVE 4: Prosedur Analisis Statistik Lanjutan ]
  ├── Modul Explore (Uji Normalitas Kolmogorov-Smirnov & Shapiro-Wilk)
  ├── Modul Factor Analysis (PCA dengan Varimax Rotation)
  └── Modul Binary Logistic Regression (Odds Ratio Exp(B) & Hosmer-Lemeshow)

[ WAVE 5: Output Viewer Enhancements ]
  ├── Drag-and-Drop Reordering pada Outline Navigation Tree
  └── Ekspor Dokumen Laporan Statistik ke Format Word (.docx)

[ WAVE 6: Graph Builder Advanced Analytics ]
  ├── Boxplot Interaktif dengan Penanda Nomor Kasus Outlier
  └── Kurva Gaussian Normal Overlay pada Histogram

[ WAVE 7: Enterprise Governance & Collaboration ]
  ├── Session State Persistence & Automatic Recovery
  └── Audit Trail Logging untuk Setiap Manipulasi Data & Sintaks
```

---

## 2. Rincian Eksekusi Per Gelombang (Alasan, Dampak, Risiko, Rencana Uji)

---

### GELOMBANG 1 (WAVE 1): CRITICAL DESKTOP UX & ERGONOMICS
* **Item Perubahan**:
  1. Desktop Context Menu saat klik kanan pada sel grid dan header kolom/baris.
  2. Full Row Selection dan Full Column Selection saat header diklik.
  3. Indikator visual coret nomor baris (`~~12~~`) pada kasus yang tidak lolos filter (`filter_$ == 0`).
* **1. Alasan**:
  Saat ini klik kanan masih memunculkan menu browser default yang merusak ilusi desktop workstation. Selain itu, pengguna SPSS sangat bergantung pada indikator visual baris terfilter untuk memastikan keabsahan data sebelum analisis.
* **2. Dampak**:
  - `frontend/src/components/DataViewGrid.tsx` diperluas dengan event handler `onContextMenu`.
  - Komponen baru `frontend/src/components/GridContextMenu.tsx`.
  - Header nomor baris membaca status `filter_$` per kasus dan menambahkan class CSS `.filtered-case-header`.
* **3. Risiko**:
  Benturan antara default browser context menu dan pop-up custom; kemungkinan pop-up muncul di luar layar viewport.
  *Mitigasi*: Menggunakan `e.preventDefault()` dan kalkulasi batas `clientX, clientY` agar menu selalu berada di dalam viewport window.
* **4. Rencana Implementasi**:
  - Membuat context menu component dengan opsi standar.
  - Menghubungkan aksi Cut/Copy/Paste/Clear ke state store `useDatasetStore.ts`.
  - Menambahkan styling visual `.strikethrough-header`.
* **5. Rencana Pengujian (Test Plan)**:
  - Klik kanan pada sel sembarang memunculkan menu desktop.
  - Klik *Insert Case* menyisipkan baris baru di posisi yang benar.
  - Mengaktifkan filter dan memverifikasi baris terfilter memiliki nomor baris yang dicoret.
* **6. Kriteria Verifikasi**:
  Seluruh aksi context menu berfungsi normal; nol error pada konsol browser.

---

### GELOMBANG 2 (WAVE 2): DATA EDITOR & VARIABLE VIEW POLISH
* **Item Perubahan**:
  1. Multi-cell drag range selection matrix.
  2. In-cell instant dropdown editors untuk atribut `Type`, `Missing`, `Align`, dan `Measure` pada Variable View.
* **1. Alasan**:
  Di SPSS desktop, pengguna sering memilih blok sel $5 \times 3$ untuk disalin atau dihapus sekaligus, serta mengedit kamus variabel secara cepat langsung di dalam sel tanpa membuka banyak modal dialog.
* **2. Dampak**:
  - State `selectionRange: { startRow, startCol, endRow, endCol }` dicatat aktif di store.
  - Sel-sel di dalam rentang dirender dengan background biru transparan.
  - Variable View grid menyajikan dropdown mini saat sel kolom tertentu diklik dua kali.
* **3. Risiko**:
  Penurunan performa rendering jika setiap `mousemove` memicu re-render seluruh tabel.
  *Mitigasi*: Menggunakan state seleksi lokal yang terisolasi atau CSS pseudo-classes untuk menekan frekuensi re-render TanStack Virtual.
* **4. Rencana Implementasi**:
  - Pasang event listener `onMouseDown`, `onMouseEnter`, dan `onMouseUp` pada baris/sel grid.
  - Buat komponen `InlineDropdownCell.tsx` untuk Variable View.
* **5. Rencana Pengujian**:
  - Drag seleksi dari sel (1, 1) ke (5, 4) memilih 20 sel secara visual.
  - Tekan `Ctrl+C` dan paste ke Excel; format TSV harus sesuai dengan rentang yang dipilih.
* **6. Kriteria Verifikasi**:
  Operasi drag lancar pada 60 FPS tanpa jeda lag; copy-paste rentang sel terbukti presisi.

---

### GELOMBANG 3 (WAVE 3): ANALYSIS DIALOG SUB-WINDOWS SYSTEM
* **Item Perubahan**:
  Pemisahan opsi analisis menjadi tombol sub-dialog modal bertingkat: `[ Statistics... ]`, `[ Plots... ]`, `[ Options... ]`.
* **1. Alasan**:
  Dialog SPSS profesional mempertahankan dialog utama tetap bersih dan ringkas, sementara parameter teknis lanjutan didelegasikan ke jendela sub-dialog modal berantai.
* **2. Dampak**:
  - Komponen modal analisis memunculkan child dialog dengan z-index lebih tinggi.
  - State konfigurasi sub-dialog tersinkronisasi kembali ke dialog induk saat pengguna mengklik `Continue` atau dibatalkan saat pengguna mengklik `Cancel`.
* **3. Risiko**:
  State form hilang jika pengguna menutup sub-dialog secara mendadak.
  *Mitigasi*: Menggunakan draft state lokal di dalam sub-dialog yang hanya di-commit ke parent saat tombol *Continue* ditekan.
* **4. Rencana Pengujian**:
  - Buka dialog Frequencies $\rightarrow$ klik `[ Statistics... ]` $\rightarrow$ centang Median & Skewness $\rightarrow$ klik *Continue* $\rightarrow$ klik *OK*. Output harus memuat nilai Median dan Skewness.
* **5. Kriteria Verifikasi**:
  Alur navigasi sub-dialog berjalan mulus dengan keyboard (Enter untuk continue, Esc untuk cancel).

---

### GELOMBANG 4 (WAVE 4): PROSEDUR ANALISIS STATISTIK LANJUTAN
* **Item Perubahan**:
  1. Modul **Explore** (Uji Normalitas Shapiro-Wilk & Kolmogorov-Smirnov).
  2. Modul **Factor Analysis** (PCA dengan Varimax rotation).
  3. Modul **Binary Logistic Regression** (Odds Ratio $\text{Exp}(B)$ & Hosmer-Lemeshow).
* **1. Alasan**:
  Ketiga modul ini merupakan pilar wajib dalam penelitian tesis, disertasi, dan analisis psikometrik/biomedis di universitas.
* **2. Dampak**:
  - `backend/stats/statistical_engine.py` diperluas dengan fungsi matematis baru berbasis SciPy dan Statsmodels.
  - Dialog modal baru ditambahkan ke menu Analyze di frontend.
* **3. Risiko**:
  Komputasi matriks invers atau iterasi Newton-Raphson pada regresi logistik mengalami konvergensi gagal jika ada multikolinieritas sempurna.
  *Mitigasi*: Menambahkan exception handling numerik di backend yang mengembalikan pesan error informatif jika matriks singular.
* **4. Rencana Pengujian**:
  - Menulis unit test baru di `backend/tests/test_enterprise_suite.py` untuk menguji akurasi output matematis ketiga prosedur terhadap dataset benchmark SPSS resmi.
* **5. Kriteria Verifikasi**:
  Tingkat kelulusan PyTest tetap 100%; nilai koefisien matematis identik dengan output SPSS 29 hingga 3 desimal.

---

### GELOMBANG 5, 6, & 7: POLISH & ENTERPRISE
* **Wave 5**: Reordering simpul pohon output via drag-and-drop dan generator dokumen `.docx`.
* **Wave 6**: Pembuatan komponen Boxplot analitik dengan identifikasi outlier nomor baris.
* **Wave 7**: Audit trail logging persisten dan auto-recovery sesi dataset.
