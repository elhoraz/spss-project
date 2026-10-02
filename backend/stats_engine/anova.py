import pandas as pd
import numpy as np
from scipy import stats
from typing import List, Dict, Any, Optional

def compute_one_way_anova(data: List[Dict[str, Any]], dep_var: str, factor_var: str, run_post_hoc: bool = True) -> Dict[str, Any]:
    """
    Computes One-Way ANOVA with Group Descriptives and Tukey HSD Post-Hoc Comparisons.
    """
    df = pd.DataFrame(data)
    if dep_var not in df.columns or factor_var not in df.columns:
        raise ValueError(f"Variables {dep_var} and/or {factor_var} not found.")

    sub_df = df[[dep_var, factor_var]].dropna().copy()
    sub_df[dep_var] = pd.to_numeric(sub_df[dep_var], errors='coerce')
    sub_df = sub_df.dropna()

    groups = sub_df.groupby(factor_var)
    group_names = [str(k) for k in groups.groups.keys()]

    # Descriptives
    descriptives = []
    group_data_list = []

    for name, grp in groups:
        vals = grp[dep_var].values
        n = len(vals)
        if n < 2:
            continue
        group_data_list.append(vals)
        m = float(np.mean(vals))
        s = float(np.std(vals, ddof=1))
        se = float(s / np.sqrt(n))
        crit = stats.t.ppf(0.975, df=n-1)
        ci_lower = m - crit * se
        ci_upper = m + crit * se
        min_v = float(np.min(vals))
        max_v = float(np.max(vals))

        descriptives.append({
            "group": str(name),
            "n": n,
            "mean": round(m, 4),
            "std_dev": round(s, 4),
            "se_mean": round(se, 4),
            "ci_lower": round(ci_lower, 4),
            "ci_upper": round(ci_upper, 4),
            "min": round(min_v, 4),
            "max": round(max_v, 4)
        })

    # Overall total
    all_vals = sub_df[dep_var].values
    tot_n = len(all_vals)
    tot_m = float(np.mean(all_vals))
    tot_s = float(np.std(all_vals, ddof=1))
    tot_se = float(tot_s / np.sqrt(tot_n))
    tot_crit = stats.t.ppf(0.975, df=tot_n-1)

    descriptives.append({
        "group": "Total",
        "n": tot_n,
        "mean": round(tot_m, 4),
        "std_dev": round(tot_s, 4),
        "se_mean": round(tot_se, 4),
        "ci_lower": round(tot_m - tot_crit * tot_se, 4),
        "ci_upper": round(tot_m + tot_crit * tot_se, 4),
        "min": round(float(np.min(all_vals)), 4),
        "max": round(float(np.max(all_vals)), 4)
    })

    # ANOVA calculation
    k = len(group_data_list)
    if k < 2:
        raise ValueError("ANOVA requires at least 2 valid groups.")

    f_res = stats.f_oneway(*group_data_list)
    f_stat = float(np.squeeze(f_res.statistic))
    p_val = float(np.squeeze(f_res.pvalue))

    # Sum of Squares
    ss_total = float(np.sum((all_vals - tot_m)**2))
    df_total = tot_n - 1

    ss_between = float(sum(len(grp) * (np.mean(grp) - tot_m)**2 for grp in group_data_list))
    df_between = k - 1
    ms_between = ss_between / df_between if df_between > 0 else 0.0

    ss_within = float(sum(np.sum((grp - np.mean(grp))**2) for grp in group_data_list))
    df_within = tot_n - k
    ms_within = ss_within / df_within if df_within > 0 else 0.0

    anova_table = {
        "between_groups": {
            "sum_of_squares": round(ss_between, 3),
            "df": df_between,
            "mean_square": round(ms_between, 3),
            "f": round(f_stat, 3),
            "sig": round(p_val, 4)
        },
        "within_groups": {
            "sum_of_squares": round(ss_within, 3),
            "df": df_within,
            "mean_square": round(ms_within, 3)
        },
        "total": {
            "sum_of_squares": round(ss_total, 3),
            "df": df_total
        }
    }

    # Post-Hoc Tukey HSD
    post_hoc_rows = []
    if run_post_hoc and k >= 2 and df_within > 0:
        try:
            from statsmodels.stats.multicomp import pairwise_tukeyhsd
            tukey = pairwise_tukeyhsd(endog=sub_df[dep_var], groups=sub_df[factor_var].astype(str), alpha=0.05)
            for row in tukey.summary().data[1:]:
                # group1, group2, meandiff, p-adj, lower, upper, reject
                g1, g2, meandiff, padj, lower, upper, reject = row
                # Calculate standard error: sqrt(ms_within * (1/n1 + 1/n2))
                n1 = len(sub_df[sub_df[factor_var].astype(str) == str(g1)])
                n2 = len(sub_df[sub_df[factor_var].astype(str) == str(g2)])
                se_pair = np.sqrt(ms_within * (1/n1 + 1/n2))

                post_hoc_rows.append({
                    "group_i": str(g1),
                    "group_j": str(g2),
                    "mean_diff": round(float(meandiff), 4),
                    "se": round(float(se_pair), 4),
                    "sig": round(float(padj), 4),
                    "ci_lower": round(float(lower), 4),
                    "ci_upper": round(float(upper), 4),
                    "significant": bool(reject)
                })
        except Exception:
            # Fallback simple pairwise t-test with Bonferroni
            for i in range(k):
                for j in range(i+1, k):
                    g1_name = group_names[i]
                    g2_name = group_names[j]
                    vals1 = group_data_list[i]
                    vals2 = group_data_list[j]
                    diff = float(np.mean(vals1) - np.mean(vals2))
                    n1, n2 = len(vals1), len(vals2)
                    se_pair = np.sqrt(ms_within * (1/n1 + 1/n2))
                    t_val = diff / se_pair if se_pair > 0 else 0
                    p_val_pair = min(1.0, float(2 * (1 - stats.t.cdf(abs(t_val), df=df_within)) * (k * (k-1) / 2)))
                    crit = stats.t.ppf(0.975, df=df_within)

                    post_hoc_rows.append({
                        "group_i": g1_name,
                        "group_j": g2_name,
                        "mean_diff": round(diff, 4),
                        "se": round(float(se_pair), 4),
                        "sig": round(p_val_pair, 4),
                        "ci_lower": round(diff - crit * se_pair, 4),
                        "ci_upper": round(diff + crit * se_pair, 4),
                        "significant": p_val_pair < 0.05
                    })

    return {
        "title": f"One-Way ANOVA: {dep_var} by {factor_var}",
        "type": "one_way_anova",
        "dependent_variable": dep_var,
        "factor_variable": factor_var,
        "descriptives": descriptives,
        "anova_table": anova_table,
        "post_hoc": post_hoc_rows
    }

def compute_two_way_anova(data: List[Dict[str, Any]], dep_var: str, factor_a: str, factor_b: str) -> Dict[str, Any]:
    """
    Computes Two-Way ANOVA (Factorial ANOVA) with main effects and interaction.
    """
    import statsmodels.api as sm
    from statsmodels.formula.api import ols

    df = pd.DataFrame(data)
    if dep_var not in df.columns or factor_a not in df.columns or factor_b not in df.columns:
        raise ValueError("Variables not found in dataset.")

    sub_df = df[[dep_var, factor_a, factor_b]].dropna().copy()
    sub_df[dep_var] = pd.to_numeric(sub_df[dep_var], errors='coerce')
    sub_df = sub_df.dropna()

    formula = f"Q('{dep_var}') ~ C(Q('{factor_a}')) + C(Q('{factor_b}')) + C(Q('{factor_a}')):C(Q('{factor_b}'))"
    model = ols(formula, data=sub_df).fit()
    anova_tbl = sm.stats.anova_lm(model, typ=3)

    effects = []
    for idx, row in anova_tbl.iterrows():
        source_name = str(idx)
        if "Intercept" in source_name:
            source_name = "Intercept"
        elif f"C(Q('{factor_a}')):" in source_name or f":C(Q('{factor_b}'))" in source_name:
            source_name = f"{factor_a} * {factor_b}"
        elif f"C(Q('{factor_a}'))" in source_name:
            source_name = factor_a
        elif f"C(Q('{factor_b}'))" in source_name:
            source_name = factor_b
        elif "Residual" in source_name:
            source_name = "Error"

        ss = float(row['sum_sq']) if not np.isnan(row['sum_sq']) else 0.0
        df_val = int(row['df']) if not np.isnan(row['df']) else 0
        ms = float(ss / df_val) if df_val > 0 else None
        f_val = float(row['F']) if 'F' in row and not np.isnan(row['F']) else None
        sig_val = float(row['PR(>F)']) if 'PR(>F)' in row and not np.isnan(row['PR(>F)']) else None

        effects.append({
            "source": source_name,
            "sum_of_squares": round(ss, 3),
            "df": df_val,
            "mean_square": round(ms, 3) if ms is not None else None,
            "f": round(f_val, 3) if f_val is not None else None,
            "sig": round(sig_val, 4) if sig_val is not None else None
        })

    return {
        "title": f"Two-Way ANOVA: {dep_var} by {factor_a} and {factor_b}",
        "type": "two_way_anova",
        "dependent_variable": dep_var,
        "factor_a": factor_a,
        "factor_b": factor_b,
        "between_subjects_effects": effects
    }

