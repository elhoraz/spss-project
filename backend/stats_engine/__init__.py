"""
Statistical Computation Engine for SPSS Web Studio
"""
from .descriptives import compute_descriptives
from .frequencies import compute_frequencies
from .crosstabs import compute_crosstabs
from .correlations import compute_correlations
from .t_tests import (
    compute_one_sample_t_test,
    compute_independent_t_test,
    compute_paired_t_test,
)
from .anova import compute_one_way_anova, compute_two_way_anova
from .regression import compute_linear_regression
from .reliability import compute_cronbach_alpha
from .non_parametrics import (
    compute_mann_whitney_u,
    compute_wilcoxon_signed_rank,
    compute_kruskal_wallis,
)
from .explore import compute_explore
from .factor_analysis import compute_factor_analysis
from .logistic_regression import compute_binary_logistic_regression
