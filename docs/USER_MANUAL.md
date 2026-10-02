# StatisticaPro Enterprise (OpenSPSS Studio) — User Manual

## 1. Pendahuluan
**StatisticaPro Enterprise / OpenSPSS Studio** adalah platform analisis statistik berbasis web kelas enterprise yang secara presisi mereplikasi paradigma kerja desktop spreadsheet profesional (IBM SPSS Statistics) dengan keunggulan aksesibilitas cloud, kolaborasi tim, dan performa tinggi.

Aplikasi ini mempertahankan secara murni alur kerja klasik:
- **Data View**: Spreadsheet interaktif dengan nomor baris otomatis, virtual scrolling (hingga 100.000+ baris), pengeditan sel in-line, clipboard copy/paste, dan fill-down.
- **Variable View**: Metadata kamus data (Name, Type, Width, Decimals, Label, Values, Missing, Columns, Align, Measure, Role).
- **Output Viewer**: Penampil laporan terstruktur dengan navigasi hierarki pohon (Tree Outline), tabel pivot bergaris ganda standar APA/SPSS, dan visualisasi grafik interaktif.
- **Syntax Editor**: Editor kode Monaco dengan syntax highlighting SPSS, auto-complete, Run Selection, Run All, dan ekspor skrip `.sps`.

---

## 2. Navigasi Antarmuka

```
┌────────────────────────────────────────────────────────────────────────┐
│ TOP MENU BAR: File  Edit  View  Data  Transform  Analyze  Graphs ...   │
├────────────────────────────────────────────────────────────────────────┤
│ TOOLBAR: [Open] [Save] [Print] [Undo] [Data] [Var] [Out] [Syn] [Labels]│
├────────────────────────────────────────────────────────────────────────┤
│ WORKSPACE AREA:                                                        │
│                                                                        │
│   (Data View / Variable View / Output Viewer / Syntax Editor)          │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│ TAB BAR:  [ Data View ]  [ Variable View ]  [ Output ]  [ Syntax ]     │
├────────────────────────────────────────────────────────────────────────┤
│ STATUS BAR: IBM SPSS Statistics Processor is ready | Cases: 40 | Vars:9│
└────────────────────────────────────────────────────────────────────────┘
```

### Navigasi Tab Bawah
Untuk berpindah antara spreadsheet dan penampil output, klik tab di bagian bawah layar:
1. **Data View**: Menampilkan tabel data kasus (responden/observasi).
2. **Variable View**: Menampilkan definisi variabel dan label nilai.
3. **Output Viewer**: Menampilkan hasil perhitungan statistik dan grafik.
4. **Syntax Editor**: Menulis dan mengeksekusi perintah sintaks statistik SPSS.

---

## 3. Bekerja dengan Data

### 3.1 Mengimpor Dataset
1. Klik menu **File → Open Data...** atau ikon folder pada toolbar.
2. Pilih format file yang didukung:
   - **CSV / TSV**: Comma-separated atau tab-separated values.
   - **Excel (.xlsx / .xls)**: Spreadsheet multi-sheet.
   - **JSON**: Data terstruktur.
3. Dialog pratinjau akan mendeteksi tipe data secara otomatis (Numerik, String, Tanggal). Klik **Import Dataset**.

### 3.2 Mengedit Variabel pada Variable View
Klik tab **Variable View** atau klik dua kali (*double-click*) pada judul kolom di Data View:
- **Name**: Nama unik variabel (misal `salary`, `gender`).
- **Type**: Numeric, String, Date, Dollar, Currency, Percentage.
- **Decimals**: Jumlah angka di belakang koma (misal `2`).
- **Label**: Keterangan lengkap variabel (misal `Current Salary in USD`).
- **Values**: Klik tombol elipsis `...` untuk membuka **Value Labels Editor** guna memetakan kode angka ke label teks (misal `1 = Clerical`, `2 = Custodial`, `3 = Manager`).
- **Measure**: Tentukan skala pengukuran:
  - 📏 **Scale**: Variabel kontinu (Interval/Rasio) seperti gaji, tinggi badan.
  - 📶 **Ordinal**: Variabel bertingkat seperti tingkat pendidikan, skala Likert.
  - 🔘 **Nominal**: Variabel kategori tanpa urutan seperti gender, kelompok perlakuan.

### 3.3 Mengaktifkan / Menonaktifkan Value Labels
Klik ikon label **Tag (1 ↔ A)** pada toolbar atau menu **View → Value Labels**. Saat aktif, angka kode kategori pada Data View akan otomatis ditampilkan sebagai teks label.

---

## 4. Menjalankan Analisis Statistik

Semua prosedur analisis statistik tersedia di menu **Analyze** dengan dialog pemilihan dua kotak (*two-box variable transfer dialog*) khas SPSS:

### 4.1 Statistik Deskriptif (Descriptives & Frequencies)
- **Frequencies**: **Analyze → Descriptive Statistics → Frequencies...**
  - Pilih variabel diskret/kategori (misal `gender`, `jobcat`).
  - Menghasilkan tabel frekuensi, persentase, persentase valid, dan persentase kumulatif.
- **Descriptives**: **Analyze → Descriptive Statistics → Descriptives...**
  - Pilih variabel skala (misal `salary`, `salbegin`, `educ`).
  - Menghasilkan N Valid, Minimum, Maksimum, Mean, Std. Error, Std. Deviation, Variance, Skewness, dan Kurtosis.
- **Crosstabs**: **Analyze → Descriptive Statistics → Crosstabs...**
  - Pilih variabel baris (Row) dan variabel kolom (Column).
  - Menghitung tabel silang serta uji **Pearson Chi-Square** beserta derajat kebebasan dan p-value ($Sig.$).

### 4.2 Uji Beda Rata-Rata (T-Test & ANOVA)
- **One-Sample T Test**: **Analyze → Compare Means → One-Sample T Test...**
  - Menguji apakah rata-rata sampel berbeda secara signifikan dari nilai uji tertentu ($Test Value$).
- **Independent-Samples T Test**: **Analyze → Compare Means → Independent-Samples T Test...**
  - Membandingkan rata-rata 2 kelompok independen (misal gaji pria vs wanita).
  - Melaporkan **Levene's Test for Equality of Variances**, nilai $t$, $df$, dan Sig (2-tailed).
- **Paired-Samples T Test**: **Analyze → Compare Means → Paired-Samples T Test...**
  - Membandingkan pengukuran berpasangan (misal gaji awal vs gaji saat ini).
- **One-Way ANOVA**: **Analyze → Compare Means → One-Way ANOVA...**
  - Membandingkan rata-rata 3 kelompok atau lebih.
  - Menghasilkan tabel ANOVA (Between Groups, Within Groups, F ratio, Sig) serta uji lanjut **Tukey HSD Post-Hoc**.
- **Univariate ANOVA (Two-Way)**: **Analyze → Compare Means → Univariate ANOVA (Two-Way)...**
  - Menganalisis pengaruh dua faktor independen dan efek interaksinya terhadap variabel terikat.

### 4.3 Analisis Korelasi & Regresi
- **Bivariate Correlations**: **Analyze → Correlate → Bivariate...**
  - Menghasilkan matriks korelasi Pearson dan Spearman beserta signifikansi dua arah.
- **Linear Regression**: **Analyze → Regression → Linear...**
  - Masukkan variabel dependen ($Y$) dan satu atau lebih variabel independen ($X$).
  - Menghasilkan tabel **Model Summary** ($R$, $R^2$, Adjusted $R^2$, Std. Error), **ANOVA**, dan tabel **Coefficients** (Unstandardized $B$, $SE$, Standardized $\beta$, $t$, dan $Sig.$).

### 4.4 Uji Non-Parametrik & Uji Reliabilitas
- **Reliability Analysis (Cronbach's Alpha)**: **Analyze → Scale → Reliability Analysis...**
  - Pilih item kuesioner (minimal 2 variabel).
  - Menghitung koefisien **Cronbach's Alpha** dan tabel **Item-Total Statistics** (Alpha if item deleted).
- **Two Independent Samples (Mann-Whitney U)**: **Analyze → Nonparametric Tests → Two Independent Samples...**
  - Pengganti non-parametrik untuk Independent Samples T-Test.
- **Two Related Samples (Wilcoxon)**: **Analyze → Nonparametric Tests → Two Related Samples...**
  - Pengganti non-parametrik untuk Paired Samples T-Test.
- **K Independent Samples (Kruskal-Wallis H)**: **Analyze → Nonparametric Tests → K Independent Samples...**
  - Pengganti non-parametrik untuk One-Way ANOVA.

---

## 5. Menggunakan Syntax Editor

Untuk pengguna tingkat lanjut yang terbiasa menggunakan skrip SPSS:
1. Buka tab **Syntax Editor** atau klik tombol **Paste** pada setiap dialog analisis.
2. Anda dapat menulis perintah SPSS standar berakhiran titik (`.`):
   ```spss
   * Menjalankan analisis frekuensi dan deskriptif.
   FREQUENCIES VARIABLES=gender jobcat
     /ORDER=ANALYSIS.

   DESCRIPTIVES VARIABLES=salary salbegin educ
     /STATISTICS=MEAN STDDEV MIN MAX.

   CORRELATIONS
     /VARIABLES=salary salbegin educ
     /PRINT=TWOTAIL.
   ```
3. Klik **Run All** (atau `Ctrl+R`) untuk mengeksekusi seluruh skrip.
4. Klik **Run Selection** untuk menjalankan blok perintah yang disorot saja.
5. Gunakan **Save (.sps)** untuk mengunduh skrip atau **Open (.sps)** untuk memuat skrip yang sudah ada.

---

## 6. Output Viewer & Ekspor Laporan

Setelah analisis selesai dijalankan:
1. Layar akan otomatis beralih ke **Output Viewer**.
2. Panel kiri menampilkan **Outline Tree** yang memungkinkan navigasi cepat ke judul analisis tertentu.
3. Tabel output disajikan dengan format tabel statistik profesional bergaris ganda standar publikasi ilmiah.
4. **Mengekspor Laporan**:
   - Klik **Export PDF** (atau `Ctrl+P`) untuk menghasilkan dokumen cetak / PDF siap kirim.
   - Klik **Export Excel** untuk mengunduh seluruh tabel ke format buku kerja `.xlsx`.
