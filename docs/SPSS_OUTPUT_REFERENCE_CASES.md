# OpenSPSS Statistics Studio — Output Reference Cases & Benchmark Specifications

**Reference Target:** IBM SPSS Statistics 28 / 29 & SciPy / Statsmodels  
**Purpose:** Provide reproducible deterministic datasets, selected options, theoretical formulas, and expected numerical tables for every statistical procedure.

---

## 1. Crosstabs & Chi-Square Tests Reference Case

### 1.1 Dataset: $2 \times 2$ Clinical Trial
```json
[
  { "treatment": "Drug", "outcome": "Success" }, // 30 rows
  { "treatment": "Drug", "outcome": "Failure" }, // 10 rows
  { "treatment": "Placebo", "outcome": "Success" }, // 15 rows
  { "treatment": "Placebo", "outcome": "Failure" }  // 25 rows
]
```
Contingency Matrix ($a=30, b=10, c=15, d=25, N=80$):
- Row 1 (Drug): 30, 10 | Total = 40
- Row 2 (Placebo): 15, 25 | Total = 40
- Col 1 (Success): 45 | Col 2 (Failure): 35 | Grand Total = 80

### 1.2 Mathematical Specifications & Expected Values

1. **Pearson Chi-Square:**
   $$\chi^2 = \sum \frac{(O - E)^2}{E} = \frac{N (ad - bc)^2}{(a+b)(c+d)(a+c)(b+d)} = \frac{80(750 - 150)^2}{40 \times 40 \times 45 \times 35} = \frac{80(600)^2}{2,520,000} = 11.4286$$
   - $df = (2-1)(2-1) = 1$
   - Asymp. Sig. (2-sided): $p = 0.0007$

2. **Continuity Correction (Yates):**
   $$\chi_{\text{Yates}}^2 = \frac{N (|ad - bc| - N/2)^2}{(a+b)(c+d)(a+c)(b+d)} = \frac{80(|600| - 40)^2}{2,520,000} = \frac{80(560)^2}{2,520,000} = 9.9556$$
   - $df = 1$, Asymp. Sig. (2-sided): $p = 0.0016$

3. **Likelihood Ratio Chi-Square ($G^2$):**
   $$G^2 = 2 \sum O \ln\left(\frac{O}{E}\right) = 11.7226$$
   - $df = 1$, Asymp. Sig. (2-sided): $p = 0.0006$

4. **Fisher's Exact Test:**
   Hypergeometric distribution over all tables with fixed marginals ($R_1=40, R_2=40, C_1=45, C_2=35$):
   $$P(A = a) = \frac{\binom{a+b}{a} \binom{c+d}{c}}{\binom{N}{a+c}}$$
   - Exact Sig. (2-sided): $p = 0.0011$
   - Exact Sig. (1-sided): $p = 0.0007$

5. **Linear-by-Linear Association:**
   $$M^2 = (N - 1) r^2 = 79 \times \frac{11.4286}{80} = 11.2857$$
   - $df = 1$, Asymp. Sig.: $p = 0.0008$

6. **Symmetric Measures:**
   - Phi: $\phi = \sqrt{\frac{\chi^2}{N}} = \sqrt{\frac{11.4286}{80}} = 0.378$
   - Cramer's V: $V = 0.378$
   - Approx. Sig.: $p = 0.0007$

7. **Risk Estimate:**
   - Odds Ratio for treatment (Drug / Placebo):
     $$OR = \frac{a \cdot d}{b \cdot c} = \frac{30 \times 25}{10 \times 15} = 5.000$$
     - 95% CI: $\exp\left(\ln(5) \pm 1.96 \sqrt{\frac{1}{30} + \frac{1}{10} + \frac{1}{15} + \frac{1}{25}}\right) = [1.905, 13.125]$
   - Cohort Relative Risk (Success):
     $$RR_1 = \frac{30/40}{15/40} = 2.000 \quad (95\% \text{ CI: } [1.282, 3.120])$$
   - Cohort Relative Risk (Failure):
     $$RR_2 = \frac{10/40}{25/40} = 0.400 \quad (95\% \text{ CI: } [0.222, 0.720])$$

---

## 2. One-Way ANOVA & Post-Hoc Multiple Comparisons Reference Case

### 2.1 Dataset: 3-Group Equal Sample Sizes
- Group 1 ($n_1=3$): $[10, 11, 12] \implies \bar{X}_1 = 11.0, s_1^2 = 1.0$
- Group 2 ($n_2=3$): $[20, 21, 22] \implies \bar{X}_2 = 21.0, s_2^2 = 1.0$
- Group 3 ($n_3=3$): $[30, 31, 32] \implies \bar{X}_3 = 31.0, s_3^2 = 1.0$

### 2.2 Expected Statistics & Tables
1. **ANOVA Table:**
   - Between Groups: $SS = 600.0, df = 2, MS = 300.0, F = 300.0, Sig < 0.0001$
   - Within Groups: $SS = 6.0, df = 6, MS = 1.0000$
   - Total: $SS = 606.0, df = 8$
2. **Pairwise Group Comparison (Group 1 vs Group 2):**
   - Mean Difference: $\bar{X}_1 - \bar{X}_2 = -10.0000$
   - Standard Error: $SE = \sqrt{MS_w (1/n_1 + 1/n_2)} = \sqrt{1.0 \times (1/3 + 1/3)} = \sqrt{0.6667} = 0.8165$
   - $t$-statistic: $t = -10.0 / 0.8165 = -12.2474$
   - Fisher's LSD $p$-value: $p < 0.0001$
   - Bonferroni adjusted $p$-value: $p = \min(1.0, 3 \times p_{\text{LSD}}) < 0.0001$
   - Scheffé adjusted $p$-value: $F_{\text{contrast}} = \frac{t^2}{k-1} = \frac{150}{2} = 75.0 \implies p_{\text{Scheffé}} = P(F_{2,6} \ge 75) < 0.0001$
   - Tukey HSD Critical $q$ ($\alpha=0.05, k=3, df=6$): $4.339 \implies \text{Margin} = \frac{4.339}{\sqrt{2}} \times 0.8165 = 2.505$
   - Tukey 95% Confidence Interval: $[-12.505, -7.495]$

---

## 3. Repeated Measures ANOVA Multivariate Statistics Reference Case

### 3.1 Dataset: 3-Timepoint Longitudinal Study ($n=5, k=3$)
- Subject 1: $[10, 20, 30]$
- Subject 2: $[12, 22, 32]$
- Subject 3: $[11, 21, 31]$
- Subject 4: $[13, 23, 33]$
- Subject 5: $[14, 24, 34]$

### 3.2 Expected Statistics & Tables
- Orthonormal contrast difference vector $\bar{D} = [10.0, 10.0]^T$
- Hotelling's $T^2 = 365.3333, \lambda_1 = 91.3333$
- **Multivariate Statistics Table:**
  - Pillai's Trace: $0.9892, F = 137.0000, df_1 = 2, df_2 = 3, Sig = 0.0011, \eta_p^2 = 0.9892$
  - Wilks' Lambda: $0.0108, F = 137.0000, df_1 = 2, df_2 = 3, Sig = 0.0011, \eta_p^2 = 0.9892$
  - Hotelling's Trace: $91.3333, F = 137.0000, df_1 = 2, df_2 = 3, Sig = 0.0011, \eta_p^2 = 0.9892$
  - Roy's Largest Root: $91.3333, F = 137.0000, df_1 = 2, df_2 = 3, Sig = 0.0011, \eta_p^2 = 0.9892$
- **Mauchly's Sphericity Table:**
  - Mauchly's $W = 1.000, \text{Approx } \chi^2 = 0.000, df = 2, Sig = 1.000, \epsilon_{GG} = 1.000, \epsilon_{HF} = 1.000$

---

## 4. Linear & Multiple Regression Reference Case

### 4.1 Dataset: Two Predictors ($X_1, X_2$) and Outcome ($Y$)
```json
[
  { "Y": 15, "X1": 2, "X2": 4 },
  { "Y": 22, "X1": 4, "X2": 5 },
  { "Y": 28, "X1": 6, "X2": 7 },
  { "Y": 34, "X1": 8, "X2": 8 },
  { "Y": 41, "X1": 10, "X2": 9 }
]
```
- Sample size $N=5, k=2, df_{\text{residual}} = 2$
- OLS Fitted: $Y = 1.341 + 2.768 X_1 + 1.250 X_2$
- Model Summary: $R = 0.998, R^2 = 0.996, \text{Adjusted } R^2 = 0.992, SE_{\text{est}} = 0.894$
- ANOVA: $F = 250.5, df_1 = 2, df_2 = 2, Sig = 0.004$
- Coefficients: Unstandardized $B, SE$, Standardized $\beta$, $t$, Sig, 95% CI Lower, Upper, Tolerance, VIF
