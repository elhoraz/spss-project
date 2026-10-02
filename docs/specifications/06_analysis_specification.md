# SPECIFICATION 06: ANALYSIS SPECIFICATION
**Two-Box Dialog Topology, Sub-Dialog Modals, Mathematical Engines & APA Pivot Output Tables**
**Standard Reference:** IBM SPSS Statistics 28/29 Professional Desktop  
**Version:** 3.0.0-PRO  

---

## 1. Standar Pola Antarmuka Dialog Analisis (Two-Box Dialog Standard)

Seluruh dialog analisis statistik mengimplementasikan tata letak modal dua kotak standar desktop SPSS:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [Title Bar] Frequencies                                                    [-] [x]     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [Source Variables Listbox]            [Transfer]       [Target Variables Listbox]      │
│ ┌───────────────────────────────────┐                  ┌─────────────────────────────┐ │
│ │ 🔘 gender [Gender]                │     [ > ]        │ 📏 salary [Current Salary]  │ │
│ │ 📏 educ [Educational Level]       │     [ < ]        │ 📏 salbegin [Beginning Sal] │ │
│ │ 🔘 jobcat [Employment Category]   │                  │                             │ │
│ │ 📏 bdate [Date of Birth]          │                  │                             │ │
│ └───────────────────────────────────┘                  └─────────────────────────────┘ │
│                                                                                        │
│ [x] Display frequency tables                           [ Sub-Dialog Action Buttons ]   │
│                                                        [ Statistics... ]               │
│                                                        [ Charts...     ]               │
│                                                        [ Format...     ]               │
│                                                        ─────────────────────────────── │
│                                                        [ OK     ]   [ Paste  ]         │
│                                                        [ Reset  ]   [ Cancel ]         │
│                                                        [ Help   ]                      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Komponen Standar Dialog:
1. **Source Variables Listbox**: Menampilkan daftar variabel dataset yang belum dipilih, lengkap dengan ikon tipe skala (📏 Scale, 📶 Ordinal, 🔘 Nominal), nama variabel, dan label deskriptifnya. Mendukung seleksi jamak (*multi-select* via `Ctrl+Click` dan `Shift+Click`).
2. **Transfer Button (`[ > ]` / `[ < ]`)**: Memindahkan variabel yang disorot antara kotak sumber dan target. Tombol mengarah ke kanan (`>`) jika variabel di sumber disorot, dan mengarah ke kiri (`<`) jika variabel di target disorot. Double-click pada item variabel otomatis memindahkannya.
3. **Target Variables Listbox**: Menampung variabel yang dipilih untuk dihitung dalam analisis.
4. **Sub-Dialog Action Buttons**:
   - `[ Statistics... ]`: Membuka jendela modal bertingkat untuk memilih metrik statistik tambahan (kuartil, mean, deviasi standar, uji hipotesis).
   - `[ Charts... ]` / `[ Plots... ]`: Membuka modal pengaturan jenis grafik (Bar, Pie, Histogram, Normal curve).
   - `[ Options... ]` / `[ Format... ]`: Membuka modal penanganan data hilang (*Exclude cases listwise / pairwise*) dan urutan penyajian tabel.
5. **Core Execution Buttons**:
   - `[ OK ]`: Menjalankan analisis statistik seketika; memancarkan tabel hasil dan grafik ke Output Viewer; otomatis menutup dialog.
   - `[ Paste ]`: Menerjemahkan konfigurasi dialog menjadi sintaks resmi SPSS dan menempelkannya ke tab Syntax Editor aktif; menutup dialog.
   - `[ Reset ]`: Mengembalikan semua kotak input dan konfigurasi opsi ke kondisi awal (default).
   - `[ Cancel ]`: Membatalkan operasi dan menutup dialog tanpa membuat perubahan apapun. Shortcut: `Escape`.
   - `[ Help ]`: Membuka manual algoritma dan panduan topik untuk prosedur terkait. Shortcut: `F1`.

---

## 2. Spesifikasi Detail 14 Prosedur Analisis Statistik

### 1. Frequencies
* **Source & Target**: Variabel Nominal, Ordinal, atau Scale dipindahkan ke `Variable(s)`.
* **Sub-Dialog `[ Statistics... ]`**:
  - Percentile Values: `[ ] Quartiles`, `[ ] Cut points for equal groups`, `[ ] Percentiles`.
  - Central Tendency: `[x] Mean`, `[x] Median`, `[x] Mode`, `[ ] Sum`.
  - Dispersion: `[x] Std. deviation`, `[x] Variance`, `[x] Range`, `[x] Minimum`, `[x] Maximum`, `[x] S.E. mean`.
  - Distribution: `[x] Skewness`, `[x] Kurtosis`.
* **Sub-Dialog `[ Charts... ]`**: Chart Type: `( ) None`, `( ) Bar charts`, `( ) Pie charts`, `( ) Histograms` (dengan opsi `[x] Show normal curve`).
* **Sub-Dialog `[ Format... ]`**: Order by: `( ) Ascending values`, `( ) Descending values`, `( ) Ascending counts`, `( ) Descending counts`.
* **Output Tables**:
  1. *Statistics Table*: Menampilkan ringkasan metrik deskriptif per variabel ($N \text{ valid}, N \text{ missing}, \text{Mean}, \text{SD}$, dll.).
  2. *Frequency Table*: Menampilkan kolom `Frequency`, `Percent`, `Valid Percent`, `Cumulative Percent`.

### 2. Descriptives
* **Source & Target**: 1 atau lebih variabel Scale dipindahkan ke `Variable(s)`.
* **Checkbox Utama**: `[ ] Save standardized values as variables` (menghasilkan variabel baru $Z = \frac{X - \mu}{\sigma}$ di Data View).
* **Sub-Dialog `[ Options... ]`**: Checkbox Mean, Sum, Std. deviation, Variance, Range, Minimum, Maximum, S.E. mean, Kurtosis, Skewness, Display Order.
* **Output Tables**:
  - *Descriptive Statistics Table*: Kolom $N$, Minimum, Maximum, Mean, Std. Deviation.

### 3. Explore (Uji Normalitas & Deteksi Outlier)
* **Source & Target**:
  - `Dependent List`: Variabel Scale kontinu.
  - `Factor List`: Variabel kategori grup (opsional).
* **Sub-Dialog `[ Statistics... ]`**: `[x] Descriptives (95% CI)`, `[ ] M-estimators`, `[ ] Outliers`, `[ ] Percentiles`.
* **Sub-Dialog `[ Plots... ]`**:
  - Boxplots: `( ) Factor levels together`, `( ) Dependents together`, `( ) None`.
  - Descriptive: `[x] Stem-and-leaf`, `[ ] Histogram`.
  - `[x] Normality plots with tests`.
* **Output Tables**:
  1. *Case Processing Summary*: Jumlah valid, missing, total observasi.
  2. *Descriptives Table*: Mean, 95% Confidence Interval for Mean, 5% Trimmed Mean, Median, Variance, Std. Deviation, Min, Max, Range, Interquartile Range, Skewness, Kurtosis.
  3. *Tests of Normality Table*: Menampilkan statistik uji **Kolmogorov-Smirnov** (dengan koreksi signifikansi Lilliefors) dan **Shapiro-Wilk** ($W, df, Sig.$).
  4. *Extreme Values Table*: 5 observasi kasus dengan nilai tertinggi dan 5 terendah lengkap dengan nomor baris kasus (*Case Number*).

### 4. Crosstabs (Tabulasi Silang)
* **Source & Target**:
  - `Row(s)`: Variabel kategori.
  - `Column(s)`: Variabel kategori.
* **Sub-Dialog `[ Statistics... ]`**: `[x] Chi-square`, `[ ] Correlations`, `[ ] Contingency coefficient`, `[x] Phi and Cramer's V`, `[ ] Lambda`, `[ ] Gamma`.
* **Sub-Dialog `[ Cells... ]`**: Counts: `[x] Observed`, `[x] Expected`. Percentages: `[x] Row`, `[x] Column`, `[x] Total`.
* **Output Tables**:
  1. *Case Processing Summary*.
  2. *Crosstabulation Pivot Table*: Sel memuat kombinasi count dan persentase.
  3. *Chi-Square Tests Table*: Pearson Chi-Square ($\chi^2, df, p$), Continuity Correction, Likelihood Ratio, Fisher's Exact Test, Linear-by-Linear Association.

### 5. Means Report
* **Source & Target**: `Dependent List` (variabel Scale) dan `Independent List` (variabel kategori Layer 1, Layer 2).
* **Sub-Dialog `[ Options... ]`**: Statistik yang disertakan: Mean, Number of Cases, Std. Deviation, Variance, Median, Group Skewness, serta opsi `[ ] Anova table and eta`.
* **Output Tables**:
  - *Report Table*: Rincian mean dan deviasi standar per strata kategori.

### 6. Bivariate Correlation
* **Source & Target**: 2 atau lebih variabel Scale/Ordinal dipindahkan ke `Variables`.
* **Correlation Coefficients**: `[x] Pearson`, `[ ] Spearman`, `[ ] Kendall's tau-b`.
* **Test of Significance**: `(•) Two-tailed`, `( ) One-tailed`.
* **Checkbox**: `[x] Flag significant correlations` (menambahkan tanda * untuk $p < 0.05$ dan ** untuk $p < 0.01$).
* **Sub-Dialog `[ Options... ]`**: Statistics: `[ ] Means and standard deviations`, `[ ] Cross-product deviations and covariances`. Missing: Exclude cases pairwise vs listwise.
* **Output Tables**:
  - *Correlations Matrix Table*: Matriks simetris koefisien korelasi $r$, signifikansi $p$ (2-tailed), dan jumlah kasus $N$.

### 7. Linear Regression
* **Source & Target**:
  - `Dependent`: 1 variabel Scale.
  - `Independent(s)`: 1 atau lebih variabel Scale / Dummy.
  - `Method`: Dropdown pilihan `Enter`, `Stepwise`, `Remove`, `Backward`, `Forward`.
* **Sub-Dialog `[ Statistics... ]`**:
  - Regression Coefficients: `[x] Estimates`, `[x] Confidence intervals (95%)`, `[ ] Covariance matrix`.
  - `[x] Model fit`, `[ ] R squared change`, `[x] Descriptives`, `[ ] Part and partial correlations`, `[x] Collinearity diagnostics` (Tolerance & VIF).
  - Residuals: `[x] Durbin-Watson`.
* **Sub-Dialog `[ Plots... ]`**: Scatter plot residual (`*ZRESID` vs `*ZPRED`), `[x] Histogram`, `[x] Normal probability plot`.
* **Output Tables**:
  1. *Model Summary*: $R, R^2, \text{Adjusted } R^2, \text{Std. Error of the Estimate}$, Durbin-Watson.
  2. *ANOVA Table*: Sum of Squares, $df$, Mean Square, $F, Sig.$
  3. *Coefficients Table*: Unstandardized Coefficients ($B, SE$), Standardized Coefficients ($\beta$), $t, Sig.$, Collinearity Statistics (Tolerance, VIF).
  4. *Collinearity Diagnostics*: Eigenvalue, Condition Index, Variance Proportions.

### 8. One-Sample T Test
* **Source & Target**: 1 atau lebih variabel Scale dipindahkan ke `Test Variable(s)`.
* **Input Box**: `Test Value:` (konstanta pembanding $\mu_0$, default: `0`).
* **Sub-Dialog `[ Options... ]`**: Confidence Interval Percentage (default: `95%`), Missing Values handler.
* **Output Tables**:
  1. *One-Sample Statistics*: $N$, Mean, Std. Deviation, Std. Error Mean.
  2. *One-Sample Test*: $t, df$, Two-Sided $p$, Mean Difference, 95% Confidence Interval of the Difference (Lower, Upper).

### 9. Independent-Samples T Test
* **Source & Target**:
  - `Test Variable(s)`: 1 atau lebih variabel Scale.
  - `Grouping Variable`: 1 variabel kategori.
* **Sub-Dialog `[ Define Groups... ]`**: Menentukan nilai kode untuk `Group 1:` (misal `1`) dan `Group 2:` (misal `2`) atau titik pemotong (*Cut point*).
* **Output Tables**:
  1. *Group Statistics*: $N$, Mean, Std. Deviation, Std. Error Mean per kelompok.
  2. *Independent Samples Test*:
     - **Levene's Test for Equality of Variances**: $F, Sig.$
     - **t-test for Equality of Means**: Baris pertama *Equal variances assumed* ($t, df, p, \text{Mean Diff}, SE \text{ Diff}, 95\% \text{ CI}$), dan baris kedua *Equal variances not assumed* (Welch-Satterthwaite $t, df^*, p$).

### 10. Paired-Samples T Test
* **Source & Target**: Pasangan variabel `Variable 1` dan `Variable 2` dipindahkan ke `Paired Variables` (Pair 1, Pair 2..).
* **Output Tables**:
  1. *Paired Samples Statistics*: Mean, $N$, SD, SE Mean untuk setiap kondisi.
  2. *Paired Samples Correlations*: Korelasi $r$ dan $p$-value antar pasangan.
  3. *Paired Samples Test*: Paired Differences (Mean, SD, SE Mean, 95% CI), $t, df, Sig.$

### 11. One-Way ANOVA
* **Source & Target**:
  - `Dependent List`: Variabel Scale kontinu.
  - `Factor`: Variabel kategori pengelompokan ($k \ge 2$).
* **Sub-Dialog `[ Post Hoc... ]`**:
  - Equal Variances Assumed: `[x] Tukey`, `[ ] Bonferroni`, `[ ] Scheffe`, `[ ] LSD`, `[ ] Duncan`.
  - Equal Variances Not Assumed: `[ ] Tamhane's T2`, `[ ] Dunnett's T3`, `[ ] Games-Howell`.
* **Sub-Dialog `[ Options... ]`**: `[x] Descriptive`, `[x] Homogeneity of variance test` (Levene), `[ ] Brown-Forsythe`, `[ ] Welch`, `[ ] Means plot`.
* **Output Tables**:
  1. *Descriptives Table*: $N$, Mean, SD, SE, 95% CI, Min, Max per kelompok faktor.
  2. *Test of Homogeneity of Variances*: Levene Statistic ($df1, df2, p$).
  3. *ANOVA Table*: Sum of Squares, $df$, Mean Square, $F, Sig.$ (Between Groups, Within Groups, Total).
  4. *Multiple Comparisons Table (Post Hoc)*: Perbandingan berpasangan $(I - J)$ dengan Mean Difference, Std. Error, $Sig.$, dan 95% CI.

### 12. Reliability Analysis (Uji Reliabilitas Instrumen)
* **Source & Target**: 2 atau lebih item pertanyaan/indikator kuesioner dipindahkan ke `Items`.
* **Model Dropdown**: `Alpha` (Cronbach's Alpha), `Split-half`, `Guttman`, `Parallel`, `Strict parallel`.
* **Sub-Dialog `[ Statistics... ]`**:
  - Descriptives for: `[x] Item`, `[x] Scale`, `[x] Scale if item deleted`.
  - Inter-Item: `[x] Correlations`, `[ ] Covariances`.
  - Summaries: `[ ] Means`, `[ ] Variances`.
* **Output Tables**:
  1. *Case Processing Summary*: Jumlah kasus valid dan excluded.
  2. *Reliability Statistics*: Nilai **Cronbach's Alpha** ($\alpha$) dan **N of Items**.
  3. *Item-Total Statistics Table*:
     - Scale Mean if Item Deleted
     - Scale Variance if Item Deleted
     - Corrected Item-Total Correlation ($r_{it}$)
     - Cronbach's Alpha if Item Deleted

### 13. Factor Analysis (Analisis Faktor / PCA)
* **Source & Target**: Sekumpulan variabel Scale dipindahkan ke `Variables`.
* **Sub-Dialog `[ Descriptives... ]`**: `[ ] Initial solution`, `[x] KMO and Bartlett's test of sphericity`, `[ ] Anti-image`.
* **Sub-Dialog `[ Extraction... ]`**: Method: `Principal components`. Extract based on: `(•) Eigenvalues greater than 1` atau `( ) Number of factors`. Display: `[x] Unrotated factor solution`, `[x] Scree plot`.
* **Sub-Dialog `[ Rotation... ]`**: Method: `( ) None`, `(•) Varimax`, `( ) Direct Oblimin`, `( ) Quartimax`, `( ) Promax`. Display: `[x] Rotated solution`, `[ ] Loading plot(s)`.
* **Output Tables**:
  1. *KMO and Bartlett's Test*: Kaiser-Meyer-Olkin Measure of Sampling Adequacy, Bartlett's Approx. Chi-Square, $df, Sig.$
  2. *Communalities*: Nilai Initial dan Extraction per variabel.
  3. *Total Variance Explained Table*: Initial Eigenvalues (Total, % of Variance, Cumulative %), Extraction Sums of Squared Loadings, Rotation Sums of Squared Loadings.
  4. *Scree Plot*: Grafik kurva penurunan Eigenvalue terhadap nomor komponen.
  5. *Rotated Component Matrix Table*: Matriks muatan faktor yang telah dirotasi (*Factor loadings*).

### 14. Binary Logistic Regression
* **Source & Target**:
  - `Dependent`: 1 variabel biner dikotomi (0/1).
  - `Covariates`: 1 atau lebih variabel prediktor numerik/kategori.
  - `Method`: `Enter` / `Forward: LR` / `Backward: LR`.
* **Sub-Dialog `[ Options... ]`**:
  - Statistics and Plots: `[ ] Classification plots`, `[x] Hosmer-Lemeshow goodness-of-fit`, `[ ] Casewise listing of residuals`, `[x] CI for exp(B): 95%`.
* **Output Tables**:
  1. *Case Processing Summary* & *Dependent Variable Encoding* ($0, 1$).
  2. *Block 0: Beginning Block* (Klasifikasi baseline).
  3. *Omnibus Tests of Model Coefficients*: Chi-square, $df, Sig.$
  4. *Model Summary Table*: $-2 \text{ Log likelihood}$, Cox & Snell $R^2$, Nagelkerke $R^2$.
  5. *Hosmer and Lemeshow Test*: Chi-square, $df, Sig.$
  6. *Classification Table*: Persentase akurasi prediksi model (Sensitivity, Specificity, Overall Percentage).
  7. *Variables in the Equation Table*: Kolom $B, \text{S.E.}, \text{Wald}, df, Sig., \text{Exp}(B)$, 95% C.I. for $\text{EXP}(B)$ (Lower, Upper).
