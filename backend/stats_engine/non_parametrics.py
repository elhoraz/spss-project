import pandas as pd
import numpy as np
from scipy import stats
from typing import List, Dict, Any

def compute_mann_whitney_u(data: List[Dict[str, Any]], test_var: str, group_var: str) -> Dict[str, Any]:
    """
    Computes Mann-Whitney U Test for 2 independent groups matching SPSS NPAR TESTS.
    """
    df = pd.DataFrame(data)
    if test_var not in df.columns or group_var not in df.columns:
        raise ValueError(f"Variables {test_var} and/or {group_var} not found.")

    sub_df = df[[test_var, group_var]].dropna().copy()
    sub_df[test_var] = pd.to_numeric(sub_df[test_var], errors='coerce')
    sub_df = sub_df.dropna()

    groups = sub_df[group_var].unique()
    if len(groups) < 2:
        raise ValueError("Mann-Whitney U requires at least 2 distinct groups.")

    g1_val, g2_val = groups[0], groups[1]
    d1 = sub_df[sub_df[group_var] == g1_val][test_var].values
    d2 = sub_df[sub_df[group_var] == g2_val][test_var].values

    n1 = len(d1)
    n2 = len(d2)

    res = stats.mannwhitneyu(d1, d2, alternative='two-sided')
    u_stat = float(np.ravel(res.statistic)[0])
    p_val = float(np.ravel(res.pvalue)[0])

    # Mean Ranks calculation
    sub_df['rank'] = sub_df[test_var].rank()
    mean_rank1 = float(sub_df[sub_df[group_var] == g1_val]['rank'].mean())
    mean_rank2 = float(sub_df[sub_df[group_var] == g2_val]['rank'].mean())
    sum_rank1 = float(sub_df[sub_df[group_var] == g1_val]['rank'].sum())
    sum_rank2 = float(sub_df[sub_df[group_var] == g2_val]['rank'].sum())

    # Z-score approximation
    mean_u = n1 * n2 / 2.0
    sigma_u = np.sqrt(n1 * n2 * (n1 + n2 + 1) / 12.0)
    z_val = (u_stat - mean_u) / sigma_u if sigma_u > 0 else 0.0

    return {
        "title": "Mann-Whitney Test",
        "type": "mann_whitney",
        "test_variable": test_var,
        "group_variable": group_var,
        "ranks": [
            {"group": str(g1_val), "n": n1, "mean_rank": round(mean_rank1, 2), "sum_of_ranks": round(sum_rank1, 2)},
            {"group": str(g2_val), "n": n2, "mean_rank": round(mean_rank2, 2), "sum_of_ranks": round(sum_rank2, 2)},
            {"group": "Total", "n": n1 + n2, "mean_rank": None, "sum_of_ranks": None}
        ],
        "test_statistics": {
            "mann_whitney_u": round(u_stat, 3),
            "wilcoxon_w": round(min(sum_rank1, sum_rank2), 3),
            "z": round(float(z_val), 3),
            "asymp_sig_2_tailed": round(p_val, 4)
        }
    }

def compute_wilcoxon_signed_rank(data: List[Dict[str, Any]], var1: str, var2: str) -> Dict[str, Any]:
    """
    Computes Wilcoxon Signed-Rank Test for 2 related samples.
    """
    df = pd.DataFrame(data)
    sub = df[[var1, var2]].dropna().copy()
    sub[var1] = pd.to_numeric(sub[var1], errors='coerce')
    sub[var2] = pd.to_numeric(sub[var2], errors='coerce')
    sub = sub.dropna()

    res = stats.wilcoxon(sub[var1], sub[var2], alternative='two-sided')
    w_stat = float(np.ravel(res.statistic)[0])
    p_val = float(np.ravel(res.pvalue)[0])

    diff = sub[var1] - sub[var2]
    neg_ranks = (diff < 0).sum()
    pos_ranks = (diff > 0).sum()
    ties = (diff == 0).sum()

    return {
        "title": "Wilcoxon Signed Ranks Test",
        "type": "wilcoxon",
        "pairs": f"{var1} - {var2}",
        "ranks_summary": {
            "negative_ranks_n": int(neg_ranks),
            "positive_ranks_n": int(pos_ranks),
            "ties_n": int(ties),
            "total_n": len(sub)
        },
        "test_statistics": {
            "w": round(w_stat, 3),
            "asymp_sig_2_tailed": round(p_val, 4)
        }
    }

def compute_kruskal_wallis(data: List[Dict[str, Any]], test_var: str, group_var: str) -> Dict[str, Any]:
    """
    Computes Kruskal-Wallis H Test for k independent samples.
    """
    df = pd.DataFrame(data)
    sub = df[[test_var, group_var]].dropna().copy()
    sub[test_var] = pd.to_numeric(sub[test_var], errors='coerce')
    sub = sub.dropna()

    groups = sub.groupby(group_var)
    group_arrays = [grp[test_var].values for _, grp in groups]

    if len(group_arrays) < 2:
        raise ValueError("Kruskal-Wallis requires at least 2 groups.")

    h_res = stats.kruskal(*group_arrays)
    h_stat = float(np.ravel(h_res.statistic)[0])
    p_val = float(np.ravel(h_res.pvalue)[0])
    df_val = len(group_arrays) - 1

    sub['rank'] = sub[test_var].rank()
    ranks = []
    for name, grp in sub.groupby(group_var):
        ranks.append({
            "group": str(name),
            "n": len(grp),
            "mean_rank": round(float(grp['rank'].mean()), 2)
        })

    return {
        "title": "Kruskal-Wallis Test",
        "type": "kruskal_wallis",
        "test_variable": test_var,
        "group_variable": group_var,
        "ranks": ranks,
        "test_statistics": {
            "kruskal_wallis_h": round(h_stat, 3),
            "df": df_val,
            "asymp_sig": round(p_val, 4)
        }
    }
