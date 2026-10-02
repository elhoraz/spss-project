# PHASE 1: Product Requirement Document (PRD)
**Project Codename**: StatisticaPro Enterprise (OpenSPSS Studio)  
**Document Version**: 2.0.0-ENTERPRISE  
**Authors**: Principal Software Architect & Senior Product Manager  
**Status**: APPROVED FOR IMPLEMENTATION  

---

## 1. Executive Summary & Product Vision

### 1.1 Visi Produk
StatisticaPro Enterprise adalah platform analisis statistik berbasis web kelas enterprise yang mereplikasi secara 100% fidelitas tinggi alur kerja (*workflow*), antarmuka (*UI/UX*), tata letak (*layout*), interaksi, dan format pelaporan software statistik desktop profesional standar industri (**IBM SPSS Statistics**).

### 1.2 Prinsip Desain Kritis (*Non-Negotiable Principles*)
1. **Bukan SaaS Generik / Bukan Dashboard Admin Biasa**: Dilarang menggunakan tata letak dashboard kartu/widget admin modern standar. Aplikasi harus mempertahankan paradigma desktop windowed software dengan:
   - Top Menu Bar hierarkis (File, Edit, View, Data, Transform, Analyze, Graphs, Utilities, Extensions, Window, Help)
   - Ribbon/Toolbar aksi cepat desktop
   - Formula/Active Cell status bar
   - Workspace terpusat dengan tab navigasi bawah (*Data View*, *Variable View*, *Output Viewer*, *Syntax Editor*)
   - Bottom status bar interaktif (*Processor status, Cases, Variables, Filter status, Weight status, Split status*)
2. **Spreadsheet + Output Viewer Paradigm**: Data dan variabel dikelola dalam spreadsheet berkinerja tinggi, sedangkan keluaran statistik disajikan dalam panel terpisah dengan navigasi pohon hierarkis (*tree outline*) dan tabel pivot standar APA/SPSS.
3. **Enterprise Readiness**: Mampu menangani hingga minimal 100.000 baris dan 500 kolom dengan rendering tervirtualisasi (*virtualized rendering*), autentikasi JWT + refresh token, audit trail, dan penyimpanan berkas terdistribusi MinIO/S3.

---

## 2. Target Persona & User Stories

### 2.1 Persona Pengguna
| Persona | Latar Belakang | Kebutuhan Utama | Rasa Frustrasi Saat Ini |
|---|---|---|---|
| **Dr. Aris (Biostatistician & Dosen)** | Peneliti klinis & dosen metode kuantitatif selama 15 tahun. | Menjalankan uji parametrik (ANOVA, T-Test) dan non-parametrik (Mann-Whitney, Kruskal-Wallis) dengan tabel output yang langsung siap dimasukkan ke jurnal Scopus/APA. | Software web modern sering menyederhanakan output, menghilangkan statistik penting seperti Levene test, standard error difference, atau confidence interval. |
| **Maya (Data Analyst Lembaga Survei)** | Praktisi riset pasar dan opini publik. | Pengolahan kuesioner ribuan responden: koding variabel (*Value Labels*), bobot kasus (*Weight Cases*), pemisahan berkas (*Split File*), dan tabulasi silang (*Crosstabs*). | Tool modern berbasis Python/R membutuhkan penulisan kode manual untuk hal sederhana seperti pelabelan nilai kategori dan tabulasi silang. |
| **Budi (Mahasiswa Pascasarjana)** | Menyelesaikan tesis magister manajemen/psikologi. | Uji reliabilitas instrumen (*Cronbach's Alpha*), analisis regresi berganda, impor data survei dari Excel/Google Forms, dan ekspor laporan ke PDF. | Lisensi software desktop berbiaya tinggi dan keterbatasan instalasi pada perangkat laptop non-Windows (macOS/Linux/Chromebook). |

---

## 3. Cakupan Fitur Produk (Functional Scope)

### 3.1 Workspace Spreadsheet: Data View & Variable View
- **Data View**:
  - Grid spreadsheet tervirtualisasi (*virtual scrolling*) mendukung 100.000+ baris dan 500+ kolom tanpa penurunan frame rate (tetap 60 FPS).
  - Navigasi keyboard penuh (*Arrow keys*, *Tab*, *Enter*, *Shift+Selection*, *Page Up/Down*).
  - Copy, paste, multi-paste range, dan drag fill down.
  - Penomoran baris otomatis dan header kolom menampilkan nama variabel serta simbol tipe pengukuran (*Scale ruler, Ordinal bars, Nominal pie*).
  - Toggle cepat *Value Labels* (menampilkan nilai mentah `1` atau label `"Laki-laki"`).
- **Variable View**:
  - Tabel 11 kolom metadata SPSS:
    1. `Name`: Identifier unik variabel (validasi alphanumeric, tidak diawali angka).
    2. `Type`: `Numeric`, `String`, `Date`, `Currency`, `Percentage`.
    3. `Width`: Lebar kolom tampilan.
    4. `Decimals`: Presisi desimal (0-10).
    5. `Label`: Keterangan lengkap variabel.
    6. `Values`: Editor dialog *Value Labels* (contoh: `1 = Rendah, 2 = Sedang, 3 = Tinggi`).
    7. `Missing`: Definisi penanganan data kosong (*Discrete missing values*).
    8. `Columns`: Lebar karakter di Data View.
    9. `Align`: `Left`, `Right`, `Center`.
    10. `Measure`: `Scale`, `Ordinal`, `Nominal`.
    11. `Role`: `Input`, `Target`, `Both`, `None`, `Partition`, `Split`.
  - Setiap perubahan di Variable View secara reaktif langsung mempengaruhi Data View.

### 3.2 Manajemen Data (Data Management)
- **Sort Cases**: Pengurutan satu atau lebih variabel (*Ascending / Descending*).
- **Split File**: Membagi analisis berdasarkan kategori variabel kelompok (*Compare groups / Organize output by groups*).
- **Weight Cases**: Memberikan bobot frekuensi pada setiap baris kasus berdasarkan variabel pembobot.
- **Select Cases**: Filter kondisional berbasis kriteria logika (contoh: `salary > 30000 AND gender == 'f'`).
- **Merge Files**: Menggabungkan dataset berdasarkan kasus baru (*Add Cases*) atau variabel baru (*Add Variables dengan Key Variable*).
- **Aggregate**: Menghitung ringkasan statistik (Mean, Sum, N) berdasarkan variabel pemecah (*Break Variable*).
- **Transpose & Restructure**: Mengubah baris menjadi kolom atau mentransformasi data *wide format* ke *long format*.
- **Data Validation & Missing Value Imputation**: Validasi batas nilai dan imputasi otomatis data kosong (Mean imputation, Median, Interpolasi).

### 3.3 Import & Export Multi-Format
- **Import**: CSV, XLSX, XLS, TSV, JSON dengan wizard 5 tahap:
  1. *Upload* berkas (drag-and-drop / selector)
  2. *Preview* 10 baris pertama
  3. *Column Mapping* & auto-detect tipe data (Numeric, String, Date, Boolean)
  4. *Validation*
  5. *Import Execution*
- **Export**:
  - Dokumen Laporan: PDF, Word (DOCX), HTML, Print.
  - Dataset: Excel (.xlsx multi-sheet Data & Variable View), CSV, JSON.

### 3.4 Mesin Analisis Statistik Lengkap
1. **Descriptive Statistics**: Mean, Median, Mode, Variance, Std Deviation, Range, Min, Max, SE Mean, Skewness, Kurtosis.
2. **Frequencies**: Tabel frekuensi, Percent, Valid Percent, Cumulative Percent, Pie Chart, Histogram dengan kurva normal.
3. **Crosstabs**: Tabel kontingensi 2 arah, Expected Count, Row %, Column %, Total %, Pearson Chi-Square, Likelihood Ratio, Linear-by-Linear Association.
4. **Correlations**: Matriks korelasi bivariat Pearson, Spearman rho, Kendall tau-b, 2-tailed significance, tanda bintang signifikansi (`* p<0.05`, `** p<0.01`).
5. **T-Tests**:
   - *One-Sample T Test*: Perbandingan rata-rata terhadap nilai hipotesis (*Test Value*).
   - *Independent-Samples T Test*: Levene's Test for Equality of Variances, Student's t-test, Welch's t-test, Mean Difference, 95% Confidence Interval.
   - *Paired-Samples T Test*: Statistik berpasangan, korelasi berpasangan, selisih rata-rata, uji-t berpasangan.
6. **ANOVA (Analysis of Variance)**:
   - *One-Way ANOVA*: Descriptives per kelompok, ANOVA Table (Between/Within Groups SS, df, MS, F, Sig), Post-Hoc Tests (Tukey HSD, Bonferroni).
   - *Two-Way Factorial ANOVA*: Main effects, interaction effect, dan error term.
7. **Linear & Multiple Regression**:
   - *Model Summary*: $R$, $R^2$, Adjusted $R^2$, Std. Error of the Estimate, Durbin-Watson.
   - *ANOVA Table*: Sum of Squares, df, Mean Square, F-statistic, Sig.
   - *Coefficients Table*: Unstandardized Coefficients ($B, SE$), Standardized Beta ($\beta$), t-value, Sig, 95% CI, Collinearity Statistics (Tolerance, VIF).
8. **Reliability Analysis**:
   - Uji reliabilitas instrumen kuesioner dengan **Cronbach's Alpha**, Mean skala, Varian skala, dan tabel *Item-Total Statistics* (Cronbach's Alpha if item deleted).
9. **Non-Parametric Tests**:
   - *Mann-Whitney U Test* (Uji beda 2 kelompok independen non-parametrik).
   - *Wilcoxon Signed-Rank Test* (Uji beda 2 sampel berpasangan).
   - *Kruskal-Wallis H Test* (Uji beda multi-kelompok non-parametrik).

### 3.5 Output Viewer
- **Hierarchical Outline Tree** (panel kiri):
  - Memetakan setiap sesi analisis dengan struktur pohon (Output $\rightarrow$ Procedure $\rightarrow$ Log $\rightarrow$ Notes $\rightarrow$ Pivot Table / Chart).
  - Fitur: Expand/Collapse simpul, klik untuk navigasi langsung (*smooth scroll*), ubah nama simpul, hapus simpul, simpan output ke database.
- **Report Document Sheet** (panel kanan):
  - Menampilkan log sintaks monospace.
  - Tabel Pivot format standar APA (garis ganda horizontal atas dan bawah, baris judul gelap, baris total tegas, perataan angka kanan).
  - Grafik visual interaktif dengan kemampuan kustomisasi warna dan ekspor.

### 3.6 Syntax Editor (Monaco Editor Integration)
- Editor kode berbasis **Monaco Editor** (engine yang sama dengan VS Code).
- Penyorotan sintaks (*syntax highlighting*) untuk kata kunci SPSS (`FREQUENCIES`, `DESCRIPTIVES`, `CROSSTABS`, `CORRELATIONS`, `T-TEST`, `ANOVA`, `REGRESSION`, `RELIABILITY`, `NPAR TESTS`).
- Auto-complete untuk perintah dan nama variabel dalam dataset aktif.
- Tombol aksi: **Run Selection**, **Run All**, **Save Script**, **Open Script**.
- Integritas dua arah: tombol *Paste* pada dialog analisis langsung memformat perintah ke Syntax Editor.

### 3.7 Graph Builder
- Pembuatan grafik visual: Bar Chart, Pie Chart, Histogram, Scatter Plot, Line Chart, Area Chart, Boxplot.
- Konfigurasi variabel sumbu X dan Y, grouping variabel, pengeditan judul, palet warna.
- Ekspor grafik ke PNG, SVG, dan PDF vektor resolusi tinggi.

---

## 4. Kebutuhan Non-Fungsional (Non-Functional Requirements)

| Kategori | Metrik & Spesifikasi |
|---|---|
| **Kapasitas & Skalabilitas** | Mampu memuat dan mengolah minimal 100.000 baris x 500 kolom data. Waktu inisialisasi render < 2 detik melalui TanStack Virtualization. |
| **Keamanan** | Autentikasi berbasis JWT (Access Token 15 menit) + Refresh Token (7 hari tersimpan HTTP-only cookie). Proteksi CSRF, Rate Limiting (100 req/min), enkripsi sandi bcrypt, dan Audit Trail pencatatan aksi data. |
| **Ketersediaan & Reliabilitas** | 99.9% Uptime dengan health checks kontainer otomatis. Dual-engine fallback: komputasi klien tetap berfungsi jika server terputus sementara. |
| **Kompatibilitas Platform** | Responsif pada resolusi 1366x768 hingga 4K. Kompatibel dengan Google Chrome 110+, Edge 110+, Firefox 115+, Safari 16+. |
| **Testing Coverage** | Minimum 80% coverage pada unit testing algoritma statistik dan pengujian integrasi API. |
