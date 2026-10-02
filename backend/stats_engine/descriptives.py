import numpy as np
import pandas as pd
from scipy import stats
from typing import List, Dict, Any

def compute_descriptives(data: List[Dict[str, Any]], variables: List[str], statistics: List[str] = None) -> Dict[str, Any]:
    """
    Computes descriptive statistics for specified variables, formatted as SPSS Descriptive Statistics.
    """
    if statistics is None:
        statistics = ["mean", "std_dev", "variance", "min", "max", "range", "median", "se_mean", "skewness", "kurtosis"]

    df = pd.DataFrame(data)
    results = []

    for var in variables:
        if var not in df.columns:
            continue
        
        # Convert to numeric
        series = pd.to_numeric(df[var], errors='coerce').dropna()
        valid_n = int(len(series))
        missing_n = int(len(df) - valid_n)

        if valid_n == 0:
            results.append({
                "variable": var,
                "valid_n": 0,
                "missing_n": missing_n,
                "mean": None,
                "se_mean": None,
                "median": None,
                "mode": None,
                "std_dev": None,
                "variance": None,
                "range": None,
                "min": None,
                "max": None,
                "skewness": None,
                "kurtosis": None
            })
            continue

        mean_val = float(series.mean())
        std_val = float(series.std(ddof=1)) if valid_n > 1 else 0.0
        var_val = float(series.var(ddof=1)) if valid_n > 1 else 0.0
        se_mean = float(std_val / np.sqrt(valid_n)) if valid_n > 0 else 0.0
        median_val = float(series.median())
        min_val = float(series.min())
        max_val = float(series.max())
        range_val = float(max_val - min_val)

        # Mode
        mode_res = stats.mode(series, keepdims=False)
        mode_val = float(np.squeeze(mode_res.mode)) if valid_n > 0 else None

        # Skewness & Kurtosis
        skew_val = float(np.squeeze(stats.skew(series, bias=False))) if valid_n > 2 else 0.0
        kurt_val = float(np.squeeze(stats.kurtosis(series, bias=False))) if valid_n > 3 else 0.0

        results.append({
            "variable": var,
            "valid_n": valid_n,
            "missing_n": missing_n,
            "mean": round(mean_val, 4),
            "se_mean": round(se_mean, 4),
            "median": round(median_val, 4),
            "mode": round(mode_val, 4) if mode_val is not None else None,
            "std_dev": round(std_val, 4),
            "variance": round(var_val, 4),
            "range": round(range_val, 4),
            "min": round(min_val, 4),
            "max": round(max_val, 4),
            "skewness": round(skew_val, 4),
            "kurtosis": round(kurt_val, 4)
        })

    return {
        "title": "Descriptive Statistics",
        "type": "descriptives",
        "variables": variables,
        "rows": results
    }
