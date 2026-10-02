import numpy as np
import pandas as pd
from scipy import stats
from scipy.optimize import minimize
from typing import List, Dict, Any

def sigmoid(z):
    return 1.0 / (1.0 + np.exp(-np.clip(z, -500, 500)))

def compute_binary_logistic_regression(data: List[Dict[str, Any]], dep_var: str, covariates: List[str]) -> Dict[str, Any]:
    """
    Computes Binary Logistic Regression matching IBM SPSS Statistics output tables:
    Dependent Variable Encoding, Omnibus Tests, Model Summary (Cox & Snell, Nagelkerke),
    Classification Table, and Variables in the Equation (B, SE, Wald, Exp(B), 95% CI).
    """
    df = pd.DataFrame(data)
    all_vars = [dep_var] + covariates
    for v in all_vars:
        if v not in df.columns:
            raise ValueError(f"Variable '{v}' not found in dataset.")

    sub_df = df[all_vars].dropna().copy()
    for v in covariates:
        sub_df[v] = pd.to_numeric(sub_df[v], errors='coerce')
    sub_df = sub_df.dropna()

    # Encode binary dependent variable
    unique_vals = sub_df[dep_var].unique()
    if len(unique_vals) != 2:
        raise ValueError(f"Dependent variable '{dep_var}' must have exactly 2 distinct categories (found: {len(unique_vals)}).")

    # Map categories to 0 and 1
    val_map = {unique_vals[0]: 0, unique_vals[1]: 1}
    y = sub_df[dep_var].map(val_map).values.astype(float)
    encoding_info = [
        {'original_value': str(unique_vals[0]), 'internal_value': 0},
        {'original_value': str(unique_vals[1]), 'internal_value': 1},
    ]

    n = len(sub_df)
    k = len(covariates)

    if n <= k + 1:
        raise ValueError(f"Not enough cases ({n}) for {k} covariates.")

    X_raw = sub_df[covariates].values
    X = np.column_stack([np.ones(n), X_raw])

    # Negative log-likelihood function
    def neg_log_likelihood(beta):
        p = sigmoid(X @ beta)
        eps = 1e-15
        p = np.clip(p, eps, 1 - eps)
        return -np.sum(y * np.log(p) + (1 - y) * np.log(1 - p))

    # Gradient of negative log-likelihood
    def gradient(beta):
        p = sigmoid(X @ beta)
        return X.T @ (p - y)

    # Initial guess
    initial_beta = np.zeros(k + 1)
    res = minimize(neg_log_likelihood, initial_beta, jac=gradient, method='BFGS')

    beta = res.x
    ll_model = -res.fun

    # Baseline log-likelihood (intercept only)
    p_baseline = np.mean(y)
    eps = 1e-15
    p_baseline = np.clip(p_baseline, eps, 1 - eps)
    ll_null = np.sum(y * np.log(p_baseline) + (1 - y) * np.log(1 - p_baseline))

    # Omnibus Tests of Model Coefficients (Likelihood Ratio Chi-Square)
    chi_sq_omnibus = max(0.0, float(-2 * (ll_null - ll_model)))
    df_omnibus = k
    p_omnibus = float(1 - stats.chi2.cdf(chi_sq_omnibus, df_omnibus))

    # Model Summary metrics
    minus_2_ll = float(-2 * ll_model)
    cox_snell_r2 = float(1.0 - np.exp(-2.0 * (ll_model - ll_null) / n))
    max_cox_snell = float(1.0 - np.exp(2.0 * ll_null / n))
    nagelkerke_r2 = float(cox_snell_r2 / max_cox_snell) if max_cox_snell > 0 else 0.0

    # Covariance matrix (Hessian inverse)
    p_pred = sigmoid(X @ beta)
    W = np.diag(p_pred * (1 - p_pred))
    Hessian = X.T @ W @ X

    try:
        cov_matrix = np.linalg.pinv(Hessian)
        se = np.sqrt(np.diag(cov_matrix))
    except Exception:
        se = np.ones(k + 1) * 0.1

    # Variables in the Equation
    var_names = ['Constant'] + covariates
    equation_rows = []

    for i, vname in enumerate(var_names):
        b_val = float(beta[i])
        se_val = float(se[i]) if se[i] > 0 else 0.0001
        wald = float((b_val / se_val)**2)
        sig = float(1 - stats.chi2.cdf(wald, 1))
        exp_b = float(np.exp(b_val))
        ci_lower = float(np.exp(b_val - 1.96 * se_val))
        ci_upper = float(np.exp(b_val + 1.96 * se_val))

        equation_rows.append({
            'variable': vname,
            'b': round(b_val, 4),
            'se': round(se_val, 4),
            'wald': round(wald, 4),
            'df': 1,
            'sig': round(sig, 4) if sig >= 0.001 else '< .001',
            'exp_b': round(exp_b, 4),
            'ci_lower': round(ci_lower, 4),
            'ci_upper': round(ci_upper, 4),
        })

    # Classification table (Cut value 0.50)
    y_pred_binary = (p_pred >= 0.50).astype(int)
    n00 = int(np.sum((y == 0) & (y_pred_binary == 0)))
    n01 = int(np.sum((y == 0) & (y_pred_binary == 1)))
    n10 = int(np.sum((y == 1) & (y_pred_binary == 0)))
    n11 = int(np.sum((y == 1) & (y_pred_binary == 1)))

    pct_correct_0 = (n00 / (n00 + n01) * 100) if (n00 + n01) > 0 else 0.0
    pct_correct_1 = (n11 / (n10 + n11) * 100) if (n10 + n11) > 0 else 0.0
    overall_pct = ((n00 + n11) / n * 100) if n > 0 else 0.0

    classification_table = {
        'group_0_label': str(unique_vals[0]),
        'group_1_label': str(unique_vals[1]),
        'n00': n00,
        'n01': n01,
        'n10': n10,
        'n11': n11,
        'percent_correct_0': round(pct_correct_0, 1),
        'percent_correct_1': round(pct_correct_1, 1),
        'overall_percent': round(overall_pct, 1),
    }

    return {
        'title': 'Binary Logistic Regression',
        'dependent_variable': dep_var,
        'covariates': covariates,
        'dependent_encoding': encoding_info,
        'omnibus_tests': {
            'chi_square': round(chi_sq_omnibus, 3),
            'df': df_omnibus,
            'sig': round(p_omnibus, 4) if p_omnibus >= 0.001 else '< .001',
        },
        'model_summary': {
            'minus_2_log_likelihood': round(minus_2_ll, 3),
            'cox_snell_r2': round(cox_snell_r2, 3),
            'nagelkerke_r2': round(nagelkerke_r2, 3),
        },
        'classification_table': classification_table,
        'variables_in_equation': equation_rows,
    }
