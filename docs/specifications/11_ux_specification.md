# SPECIFICATION 11: UX & DESKTOP ERGONOMICS SPECIFICATION
**Information Density Engineering, Desktop Visual Semantics, Multi-Window Topology & Power User Ergonomics**
**Standard Reference:** IBM SPSS Statistics 28/29 Professional Desktop  
**Version:** 3.0.0-PRO  

---

## 1. Prinsip Desain Fundamental (Desktop vs SaaS Paradigm)

Aplikasi ini dibangun di atas filosofi bahwa **peneliti akademik dan analis data enterprise membutuhkan workstation berkinerja tinggi, bukan dashboard SaaS konsumen**.

```
┌──────────────────────────────────────┬──────────────────────────────────────┐
│  KARAKTERISTIK SAAS WEB BIASA        │  STANDAR STATISTIK DESKTOP           │
│  (DILARANG KERAS)                    │  (MANDAT RESMI PROYEK)               │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ ❌ Kartu widget bulat besar          │ ✔️ Grid spreadsheet padat            │
│ ❌ Padding raksasa membuang layar    │ ✔️ Densitas data maksimal per piksel  │
│ ❌ Warna-warni mencolok (neon/ungu)  │ ✔️ Abu-abu desktop akademis netral   │
│ ❌ Grafik donat mainan               │ ✔️ Tabel pivot APA bergaris ganda    │
│ ❌ Single-page scroll tanpa batas    │ ✔️ Dual-pane split outline navigator │
│ ❌ Ketergantungan penuh pada mouse   │ ✔️ Keyboard-first & shortcut lengkap │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

---

## 2. 10 Pilar Spesifikasi Pengalaman Pengguna (UX Pillars)

### 1. Dense Information Layout (Densitas Informasi Tinggi)
* Ketinggian baris spreadsheet diatur tepat **`24px`** dengan font monospaced numerik **`11px`** atau **`12px`**.
* Tidak ada spasi vertikal (*padding*) yang terbuang sia-sia; pada layar Full HD (1920x1080), pengguna harus dapat melihat minimal 35 baris dan 15 kolom secara bersamaan tanpa perlu menggulir.

### 2. Professional Grey Workspace Theme
* **Canvas Canvas Background**: `#ECE9D8` (Classic Windows Slate) atau `#F1F5F9`.
* **Border Garis Sel**: `#D1D5DB` (abu-abu tipis 1px presisi).
* **Header Baris & Kolom**: Gradien halus `#E2E8F0` ke `#CBD5E1` dengan teks tebal centered `#334155`.
* **Warna Aksen Seleksi**: Biru desktop klasik `#1D4ED8` dengan transparansi fill `rgba(59, 130, 246, 0.12)`.
* Palet ini meminimalkan kelelahan mata (*eye strain*) peneliti yang bekerja menganalisis angka selama 8-10 jam berturut-turut.

### 3. Multiple Windows & Dual Viewport Topology
* Mengadopsi paradigma dokumen desktop di mana pengguna dapat membuka:
  - Jendela Data Editor (Data View & Variable View)
  - Jendela Output Viewer (Laporan analisis independen)
  - Jendela Syntax Editor (Skrip otomatisasi)
* Mendukung mode tampilan **Split-Screen 50:50** (Data di sisi kiri, Output di sisi kanan) maupun mode tab penuh.

### 4. Modal Dialogs Berpola Dua Kotak (Two-Box Dialogs)
* Dialog analisis tidak berupa form vertikal panjang bergaya web form, melainkan dialog modal berdimensi tetap (*fixed dimension*) dengan dua kotak listbox berdampingan:
  - Listbox kiri: variabel yang tersedia.
  - Tombol panah transfer di tengah.
  - Listbox kanan: variabel yang dipilih.
* Tombol aksi tersusun rapi di kolom kanan vertikal: `[ OK ]`, `[ Paste ]`, `[ Reset ]`, `[ Cancel ]`, `[ Help ]`, diikuti sub-dialog `[ Statistics... ]`, `[ Options... ]`.

### 5. Native-Feeling Context Menus (Klik Kanan Desktop)
* Menggantikan menu klik kanan browser standar dengan context menu desktop kustom:
  - Klik kanan sel: Cut, Copy, Paste, Insert Variable, Insert Cases, Clear.
  - Klik kanan header kolom: Sort Ascending, Sort Descending, Variable Properties, Descriptive Statistics.
  - Klik kanan pohon output: Rename, Delete, Duplicate, Export to Excel/PDF.

### 6. Tabbed Workspace yang Konsisten
* Tab Data View dan Variable View terpasang kokoh di kaki spreadsheet bergaya folder tab Excel/SPSS klasik.
* Pergantian antar tab berlangsung dalam **$0 \text{ ms}$** tanpa ada reload layar atau kehilangan posisi kursor aktif.

### 7. Feedback Mikro-Interaksi yang Akurat
* Saat operasi analisis sedang dihitung, status bar bawah menampilkan:
  - Animasi teks: `"Running DESCRIPTIVES..."`
  - Ikon processor berputar halus di pojok kanan status bar.
* Setelah selesai, status bar kembali ke:
  `"IBM SPSS Statistics Processor is ready"` dan badge tab Output Viewer berkedip halus atau menampilkan penambahan jumlah tabel baru `(Output +1)`.

### 8. Penanganan State yang Tahan Banting (State Persistence)
* Setiap perubahan data, filter aktif, bobot variabel, dan hasil output secara otomatis dicadangkan ke IndexedDB / LocalStorage secara asinkron.
* Jika browser tertutup tidak sengaja atau terjadi pemadaman listrik, seluruh state data dan output dipulihkan 100% pada sesi berikutnya.

### 9. Indikator Visual Filtering & Weighting
* **Filter Aktif**: Baris kasus yang tidak lolos kriteria seleksi (`filter_$ == 0`) langsung dicoret pada nomor barisnya (`~~12~~`), memberikan kejelasan visual seketika kasus mana saja yang sedang diabaikan.
* **Status Flags**: Status bar secara persisten mengabarkan status `Filter: ON/OFF` dan `Weight: ON/OFF`.

### 10. Aksesibilitas & Tipografi Akademis
* Menggunakan font sistem standar berkejelasan tinggi (*Segoe UI*, *Roboto*, *Inter*, dan *Consolas* untuk numerik).
* Tabel pivot output secara baku mematuhi pedoman visual *American Psychological Association (APA)* edisi ke-7, siap dipublikasikan ke jurnal terakreditasi internasional.
