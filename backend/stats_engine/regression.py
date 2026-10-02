import pandas as pd
import numpy as np
from scipy import stats
from typing import List, Dict, Any

def compute_linear_regression(data: List[Dict[str, Any]], dep_var: str, indep_vars: List[str]) -> Dict[str, Any]:
    """
    Computes Linear and Multiple Regression matching SPSS output tables:
    Model Summary, ANOVA, and Coefficients (with Beta, t, Sig, CI, VIF).
    """
    df = pd.DataFrame(data)
    all_vars = [dep_var] + indep_vars
    for v in all_vars:
        if v not in df.columns:
            raise ValueError(f"Variable {v} not found in dataset.")

    sub_df = df[all_vars].dropna().copy()
    for v in all_vars:
        sub_df[v] = pd.to_numeric(sub_df[v], errors='coerce')
    sub_df = sub_df.dropna()

    n = len(sub_df)
    k = len(indep_vars)

    if n <= k + 1:
        raise ValueError(f"Not enough valid cases ({n}) for {k} predictors.")

    y = sub_df[dep_var].values
    X_raw = sub_df[indep_vars].values

    # Add constant term (intercept)
    X = np.column_stack([np.ones(n), X_raw])

    # OLS estimation: beta = (X^T X)^(-1) X^T y
    try:
        beta, residuals, rank, s = np.linalg.lstsq(X, y, rcond=None)
    except np.linalg.LinAlgError:
        raise ValueError("Singular matrix encountered in regression. Check for multicollinearity.")

    y_pred = X @ beta
    resid = y - y_pred

    ss_total = float(np.sum((y - np.mean(y))**2))
    ss_resid = float(np.sum(resid**2))
    ss_reg = float(ss_total - ss_resid)

    df_reg = k
    df_resid = n - k - 1
    df_tot = n - 1

    ms_reg = ss_reg / df_reg if df_reg > 0 else 0.0
    ms_resid = ss_resid / df_resid if df_resid > 0 else 0.0

    f_stat = ms_reg / ms_resid if ms_resid > 0 else 0.0
    f_p_val = float(1 - stats.f.cdf(f_stat, df_reg, df_resid)) if ms_resid > 0 else 1.0

    r2 = ss_reg / ss_total if ss_total > 0 else 0.0
    adj_r2 = 1 - ((1 - r2) * (n - 1) / df_resid) if df_resid > 0 else 0.0
    r_val = np.sqrt(max(0.0, r2))
    std_err_est = np.sqrt(ms_resid) if ms_resid > 0 else 0.0

    # Durbin-Watson
    diff_resid = np.diff(resid)
    dw_stat = float(np.sum(diff_resid**2) / np.sum(resid**2)) if np.sum(resid**2) > 0 else 2.0

    # Standard errors of coefficients
    try:
        inv_xtx = np.linalg.pinv(X.T @ X)
        var_beta = np.diagonal(inv_xtx) * ms_resid
        se_beta = np.sqrt(np.maximum(0, var_beta))
    except Exception:
        se_beta = np.zeros(k + 1)

    # Standardized coefficients (Beta)
    std_y = np.std(y, ddof=1)
    std_x = np.std(X_raw, axis=0, ddof=1)
    std_beta = []
    for j in range(k):
        b_std = beta[j + 1] * (std_x[j] / std_y) if std_y > 0 else 0.0
        std_beta.append(b_std)

    # Collinearity VIF & Tolerance
    vifs = []
    tolerances = []
    if k > 1:
        corr_matrix = pd.DataFrame(X_raw).corr().values
        try:
            inv_corr = np.linalg.pinv(corr_matrix)
            for j in range(k):
                vif = float(inv_corr[j, j])
                tol = 1.0 / vif if vif > 0 else 1.0
                vifs.append(round(vif, 3))
                tolerances.append(round(tol, 3))
        except Exception:
            vifs = [1.0] * k
            tolerances = [1.0] * k
    else:
        vifs = [1.0]
        tolerances = [1.0]

    # Build Coefficients rows
    t_crit = stats.t.ppf(0.975, df=df_resid)
    coeff_rows = []

    # Constant
    t_const = beta[0] / se_beta[0] if se_beta[0] > 0 else 0.0
    p_const = float(2 * (1 - stats.t.cdf(abs(t_const), df=df_resid)))
    coeff_rows.append({
        "term": "(Constant)",
        "b": round(float(beta[0]), 4),
        "se": round(float(se_beta[0]), 4),
        "beta": None,
        "t": round(float(t_const), 3),
        "sig": round(float(p_const), 4),
        "ci_lower": round(float(beta[0] - t_crit * se_beta[0]), 4),
        "ci_upper": round(float(beta[0] + t_crit * se_beta[0]), 4),
        "tolerance": None,
        "vif": None
    })

    # Predictors
    for idx, var in enumerate(indep_vars):
        b_val = float(beta[idx + 1])
        se_val = float(se_beta[idx + 1])
        t_val = b_val / se_val if se_val > 0 else 0.0
        p_val = float(2 * (1 - stats.t.cdf(abs(t_val), df=df_resid)))

        coeff_rows.append({
            "term": var,
            "b": round(b_val, 4),
            "se": round(se_val, 4),
            "beta": round(float(std_beta[idx]), 3),
            "t": round(float(t_val), 3),
            "sig": round(float(p_val), 4),
            "ci_lower": round(float(b_val - t_crit * se_val), 4),
            "ci_upper": round(float(b_val + t_crit * se_val), 4),
            "tolerance": tolerances[idx] if idx < len(tolerances) else 1.0,
            "vif": vifs[idx] if idx < len(vifs) else 1.0
        })

    return {
        "title": f"Linear Regression: Dependent = {dep_var}",
        "type": "linear_regression",
        "dependent_variable": dep_var,
        "independent_variables": indep_vars,
        "model_summary": {
            "r": round(float(r_val), 3),
            "r_squared": round(float(r2), 3),
            "adjusted_r_squared": round(float(adj_r2), 3),
            "std_error_estimate": round(float(std_err_est), 4),
            "durbin_watson": round(float(dw_stat), 3)
        },
        "anova": {
            "regression": {
                "sum_of_squares": round(ss_reg, 3),
                "df": df_reg,
                "mean_square": round(ms_reg, 3),
                "f": round(f_stat, 3),
                "sig": round(f_p_val, 4)
            },
            "residual": {
                "sum_of_squares": round(ss_resid, 3),
                "df": df_resid,
                "mean_square": round(ms_resid, 3)
            },
            "total": {
                "sum_of_squares": round(ss_total, 3),
                "df": df_tot
            }
        },
        "coefficients": coeff_rows
    }
