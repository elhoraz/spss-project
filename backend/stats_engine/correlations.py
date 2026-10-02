import pandas as pd
import numpy as np
from scipy import stats
from typing import List, Dict, Any

def compute_correlations(data: List[Dict[str, Any]], variables: List[str], method: str = "pearson") -> Dict[str, Any]:
    """
    Computes bivariate correlation matrix with 2-tailed significance and sample sizes.
    Supported methods: 'pearson', 'spearman', 'kendall'.
    """
    df = pd.DataFrame(data)
    valid_vars = [v for v in variables if v in df.columns]

    # Convert columns to numeric
    num_df = pd.DataFrame()
    for v in valid_vars:
        num_df[v] = pd.to_numeric(df[v], errors='coerce')

    matrix = []

    for v1 in valid_vars:
        row_entries = []
        for v2 in valid_vars:
            pair = num_df[[v1, v2]].dropna()
            n = len(pair)

            if n < 3:
                row_entries.append({
                    "var1": v1,
                    "var2": v2,
                    "coefficient": 1.0 if v1 == v2 else None,
                    "sig_2_tailed": None,
                    "n": n,
                    "flag": ""
                })
                continue

            x = np.asarray(pair[v1], dtype=np.float64)
            y = np.asarray(pair[v2], dtype=np.float64)

            if method == "spearman":
                res = stats.spearmanr(x, y)
            elif method == "kendall":
                res = stats.kendalltau(x, y)
            else:  # pearson
                res = stats.pearsonr(x, y)

            coef = float(np.ravel(res.statistic)[0])
            pval = float(np.ravel(res.pvalue)[0])

            flag = ""
            if pval < 0.01 and v1 != v2:
                flag = "**"
            elif pval < 0.05 and v1 != v2:
                flag = "*"

            row_entries.append({
                "var1": v1,
                "var2": v2,
                "coefficient": round(coef, 3) if not np.isnan(coef) else None,
                "sig_2_tailed": round(pval, 4) if not np.isnan(pval) else None,
                "n": n,
                "flag": flag
            })
        matrix.append({
            "variable": v1,
            "correlations": row_entries
        })

    method_labels = {
        "pearson": "Pearson Correlation",
        "spearman": "Spearman's rho",
        "kendall": "Kendall's tau_b"
    }

    return {
        "title": "Correlations",
        "type": "correlations",
        "method": method,
        "method_label": method_labels.get(method, "Pearson Correlation"),
        "variables": valid_vars,
        "matrix": matrix,
        "notes": [
            "** Correlation is significant at the 0.01 level (2-tailed).",
            "* Correlation is significant at the 0.05 level (2-tailed)."
        ]
    }
