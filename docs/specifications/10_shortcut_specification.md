# SPECIFICATION 10: SHORTCUT INVENTORY SPECIFICATION
**Global & Contextual Keyboard Accelerators, Focus Trap Rules & Desktop Keybinding Matrix**
**Standard Reference:** IBM SPSS Statistics 28/29 Professional Desktop  
**Version:** 3.0.0-PRO  

---

## 1. Filosofi Desain Keyboard-First
Aplikasi dirancang dengan paradigma **Keyboard-First Design** untuk memastikan efisiensi kerja maksimal bagi peneliti, analis data, dan akademisi (*power users*). Seluruh alur kerja esensial dapat dioperasikan sepenuhnya tanpa menyentuh mouse.

---

## 2. Inventaris Lengkap Shortcut Berdasarkan Kategori

### 1. File Operations

| Shortcut | Konteks | Aksi yang Dijalankan | Hasil yang Diharapkan |
| :--- | :--- | :--- | :--- |
| `Ctrl + N` | Global | New Dataset Document | Membuka tab dokumen data kosong baru `DataSet1.sav` |
| `Ctrl + O` | Global | Open Document | Membuka dialog file picker sistem (.sav, .csv, .xlsx, .sps) |
| `Ctrl + S` | Global | Save Active Dataset | Menyimpan dataset ke local/cloud storage; status bar menampilkan konfirmasi |
| `Ctrl + Shift + S` | Global | Save As... | Membuka dialog simpan salinan berkas dengan nama/format baru |
| `Ctrl + P` | Global | Print / Export Document | Membuka dialog cetak laporan statistik atau pratinjau PDF |
| `Alt + F4` | Global | Exit Application | Menutup sesi kerja dengan konfirmasi penyimpanan jika ada data kotor |

### 2. Editing & Clipboard Operations

| Shortcut | Konteks | Aksi yang Dijalankan | Hasil yang Diharapkan |
| :--- | :--- | :--- | :--- |
| `Ctrl + Z` | Spreadsheet / Editor | Undo | Membatalkan perubahan sel, pengeditan variabel, atau baris terakhir |
| `Ctrl + Y` | Spreadsheet / Editor | Redo | Memulihkan perubahan yang sebelumnya dibatalkan oleh Undo |
| `Ctrl + C` | Spreadsheet | Copy Cells | Menyalin sel atau rentang sel terpilih ke clipboard OS dalam format TSV |
| `Ctrl + V` | Spreadsheet | Paste Cells | Menempel teks TSV dari clipboard ke sel data; memperluas baris jika perlu |
| `Ctrl + X` | Spreadsheet | Cut Cells | Memotong nilai sel ke clipboard; nilai sel dikosongkan (*System-missing*) |
| `Delete` | Spreadsheet | Clear Content | Menghapus konten sel terpilih tanpa menggeser struktur kolom/baris |
| `Ctrl + D` | Spreadsheet | Fill Down | Menyalin nilai sel teratas ke seluruh sel yang dipilih di bawahnya |
| `Ctrl + F` | Spreadsheet | Find Dialog | Membuka modal pencarian nilai teks/angka dalam kolom atau dataset |
| `Ctrl + H` | Spreadsheet | Replace Dialog | Membuka modal pencarian dan penggantian nilai sel massal |
| `Ctrl + G` | Spreadsheet | Go to Case | Membuka dialog input nomor baris kasus untuk melompatkan kursor |
| `Ctrl + Shift + G` | Spreadsheet | Go to Variable | Membuka dialog pemilih variabel untuk melompatkan kursor ke kolom target |

### 3. Selection Operations

| Shortcut | Konteks | Aksi yang Dijalankan | Hasil yang Diharapkan |
| :--- | :--- | :--- | :--- |
| `Ctrl + A` | Spreadsheet | Select All Cells | Menyorot seluruh sel dalam dataset ($R \times C$) |
| `Shift + Arrow Up` | Spreadsheet | Extend Selection Up | Memperluas kotak seleksi satu baris ke atas |
| `Shift + Arrow Down` | Spreadsheet | Extend Selection Down | Memperluas kotak seleksi satu baris ke bawah |
| `Shift + Arrow Left` | Spreadsheet | Extend Selection Left | Memperluas kotak seleksi satu kolom ke kiri |
| `Shift + Arrow Right`| Spreadsheet | Extend Selection Right | Memperluas kotak seleksi satu kolom ke kanan |
| `Shift + Space` | Spreadsheet | Select Full Row | Menyorot seluruh kolom pada baris kasus aktif |
| `Ctrl + Space` | Spreadsheet | Select Full Column | Menyorot seluruh baris kasus pada kolom variabel aktif |

### 4. Navigation & Grid Operations

| Shortcut | Konteks | Aksi yang Dijalankan | Hasil yang Diharapkan |
| :--- | :--- | :--- | :--- |
| `Ctrl + 1` | Global | Switch to Data View | Berpindah tampilan ke tab spreadsheet Data View |
| `Ctrl + 2` | Global | Switch to Variable View | Berpindah tampilan ke tab kamus Variable View |
| `Ctrl + 3` | Global | Switch to Output Viewer | Berpindah tampilan ke lembar laporan Output Viewer |
| `Ctrl + 4` | Global | Switch to Syntax Editor | Berpindah tampilan ke Monaco Syntax Editor |
| `Ctrl + Alt + V` | Spreadsheet | Toggle Value Labels | Beralih antara menampilkan angka kode murni $\leftrightarrow$ label deskriptif |
| `F2` | Spreadsheet | Enter In-Cell Edit Mode | Mengaktifkan kursor ketik di dalam sel aktif |
| `Tab` | Spreadsheet | Next Column / Commit | Mengunci input nilai sel dan memindahkan fokus 1 kolom ke kanan |
| `Shift + Tab` | Spreadsheet | Prev Column / Commit | Mengunci input nilai sel dan memindahkan fokus 1 kolom ke kiri |
| `Enter` | Spreadsheet | Next Row / Commit | Mengunci input nilai sel dan memindahkan fokus 1 baris ke bawah |
| `Escape` | Spreadsheet | Cancel In-Cell Edit | Membatalkan perubahan ketik dan mengembalikan nilai sel semula |
| `Home` | Spreadsheet | Go to First Column | Memindahkan kursor ke kolom pertama pada baris aktif |
| `End` | Spreadsheet | Go to Last Column | Memindahkan kursor ke kolom terakhir pada baris aktif |
| `Page Up` | Spreadsheet | Page Scroll Up | Menggulir tampilan 20 baris ke atas |
| `Page Down` | Spreadsheet | Page Scroll Down | Menggulir tampilan 20 baris ke bawah |
| `Ctrl + Home` | Spreadsheet | Top-Left Origin | Melompat langsung ke sel pojok kiri atas `(0, 0)` |
| `Ctrl + End` | Spreadsheet | Bottom-Right Bound | Melompat langsung ke sel pojok kanan bawah `(R-1, C-1)` |

### 5. Dialog & Analysis Operations

| Shortcut | Konteks | Aksi yang Dijalankan | Hasil yang Diharapkan |
| :--- | :--- | :--- | :--- |
| `Enter` | Dialog Aktif | Trigger Default Button (OK) | Menjalankan analisis statistik dengan konfigurasi yang aktif |
| `Escape` | Dialog Aktif | Trigger Cancel Button | Menutup dialog modal tanpa mengeksekusi atau menyimpan perubahan |
| `Alt + P` | Dialog Aktif | Trigger Paste Button | Menerjemahkan konfigurasi dialog ke kode sintaks SPSS di editor |
| `Alt + R` | Dialog Aktif | Trigger Reset Button | Mengosongkan seluruh listbox target dan me-reset opsi ke default |
| `F1` | Dialog Aktif | Trigger Help Button | Membuka dokumentasi algoritma matematika prosedur terkait |

### 6. Output Viewer Operations

| Shortcut | Konteks | Aksi yang Dijalankan | Hasil yang Diharapkan |
| :--- | :--- | :--- | :--- |
| `Arrow Up / Down` | Outline Tree | Navigate Nodes | Memindahkan fokus ke simpul output atas/bawah; auto-scroll kanvas |
| `Arrow Right` | Outline Tree | Expand Node | Membuka sub-simpul pohon yang tertutup |
| `Arrow Left` | Outline Tree | Collapse Node | Menutup sub-simpul pohon yang terbuka |
| `Delete` | Outline Tree | Delete Selected Output | Menghapus tabel atau grafik terpilih dari dokumen laporan |
| `F2` | Outline Tree | Rename Node | Membuka mode ubah nama judul pada simpul pohon |

### 7. Syntax Editor Operations

| Shortcut | Konteks | Aksi yang Dijalankan | Hasil yang Diharapkan |
| :--- | :--- | :--- | :--- |
| `Ctrl + R` | Syntax Editor | Run All | Mengeksekusi seluruh skrip sintaks dari awal hingga akhir |
| `Ctrl + E` | Syntax Editor | Run Selection | Mengeksekusi blok kode yang sedang disorot saja |
| `Ctrl + Space` | Syntax Editor | Trigger Autocomplete | Memunculkan daftar saran IntelliSense untuk kata kunci perintah |
| `Ctrl + /` | Syntax Editor | Toggle Comment | Mengubah baris menjadi komentar `* ... .` atau menghapus komentar |
