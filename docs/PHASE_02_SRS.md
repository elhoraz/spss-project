# PHASE 2: Software Requirement Specification (SRS)
**Project**: StatisticaPro Enterprise  
**Document Ref**: SRS-STAT-2026-V2  
**Author**: Principal Software Architect & Senior Backend Engineer  
**Status**: APPROVED  

---

## 1. Pendahuluan & Lingkup Sistem

Dokumen Spesifikasi Kebutuhan Perangkat Lunak (*Software Requirement Specification*) ini menetapkan spesifikasi fungsional, non-fungsional, dan antarmuka teknis untuk platform StatisticaPro Enterprise.

Sistem dirancang dengan arsitektur bersih (*Clean Architecture*) 4-lapis:
1. **API Layer**: FastAPI Endpoints, CORS Middleware, Rate Limiting, Request Validation (Pydantic v2).
2. **Application Layer**: Use Cases, Command/Query handlers, Orchestrator analisis statistik.
3. **Domain Layer**: Model domain, definisi entitas, aturan validasi variabel, formula statistik murni.
4. **Infrastructure Layer**: Database PostgreSQL (SQLAlchemy 2.0), Object Storage (MinIO / S3), Token Provider (PyJWT), Statistical Libs (SciPy, Statsmodels, NumPy).

---

## 2. Spesifikasi Kebutuhan Fungsional (Functional Requirements)

### 2.1 Modul 1: Autentikasi, Keamanan, & Sesi
- **FR-AUTH-001**: Sistem harus mengimplementasikan autentikasi JWT dua lapis:
  - *Access Token*: Masa berlaku 15 menit, disematkan pada header `Authorization: Bearer <token>`.
  - *Refresh Token*: Masa berlaku 7 hari, disimpan pada cookie `HttpOnly`, `SameSite=Strict`, `Secure`.
- **FR-AUTH-002**: Password harus dienkripsi menggunakan algoritma `bcrypt` dengan cost factor 12.
- **FR-AUTH-003**: Sistem harus menyediakan endpoint `/auth/refresh` untuk rotasi token secara transparan.
- **FR-AUTH-004**: Sistem harus mencatat setiap login, pembuatan proyek, impor data, dan ekspor ke tabel `audit_logs`.

### 2.2 Modul 2: Spreadsheet Data View Engine (TanStack Virtual)
- **FR-GRID-001**: Data View harus menggunakan rendering tervirtualisasi (*windowing*) melalui `@tanstack/react-virtual` dan `@tanstack/react-table`. Hanya baris dan kolom yang terlihat pada viewport layar (+ buffer 5 baris) yang dirender ke DOM.
- **FR-GRID-002**: Mendukung minimal 100.000 baris dan 500 kolom dengan konsumsi memori browser terkontrol (< 150 MB heap).
- **FR-GRID-003**: Navigasi keyboard standar:
  - `Arrow Keys`: Pindah sel aktif.
  - `Enter`: Mulai edit sel / simpan edit dan pindah ke baris berikutnya.
  - `Tab` / `Shift+Tab`: Pindah ke kolom kanan / kiri.
  - `Ctrl+C` / `Ctrl+V`: Salin dan tempel rentang sel (single cell, range, multi-row).
- **FR-GRID-004**: Nilai sel yang diformat harus reaktif terhadap konfigurasi *Variable View* (jumlah desimal, format mata uang `$`, dan label nilai kategori).

### 2.3 Modul 3: Manajemen Variabel (Variable View)
- **FR-VAR-001**: Menyediakan 11 atribut SPSS untuk setiap kolom: `Name`, `Type`, `Width`, `Decimals`, `Label`, `Values`, `Missing`, `Columns`, `Align`, `Measure`, `Role`.
- **FR-VAR-002**: Tipe data yang didukung:
  - `Numeric`: Angka riil dengan presisi desimal terkonfigurasi.
  - `String`: Teks alfanumerik.
  - `Date`: Format tanggal standar ISO `YYYY-MM-DD`.
  - `Currency`: Nilai mata uang dengan simbol `$` dan pemisah ribuan.
  - `Percentage`: Nilai pecahan dengan format `%`.
- **FR-VAR-003**: Pengukuran variabel (*Measure*): `Scale`, `Ordinal`, `Nominal`.
- **FR-VAR-004**: Sinkronisasi dua arah: Mengubah desimal atau tipe pada Variable View langsung mengupdate aturan validasi dan representasi visual di Data View tanpa me-reload halaman.

### 2.4 Modul 4: Engine Transformasi & Manajemen Data
- **FR-DATA-001 (Sort Cases)**: Mengurutkan dataset berdasarkan satu atau beberapa kunci kolom dengan urutan ascending atau descending.
- **FR-DATA-002 (Split File)**: Membagi sesi analisis berikutnya menjadi sub-grup berdasarkan nilai variabel pemisah (*split variable*).
- **FR-DATA-003 (Weight Cases)**: Menerapkan faktor pengali frekuensi pada setiap baris kasus berdasarkan variabel bobot.
- **FR-DATA-004 (Select Cases)**: Memfilter dataset menggunakan ekspresi logika predikat, menghasilkan dataset tersaring atau kolom filter indikator.
- **FR-DATA-005 (Aggregate & Transpose)**: Menghitung metrik agregat per grup atau membalik dimensi baris dan kolom.

### 2.5 Modul 5: Mesin Analisis Statistik (Statistical Core Engine)
Setiap modul harus menghasilkan output dengan presisi 4 tempat desimal dan derajat kebebasan (*degrees of freedom*):

1. **Descriptive Statistics**:
   $$\bar{x} = \frac{1}{n} \sum_{i=1}^n x_i, \quad s^2 = \frac{1}{n-1} \sum_{i=1}^n (x_i - \bar{x})^2, \quad SE = \frac{s}{\sqrt{n}}$$
2. **Frequencies**: Perhitungan frekuensi absolut $f_i$, persentase total $P_i = \frac{f_i}{N} \times 100$, persentase valid $P_{valid} = \frac{f_i}{N_{valid}} \times 100$, dan persentase kumulatif.
3. **Crosstabs & Chi-Square**:
   $$E_{ij} = \frac{R_i \times C_j}{N}, \quad \chi^2 = \sum \frac{(O_{ij} - E_{ij})^2}{E_{ij}}, \quad df = (r-1)(c-1)$$
4. **Bivariate Correlation**:
   $$r_{xy} = \frac{\sum (x_i - \bar{x})(y_i - \bar{y})}{\sqrt{\sum (x_i - \bar{x})^2 \sum (y_i - \bar{y})^2}}$$
   Menyediakan uji Pearson, Spearman $\rho$, dan Kendall $\tau_b$ beserta signifikansi 2-tailed.
5. **T-Tests**:
   - *One Sample T-Test*: $t = \frac{\bar{x} - \mu_0}{s / \sqrt{n}}$, $df = n-1$.
   - *Independent Samples T-Test*: Uji kesetaraan varians Levene ($F$ dan $p$), uji-t Student untuk varians sama, dan uji-t Welch-Satterthwaite untuk varians tidak sama:
     $$df_{Welch} = \frac{\left(\frac{s_1^2}{n_1} + \frac{s_2^2}{n_2}\right)^2}{\frac{(s_1^2/n_1)^2}{n_1-1} + \frac{(s_2^2/n_2)^2}{n_2-1}}$$
   - *Paired Samples T-Test*: $t = \frac{\bar{d}}{s_d / \sqrt{n}}$, $df = n-1$.
6. **One-Way ANOVA & Post Hoc**:
   $$SS_{total} = SS_{between} + SS_{within}, \quad F = \frac{MS_{between}}{MS_{within}}$$
   Uji Post-Hoc Tukey HSD:
   $$q = \frac{\bar{x}_i - \bar{x}_j}{\sqrt{\frac{MS_{within}}{2} \left(\frac{1}{n_i} + \frac{1}{n_j}\right)}}$$
7. **Multiple Linear Regression**:
   Estimasi OLS $\mathbf{\beta} = (\mathbf{X}^T \mathbf{X})^{-1} \mathbf{X}^T \mathbf{y}$, tabel ANOVA model, nilai $R^2$, $R^2_{adj}$, nilai $t$, $p$-value, dan Collinearity Statistics (VIF & Tolerance).
8. **Reliability Analysis (Cronbach's Alpha)**:
   $$\alpha = \frac{k}{k-1} \left(1 - \frac{\sum_{i=1}^k \sigma_{y_i}^2}{\sigma_x^2}\right)$$
   Dilengkapi tabel *Item-Total Statistics* (Scale Mean if Item Deleted, Scale Variance if Item Deleted, Cronbach's Alpha if Item Deleted).
9. **Non-Parametric Tests**:
   - *Mann-Whitney U Test* untuk 2 sampel independen.
   - *Wilcoxon Signed-Rank Test* untuk 2 sampel berpasangan.
   - *Kruskal-Wallis H Test* untuk $k$ sampel independen.

### 2.6 Modul 6: Output Viewer & Tree Outline
- **FR-OUT-001**: Panel kiri menampilkan struktur pohon navigasi outline yang dapat diperluas (*expand*) dan diciutkan (*collapse*).
- **FR-OUT-002**: Mengklik item pada pohon secara instan menggulirkan viewport lembar dokumen di sebelah kanan tepat ke elemen tersebut.
- **FR-OUT-003**: Tabel pivot harus dirender dengan estetika standar APA (garis ganda atas/bawah, header abu-abu tipis, teks rata kiri, angka rata kanan bertabuler).
- **FR-OUT-004**: Pengguna dapat menghapus atau mengubah judul elemen output.
- **FR-OUT-005**: Seluruh sesi output dapat disimpan ke database PostgreSQL dan diekspor ke PDF/Excel.

### 2.7 Modul 7: Syntax Editor (Monaco Editor)
- **FR-SYN-001**: Editor kode terintegrasi berbasis Monaco Editor dengan penyorotan tata bahasa SPSS (*SPSS Grammar Highlighting*).
- **FR-SYN-002**: Fitur auto-completion untuk perintah (`FREQUENCIES`, `DESCRIPTIVES`, dll.) dan nama variabel dari dataset aktif.
- **FR-SYN-003**: Kemampuan menjalankan seluruh skrip (**Run All**) atau hanya blok teks yang diblok (**Run Selection**).
- **FR-SYN-004**: Setiap perintah yang dijalankan memicu log dan hasil analisis ke Output Viewer.

---

## 3. Spesifikasi Kebutuhan Non-Fungsional (Non-Functional Requirements)

### 3.1 Performa & Latensi (Performance SLAs)
- **NFR-PERF-001**: Input/edit sel spreadsheet harus memiliki latensi respon visual $\le 16$ ms (60 fps).
- **NFR-PERF-002**: Pengguliran (*scrolling*) dataset 100.000 baris tidak boleh menyebabkan lag atau pemblokiran main-thread browser.
- **NFR-PERF-003**: Waktu eksekusi perhitungan statistik deskriptif untuk 50.000 data di backend atau frontend klien $\le 500$ ms.

### 3.2 Keamanan & Integritas Data (Security SLAs)
- **NFR-SEC-001**: Seluruh komunikasi data harus terenkripsi TLS 1.3 (HTTPS) dan WSS.
- **NFR-SEC-002**: Perlindungan terhadap SQL Injection melalui penggunaan parameterized queries pada SQLAlchemy ORM.
- **NFR-SEC-003**: Perlindungan terhadap XSS dengan sanitasi teks dan isolasi rendering React.
- **NFR-SEC-004**: Audit log lengkap mencatat: `user_id`, `action`, `resource_type`, `resource_id`, `ip_address`, `timestamp`.
