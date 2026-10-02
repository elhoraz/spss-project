import pandas as pd
import numpy as np
from typing import List, Dict, Any

def compute_frequencies(data: List[Dict[str, Any]], variables: List[str], value_labels: Dict[str, Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Computes frequency tables for specified variables matching SPSS Output Viewer format.
    """
    if value_labels is None:
        value_labels = {}

    df = pd.DataFrame(data)
    tables = []

    for var in variables:
        if var not in df.columns:
            continue

        series = df[var]
        total_n = len(series)
        
        # Missing values (None, np.nan, empty string)
        is_missing = series.isna() | (series.astype(str).str.strip() == "")
        missing_count = int(is_missing.sum())
        valid_series = series[~is_missing]
        valid_count = int(len(valid_series))

        # Count frequencies
        counts = valid_series.value_counts().sort_index()
        var_labels = value_labels.get(var, {})

        freq_rows = []
        cum_percent = 0.0

        for val, count in counts.items():
            str_val = str(val)
            # Remove trailing .0 if integer float
            if isinstance(val, float) and val.is_integer():
                str_val = str(int(val))

            label = var_labels.get(str_val, str_val)
            pct = (count / total_n) * 100 if total_n > 0 else 0.0
            valid_pct = (count / valid_count) * 100 if valid_count > 0 else 0.0
            cum_percent += valid_pct

            freq_rows.append({
                "value": str_val,
                "label": label,
                "frequency": int(count),
                "percent": round(pct, 1),
                "valid_percent": round(valid_pct, 1),
                "cumulative_percent": round(min(cum_percent, 100.0), 1)
            })

        # Summary statistics
        stats_summary = {
            "valid": valid_count,
            "missing": missing_count
        }
        
        # If numeric, add mean/median/std
        num_series = pd.to_numeric(valid_series, errors='coerce').dropna()
        if len(num_series) > 0:
            stats_summary["mean"] = round(float(num_series.mean()), 3)
            stats_summary["median"] = round(float(num_series.median()), 3)
            stats_summary["std_dev"] = round(float(num_series.std(ddof=1)), 3) if len(num_series) > 1 else 0.0

        tables.append({
            "variable": var,
            "statistics": stats_summary,
            "rows": freq_rows,
            "total_valid": valid_count,
            "total_missing": missing_count,
            "total": total_n
        })

    return {
        "title": "Frequencies",
        "type": "frequencies",
        "variables": variables,
        "tables": tables
    }
