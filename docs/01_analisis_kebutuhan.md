# 1. Analisis Kebutuhan Lengkap: OpenSPSS Statistics Web Studio

## 1.1 Visi dan Tujuan Produk
**OpenSPSS Statistics Web Studio** adalah aplikasi web analisis data dan statistik profesional yang mereplikasi 100% pengalaman pengguna (*user experience*), antarmuka (*UI/UX*), alur kerja (*workflow*), dan format pelaporan software statistik desktop **IBM SPSS Statistics**.

Tujuan utama produk:
1. **Familiaritas Penuh bagi Pengguna SPSS**: Peneliti, akademisi, mahasiswa, dan analis data yang telah terbiasa menggunakan SPSS desktop dapat langsung bekerja tanpa kurva pembelajaran (*zero learning curve*).
2. **Kebebasan Lisensi & Aksesibilitas Modern**: Berjalan langsung di browser web modern (Chrome, Edge, Firefox, Safari) di platform Windows, macOS, Linux, tablet, tanpa memerlukan instalasi aplikasi desktop proprietary berat.
3. **Kombinasi Dual Engine Cepat**: Menyediakan komputasi instan di sisi klien (*client-side sub-millisecond execution*) berbasis TypeScript untuk eksplorasi cepat, serta engine statistik backend Python berbasis **SciPy**, **Statsmodels**, **Pandas**, dan **Scikit-Learn** untuk verifikasi numerik rigor akademik.
4. **Keluaran Berstandar Publikasi Ilmiah**: Tabel statistik pivot berformat standar APA/SPSS dengan garis horizontal ganda (*double horizontal border*), indikator signifikansi dua sisi (*two-tailed significance*), dan visualisasi data resolusi tinggi siap ekspor.

---

## 1.2 Persona Pengguna

| Persona | Kebutuhan Utama | Ekspektasi Khusus |
|---|---|---|
| **Dosen & Peneliti Akademik** | Uji hipotesis statistik lengkap (ANOVA, T-Test, Regresi Berganda, Uji Validitas/Reliabilitas). | Tabel keluaran harus persis format SPSS untuk kemudahan penulisan jurnal ilmiah bereputasi. |
| **Mahasiswa Skripsi / Tesis** | Antarmuka Data View dan Variable View yang jelas untuk input data kuesioner dan koding variabel (*Value Labels*). | Mudah mengimpor data dari Excel/CSV, mendefinisikan label nilai, dan mengekspor laporan ke PDF/Word. |
| **Data Analyst & Riset Pasar** | Analisis frekuensi, tabulasi silang (*Crosstabs*), uji Chi-Square, dan visualisasi grafik batang/pie. | Kecepatan respons aplikasi, kemampuan filter data, dan fitur syntax batch untuk automasi. |

---

## 1.3 Matriks Perbandingan Fitur: SPSS Desktop vs OpenSPSS Web Studio

| Fitur / Komponen | IBM SPSS Statistics Desktop | OpenSPSS Web Studio | Status Implementasi |
|---|---|---|---|
| **Top Menu Bar** | File, Edit, View, Data, Transform, Analyze, Graphs, Utilities, Extensions, Window, Help | Identik lengkap dengan dropdown bertingkat & shortcut keyboard | ✅ 100% Selesai |
| **Toolbar** | Open, Save, Print, Undo, Redo, Recall, Find, Go To, Variables, Value Labels toggle | Ikon modern SVG responsif dengan tooltip | ✅ 100% Selesai |
| **Data View** | Spreadsheet grid dengan nomor baris otomatis dan header variabel | Grid interaktif, inline edit, keyboard navigation (panah/tab/enter) | ✅ 100% Selesai |
| **Variable View** | 11 kolom metadata: Name, Type, Width, Decimals, Label, Values, Missing, Columns, Align, Measure, Role | Tabel 11 kolom lengkap dengan modal editor Value Labels & tipe data | ✅ 100% Selesai |
| **Toggle Value Labels** | Tombol toolbar untuk berganti antara kode mentah (1/2) dan label (Male/Female) | Toggle instan di toolbar & menu view yang langsung mengubah tampilan sel | ✅ 100% Selesai |
| **Dialog Analisis** | Dialog 2-kotak (*Candidate Variables* $\rightarrow$ *Target Variables*) | Dialog interaktif dengan tombol transfer panah `>` dan `<`, sub-opsi, tombol OK, Paste, Reset, Cancel | ✅ 100% Selesai |
| **Output Viewer** | Split layout: Outline navigation tree di kiri, lembar keluaran pivot table di kanan | Hierarchical Outline Tree yang auto-scroll ke item, pivot table gaya APA/SPSS | ✅ 100% Selesai |
| **Syntax Editor** | Script editor perintah SPSS (FREQUENCIES, DESCRIPTIVES, REGRESSION, dll.) | Code editor dengan Run All, Run Selection, template script otomatis | ✅ 100% Selesai |
| **Descriptive Statistics** | Mean, Median, Mode, Variance, Std Dev, Range, Min, Max, SE Mean, Skewness, Kurtosis | Komputasi exact formula ddof=1, valid N, missing N | ✅ 100% Selesai |
| **Frequencies** | Frequency, Percent, Valid Percent, Cumulative Percent | Format tabel frekuensi standar SPSS dengan persentase valid | ✅ 100% Selesai |
| **Crosstabs** | Tabel kontingensi, Count, Expected Count, Row %, Col %, Total %, Uji Chi-Square | Pearson Chi-Square, df, Asymptotic Sig 2-sided | ✅ 100% Selesai |
| **Correlations** | Matriks Pearson, Spearman, Kendall dengan signifikansi 2-tailed dan tanda `*` / `**` | Matriks lengkap dengan flag signifikansi pada level 0.05 dan 0.01 | ✅ 100% Selesai |
| **T-Tests** | One-Sample, Independent Samples (Levene's test & Welch), Paired Samples | Seluruh tabel Levene F, Sig, t, df, Sig 2-tailed, Mean Diff, 95% CI | ✅ 100% Selesai |
| **One-Way ANOVA** | Descriptives per kelompok, tabel ANOVA (Between/Within SS, MS, F, Sig), Post Hoc Tukey HSD | Komputasi ANOVA lengkap + perbandingan berpasangan Tukey HSD | ✅ 100% Selesai |
| **Linear Regression** | Model Summary (R, R2, Adj R2, SE), ANOVA (F, Sig), Coefficients (B, SE, Beta, t, Sig, CI, VIF) | Model summary + ANOVA table + Coefficients table standar | ✅ 100% Selesai |
| **Import Data** | SAV, CSV, Excel, TXT | CSV, XLSX, XLS, TSV, JSON dengan preview & deteksi tipe otomatis | ✅ 100% Selesai |
| **Export Hasil** | PDF, DOCX, XLSX, HTML, Cetak | PDF, Excel (.xlsx multi-sheet Data View & Variable View), CSV, Print | ✅ 100% Selesai |
| **Tema Tampilan** | Windows Classic Light | 3 Mode: SPSS Classic Light, Modern Light, Academic Dark | ✅ 100% Selesai |

---

## 1.4 Kebutuhan Non-Fungsional (Non-Functional Requirements)
1. **Performa**:
   - Waktu muat inisial (*First Contentful Paint*) < 1.0 detik.
   - Perhitungan deskriptif untuk 50.000 baris data selesai dalam < 100 ms di browser klien.
2. **Kompatibilitas**:
   - Bekerja mulus pada resolusi layar minimal 1024x768 (desktop/laptop) hingga monitor ultra-wide 4K.
   - Kompatibel dengan semua browser modern (Chromium, Gecko, WebKit).
3. **Keandalan & Resiliensi**:
   - Jika koneksi backend terputus, aplikasi beralih secara transparan ke engine kalkulasi TypeScript klien tanpa menghentikan pekerjaan pengguna.
   - Penyimpanan status otomatis pada memori lokal (*local state persistence*).
