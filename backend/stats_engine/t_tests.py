import pandas as pd
import numpy as np
from scipy import stats
from typing import List, Dict, Any, Optional

def compute_one_sample_t_test(data: List[Dict[str, Any]], variables: List[str], test_value: float = 0.0) -> Dict[str, Any]:
    """
    Computes One-Sample T Test matching SPSS output format.
    """
    df = pd.DataFrame(data)
    stats_rows = []
    test_rows = []

    for var in variables:
        if var not in df.columns:
            continue
        series = pd.to_numeric(df[var], errors='coerce').dropna()
        n = len(series)
        if n < 2:
            continue

        mean = float(series.mean())
        std = float(series.std(ddof=1))
        se = float(std / np.sqrt(n))

        t_res = stats.ttest_1samp(series, test_value)
        t_stat = float(np.squeeze(t_res.statistic))
        df_val = n - 1
        p_val = float(np.squeeze(t_res.pvalue))
        mean_diff = mean - test_value

        # 95% Confidence Interval of Difference
        t_crit = stats.t.ppf(0.975, df=df_val)
        ci_lower = mean_diff - t_crit * se
        ci_upper = mean_diff + t_crit * se

        stats_rows.append({
            "variable": var,
            "n": n,
            "mean": round(mean, 4),
            "std_dev": round(std, 4),
            "se_mean": round(se, 4)
        })

        test_rows.append({
            "variable": var,
            "test_value": test_value,
            "t": round(t_stat, 3),
            "df": df_val,
            "sig_2_tailed": round(p_val, 4),
            "mean_difference": round(mean_diff, 4),
            "ci_lower": round(ci_lower, 4),
            "ci_upper": round(ci_upper, 4)
        })

    return {
        "title": "One-Sample T-Test",
        "type": "one_sample_t_test",
        "test_value": test_value,
        "descriptives": stats_rows,
        "test_results": test_rows
    }


def compute_independent_t_test(data: List[Dict[str, Any]], test_vars: List[str], group_var: str, group1_val: Any = None, group2_val: Any = None) -> Dict[str, Any]:
    """
    Computes Independent Samples T-Test with Levene's test for equality of variances and Welch's t-test.
    """
    df = pd.DataFrame(data)
    if group_var not in df.columns:
        raise ValueError(f"Grouping variable {group_var} not found.")

    # Determine group values if not provided
    unique_groups = df[group_var].dropna().unique()
    if group1_val is None or group2_val is None:
        if len(unique_groups) < 2:
            raise ValueError(f"Grouping variable {group_var} must have at least 2 distinct values.")
        group1_val, group2_val = unique_groups[0], unique_groups[1]

    sub_df = df[df[group_var].isin([group1_val, group2_val])].copy()

    group_stats = []
    test_results = []

    for var in test_vars:
        if var not in sub_df.columns:
            continue

        g1 = pd.to_numeric(sub_df[sub_df[group_var] == group1_val][var], errors='coerce').dropna()
        g2 = pd.to_numeric(sub_df[sub_df[group_var] == group2_val][var], errors='coerce').dropna()

        n1, n2 = len(g1), len(g2)
        if n1 < 2 or n2 < 2:
            continue

        m1, m2 = float(g1.mean()), float(g2.mean())
        s1, s2 = float(g1.std(ddof=1)), float(g2.std(ddof=1))
        se1, se2 = float(s1 / np.sqrt(n1)), float(s2 / np.sqrt(n2))

        group_stats.extend([
            {"variable": var, "group": str(group1_val), "n": n1, "mean": round(m1, 4), "std_dev": round(s1, 4), "se_mean": round(se1, 4)},
            {"variable": var, "group": str(group2_val), "n": n2, "mean": round(m2, 4), "std_dev": round(s2, 4), "se_mean": round(se2, 4)}
        ])

        # Levene's Test
        levene_stat, levene_p = stats.levene(g1, g2)
        levene_f = float(np.squeeze(levene_stat))
        levene_sig = float(np.squeeze(levene_p))

        # Equal Variances Assumed (Student's t-test)
        sp2 = (((n1 - 1) * s1**2) + ((n2 - 1) * s2**2)) / (n1 + n2 - 2)
        se_diff_equal = np.sqrt(sp2 * (1/n1 + 1/n2))
        df_equal = n1 + n2 - 2
        t_equal = (m1 - m2) / se_diff_equal if se_diff_equal > 0 else 0.0
        p_equal = float(np.squeeze(2 * (1 - stats.t.cdf(abs(t_equal), df=df_equal))))
        crit_equal = stats.t.ppf(0.975, df=df_equal)
        ci_lower_equal = (m1 - m2) - crit_equal * se_diff_equal
        ci_upper_equal = (m1 - m2) + crit_equal * se_diff_equal

        # Equal Variances Not Assumed (Welch's t-test)
        welch_res = stats.ttest_ind(g1, g2, equal_var=False)
        t_welch = float(np.squeeze(welch_res.statistic))
        p_welch = float(np.squeeze(welch_res.pvalue))
        # Welch-Satterthwaite df
        df_welch = float(np.squeeze(((s1**2/n1 + s2**2/n2)**2) / ((s1**2/n1)**2 / (n1 - 1) + (s2**2/n2)**2 / (n2 - 1))))
        se_diff_welch = np.sqrt(s1**2/n1 + s2**2/n2)
        crit_welch = stats.t.ppf(0.975, df=df_welch)
        ci_lower_welch = (m1 - m2) - crit_welch * se_diff_welch
        ci_upper_welch = (m1 - m2) + crit_welch * se_diff_welch

        test_results.append({
            "variable": var,
            "levene_f": round(levene_f, 3),
            "levene_sig": round(levene_sig, 4),
            "equal_var_assumed": {
                "t": round(t_equal, 3),
                "df": df_equal,
                "sig_2_tailed": round(p_equal, 4),
                "mean_diff": round(m1 - m2, 4),
                "se_diff": round(se_diff_equal, 4),
                "ci_lower": round(ci_lower_equal, 4),
                "ci_upper": round(ci_upper_equal, 4)
            },
            "equal_var_not_assumed": {
                "t": round(t_welch, 3),
                "df": round(df_welch, 3),
                "sig_2_tailed": round(p_welch, 4),
                "mean_diff": round(m1 - m2, 4),
                "se_diff": round(se_diff_welch, 4),
                "ci_lower": round(ci_lower_welch, 4),
                "ci_upper": round(ci_upper_welch, 4)
            }
        })

    return {
        "title": "Independent Samples T-Test",
        "type": "independent_t_test",
        "group_variable": group_var,
        "group1": str(group1_val),
        "group2": str(group2_val),
        "group_statistics": group_stats,
        "test_results": test_results
    }


def compute_paired_t_test(data: List[Dict[str, Any]], pairs: List[List[str]]) -> Dict[str, Any]:
    """
    Computes Paired Samples T-Test. Each pair is [var1, var2].
    """
    df = pd.DataFrame(data)
    paired_stats = []
    paired_corrs = []
    paired_diffs = []

    for idx, (v1, v2) in enumerate(pairs):
        if v1 not in df.columns or v2 not in df.columns:
            continue
        sub = df[[v1, v2]].copy()
        sub[v1] = pd.to_numeric(sub[v1], errors='coerce')
        sub[v2] = pd.to_numeric(sub[v2], errors='coerce')
        sub = sub.dropna()

        n = len(sub)
        if n < 2:
            continue

        m1, m2 = float(sub[v1].mean()), float(sub[v2].mean())
        s1, s2 = float(sub[v1].std(ddof=1)), float(sub[v2].std(ddof=1))
        se1, se2 = float(s1 / np.sqrt(n)), float(s2 / np.sqrt(n))

        pair_label = f"Pair {idx+1}: {v1} - {v2}"

        paired_stats.extend([
            {"pair": pair_label, "variable": v1, "mean": round(m1, 4), "n": n, "std_dev": round(s1, 4), "se_mean": round(se1, 4)},
            {"pair": pair_label, "variable": v2, "mean": round(m2, 4), "n": n, "std_dev": round(s2, 4), "se_mean": round(se2, 4)}
        ])

        # Correlation
        corr_r, corr_p = stats.pearsonr(sub[v1], sub[v2])
        paired_corrs.append({
            "pair": pair_label,
            "n": n,
            "correlation": round(float(np.squeeze(corr_r)), 3),
            "sig": round(float(np.squeeze(corr_p)), 4)
        })

        # Paired Difference
        diff = sub[v1] - sub[v2]
        m_diff = float(diff.mean())
        s_diff = float(diff.std(ddof=1))
        se_diff = float(s_diff / np.sqrt(n))
        df_val = n - 1

        t_res = stats.ttest_rel(sub[v1], sub[v2])
        t_stat = float(np.squeeze(t_res.statistic))
        p_val = float(np.squeeze(t_res.pvalue))

        crit = stats.t.ppf(0.975, df=df_val)
        ci_lower = m_diff - crit * se_diff
        ci_upper = m_diff + crit * se_diff

        paired_diffs.append({
            "pair": pair_label,
            "mean": round(m_diff, 4),
            "std_dev": round(s_diff, 4),
            "se_mean": round(se_diff, 4),
            "ci_lower": round(ci_lower, 4),
            "ci_upper": round(ci_upper, 4),
            "t": round(t_stat, 3),
            "df": df_val,
            "sig_2_tailed": round(p_val, 4)
        })

    return {
        "title": "Paired Samples T-Test",
        "type": "paired_t_test",
        "paired_statistics": paired_stats,
        "paired_correlations": paired_corrs,
        "paired_differences": paired_diffs
    }
