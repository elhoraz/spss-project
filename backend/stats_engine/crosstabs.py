import pandas as pd
import numpy as np
from scipy import stats
from typing import List, Dict, Any

def compute_crosstabs(data: List[Dict[str, Any]], row_var: str, col_var: str, display_expected: bool = True, display_row_pct: bool = True, display_col_pct: bool = True) -> Dict[str, Any]:
    """
    Computes contingency tables and Chi-Square tests in authentic SPSS Crosstabs format.
    """
    df = pd.DataFrame(data)
    
    if row_var not in df.columns or col_var not in df.columns:
        raise ValueError(f"Variables {row_var} and/or {col_var} not found in dataset.")

    # Drop missing
    sub_df = df[[row_var, col_var]].dropna()
    sub_df = sub_df[(sub_df[row_var].astype(str).str.strip() != "") & (sub_df[col_var].astype(str).str.strip() != "")]
    
    valid_n = len(sub_df)
    total_n = len(df)
    missing_n = total_n - valid_n

    # Contingency Table
    contingency = pd.crosstab(sub_df[row_var], sub_df[col_var])
    row_categories = [str(r) for r in contingency.index]
    col_categories = [str(c) for c in contingency.columns]

    # Chi-Square Calculation
    chi2_stat, p_val, dof, expected = stats.chi2_contingency(contingency.values)
    
    # Likelihood ratio
    try:
        lr_stat, lr_p, _, _ = stats.chi2_contingency(contingency.values, lambda_="log-likelihood")
    except Exception:
        lr_stat, lr_p = None, None

    # Format cell details
    grid_cells = []
    col_totals = contingency.sum(axis=0)
    row_totals = contingency.sum(axis=1)
    grand_total = contingency.values.sum()

    for r_idx, r_val in enumerate(contingency.index):
        row_list = []
        for c_idx, c_val in enumerate(contingency.columns):
            count = int(contingency.iloc[r_idx, c_idx])
            exp = float(expected[r_idx, c_idx])
            r_tot = float(row_totals.iloc[r_idx])
            c_tot = float(col_totals.iloc[c_idx])
            
            row_pct = (count / r_tot * 100) if r_tot > 0 else 0.0
            col_pct = (count / c_tot * 100) if c_tot > 0 else 0.0
            tot_pct = (count / grand_total * 100) if grand_total > 0 else 0.0

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
    if lr_stat is not None and not np.isnan(lr_stat):
        chi_square_rows.append({
            "test": "Likelihood Ratio",
            "value": round(float(lr_stat), 3),
            "df": int(dof),
            "asymp_sig_2_sided": round(float(lr_p), 4)
        })
    chi_square_rows.append({
        "test": "N of Valid Cases",
        "value": valid_n,
        "df": None,
        "asymp_sig_2_sided": None
    })

    return {
        "title": f"{row_var} * {col_var} Crosstabulation",
        "type": "crosstabs",
        "row_var": row_var,
        "col_var": col_var,
        "case_summary": {
            "valid_n": valid_n,
            "valid_percent": round((valid_n / total_n * 100), 1) if total_n > 0 else 0,
            "missing_n": missing_n,
            "missing_percent": round((missing_n / total_n * 100), 1) if total_n > 0 else 0,
            "total_n": total_n
        },
        "row_categories": row_categories,
        "col_categories": col_categories,
        "cells": grid_cells,
        "row_totals": [int(x) for x in row_totals],
        "col_totals": [int(x) for x in col_totals],
        "grand_total": int(grand_total),
        "chi_square_tests": chi_square_rows
    }
