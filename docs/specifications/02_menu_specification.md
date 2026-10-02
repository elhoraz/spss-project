# SPECIFICATION 02: MENU SPECIFICATION
**Complete 11-Menu Hierarchy, Dialog Triggers, Keyboard Accelerators & Execution Behaviors**
**Standard Reference:** IBM SPSS Statistics 28/29 Professional Desktop  
**Version:** 3.0.0-PRO  

---

## 1. File Menu
* **Tujuan**: Mengelola siklus hidup berkas dataset, skrip sintaks, penampil output, impor berkas eksternal, ekspor dokumen laporan, serta pencetakan.
* **Tabel Hirarki Submenu**:

| Submenu / Item | Shortcut | Dialog Terkait | Perilaku Pengguna & Alur Kerja | Output / Efek Sistem |
| :--- | :--- | :--- | :--- | :--- |
| `New > Data` | `Ctrl + N` | - | Pengguna meminta instance lembar kerja baru. Jika data saat ini ada perubahan yang belum disimpan, sistem memunculkan prompt konfirmasi (*Save changes?*). | Mengosongkan data grid dan kamus variabel; me-reset nama dokumen menjadi `DataSet1.sav`. |
| `New > Syntax` | - | - | Pengguna membuka jendela editor sintaks baru. | Menampilkan tab Syntax Editor dengan buffer dokumen sintaks kosong `Syntax1.sps`. |
| `New > Output` | - | - | Pengguna membuka sesi output baru. | Menginisialisasi dokumen output kosong dengan node akar log `Output1.spv`. |
| `Open > Data...` | `Ctrl + O` | File Open Dialog | Memilih file `.sav`, `.csv`, atau `.xlsx` dari disk lokal atau cloud storage. | Parsing file ke memori, mengisi Data View dan Variable View secara lengkap. |
| `Open > Syntax...` | - | File Open Dialog | Memilih file skrip `.sps`. | Memuat teks skrip ke dalam Syntax Editor Monaco. |
| `Open > Output...` | - | File Open Dialog | Memilih file laporan `.spv` / `.json`. | Merekonstruksi seluruh pohon navigasi dan tabel pivot pada Output Viewer. |
| `Import Data > CSV/Text...` | - | Text Import Wizard (5-Step) | Pengguna memilih file teks delimited, memverifikasi delimiter (koma/titik-koma/tab), header, dan tipe data per kolom. | Mengonversi data CSV menjadi dataset aktif dengan metadata variabel otomatis. |
| `Import Data > Excel...` | - | Excel Import Modal | Memilih sheet Excel, rentang sel, dan opsi membaca baris pertama sebagai nama variabel. | Mengimpor sheet Excel menjadi dataset aktif. |
| `Save` | `Ctrl + S` | File Save Dialog (jika baru) | Menyimpan dataset aktif ke storage lokal atau memicu pengunduhan berkas binary `.sav`. | Status bar berubah menjadi `"Dataset saved successfully"`. Indikator dirty state hilang. |
| `Save As...` | `Ctrl + Shift + S` | File Save As Dialog | Menentukan nama berkas baru atau format penyimpanan alternatif (.sav, .xlsx, .csv). | Menyimpan salinan dataset dengan nama/format baru. |
| `Export > PDF...` | `Ctrl + P` | PDF Export Dialog | Pengguna memilih orientasi halaman (Portrait/Landscape), cakupan tabel, dan margin. | Menghasilkan file PDF terformat rapi sesuai layout laporan statistik desktop. |
| `Export > Excel (.xlsx)...` | - | Excel Export Modal | Memilih opsi menyertakan tabel pivot dan grafik ke worksheet Excel. | Mengunduh file `.xlsx` dengan format angka presisi dan judul tabel. |
| `Print...` | `Ctrl + Shift + P` | Native OS Print Modal | Membuka jendela dialog print sistem operasi untuk mencetak lembar output. | Mengirim dokumen output ke driver printer. |
| `Exit` | `Alt + F4` | Confirm Exit Dialog | Menutup sesi kerja. Jika ada data kotor (*unsaved*), memunculkan dialog konfirmasi penyimpanan. | Menutup aplikasi atau me-reset sesi ke kondisi awal. |

---

## 2. Edit Menu
* **Tujuan**: Operasi manipulasi sel, modifikasi struktur baris/kolom, riwayat operasi (undo/redo), pencarian data, dan konfigurasi preferensi sistem.
* **Tabel Hirarki Submenu**:

| Submenu / Item | Shortcut | Dialog Terkait | Perilaku Pengguna & Alur Kerja | Output / Efek Sistem |
| :--- | :--- | :--- | :--- | :--- |
| `Undo` | `Ctrl + Z` | - | Membatalkan perubahan terakhir pada sel atau metadata variabel. | Memulihkan snapshot state dataset sebelumnya dari undo stack. |
| `Redo` | `Ctrl + Y` | - | Memulihkan perubahan yang sebelumnya dibatalkan oleh Undo. | Mengaplikasikan ulang perubahan dari redo stack. |
| `Cut` | `Ctrl + X` | - | Memotong nilai sel terpilih ke clipboard OS. | Nilai sel dikosongkan (`null` / System-missing); data tersimpan di clipboard format TSV. |
| `Copy` | `Ctrl + C` | - | Menyalin nilai sel atau rentang sel terpilih ke clipboard. | Data tersalin ke clipboard OS dalam format Tab-Separated Values (TSV). |
| `Paste` | `Ctrl + V` | - | Menempelkan isi clipboard mulai dari koordinat sel aktif `(r, c)`. | Memperbarui sel; memperluas baris/kolom otomatis jika clipboard melampaui ukuran grid. |
| `Paste Variables...` | - | Paste Variable Modal | Menempelkan definisi variabel baru dari clipboard ke Variable View. | Membuat kolom variabel baru dengan tipe dan label yang sesuai. |
| `Clear` | `Delete` | - | Menghapus konten sel terpilih tanpa menggeser struktur kolom/baris. | Sel diset menjadi nilai kosong / `.` (System Missing). |
| `Insert Variable` | - | - | Pengguna mengklik untuk menambahkan variabel di sebelah kiri kolom aktif. | Menambahkan kolom `VAR0000X` baru pada Data View dan baris baru di Variable View. |
| `Insert Case` | - | - | Pengguna mengklik untuk menambahkan baris kasus di atas baris aktif. | Menambahkan baris kosong baru; nomor kasus di bawahnya bergeser ke bawah (+1). |
| `Find...` | `Ctrl + F` | Find Dialog | Mencari nilai teks/angka dalam kolom aktif atau seluruh dataset. | Menyorot sel pertama yang cocok dan menggulir grid ke posisi sel tersebut. |
| `Replace...` | `Ctrl + H` | Find & Replace Dialog | Mencari nilai tertentu dan menggantikannya dengan nilai baru (Find Next / Replace / Replace All). | Mengubah nilai sel yang memenuhi kriteria pencarian secara instan. |
| `Go to Case...` | `Ctrl + G` | Go to Case Modal | Memasukkan nomor baris kasus (misal: baris 1050). | Menggulir virtual grid seketika dan menempatkan sel aktif pada baris 1050. |
| `Go to Variable...` | `Ctrl + Shift + G` | Go to Variable Modal | Memilih nama variabel dari dropdown pencarian. | Menggulir horizontal ke kolom variabel tersebut dan menjadikannya kolom aktif. |
| `Options...` | - | Preferences Modal | Mengatur presisi desimal default, ukuran font grid, tema UI, dan direktori penyimpanan berkas. | Preferensi disimpan ke `localStorage` dan langsung diterapkan ke antarmuka. |

---

## 3. View Menu
* **Tujuan**: Mengontrol visibilitas elemen antarmuka grafis, memformat tampilan visual data, dan berpindah antar dokumen.
* **Tabel Hirarki Submenu**:

| Submenu / Item | Shortcut | Dialog Terkait | Perilaku Pengguna & Alur Kerja | Output / Efek Sistem |
| :--- | :--- | :--- | :--- | :--- |
| `Status Bar` | - | - | Toggle centang visibilitas baris status bawah. | Menampilkan / menyembunyikan status bar footer. |
| `Toolbar` | - | - | Toggle centang visibilitas bilah ikon shortcut toolbar atas. | Menampilkan / menyembunyikan icon toolbar. |
| `Grid Lines` | - | - | Toggle garis batas sel spreadsheet. | Mengubah border sel grid dari tipis `#D1D5DB` menjadi transparan/putih. |
| `Value Labels` | `Ctrl + Alt + V` | - | Beralih antara menampilkan kode angka murni vs label deskriptif teks pada sel berkategori. | Nilai sel `1` langsung ditampilkan sebagai `"Laki-laki"`, `2` sebagai `"Perempuan"`. |
| `Variables` | - | Variables Inspection Modal | Menampilkan jendela ringkasan atribut seluruh variabel dataset. | Modal inspeksi metadata variabel aktif. |
| `Data View` | `Ctrl + 1` | - | Beralih ke lembar kerja data kasus. | Tab Data View aktif; grid data ditampilkan. |
| `Variable View` | `Ctrl + 2` | - | Beralih ke kamus metadata variabel. | Tab Variable View aktif; grid kamus atribut ditampilkan. |
| `Output Viewer` | `Ctrl + 3` | - | Berpindah ke jendela laporan output statistik. | Layar menampilkan penampil laporan pohon output dan tabel pivot. |
| `Syntax Editor` | `Ctrl + 4` | - | Berpindah ke editor kode perintah SPSS. | Layar menampilkan Monaco Editor sintaks dengan command runner. |

---

## 4. Data Menu
* **Tujuan**: Operasi struktural tingkat dataset, pengurutan, penyaringan observasi, pemisahan berkas, pembobotan kasus, dan transformasi relasional.
* **Tabel Hirarki Submenu**:

| Submenu / Item | Shortcut | Dialog Terkait | Perilaku Pengguna & Alur Kerja | Output / Efek Sistem |
| :--- | :--- | :--- | :--- | :--- |
| `Define Variable Properties...` | - | Variable Properties Wizard | Mengonfigurasi atribut banyak variabel secara berurutan. | Memperbarui kamus variabel secara massal. |
| `Sort Cases...` | - | Sort Cases Dialog | Memilih 1 atau lebih variabel kunci; menentukan arah urut (*Ascending* / *Descending*). | Baris kasus diurutkan ulang seketika; nomor baris tetap 1..N. |
| `Transpose...` | - | Transpose Dialog | Membalik baris kasus menjadi kolom dan kolom variabel menjadi baris. | Menghasilkan dataset ter-transpose; variabel baru dinamai `case1, case2..`. |
| `Merge Files > Add Cases...` | - | Merge Cases Wizard | Menggabungkan baris dari berkas dataset eksternal ke dataset aktif. | Menambahkan baris kasus baru di bagian bawah dataset aktif. |
| `Merge Files > Add Variables...` | - | Merge Variables Wizard | Menggabungkan kolom variabel baru berdasarkan *Key Variable* (ID pengait). | Kolom baru ditambahkan ke dataset aktif sesuai pencocokan ID. |
| `Aggregate...` | - | Aggregate Dialog | Memilih break variable dan variabel agregasi dengan fungsi `MEAN`, `SUM`, `COUNT`, dll. | Menghasilkan dataset ringkasan baru atau menambahkan kolom agregat. |
| `Split File...` | - | Split File Dialog | Memilih mode *Compare groups* atau *Organize output by groups* berdasarkan variabel pemecah. | Analisis statistik selanjutnya dieksekusi terpisah per grup kategori. Status bar: `Split File: ON`. |
| `Select Cases...` | - | Select Cases Dialog | Memilih filter *If condition is satisfied* (misal: `salary > 30000`). | Membuat kolom `filter_$`. Baris tidak lolos dicoret nomor barisnya (`~~12~~`). Status bar: `Filter: ON`. |
| `Weight Cases...` | - | Weight Cases Dialog | Memilih variabel numerik pembobot frekuensi kasus (*Frequency Variable*). | Setiap kasus dihitung berulang seberat nilai bobotnya dalam analisis. Status bar: `Weight: ON`. |
| `Restructure...` | - | Restructure Wizard | Mengonversi bentuk dataset dari format *Wide* ke *Long* atau sebaliknya. | Mengubah dimensi dan skema tabel dataset secara struktural. |

---

## 5. Transform Menu
* **Tujuan**: Transformasi matematis nilai variabel, kalkulasi aljabar, rekoding nilai kategori, kalkulasi skor total, dan imputasi data hilang.
* **Tabel Hirarki Submenu**:

| Submenu / Item | Shortcut | Dialog Terkait | Perilaku Pengguna & Alur Kerja | Output / Efek Sistem |
| :--- | :--- | :--- | :--- | :--- |
| `Compute Variable...` | - | Compute Variable Dialog | Menentukan nama target variable dan formula ekspresi (misal: `total = q1 + q2 + q3`). | Membuat atau menimpa variabel dengan hasil perhitungan formula per baris. |
| `Recode into Same Variables...` | - | Recode Dialog | Memetakan nilai lama ke nilai baru langsung pada kolom yang sama (misal: `1 -> 10, 2 -> 20`). | Nilai pada kolom yang dipilih digantikan dengan nilai baru secara langsung. |
| `Recode into Different Variables...` | - | Recode into New Dialog | Memetakan nilai lama ke nilai baru pada kolom baru tanpa merusak data asli. | Kolom variabel baru dibuat dengan nilai terkodekan. |
| `Automatic Recode...` | - | Auto Recode Dialog | Mengubah variabel teks string menjadi kode numerik integer urut 1..k secara otomatis. | Kolom numerik baru dibuat lengkap dengan Value Labels dari teks asli. |
| `Count Values within Cases...` | - | Count Values Dialog | Menghitung berapa kali nilai tertentu muncul pada sekumpulan variabel di setiap baris. | Kolom variabel baru bernilai integer frekuensi kemunculan. |
| `Rank Cases...` | - | Rank Cases Dialog | Menghitung ranking nilai ordinal (urutan 1..N) per baris kasus. | Kolom ranking baru `R<varname>` ditambahkan ke dataset. |
| `Replace Missing Values...` | - | Replace Missing Modal | Mengisi nilai kosong dengan metode *Series Mean*, *Linear Interpolation*, atau *Trend*. | Nilai `null` / System-missing digantikan dengan nilai imputasi terhitung. |

---

## 6. Analyze Menu
* **Tujuan**: Inti mesin analisis inferensial, deskriptif, pemodelan statistik, dan pengujian hipotesis.
* **Tabel Hirarki Submenu**:

| Submenu / Item | Shortcut | Dialog Terkait | Perilaku Pengguna & Alur Kerja | Output / Efek Sistem |
| :--- | :--- | :--- | :--- | :--- |
| `Descriptives > Frequencies...` | - | Frequencies Dialog | Memindahkan variabel kategori/skala ke listbox Target; memilih tendensi sentral & chart. | Tabel Frekuensi (Frekuensi, Persentase, Persen Valid, Kumulatif) & Chart di Output Viewer. |
| `Descriptives > Descriptives...` | - | Descriptives Dialog | Memindahkan variabel kontinu; opsi simpan Z-scores (`[x] Save standardized values`). | Tabel Ringkasan Deskriptif ($N, \text{Mean}, \text{SD}, \text{Min}, \text{Max}$) & variabel `Z...`. |
| `Descriptives > Explore...` | - | Explore Dialog | Memindahkan variabel dependen dan faktor; uji normalitas Shapiro-Wilk/Kolmogorov-Smirnov. | Tabel Deskriptif lengkap, Uji Normalitas, 5 Outlier ekstrem, dan Boxplot. |
| `Descriptives > Crosstabs...` | - | Crosstabs Dialog | Menetapkan variabel Baris dan Kolom; memilih uji Chi-Square & Cramer's V. | Tabel Tabulasi Silang (Observed, Expected, %) & Tabel Chi-Square Tests. |
| `Compare Means > Means...` | - | Means Report Dialog | Menetapkan variabel Dependen dan Independen Layer. | Tabel Laporan Rata-rata sub-kelompok & ANOVA linearity test. |
| `Compare Means > One-Sample T Test...` | - | One-Sample T Dialog | Memilih variabel uji dan memasukkan konstanta `Test Value`. | Tabel One-Sample Statistics & One-Sample Test ($t, df, p, \text{Mean Diff}$). |
| `Compare Means > Independent T Test...` | - | Indep-Samples T Dialog | Memilih variabel uji dan variabel grouping dengan mendefinisikan 2 grup. | Tabel Levene's Test for Equality of Variances & Uji t (Equal/Unequal variances). |
| `Compare Means > Paired-Samples T Test...`| - | Paired T-Test Dialog | Memilih pasangan variabel kondisi Pre dan Post. | Tabel Paired Samples Statistics, Korelasi, dan Uji t perbedaan berpasangan. |
| `Compare Means > One-Way ANOVA...` | - | One-Way ANOVA Dialog | Memilih variabel Dependen dan Faktor; memilih uji Post Hoc (Tukey, Bonferroni). | Tabel Uji Homogenitas Levene, ANOVA ($F, df, p$), dan Multiple Comparisons. |
| `Correlate > Bivariate...` | - | Bivariate Correlation | Memilih 2+ variabel numerik; memilih Pearson/Spearman/Kendall; penanda signifikansi *. | Tabel Matriks Korelasi Simetris dengan tanda signifikansi * ($p<0.05$) dan ** ($p<0.01$). |
| `Regression > Linear...` | - | Linear Regression Dialog| Menetapkan 1 variabel Dependen dan 1+ Independen; metode Enter/Stepwise. | Model Summary ($R, R^2, SE$), ANOVA F, Koefisien ($B, SE, \beta, t, p$), VIF, Durbin-Watson. |
| `Regression > Binary Logistic...` | - | Binary Logistic Dialog | Menetapkan 1 variabel dependen biner (0/1) dan prediktor kovariat. | Omnibus Tests, Model Summary ($R^2$ Nagelkerke), Hosmer-Lemeshow, Tabel Klasifikasi, Odds Ratio $\text{Exp}(B)$. |
| `Nonparametric > Two Independent...` | - | Nonparam 2 Indep Dialog| Uji Mann-Whitney U untuk dua kelompok sampel bebas non-normal. | Tabel Ranks (Mean Rank, Sum of Ranks) & Test Statistics (Mann-Whitney U, Wilcoxon W, Z, p). |
| `Nonparametric > Two Related...` | - | Wilcoxon Signed Ranks | Uji Wilcoxon signed-rank untuk data berpasangan non-parametrik. | Tabel Ranks peringkat positif/negatif & Statistik Uji Z. |
| `Nonparametric > K Independent...` | - | Kruskal-Wallis Dialog | Uji Kruskal-Wallis H untuk perbandingan k kelompok bebas non-parametrik. | Tabel Mean Ranks per grup & Test Statistics Chi-Square ($H, df, p$). |
| `Scale > Reliability Analysis...` | - | Reliability Dialog | Memasukkan item-item instrumen; memilih model Alpha Cronbach. | Reliability Statistics ($\alpha$, $N$) & Tabel Item-Total Statistics. |
| `Dimension Reduction > Factor...` | - | Factor Analysis Dialog | Memilih variabel kontinu; metode PCA; rotasi Varimax; ekstraksi Eigenvalues $\ge 1$. | KMO and Bartlett's Test, Communalities, Total Variance Explained, Rotated Component Matrix. |
| `Classify > K-Means Cluster...` | - | K-Means Cluster Dialog | Menentukan jumlah cluster $k$ dan variabel fitur pengelompokan. | Final Cluster Centers, Jumlah Kasus per Cluster, dan Tabel ANOVA pembeda cluster. |

---

## 7. Graphs Menu
* **Tujuan**: Visualisasi grafis eksploratif dan pembuatan diagram statistik untuk presentasi dan publikasi ilmiah.
* **Tabel Hirarki Submenu**:

| Submenu / Item | Shortcut | Dialog Terkait | Perilaku Pengguna & Alur Kerja | Output / Efek Sistem |
| :--- | :--- | :--- | :--- | :--- |
| `Chart Builder...` | - | Visual Chart Builder | Kanvas visual seret-dan-lepas (drag-and-drop) elemen sumbu X, Y, Legend, dan Grup. | Grafik interaktif kustom disisipkan ke Output Viewer. |
| `Legacy Dialogs > Bar...` | - | Bar Chart Dialog | Memilih Simple, Clustered, atau Stacked Bar Chart berdasarkan variabel kategori. | Diagram batang kategori dengan label frekuensi/persentase di Output Viewer. |
| `Legacy Dialogs > Pie...` | - | Pie Chart Dialog | Memilih variabel kategori untuk dipotong menjadi irisan sektor proporsional. | Diagram lingkaran persentase dengan legenda kategori di Output Viewer. |
| `Legacy Dialogs > Histogram...` | - | Histogram Dialog | Memilih variabel skala; centang opsi `[x] Display normal curve`. | Grafik histogram dengan binning optimal dan overlay kurva normal Gaussian. |
| `Legacy Dialogs > Scatter/Dot...` | - | Scatter Plot Dialog | Menetapkan sumbu X dan Y; opsi penanda kategori (*Color By*) dan garis fit regresi. | Diagram pencar sebaran titik data dengan garis tren linier di Output Viewer. |
| `Legacy Dialogs > Line...` | - | Line Chart Dialog | Memilih variabel skala kontinu atau deret urutan observasi kasus. | Grafik garis tren observasi di Output Viewer. |
| `Legacy Dialogs > Boxplot...` | - | Boxplot Dialog | Memilih variabel skala dan variabel faktor pengelompokan. | Diagram kotak-garis (Median, IQR, Whiskers, dan titik outlier berlabel ID kasus). |

---

## 8. Utilities Menu
* **Tujuan**: Inspeksi cepat kamus data dan manajemen skrip kustom.
* **Tabel Hirarki Submenu**:

| Submenu / Item | Shortcut | Dialog Terkait | Perilaku Pengguna & Alur Kerja | Output / Efek Sistem |
| :--- | :--- | :--- | :--- | :--- |
| `Variables...` | `Ctrl + U` | Variables Utility Modal | Memilih variabel dari listbox untuk melihat label, tipe, missing values, dan value labels. | Modal mengambang inspeksi properti variabel cepat tanpa harus ke Variable View. |
| `Variable Sets...` | - | Variable Sets Modal | Mendefinisikan kelompok variabel spesifik untuk membatasi tampilan pada dialog analisis. | Memfilter daftar variabel yang terlihat di listbox dialog analisis. |
| `Run Script...` | - | Script Runner Modal | Memilih skrip otomatisasi eksternal berbasis Python atau JavaScript. | Mengeksekusi rentetan perintah otomatisasi pada dataset aktif. |

---

## 9. Extensions Menu
* **Tujuan**: Integrasi modul eksternal dan pustaka analitik tambahan.
* **Tabel Hirarki Submenu**:

| Submenu / Item | Shortcut | Dialog Terkait | Perilaku Pengguna & Alur Kerja | Output / Efek Sistem |
| :--- | :--- | :--- | :--- | :--- |
| `Extension Hub...` | - | Extension Hub Modal | Menelusuri repositori modul statistik tambahan (misal: R Integration, Advanced GLM). | Mengunduh dan memasang modul ekstensi baru ke dalam sistem menu. |
| `Install Local Extension...` | - | File Picker Modal | Memilih paket ekstensi berkas lokal `.spe`. | Memasang dialog dan sintaks tambahan ke aplikasi. |

---

## 10. Window Menu
* **Tujuan**: Manajemen navigasi multi-jendela dan pembagian layar kerja (*Split View*).
* **Tabel Hirarki Submenu**:

| Submenu / Item | Shortcut | Dialog Terkait | Perilaku Pengguna & Alur Kerja | Output / Efek Sistem |
| :--- | :--- | :--- | :--- | :--- |
| `Split Grid` | - | - | Membagi lembar kerja Data View menjadi 4 kuadran spreadsheet independen. | Menampilkan pembagi grid horizontal dan vertikal yang dapat digeser. |
| `Data Editor Window` | `Ctrl + 1` | - | Menampilkan jendela editor dataset utama. | Menjadikan jendela Data Editor aktif di depan. |
| `Output Viewer Window`| `Ctrl + 3` | - | Menampilkan jendela penampil laporan hasil analisis. | Menjadikan jendela Output Viewer aktif di depan. |
| `Syntax Editor Window`| `Ctrl + 4` | - | Menampilkan jendela editor sintaks perintah. | Menjadikan jendela Syntax Editor aktif di depan. |
| `Tile Windows` | - | - | Menyusun jendela Data Editor dan Output Viewer berdampingan (*Side-by-Side*). | Mengubah tata letak layar menjadi split-screen 50:50. |

---

## 11. Help Menu
* **Tujuan**: Bantuan operasional, manual algoritma matematika, panduan sintaks, dan informasi versi.
* **Tabel Hirarki Submenu**:

| Submenu / Item | Shortcut | Dialog Terkait | Perilaku Pengguna & Alur Kerja | Output / Efek Sistem |
| :--- | :--- | :--- | :--- | :--- |
| `Topics...` | `F1` | Help Topics Modal | Membuka panduan lengkap sistem bantuan navigasi topik dan pencarian kata kunci. | Menampilkan artikel panduan penggunaan fitur yang dicari. |
| `Algorithms Reference`| - | Mathematical Docs Modal | Menampilkan dokumentasi penurunan rumus matematika seluruh uji statistik. | Menampilkan rumus matematis lengkap dari setiap prosedur analisis. |
| `Syntax Reference Guide`|- | Syntax Docs Modal | Menampilkan kamus lengkap sintaks perintah SPSS, sub-perintah, dan keyword. | Membantu pengguna mempelajari cara penulisan skrip `.sps`. |
| `Case Studies` | - | Case Studies Modal | Menampilkan contoh analisis data dunia nyata (misal: survei karyawan, uji klinis obat). | Membuka dataset contoh bawaan dan langkah analisis panduan. |
| `About OpenSPSS Studio`|- | About System Dialog | Menampilkan informasi versi, build number, lisensi enterprise, dan status backend. | Dialog pop-up berisi versi `3.0.0-PRO`, status koneksi backend, dan arsitektur mesin. |
