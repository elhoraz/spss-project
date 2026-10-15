import pandas as pd
import numpy as np
from scipy import stats
from typing import List, Dict, Any, Optional

def compute_crosstabs(
    data: List[Dict[str, Any]],
    row_var: str,
    col_var: str,
    display_expected: bool = True,
    display_row_pct: bool = True,
    display_col_pct: bool = True,
    display_total_pct: bool = False,
    chi_square: bool = True,
    phi_cramer: bool = False,
    contingency_coeff: bool = False,
    risk_estimate: bool = False
) -> Dict[str, Any]:
    """
    Computes contingency tables, Chi-Square tests, Symmetric Measures, and Risk Estimates
    matching authentic IBM SPSS Crosstabs layout, completeness, and precision.
    """
    df = pd.DataFrame(data)
    
    if row_var not in df.columns or col_var not in df.columns:
        raise ValueError(f"Variables {row_var} and/or {col_var} not found in dataset.")

    # Drop missing values
    sub_df = df[[row_var, col_var]].dropna()
    sub_df = sub_df[(sub_df[row_var].astype(str).str.strip() != "") & 
                    (sub_df[row_var].astype(str).str.strip() != ".") &
                    (sub_df[col_var].astype(str).str.strip() != "") &
                    (sub_df[col_var].astype(str).str.strip() != ".")]
    
    valid_n = int(len(sub_df))
    total_n = int(len(df))
    missing_n = int(total_n - valid_n)

    # Contingency Table
    contingency = pd.crosstab(sub_df[row_var], sub_df[col_var])
    row_categories = [str(r) for r in contingency.index]
    col_categories = [str(c) for c in contingency.columns]

    # Chi-Square Calculation
    if contingency.size > 0 and contingency.shape[0] > 1 and contingency.shape[1] > 1:
        chi2_stat, p_val, dof, expected = stats.chi2_contingency(contingency.values)
    else:
        chi2_stat, p_val, dof = 0.0, 1.0, 0
        expected = np.zeros_like(contingency.values, dtype=float)
    
    # Likelihood ratio
    try:
        lr_stat, lr_p, _, _ = stats.chi2_contingency(contingency.values, lambda_="log-likelihood")
    except Exception:
        lr_stat, lr_p = None, None

    # Format cell details
    grid_cells = []
    col_totals = contingency.sum(axis=0)
    row_totals = contingency.sum(axis=1)
    grand_total = int(contingency.values.sum())

    for r_idx in range(contingency.shape[0]):
        row_list = []
        for c_idx in range(contingency.shape[1]):
            count = int(contingency.iloc[r_idx, c_idx])
            exp = float(expected[r_idx, c_idx]) if expected.size > 0 else 0.0
            r_tot = float(row_totals.iloc[r_idx])
            c_tot = float(col_totals.iloc[c_idx])
            
            row_pct = (count / r_tot * 100.0) if r_tot > 0 else 0.0
            col_pct = (count / c_tot * 100.0) if c_tot > 0 else 0.0
            tot_pct = (count / grand_total * 100.0) if grand_total > 0 else 0.0

            row_list.append({
                "count": count,
                "expected": round(exp, 1),
                "row_percent": round(row_pct, 1),
                "col_percent": round(col_pct, 1),
                "total_percent": round(tot_pct, 1)
            })
        grid_cells.append(row_list)

    # Chi-Square table rows
    chi_square_rows = [
        {
            "test": "Pearson Chi-Square",
            "value": round(float(chi2_stat), 3),
            "df": int(dof),
            "asymp_sig_2_sided": round(float(p_val), 4)
        }
    ]

    is_2x2 = (contingency.shape == (2, 2))

    # Continuity Correction (Yates) for 2x2
    if is_2x2 and grand_total > 0:
        a = float(contingency.iloc[0, 0])
        b = float(contingency.iloc[0, 1])
        c = float(contingency.iloc[1, 0])
        d = float(contingency.iloc[1, 1])
        num_yates = max(0.0, abs(a * d - b * c) - grand_total / 2.0)
        den_yates = (a + b) * (c + d) * (a + c) * (b + d)
        yates_chi2 = (grand_total * (num_yates ** 2)) / den_yates if den_yates > 0 else 0.0
        yates_sig = float(1.0 - stats.chi2.cdf(yates_chi2, 1)) if yates_chi2 > 0 else 1.0
        chi_square_rows.append({
            "test": "Continuity Correction",
            "value": round(float(yates_chi2), 3),
            "df": 1,
            "asymp_sig_2_sided": round(float(yates_sig), 4)
        })

    # Likelihood Ratio
    if lr_stat is not None and not np.isnan(lr_stat):
        chi_square_rows.append({
            "test": "Likelihood Ratio",
            "value": round(float(lr_stat), 3),
            "df": int(dof),
            "asymp_sig_2_sided": round(float(lr_p), 4)
        })

    # Fisher's Exact Test for 2x2
    if is_2x2:
        try:
            _, p_two = stats.fisher_exact(contingency.values, alternative='two-sided')
            try:
                _, p_greater = stats.fisher_exact(contingency.values, alternative='greater')
                _, p_less = stats.fisher_exact(contingency.values, alternative='less')
                p_one = min(float(p_greater), float(p_less))
            except Exception:
                p_one = float(p_two) / 2.0 if p_two is not None else None
            
            chi_square_rows.append({
                "test": "Fisher's Exact Test",
                "value": None,
                "df": None,
                "asymp_sig_2_sided": None,
                "exact_sig_2_sided": round(float(p_two), 4) if p_two is not None else None,
                "exact_sig_1_sided": round(float(p_one), 4) if p_one is not None else None
            })
        except Exception:
            pass

    # Linear-by-Linear Association
    if contingency.size > 0 and valid_n > 1:
        try:
            r_scores = np.arange(1, contingency.shape[0] + 1)
            c_scores = np.arange(1, contingency.shape[1] + 1)
            expanded_r = []
            expanded_c = []
            for r_i in range(contingency.shape[0]):
                for c_i in range(contingency.shape[1]):
                    cnt = int(contingency.iloc[r_i, c_i])
                    if cnt > 0:
                        expanded_r.extend([r_scores[r_i]] * cnt)
                        expanded_c.extend([c_scores[c_i]] * cnt)
            if len(expanded_r) > 1:
                pearson_r, _ = stats.pearsonr(expanded_r, expanded_c)
                lbl_val = (valid_n - 1) * (pearson_r ** 2) if not np.isnan(pearson_r) else 0.0
                lbl_sig = float(1.0 - stats.chi2.cdf(lbl_val, 1)) if lbl_val > 0 else 1.0
                chi_square_rows.append({
                    "test": "Linear-by-Linear Association",
                    "value": round(float(lbl_val), 3),
                    "df": 1,
                    "asymp_sig_2_sided": round(float(lbl_sig), 4)
                })
        except Exception:
            pass

    # N of Valid Cases
    chi_square_rows.append({
        "test": "N of Valid Cases",
        "value": valid_n,
        "df": None,
        "asymp_sig_2_sided": None
    })

    # Footnotes
    cells_under_5 = int((expected < 5).sum()) if expected.size > 0 else 0
    total_cells = contingency.size
    pct_under_5 = (cells_under_5 / total_cells * 100.0) if total_cells > 0 else 0.0
    min_expected = float(expected.min()) if total_cells > 0 else 0.0
    warning_footnote = f"a. {cells_under_5} cells ({pct_under_5:.1f}%) have expected count less than 5. The minimum expected count is {min_expected:.2f}."
    footnotes = [warning_footnote]
    if is_2x2:
        footnotes.append("b. Computed only for a 2x2 table")

    # Symmetric Measures
    sym_measures = []
    if valid_n > 0:
        phi_val = np.sqrt(chi2_stat / valid_n)
        min_dim = min(contingency.shape[0] - 1, contingency.shape[1] - 1)
        cramer_val = np.sqrt(chi2_stat / (valid_n * min_dim)) if min_dim > 0 else phi_val
        cc_val = np.sqrt(chi2_stat / (chi2_stat + valid_n)) if (chi2_stat + valid_n) > 0 else 0.0
        approx_sig = round(float(p_val), 4)
        sym_measures = [
            {"category": "Nominal by Nominal", "measure": "Phi", "value": round(float(phi_val), 3), "approx_sig": approx_sig},
            {"category": "Nominal by Nominal", "measure": "Cramer's V", "value": round(float(cramer_val), 3), "approx_sig": approx_sig},
            {"category": "Nominal by Nominal", "measure": "Contingency Coefficient", "value": round(float(cc_val), 3), "approx_sig": approx_sig}
        ]

    # Risk Estimates (for 2x2)
    risk_estimates = []
    if is_2x2 and valid_n > 0:
        a = float(contingency.iloc[0, 0])
        b = float(contingency.iloc[0, 1])
        c = float(contingency.iloc[1, 0])
        d = float(contingency.iloc[1, 1])
        if b > 0 and c > 0 and a > 0 and d > 0:
            odds_ratio = (a * d) / (b * c)
            se_ln_or = np.sqrt(1/a + 1/b + 1/c + 1/d)
            ci_lower_or = np.exp(np.log(odds_ratio) - 1.96 * se_ln_or)
            ci_upper_or = np.exp(np.log(odds_ratio) + 1.96 * se_ln_or)
            risk_estimates.append({
                "statistic": f"Odds Ratio for {row_var} ({row_categories[0]} / {row_categories[1]})",
                "value": round(float(odds_ratio), 3),
                "ciLower": round(float(ci_lower_or), 3),
                "ciUpper": round(float(ci_upper_or), 3),
                "lower_95": round(float(ci_lower_or), 3),
                "upper_95": round(float(ci_upper_or), 3)
            })
        # Cohort for col_categories[0]
        p1 = a / (a + b) if (a + b) > 0 else 0
        p2 = c / (c + d) if (c + d) > 0 else 0
        if p2 > 0 and a > 0 and c > 0:
            rr1 = p1 / p2
            se_ln_rr1 = np.sqrt((1 - p1) / a + (1 - p2) / c)
            ci_lower_rr1 = np.exp(np.log(rr1) - 1.96 * se_ln_rr1)
            ci_upper_rr1 = np.exp(np.log(rr1) + 1.96 * se_ln_rr1)
            risk_estimates.append({
                "statistic": f"For cohort {col_var} = {col_categories[0]}",
                "value": round(float(rr1), 3),
                "ciLower": round(float(ci_lower_rr1), 3),
                "ciUpper": round(float(ci_upper_rr1), 3),
                "lower_95": round(float(ci_lower_rr1), 3),
                "upper_95": round(float(ci_upper_rr1), 3)
            })
        # Cohort for col_categories[1]
        q1 = b / (a + b) if (a + b) > 0 else 0
        q2 = d / (c + d) if (c + d) > 0 else 0
        if q2 > 0 and b > 0 and d > 0:
            rr2 = q1 / q2
            se_ln_rr2 = np.sqrt((1 - q1) / b + (1 - q2) / d)
            ci_lower_rr2 = np.exp(np.log(rr2) - 1.96 * se_ln_rr2)
            ci_upper_rr2 = np.exp(np.log(rr2) + 1.96 * se_ln_rr2)
            risk_estimates.append({
                "statistic": f"For cohort {col_var} = {col_categories[1]}",
                "value": round(float(rr2), 3),
                "ciLower": round(float(ci_lower_rr2), 3),
                "ciUpper": round(float(ci_upper_rr2), 3),
                "lower_95": round(float(ci_lower_rr2), 3),
                "upper_95": round(float(ci_upper_rr2), 3)
            })
        risk_estimates.append({
            "statistic": "N of Valid Cases",
            "value": valid_n,
            "ciLower": None,
            "ciUpper": None,
            "lower_95": None,
            "upper_95": None
        })

    return {
        "title": f"{row_var} * {col_var} Crosstabulation",
        "type": "crosstabs",
        "row_var": row_var,
        "col_var": col_var,
        "case_summary": {
            "valid": valid_n,
            "valid_n": valid_n,
            "valid_percent": round((valid_n / total_n * 100.0), 1) if total_n > 0 else 0.0,
            "missing": missing_n,
            "missing_n": missing_n,
            "missing_percent": round((missing_n / total_n * 100.0), 1) if total_n > 0 else 0.0,
            "total": total_n,
            "total_n": total_n,
            "total_percent": 100.0
        },
        "row_categories": row_categories,
        "col_categories": col_categories,
        "cells": grid_cells,
        "row_totals": [int(x) for x in row_totals],
        "col_totals": [int(x) for x in col_totals],
        "grand_total": int(grand_total),
        "chi_square_tests": chi_square_rows,
        "chi_square_footnote": warning_footnote,
        "chi_square_footnotes": footnotes,
        "symmetric_measures": sym_measures if (phi_cramer or contingency_coeff or len(sym_measures) > 0) else None,
        "risk_estimates": risk_estimates if len(risk_estimates) > 0 else None
    }
