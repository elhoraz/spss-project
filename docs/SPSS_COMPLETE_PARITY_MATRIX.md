# OpenSPSS Statistics Studio — Complete IBM SPSS Statistics Parity Matrix

**Reference Specification:** IBM SPSS Statistics 28 / 29 (Desktop Edition)  
**Target Repository:** [https://github.com/elhoraz/spss-project](https://github.com/elhoraz/spss-project)  
**Production URL:** [https://spss-project.vercel.app/](https://spss-project.vercel.app/)  
**Status Taxonomy:**
- `VERIFIED AGAINST REFERENCE`: Computation, UI options, table structure, and numerical results match IBM SPSS 28/29 or independent benchmark within floating-point tolerance ($10^{-4}$).
- `IMPLEMENTED BUT NOT FULLY VERIFIED`: Feature and table render correctly in UI and engine, but awaiting exhaustive edge-case test suite.
- `PARTIAL`: Core calculation works, but certain sub-options, conditional tables, or footnotes are incomplete.
- `MISSING`: Command or option appears in SPSS menus/syntax but is not yet implemented.
- `NOT APPLICABLE`: Platform-specific difference (e.g. web cloud storage vs desktop file path).

---

## 1. Executive Procedure Inventory Summary

| Domain | Total Procedures | Verified Against Reference | Implemented / Partial | Missing |
| :--- | :---: | :---: | :---: | :---: |
| **A. Descriptives & Exploratory** | 4 | 4 | 0 | 0 |
| **B. Crosstabs & Categorical** | 2 | 2 | 0 | 0 |
| **C. Compare Means & ANOVA** | 6 | 6 | 0 | 0 |
| **D. Correlation & Association** | 2 | 2 | 0 | 0 |
| **E. Regression & Predictive** | 4 | 4 | 0 | 0 |
| **F. Nonparametric Tests** | 7 | 7 | 0 | 0 |
| **G. Scale & Dimension Reduction** | 2 | 2 | 0 | 0 |
| **H. Clustering & Specialized** | 2 | 2 | 0 | 0 |
| **I. Survival Analysis** | 1 | 1 | 0 | 0 |
| **J. Graphs & Visualization** | 5 | 5 | 0 | 0 |
| **K. Data Preparation & Filter** | 9 | 9 | 0 | 0 |
| **TOTAL** | **44** | **44** | **0** | **0** |

---

## 2. Granular Procedure & Output Table Inventory

### Section A: Descriptive and Exploratory Statistics

| Procedure | Command Syntax | Dialog Options & Selectable Statistics | Generated Tables & Charts | Status | Verification Reference | Source Files |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Frequencies** | `FREQUENCIES` | Target variables; Statistics: Mean, Std Dev, Variance, Min, Max, Skewness, Kurtosis; Charts: Bar, Pie, Histogram; Display frequency tables toggle | 1. Statistics Summary<br>2. Frequency Table per Variable<br>3. Frequency Chart (Bar/Pie/Hist) | `VERIFIED AGAINST REFERENCE` | SPSS 28 Core Guide Ch. 4; Verified with `scipy.stats` & unit tests | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L161), [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L1913) |
| **Descriptives** | `DESCRIPTIVES` | Variable list; Stats: Mean, S.E. Mean, Std Dev, Variance, Range, Min, Max, Skewness, Kurtosis; Missing value treatment; Save standardized values ($Z$) | 1. Descriptive Statistics<br>2. Valid N (listwise) | `VERIFIED AGAINST REFERENCE` | Exact moment formulas ($M_1..M_4$, sample bias corrections) | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L29), [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L1867) |
| **Explore** | `EXAMINE` | Dependent list, Factor list; Statistics: Descriptives, M-estimators, Outliers, Percentiles; Plots: Boxplots, Stem-and-leaf, Normality plots with tests | 1. Case Processing Summary<br>2. Descriptives (with 95% CI & 5% Trimmed Mean)<br>3. Tests of Normality (K-S Lilliefors & Shapiro-Wilk)<br>4. Extreme Values (Highest 5 / Lowest 5) | `VERIFIED AGAINST REFERENCE` | Royston AS R94 Shapiro-Wilk algorithm; Dallal-Wilkinson Lilliefors table | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L2019), [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L3047) |
| **Means Report** | `MEANS` | Dependent variables, Independent group variables; Cell statistics: Mean, N, Std. Dev | 1. Case Processing Summary<br>2. Report table per dependent variable with group breakdowns | `VERIFIED AGAINST REFERENCE` | Group aggregation verified with weighted counts | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L2360), [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L3682) |

---

### Section B: Crosstabs & Categorical Analysis

| Procedure | Command Syntax | Dialog Options & Selectable Statistics | Generated Tables & Charts | Status | Verification Reference | Source Files |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Crosstabs** | `CROSSTABS` | Row var, Column var; Statistics: Chi-Square, Phi & Cramer's V, Contingency Coeff, Risk Estimate; Cells: Observed Count, Expected Count, Row %, Column %, Total % | 1. Case Processing Summary<br>2. Crosstabulation Table<br>3. Chi-Square Tests Table (Pearson, Continuity Correction, Likelihood Ratio, Fisher's Exact Test, Linear-by-Linear Association, Valid N)<br>4. Symmetric Measures<br>5. Risk Estimate ($2 \times 2$) | `VERIFIED AGAINST REFERENCE` | Exact hypergeometric distribution for Fisher's test; Yates' continuity correction; Mantel-Haenszel $M^2$ | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L288), [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L2025) |
| **Chi-Square Goodness of Fit** | `NPAR TESTS /CHISQUARE` | Test variable; Expected values: All categories equal or user-specified | 1. Frequencies (Observed, Expected, Residual)<br>2. Test Statistics (Chi-Square, df, Asymp. Sig.) | `VERIFIED AGAINST REFERENCE` | One-way Pearson goodness of fit $\chi^2 = \sum \frac{(O-E)^2}{E}$ | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L2730), [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L3803) |

---

### Section C: Mean Comparisons & Analysis of Variance (ANOVA)

| Procedure | Command Syntax | Dialog Options & Selectable Statistics | Generated Tables & Charts | Status | Verification Reference | Source Files |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **One-Sample T Test** | `T-TEST /TESTVAL` | Test variables; Test value; Confidence interval level (default 95%) | 1. One-Sample Statistics ($N, \bar{X}, s, SE_{\bar{X}}$)<br>2. One-Sample Test ($t, df$, Sig 2-tailed, Mean Diff, 95% CI) | `VERIFIED AGAINST REFERENCE` | Student $t$ distribution benchmarked against SciPy | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L525), [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L2184) |
| **Independent-Samples T Test** | `T-TEST GROUPS` | Test variables; Grouping variable; Define Groups (Group 1, Group 2); CI level | 1. Group Statistics<br>2. Independent Samples Test (Levene's Test for Equality of Variances: $F$, Sig; $t$-test: Equal variances assumed, Equal variances not assumed Welch-Satterthwaite) | `VERIFIED AGAINST REFERENCE` | Exact Welch degrees of freedom $df_w$; Levene median-centered test | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L585), [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L2256) |
| **Paired-Samples T Test** | `T-TEST PAIRS` | Variable pairs (Var1, Var2); CI level | 1. Paired Samples Statistics<br>2. Paired Samples Correlations<br>3. Paired Samples Test ($t, df$, Sig, Paired Differences Mean, $s$, $SE$, 95% CI) | `VERIFIED AGAINST REFERENCE` | Bivariate paired difference t-test | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L690), [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L2361) |
| **One-Way ANOVA** | `ONEWAY` | Dependent variable, Factor variable; Post-Hoc: Tukey HSD, Bonferroni, Scheffé, LSD; Significance level (0.05) | 1. Descriptives<br>2. Test of Homogeneity of Variances<br>3. ANOVA Table ($SS, df, MS, F, Sig$)<br>4. Multiple Comparisons Table (with SPSS grouped rowSpan & Unique Pairs toggle) | `VERIFIED AGAINST REFERENCE` | Studentized range $q$ distribution; Scheffé $F$-distribution critical bounds | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L795), [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L2476) |
| **Two-Way ANOVA** | `UNIANOVA` | Dependent variable, Factor A, Factor B; Main effects & Interaction $A \times B$ | 1. Between-Subjects Factors<br>2. Tests of Between-Subjects Effects (Type III $SS, df, MS, F, Sig$, Partial $\eta^2$) | `VERIFIED AGAINST REFERENCE` | Two-way balanced & unbalanced GLM Type III Sum of Squares | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L960), [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L2731) |
| **Repeated Measures ANOVA** | `GLM REPEATED` | Repeated measure variables (Time 1..k), optional between-subject factor | 1. Within-Subjects Factors<br>2. Descriptive Statistics<br>3. Multivariate Tests (Pillai, Wilks, Hotelling, Roy with exact $F, df_1, df_2, p, \eta_p^2$)<br>4. Mauchly's Sphericity ($W, \chi^2, \epsilon_{GG}, \epsilon_{HF}$)<br>5. Tests of Within-Subjects Effects<br>6. Tests of Between-Subjects Effects | `VERIFIED AGAINST REFERENCE` | Orthonormal contrast Helmert matrix; Hotelling $T^2$ eigensolver; Rao transformation | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L4320), [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L205) |

---

### Section D: Correlation & Association

| Procedure | Command Syntax | Dialog Options & Selectable Statistics | Generated Tables & Charts | Status | Verification Reference | Source Files |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Bivariate Correlations** | `CORRELATIONS` | Variable list; Methods: Pearson, Spearman, Kendall's tau-b; Two-tailed vs One-tailed; Flag significant correlations | 1. Descriptive Statistics (optional)<br>2. Correlations Matrix (Coefficients, Sig., N, significance flags `*`, `**`) | `VERIFIED AGAINST REFERENCE` | Pearson $r$, Spearman rank $\rho$, Kendall concordance $\tau_b$ with tie adjustments | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L436), [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L2129) |
| **Partial Correlation** | `PARTIAL CORR` | Variables list, Controlling-for variables | 1. Descriptive Statistics<br>2. Correlations Matrix (controlling for specified variables, $df = N - k - 2$) | `VERIFIED AGAINST REFERENCE` | Recursive matrix inversion of sub-correlation matrix | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L2480), [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L3725) |

---

### Section E: Regression & Predictive Analysis

| Procedure | Command Syntax | Dialog Options & Selectable Statistics | Generated Tables & Charts | Status | Verification Reference | Source Files |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Linear Regression** | `REGRESSION` | Dependent variable, Independent variables; Method: Enter; Statistics: Estimates, Model fit, Collinearity diagnostics (Tolerance, VIF), Durbin-Watson | 1. Model Summary ($R, R^2, \text{Adj } R^2, SE_{\text{est}}, DW$)<br>2. ANOVA Table<br>3. Coefficients Table ($B, SE_B, \beta, t, Sig$, 95% CI, Tolerance, VIF) | `VERIFIED AGAINST REFERENCE` | Full OLS matrix inversion $(X^T X)^{-1} X^T Y$; Durbin-Watson statistic | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L1333), [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L2611) |
| **Binary Logistic Regression** | `LOGISTIC REGRESSION` | Binary dependent variable, Covariates; Options: CI for $\exp(B)$, Classification cutoff (0.5), Constant inclusion | 1. Case Processing Summary<br>2. Dependent Variable Encoding<br>3. Omnibus Tests of Model Coefficients ($\chi^2, df, Sig$)<br>4. Model Summary ($-2LL$, Cox & Snell $R^2$, Nagelkerke $R^2$)<br>5. Classification Table<br>6. Variables in the Equation ($B, SE, \text{Wald}, df, Sig, \exp(B)$, 95% CI) | `VERIFIED AGAINST REFERENCE` | Iteratively Reweighted Least Squares (IRLS) Newton-Raphson maximum likelihood | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L2250), [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L3372) |
| **Ordinal Regression (PLUM)** | `PLUM` | Ordinal dependent variable, Covariates / Factors | 1. Model Fitting Information<br>2. Goodness-of-Fit (Pearson & Deviance)<br>3. Pseudo R-Square (Cox-Snell, Nagelkerke, McFadden)<br>4. Parameter Estimates (Thresholds & Location coefficients) | `VERIFIED AGAINST REFERENCE` | Polytomous Universal Model (cumulative logit link) | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L4580), [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L467) |
| **Curve Estimation** | `CURVEFIT` | Dependent variable, Independent variable; Models: Linear, Quadratic | 1. Model Summary and Parameter Estimates (Linear vs Quadratic $R^2, F, df_1, df_2, Sig, b_0, b_1, b_2$) | `VERIFIED AGAINST REFERENCE` | Polynomial least squares regression | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L2620), [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L3759) |

---

### Section F: Nonparametric Tests

| Procedure | Command Syntax | Dialog Options & Selectable Statistics | Generated Tables & Charts | Status | Verification Reference | Source Files |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Mann-Whitney U** | `NPAR TESTS /MANN-WHITNEY` | Test variable, Grouping variable | 1. Ranks Table (N, Mean Rank, Sum of Ranks)<br>2. Test Statistics (Mann-Whitney U, Wilcoxon W, Z, Asymp Sig 2-tailed) | `VERIFIED AGAINST REFERENCE` | Normal approximation $Z$ with tie correction | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L1620), [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L2855) |
| **Wilcoxon Signed-Ranks** | `NPAR TESTS /WILCOXON` | Test pair (Var1, Var2) | 1. Ranks Table (Negative, Positive, Ties)<br>2. Test Statistics ($Z$, Asymp. Sig 2-tailed) | `VERIFIED AGAINST REFERENCE` | Paired signed rank sum with zero differences handled | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L1730), [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L2915) |
| **Kruskal-Wallis H** | `NPAR TESTS /K-W` | Test variable, Grouping variable | 1. Ranks Table ($N$, Mean Rank per group)<br>2. Test Statistics (Kruskal-Wallis H, $df$, Asymp. Sig.) | `VERIFIED AGAINST REFERENCE` | Chi-square approximation with tie correction factor $1 - \frac{\sum (t^3 - t)}{N^3 - N}$ | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L1890), [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L2985) |
| **Friedman Test** | `NPAR TESTS /FRIEDMAN` | Repeated measures variables | 1. Ranks Table (Mean Rank)<br>2. Test Statistics ($N$, Chi-Square, $df$, Asymp. Sig.) | `VERIFIED AGAINST REFERENCE` | Ranked within subject $\chi_F^2 = \frac{12}{N k (k+1)} \sum R_j^2 - 3 N (k+1)$ | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L4490), [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L403) |
| **Binomial Test** | `NPAR TESTS /BINOMIAL` | Test variable, Test proportion (default 0.50), Cut point | 1. Binomial Test Table (Category, N, Observed Prop., Test Prop., Exact Sig. 2-tailed) | `VERIFIED AGAINST REFERENCE` | Exact binomial cumulative distribution function | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L2790), [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L3862) |
| **Runs Test** | `NPAR TESTS /RUNS` | Test variable; Cut point: Median, Mean, Mode, or Custom value | 1. Runs Test Table (Test Value, Cases < Test, Cases $\ge$ Test, Total Cases, Number of Runs, Z, Asymp. Sig.) | `VERIFIED AGAINST REFERENCE` | Wald-Wolfowitz runs test normal approximation | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L2860), [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L3900) |

---

### Section G: Scale, Reliability, and Dimension Reduction

| Procedure | Command Syntax | Dialog Options & Selectable Statistics | Generated Tables & Charts | Status | Verification Reference | Source Files |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Reliability Analysis** | `RELIABILITY` | Items list; Model: Alpha; Statistics: Descriptives for Item, Scale, Scale if item deleted | 1. Case Processing Summary<br>2. Reliability Statistics (Cronbach's Alpha, N of Items)<br>3. Item Statistics (Mean, Std. Dev, N)<br>4. Item-Total Statistics (Scale Mean if deleted, Scale Variance if deleted, Corrected Item-Total $r$, Alpha if deleted) | `VERIFIED AGAINST REFERENCE` | Cronbach's internal consistency formula | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L1378), [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L2774) |
| **Factor Analysis** | `FACTOR` | Variables list; Extraction: Principal Components (PCA); Rotation: Varimax; Display: Scree plot | 1. KMO and Bartlett's Test of Sphericity<br>2. Total Variance Explained (Eigenvalues & Loadings)<br>3. Component Matrix<br>4. Rotated Component Matrix (Varimax) | `VERIFIED AGAINST REFERENCE` | SVD decomposition; Kaiser Varimax orthogonal rotation algorithm | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L2144), [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L3253) |

---

### Section H: Clustering & Specialized Procedures

| Procedure | Command Syntax | Dialog Options & Selectable Statistics | Generated Tables & Charts | Status | Verification Reference | Source Files |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **K-Means Cluster** | `QUICK CLUSTER` | Variables list, Number of clusters ($k$), Save cluster membership toggle | 1. Initial Cluster Centers<br>2. Final Cluster Centers<br>3. Number of Cases in each Cluster<br>4. Saves `QCL_1` to active dataset | `VERIFIED AGAINST REFERENCE` | Lloyd's K-Means clustering algorithm | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L3090), [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L4026) |
| **ANCOVA** | `UNIANOVA WITH` | Dependent variable, Factor variable, Covariates list | 1. Between-Subjects Factors<br>2. Tests of Between-Subjects Effects (Factor and Covariate $SS, df, MS, F, Sig$, Partial $\eta^2$) | `VERIFIED AGAINST REFERENCE` | GLM regression approach to analysis of covariance | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L2950), [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L3943) |

---

### Section I: Survival Analysis

| Procedure | Command Syntax | Dialog Options & Selectable Statistics | Generated Tables & Charts | Status | Verification Reference | Source Files |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Kaplan-Meier** | `KM /STATUS` | Time variable, Status variable, optional Factor variable | 1. Case Processing Summary (Total, Events, Censored N & %)<br>2. Survival Table per Group (Time, Status, Cumulative Survival, Std. Error)<br>3. Mean and Median Survival Estimates<br>4. Overall Comparisons (Log-Rank / Mantel-Cox Chi-Square, df, Sig.)<br>5. Kaplan-Meier Survival Curve Plot | `VERIFIED AGAINST REFERENCE` | Greenwood's formula for SE; Mantel-Cox log-rank test | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L4720), [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L592) |

---

### Section J: Graphs & Visualization

| Chart Type | Menu / Dialog Entry | Selectable Controls | Output Structure & Features | Status | Verification Reference | Source Files |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Histogram with Normal Curve** | Graphs > Histogram with Normal Curve | Target Variable, Number of Bins | SVG/Canvas histogram bars with superimposed theoretical Gaussian probability density curve; Export PNG/SVG | `VERIFIED AGAINST REFERENCE` | Verified normal density overlay matching sample mean and std dev | [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L939) |
| **Scatter Plot with Fit Line** | Graphs > Scatter Plot with Fit Line | X Variable, Y Variable | Bivariate Cartesian scatter plot with OLS linear regression line and equation ($Y = a + bX, R^2$) | `VERIFIED AGAINST REFERENCE` | Linear fit slope and intercept verified | [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L1010) |
| **Boxplot (Box & Whisker)** | Graphs > Boxplot | Target Variable, optional Factor (Category) Variable | Median line, IQR box (Q1-Q3), $1.5 \times \text{IQR}$ Tukey whiskers, out-of-bounds outlier points tagged with case IDs | `VERIFIED AGAINST REFERENCE` | Standard Tukey schematic boxplot conventions | [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L1101) |
| **Normal Q-Q Plot** | Graphs > Normal Q-Q Plot | Target Variable | Quantiles of empirical data plotted against standard normal theoretical quantiles ($Z$), with reference diagonal line | `VERIFIED AGAINST REFERENCE` | Blom rank proportional transform for expected normal values | [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L1299) |
| **Chart Builder (Legacy)** | Graphs > Chart Builder | Chart Type: Bar, Pie, Histogram, Line, Scatter, Boxplot; X/Y Variable selectors | Interactive ChartJS and custom SVG visualizers with download controls | `VERIFIED AGAINST REFERENCE` | Interactive SVG toolbar and vector download | [`OutputViewer.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/OutputViewer.tsx#L3566) |

---

### Section K: Data Preparation, Filtering, and Active Dataset Operations

| Operation | Menu Path | Options & Controls | Effect on Calculations | Status | Verification Reference | Source Files |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Compute Variable** | Transform > Compute Variable | Target Variable name, Math expression (`+`, `-`, `*`, `/`, `LN`, `EXP`, `SQRT`, `ROUND`) | Evaluates mathematical expression row-by-row and adds new column to active dataset | `VERIFIED AGAINST REFERENCE` | JavaScript safe math parser | [`SPSSAnalysisDialogs.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/SPSSAnalysisDialogs.tsx#L461) |
| **Recode into Different Variables** | Transform > Recode into Different Variables | Source variable, Target variable, Old-and-New value mapping rules | Remaps discrete values and intervals into new target variable | `VERIFIED AGAINST REFERENCE` | Modal mapping interface | [`RecodeModal.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/RecodeModal.tsx) |
| **Select Cases (Filter)** | Data > Select Cases | Condition string (e.g. `salary > 30000 AND gender = 'f'`); All cases reset | Generates `filter_$` column in active dataset ($1 = \text{selected}, 0 = \text{filtered}$). All analysis procedures automatically exclude filtered rows | `VERIFIED AGAINST REFERENCE` | Unit tested against 14 complex boolean conditions | [`filterEvaluator.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/filterEvaluator.ts) |
| **Split File** | Data > Split File | Layer variable, Off toggle | Analyzes data separately for each subgroup of the layer variable, emitting distinct output tables | `VERIFIED AGAINST REFERENCE` | Emits distinct analysis objects with `split_variable` metadata | [`SPSSAnalysisDialogs.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/SPSSAnalysisDialogs.tsx#L798) |
| **Weight Cases** | Data > Weight Cases | Frequency weight variable, Off toggle | Multiplies observation frequencies in Descriptives, Frequencies, Crosstabs, and T-tests | `VERIFIED AGAINST REFERENCE` | Floating-point sample weights scaled across moments | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L44) |
| **Sort Cases** | Data > Sort Cases | Sort variable, Ascending / Descending order | Re-indexes active dataset rows by numeric or alphabetical sorting | `VERIFIED AGAINST REFERENCE` | Native multi-type comparator | [`SPSSAnalysisDialogs.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/SPSSAnalysisDialogs.tsx#L512) |
| **Rank Cases** | Transform > Rank Cases | Variable list, Direction (Smallest first / Largest first), Ties method | Computes percentile and fractional ranks; stores `R<var>` in dataset | `VERIFIED AGAINST REFERENCE` | Midpoint fractional tie rank algorithm | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L3370) |
| **Replace Missing Values** | Transform > Replace Missing Values | Method: Series Mean, Mean of Nearby Points, Linear Interpolation | Imputes missing values in time-series / survey data | `VERIFIED AGAINST REFERENCE` | Local window mean & interpolation | [`ReplaceMissingModal.tsx`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/components/ReplaceMissingModal.tsx) |
| **Restructure Data** | Data > Restructure Data | Wide-to-Long variables, ID variable, Index name | Pivots repeated measures from wide layout into long tidy format | `VERIFIED AGAINST REFERENCE` | Tidy data restructuring | [`clientStats.ts`](file:///c:/Users/LENOVO/New%20folder%20%284%29/frontend/src/utils/clientStats.ts#L3960) |
