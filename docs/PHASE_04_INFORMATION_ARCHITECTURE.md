# PHASE 4: Information Architecture (IA)
**Project**: StatisticaPro Enterprise  
**Document Ref**: IA-STAT-2026-V2  
**Author**: Principal Software Architect & Senior UI/UX Designer  
**Status**: APPROVED  

---

## 1. Peta Navigasi Global (Global Navigation Hierarchy)

Struktur menu desktop mereplikasi tata susunan 11 menu utama SPSS:

```
[StatisticaPro Enterprise]
├── 1. FILE
│   ├── New (Data, Syntax, Output)
│   ├── Open Data (CSV, XLSX, TSV, JSON)... [Ctrl+O]
│   ├── Open Sample Dataset (Employee Data, Clinical Trial)
│   ├── Save Project / Export As (.xlsx)... [Ctrl+S]
│   ├── Export Output Report (PDF, Word, CSV)... [Ctrl+P]
│   ├── Print...
│   └── Exit Sesi
│
├── 2. EDIT
│   ├── Undo [Ctrl+Z]
│   ├── Redo [Ctrl+Y]
│   ├── Cut [Ctrl+X]
│   ├── Copy [Ctrl+C]
│   ├── Paste [Ctrl+V]
│   ├── Insert Variable
│   ├── Insert Case (Row)
│   └── Go to Case... [Ctrl+G]
│
├── 3. VIEW
│   ├── Status Bar (Toggle)
│   ├── Toolbars (Toggle)
│   ├── Data View (Switch Tab)
│   ├── Variable View (Switch Tab)
│   ├── Output Viewer (Switch Tab)
│   ├── Syntax Editor (Switch Tab)
│   └── Value Labels (Toggle Tampilan 1 ↔ Label)
│
├── 4. DATA
│   ├── Define Variable Properties...
│   ├── Value Labels Editor...
│   ├── Sort Cases (Ascending / Descending)...
│   ├── Split File (Compare Groups)...
│   ├── Weight Cases (By Frequency Variable)...
│   ├── Select Cases (Conditional Logic Filter)...
│   ├── Merge Files (Add Cases / Add Variables)...
│   ├── Aggregate Data...
│   ├── Transpose (Rows ↔ Columns)...
│   └── Restructure (Wide ↔ Long)...
│
├── 5. TRANSFORM
│   ├── Compute Variable (Formulasi Nilai Baru)...
│   ├── Recode into Same Variables...
│   ├── Recode into Different Variables...
│   └── Missing Value Imputation...
│
├── 6. ANALYZE (Jantung Analisis Statistik)
│   ├── Descriptive Statistics
│   │   ├── Frequencies...
│   │   ├── Descriptives...
│   │   └── Crosstabs (dengan Uji Chi-Square)...
│   ├── Compare Means
│   │   ├── One-Sample T Test...
│   │   ├── Independent-Samples T Test (Levene & Welch)...
│   │   ├── Paired-Samples T Test...
│   │   └── One-Way ANOVA (dengan Tukey HSD Post-Hoc)...
│   ├── Correlate
│   │   └── Bivariate (Pearson, Spearman, Kendall)...
│   ├── Regression
│   │   └── Linear (Simple & Multiple dengan Uji VIF)...
│   ├── Scale
│   │   └── Reliability Analysis (Cronbach's Alpha)...
│   └── Nonparametric Tests
│       ├── 2 Independent Samples (Mann-Whitney U)...
│       ├── 2 Related Samples (Wilcoxon Signed-Rank)...
│       └── K Independent Samples (Kruskal-Wallis H)...
│
├── 7. GRAPHS
│   ├── Chart Builder (Interaktif Drag-and-Drop)...
│   └── Legacy Dialogs
│       ├── Bar Chart...
│       ├── Pie Chart...
│       ├── Histogram (dengan Kurva Normal)...
│       ├── Scatter / Dot Plot...
│       ├── Line Chart...
│       ├── Area Chart...
│       └── Boxplot...
│
├── 8. UTILITIES
│   ├── Variables List...
│   └── Data Dictionary Report...
│
├── 9. EXTENSIONS
│   ├── Python FastAPI Backend Engine Status
│   ├── TypeScript Client-Side Engine Status
│   └── External Package Manager
│
├── 10. WINDOW
│   ├── 1. Data Editor [Data View]
│   ├── 2. Data Editor [Variable View]
│   ├── 3. Output Viewer
│   └── 4. Syntax Editor
│
└── 11. HELP
    ├── StatisticaPro Tutorial & Quick Start
    ├── SPSS Syntax Reference & Mathematical Formulations
    └── About StatisticaPro Enterprise
```

---

## 2. Taksonomi Toolbar Aksi & Pintasan Keyboard

| Ikon Toolbar | Label / Aksi | Pintasan Keyboard | Keterangan |
|---|---|---|---|
| 📂 | **Open Data** | `Ctrl + O` | Membuka wizard impor berkas data |
| 💾 | **Save As** | `Ctrl + S` | Menyimpan proyek / mengunduh Excel multi-sheet |
| 🖨️ | **Print / Export PDF**| `Ctrl + P` | Mencetak dokumen output atau ekspor PDF |
| ↩️ | **Undo** | `Ctrl + Z` | Membatalkan editan sel terakhir |
| ↪️ | **Redo** | `Ctrl + Y` | Mengulangi editan sel |
| ➕ | **Insert Case** | `Ctrl + I` | Menyisipkan baris baru di posisi kursor |
| ➕ | **Insert Variable** | `Ctrl + Shift + V`| Menyisipkan kolom variabel baru |
| 🔍 | **Find & Replace** | `Ctrl + F` | Mencari data dalam spreadsheet |
| 🏷️ | **Value Labels** | `Ctrl + L` | Toggle instan tampilan angka kode vs teks label |
| 📊 | **Quick Frequencies** | `Alt + A + F` | Membuka dialog Frequencies |
| 📈 | **Quick Descriptives**| `Alt + A + D` | Membuka dialog Descriptives |
| 🎨 | **Chart Builder** | `Alt + G + B` | Membuka Graph Builder |
| ▶️ | **Run Syntax** | `Ctrl + R` | Menjalankan skrip sintaks di Syntax Editor |
| 🌓 | **Theme Toggle** | `Ctrl + Shift + T`| Berganti tema (Classic Light, Modern, Dark) |

---

## 3. Taksonomi Struktur Output Viewer (Output Outline)

Setiap keluaran yang dihasilkan disusun secara hierarkis dalam struktur pohon (*Document Object Model Tree*):

```
Output Document [DataSet1]
├── Log (Monospace Syntax Block)
├── Procedure: Frequencies
│   ├── Title: Frequencies
│   ├── Notes
│   ├── Active Dataset: DataSet1
│   ├── Statistics (Tabel Pivot Ringkasan Valid/Missing)
│   ├── Variable: Gender (Tabel Frekuensi Kategori)
│   └── Bar Chart: Gender
├── Procedure: One-Way ANOVA
│   ├── Title: ONEWAY
│   ├── Notes
│   ├── Descriptives (Tabel Deskriptif per Kelompok)
│   ├── ANOVA (Tabel Uji F & Signifikansi)
│   └── Post Hoc Tests: Tukey HSD (Tabel Multiple Comparisons)
└── Procedure: Linear Regression
    ├── Title: REGRESSION
    ├── Model Summary (R, R Square, SE Estimate)
    ├── ANOVA (Uji Signifikansi Model Simultan)
    └── Coefficients (Nilai B, Beta, t, Sig, 95% CI, VIF)
```
