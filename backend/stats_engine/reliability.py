import pandas as pd
import numpy as np
from typing import List, Dict, Any

def compute_cronbach_alpha(data: List[Dict[str, Any]], items: List[str]) -> Dict[str, Any]:
    """
    Computes Cronbach's Alpha Reliability Analysis and Item-Total Statistics
    matching SPSS Reliability output format.
    """
    df = pd.DataFrame(data)
    valid_items = [col for col in items if col in df.columns]

    if len(valid_items) < 2:
        raise ValueError("Reliability analysis requires at least 2 items.")

    sub_df = pd.DataFrame()
    for col in valid_items:
        sub_df[col] = pd.to_numeric(df[col], errors='coerce')
    sub_df = sub_df.dropna()

    n_cases = len(sub_df)
    k = len(valid_items)

    if n_cases < 3:
        raise ValueError(f"Not enough valid cases ({n_cases}) for reliability analysis.")

    # Variance of individual items
    item_variances = sub_df.var(axis=0, ddof=1)
    sum_item_variances = float(item_variances.sum())

    # Total score variance
    total_scores = sub_df.sum(axis=1)
    total_variance = float(total_scores.var(ddof=1))

    # Cronbach's Alpha formula
    if total_variance > 0:
        alpha = (k / (k - 1)) * (1 - (sum_item_variances / total_variance))
    else:
        alpha = 0.0

    # Item-Total Statistics
    item_total_stats = []
    for item in valid_items:
        # Scale with item deleted
        del_sub = sub_df.drop(columns=[item])
        del_sum = del_sub.sum(axis=1)
        del_mean = float(del_sum.mean())
        del_var = float(del_sum.var(ddof=1))

        # Item-total correlation
        item_vals = sub_df[item]
        corr = float(item_vals.corr(del_sum))

        # Alpha if item deleted
        del_k = k - 1
        if del_k >= 2 and del_var > 0:
            del_sum_var = float(del_sub.var(axis=0, ddof=1).sum())
            del_alpha = (del_k / (del_k - 1)) * (1 - (del_sum_var / del_var))
        else:
            del_alpha = 0.0

        item_total_stats.append({
            "item": item,
            "scale_mean_if_deleted": round(del_mean, 4),
            "scale_variance_if_deleted": round(del_var, 4),
            "corrected_item_total_correlation": round(corr, 4) if not np.isnan(corr) else 0.0,
            "cronbach_alpha_if_deleted": round(del_alpha, 4) if not np.isnan(del_alpha) else 0.0
        })

    return {
        "title": "Reliability Statistics",
        "type": "reliability",
        "items": valid_items,
        "n_cases": n_cases,
        "n_items": k,
        "cronbach_alpha": round(float(alpha), 4),
        "scale_mean": round(float(total_scores.mean()), 4),
        "scale_variance": round(total_variance, 4),
        "item_total_statistics": item_total_stats
    }
