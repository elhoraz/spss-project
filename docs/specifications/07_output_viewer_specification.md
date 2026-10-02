# SPECIFICATION 07: OUTPUT VIEWER SPECIFICATION
**Hierarchical Tree Navigation, APA Double-Border Pivot Tables & Vector Chart Canvas**
**Standard Reference:** IBM SPSS Statistics 28/29 Professional Desktop  
**Version:** 3.0.0-PRO  

---

## 1. Topologi Jendela Output Viewer (Split-Window Architecture)

Output Viewer menggunakan arsitektur split-pane dua kolom standar SPSS Desktop:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Title Bar] IBM SPSS Statistics - [Output1.spv - Output Viewer]                            [-] [o] [x] │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Menu Bar] File   Edit   View   Data   Transform   Analyze   Graphs   Utilities   Window   Help         │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Toolbar] [Print] [Export PDF] [Export Excel] | [Expand All] [Collapse All] | [Delete Item]            │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Left Pane: Outline Navigation Tree]   │ [Right Pane: Output Document Canvas]                         │
│ ┌────────────────────────────────────┐ │ ┌───────────────────────────────────────────────────────────┐ │
│ │ 🗂️ Output Document                │ │ │ Log                                                       │ │
│ │ ├─ 📝 Log                          │ │ │   DESCRIPTIVES VARIABLES=salary educ                      │ │
│ │ └─ 📁 Descriptives                 │ │ │     /STATISTICS=MEAN STDDEV MIN MAX.                      │ │
│ │    ├─ 📄 Title                     │ │ │                                                           │ │
│ │    ├─ 📄 Notes                     │ │ │ Descriptives                                              │ │
│ │    └─ 📊 Descriptive Statistics    │ │ │ ═════════════════════════════════════════════════════════ │ │
│ │ └─ 📁 Frequencies                  │ │ │                   Descriptive Statistics                  │ │
│ │    ├─ 📄 Title                     │ │ │ ───────────────────────────────────────────────────────── │ │
│ │    ├─ 📊 Statistics                │ │ │                     N     Minimum  Maximum   Mean   Std.Dev│ │
│ │    └─ 📁 gender                    │ │ │ ───────────────────────────────────────────────────────── │ │
│ │       ├─ 📊 Frequency Table        │ │ │ Current Salary     40    $21,450  $57,000 $34,418 $10,120 │ │
│ │       └─ 📈 Bar Chart              │ │ │ Educ Level (Yrs)   40       12       21     15.8     2.4 │ │
│ │                                    │ │ │ Valid N (listwise) 40                                     │ │
│ │                                    │ │ │ ───────────────────────────────────────────────────────── │ │
│ └────────────────────────────────────┘ │ └───────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Spesifikasi Outline Navigation Tree (Panel Kiri)

### 1. Struktur Pohon Data (Tree Hierarchy Data Model):
```typescript
interface OutputTreeNode {
  id: string;               // UUID unik elemen
  parentId: string | null;  // ID simpul induk
  title: string;            // Label teks pada pohon (misal: "Descriptive Statistics")
  type: 'root' | 'procedure' | 'table' | 'chart' | 'log' | 'text';
  isExpanded: boolean;      // Status visibilitas anak pohon
  isSelected: boolean;      // Status fokus seleksi aktif
  children?: OutputTreeNode[];
  dataPayload?: any;        // Rujukan ke data tabel pivot atau grafik
}
```

### 2. Inventaris Perilaku Navigasi & Manipulasi Node:
* **Single Click**: Memilih simpul node; kanvas dokumen kanan secara otomatis melakukan *smooth scrolling* ke posisi elemen terkait di layar.
* **Expand / Collapse (`+` / `-` / Arrow Right / Arrow Left)**: Menampilkan atau menyembunyikan simpul turunan dari sebuah blok prosedur.
* **Rename Node**: Klik ganda (*double-click*) pada teks label di pohon atau tombol `F2` membuka inline text input untuk mengganti nama judul tabel/prosedur.
* **Delete Node (`Delete` Key)**: Menghapus simpul yang dipilih beserta seluruh tabel/grafik turunannya dari dokumen dan memori persisten.
* **Move / Reorder (Drag-and-Drop)**: Pengguna dapat menyeret node dan meletakkannya di atas atau di bawah node lain untuk menyusun ulang urutan bab laporan.
* **Duplicate Node**: Menekan `Ctrl+D` atau menu klik kanan *Duplicate* menduplikasi tabel hasil analisis.
* **Export Individual Item**: Klik kanan pada simpul pohon menyediakan opsi *Export this table to Excel / Word / PNG*.

---

## 3. Spesifikasi Rendering Tabel Pivot (APA Classic Double-Border)

Tabel output statistik harus mematuhi **Format Standar Publikasi APA & SPSS Desktop**:

```
═══════════════════════════════════════════════════════════════════════════════  <-- Double Top Border (2px)
                                  Table Title
───────────────────────────────────────────────────────────────────────────────  <-- Single Header Separator (1px)
 Column Category Header 1      Column Category Header 2        Statistics Value
───────────────────────────────────────────────────────────────────────────────  <-- Single Column Underline (1px)
 Row Item 1                               40                         12.54
 Row Item 2                               40                          8.91
───────────────────────────────────────────────────────────────────────────────  <-- Single Bottom Border (1px)
 *. Correlation is significant at the 0.01 level (2-tailed).                     <-- Footnote Notes
```

### Aturan CSS Rendering:
1. **Double Top Border**: `border-top: 3px double #000000;` di atas header kolom.
2. **Single Header Border**: `border-bottom: 1px solid #000000;` di bawah label nama kolom.
3. **Single Bottom Border**: `border-bottom: 1px solid #000000;` di bawah baris data terbawah.
4. **Zero Vertical Borders**: Dilarang menggunakan garis batas vertikal di antara kolom data (`border-left: none; border-right: none;`).
5. **Perataan Teks & Angka**:
   - Kolom label/nama variabel: rata kiri (*left-aligned*).
   - Kolom angka kuantitatif, frekuensi, persentase: rata kanan (*right-aligned*).
6. **Pemformatan Angka Dinamis**:
   - Nilai $p$-value signifikansi $< 0.001$ diformat sebagai `< .001` (tanpa angka 0 di depan titik sesuai standar APA).
   - Nilai koefisien korelasi dan $R^2$ yang nilainya tidak dapat melebihi 1 ditulis tanpa nol di depan (misal: `.842`, `-.315`).
   - Angka desimal diseragamkan dengan presisi 3 tempat desimal secara default.

---

## 4. Format Output Lainnya

### 1. Log Output
* Menampilkan teks sintaks perintah yang mendasari pembuatan analisis tersebut.
* Font: Monospaced Courier New / Consolas `11px`.
* Latar belakang: Kotak abu-abu terang `#F8FAFC` dengan border tipis `#E2E8F0`.

### 2. Chart Output
* Rendering interaktif berbasis HTML5 Canvas / SVG vektor.
* Dilengkapi toolbar mini saat kursor melayang di atas grafik:
  - Tombol unduh PNG resolusi tinggi (300 DPI)
  - Tombol unduh SVG (vektor)
  - Tombol salin gambar ke clipboard

### 3. Persistensi & Serialisasi Data Output
* Dokumen output secara lengkap dapat diserialisasi ke format JSON dan disimpan ke storage lokal atau server database.
* Memungkinkan pengguna memuat kembali sesi output di masa mendatang (`File > Open > Output...`).
