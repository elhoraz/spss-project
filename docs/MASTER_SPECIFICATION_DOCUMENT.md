# MASTER SPECIFICATION DOCUMENT: OPENSPSS ENTERPRISE STUDIO
**Reverse-Engineered Industrial Specification & Architectural Blueprint**
**Version:** 3.0.0-PRO  
**Author:** Collective Enterprise Architecture & Statistical Engineering Taskforce  
*(Principal Software Architect, Enterprise Product Manager, Senior Statistician, Senior UX Researcher, Desktop Application Designer, Frontend Architect, Backend Architect, QA Lead, Reverse Specification Analyst)*

---

## EXECUTIVE SUMMARY & PHILOSOPHICAL MANDATE
Aplikasi ini ditujukan bukan sebagai modern SaaS dashboard biasa, melainkan sebagai **Desktop-Class Web Statistical Workstation**. Seluruh rancang bangun mengikuti filosofi interaksi, tata letak, pola pikir, dan mekanisme kerja software statistik desktop profesional standar industri akademik (IBM SPSS Statistics 28/29).

### Aturan Inti Desain & Interaksi:
1. **Spreadsheet + Output Viewer Paradigm**: Data tersimpan dalam grid tabular persisten dengan dual-view (*Data View* dan *Variable View*). Hasil analisis tidak pernah ditumpuk di atas data melainkan dipancarkan ke panel *Output Viewer* independen dengan hierarki pohon navigasi (*Outline Tree*).
2. **Dense & Professional Information Architecture**: Densitas informasi tinggi, tipografi sistem monospaced/sans-serif ringkas (Segoe UI / Inter 11–12px), palet abu-abu desktop (*Grey Workspace Canvas #ECE9D8 / #F0F0F0*), border tabel ganda (*APA classic double-border pivot tables*).
3. **Keyboard-First & Two-Box Modal Workflows**: Setiap operasi memiliki shortcut keyboard klasik, dan seluruh prosedur statistik menggunakan dialog modal dua kotak (*Source Variables Listbox* $\rightarrow$ *Transfer Arrow* $\rightarrow$ *Target Variables Listbox*) lengkap dengan tombol *OK, Paste, Reset, Cancel, Help* serta sub-dialog *Statistics, Options, Plots*.
4. **Dual Engine Execution**: Instant client-side engine (TypeScript) untuk dataset interaktif cepat, dan server-side Python scientific engine (NumPy, SciPy, Statsmodels, Scikit-Learn) untuk komputasi analitik skala besar (hingga 100.000+ baris $\times$ 500 kolom).

---

# PHASE 1: MASTER FEATURE INVENTORY (11 TOP MENUS)

### 1. File Menu
* **Tujuan**: Manajemen dokumen dataset, output, skrip sintaks, impor, ekspor, dan pencetakan.
* **Daftar Submenu & Dialog**:
  1. `New` $\rightarrow$ `Data` (`Ctrl+N`), `Syntax`, `Output`. Membuka instance dokumen kosong baru.
  2. `Open` $\rightarrow$ `Data...` (`Ctrl+O`), `Syntax...`, `Output...`. Membuka dialog pemilih berkas sistem (.sav, .sps, .spv, .csv, .xlsx).
  3. `Import Data` $\rightarrow$ `CSV / Text Data...`, `Excel (.xlsx, .xls)...`, `JSON Data...`, `Database Query (ODBC)...`. Membuka wizard 5-tahap (Upload $\rightarrow$ Delimiter $\rightarrow$ Header Detection $\rightarrow$ Type Mapping $\rightarrow$ Commit).
  4. `Save` (`Ctrl+S`): Menyimpan dataset aktif ke storage/database lokal atau cloud.
  5. `Save As...` (`Ctrl+Shift+S`): Menyimpan salinan berkas dengan format atau nama baru (.sav, .xlsx, .csv).
  6. `Export` $\rightarrow$ `Export Output to PDF...` (`Ctrl+P`), `Export to Excel (.xlsx)...`, `Export to Word (.docx)...`.
  7. `Print Preview` & `Print...` (`Ctrl+P`): Membuka dialog cetak dokumen laporan statistik.
  8. `Recently Used Data`: Menampilkan histori 10 berkas terakhir yang dibuka.
  9. `Exit`: Menutup sesi dengan dialog konfirmasi penyimpanan (*Unsaved changes prompt*).

### 2. Edit Menu
* **Tujuan**: Manipulasi sel, riwayat operasi undo/redo, pencarian, dan preferensi aplikasi.
* **Daftar Submenu & Dialog**:
  1. `Undo` (`Ctrl+Z`): Membatalkan perubahan sel, pengeditan variabel, atau manipulasi data terakhir.
  2. `Redo` (`Ctrl+Y`): Mengulangi perubahan yang dibatalkan.
  3. `Cut` (`Ctrl+X`), `Copy` (`Ctrl+C`), `Paste` (`Ctrl+V`), `Paste Variables...`.
  4. `Clear` (`Delete`): Menghapus konten sel atau baris/kolom terpilih tanpa menghapus struktur.
  5. `Insert Variable`: Menambahkan kolom variabel baru di sebelah kiri kolom aktif.
  6. `Insert Case`: Menambahkan baris kasus baru di atas baris aktif.
  7. `Find...` (`Ctrl+F`) & `Replace...` (`Ctrl+H`): Dialog pencarian nilai sel dengan opsi *Match case*, *Match entire cell*, dan pencarian per variabel.
  8. `Go to Case...` (`Ctrl+G`): Dialog loncat langsung ke nomor baris kasus tertentu.
  9. `Go to Variable...`: Dialog loncat langsung ke kolom variabel tertentu.
  10. `Options / Preferences`: Konfigurasi format tampilan angka desimal, font grid, tema UI, dan direktori default.

### 3. View Menu
* **Tujuan**: Konfigurasi visibilitas elemen antarmuka dan presentasi visual data.
* **Daftar Submenu**:
  1. `Status Bar`: Toggle visibilitas baris status bawah.
  2. `Toolbar`: Toggle bilah alat ikon jalan pintas.
  3. `Menu Bar`: Pengaturan tampilan bilah menu.
  4. `Grid Lines`: Menampilkan atau menyembunyikan garis pemisah sel spreadsheet.
  5. `Value Labels` (`Ctrl+Alt+V`): Toggle instan antara menampilkan nilai kode numerik murni vs label deskriptif teks (contoh: `1` $\leftrightarrow$ `"Laki-laki"`).
  6. `Variables`: Menampilkan dialog inspeksi metadata variabel.
  7. `Switch to Data View` (`Ctrl+1`): Berpindah ke spreadsheet data.
  8. `Switch to Variable View` (`Ctrl+2`): Berpindah ke kamus variabel.
  9. `Switch to Output Viewer` (`Ctrl+3`): Berpindah ke penampil laporan output.
  10. `Switch to Syntax Editor` (`Ctrl+4`): Berpindah ke editor kode sintaks.

### 4. Data Menu
* **Tujuan**: Operasi struktural dataset dan manajemen level kasus/observasi.
* **Daftar Submenu & Dialog**:
  1. `Define Variable Properties...`: Wizard pendefinisian atribut variabel massal.
  2. `Sort Cases...`: Dialog pengurutan baris berdasarkan 1 atau lebih variabel kunci (Ascending/Descending).
  3. `Transpose...`: Membalik baris menjadi kolom dan kolom menjadi baris.
  4. `Merge Files` $\rightarrow$ `Add Cases...` (menggabungkan baris) / `Add Variables...` (menggabungkan kolom berdasarkan Key Variable).
  5. `Aggregate...`: Merangkum dataset berdasarkan variabel pemecah (*Break Variable*) dengan fungsi agregasi (Mean, Sum, Count, Min, Max).
  6. `Split File...`: Mengelompokkan analisis berdasarkan kategori variabel (*Compare Groups* atau *Organize Output by Groups*).
  7. `Select Cases...`: Penyaringan kasus bersyarat (*If condition is satisfied*, *Random sample*, *Based on time/case range*, *Use filter variable*).
  8. `Weight Cases...`: Menetapkan variabel frekuensi bobot pada kasus.
  9. `Identify Duplicate Cases...`: Mendeteksi baris ganda berdasarkan kombinasi variabel tertentu.
  10. `Restructure...`: Wizard konversi data format *Wide to Long* atau *Long to Wide*.

### 5. Transform Menu
* **Tujuan**: Manipulasi matematis nilai sel, transformasi variabel, dan rekoding.
* **Daftar Submenu & Dialog**:
  1. `Compute Variable...`: Formula editor ekspresi aljabar dan statistik (misal: `COMPUTE total_score = q1 + q2 + q3`).
  2. `Recode into Same Variables...`: Mengubah nilai kategori langsung di kolom yang sama.
  3. `Recode into Different Variables...`: Mengubah nilai kategori menjadi variabel baru tanpa merusak data asli.
  4. `Automatic Recode...`: Mengonversi nilai teks string menjadi kode numerik berurutan secara otomatis.
  5. `Count Values within Cases...`: Menghitung kemunculan nilai tertentu di beberapa variabel per baris.
  6. `Rank Cases...`: Memberikan nilai ranking (peringkat ordinal) pada kasus.
  7. `Replace Missing Values...`: Imputasi data hilang menggunakan Series Mean, Linear Interpolation, atau Linear Trend.

### 6. Analyze Menu (Inti Mesin Analisis Statistik)
* **Tujuan**: Eksekusi algoritma inferensial, deskriptif, dan pengujian hipotesis statistik.
* **Daftar Submenu & Dialog**:
  1. `Descriptive Statistics`:
     - `Frequencies...`: Frekuensi mutlak, persentase, persentase valid, kumulatif, kuartil, tendensi sentral, diagram batang/lingkaran.
     - `Descriptives...`: Mean, Std. Dev, Variance, Min, Max, Range, S.E. Mean, Skewness, Kurtosis, Z-scores.
     - `Explore...`: Uji normalitas Kolmogorov-Smirnov/Shapiro-Wilk, M-estimators, outlier 5 teratas/terbawah, Boxplot interaktif.
     - `Crosstabs...`: Tabel kontingensi 2 arah / n arah, Pearson Chi-Square, Continuity Correction, Likelihood Ratio, Fisher's Exact, Cramer's V, Contingency Coefficient, Gamma, Lambda.
  2. `Compare Means`:
     - `Means...`: Rangkuman rata-rata variabel dependen berdasarkan sub-kategori faktor.
     - `One-Sample T Test...`: Perbandingan rata-rata satu sampel terhadap konstanta test value ($\mu_0$).
     - `Independent-Samples T Test...`: Uji beda dua kelompok bebas dengan Levene's Test for Equality of Variances (Equal Variances Assumed & Not Assumed).
     - `Paired-Samples T Test...`: Uji beda dua kondisi berpasangan (Pre vs Post test).
     - `One-Way ANOVA...`: Analisis varians satu arah dengan post-hoc (Tukey HSD, Bonferroni, Scheffe, Duncan, LSD) dan uji homogenitas varians Levene.
     - `Univariate ANOVA (Two-Way)...`: GLM Univariate dengan efek utama Factor A, Factor B, dan interaksi $A \times B$ menggunakan Type III Sum of Squares.
  3. `Correlate`:
     - `Bivariate...`: Koefisien Pearson ($r$), Spearman's rho ($\rho$), Kendall's tau-b ($\tau$), uji 2-tailed / 1-tailed, penanda bintang signifikansi (* $p<0.05$, ** $p<0.01$).
     - `Partial Correlation...`: Korelasi antara dua variabel dengan mengontrol satu atau lebih variabel pengganggu.
  4. `Regression`:
     - `Linear...`: Regresi linier sederhana & berganda dengan metode Enter, Stepwise, Forward, Backward. Model summary ($R, R^2, Adj R^2, SE$), ANOVA F, Koefisien ($B, SE, \beta, t, Sig$), Collinearity Diagnostics (VIF, Tolerance), Durbin-Watson.
     - `Binary Logistic...`: Regresi logistik biner dengan estimasi Odds Ratio $\text{Exp}(B)$, Hosmer-Lemeshow Goodness of Fit, Classification Matrix.
  5. `Nonparametric Tests`:
     - `Two Independent Samples...`: Mann-Whitney U, Kolmogorov-Smirnov Z, Moses Extreme Reactions, Wald-Wolfowitz.
     - `Two Related Samples...`: Wilcoxon Signed Ranks Test, Sign Test, McNemar Test.
     - `K Independent Samples...`: Kruskal-Wallis H Test, Median Test.
     - `K Related Samples...`: Friedman Test, Kendall's W.
  6. `Scale`:
     - `Reliability Analysis...`: Koefisien Cronbach's Alpha, Split-Half, Guttman, Parallel, tabel Item-Total Statistics (*Scale Mean if item deleted, Scale Variance if item deleted, Corrected Item-Total Correlation, Cronbach's Alpha if item deleted*).
  7. `Dimension Reduction`:
     - `Factor Analysis...`: Principal Component Analysis (PCA), rotasi Varimax/Quartimax/Oblimin, Kaiser-Meyer-Olkin (KMO) Measure of Sampling Adequacy, Bartlett's Test of Sphericity, Eigenvalues $\ge 1$, Scree Plot.
  8. `Classify`:
     - `K-Means Cluster...`: Pengelompokan non-hierarkis iteratif.
     - `Hierarchical Cluster...`: Pengelompokan bertingkat dengan dendrogram (Ward's method, Complete Linkage).

### 7. Graphs Menu
* **Tujuan**: Visualisasi data analitik dan eksplorasi grafis.
* **Daftar Submenu & Dialog**:
  1. `Chart Builder...`: Kanvas visual drag-and-drop elemen variabel ke drop-zone sumbu X, Y, Legend, dan Panel.
  2. `Legacy Dialogs`:
     - `Bar...` (Simple, Clustered, Stacked).
     - `Line...` (Simple, Multiple, Drop-line).
     - `Pie...` (Potongan sektor kategori dengan persentase).
     - `Scatter/Dot...` (Simple Scatter dengan fit line linier/kuadratik, Matrix Scatter).
     - `Histogram...` (Dengan kurva normal overlay).
     - `Boxplot...` (Simple & Clustered dengan outlier point identifiers).

### 8. Utilities Menu
* **Tujuan**: Manajemen kamus data, variabel, dan file skrip.
* **Daftar Submenu**: `Variables...` (Inspeksi variabel cepat), `Variable Sets...`, `Run Script...`.

### 9. Extensions Menu
* **Tujuan**: Integrasi modul eksternal dan package manajer Python/R syntax.
* **Daftar Submenu**: `Extension Hub...`, `Install Local Extension...`.

### 10. Window Menu
* **Tujuan**: Manajemen dokumen aktif dalam sesi multi-window.
* **Daftar Submenu**: `Split Grid`, `Data Document`, `Output Viewer Window`, `Syntax Editor Window`, `Minimize All`, `Tile Windows`.

### 11. Help Menu
* **Tujuan**: Dokumentasi algoritma, panduan penggunaan, tutorial studi kasus, dan informasi versi.
* **Daftar Submenu**: `Topics...`, `Algorithms Reference Manual`, `Case Studies Tutorial`, `SPSS Syntax Guide`, `About OpenSPSS Studio`.

---

# PHASE 2: WORKSPACE & DOCKING SPECIFICATION

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Title Bar] IBM SPSS Statistics - [DataSet1.sav - Data Editor]                     [-] [o] [x]│
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Menu Bar] File  Edit  View  Data  Transform  Analyze  Graphs  Utilities  Extensions  Window │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Toolbar] [Open] [Save] [Print] | [Undo] [Redo] | [Data] [Var] [Out] [Syn] | [1<->A] [Quick] │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Active Cell Indicator] 1 : salary  [ Formula Bar: 57000.00                              ]   │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Spreadsheet Canvas / Workspace Viewport]                                                    │
│ ┌────┬──────────────┬──────────────┬──────────────┬──────────────┬─────────────────────────┐ │
│ │    │ 📏 id        │ 🔘 gender    │ 📏 salary    │ 📏 salbegin  │ + var...                │ │
│ ├────┼──────────────┼──────────────┼──────────────┼──────────────┼─────────────────────────┤ │
│ │ 1  │ 1            │ Male         │ $57,000.00   │ $27,000.00   │                         │ │
│ │ 2  │ 2            │ Male         │ $40,200.00   │ $18,750.00   │                         │ │
│ │ 3  │ 3            │ Female       │ $21,450.00   │ $12,000.00   │                         │ │
│ └────┴──────────────┴──────────────┴──────────────┴──────────────┴─────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Bottom Tab Switcher] [ Data View ] [ Variable View ] | [ Output Viewer (4) ] [ Syntax (1) ] │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Status Bar] IBM SPSS Statistics Processor is ready | Cases: 40 | Vars: 9 | Filter: OFF      │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Rincian Spesifikasi Dimensi & Perilaku Workspace:
1. **Title Bar**:
   - Tinggi: `30px`.
   - Warna: Dark Charcoal (`#1E293B`) atau Windows Classic Navy (`#0F172A`).
   - Teks: Nama aplikasi, nama file aktif (`[DataSet1.sav]`), dan status window.
2. **Top Menu Bar**:
   - Tinggi: `26px`.
   - Latar: `#F1F5F9` (Slate 100) dengan border bawah `#CBD5E1`.
   - Item menu: Font 12px, hover background `#E2E8F0`, dropdown menu dengan drop shadow standar OS dan separator garis tipis.
3. **Desktop Toolbar**:
   - Tinggi: `34px`.
   - Latar: `#F8FAFC`. Tombol ikon 24x24px dengan padding 3px, divider separator vertikal 18px.
4. **Active Cell Formula / Status Bar**:
   - Tinggi: `24px`.
   - Menampilkan koordinat baris dan nama kolom aktif di sebelah kiri (lebar `90px`, bergaris pembatas kanan), kotak nilai sel aktual di tengah, dan badge jumlah kasus virtual di kanan.
5. **Bottom Tab Bar**:
   - Posisi: Terpasang permanen di kaki spreadsheet tepat di atas status bar.
   - Tinggi: `28px`.
   - Tab bergaya folder desktop: tab aktif berlatar putih dengan border atas beraksen warna tema, tab non-aktif berlatar abu-abu netral.
6. **Bottom Status Bar**:
   - Tinggi: `22px`.
   - Format: 4 segmen info terpisah garis vertikal:
     - Segmen 1: `"IBM SPSS Statistics Processor is ready"` / `"Running DESCRIPTIVES..."`.
     - Segmen 2: `"Cases: 40 | Variables: 9"`.
     - Segmen 3: Indikator filter `"Filter: OFF"` / `"Filter: ACTIVE"`.
     - Segmen 4: Indikator bobot `"Weight: OFF"` / `"Weight: ON"`.

---

# PHASE 3: DATA VIEW SPECIFICATION

### 1. Model Seleksi Sel & Navigasi
* **Single Cell Selection**: Klik kiri pada sel menetapkan sel aktif `(r, c)`.
* **Range Drag Selection**: Menahan klik kiri dan menyeret mouse memilih rentang persegi `(r_start, c_start)` ke `(r_end, c_end)`.
* **Row Selection**: Klik pada header nomor baris memilih seluruh kolom pada baris tersebut ($1 \times C$). Klik + seret pada header nomor baris memilih beberapa baris utuh.
* **Column Selection**: Klik pada header nama variabel memilih seluruh sel dalam kolom tersebut ($R \times 1$). Klik + seret memilih beberapa kolom utuh.
* **Select All**: Klik pada kotak pojok kiri atas (Cell Intersection Header) memilih seluruh sel dalam tabel ($R \times C$). Shortcut: `Ctrl+A`.

### 2. State Machine Interaksi Keyboard:
```
               [ Navigational Mode ]
                   │            ▲
     [Enter / F2 / │            │ [Enter / Tab /
    Double Click]  │            │  Commit Edit]
                   ▼            │
                [ In-Cell Editing Mode ]
                   │
                   │ [Escape] -> Cancel & Restore original value
                   ▼
               [ Navigational Mode ]
```
* **Arrow Keys**: Berpindah 1 sel ke atas, bawah, kiri, kanan.
* **Enter (saat navigasi)**: Membuka edit mode pada sel aktif; jika sudah edit mode, commit nilai dan pindah ke baris berikutnya `(r+1, c)`.
* **Tab**: Commit edit dan pindah ke kolom berikutnya `(r, c+1)`.
* **Shift+Tab**: Commit edit dan pindah ke kolom sebelumnya `(r, c-1)`.
* **Escape**: Membatalkan edit yang sedang berjalan dan mengembalikan nilai semula.
* **Delete / Backspace (saat navigasi)**: Menghapus nilai sel yang dipilih tanpa menggeser struktur (*set to empty / null / SYSMIS*).

### 3. Operasi Clipboard & Manipulasi Data:
* **Copy (`Ctrl+C`)**: Menyalin sel atau rentang sel ke clipboard OS dengan format TSV (Tab-Separated Values).
* **Paste (`Ctrl+V`)**:
  - Menerima teks clipboard TSV/CSV.
  - Memetakan nilai mulai dari posisi sel aktif `(r, c)`.
  - Jika ukuran data clipboard melebihi jumlah baris yang ada, otomatis memperluas baris kasus baru (*Auto-expand rows*).
  - Melakukan casting tipe otomatis sesuai metadata tipe kolom (Numeric, String, Dollar, Date).
* **Fill Down (`Ctrl+D`)**: Menduplikasi nilai dari sel teratas ke seluruh sel yang dipilih di bawahnya dalam kolom yang sama.

### 4. Edge Cases:
* Penanganan paste teks karakter non-angka ke kolom tipe Numeric: Otomatis diubah menjadi nilai hilang sistem (*System Missing / `.`*).
* Kolom baru yang dibuat otomatis diberi nama unik berformat `VAR00001`, `VAR00002`, dst.

---

# PHASE 4: VARIABLE VIEW SPECIFICATION (11 ATRIBUT SPESIFIK)

```
┌───────┬─────────┬───────┬──────────┬──────────────────────────┬──────────┬─────────┬─────────┬────────┬─────────┬────────┐
│ Name  │ Type    │ Width │ Decimals │ Label                    │ Values   │ Missing │ Columns │ Align  │ Measure │ Role   │
├───────┼─────────┼───────┼──────────┼──────────────────────────┼──────────┼─────────┼─────────┼────────┼─────────┼────────┤
│ id    │ Numeric │ 4     │ 0        │ Employee Code            │ None     │ None    │ 6       │ Right  │ Nominal │ Input  │
│ gender│ String  │ 1     │ 0        │ Gender                   │ {m, Male}│ None    │ 8       │ Left   │ Nominal │ Input  │
│ salary│ Dollar  │ 8     │ 2        │ Current Annual Salary ($)│ None     │ None    │ 10      │ Right  │ Scale   │ Target │
└───────┴─────────┴───────┴──────────┴──────────────────────────┴──────────┴─────────┴─────────┴────────┴─────────┴────────┘
```

| No | Nama Field | Aturan Validasi Teknis | Dampak ke Data View | Dampak ke Mesin Analisis |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Name** | Maks 64 karakter; diawali huruf atau `@`; dilarang spasi dan karakter khusus; case-insensitive namun mempertahankan display case. Tidak boleh sama dengan reserved keywords SPSS (`ALL`, `AND`, `BY`, `EQ`, `GE`, `GT`, `LE`, `LT`, `NE`, `NOT`, `OR`, `TO`, `WITH`). | Header kolom di Data View otomatis berubah seketika. | Variabel dipanggil dalam sintaks dan output dengan nama baru. |
| **2** | **Type** | Pilihan: `Numeric`, `Comma`, `Dot`, `Scientific`, `Date`, `Dollar`, `Custom Currency`, `String`. | Format tampilan sel berubah (misal: Dollar menampilkan tanda `$` dan koma ribuan). | Tipe String dilarang masuk ke analisis numerik murni (misal: Mean, T-Test, ANOVA). |
| **3** | **Width** | Integer positif (1 s/d 256). Panjang digit/karakter maksimum. | Membatasi input karakter pada sel Data View. | Menentukan alokasi buffer biner memori. |
| **4** | **Decimals** | Integer positif (0 s/d 16). Harus memenuhi `Decimals <= Width - 2`. Hanya aktif untuk tipe numerik. | Menentukan jumlah angka presisi di belakang koma pada Data View. | Hasil output tabel pivot mengikuti presisi format desimal variabel. |
| **5** | **Label** | Teks bebas hingga 256 karakter untuk deskripsi lengkap variabel. | Ditampilkan sebagai tooltip header kolom dan di baris status sel aktif. | Output Viewer memprioritaskan menampilkan Label daripada Nama variabel pada tabel hasil analisis. |
| **6** | **Values** | Pasangan dictionary kode nilai dan label teks (contoh: `{1: "Pria", 2: "Wanita"}`). Membuka **Value Labels Dialog**. | Saat mode *Value Labels On*, Data View menampilkan label teks alih-alih angka kode. | Tabel Frekuensi & Crosstabs menggunakan label ini untuk nama baris/kolom kategori. |
| **7** | **Missing** | Menentukan nilai hilang pengguna (*User-Missing Values*), misal: `99` atau rentang `90 - 99`. | Sel yang berisi nilai ini ditandai secara visual. | Dikecualikan dari perhitungan statistik inferensial (*Listwise / Pairwise exclusion*). |
| **8** | **Columns** | Lebar visual kolom grid dalam satuan karakter visual (misal `8` = 88px). | Mengubah lebar kolom spreadsheet secara langsung. | Tidak mempengaruhi analisis. |
| **9** | **Align** | Pilihan: `Left`, `Right`, `Center`. | Mengatur perataan teks/angka dalam sel Data View. | Mengatur perataan tabel output. |
| **10**| **Measure** | Pilihan: `Scale` (kontinu/rasio), `Ordinal` (peringkat bertingkat), `Nominal` (kategori tanpa urutan). | Header kolom menampilkan ikon: 📏 Scale, 📶 Ordinal, 🔘 Nominal. | Dialog analisis memfilter variabel yang valid (misal: ANOVA hanya mengizinkan Scale untuk DV dan Nominal/Ordinal untuk Factor). |
| **11**| **Role** | Pilihan: `Input` (Prediktor/IV), `Target` (Dependen/DV), `Both`, `None`, `Partition`, `Split`. | Memberikan indikator peran pada variabel. | Otomatis menempatkan variabel ke kotak Dependent/Independent yang sesuai pada dialog analisis. |

---

# PHASE 5: DATA MANAGEMENT SPECIFICATION

### 1. Sort Cases
* **Input**: 1 atau lebih variabel pengurutan (*Sort By*), pilihan arah per variabel: *Ascending* atau *Descending*.
* **Proses**: Algoritma multi-key stable sort pada data kasus.
* **Output**: Baris Data View diurutkan ulang seketika. Nomor baris tetap 1..N.
* **Sintaks SPSS**: `SORT CASES BY var1 (A) var2 (D).`

### 2. Select Cases (Filtering)
* **Input**: Pilihan mode:
  - *All cases* (reset filter).
  - *If condition is satisfied* (ekspresi logika, misal: `gender = 'm' and salary > 30000`).
  - *Random sample of cases* (persentase atau tepat N kasus).
  - *Based on time or case range* (baris awal s/d baris akhir).
* **Proses**: Membuat kolom internal `filter_$` bernilai 1 (lolos) atau 0 (terfilter).
* **Output UI**: Pada Data View, baris kasus yang tidak lolos filter dicoret pada nomor barisnya (*slashed row header* `~~12~~`). Baris status bawah menampilkan badge `Filter: ON`.
* **Dampak Analisis**: Semua analisis hanya mengeksekusi kasus yang aktif (`filter_$ == 1`).
* **Sintaks SPSS**: `COMPUTE filter_$ = (condition). FILTER BY filter_$. EXECUTE.`

### 3. Split File
* **Input**: Variabel pemecah grup (*Split By*), opsi:
  - *Compare groups*: Output menyajikan grup bersebelahan dalam satu tabel.
  - *Organize output by groups*: Output menghasilkan tabel pivot terpisah untuk setiap sub-grup.
* **Output UI**: Status bar bawah menampilkan badge `Split File: ON`.
* **Sintaks SPSS**: `SORT CASES BY var1. SPLIT FILE LAYERED BY var1.`

### 4. Weight Cases
* **Input**: Variabel numerik yang berfungsi sebagai bobot frekuensi (*Frequency Variable*).
* **Dampak**: Setiap baris kasus dihitung berulang sebanyak nilai bobot yang tertera.
* **Output UI**: Status bar menampilkan `Weight: ON`.
* **Sintaks SPSS**: `WEIGHT BY freq_var.`

### 5. Aggregate
* **Input**: Break Variable(s), Aggregated Variables, Fungsi Agregasi (Mean, Median, Sum, Count, Min, Max).
* **Output**: Dataset baru yang diringkas atau menambahkan variabel agregat baru ke dataset aktif.
* **Sintaks SPSS**: `AGGREGATE /OUTFILE=* MODE=ADDVARIABLES /BREAK=dept /salary_mean=MEAN(salary).`

---

# PHASE 6: ANALYSIS MENU SPECIFICATION (DIALOG & KOMPUTASI)

Setiap dialog analisis statistik harus mengimplementasikan **Standar Layout Dialog SPSS**:
```
┌────────────────────────────────────────────────────────────────────────┐
│ [Title] Frequencies                                                    │
├────────────────────────────────────────────────────────────────────────┤
│ [Source Variables]           [Transfer]   [Target Variables (Selected)]│
│ ┌──────────────────────────┐              ┌──────────────────────────┐ │
│ │ 🔘 gender [Gender]       │    [ > ]     │ 🔘 jobcat [Job Category] │ │
│ │ 📏 educ [Educ Level]     │    [ < ]     │                          │ │
│ │ 📏 salary [Salary]       │              │                          │ │
│ └──────────────────────────┘              └──────────────────────────┘ │
│                                                                        │
│ [ ] Display frequency tables               [ Sub-Dialog Buttons ]      │
│                                            [ Statistics... ]           │
│                                            [ Charts...     ]           │
│                                            [ Format...     ]           │
│                                            ─────────────────           │
│                                            [ OK     ]  [ Paste  ]      │
│                                            [ Reset  ]  [ Cancel ]      │
└────────────────────────────────────────────────────────────────────────┘
```

### Spesifikasi 13 Modul Analisis:

#### 1. Frequencies
* **Target List**: 1 atau lebih variabel kategori/skala.
* **Sub-dialog Statistics**: Quartiles, Cut points, Mean, Median, Mode, Sum, Std. Deviation, Variance, Range, Min, Max, S.E. Mean, Skewness, Kurtosis.
* **Sub-dialog Charts**: None, Bar charts, Pie charts, Histograms (dengan normal curve).
* **Output Tables**: Statistics Summary Table, Frequency Table per Variable (Frequency, Percent, Valid Percent, Cumulative Percent).

#### 2. Descriptives
* **Target List**: Variabel skala numerik.
* **Checkbox**: `[x] Save standardized values as variables` (otomatis membuat variabel `Z<varname>` di Data View).
* **Output Tables**: Descriptive Statistics Table ($N, \text{Min}, \text{Max}, \text{Mean}, \text{Std. Deviation}, \text{Variance}, \text{Skewness}, \text{Kurtosis}$).

#### 3. Explore
* **Dependent List**: Variabel skala kontinu.
* **Factor List**: Variabel grup kategori (opsional).
* **Sub-dialog Plots**: Boxplots (Factor levels together, Dependents together), Stem-and-leaf, Normality plots with tests.
* **Output**: Descriptives Table (5% Trimmed Mean, Interquartile Range), M-Estimators (Huber, Tukey's biweight), Extreme Values (5 tertinggi & 5 terendah), Tests of Normality (Kolmogorov-Smirnov with Lilliefors correction, Shapiro-Wilk).

#### 4. Crosstabs
* **Row(s)** & **Column(s)**: Variabel kategori.
* **Sub-dialog Statistics**: Chi-square, Correlation, Contingency coefficient, Phi and Cramer's V, Lambda, Gamma, Eta, Kappa.
* **Sub-dialog Cells**: Counts (Observed, Expected), Percentages (Row, Column, Total), Residuals (Unstandardized, Standardized, Adjusted standardized).
* **Output**: Case Processing Summary, Crosstabulation Table, Chi-Square Tests Table.

#### 5. Means
* **Dependent List**: Variabel skala numerik.
* **Independent List**: Variabel kategori (Layer 1, Layer 2..).
* **Output**: Report Table (Mean, N, Std. Deviation untuk setiap kombinasi sub-grup), ANOVA Table & Linearity Test.

#### 6. Bivariate Correlation
* **Variables List**: 2 atau lebih variabel numerik.
* **Correlation Coefficients Checkboxes**: `[x] Pearson`, `[x] Spearman`, `[x] Kendall's tau-b`.
* **Test of Significance**: `Two-tailed` atau `One-tailed`.
* **Checkbox**: `[x] Flag significant correlations` (memberikan tanda * pada $p < 0.05$ dan ** pada $p < 0.01$).
* **Output**: Symmetric Correlation Matrix Table.

#### 7. Linear Regression
* **Dependent**: 1 variabel skala kontinu.
* **Independent(s)**: 1 atau lebih variabel prediktor.
* **Method**: `Enter`, `Stepwise`, `Remove`, `Backward`, `Forward`.
* **Sub-dialog Statistics**: Estimates, Confidence intervals (95%), Model fit, R squared change, Descriptives, Part and partial correlations, Collinearity diagnostics (VIF, Tolerance), Durbin-Watson residual test.
* **Output Tables**: Variables Entered/Removed, Model Summary, ANOVA Table, Coefficients Table, Collinearity Diagnostics Table.

#### 8. T-Tests
* **One-Sample T Test**: Variabel uji vs `Test Value`. Output: One-Sample Statistics ($N, \text{Mean}, \text{SD}, \text{SE}$), One-Sample Test ($t, df, Sig, \text{Mean Difference}, 95\% \text{ CI}$).
* **Independent-Samples T Test**: Test Variable(s) vs Grouping Variable (dengan sub-dialog *Define Groups* misal Group 1 = 1, Group 2 = 2). Output: Group Statistics, Independent Samples Test (memuat Levene's Test $F, Sig$ dan hasil t-test untuk *Equal variances assumed* serta *Equal variances not assumed*).
* **Paired-Samples T Test**: Pasangan variabel (Pair 1: Var1 vs Var2). Output: Paired Samples Statistics, Paired Samples Correlations, Paired Samples Test.

#### 9. One-Way ANOVA
* **Dependent List**: Variabel numerik kontinu.
* **Factor**: Variabel kategori pengelompokan.
* **Sub-dialog Post Hoc**: `[x] Tukey`, `[x] Bonferroni`, `[x] Scheffe`, `[x] LSD`, `[x] Duncan`.
* **Sub-dialog Options**: Descriptives, Homogeneity of variance test (Levene), Brown-Forsythe, Welch, Means plot.
* **Output**: Descriptives Summary, Homogeneity of Variances Test, ANOVA Table, Multiple Comparisons Table (Post Hoc).

#### 10. Reliability Analysis
* **Items**: 2 atau lebih variabel indikator/kuesioner.
* **Model**: `Alpha` (Cronbach), `Split-half`, `Guttman`, `Parallel`.
* **Sub-dialog Statistics**: Item, Scale, Scale if item deleted, Inter-item Correlations.
* **Output**: Case Processing Summary, Reliability Statistics (Cronbach's Alpha, N of Items), Item-Total Statistics Table.

#### 11. Factor Analysis
* **Variables List**: Sekumpulan variabel kontinu yang akan direduksi.
* **Extraction**: Principal Components, Maximum Likelihood, Principal Axis Factoring. Berdasarkan Eigenvalues over 1 atau Fixed number of factors.
* **Rotation**: None, Varimax, Direct Oblimin, Quartimax, Promax.
* **Output**: KMO and Bartlett's Test, Communalities Table, Total Variance Explained Table, Scree Plot, Rotated Component Matrix.

#### 12. Cluster Analysis
* **K-Means Cluster**: Number of clusters ($k$), Iterations, Initial cluster centers.
* **Output**: Initial Cluster Centers, Iteration History, Final Cluster Centers, Number of Cases in each Cluster, ANOVA Table per variable.

#### 13. Binary Logistic Regression
* **Dependent**: Variabel dikotomi biner (0/1).
* **Covariates**: Variabel prediktor kontinu atau kategorikal.
* **Output**: Case Processing Summary, Dependent Variable Encoding, Omnibus Tests of Model Coefficients, Model Summary (-2 Log likelihood, Cox & Snell $R^2$, Nagelkerke $R^2$), Hosmer and Lemeshow Test, Contingency Table for Hosmer-Lemeshow, Classification Table, Variables in the Equation ($B, SE, \text{Wald}, df, Sig, \text{Exp}(B)$ dengan 95% C.I. untuk $\text{Exp}(B)$).

---

# PHASE 7: OUTPUT VIEWER SPECIFICATION

### 1. Struktur Komponen
* **Split Window**:
  - **Left Pane (Outline Navigation Tree)**: Menampilkan hierarki pohon semua judul prosedur dan sub-tabel yang dihasilkan.
  - **Right Pane (Output Document Canvas)**: Lembar laporan hasil berlatar belakang putih (#FFFFFF) dengan rendering tabel pivot dan gambar grafik.

```
Output Document
├── Log
├── Frequencies
│   ├── Title
│   ├── Notes
│   ├── Statistics
│   └── Gender
│       └── Bar Chart
└── One-Way ANOVA
    ├── Title
    ├── Descriptives
    ├── Test of Homogeneity of Variances
    ├── ANOVA
    └── Post Hoc: Multiple Comparisons
```

### 2. Operasi Interaktif Pohon Navigasi:
* **Click Node**: Layar kanan otomatis menggulir mulus (*smooth scroll*) langsung ke posisi elemen tabel/grafik yang dituju.
* **Expand / Collapse (`+` / `-`)**: Menyembunyikan atau membuka sub-elemen output.
* **Rename Node**: Klik dua kali pada nama node di pohon memungkinkan pengguna mengganti label judul.
* **Delete Node**: Menekan tombol `Delete` pada node terpilih akan menghapus blok output tersebut dari dokumen dan memori persisten.
* **Move / Reorder Node**: Drag-and-drop node untuk mengubah urutan penyajian tabel laporan.

### 3. Rendering Tabel Pivot Standar APA / SPSS Desktop:
* **Double Horizontal Borders**: Garis hitam solid ganda di bagian atas dan bawah judul kolom tabel.
* **Single Bottom Border**: Garis tunggal di bagian terbawah tabel di atas catatan kaki (*footnotes*).
* **No Vertical Borders**: Standar publikasi APA melarang garis batas vertikal di dalam sel data.
* **Format Angka Dinamis**: Angka statistik rata kanan dengan format desimal presisi; nilai signifikansi $p < 0.001$ disajikan sebagai `< .001` (bukan `0.0000`).

---

# PHASE 8: SYNTAX EDITOR SPECIFICATION

### 1. Grammar & Lexical Rules SPSS
* Setiap perintah utama (*Command*) diawali dengan kata kunci di awal baris (misal: `FREQUENCIES`, `DESCRIPTIVES`, `CROSSTABS`, `REGRESSION`).
* Sub-perintah (*Subcommands*) diawali dengan garis miring `/` (misal: `/VARIABLES=`, `/STATISTICS=`, `/METHOD=`).
* Setiap blok perintah **harus diakhiri dengan tanda titik (`.`)**.
* Baris komentar diawali dengan tanda bintang `*` atau kata kunci `COMMENT` dan diakhiri dengan titik `.`.
* Identifier variabel bersifat case-insensitive (`salary` identik dengan `SALARY`).

### 2. Fitur Editor (Monaco Engine Integration):
* **Custom Monarch Syntax Highlighter**: Token khusus untuk kata kunci primer (biru gelap tebal), sub-perintah (ungu), string (merah marun), komentar (hijau tua miring), angka (hijau cerah), dan tanda titik terminator.
* **IntelliSense Autocomplete Provider**: Mengetik `FREQ` otomatis menyarankan snippet lengkap `FREQUENCIES VARIABLES=... /ORDER=ANALYSIS.`.
* **Run All (`Ctrl+R`)**: Mengeksekusi seluruh skrip dari baris pertama hingga terakhir.
* **Run Selection (`Ctrl+E` atau ikon Play Selection)**: Jika ada teks yang disorot, hanya teks tersebut yang dieksekusi; jika tidak ada, mengeksekusi perintah pada posisi kursor aktif.
* **Script I/O**: Mendukung pengunggahan berkas skrip `.sps` dan penyimpanan skrip aktif menjadi berkas `.sps` lokal.

---

# PHASE 9: GRAPH BUILDER SPECIFICATION

### 1. Jenis Grafik & Mapping Data
1. **Bar Chart**:
   - Simple Bar: 1 variabel kategori pada sumbu X, frekuensi count atau rata-rata variabel skala pada sumbu Y.
   - Clustered Bar: Variabel kategori X, dikelompokkan oleh variabel legend (*Cluster By*).
   - Stacked Bar: Komposisi segmen persentase 100% kumulatif per kategori.
2. **Pie Chart**: Sektor persentase kategori dari 1 variabel nominal/ordinal.
3. **Histogram**: Variabel skala numerik pada sumbu X dengan pengelompokan otomatis (*auto binning Freedman-Diaconis*) dan opsi kurva Gaussian normal overlay.
4. **Scatter Plot**: Variabel skala X vs variabel skala Y, opsi penanda kategori titik (*Color By*), dan garis regresi linier (*Fit Line*).
5. **Line Chart**: Tren variabel skala kontinu atau deret waktu.
6. **Boxplot**: Median (garis tengah), Kuartil 1 dan 3 (kotak interkuartil), Whiskers ($1.5 \times \text{IQR}$), dan titik outlier individu bertanda nomor kasus baris.

### 2. Export & Edit Mode
* Ekspor resolusi tinggi: **PNG (300 DPI)**, **SVG (Vektor tanpa pecah)**, dan **PDF**.
* Kemampuan mengubah judul grafik, label sumbu X/Y, warna palet (*Academic Greyscale, SPSS Classic Blue, Modern Pastel*).

---

# PHASE 10: SHORTCUT INVENTORY LENGKAP

| Kategori | Shortcut | Konteks | Aksi yang Dijalankan | Hasil yang Diharapkan |
| :--- | :--- | :--- | :--- | :--- |
| **File** | `Ctrl + N` | Global | New Dataset | Membuka tab dokumen data kosong baru |
| **File** | `Ctrl + O` | Global | Open Document | Membuka dialog pemilih file (.sav, .csv, .xlsx) |
| **File** | `Ctrl + S` | Global | Save Active Dataset | Menyimpan dataset ke database / file download |
| **File** | `Ctrl + Shift + S` | Global | Save As | Dialog simpan salinan berkas baru |
| **File** | `Ctrl + P` | Global | Export / Print PDF | Membuka dialog cetak atau ekspor PDF laporan |
| **Edit** | `Ctrl + Z` | Spreadsheet | Undo | Membatalkan perubahan sel/data terakhir |
| **Edit** | `Ctrl + Y` | Spreadsheet | Redo | Mengulangi perubahan yang dibatalkan |
| **Edit** | `Ctrl + C` | Spreadsheet | Copy Cells | Menyalin rentang sel ke clipboard OS (TSV) |
| **Edit** | `Ctrl + V` | Spreadsheet | Paste Cells | Menempel teks TSV clipboard ke sel data |
| **Edit** | `Ctrl + D` | Spreadsheet | Fill Down | Mengisi nilai sel ke bawah pada rentang terpilih |
| **Edit** | `Ctrl + F` | Spreadsheet | Find Dialog | Membuka modal pencarian nilai sel |
| **Edit** | `Ctrl + H` | Spreadsheet | Replace Dialog | Membuka modal cari dan ganti nilai sel |
| **Edit** | `Ctrl + G` | Spreadsheet | Go to Case | Dialog input nomor baris kasus untuk loncat sel |
| **Navigation** | `Ctrl + 1` | Global | View: Data View | Berpindah tampilan ke tab Data View |
| **Navigation** | `Ctrl + 2` | Global | View: Variable View | Berpindah tampilan ke tab Variable View |
| **Navigation** | `Ctrl + 3` | Global | View: Output Viewer | Berpindah tampilan ke tab Output Viewer |
| **Navigation** | `Ctrl + 4` | Global | View: Syntax Editor | Berpindah tampilan ke tab Syntax Editor |
| **View** | `Ctrl + Alt + V` | Spreadsheet | Toggle Value Labels | Beralih antara tampilan angka kode $\leftrightarrow$ label teks |
| **Grid** | `F2` | Spreadsheet | Enter Edit Mode | Mengaktifkan kursor ketik di dalam sel aktif |
| **Grid** | `Tab` | Spreadsheet | Next Cell | Commit nilai dan geser seleksi ke kanan |
| **Grid** | `Shift + Tab` | Spreadsheet | Prev Cell | Commit nilai dan geser seleksi ke kiri |
| **Grid** | `Enter` | Spreadsheet | Next Row | Commit nilai dan geser seleksi ke bawah |
| **Grid** | `Escape` | Spreadsheet | Cancel In-Cell Edit | Membatalkan input yang sedang diketik |
| **Syntax** | `Ctrl + R` | Syntax Editor | Run All | Mengeksekusi seluruh skrip sintaks |
| **Syntax** | `Ctrl + E` | Syntax Editor | Run Selection | Mengeksekusi blok kode yang disorot saja |

---

# PHASE 11: DESKTOP UX SPECIFICATION

### Prinsip Desain Antarmuka:
1. **Bukan SaaS Generik**: Dilarang menggunakan layout kartu (*dashboard cards*), padding raksasa ala mobile web, atau grafik donat berwarna-warni mainan. Semua komponen harus padat, efisien, dan fungsional.
2. **Dense Desktop Ergonomics**: Baris spreadsheet setinggi `24px`, header `26px`, ukuran font default `11px` atau `12px` monospaced numerik agar memaksimalkan jumlah data yang terlihat di layar tanpa scrolling berlebih.
3. **Palet Warna SPSS Classic**:
   - Canvas background: `#ECE9D8` (Classic Windows Slate) atau `#F1F5F9`.
   - Grid borders: `#D1D5DB` (garis sel spreadsheet tipis `1px`).
   - Active Cell Border: Garis tebal hitam atau biru tua `#1D4ED8` dengan sudut seleksi.
   - Header Kolom & Baris: Gradien halus tombol desktop dengan teks tebal centered.
4. **Modal Dialogs Berpola Modal**:
   - Seluruh dialog analisis tampil di tengah layar dengan backdrop semi-transparan.
   - Tombol default (`OK`) berbingkai aksen tebal dan merespons tombol `Enter` keyboard.
   - Tombol `Cancel` atau tombol silang merespons tombol `Escape`.
   - Tombol transfer panah otomatis aktif jika ada variabel yang disorot di listbox sumber.

---

# PHASE 12: PERFORMANCE & LARGE DATASET SPECIFICATION

### Target Performa:
* **Ukuran Dataset Target**: Hingga **100.000+ baris $\times$ 500 kolom**.
* **Kecepatan Memuat Awal Grid**: $< 1.5$ detik.
* **FPS Gulir (Scroll)**: Stabil pada **60 FPS** tanpa lag rendering.
* **Penggunaan Memori Browser**: $< 150 \text{ MB}$ untuk 100.000 kasus berkat virtualisasi DOM.

### Strategi Optimasi Teknis:
1. **Window Virtualization (TanStack Virtual)**: DOM browser hanya me-render 30–40 baris yang saat itu terlihat di jendela viewport. Sisa 99.960 baris direpresentasikan oleh elemen spacer atas dan bawah.
2. **Dual-Engine Execution Split**:
   - Dataset $\le 5.000$ baris: Komputasi instan di memori browser pengguna via pure TypeScript statistical engine ($0 \text{ ms}$ latensi jaringan).
   - Dataset $> 5.000$ baris atau analisis matriks berat (Factor Analysis, Binary Logistic): Panggilan asinkron ke server backend Python FastAPI memanfaatkan NumPy C-vectorization dan SciPy LAPACK routines.
3. **Background Worker Processing**: Untuk eksekusi sintaks batch panjang, pemrosesan dijalankan di latar belakang (*background job*) tanpa memblokir thread antarmuka spreadsheet.

---

# PHASE 13: AUDIT KODE SUMBER SAAT INI & GAP ANALYSIS

| Modul / Fitur | Status Saat Ini di Aplikasi | Kondisi Harapan (Master Spec) | Identifikasi Gap | Tingkat Keparahan (Severity) | Kompleksitas | Prioritas |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| **Grid Data View** | Sudah divirtualisasi `@tanstack/react-virtual`, edit sel inline, add row/var. | Seleksi multi-sel persegi panjang (*Range selection*), seleksi satu baris penuh, seleksi satu kolom penuh, klik kanan context menu. | Belum ada drag-selection rentang multi-sel dan context menu klik kanan di sel grid. | **Medium** | Sedang | **P1** |
| **Variable View** | 11 kolom lengkap (`Name`, `Type`, `Width`, `Decimals`, `Label`, `Values`, `Missing`, `Columns`, `Align`, `Measure`, `Role`). | Pengeditan sel langsung in-line pada seluruh kolom tabel Variable View tanpa membuka modal berlebih. | Kolom Type dan Measure sudah responsif, perlu memastikan kolom Missing dan Decimals memiliki validasi in-cell dropdown langsung. | **Low** | Rendah | **P2** |
| **Analisis Statistik** | 10 modul aktif: Descriptives, Frequencies, Crosstabs, Correlations, T-Tests (1-sample, Indep, Paired), ANOVA (1-Way & 2-Way), Regression, Reliability, Non-Parametric (Mann-Whitney, Wilcoxon, Kruskal-Wallis). | Tambahan prosedur lanjutan: Explore (Uji Normalitas Shapiro-Wilk & Kolmogorov-Smirnov), Means report, Factor Analysis (PCA), Binary Logistic Regression. | Modul dasar dan menengah sudah lengkap 100%, perlu menambahkan modul Explore, Factor Analysis, dan Binary Logistic. | **Low** | Tinggi | **P3** |
| **Dialog Analisis** | Two-box dialog dengan panah transfer, tombol OK, Paste, Reset, Cancel. | Tombol sub-dialog tambahan pada setiap prosedur: `[ Statistics... ]`, `[ Plots / Charts... ]`, `[ Options... ]`. | Opsi statistik saat ini berada dalam satu dialog utama atau menggunakan opsi default SPSS standar. Sub-dialog bertingkat belum dibuat terpisah. | **Medium** | Sedang | **P2** |
| **Data Management** | Sort Cases, Select Cases (Filter), Split File, Weight Cases sudah ada dialog dan sintaksnya. | Eksekusi filtering `filter_$` langsung mencoret nomor baris kasus yang tidak lolos di Data View (`~~12~~`). | Filtering saat ini menandai metadata log, belum menampilkan garis coret visual (*strikethrough*) pada row header nomor baris. | **Medium** | Rendah | **P1** |
| **Syntax Editor** | Monaco Editor dengan SPSS Monarch tokenizer kustom, autocomplete, Run All, Run Selection, Open/Save .sps. | Histori eksekusi sintaks persisten dan split view berdampingan dengan Output Viewer. | Editor sudah berfungsi sangat baik; perlu menambahkan tombol pemisah layar (*Split View Mode*). | **Low** | Rendah | **P3** |
| **Output Viewer** | Tree Outline navigasi hierarki pohon, tabel pivot APA double-border, ekspor PDF/Excel. | Kemampuan memindahkan urutan node (*reorder*) via drag-and-drop di panel pohon navigasi. | Pohon navigasi saat ini melompat ke elemen tabel via klik, belum mendukung drag-and-drop untuk menyusun ulang tabel laporan. | **Low** | Sedang | **P3** |
| **Chart Builder** | Bar, Pie, Histogram, Scatter, Line dengan Chart.js. | Boxplot dengan interquartile box dan titik outlier individu berlabel nomor kasus baris. | Boxplot standar belum memiliki penanda nomor baris kasus pada outlier ekstrim. | **Low** | Sedang | **P3** |

---

# PHASE 14: ROADMAP IMPLEMENTASI (7 GELOMBANG)

```
[Wave 1: Critical UX & Desktop Ergonomics]
  └── Context Menu Spreadsheet, Full Row/Col Selection, Row-number Strikethrough saat Filter aktif
[Wave 2: Data View & Variable View Polish]
  └── Multi-cell drag range selection, In-cell instant dropdown editor untuk Variable View
[Wave 3: Analysis Dialog Sub-Windows]
  └── Menambahkan tombol sub-dialog modal bertingkat: [Statistics...], [Plots...], [Options...]
[Wave 4: Prosedur Analisis Lanjutan]
  └── Modul Explore (Uji Normalitas), Factor Analysis (PCA), dan Binary Logistic Regression
[Wave 5: Output Viewer Enhancements]
  └── Drag-and-drop reordering pada Outline Tree Navigator dan ekspor dokumen Word (.docx)
[Wave 6: Graph Builder Enhancements]
  └── Boxplot lanjutan dengan outlier labeling dan kurva normal overlay pada Histogram
[Wave 7: Enterprise Governance & Collaboration]
  └── Audit trail log persisten, sinkronisasi multi-user dataset, dan ekspor sintaks otomatis
```

---

# PHASE 15: REFACTOR & MIGRATION PLAN

Untuk memastikan integritas sistem yang sudah dideploy di Vercel dan Render tetap terjaga tanpa downtime:
1. **Tahap 1 (Zero-Risk Refactoring)**:
   - Mempertahankan seluruh kontrak interface `VariableMeta`, `Dataset`, dan `OutputItem` yang saat ini sudah berjalan stabil.
   - Peningkatan UI (styling visual desktop, seleksi rentang sel, context menu) diuji secara lokal terlebih dahulu sebelum di-push.
2. **Tahap 2 (Backward-Compatible State Management)**:
   - State Zustand (`useDatasetStore.ts`) diperluas untuk mencatat `selectionRange: { startRow, startCol, endRow, endCol }` dan `activeFilters: string[]`.
3. **Tahap 3 (Verification Gate)**:
   - Menjalankan `npm run build` di frontend untuk memvalidasi zero-error TypeScript compilation.
   - Menjalankan `pytest backend/tests/test_enterprise_suite.py` di backend untuk menjamin tingkat kelulusan tetap 100% dan cakupan kode tetap $\ge 80\%$.
4. **Tahap 4 (Atomic Git Commits)**:
   - Setiap gelombang di-commit dengan deskripsi semantik terperinci, memastikan pipeline CI/CD GitHub Actions dan deployment Vercel/Render tetap hijau.

---
*Dokumen ini merupakan Dokumen Spesifikasi Induk resmi yang menjadi tolok ukur tunggal (*single source of truth*) dalam pengembangan platform StatisticaPro Enterprise (OpenSPSS Studio).*
