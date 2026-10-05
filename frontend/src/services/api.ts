import { OutputItem } from '../types/spss';

export const getApiBaseUrl = (): string => {
  return localStorage.getItem('SPSS_API_URL') || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
};

export const setApiBaseUrl = (url: string) => {
  if (url && url.trim()) {
    localStorage.setItem('SPSS_API_URL', url.trim().replace(/\/+$/, ''));
  } else {
    localStorage.removeItem('SPSS_API_URL');
  }
};

async function postApi(endpoint: string, payload: any): Promise<any | null> {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn(`API ${endpoint} failed with status ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(`API ${endpoint} request failed:`, err);
    return null;
  }
}

export const statsApiService = {
  async checkHealth(): Promise<boolean> {
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(3500) });
      return res.ok;
    } catch {
      return false;
    }
  },

  async runDescriptives(data: Record<string, any>[], variables: string[]): Promise<OutputItem | null> {
    const res = await postApi('/api/analyze/descriptives', { variables, data });
    if (!res) return null;
    return {
      id: `desc_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      title: res.title || 'Descriptive Statistics',
      type: 'descriptives',
      syntax: `DESCRIPTIVES VARIABLES=${variables.join(' ')}\n  /STATISTICS=MEAN STDDEV MIN MAX.`,
      data: res,
    };
  },

  async runFrequencies(data: Record<string, any>[], variables: string[], valueLabels?: Record<string, Record<string, string>>): Promise<OutputItem | null> {
    const res = await postApi('/api/analyze/frequencies', { variables, data, value_labels: valueLabels });
    if (!res) return null;
    return {
      id: `freq_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      title: 'Frequencies',
      type: 'frequencies',
      syntax: `FREQUENCIES VARIABLES=${variables.join(' ')}\n  /ORDER=ANALYSIS.`,
      data: res,
    };
  },

  async runCrosstabs(data: Record<string, any>[], rowVar: string, colVar: string): Promise<OutputItem | null> {
    const res = await postApi('/api/analyze/crosstabs', { row_var: rowVar, col_var: colVar, data, display_expected: true, display_row_pct: true, display_col_pct: true });
    if (!res) return null;
    return {
      id: `ct_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      title: `${rowVar} * ${colVar} Crosstabulation`,
      type: 'crosstabs',
      syntax: `CROSSTABS\n  /TABLES=${rowVar} BY ${colVar}\n  /STATISTICS=CHISQ\n  /CELLS=COUNT EXPECTED ROW COLUMN TOTAL.`,
      data: res,
    };
  },

  async runCorrelations(data: Record<string, any>[], variables: string[], method: 'pearson' | 'spearman' = 'pearson'): Promise<OutputItem | null> {
    const res = await postApi('/api/analyze/correlations', { variables, data, method });
    if (!res) return null;
    return {
      id: `corr_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      title: 'Correlations',
      type: 'correlations',
      syntax: `CORRELATIONS\n  /VARIABLES=${variables.join(' ')}\n  /PRINT=TWOTAIL NOSIG.`,
      data: res,
    };
  },

  async runOneSampleTTest(data: Record<string, any>[], variables: string[], testValue: number = 0): Promise<OutputItem | null> {
    const res = await postApi('/api/analyze/t-test/one-sample', { variables, data, test_value: testValue });
    if (!res) return null;
    return {
      id: `ttest1_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      title: 'One-Sample T Test',
      type: 'one_sample_t_test',
      syntax: `T-TEST\n  /TESTVAL=${testValue}\n  /VARIABLES=${variables.join(' ')}.`,
      data: res,
    };
  },

  async runIndependentTTest(data: Record<string, any>[], testVariables: string[], groupVariable: string, group1Val: any, group2Val: any): Promise<OutputItem | null> {
    const res = await postApi('/api/analyze/t-test/independent', { test_variables: testVariables, group_variable: groupVariable, group1_val: group1Val, group2_val: group2Val, data });
    if (!res) return null;
    return {
      id: `ttest_ind_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      title: 'Independent Samples Test',
      type: 'independent_t_test',
      syntax: `T-TEST GROUPS=${groupVariable}('${group1Val}' '${group2Val}')\n  /VARIABLES=${testVariables.join(' ')}.`,
      data: res,
    };
  },

  async runPairedTTest(data: Record<string, any>[], pairs: [string, string][]): Promise<OutputItem | null> {
    const res = await postApi('/api/analyze/t-test/paired', { pairs, data });
    if (!res) return null;
    return {
      id: `ttest_pair_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      title: 'Paired Samples Test',
      type: 'paired_t_test',
      syntax: `T-TEST PAIRS=${pairs.map((p) => `${p[0]} WITH ${p[1]}`).join(' ')} (PAIRED).`,
      data: res,
    };
  },

  async runOneWayAnova(data: Record<string, any>[], dependentVariable: string, factorVariable: string, runPostHoc: boolean = true): Promise<OutputItem | null> {
    const res = await postApi('/api/analyze/anova', { dependent_variable: dependentVariable, factor_variable: factorVariable, data, run_post_hoc: runPostHoc });
    if (!res) return null;
    return {
      id: `anova_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      title: 'One-Way ANOVA',
      type: 'one_way_anova',
      syntax: `ONEWAY ${dependentVariable} BY ${factorVariable}\n  /STATISTICS DESCRIPTIVES\n  /POSTHOC=TUKEY.`,
      data: res,
    };
  },

  async runLinearRegression(data: Record<string, any>[], dependentVariable: string, independentVariables: string[]): Promise<OutputItem | null> {
    const res = await postApi('/api/analyze/regression', { dependent_variable: dependentVariable, independent_variables: independentVariables, data });
    if (!res) return null;
    return {
      id: `reg_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      title: 'Linear Regression',
      type: 'linear_regression',
      syntax: `REGRESSION\n  /DEPENDENT ${dependentVariable}\n  /METHOD=ENTER ${independentVariables.join(' ')}.`,
      data: res,
    };
  },

  async runReliability(data: Record<string, any>[], items: string[]): Promise<OutputItem | null> {
    const res = await postApi('/api/analyze/reliability', { data, items });
    if (!res) return null;
    return {
      id: `rel_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      title: 'Reliability Statistics',
      type: 'reliability',
      syntax: `RELIABILITY /VARIABLES=${items.join(' ')}\n  /SCALE('ALL VARIABLES') ALL\n  /MODEL=ALPHA.`,
      data: res,
    };
  },

  async runNonparametric(data: Record<string, any>[], testType: 'mann_whitney' | 'wilcoxon' | 'kruskal_wallis', params: Record<string, any>): Promise<OutputItem | null> {
    const res = await postApi('/api/analyze/nonparametric', { test_type: testType, data, ...params });
    if (!res) return null;
    return {
      id: `npar_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      title: testType === 'mann_whitney' ? 'Mann-Whitney Test' : testType === 'wilcoxon' ? 'Wilcoxon Signed Ranks Test' : 'Kruskal-Wallis Test',
      type: testType,
      syntax: `NPAR TESTS /${testType.toUpperCase()}.`,
      data: res,
    };
  },

  async runSyntax(syntaxText: string, data: Record<string, any>[]): Promise<OutputItem[] | null> {
    const res = await postApi('/api/analyze/syntax', { syntax: syntaxText, data });
    if (!res || !Array.isArray(res)) return null;
    return res.map((r: any, idx: number) => ({
      id: `syntax_res_${Date.now()}_${idx}`,
      timestamp: new Date().toLocaleTimeString(),
      title: r.title || 'SPSS Command Output',
      type: r.type || 'descriptives',
      syntax: syntaxText,
      data: r,
    }));
  },
};
