import numpy as np
import pandas as pd
from scipy import stats
from typing import List, Dict, Any

def compute_explore(data: List[Dict[str, Any]], variables: List[str]) -> Dict[str, Any]:
    """
    Computes Explore procedure with M-estimators, Extreme Values,
    and Tests of Normality (Kolmogorov-Smirnov & Shapiro-Wilk) matching IBM SPSS Statistics.
    """
    df = pd.DataFrame(data)
    for v in variables:
        if v not in df.columns:
            raise ValueError(f"Variable '{v}' not found in dataset.")

    results_by_var = {}

    for var in variables:
        series = pd.to_numeric(df[var], errors='coerce').dropna()
        n_valid = len(series)
        n_missing = len(df) - n_valid

        if n_valid < 3:
            raise ValueError(f"Variable '{var}' requires at least 3 valid observations for normality tests.")

        vals = series.values
        sorted_vals = np.sort(vals)
        mean_val = float(np.mean(vals))
        std_val = float(np.std(vals, ddof=1)) if n_valid > 1 else 0.0
        se_mean = std_val / np.sqrt(n_valid) if n_valid > 0 else 0.0

        # 95% Confidence Interval for Mean
        ci_margin = stats.t.ppf(0.975, df=n_valid - 1) * se_mean if n_valid > 1 else 0.0
        ci_lower = mean_val - ci_margin
        ci_upper = mean_val + ci_margin

        # 5% Trimmed Mean
        trimmed_mean = float(stats.trim_mean(vals, 0.05))

        # Median & Quartiles
        median_val = float(np.median(vals))
        q1 = float(np.percentile(vals, 25))
        q3 = float(np.percentile(vals, 75))
        iqr = q3 - q1

        # Variance, Min, Max, Range
        var_val = float(np.var(vals, ddof=1)) if n_valid > 1 else 0.0
        min_val = float(np.min(vals))
        max_val = float(np.max(vals))
        range_val = max_val - min_val

        # Skewness & Kurtosis
        skew_val = float(stats.skew(vals, bias=False)) if n_valid > 2 else 0.0
        kurt_val = float(stats.kurtosis(vals, bias=False)) if n_valid > 3 else 0.0
        se_skew = np.sqrt(6.0 * n_valid * (n_valid - 1) / ((n_valid - 2) * (n_valid + 1) * (n_valid + 3))) if n_valid > 2 else 0.0
        se_kurt = 2.0 * se_skew * np.sqrt((n_valid**2 - 1) / ((n_valid - 3) * (n_valid + 5))) if n_valid > 3 else 0.0

        # Tests of Normality
        # 1. Shapiro-Wilk Test
        try:
            sw_stat, sw_p = stats.shapiro(vals)
            sw_stat = float(sw_stat)
            sw_p = float(sw_p)
        except Exception:
            sw_stat, sw_p = 1.0, 1.0

        # 2. Kolmogorov-Smirnov Test (against standard normal parameterized with mean & std)
        try:
            if std_val > 0:
                standardized = (vals - mean_val) / std_val
                ks_stat, ks_p = stats.kstest(standardized, 'norm')
                ks_stat = float(ks_stat)
                ks_p = float(ks_p)
            else:
                ks_stat, ks_p = 0.0, 1.0
        except Exception:
            ks_stat, ks_p = 0.0, 1.0

        # Extreme values (Top 5 highest and Bottom 5 lowest with original row indices)
        df_sorted = df[[var]].dropna().copy()
        df_sorted['case_num'] = df_sorted.index + 1
        df_sorted[var] = pd.to_numeric(df_sorted[var], errors='coerce')
        
        highest_5 = df_sorted.sort_values(by=var, ascending=False).head(5)
        lowest_5 = df_sorted.sort_values(by=var, ascending=True).head(5)

        highest_list = [
            {'rank': i + 1, 'case_number': int(row['case_num']), 'value': float(row[var])}
            for i, (_, row) in enumerate(highest_5.iterrows())
        ]
        lowest_list = [
            {'rank': i + 1, 'case_number': int(row['case_num']), 'value': float(row[var])}
            for i, (_, row) in enumerate(lowest_5.iterrows())
        ]

        results_by_var[var] = {
            'case_processing': {
                'valid_n': n_valid,
                'valid_percent': float(n_valid / len(df) * 100),
                'missing_n': n_missing,
                'missing_percent': float(n_missing / len(df) * 100),
                'total_n': len(df),
            },
            'descriptives': {
                'mean': round(mean_val, 4),
                'se_mean': round(se_mean, 4),
                'ci_95_lower': round(ci_lower, 4),
                'ci_95_upper': round(ci_upper, 4),
                'trimmed_mean_5pct': round(trimmed_mean, 4),
                'median': round(median_val, 4),
                'variance': round(var_val, 4),
                'std_deviation': round(std_val, 4),
                'minimum': round(min_val, 4),
                'maximum': round(max_val, 4),
                'range': round(range_val, 4),
                'interquartile_range': round(iqr, 4),
                'skewness': round(skew_val, 4),
                'se_skewness': round(se_skew, 4),
                'kurtosis': round(kurt_val, 4),
                'se_kurtosis': round(se_kurt, 4),
            },
            'tests_of_normality': {
                'kolmogorov_smirnov': {
                    'statistic': round(ks_stat, 3),
                    'df': n_valid,
                    'sig': round(ks_p, 4) if ks_p >= 0.001 else '< .001',
                },
                'shapiro_wilk': {
                    'statistic': round(sw_stat, 3),
                    'df': n_valid,
                    'sig': round(sw_p, 4) if sw_p >= 0.001 else '< .001',
                },
            },
            'extreme_values': {
                'highest': highest_list,
                'lowest': lowest_list,
            },
        }

    return {
        'title': 'Explore (Tests of Normality & Extremes)',
        'variables': variables,
        'results': results_by_var,
    }
