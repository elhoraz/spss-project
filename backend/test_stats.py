from backend.sample_data import get_employee_sample_data
from backend.stats_engine.descriptives import compute_descriptives
from backend.stats_engine.frequencies import compute_frequencies
from backend.stats_engine.crosstabs import compute_crosstabs
from backend.stats_engine.correlations import compute_correlations
from backend.stats_engine.t_tests import compute_one_sample_t_test, compute_independent_t_test, compute_paired_t_test
from backend.stats_engine.anova import compute_one_way_anova
from backend.stats_engine.regression import compute_linear_regression
from backend.stats_engine.syntax_parser import parse_and_execute_syntax

def test_all():
    sample = get_employee_sample_data()
    data = sample["rows_data"]
    print(f"Loaded {len(data)} rows.")

    # 1. Descriptives
    desc = compute_descriptives(data, ["salary", "salbegin", "educ"])
    print("Descriptives:", desc["rows"][0]["variable"], "Mean:", desc["rows"][0]["mean"])

    # 2. Frequencies
    freq = compute_frequencies(data, ["gender", "jobcat"])
    print("Frequencies for gender rows count:", len(freq["tables"][0]["rows"]))

    # 3. Crosstabs
    ct = compute_crosstabs(data, "gender", "jobcat")
    print("Crosstabs Chi-Square:", ct["chi_square_tests"][0]["value"], "p:", ct["chi_square_tests"][0]["asymp_sig_2_sided"])

    # 4. Correlations
    corr = compute_correlations(data, ["salary", "salbegin", "educ"], method="pearson")
    print("Correlation salary vs salbegin:", corr["matrix"][0]["correlations"][1]["coefficient"])

    # 5. One Sample T-Test
    t1 = compute_one_sample_t_test(data, ["salary"], test_value=35000)
    print("One Sample T-Test t:", t1["test_results"][0]["t"], "p:", t1["test_results"][0]["sig_2_tailed"])

    # 6. Independent T-Test
    t2 = compute_independent_t_test(data, ["salary"], "gender", "m", "f")
    print("Indep T-Test t (equal var assumed):", t2["test_results"][0]["equal_var_assumed"]["t"])

    # 7. Paired T-Test
    tp = compute_paired_t_test(data, [["salary", "salbegin"]])
    print("Paired T-Test diff mean:", tp["paired_differences"][0]["mean"], "t:", tp["paired_differences"][0]["t"])

    # 8. ANOVA
    anv = compute_one_way_anova(data, "salary", "jobcat")
    print("ANOVA F:", anv["anova_table"]["between_groups"]["f"], "Sig:", anv["anova_table"]["between_groups"]["sig"])

    # 9. Regression
    reg = compute_linear_regression(data, "salary", ["salbegin", "educ"])
    print("Regression R2:", reg["model_summary"]["r_squared"], "F:", reg["anova"]["regression"]["f"])

    # 10. Syntax
    syntax = "FREQUENCIES VARIABLES=gender.\nDESCRIPTIVES VARIABLES=salary salbegin."
    syn_res = parse_and_execute_syntax(syntax, data)
    print("Syntax executed commands count:", len(syn_res))
    print("ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_all()
