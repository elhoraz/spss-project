# SPECIFICATION 09: GRAPH BUILDER SPECIFICATION
**Visual Chart Builder Topology, Data Mapping Channels, High-DPI Export & Vector Rendering**
**Standard Reference:** IBM SPSS Statistics 28/29 Professional Desktop  
**Version:** 3.0.0-PRO  

---

## 1. Topologi Antarmuka Chart Builder (Drag-and-Drop Canvas)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [Title Bar] Chart Builder                                                  [-] [x]     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [Variables Palette]        │ [Chart Preview & Drop-Zones Canvas]                       │
│ ┌────────────────────────┐ │ ┌───────────────────────────────────────────────────────┐ │
│ │ 🔘 gender              │ │ │ [Drop: Filter / Panel By Row]                         │ │
│ │ 📏 salary              │ │ │ ┌───────────────────────────────────────────────────┐ │ │
│ │ 📏 salbegin            │ │ │ │ Y-Axis Zone (Mean / Count)                        │ │ │
│ │ 🔘 jobcat              │ │ │ │   ▲                                               │ │ │
│ │ 📏 educ                │ │ │ │   │       [📊 Clustered Bar Preview]              │ │ │
│ └────────────────────────┘ │ │ │   │                                               │ │ │
│ [Gallery of Charts]        │ │ │   └────────────────────────►                      │ │ │
│ ┌────────────────────────┐ │ │ │   X-Axis Zone [Drop: Category Variable]           │ │ │
│ │ [Bar] [Line] [Area]    │ │ │ └───────────────────────────────────────────────────┘ │ │
│ │ [Pie] [Scatter] [Box]  │ │ │ [Drop: Legend / Color By Variable]                   │ │ │
│ └────────────────────────┘ │ └───────────────────────────────────────────────────────┘ │
│                                                                                        │
│ [ Element Properties Panel ]                                                           │
│ - Statistic: [ Mean         ▼ ]     - Error Bars: [x] Display Error Bars (95% CI)      │
│ - Bar Width: [ Medium       ▼ ]     - Color Palette: [ SPSS Classic Academic       ▼ ] │
│ ────────────────────────────────────────────────────────────────────────────────────── │
│ [ OK ]               [ Paste ]               [ Reset ]               [ Cancel ]        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Spesifikasi 7 Jenis Grafik Statistik

### 1. Bar Chart (Diagram Batang)
* **Sub-tipe**:
  - *Simple Bar*: 1 variabel kategori pada sumbu X, frekuensi (*Count*) atau rata-rata (*Mean*) variabel numerik pada sumbu Y.
  - *Clustered Bar*: Sumbu X dikelompokkan berdampingan berdasarkan variabel kedua (*Cluster Variable*).
  - *Stacked Bar*: Komposisi segmen batang bertumpuk menunjukkan proporsi persentase 100% atau total kumulatif.
* **Data Mapping**:
  - `X-Axis`: Variabel Nominal atau Ordinal.
  - `Y-Axis`: Count, Percentage, atau Summary Statistic (Mean, Median, Sum) dari variabel Scale.
  - `Cluster / Stack`: Variabel Nominal kedua.
* **Legend**: Menampilkan kotak warna per kategori variabel pengelompokan.
* **Formatting**: Opsi menampilkan label nilai (*Data Labels*) di atas setiap batang.

### 2. Pie Chart (Diagram Lingkaran)
* **Data Mapping**:
  - `Slices By`: 1 variabel Nominal atau Ordinal.
  - `Values`: Jumlah frekuensi kasus (*Counts*) atau persentase total (*Percentages*).
* **Legend**: Daftar label kategori beserta warna irisan.
* **Formatting**: Label persentase di dalam atau di luar irisan; sudut rotasi irisan pertama (*First slice angle*).

### 3. Histogram
* **Data Mapping**:
  - `X-Axis`: 1 variabel Scale numerik kontinu.
  - `Y-Axis`: Frekuensi kasus (*Frequency*).
* **Fitur Normal Curve Overlay**:
  - Checkbox `[x] Display normal curve` menghitung kurva Gaussian teoretis:
    $$f(x) = \frac{1}{\sigma \sqrt{2\pi}} \exp\left(-\frac{(x - \mu)^2}{2\sigma^2}\right)$$
    di mana $\mu$ adalah sample mean dan $\sigma$ adalah sample standard deviation.
* **Binning Strategy**: Algoritma otomatis penentuan lebar bin (*Freedman-Diaconis* atau *Sturges' Rule*) dengan opsi kustomisasi jumlah bin manual oleh pengguna.

### 4. Scatter Plot (Diagram Pencar)
* **Data Mapping**:
  - `X-Axis`: Variabel Scale (Variabel independen).
  - `Y-Axis`: Variabel Scale (Variabel dependen).
  - `Color / Set Marker By`: Variabel kategori untuk memberi warna berbeda pada titik observasi.
* **Fit Line Options**:
  - Garis regresi linier sederhana ($Y = \beta_0 + \beta_1 X$) dengan nilai $R^2$.
  - Kurva kuadratik ($Y = \beta_0 + \beta_1 X + \beta_2 X^2$).
  - LOESS curve (non-parametrik local regression).

### 5. Line Chart (Diagram Garis)
* **Data Mapping**:
  - `X-Axis`: Variabel deret waktu (*Time*) atau kategori berurutan.
  - `Y-Axis`: Nilai variabel Scale.
  - `Multiple Lines By`: Variabel pemecah grup.
* **Formatting**: Gaya garis (solid, dashed, dotted), ketebalan garis (1px, 2px, 3px), dan penanda titik (*markers*).

### 6. Area Chart
* **Data Mapping**: Mirip dengan Line Chart, namun area di bawah garis diisi warna semi-transparan untuk menekankan akumulasi besaran volume.

### 7. Boxplot (Diagram Kotak-Garis)
* **Data Mapping**:
  - `Variable`: Variabel Scale kontinu.
  - `Category Axis`: Variabel pengelompokan Nominal/Ordinal.
* **Komponen Anatomi Boxplot SPSS**:
  - **Median Line**: Garis horizontal tebal di dalam kotak menunjukkan kuartil kedua ($Q_2$).
  - **Interquartile Range Box (IQR)**: Kotak membentang dari Kuartil 1 ($Q_1$ / persentil 25) hingga Kuartil 3 ($Q_3$ / persentil 75).
  - **Whiskers**: Garis membentang hingga nilai terjauh yang masih berada dalam batas toleransi $1.5 \times \text{IQR}$ dari tepi kotak:
    $$\text{Lower Bound} = Q_1 - 1.5 \times \text{IQR}, \quad \text{Upper Bound} = Q_3 + 1.5 \times \text{IQR}$$
  - **Outlier Points ($\circ$)**: Observasi yang berada di luar $1.5 \times \text{IQR}$ hingga $3.0 \times \text{IQR}$. Diberi simbol lingkaran kecil disertai nomor baris kasus (*Case ID Number*).
  - **Extreme Outliers ($\ast$)**: Observasi yang berada lebih dari $3.0 \times \text{IQR}$ dari tepi kotak. Diberi simbol tanda bintang (*) disertai nomor baris kasus.

---

## 3. Fitur Export & Interactive Edit Mode

### 1. Interactive Chart Editor:
* Pengguna dapat mengklik ganda (*double-click*) pada grafik di Output Viewer untuk masuk ke mode edit properti:
  - Mengubah teks judul grafik (*Chart Title*), label sumbu X dan Y.
  - Mengubah rentang minimum dan maksimum nilai sumbu (*Axis Range Scale*).
  - Mengganti palet warna (*Academic Greyscale, SPSS Classic Navy Blue, Warm Muted, Vibrant*).
  - Mengubah orientasi grafik dari vertikal ke horizontal (*Transpose Axes*).

### 2. Export Engine:
* **PNG Export**: Pengguna dapat memilih resolusi dari web standard 72 DPI hingga publikasi cetak jurnal **300 DPI**.
* **SVG Vector Export**: Ekspor format Scalable Vector Graphics murni tanpa degradasi resolusi saat diperbesar di dokumen ilmiah (LaTeX/Word).
* **Copy to OS Clipboard**: Menyalin gambar raster langsung ke clipboard sehingga pengguna dapat langsung menekan `Ctrl+V` di Microsoft Word.
