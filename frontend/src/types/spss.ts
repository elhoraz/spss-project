export type VariableType = 'Numeric' | 'String' | 'Date' | 'Dollar' | 'Currency' | 'Percentage';
export type VariableAlign = 'Left' | 'Right' | 'Center';
export type VariableMeasure = 'Scale' | 'Ordinal' | 'Nominal';
export type VariableRole = 'Input' | 'Target' | 'Both' | 'None' | 'Partition' | 'Split';

export interface VariableMeta {
  name: string;
  type: VariableType;
  width: number;
  decimals: number;
  label: string;
  values: Record<string, string>; // e.g. {"1": "Male", "2": "Female"}
  missing: string;
  columns: number;
  align: VariableAlign;
  measure: VariableMeasure;
  role: VariableRole;
}

export interface Dataset {
  id?: number;
  name: string;
  variables: VariableMeta[];
  rows: Record<string, any>[];
}

export type AnalysisType =
  | 'descriptives'
  | 'frequencies'
  | 'crosstabs'
  | 'correlations'
  | 'one_sample_t_test'
  | 'independent_t_test'
  | 'paired_t_test'
  | 'one_way_anova'
  | 'two_way_anova'
  | 'linear_regression'
  | 'reliability'
  | 'mann_whitney'
  | 'wilcoxon'
  | 'kruskal_wallis'
  | 'explore'
  | 'factor_analysis'
  | 'logistic_regression'
  | 'means_report'
  | 'partial_correlation'
  | 'curve_estimation'
  | 'chi_square_goodness'
  | 'binomial_test'
  | 'runs_test'
  | 'automatic_recode'
  | 'replace_missing'
  | 'ancova'
  | 'kmeans_cluster'
  | 'aggregate_data'
  | 'merge_files'
  | 'histogram_curve'
  | 'scatter_regression'
  | 'boxplot_chart'
  | 'qqplot_chart'
  | 'count_values'
  | 'rank_cases'
  | 'repeated_measures_anova'
  | 'friedman_test'
  | 'ordinal_regression'
  | 'kaplan_meier'
  | 'data_management'
  | 'compute_variable'
  | 'recode_variable'
  | 'chart'
  | 'log';

export interface OutputItem {
  id: string;
  timestamp: string;
  title: string;
  type: AnalysisType;
  syntax?: string;
  data: any;
}

export type ActiveView = 'data' | 'variable' | 'output' | 'syntax';

export type AnalysisModalType =
  | null
  | 'frequencies'
  | 'descriptives'
  | 'crosstabs'
  | 'correlations'
  | 'one_sample_t_test'
  | 'independent_t_test'
  | 'paired_t_test'
  | 'one_way_anova'
  | 'two_way_anova'
  | 'linear_regression'
  | 'reliability'
  | 'mann_whitney'
  | 'wilcoxon'
  | 'kruskal_wallis'
  | 'explore'
  | 'factor_analysis'
  | 'logistic_regression'
  | 'means_report'
  | 'partial_correlation'
  | 'curve_estimation'
  | 'chi_square_goodness'
  | 'binomial_test'
  | 'runs_test'
  | 'automatic_recode'
  | 'replace_missing'
  | 'ancova'
  | 'kmeans_cluster'
  | 'aggregate_data'
  | 'merge_files'
  | 'histogram_curve'
  | 'scatter_regression'
  | 'boxplot_chart'
  | 'qqplot_chart'
  | 'count_values'
  | 'rank_cases'
  | 'visual_binning'
  | 'transpose_data'
  | 'restructure_data'
  | 'repeated_measures_anova'
  | 'friedman_test'
  | 'ordinal_regression'
  | 'kaplan_meier'
  | 'compute_variable'
  | 'recode_variable'
  | 'recode_different'
  | 'recode_same'
  | 'sort_cases'
  | 'select_cases'
  | 'split_file'
  | 'weight_cases'
  | 'chart_builder'
  | 'import_data'
  | 'export_report'
  | 'value_labels'
  | 'about_spss'
  | 'server_settings';

export type AppTheme = 'spss-classic' | 'modern-light' | 'academic-dark';
