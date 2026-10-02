import sys
import os

# Ensure current directory is in sys.path
sys.path.insert(0, os.path.abspath("."))

from backend.sample_data import get_employee_sample_data
from backend.stats_engine.descriptives import compute_descriptives
from backend.stats_engine.frequencies import compute_frequencies
from backend.stats_engine.crosstabs import compute_crosstabs
from backend.stats_engine.correlations import compute_correlations
from backend.stats_engine.t_tests import compute_one_sample_t_test, compute_independent_t_test, compute_paired_t_test
from backend.stats_engine.anova import compute_one_way_anova
from backend.stats_engine.regression import compute_linear_regression
from backend.stats_engine.syntax_parser import parse_and_execute_syntax

sample = get_employee_sample_data()
d = sample['rows_data']
print("Descriptives Mean:", compute_descriptives(d, ['salary'])['rows'][0]['mean'], flush=True)
print("Frequencies Gender Categories:", len(compute_frequencies(d, ['gender'])['tables'][0]['rows']), flush=True)
print("Crosstabs Chi-Square:", compute_crosstabs(d, 'gender', 'jobcat')['chi_square_tests'][0]['value'], flush=True)
print("Correlation R:", compute_correlations(d, ['salary', 'salbegin'])['matrix'][0]['correlations'][1]['coefficient'], flush=True)
print("One Sample T-Test t:", compute_one_sample_t_test(d, ['salary'], 30000)['test_results'][0]['t'], flush=True)
print("Independent T-Test t:", compute_independent_t_test(d, ['salary'], 'gender', 'm', 'f')['test_results'][0]['equal_var_assumed']['t'], flush=True)
print("Paired T-Test Diff:", compute_paired_t_test(d, [['salary', 'salbegin']])['paired_differences'][0]['mean'], flush=True)
print("ANOVA F:", compute_one_way_anova(d, 'salary', 'jobcat', run_post_hoc=False)['anova_table']['between_groups']['f'], flush=True)
print("Regression R2:", compute_linear_regression(d, 'salary', ['salbegin', 'educ'])['model_summary']['r_squared'], flush=True)
print("Syntax Parse Count:", len(parse_and_execute_syntax("FREQUENCIES VARIABLES=gender.\nDESCRIPTIVES VARIABLES=salary.", d)), flush=True)
print("ALL TESTS PASSED SUCCESSFULLY!", flush=True)
