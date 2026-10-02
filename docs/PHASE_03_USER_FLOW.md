# PHASE 3: User Flow & Journey Maps
**Project**: StatisticaPro Enterprise  
**Document Ref**: FLOW-STAT-2026-V2  
**Author**: Senior UI/UX Designer & Senior Product Manager  
**Status**: APPROVED  

---

## 1. Alur Perjalanan Pengguna Utama (Master Journey Map)

Pengguna platform beroperasi dalam siklus ilmiah: **Akuisisi Data** $\rightarrow$ **Manajemen Variabel** $\rightarrow$ **Eksplorasi / Uji Hipotesis** $\rightarrow$ **Interpretasi Output** $\rightarrow$ **Pelaporan**.

```mermaid
flowchart TD
    Start([Mulai Aplikasi]) --> CheckData{Dataset Tersedia?}
    CheckData -- Tidak --> ImportOption[Pilih Impor Data atau Sampel Bawaan]
    CheckData -- Ya --> DataView[Masuk ke Data View Spreadsheet]
    
    ImportOption --> UploadFile[Upload File CSV / XLSX / JSON]
    UploadFile --> PreviewDetect[Pratinjau & Deteksi Tipe Kolom]
    PreviewDetect --> ConfirmImport[Konfirmasi Impor] --> DataView
    
    DataView --> InspectVars{Perlu Atur Variabel?}
    InspectVars -- Ya --> VarView[Buka Tab Variable View]
    VarView --> EditMeta[Atur Tipe, Desimal, Label]
    EditMeta --> EditValues[Buka Dialog Value Labels]
    EditValues --> SaveMeta[Simpan Metadata] --> DataView
    
    InspectVars -- Tidak --> ChooseAction{Pilih Jalur Analisis}
    
    ChooseAction -- Menu Analyze / Dialog --> OpenDialog[Buka Dialog Analisis SPSS 2-Kotak]
    OpenDialog --> TransferVars[Pindahkan Variabel via Tombol Panah >]
    TransferVars --> ConfigOptions[Pilih Statistik / Uji Hipotesis]
    
    ConfigOptions --> ActionDecision{Tombol yang Ditekan?}
    ActionDecision -- OK --> ExecStats[Eksekusi Analisis]
    ExecStats --> OutputViewer[Buka Tab Output Viewer]
    
    ActionDecision -- Paste --> PasteSyntax[Paste Sintaks ke Syntax Editor]
    PasteSyntax --> SyntaxEditor[Buka Tab Syntax Editor]
    SyntaxEditor --> RunSyntax[Klik Run All / Selection] --> ExecStats
    
    ChooseAction -- Graph Builder --> OpenGraph[Buka Graph Builder]
    OpenGraph --> ConfigChart[Konfigurasi Sumbu X, Y, Tipe Grafik]
    ConfigChart --> RenderChart[Tampilkan Grafik di Output Viewer] --> OutputViewer
    
    OutputViewer --> ReviewOutput[Periksa Pohon Navigasi & Tabel Pivot APA]
    ReviewOutput --> ExportReport[Ekspor ke PDF / Excel / Cetak]
    ExportReport --> End([Selesai])
```

---

## 2. Alur Rinci Masing-Masing Modul

### 2.1 Alur 1: Impor Data & Pemetaan Otomatis
```mermaid
sequenceDiagram
    autonumber
    actor Pengguna
    participant UI as Dialog Impor
    participant Parser as File Parser Service
    participant Store as Dataset State Store
    participant Grid as Data View Grid

    Pengguna->>UI: Drag & Drop Berkas (misal: "data_penelitian.xlsx")
    UI->>Parser: Ekstraksi Buffer & Lembar Kerja
    Parser->>Parser: Deteksi Tipe Data (Numeric, String, Date)
    Parser->>Parser: Inferensi Skala Pengukuran (Scale, Ordinal, Nominal)
    Parser-->>UI: Kembalikan Pratinjau 10 Baris & Kolom Terpetakan
    Pengguna->>UI: Sesuaikan Pemetaan Kolom (jika diperlukan)
    Pengguna->>UI: Klik [Import Data]
    UI->>Store: Muat Dataset ke Memori Aplikasi
    Store->>Grid: Render Virtualized Grid di Data View
    Grid-->>Pengguna: Tampilkan Spreadsheet Siap Dianalisis
```

### 2.2 Alur 2: Konfigurasi Variabel & Label Nilai (Value Labels)
```mermaid
sequenceDiagram
    autonumber
    actor Pengguna
    participant Tab as Bottom Tab Bar
    participant VarView as Variable View Grid
    participant Modal as Value Labels Modal
    participant DataView as Data View Grid

    Pengguna->>Tab: Klik [Variable View]
    Tab->>VarView: Tampilkan Tabel 11 Kolom Metadata
    Pengguna->>VarView: Klik Tombol [...] pada Kolom "Values" (misal: variabel "jobcat")
    VarView->>Modal: Buka Dialog Value Labels
    Pengguna->>Modal: Masukkan Value = "1", Label = "Clerical" -> Klik [Add]
    Pengguna->>Modal: Masukkan Value = "2", Label = "Custodial" -> Klik [Add]
    Pengguna->>Modal: Masukkan Value = "3", Label = "Manager" -> Klik [Add]
    Pengguna->>Modal: Klik [OK]
    Modal->>VarView: Update Metadata Nilai Variabel
    Pengguna->>Tab: Beralih kembali ke [Data View]
    Pengguna->>DataView: Klik Ikon [Tag] di Toolbar (Toggle Value Labels)
    DataView-->>Pengguna: Sel seketika menampilkan "Clerical" alih-alih angka "1"
```

### 2.3 Alur 3: Eksekusi Analisis Statistik (Analyze Menu $\rightarrow$ Output Viewer)
```mermaid
sequenceDiagram
    autonumber
    actor Pengguna
    participant Menu as Top Menu Bar
    participant Dialog as Two-Box Analysis Dialog
    participant Engine as Statistical Engine
    participant Output as Output Viewer

    Pengguna->>Menu: Klik Analyze -> Compare Means -> One-Way ANOVA...
    Menu->>Dialog: Render Dialog dengan Kotak Sumber & Target
    Pengguna->>Dialog: Pilih "salary" di kiri -> Klik [>] ke Dependent List
    Pengguna->>Dialog: Pilih "jobcat" di kiri -> Klik [>] ke Factor
    Pengguna->>Dialog: Centang [X] Post Hoc Tukey HSD
    Pengguna->>Dialog: Klik [OK]
    Dialog->>Engine: Jalankan Komputasi ANOVA (Between/Within SS, MS, F, p) & Tukey HSD
    Engine-->>Output: Buat Simpul Baru pada Outline Tree & Render Tabel Pivot APA
    Output-->>Pengguna: Alihkan Tampilan ke Output Viewer dengan Tabel Hasil Siap Salin
```

### 2.4 Alur 4: Alur Kerja Sintaks (Syntax Workflow)
```mermaid
sequenceDiagram
    autonumber
    actor Pengguna
    participant Dialog as Analysis Dialog
    participant Syntax as Monaco Syntax Editor
    participant Engine as Statistical Engine
    participant Output as Output Viewer

    Pengguna->>Dialog: Pilih Variabel & Opsi Analisis
    Pengguna->>Dialog: Klik [Paste] (bukan OK)
    Dialog->>Syntax: Format Kode Perintah SPSS & Pindahkan Kursor
    Syntax-->>Pengguna: Tampilkan Kode di Editor dengan Syntax Highlighting
    Pengguna->>Syntax: Modifikasi Parameter atau Tambahkan Perintah Tambahan
    Pengguna->>Syntax: Klik Tombol [Run All] (Ctrl+R)
    Syntax->>Engine: Parse Lexer & Jalankan Batch Perintah
    Engine->>Output: Kirimkan Log Perintah & Tabel Hasil untuk Setiap Perintah
    Output-->>Pengguna: Tampilkan Output Lengkap Bertingkat
```
