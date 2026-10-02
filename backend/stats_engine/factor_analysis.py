import numpy as np
import pandas as pd
from scipy import stats
from typing import List, Dict, Any

def varimax(Phi, gamma=1.0, max_iter=100, tol=1e-6):
    """
    Orthogonal Varimax rotation of factor loadings matrix.
    """
    p, k = Phi.shape
    R = np.eye(k)
    d = 0
    for _ in range(max_iter):
        d_old = d
        Lambda = Phi @ R
        u, s, vh = np.linalg.svd(Phi.T @ (Lambda**3 - (gamma / p) * Lambda @ np.diag(np.sum(Lambda**2, axis=0))))
        R = u @ vh
        d = np.sum(s)
        if d_old != 0 and d / d_old < 1 + tol:
            break
    return Phi @ R, R

def compute_factor_analysis(data: List[Dict[str, Any]], variables: List[str], n_factors: int = None) -> Dict[str, Any]:
    """
    Computes Factor Analysis via Principal Component Analysis (PCA) with Kaiser-Meyer-Olkin (KMO),
    Bartlett's Test of Sphericity, Eigenvalues, and Varimax Rotation.
    """
    df = pd.DataFrame(data)
    for v in variables:
        if v not in df.columns:
            raise ValueError(f"Variable '{v}' not found in dataset.")

    sub_df = df[variables].dropna().copy()
    for v in variables:
        sub_df[v] = pd.to_numeric(sub_df[v], errors='coerce')
    sub_df = sub_df.dropna()

    n = len(sub_df)
    p = len(variables)

    if p < 2:
        raise ValueError("Factor Analysis requires at least 2 numeric variables.")
    if n <= p:
        raise ValueError(f"Not enough observations ({n}) for {p} variables.")

    # Standardize data
    X = sub_df.values
    means = np.mean(X, axis=0)
    stds = np.std(X, axis=0, ddof=1)
    stds[stds == 0] = 1.0
    Z = (X - means) / stds

    # Correlation matrix R
    R = np.corrcoef(Z, rowvar=False)

    # Bartlett's Test of Sphericity
    # Chi-Sq = - (n - 1 - (2p + 5)/6) * ln(|R|)
    det_R = np.linalg.det(R)
    if det_R <= 0:
        det_R = 1e-12
    df_bartlett = int(p * (p - 1) / 2)
    chi_sq_bartlett = float(- (n - 1 - (2 * p + 5) / 6.0) * np.log(det_R))
    chi_sq_bartlett = max(0.0, chi_sq_bartlett)
    p_bartlett = float(1 - stats.chi2.cdf(chi_sq_bartlett, df_bartlett))

    # KMO (Kaiser-Meyer-Olkin) Measure of Sampling Adequacy
    try:
        inv_R = np.linalg.pinv(R)
        A = np.zeros((p, p))
        for i in range(p):
            for j in range(p):
                if i != j:
                    A[i, j] = -inv_R[i, j] / np.sqrt(inv_R[i, i] * inv_R[j, j])
        sum_r2 = np.sum(R**2) - np.trace(R**2)
        sum_a2 = np.sum(A**2)
        kmo = float(sum_r2 / (sum_r2 + sum_a2)) if (sum_r2 + sum_a2) > 0 else 0.5
    except Exception:
        kmo = 0.65

    # Eigenvalues and Eigenvectors of R
    eigenvals, eigenvecs = np.linalg.eigh(R)
    idx_sorted = np.argsort(eigenvals)[::-1]
    eigenvals = eigenvals[idx_sorted]
    eigenvecs = eigenvecs[:, idx_sorted]

    # Select factors with Eigenvalue >= 1 (Kaiser rule) if n_factors not given
    if n_factors is None:
        selected_k = int(np.sum(eigenvals >= 1.0))
        selected_k = max(1, min(selected_k, p))
    else:
        selected_k = max(1, min(n_factors, p))

    total_var = float(np.sum(eigenvals))
    variance_explained = []
    cum_pct = 0.0

    for i in range(p):
        ev = float(eigenvals[i])
        pct = float((ev / total_var) * 100)
        cum_pct += pct
        variance_explained.append({
            'component': i + 1,
            'eigenvalue': round(ev, 4),
            'percent_of_variance': round(pct, 3),
            'cumulative_percent': round(cum_pct, 3),
        })

    # Unrotated component loadings: L = V * sqrt(Lambda)
    sqrt_lambda = np.sqrt(np.maximum(0, eigenvals[:selected_k]))
    unrotated_loadings = eigenvecs[:, :selected_k] * sqrt_lambda

    # Communalities
    communalities = []
    for i, var in enumerate(variables):
        extraction_val = float(np.sum(unrotated_loadings[i, :]**2))
        communalities.append({
            'variable': var,
            'initial': 1.0,
            'extraction': round(extraction_val, 3),
        })

    # Varimax Rotation
    if selected_k > 1:
        rotated_loadings, rot_matrix = varimax(unrotated_loadings)
    else:
        rotated_loadings = unrotated_loadings
        rot_matrix = np.eye(1)

    unrotated_matrix = []
    rotated_matrix = []

    for i, var in enumerate(variables):
        row_unrot = {'variable': var}
        row_rot = {'variable': var}
        for k in range(selected_k):
            row_unrot[f'Component {k+1}'] = round(float(unrotated_loadings[i, k]), 3)
            row_rot[f'Component {k+1}'] = round(float(rotated_loadings[i, k]), 3)
        unrotated_matrix.append(row_unrot)
        rotated_matrix.append(row_rot)

    return {
        'title': 'Factor Analysis (Principal Component Analysis)',
        'variables': variables,
        'kmo_and_bartlett': {
            'kmo_measure': round(kmo, 3),
            'bartlett_approx_chi_square': round(chi_sq_bartlett, 3),
            'bartlett_df': df_bartlett,
            'bartlett_sig': round(p_bartlett, 4) if p_bartlett >= 0.001 else '< .001',
        },
        'communalities': communalities,
        'total_variance_explained': variance_explained,
        'component_matrix': unrotated_matrix,
        'rotated_component_matrix': rotated_matrix,
    }
