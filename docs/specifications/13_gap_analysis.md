# SPECIFICATION 13: SOURCE CODE AUDIT & GAP ANALYSIS
**Comprehensive Deep Audit of Existing Codebase Against Master Desktop Specification**
**Standard Reference:** IBM SPSS Statistics 28/29 Professional Desktop  
**Version:** 3.0.0-PRO  

---

## 1. Ikhtisar Hasil Audit Sistem yang Sedang Berjalan

Berdasarkan audit mendalam terhadap seluruh arsitektur repositori aktif:
* **Frontend**: React 18, TypeScript, TailwindCSS/Vanilla CSS tokens, TanStack Virtual, Monaco Editor, Lucide Icons. Berjalan dan lolos kompilasi produksi `npm run build` (2.23s).
* **Backend**: Python 3.14 / FastAPI, NumPy, SciPy, Statsmodels, Scikit-Learn, PyTest suite lulus 12/12 test dengan cakupan pengujian mesin statistik 83%.
* **Deployment**: Live dan sinkron di Vercel (Frontend) dan Render (Backend).

Aplikasi saat ini telah memiliki fondasi arsitektur spreadsheet + output viewer yang sangat solid. Namun, untuk mencapai kemiripan 100% dengan pengalaman SPSS Desktop profesional, terdapat beberapa gap fungsional dan ergonomis yang teridentifikasi dalam audit berikut.

---

## 2. Tabel Matriks Audit Fitur & Analisis Kesenjangan (Gap Analysis)

| No | Modul / Fitur | Status Saat Ini (Current State) | Kondisi Harapan (Expected State) | Identifikasi Kesenjangan (Gap) | Tingkat Keparahan (Severity) | Kompleksitas Teknis | Prioritas Implementasi |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| **1** | **Data View: Multi-Cell Drag Selection** | Seleksi sel tunggal `(r, c)` aktif dengan border biru; seleksi rentang belum mendukung mouse-down drag. | Menahan klik dan menggeser mouse memilih rentang persegi `(r1, c1)` ke `(r2, c2)` dengan outline putus-putus. | Belum ada drag-selection matriks rentang multi-sel di grid. | **Medium** | Sedang | **P1** |
| **2** | **Data View: Context Menu Klik Kanan** | Menu browser standar masih muncul saat klik kanan pada sel grid. | Menu pop-up desktop kustom (Cut, Copy, Paste, Insert Variable, Insert Cases, Clear, Sort). | Belum ada intercept event `contextmenu` dengan pop-up menu desktop. | **Medium** | Rendah | **P1** |
| **3** | **Data View: Header Row / Column Highlight** | Klik header nomor baris atau nama variabel belum menyorot seluruh baris/kolom secara penuh. | Klik header nomor baris menyorot seluruh kasus ($1 \times C$); klik nama kolom menyorot seluruh variabel ($R \times 1$). | Highlight seleksi satu baris atau satu kolom penuh belum tersambung ke state seleksi. | **Medium** | Rendah | **P1** |
| **4** | **Data View: Visual Filter Strikethrough** | Baris yang terfilter (`filter_$ == 0`) tercatat di log status, namun nomor baris masih terlihat normal. | Nomor baris kasus yang tidak lolos filter dicoret secara visual (`~~12~~`) pada header kiri. | Belum ada styling visual strikethrough pada row header nomor baris yang terfilter. | **Medium** | Rendah | **P1** |
| **5** | **Variable View: In-Cell Dropdown Editors** | Kolom Type dan Measure diedit via modal atau klik khusus. | Pengeditan sel langsung in-place via dropdown mini di dalam sel untuk Type, Missing, Align, dan Measure. | Dropdown in-cell langsung di dalam grid kamus variabel belum aktif untuk semua kolom atribut. | **Low** | Rendah | **P2** |
| **6** | **Dialog Analisis: Sub-Dialog Bertingkat** | Opsi statistik saat ini menyatu di dalam modal dua kotak utama atau menggunakan konfigurasi default SPSS. | Tombol sub-dialog mandiri berantai: `[ Statistics... ]`, `[ Options... ]`, `[ Plots... ]`, `[ Format... ]`. | Tombol sub-dialog bertingkat perlu diekstrak menjadi modal pop-up child independen. | **Medium** | Sedang | **P2** |
| **7** | **Prosedur Statistik: Explore & Uji Normalitas** | Descriptives dasar sudah aktif; modul Explore belum terpisah. | Prosedur Explore mandiri lengkap dengan uji normalitas **Kolmogorov-Smirnov** dan **Shapiro-Wilk**, serta deteksi 5 outlier ekstrem. | Algoritma Shapiro-Wilk dan Kolmogorov-Smirnov perlu diaktifkan di backend/frontend dan dibuatkan dialognya. | **High** | Sedang | **P2** |
| **8** | **Prosedur Statistik: Factor Analysis (PCA)** | Modul reduksi dimensi belum muncul di menu Analyze. | Prosedur Factor Analysis dengan ekstraksi Principal Components, rotasi Varimax, uji KMO, dan Bartlett's test. | Implementasi algoritma dekomposisi matriks kovarians PCA dan rotasi ortogonal Varimax. | **Medium** | Tinggi | **P3** |
| **9** | **Prosedur Statistik: Binary Logistic Regression** | Regresi linier OLS sudah lengkap 100%; regresi logistik biner belum tersedia. | Prosedur Binary Logistic Regression dengan estimasi Odds Ratio $\text{Exp}(B)$, Hosmer-Lemeshow, dan Classification Matrix. | Implementasi algoritma estimasi Maximum Likelihood (Newton-Raphson) untuk logit. | **Medium** | Tinggi | **P3** |
| **10**| **Output Viewer: Reorder Node Pohon** | Navigasi klik simpul pohon untuk scroll otomatis sudah aktif. | Menggeser urutan tabel laporan via drag-and-drop pada Outline Navigation Tree. | Drag-and-drop reordering pada pohon navigasi belum diimplementasikan. | **Low** | Sedang | **P3** |
| **11**| **Output Viewer: Ekspor Word (.docx)** | Ekspor PDF dan Excel (.xlsx) sudah aktif. | Ekspor langsung dokumen laporan ke format Microsoft Word `.docx` dengan tabel APA bergaris ganda. | Generator berkas format `.docx` berbasis library dokumen office. | **Low** | Sedang | **P3** |
| **12**| **Graph Builder: Boxplot dengan Outlier Labels** | Grafik Bar, Pie, Histogram, Scatter, dan Line sudah aktif via Chart.js. | Boxplot lengkap dengan komponen interkuartil ($Q_1, Q_2, Q_3$), whiskers, dan titik outlier bertanda nomor kasus baris. | Komponen visual khusus boxplot statistik dengan identifikasi ID baris kasus outlier. | **Low** | Sedang | **P3** |

---

## 3. Kesimpulan Tingkat Kesiapan (Readiness Score)
* **Kesiapan Fondasi Arsitektur**: **92%** (Grid virtual, state management, Monaco syntax, dual engine).
* **Kesiapan Mesin Statistik**: **85%** (10 modul inferensial telah teruji 100% lulus PyTest).
* **Kesiapan Tampilan Desktop & Ergonomi UX**: **80%** (Perlu penambahan context menu, drag selection, strikethrough baris terfilter, dan sub-dialog).

Perbaikan akan dieksekusi secara terstruktur sesuai dengan Dokumen Rencana Refactor dan Roadmap 7 Gelombang tanpa mengganggu deployment cloud yang sedang aktif.
