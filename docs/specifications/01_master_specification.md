# SPECIFICATION 01: MASTER SPECIFICATION OVERVIEW
**System Architecture, Desktop Paradigm & Design Mandate**
**Project:** StatisticaPro Enterprise Studio (OpenSPSS Workstation)  
**Standard Reference:** IBM SPSS Statistics 28/29 Professional Desktop  
**Version:** 3.0.0-PRO  

---

## 1. Executive Summary & Design Mandate

Aplikasi ini dirancang secara khusus untuk **bukan** menjadi SaaS dashboard modern biasa, melainkan sebagai **Desktop-Class Web Statistical Workstation**. Seluruh rancang bangun mengikuti filosofi interaksi, tata letak, pola pikir, dan mekanisme kerja software statistik desktop profesional standar industri akademik.

### Aturan Inti Desain & Interaksi:
1. **Spreadsheet + Output Viewer Paradigm**: Data tersimpan dalam grid tabular persisten dengan dual-view (*Data View* dan *Variable View*). Hasil analisis tidak pernah ditumpuk di atas data melainkan dipancarkan ke panel *Output Viewer* independen dengan hierarki pohon navigasi (*Outline Tree*).
2. **Dense & Professional Information Architecture**: Densitas informasi tinggi, tipografi sistem monospaced/sans-serif ringkas (Segoe UI / Inter 11–12px), palet abu-abu desktop (*Grey Workspace Canvas #ECE9D8 / #F0F0F0*), border tabel ganda (*APA classic double-border pivot tables*).
3. **Keyboard-First & Two-Box Modal Workflows**: Setiap operasi memiliki shortcut keyboard klasik, dan seluruh prosedur statistik menggunakan dialog modal dua kotak (*Source Variables Listbox* $\rightarrow$ *Transfer Arrow* $\rightarrow$ *Target Variables Listbox*) lengkap dengan tombol *OK, Paste, Reset, Cancel, Help* serta sub-dialog *Statistics, Options, Plots*.
4. **Dual Engine Execution**: Instant client-side engine (TypeScript) untuk dataset interaktif cepat (< 5.000 kasus), dan server-side Python scientific engine (NumPy, SciPy, Statsmodels, Scikit-Learn) untuk komputasi analitik skala besar (hingga 100.000+ baris $\times$ 500 kolom).

---

## 2. Arsitektur Komponen Tingkat Tinggi

```
┌────────────────────────────────────────────────────────────────────────┐
│                        WEB APPLICATION WORKSPACE                       │
├────────────────────────────────────────────────────────────────────────┤
│ Top Menu Bar (11 Menus) | File, Edit, View, Data, Transform, Analyze.. │
│ Toolbar Shortcuts       | New, Open, Save, Print, Undo, Redo, 1<->A    │
├────────────────────────────────────────────────────────────────────────┤
│                     PRIMARY WORKSPACE VIEWPORT                         │
│  ┌──────────────────────────────┬───────────────────────────────────┐  │
│  │ TAB 1: DATA VIEW             │ TAB 3: OUTPUT VIEWER              │  │
│  │ - 100k+ Virtualized Grid     │ - Outline Tree Navigation         │  │
│  │ - Cell Range Selection       │ - APA Double-Border Pivot Tables  │  │
│  │ - TSV OS Clipboard           │ - Interactive Charts & Log        │  │
│  ├──────────────────────────────┼───────────────────────────────────┤  │
│  │ TAB 2: VARIABLE VIEW         │ TAB 4: SYNTAX EDITOR              │  │
│  │ - 11 Structural Attributes   │ - Monaco Editor SPSS Monarch Lexer│  │
│  │ - In-cell Type & Value Maps  │ - Interactive Execution & Parser  │  │
│  └──────────────────────────────┴───────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────┤
│ Bottom Status Bar | Processor Status | Cases: N | Vars: M | Filter: OFF│
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   DUAL-ENGINE STATISTICAL PROCESSOR                    │
├──────────────────────────────────┬─────────────────────────────────────┤
│ CLIENT-SIDE ENGINE (TypeScript)  │ SERVER-SIDE ENGINE (Python FastAPI) │
│ - Instant In-Memory Vector Math  │ - NumPy C-Vectorized Linear Algebra │
│ - Reactive Dynamic Formatting    │ - SciPy & Statsmodels Distributions │
│ - Fast Descriptive Statistics    │ - Complex Factor & Logistic Analysis│
└──────────────────────────────────┴─────────────────────────────────────┘
```

---

## 3. Hubungan Antar Dokumen Spesifikasi
Dokumen spesifikasi ini didukung oleh 14 dokumen spesifikasi detail turunan:
- [02_menu_specification.md](file:///c:/Users/LENOVO/New%20folder%20%284%29/docs/specifications/02_menu_specification.md)
- [03_workspace_specification.md](file:///c:/Users/LENOVO/New%20folder%20%284%29/docs/specifications/03_workspace_specification.md)
- [04_data_view_specification.md](file:///c:/Users/LENOVO/New%20folder%20%284%29/docs/specifications/04_data_view_specification.md)
- [05_variable_view_specification.md](file:///c:/Users/LENOVO/New%20folder%20%284%29/docs/specifications/05_variable_view_specification.md)
- [06_analysis_specification.md](file:///c:/Users/LENOVO/New%20folder%20%284%29/docs/specifications/06_analysis_specification.md)
- [07_output_viewer_specification.md](file:///c:/Users/LENOVO/New%20folder%20%284%29/docs/specifications/07_output_viewer_specification.md)
- [08_syntax_specification.md](file:///c:/Users/LENOVO/New%20folder%20%284%29/docs/specifications/08_syntax_specification.md)
- [09_graph_builder_specification.md](file:///c:/Users/LENOVO/New%20folder%20%284%29/docs/specifications/09_graph_builder_specification.md)
- [10_shortcut_specification.md](file:///c:/Users/LENOVO/New%20folder%20%284%29/docs/specifications/10_shortcut_specification.md)
- [11_ux_specification.md](file:///c:/Users/LENOVO/New%20folder%20%284%29/docs/specifications/11_ux_specification.md)
- [12_performance_specification.md](file:///c:/Users/LENOVO/New%20folder%20%284%29/docs/specifications/12_performance_specification.md)
- [13_gap_analysis.md](file:///c:/Users/LENOVO/New%20folder%20%284%29/docs/specifications/13_gap_analysis.md)
- [14_refactor_plan.md](file:///c:/Users/LENOVO/New%20folder%20%284%29/docs/specifications/14_refactor_plan.md)
- [15_migration_plan.md](file:///c:/Users/LENOVO/New%20folder%20%284%29/docs/specifications/15_migration_plan.md)
