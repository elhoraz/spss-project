# 3. Wireframe Halaman & Desain Antarmuka Detail

## 3.1 Konsep Visual dan Tata Letak (Layout Architecture)

Desain antarmuka **OpenSPSS Statistics Web Studio** mereplikasi struktur visual desktop klasik SPSS dengan sentuhan modern:

```
+---------------------------------------------------------------------------------------------------------+
| [Logo] IBM SPSS Statistics [Employee data.sav]                                      Pro Edition v1.0 [X]| (1) Title Bar
+---------------------------------------------------------------------------------------------------------+
| File   Edit   View   Data   Transform   Analyze   Graphs   Utilities   Extensions   Window   Help         | (2) Menu Bar
+---------------------------------------------------------------------------------------------------------+
| [Open] [Save] [Print] | [Undo] [Redo] | [Grid] [Var] [Out] [Syn] | [Tag] [Freq] [Desc] | Theme: [Moon]  | (3) Toolbar
+---------------------------------------------------------------------------------------------------------+
|  1 : salary   |  57000.00 (Current Salary ($))                                                          | (4) Formula Bar
+---------------+-----------------------------------------------------------------------------------------+
|               |        id (Scale) |    gender (Nom) |      educ (Ord) |    salary (Scale) |   + var...  |
+---------------+-------------------+-----------------+-----------------+-------------------+-------------+
|       1       |                 1 |            Male |              15 |        $57,000.00 |             | (5) Workspace
|       2       |                 2 |            Male |              16 |        $40,200.00 |             |     (Data View /
|       3       |                 3 |          Female |              12 |        $21,450.00 |             |      Variable View)
|       4       |                 4 |          Female |               8 |        $21,900.00 |             |
|       5       |                 5 |            Male |              15 |        $45,000.00 |             |
|      ...      |               ... |             ... |             ... |               ... |             |
|       *       |                   |                 |                 |                   |             |
+---------------+-------------------+-----------------+-----------------+-------------------+-------------+
| [Data View]  [Variable View]  |  [Output Viewer (2)]  [Syntax Editor]                                   | (6) Bottom Tabs
+---------------------------------------------------------------------------------------------------------+
| IBM SPSS Statistics Processor is ready | Cases: 40 | Variables: 9 | Filter off | Weight off | Split off | (7) Status Bar
+---------------------------------------------------------------------------------------------------------+
```

---

## 3.2 Wireframe Variable View (11 Kolom Metadata SPSS)

Ketika pengguna memilih tab bawah **[Variable View]**, workspace menampilkan tabel konfigurasi 11 kolom:

```
+----+----------+---------+-------+----------+-----------------------------+--------------+---------+---------+-------+---------+-------+
|    | Name     | Type    | Width | Decimals | Label                       | Values       | Missing | Columns | Align | Measure | Role  |
+----+----------+---------+-------+----------+-----------------------------+--------------+---------+---------+-------+---------+-------+
|  1 | id       | Numeric |     4 |        0 | Employee Code               | {None}   [...] | None    |       6 | Right | Nominal | Input |
|  2 | gender   | String  |     1 |        0 | Gender                      | {m, Male}[...] | None    |       8 | Left  | Nominal | Input |
|  3 | bdate    | Date    |    10 |        0 | Date of Birth               | {None}   [...] | None    |      10 | Right | Scale   | Input |
|  4 | educ     | Numeric |     2 |        0 | Educational Level (years)   | {None}   [...] | None    |       8 | Right | Ordinal | Input |
|  5 | jobcat   | Numeric |     1 |        0 | Employment Category         | {1, Cler}[...] | None    |      10 | Right | Nominal | Input |
|  6 | salary   | Dollar  |     8 |        2 | Current Salary ($)          | {None}   [...] | None    |      10 | Right | Scale   | Target|
|  7 | salbegin | Dollar  |     8 |        2 | Beginning Salary ($)        | {None}   [...] | None    |      10 | Right | Scale   | Input |
|  * | + Add new variable...                                                                                                              |
+----+----------+---------+-------+----------+-----------------------------+--------------+---------+---------+-------+---------+-------+
```

Tombol `[...]` pada kolom **Values** membuka dialog **Value Labels Editor** modal.

---

## 3.3 Wireframe Dialog Analisis Statistik (2-Box Selector)

Ketika pengguna mengklik menu `Analyze` $\rightarrow$ `Descriptive Statistics` $\rightarrow$ `Frequencies...`:

```
+-----------------------------------------------------------------------+
| Frequencies                                                        [X]|
+-----------------------------------------------------------------------+
| Variables:                      Selected Variable(s):      [   OK   ] |
| +-------------------------+     +------------------------+ [ Paste  ] |
| | [Ruler] salary          |     | [Bars]  jobcat         | [ Reset  ] |
| | [Ruler] salbegin        | --> | [Circ]  gender         | [ Cancel ] |
| | [Ruler] jobtime         | <-- |                        |            |
| | [Ruler] educ            |     |                        |            |
| | [Circ]  minority        |     |                        |            |
| +-------------------------+     +------------------------+            |
|                                                                       |
| [X] Display frequency tables                                          |
|                                                                       |
| Options / Statistics:                                                 |
|   [X] Mean    [X] Std. Deviation    [X] Minimum    [X] Maximum        |
+-----------------------------------------------------------------------+
```

---

## 3.4 Wireframe Output Viewer (Split View Layout)

Ketika pengguna memilih tab bawah **[Output Viewer]**:

```
+---------------------------------------------------------------------------------------------------------+
| [Download PDF]  [Export Excel]  [Print]                                                  [Clear Output] |
+-----------------------------+---------------------------------------------------------------------------+
| 📁 Output Document          | 📋 Frequencies                                                10:15:20 AM |
|   ▼ 📊 Frequencies          | +-----------------------------------------------------------------------+ |
|       Log                   | | FREQUENCIES VARIABLES=gender jobcat                                   | | (Syntax Log)
|       Title                 | |   /ORDER=ANALYSIS.                                                    | |
|     ► Statistics            | +-----------------------------------------------------------------------+ |
|     ► Gender                |                                                                           |
|     ► Job Category          | Statistics                                                                |
|                             | +-------------------+------------------+------------------+---------------+ | (Pivot Table)
|   ▼ 📋 Descriptives         | | Variable          | Valid N          | Mean             | Std. Deviation| |
|       Log                   | +===================+==================+==================+===============+ |
|       Title                 | | salary            | 40               | 39,890.62        | 24,198.22     | |
|     ► Descriptive Statistics| | salbegin          | 40               | 18,393.75        | 10,210.84     | |
|                             | +-------------------+------------------+------------------+---------------+ |
|                             |                                                                           |
|                             | Gender                                                                    |
|                             | +-------------------+------------------+------------------+---------------+ |
|                             | | Category          | Frequency        | Percent          | Valid Percent | |
|                             | +===================+==================+==================+===============+ |
|                             | | Male (m)          | 25               | 62.5%            | 62.5%         | |
|                             | | Female (f)        | 15               | 37.5%            | 37.5%         | |
|                             | +-------------------+------------------+------------------+---------------+ |
|                             | | Total             | 40               | 100.0%           | 100.0%        | |
|                             | +-------------------+------------------+------------------+---------------+ |
+-----------------------------+---------------------------------------------------------------------------+
```

---

## 3.5 Token Desain & Palet Warna

| Token Desain | SPSS Classic Light | Academic Dark | Keterangan |
|---|---|---|---|
| `--bg-app` | `#e0e4e8` | `#0b0f19` | Latar belakang frame jendela utama |
| `--bg-surface` | `#ffffff` | `#1e293b` | Latar belakang tabel spreadsheet dan dokumen |
| `--bg-header` | `#e4e7eb` | `#1e293b` | Latar belakang header kolom grid |
| `--bg-selected-cell`| `#cce4f7` | `#1e3a5f` | Warna sel aktif yang terpilih |
| `--accent` | `#0b57d0` | `#38bdf8` | Warna primer ikon SPSS & tombol aksi |
| `--border-cell` | `#d0d7de` | `#293548` | Garis grid spreadsheet |
| `--table-border-spss`| `#000000` | `#94a3b8` | Garis horizontal ganda standar APA SPSS |
| `--font-sans` | `'Inter', 'Segoe UI'` | `'Inter', 'Segoe UI'` | Tipografi UI desktop modern |
| `--font-mono` | `'JetBrains Mono'` | `'JetBrains Mono'` | Tipografi log sintaks SPSS |
