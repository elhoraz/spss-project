# 4. Panduan Penggunaan & Panduan Transisi Pengguna SPSS

Selamat datang di **OpenSPSS Statistics Web Studio**. Panduan ini disusun untuk membantu pengguna baru maupun pengguna SPSS desktop lama agar dapat langsung bekerja dengan nyaman.

---

## 4.1 Navigasi Utama Aplikasi

Aplikasi memiliki 4 tampilan utama yang dapat diakses melalui tab di bagian kiri bawah layar:
1. **Data View**: Menampilkan tabel data baris dan kolom seperti lembar kerja Excel atau Data View SPSS.
2. **Variable View**: Menampilkan 11 kolom metadata SPSS untuk mengatur nama, tipe data, jumlah desimal, label, label nilai (*Value Labels*), dan skala pengukuran variabel.
3. **Output Viewer**: Menampilkan dokumen hasil analisis, pohon navigasi outline, tabel pivot berformat standar APA, dan visualisasi grafik.
4. **Syntax Editor**: Menampilkan editor kode untuk menulis dan mengeksekusi perintah sintaks SPSS.

---

## 4.2 Langkah Demi Langkah Analisis Statistik

### 1. Menjalankan Analisis Frekuensi (Frequencies)
1. Buka menu **Analyze** $\rightarrow$ **Descriptive Statistics** $\rightarrow$ **Frequencies...**
2. Pada dialog yang muncul, klik variabel kategori (contoh: `gender` atau `jobcat`) pada kotak kiri, lalu klik tombol panah **`>`** untuk memindahkannya ke kotak **Selected Variable(s)**.
3. Klik tombol **[OK]**.
4. Aplikasi otomatis membuka tab **Output Viewer** dan menampilkan tabel frekuensi lengkap dengan nilai *Frequency*, *Percent*, *Valid Percent*, dan *Cumulative Percent*.

### 2. Menjalankan Analisis Deskriptif (Descriptives)
1. Buka menu **Analyze** $\rightarrow$ **Descriptive Statistics** $\rightarrow$ **Descriptives...**
2. Pilih variabel berskala kuantitatif (contoh: `salary`, `salbegin`, `educ`).
3. Klik tombol **[OK]**.
4. Output Viewer menampilkan tabel statistik deskriptif: *Valid N*, *Minimum*, *Maximum*, *Mean*, *Std. Error*, *Std. Deviation*, dan *Variance*.

### 3. Menjalankan Tabulasi Silang & Uji Chi-Square (Crosstabs)
1. Buka menu **Analyze** $\rightarrow$ **Descriptive Statistics** $\rightarrow$ **Crosstabs...**
2. Pilih variabel baris pada **Row(s)** (contoh: `gender`) dan variabel kolom pada **Column(s)** (contoh: `jobcat`).
3. Klik tombol **[OK]**.
4. Output Viewer menampilkan tabel kontingensi dua arah lengkap dengan persentase baris, frekuensi ekspektasi (*Expected Count*), dan tabel hasil uji **Pearson Chi-Square** beserta derajat kebebasan (*df*) dan signifikansi asimptotik (*Asymptotic Sig. 2-sided*).

### 4. Menjalankan Uji Beda Dua Kelompok Bebas (Independent-Samples T-Test)
1. Buka menu **Analyze** $\rightarrow$ **Compare Means** $\rightarrow$ **Independent-Samples T Test...**
2. Pindahkan variabel kontinu (contoh: `salary`) ke kotak **Test Variable(s)**.
3. Pilih variabel pemisah kelompok pada **Grouping Variable** (contoh: `gender`).
4. Klik **[OK]**.
5. Output Viewer menampilkan tabel statistik kelompok (*Group Statistics*) dan tabel **Independent Samples Test** yang mencakup:
   - Uji homogenitas varians Levene (*Levene's Test for Equality of Variances: F dan Sig.*)
   - Uji-t asumsi varians sama (*Equal variances assumed*)
   - Uji-t Welch jika varians berbeda (*Equal variances not assumed*)
   - Perbedaan rata-rata (*Mean Difference*), kesalahan standar (*Std. Error Difference*), dan selang kepercayaan 95% (*95% Confidence Interval*).

### 5. Menjalankan Analisis Varian Satu Arah (One-Way ANOVA)
1. Buka menu **Analyze** $\rightarrow$ **Compare Means** $\rightarrow$ **One-Way ANOVA...**
2. Pilih variabel dependen numerik pada **Dependent List** (contoh: `salary`).
3. Pilih variabel faktor kelompok pada **Factor** (contoh: `jobcat`).
4. Klik **[OK]**.
5. Output Viewer menampilkan tabel deskriptif per kelompok, tabel ANOVA (*Between Groups*, *Within Groups*, *Sum of Squares*, *df*, *Mean Square*, nilai statistik *F*, dan nilai signifikansi *Sig.*), serta perbandingan berganda **Post-Hoc Tukey HSD**.

### 6. Menjalankan Analisis Regresi Linier (Linear Regression)
1. Buka menu **Analyze** $\rightarrow$ **Regression** $\rightarrow$ **Linear...**
2. Pilih variabel terikat pada **Dependent Variable** (contoh: `salary`).
3. Pindahkan variabel bebas ke kotak **Independent(s)** (contoh: `salbegin`, `educ`).
4. Klik **[OK]**.
5. Output Viewer menampilkan:
   - **Model Summary**: $R$, $R^2$ (*R Square*), *Adjusted R Square*, dan *Std. Error of the Estimate*.
   - **ANOVA**: Uji kelayakan model simultan ($F$-hitung dan signifikansi).
   - **Coefficients**: Koefisien regresi tak terstandarisasi ($B$ dan *Std. Error*), koefisien terstandarisasi ($\beta$), nilai $t$-hitung, dan nilai signifikansi $p$-value masing-masing prediktor.

---

## 4.3 Menggunakan Fitur Value Labels

Dalam analisis data survei atau kuesioner, data sering diinput berupa angka (1, 2) untuk mewakili kategori ("Pria", "Wanita").
1. Klik tab **Variable View** di bagian bawah.
2. Cari baris variabel yang ingin diberi label nilai (misal: `gender`).
3. Pada kolom **Values**, klik tombol `[...]`.
4. Masukkan **Value** (contoh: `1`) dan **Label** (contoh: `Laki-laki`), lalu klik **Add**.
5. Masukkan **Value** (contoh: `2`) dan **Label** (contoh: `Perempuan`), lalu klik **Add**.
6. Klik **[OK]**.
7. Kembali ke tab **Data View**. Klik ikon **Tag** di toolbar atas untuk menghidupkan/mematikan tampilan label nilai secara instan!

---

## 4.4 Menggunakan Syntax Editor
Bagi peneliti yang terbiasa menggunakan skrip SPSS:
1. Klik tab **Syntax Editor** di bagian bawah atau melalui menu **Window** $\rightarrow$ **Syntax Editor**.
2. Anda dapat mengetikkan perintah SPSS seperti:
   ```spss
   FREQUENCIES VARIABLES=gender jobcat.
   DESCRIPTIVES VARIABLES=salary salbegin.
   ONEWAY salary BY jobcat /POSTHOC=TUKEY.
   ```
3. Klik tombol hijau **[Run All]** pada toolbar syntax.
4. Seluruh rangkaian perintah akan dieksekusi secara berurutan dan hasilnya otomatis ditambahkan ke **Output Viewer**.
5. Anda juga dapat memilih template sintaks yang sudah disediakan pada menu dropdown di pojok kanan atas editor.

---

## 4.5 Mengimpor dan Mengekspor Data

### Mengimpor Data Eksternal
1. Klik menu **File** $\rightarrow$ **Open Data (CSV, Excel, JSON)...** atau klik ikon folder di toolbar.
2. Seret (*drag and drop*) berkas Excel (`.xlsx`, `.xls`), CSV, atau JSON ke area unggah.
3. Periksa tabel preview data dan klik tombol **[Import Data]**.
4. Seluruh data dan metadata kolom akan langsung dimuat ke lembar kerja.

### Mengekspor Hasil Analisis
1. Buka tab **Output Viewer**.
2. Klik tombol **Export PDF** untuk mencetak atau menyimpan laporan statistik lengkap dalam format dokumen PDF berstandar akademik.
3. Klik tombol **Export Excel** untuk mengunduh seluruh data dalam format spreadsheet multi-sheet (.xlsx).
