# OpenSPSS Statistics Studio: Professional Web Statistical Suite

> **Replikasi Desktop IBM SPSS Statistics Berbasis Web Modern, Cepat, dan Lengkap.**

OpenSPSS Statistics Studio adalah platform analisis data dan statistik profesional yang mereplikasi alur kerja, antarmuka (*UI/UX*), tata letak (*layout*), dan format pelaporan software desktop **IBM SPSS Statistics** tanpa menggunakan aset berhak cipta atau kode asli SPSS.

---

## 🌟 Fitur Utama

- **Antarmuka 100% Familiar bagi Pengguna SPSS**:
  - **Top Menu Bar Lengkap**: *File, Edit, View, Data, Transform, Analyze, Graphs, Utilities, Extensions, Window, Help* dengan sub-menu bertingkat dan shortcut keyboard.
  - **SPSS Toolbar**: Ikon aksi cepat (*Open, Save, Print, Undo, Redo, Recall, Find, Value Labels, Chart Builder*).
  - **Formula & Cell Status Bar**: Menampilkan koordinat sel aktif (`1 : salary`) dan nilai mentah.
  - **Data View**: Lembar kerja spreadsheet interaktif, penomoran baris otomatis, edit langsung dalam sel, navigasi tombol panah/tab/enter.
  - **Variable View**: 11 kolom konfigurasi metadata standar SPSS (*Name, Type, Width, Decimals, Label, Values, Missing, Columns, Align, Measure, Role*).
  - **Value Labels Editor Modal**: Menetapkan pemetaan nilai kategori (contoh: `1 = Male, 2 = Female`) dengan tombol toggle instan di toolbar.
  - **Output Viewer**: Panel terpisah dengan pohon navigasi outline di sisi kiri dan tabel pivot standar APA/SPSS di sisi kanan.
  - **Syntax Editor**: Editor kode perintah SPSS lengkap dengan syntax runner (*FREQUENCIES, DESCRIPTIVES, CROSSTABS, REGRESSION, T-TEST, ANOVA, CORRELATIONS*).
  - **Import & Export Fleksibel**: Mendukung berkas CSV, Excel (.xlsx, .xls), TSV, dan JSON serta ekspor laporan ke PDF, Excel, dan CSV.
  - **3 Tema Tampilan**: *SPSS Classic Light*, *Modern Light*, dan *Academic Dark*.

---

## 📐 Arsitektur & Teknologi

- **Frontend**: React 18, TypeScript, Vite, Vanilla CSS (SPSS Design System), Chart.js, Lucide Icons, SheetJS (XLSX).
- **Backend API**: Python 3.11+, FastAPI, SQLAlchemy, Pydantic, Uvicorn.
- **Statistical Engine**: Dual Engine — komputasi instan di browser klien (TypeScript) dan verifikasi ilmiah rigor tinggi di server (Python SciPy, Pandas, Statsmodels, Scikit-Learn).
- **Database**: PostgreSQL 16 (dengan opsi SQLite lokal tanpa konfigurasi).
- **Deployment**: Docker, Docker Compose, Nginx, Systemd.

---

## 🚀 Cara Menjalankan Secara Lokal

### 1. Menjalankan Frontend
```bash
cd frontend
npm install
npm run dev
```
Akses antarmuka di: **`http://localhost:5173/`**

### 2. Menjalankan Backend Python FastAPI
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn backend.main:app --reload --port 8000
```
Akses dokumentasi API Swagger di: **`http://localhost:8000/docs`**

### 3. Menjalankan Seluruh Sistem dengan Docker Compose
```bash
docker compose up -d --build
```
Akses aplikasi produksi di: **`http://localhost/`**

---

## 📚 Dokumentasi Lengkap

1. [01. Analisis Kebutuhan Lengkap](file:///c:/Users/LENOVO/New%20folder%20%284%29/docs/01_analisis_kebutuhan.md)
2. [02. Arsitektur Sistem & ERD Database](file:///c:/Users/LENOVO/New%20folder%20%284%29/docs/02_arsitektur_dan_erd.md)
3. [03. Wireframe Halaman & Desain UI Detail](file:///c:/Users/LENOVO/New%20folder%20%284%29/docs/03_wireframe_dan_desain_ui.md)
4. [04. Panduan Penggunaan & Panduan Transisi SPSS](file:///c:/Users/LENOVO/New%20folder%20%284%29/docs/04_panduan_penggunaan.md)
5. [05. Panduan Deployment VPS, Cloud & Docker](file:///c:/Users/LENOVO/New%20folder%20%284%29/docs/05_panduan_deployment_vps_cloud.md)

---

## 🧪 Pengujian Statistik

Seluruh algoritma statistik telah divalidasi dan diuji terhadap dataset standar SPSS (*Employee data* 40 responden) dengan hasil yang terverifikasi numerik:
- Descriptive Statistics (Mean: `39,890.625`, Std. Dev: `24,198.22`)
- Frequencies Table (Valid % & Cumulative %)
- Crosstabs & Pearson Chi-Square ($\chi^2 = 10.370$, $p = 0.0346$)
- Pearson Bivariate Correlation ($r = 0.912$, $p < 0.001$)
- One-Sample T-Test ($t = 2.306$, $df = 39$, $p = 0.0264$)
- Independent Samples T-Test (Levene $F$, $t = 3.104$, $df = 38$)
- One-Way ANOVA ($F = 44.405$, $p < 0.001$) & Post-Hoc Tukey HSD
- Linear Regression ($R^2 = 0.844$, $F = 100.12$, $p < 0.001$)
