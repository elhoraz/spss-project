# SPECIFICATION 05: VARIABLE VIEW SPECIFICATION
**Data Dictionary Metadata Architecture, Attribute Constraint Rules & Cross-Engine Propagations**
**Standard Reference:** IBM SPSS Statistics 28/29 Professional Desktop  
**Version:** 3.0.0-PRO  

---

## 1. Skema Tabel Kamus Variabel (Variable View Layout)

```
┌───────┬──────────┬───────┬──────────┬──────────────────────────┬──────────┬─────────┬─────────┬────────┬─────────┬────────┐
│ Name  │ Type     │ Width │ Decimals │ Label                    │ Values   │ Missing │ Columns │ Align  │ Measure │ Role   │
├───────┼──────────┼───────┼──────────┼──────────────────────────┼──────────┼─────────┼─────────┼────────┼─────────┼────────┤
│ id    │ Numeric  │ 4     │ 0        │ Employee Identification  │ None     │ None    │ 6       │ Right  │ Nominal │ Input  │
│ gender│ String   │ 1     │ 0        │ Gender of Employee       │ {m, Male}│ None    │ 8       │ Left   │ Nominal │ Input  │
│ salary│ Dollar   │ 8     │ 2        │ Current Annual Salary    │ None     │ None    │ 10      │ Right  │ Scale   │ Target │
│ educ  │ Numeric  │ 2     │ 0        │ Educational Level (Years)│ {12, HS} │ 99      │ 8       │ Right  │ Ordinal │ Input  │
└───────┴──────────┴───────┴──────────┴──────────────────────────┴──────────┴─────────┴─────────┴────────┴─────────┴────────┘
```

---

## 2. Spesifikasi Detail 11 Atribut Variabel

### 1. Name (Pengidentifikasi Variabel Unik)
* **Aturan Validasi Teknis**:
  - Panjang maksimal: 64 karakter.
  - Harus diawali dengan karakter huruf alfabet (`A-Z`, `a-z`) atau simbol `@`. Karakter berikutnya boleh berupa huruf, angka, tanda titik `.`, atau garis bawah `_`.
  - Dilarang mengandung spasi, tanda hubung `-`, simbol matematika (`+`, `*`, `/`), atau tanda baca selain titik/garis bawah.
  - Case-insensitive (misal: `Salary` dianggap sama dengan `salary`), namun sistem mempertahankan tampilan case yang diketik pengguna.
  - Dilarang sama dengan SPSS Reserved Keywords: `ALL`, `AND`, `BY`, `EQ`, `GE`, `GT`, `LE`, `LT`, `NE`, `NOT`, `OR`, `TO`, `WITH`.
  - Harus unik dalam satu dataset; tidak boleh ada dua variabel bernama sama.
* **Perubahan yang Terjadi**: Memperbarui kunci identitas kolom di memori dataset.
* **Dampak ke Data View**: Label teks pada header kolom Data View langsung diperbarui seketika.
* **Dampak ke Analisis**: Variabel direferensikan dalam kode sintaks dan tabel output menggunakan nama baru ini.

### 2. Type (Tipe Representasi Data)
* **Aturan Validasi Teknis**:
  - Pilihan terbatas pada enum:
    1. `Numeric` (Bilangan bulat / desimal floating point)
    2. `Comma` (Pemisah ribuan koma, desimal titik: `1,234.56`)
    3. `Dot` (Pemisah ribuan titik, desimal koma: `1.234,56`)
    4. `Scientific` (Notasi ilmiah eksponensial: `1.23E+04`)
    5. `Date` (Format penanggalan: `dd-mmm-yyyy`, `mm/dd/yyyy`, dll.)
    6. `Dollar` (Mata uang dolar: `$12,345.00`)
    7. `Custom Currency` (Mata uang kustom: `Rp 12.345`)
    8. `String` (Teks karakter alfanumerik bebas)
  - Mengubah tipe dari String ke Numeric akan menguji seluruh sel: nilai non-angka diubah menjadi `null` / System-missing.
* **Perubahan yang Terjadi**: Mengubah parser format tampilan dan parser input sel.
* **Dampak ke Data View**: Seluruh sel di kolom tersebut diformat ulang secara visual (misal: memunculkan simbol mata uang atau tanda koma).
* **Dampak ke Analisis**: Variabel bertipe `String` otomatis dilarang masuk ke analisis numerik kontinu (seperti T-Test, ANOVA, Linear Regression, Correlation).

### 3. Width (Lebar Maksimum Karakter/Digit)
* **Aturan Validasi Teknis**:
  - Nilai integer positif antara `1` hingga `256`.
  - Untuk tipe String, `Width` menentukan panjang karakter maksimum yang dapat ditampung.
  - Untuk tipe Numeric, harus memenuhi `Width >= Decimals + 1`.
* **Perubahan yang Terjadi**: Memperbarui batas kapasitas buffer sel.
* **Dampak ke Data View**: Membatasi jumlah karakter yang dapat diketik pengguna saat mode in-cell editing.
* **Dampak ke Analisis**: Menentukan alokasi memori buffer saat membaca/menulis berkas binary SPSS `.sav`.

### 4. Decimals (Presisi Angka di Belakang Koma)
* **Aturan Validasi Teknis**:
  - Nilai integer positif antara `0` hingga `16`.
  - Hanya dapat diedit jika `Type` adalah numerik (`Numeric`, `Comma`, `Dot`, `Scientific`, `Dollar`). Untuk tipe `String` atau `Date`, nilai terkunci pada `0` dan berstatus disabled.
  - Harus selalu memenuhi batasan: `Decimals <= Width - 2`.
* **Perubahan yang Terjadi**: Mengubah formatter pembulatan desimal tampilan.
* **Dampak ke Data View**: Nilai angka dalam sel dibulatkan secara visual sesuai presisi (misal: `Decimals = 2` menampilkan `45.60`, `Decimals = 0` menampilkan `46`). Nilai presisi asli floating-point di memori tetap dipertahankan.
* **Dampak ke Analisis**: Tabel pivot output menyajikan nilai rata-rata dan deviasi standar dengan presisi desimal turunan dari variabel ini.

### 5. Label (Keterangan Deskriptif Variabel)
* **Aturan Validasi Teknis**:
  - Teks bebas hingga 256 karakter (boleh mengandung spasi, tanda baca, simbol unicode).
  - Contoh: `"Current Annual Salary in USD (Pre-Tax)"`.
* **Perubahan yang Terjadi**: Memperbarui metadata kamus variabel.
* **Dampak ke Data View**: Ditampilkan sebagai tooltip informatif saat kursor melayang di atas header kolom Data View dan di info bar sel aktif.
* **Dampak ke Analisis**: Output Viewer memprioritaskan menampilkan `Label` variabel pada judul tabel dan header baris analisis daripada hanya nama variabel pendek.

### 6. Values (Value Labels / Pemetaan Nilai Kategori)
* **Aturan Validasi Teknis**:
  - Membuka modal **Value Labels Dialog**.
  - Menyimpan pasangan asosiasi dictionary `{ Value: Label }`.
  - Contoh: `{ 1: "Laki-laki", 2: "Perempuan" }` atau `{ 0: "Tidak Puas", 1: "Netral", 2: "Puas" }`.
  - Nilai Value harus unik.
* **Perubahan yang Terjadi**: Memperbarui kamus kode kategori.
* **Dampak ke Data View**: Saat toggle *Value Labels* aktif (`Ctrl+Alt+V`), sel yang berisi kode angka `1` langsung menampilkan teks `"Laki-laki"`.
* **Dampak ke Analisis**: Tabel Frekuensi, Crosstabs, dan grafik batang menggunakan teks label ini untuk penamaan kategori baris dan kolom.

### 7. Missing (User-Defined Missing Values)
* **Aturan Validasi Teknis**:
  - Membuka modal **Missing Values Dialog**.
  - Opsi:
    1. *No missing values*
    2. *Discrete missing values* (hingga 3 nilai numerik diskrit, misal: `99`, `999`, `-1`)
    3. *Range plus one optional discrete missing value* (misal rentang: `90` s/d `99`, plus `999`).
* **Perubahan yang Terjadi**: Mendaftarkan kode angka khusus sebagai missing data.
* **Dampak ke Data View**: Nilai sel yang cocok dengan aturan missing diberi tanda visual tipis (warna abu-abu redup atau font miring).
* **Dampak ke Analisis**: Dikecualikan secara otomatis dari perhitungan rata-rata, korelasi, regresi, dan uji hipotesis (*Listwise / Pairwise exclusion*).

### 8. Columns (Lebar Visual Kolom Grid)
* **Aturan Validasi Teknis**:
  - Nilai integer positif antara `1` hingga `255`.
  - Merepresentasikan lebar visual kolom pada layar (1 unit kolom $\approx$ 11 piksel visual).
* **Perubahan yang Terjadi**: Mengubah lebar kolom Data View.
* **Dampak ke Data View**: Lebar fisik kolom spreadsheet berubah seketika. Dapat juga disesuaikan dengan menggeser batas pemisah header kolom (*header resize handle*).
* **Dampak ke Analisis**: Tidak mempengaruhi perhitungan analisis.

### 9. Align (Perataan Teks dalam Sel)
* **Aturan Validasi Teknis**:
  - Pilihan terbatas pada enum: `Left`, `Right`, `Center`.
  - Default: `Right` untuk numerik, `Left` untuk string.
* **Perubahan yang Terjadi**: Memperbarui atribut CSS `text-align`.
* **Dampak ke Data View**: Posisi teks atau angka di dalam sel Data View diratakan ke kiri, kanan, atau tengah.
* **Dampak ke Analisis**: Menjadi referensi default perataan teks pada tabel pivot di Output Viewer.

### 10. Measure (Skala Pengukuran Statistik)
* **Aturan Validasi Teknis**:
  - Pilihan terbatas pada enum:
    1. `Scale` (Data metrik interval / rasio kontinu)
    2. `Ordinal` (Data kategori bertingkat dengan urutan ranking alami)
    3. `Nominal` (Data kategori murni tanpa urutan matematis)
* **Perubahan yang Terjadi**: Mengubah status klasifikasi statistik variabel.
* **Dampak ke Data View**: Header kolom Data View menampilkan ikon visual penanda skala:
  - 📏 Penggaris untuk `Scale`
  - 📶 Tangga bar untuk `Ordinal`
  - 🔘 Tiga lingkaran diagram warna untuk `Nominal`
* **Dampak ke Analisis**: Mengontrol validasi penerimaan variabel pada dialog analisis statistik:
  - Kotak *Dependent Variable* pada ANOVA hanya menerima `Scale`.
  - Kotak *Factor Variable* pada ANOVA hanya menerima `Nominal` atau `Ordinal`.
  - Dialog *Crosstabs* memprioritaskan variabel `Nominal` dan `Ordinal`.

### 11. Role (Peran Variabel dalam Pemodelan)
* **Aturan Validasi Teknis**:
  - Pilihan terbatas pada enum:
    1. `Input` (Variabel prediktor / independen)
    2. `Target` (Variabel luaran / dependen)
    3. `Both` (Dapat berfungsi sebagai input maupun target)
    4. `None` (Tidak memiliki peran aktif)
    5. `Partition` (Digunakan untuk membagi dataset menjadi training dan testing)
    6. `Split` (Digunakan untuk pemisahan file analisis)
  - Default: `Input`.
* **Perubahan yang Terjadi**: Menyimpan flag metadata operasional variabel.
* **Dampak ke Data View**: Tidak mengubah tampilan grid data secara visual.
* **Dampak ke Analisis**: Saat membuka dialog analisis (misal: Linear Regression), sistem secara cerdas otomatis menempatkan variabel ber-role `Target` ke listbox Dependent dan variabel ber-role `Input` ke listbox Independent.
