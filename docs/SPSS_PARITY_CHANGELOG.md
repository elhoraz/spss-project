# OpenSPSS Statistics Studio — IBM SPSS Parity Changelog & Audit Log

This document tracks all audit findings, defects identified, corrective implementations, automated regression tests, and verification milestones during the complete IBM SPSS Statistics parity audit.

---

## Audit Milestone 1: Baseline Inspection & Architecture Analysis
- **Date:** October 15, 2026
- **Scope:** Complete repository inspection of frontend dialogs, calculation engines, output tables, outline navigation, and export utilities.
- **Key Findings:**
  1. **Crosstabs Dialog Disconnection:** In `SPSSAnalysisDialogs.tsx`, clicking "Statistics..." opened the Frequencies statistics subdialog (Mean, Median, Skewness, Kurtosis) instead of Crosstabs statistics (Chi-Square, Phi/Cramer's V, Contingency Coefficient, Risk Estimate).
  2. **Crosstabs Missing Statistics:** In `clientStats.ts`, `clientComputeCrosstabs` lacked:
     - Fisher's Exact Test ($2 \times 2$) 2-sided and 1-sided exact significance.
     - Linear-by-Linear Association test statistic.
     - Standard SPSS cell count warning footnote (`a. N cells (X.X%) have expected count less than 5...`).
     - Symmetric Measures table (Phi, Cramer's V, Contingency Coefficient).
     - Risk Estimate table for $2 \times 2$ epidemiological data (Odds Ratio, Cohort Relative Risk with 95% CIs).
  3. **Crosstabs Missing Case Processing Summary:** `data.case_summary` was computed by the engine but never rendered in `OutputViewer.tsx`.
  4. **Crosstabs Cell Display Options Ignored:** Dialog checkboxes for Expected Count, Row %, Column %, Total % were hardcoded in the viewer rather than dynamically controlled.
  5. **Bivariate Correlations Dialog:** Lacked option checkboxes for Spearman's rho and Kendall's tau-b, and two-tailed vs one-tailed test selection.
  6. **Explore Navigation Outline:** Lacked explicit outline nodes in `generateNavigationNodes(item)` in `OutputViewer.tsx`.
  7. **Excel Export Incomplete:** Excel export module in `exportUtils.ts` omitted Chi-Square Tests and Symmetric Measures for Crosstabs, and omitted individual sub-tables for Explore, Reliability, and Factor Analysis.

---

## Audit Milestone 2: Crosstabs & Chi-Square Parity Implementation
- **Changes Implemented:**
  - Added dedicated Crosstabs Statistics subdialog in `SPSSAnalysisDialogs.tsx` (`chiSquare`, `phiCramer`, `contingencyCoeff`, `riskEstimate`).
  - Added Crosstabs Cells subdialog in `SPSSAnalysisDialogs.tsx` (`observed`, `expected`, `rowPct`, `colPct`, `totalPct`).
  - Passed `crosstabsOptions` from dialog into `clientComputeCrosstabs`.
  - Implemented exact Fisher's Exact Test ($2 \times 2$), Linear-by-Linear Association, expected cell count warning footnotes, Symmetric Measures, and Risk Estimates in `clientStats.ts` and `statsMath.ts`.
  - Rendered Case Processing Summary, dynamic cell displays, expanded Chi-Square Tests table, Symmetric Measures, and Risk Estimates in `OutputViewer.tsx`.
  - Added dedicated Excel export worksheets for Crosstabs, Chi-Square Tests, and Symmetric Measures in `exportUtils.ts`.

---

## Audit Milestone 3: Bivariate Correlations & Nonparametric Parity Implementation
- **Scope:** Bivariate Correlations dialog, mathematical engine, Output Viewer pivot tables, and multi-sheet exports.
- **Defects Discovered & Resolved:**
  - `DEF-CORR-001`: Dialog only performed Pearson correlation; Spearman's $\rho$ and Kendall's $\tau_b$ checkboxes were missing. Added options dialog and state in `SPSSAnalysisDialogs.tsx`.
  - `DEF-CORR-002`: Output viewer only displayed Pearson correlation matrix. Updated `OutputViewer.tsx` to conditionally render Pearson table and SPSS-compliant Nonparametric Correlations table (`Kendall's tau_b` and `Spearman's rho` blocks) when selected.
  - `DEF-CORR-003`: Excel export utility in `exportUtils.ts` had duplicate correlation export blocks and ignored nonparametric correlations. Unified export into clean `Correlations_N` and `Nonpar_Corr_N` sheets.
  - `DEF-STATS-001`: Implemented `computeSpearmanCorrelation` and `computeKendallTauB` with tie-adjusted fractional ranks and asymptotic significance matching IBM SPSS.
  - `DEF-NAV-001`: Added hierarchical navigation outline nodes `table-correlations` and `table-nonpar-correlations`.
- **Automated Regression Suite:**
  - Test suite in `frontend/tests/spss_parity.test.ts` executes 71 tests across 23 suites covering Crosstabs, Fisher exact, Yates continuity, Likelihood ratio, Linear-by-linear, Symmetric measures, Risk estimates, Spearman rho, Kendall tau-b, and multi-table Excel exports.
  - **Result:** 71 passed, 0 failed (100% pass rate).
- **Production Build:**
  - `npm run build` executed and verified clean bundle output (`dist/assets/index-*.js`, 0 TypeScript errors).

