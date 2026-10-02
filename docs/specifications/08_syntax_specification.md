# SPECIFICATION 08: SYNTAX EDITOR SPECIFICATION
**Domain-Specific Command Language Grammar, AST Parser, Execution Pipeline & Monaco IDE Integration**
**Standard Reference:** IBM SPSS Statistics 28/29 Professional Desktop  
**Version:** 3.0.0-PRO  

---

## 1. Tata Bahasa & Leksikal Bahasa Perintah SPSS (Grammar Rules)

SPSS Command Language adalah bahasa prosedural domain-specific berorientasi skrip.

### Aturan Formal Sintaks:
1. **Command Terminator**: Setiap perintah mandiri **harus diakhiri dengan tanda titik (`.`)**. Titik tersebut menjadi pembatas antar pernyataan.
2. **Subcommand Syntax**: Sub-perintah didefinisikan dengan diawali garis miring `/` diikuti kata kunci sub-perintah dan tanda sama dengan `=`, contoh: `/STATISTICS=MEAN STDDEV.`
3. **Case-Insensitivity**: Seluruh kata kunci perintah (`FREQUENCIES`, `frequencies`, `Frequencies`) dan nama variabel bersifat tidak sensitif terhadap huruf besar/kecil.
4. **Comments**: Baris komentar dapat ditulis dengan mengawali pernyataan menggunakan karakter tanda bintang `*` atau kata kunci `COMMENT`, dan wajib diakhiri dengan tanda titik `.`.
   ```spss
   * Ini adalah baris komentar valid dalam skrip SPSS.
   COMMENT Menghitung statistik deskriptif untuk gaji karyawan.
   ```
5. **Posisi Baris**: Perintah utama harus dimulai di kolom pertama (tanpa spasi di awal baris), sedangkan baris lanjutan sub-perintah boleh diberi indentasi spasi atau tab.

---

## 2. Spesifikasi Grammar Perintah yang Didukung

### 1. `FREQUENCIES`
```spss
FREQUENCIES VARIABLES = varlist
  [ /FORMAT = { TABLE | NOTABLE } { AVALUE | DVALUE | AFREQ | DFREQ } ]
  [ /STATISTICS = [ MEAN ] [ STDDEV ] [ MINIMUM ] [ MAXIMUM ] [ MEDIAN ] [ MODE ] [ SKEWNESS ] [ KURTOSIS ] [ ALL ] ]
  [ /BARCHART | /PIECHART | /HISTOGRAM [ NORMAL ] ]
  .
```

### 2. `DESCRIPTIVES`
```spss
DESCRIPTIVES VARIABLES = varlist
  [ /STATISTICS = [ MEAN ] [ STDDEV ] [ VARIANCE ] [ RANGE ] [ MIN ] [ MAX ] [ SEMEAN ] [ ALL ] ]
  [ /SAVE ]
  .
```

### 3. `CROSSTABS`
```spss
CROSSTABS
  /TABLES = varlist BY varlist [ BY varlist ]
  [ /STATISTICS = [ CHISQ ] [ PHI ] [ CC ] [ BKM ] [ CORR ] ]
  [ /CELLS = [ COUNT ] [ EXPECTED ] [ ROW ] [ COLUMN ] [ TOTAL ] ]
  .
```

### 4. `CORRELATIONS`
```spss
CORRELATIONS
  /VARIABLES = varlist
  [ /PRINT = { TWOTAIL | ONETAIL } { SIG | NOSIG } ]
  [ /STATISTICS = [ DESCRIPTIVES ] [ XPROD ] ]
  .
```

### 5. `REGRESSION`
```spss
REGRESSION
  /DEPENDENT = varname
  /METHOD = { ENTER | STEPWISE | FORWARD | BACKWARD } varlist
  [ /STATISTICS = [ COEFF ] [ R ] [ ANOVA ] [ COLLIN ] [ CI(95) ] ]
  [ /RESIDUALS = [ DURBIN ] [ HISTOGRAM ] [ NORMPROB ] ]
  .
```

### 6. `T-TEST`
```spss
* One-Sample T-Test:
T-TEST /TESTVAL = value /VARIABLES = varlist.

* Independent-Samples T-Test:
T-TEST GROUPS = varname (val1 val2) /VARIABLES = varlist.

* Paired-Samples T-Test:
T-TEST PAIRS = var1 WITH var2 (PAIRED).
```

### 7. `ONEWAY` (ANOVA)
```spss
ONEWAY varlist BY factor_var
  [ /STATISTICS = [ DESCRIPTIVES ] [ HOMOGENEITY ] ]
  [ /POSTHOC = [ TUKEY ] [ BONFERRONI ] [ SCHEFFE ] [ LSD ] [ ALPHA(0.05) ] ]
  .
```

### 8. `RELIABILITY`
```spss
RELIABILITY
  /VARIABLES = varlist
  [ /SCALE('Scale Name') ALL ]
  [ /MODEL = { ALPHA | SPLIT | GUTTMAN } ]
  [ /STATISTICS = [ DESCRIPTIVE ] [ SCALE ] [ CORR ] ]
  [ /SUMMARY = [ TOTAL ] ]
  .
```

### 9. Perintah Manajemen Data:
* `SORT CASES BY var1 (A) var2 (D).`
* `COMPUTE target_var = expression.`
* `FILTER BY filter_var.`
* `WEIGHT BY weight_var.`
* `EXECUTE.`

---

## 3. Arsitektur Parser & Pipeline Eksekusi Sintaks

```
   [ Editor Input Text ]
             │
             ▼
   [ Lexer / Tokenizer ] ───> Memecah teks menjadi token (COMMAND, SUBCOMMAND, IDENT, NUM, DOT)
             │
             ▼
   [ AST Syntax Parser ] ───> Membangun Abstract Syntax Tree & Memvalidasi Semantic Data
             │
             ▼
   [ Execution Router  ]
             ├─────────────────────────────────────────┐
             │ (Data Transformation / Quick Analysis)  │ (Matrix / Heavy Statistics)
             ▼                                         ▼
   [ Client-Side Engine (TS) ]               [ Server-Side Engine (Python) ]
             │                                         │
             └────────────────────┬────────────────────┘
                                  │
                                  ▼
                   [ Output Viewer & Execution Log ]
```

### Alur Eksekusi:
1. **Run All (`Ctrl + R`)**: Mengambil seluruh isi dokumen editor, memecah berdasarkan titik pemisah `.`, dan mengeksekusi blok-blok perintah secara sekuensial berurutan.
2. **Run Selection (`Ctrl + E`)**: Hanya mengeksekusi blok teks yang disorot oleh kursor pengguna. Jika tidak ada seleksi, mengeksekusi perintah pada posisi kursor saat itu.
3. **Error Handling**: Jika parser menemukan inkonsistensi sintaks (misal: variabel tidak ditemukan, sub-perintah tidak valid, tidak ada titik penutup):
   - Editor menempatkan garis bergelombang merah (*red squiggly underlines*) di bawah token error.
   - Panel eksekusi memancarkan pesan kesalahan standar SPSS ke Log Output Viewer:
     `>Error # 100 on line 4 in column 12: Text: var_unknown. An undefined variable name, or a reserved word, was specified.`
   - Eksekusi skrip dihentikan pada baris kesalahan untuk mencegah kerusakan integritas data.

---

## 4. Integrasi Monaco Code Editor (Monarch Tokenizer)
* **Custom Monarch Language Definition**:
  - Warna biru tua tebal: Kata kunci perintah primer (`FREQUENCIES`, `REGRESSION`, dll.).
  - Warna ungu: Sub-perintah (`/VARIABLES`, `/METHOD`, `/STATISTICS`).
  - Warna hijau rumput miring: Komentar (`* ... .`).
  - Warna merah marun: String teks (`'Laki-laki'`).
  - Warna biru muda: Nama variabel dataset aktif.
* **IntelliSense Autocomplete**:
  - Mengetik huruf awal perintah memunculkan pop-up snippet cerdas dengan parameter bawaan.
  - Mengetik setelah `/VARIABLES=` otomatis memunculkan daftar nama variabel yang tersedia di dataset aktif.
* **Histori Sintaks & Log**: Riwayat setiap perintah yang berhasil dijalankan dicatat secara persisten ke dalam log sesi dengan stempel waktu (*timestamp*).
