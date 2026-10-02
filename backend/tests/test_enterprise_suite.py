import pytest
import numpy as np
from fastapi.testclient import TestClient
from backend.main import app
from backend.sample_data import get_employee_sample_data
from backend.stats_engine.descriptives import compute_descriptives
from backend.stats_engine.frequencies import compute_frequencies
from backend.stats_engine.crosstabs import compute_crosstabs
from backend.stats_engine.correlations import compute_correlations
from backend.stats_engine.t_tests import (
    compute_one_sample_t_test,
    compute_independent_t_test,
    compute_paired_t_test,
)
from backend.stats_engine.anova import compute_one_way_anova, compute_two_way_anova
from backend.stats_engine.regression import compute_linear_regression
from backend.stats_engine.reliability import compute_cronbach_alpha
from backend.stats_engine.non_parametrics import (
    compute_mann_whitney_u,
    compute_wilcoxon_signed_rank,
    compute_kruskal_wallis,
)
from backend.stats_engine.syntax_parser import parse_and_execute_syntax
from backend.security import get_password_hash, verify_password, create_access_token, decode_token

client = TestClient(app)

@pytest.fixture
def employee_data():
    return get_employee_sample_data()["rows_data"]

# 1. DESCRIPTIVES TEST
def test_descriptives_statistical_accuracy(employee_data):
    res = compute_descriptives(employee_data, ["salary", "salbegin"])
    assert res["type"] == "descriptives"
    assert len(res["rows"]) == 2

    sal_stat = res["rows"][0]
    assert sal_stat["variable"] == "salary"
    assert sal_stat["valid_n"] == 40
    assert sal_stat["missing_n"] == 0
    assert sal_stat["min"] < sal_stat["mean"] < sal_stat["max"]
    assert sal_stat["variance"] > 0
    assert sal_stat["std_dev"] > 0
    assert "skewness" in sal_stat
    assert "kurtosis" in sal_stat

# 2. FREQUENCIES TEST
def test_frequencies_statistical_accuracy(employee_data):
    res = compute_frequencies(employee_data, ["gender", "jobcat"])
    assert res["type"] == "frequencies"
    assert len(res["tables"]) == 2

    g_table = res["tables"][0]
    assert g_table["variable"] == "gender"
    assert g_table["statistics"]["valid"] == 40
    # Cumulative percent of last category must equal 100%
    assert g_table["rows"][-1]["cumulative_percent"] == 100.0

# 3. CROSSTABS TEST
def test_crosstabs_chi_square(employee_data):
    res = compute_crosstabs(employee_data, "gender", "jobcat")
    assert res["type"] == "crosstabs"
    assert "cells" in res
    assert "chi_square_tests" in res
    assert len(res["chi_square_tests"]) > 0

    pearson_chi = res["chi_square_tests"][0]
    assert pearson_chi["test"] == "Pearson Chi-Square"
    assert pearson_chi["value"] >= 0
    assert pearson_chi["df"] > 0
    assert 0.0 <= pearson_chi["asymp_sig_2_sided"] <= 1.0

# 4. CORRELATIONS TEST (PEARSON & SPEARMAN)
def test_correlations_pearson_and_spearman(employee_data):
    res_pearson = compute_correlations(employee_data, ["salary", "salbegin", "educ"], method="pearson")
    assert res_pearson["type"] == "correlations"
    assert len(res_pearson["matrix"]) == 3
    # Diagonal correlation with itself must be 1.0
    assert res_pearson["matrix"][0]["correlations"][0]["coefficient"] == 1.0
    # Positive correlation between starting and current salary
    r_val = res_pearson["matrix"][0]["correlations"][1]["coefficient"]
    assert 0.5 < r_val <= 1.0

    res_spearman = compute_correlations(employee_data, ["salary", "salbegin"], method="spearman")
    rho_val = res_spearman["matrix"][0]["correlations"][1]["coefficient"]
    assert 0.5 < rho_val <= 1.0

# 5. T-TESTS (ONE-SAMPLE, INDEPENDENT, PAIRED)
def test_t_tests(employee_data):
    # One-Sample
    t1 = compute_one_sample_t_test(employee_data, ["salary"], test_value=35000)
    assert t1["type"] == "one_sample_t_test"
    assert len(t1["test_results"]) == 1
    assert "t" in t1["test_results"][0]
    assert "df" in t1["test_results"][0]
    assert 0.0 <= t1["test_results"][0]["sig_2_tailed"] <= 1.0

    # Independent Samples
    t2 = compute_independent_t_test(employee_data, ["salary"], "gender", "m", "f")
    assert t2["type"] == "independent_t_test"
    eq_res = t2["test_results"][0]["equal_var_assumed"]
    assert "t" in eq_res
    assert "df" in eq_res
    assert "mean_diff" in eq_res

    # Paired Samples
    tp = compute_paired_t_test(employee_data, [["salary", "salbegin"]])
    assert tp["type"] == "paired_t_test"
    assert len(tp["paired_differences"]) == 1
    assert tp["paired_differences"][0]["mean"] > 0

# 6. ANOVA (ONE-WAY & TWO-WAY)
def test_anova(employee_data):
    # One-Way ANOVA
    a1 = compute_one_way_anova(employee_data, "salary", "jobcat")
    assert a1["type"] == "one_way_anova"
    assert "anova_table" in a1
    assert a1["anova_table"]["between_groups"]["f"] > 0
    assert 0.0 <= a1["anova_table"]["between_groups"]["sig"] <= 1.0
    assert "post_hoc" in a1

    # Two-Way ANOVA
    a2 = compute_two_way_anova(employee_data, "salary", "jobcat", "gender")
    assert a2["type"] == "two_way_anova"
    assert len(a2["between_subjects_effects"]) >= 4

# 7. REGRESSION (SIMPLE & MULTIPLE)
def test_linear_regression(employee_data):
    reg = compute_linear_regression(employee_data, "salary", ["salbegin", "educ"])
    assert reg["type"] == "linear_regression"
    assert 0.0 <= reg["model_summary"]["r_squared"] <= 1.0
    assert reg["anova"]["regression"]["f"] > 0
    assert len(reg["coefficients"]) == 3 # Intercept + salbegin + educ
    assert reg["coefficients"][0]["term"] == "(Constant)"

# 8. RELIABILITY (CRONBACH'S ALPHA)
def test_reliability_cronbach_alpha(employee_data):
    rel = compute_cronbach_alpha(employee_data, ["salary", "salbegin", "educ"])
    assert rel["type"] == "reliability"
    assert rel["n_cases"] == 40
    assert rel["n_items"] == 3
    assert "cronbach_alpha" in rel
    assert len(rel["item_total_statistics"]) == 3
    for it in rel["item_total_statistics"]:
        assert "scale_mean_if_deleted" in it
        assert "corrected_item_total_correlation" in it

# 9. NON-PARAMETRIC TESTS
def test_non_parametric_tests(employee_data):
    # Mann-Whitney U
    mw = compute_mann_whitney_u(employee_data, "salary", "gender")
    assert mw["type"] == "mann_whitney"
    assert mw["test_statistics"]["mann_whitney_u"] >= 0
    assert 0.0 <= mw["test_statistics"]["asymp_sig_2_tailed"] <= 1.0

    # Wilcoxon Signed-Rank
    wilc = compute_wilcoxon_signed_rank(employee_data, "salary", "salbegin")
    assert wilc["type"] == "wilcoxon"
    assert wilc["test_statistics"]["w"] >= 0
    assert 0.0 <= wilc["test_statistics"]["asymp_sig_2_tailed"] <= 1.0

    # Kruskal-Wallis H
    kw = compute_kruskal_wallis(employee_data, "salary", "jobcat")
    assert kw["type"] == "kruskal_wallis"
    assert kw["test_statistics"]["kruskal_wallis_h"] >= 0
    assert kw["test_statistics"]["df"] > 0

# 10. SYNTAX PROCESSOR
def test_syntax_processor_batch(employee_data):
    script = """
    * SPSS Batch Test Script.
    FREQUENCIES VARIABLES=gender jobcat.
    DESCRIPTIVES VARIABLES=salary salbegin.
    CORRELATIONS /VARIABLES=salary salbegin educ.
    """
    outputs = parse_and_execute_syntax(script, employee_data)
    assert len(outputs) == 3
    assert outputs[0]["type"] == "frequencies"
    assert outputs[1]["type"] == "descriptives"
    assert outputs[2]["type"] == "correlations"

# 11. SECURITY & AUTH
def test_security_jwt():
    raw_pass = "EnterpriseSpss2026!"
    hashed = get_password_hash(raw_pass)
    assert verify_password(raw_pass, hashed)
    assert not verify_password("wrong_password", hashed)

    token = create_access_token({"sub": "researcher@university.edu"})
    decoded = decode_token(token)
    assert decoded["sub"] == "researcher@university.edu"

# 12. FASTAPI ENDPOINTS
def test_fastapi_endpoints():
    # Health Check
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

    # API Documentation available
    openapi_res = client.get("/openapi.json")
    assert openapi_res.status_code == 200
    assert "paths" in openapi_res.json()
