import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  clientComputeDescriptives,
  clientComputeFrequencies,
  clientComputeCorrelations,
  clientComputeOneSampleTTest,
  clientComputeIndependentTTest,
  clientComputePairedTTest,
} from '../src/utils/clientStats';
import { VariableMeta } from '../src/types/spss';

describe('Statistical Engine Audit & Verification', () => {

  // =========================================================================
  // 1. DESCRIPTIVE STATISTICS
  // =========================================================================
  describe('1. Descriptive Statistics', () => {
    const rows = [
      { id: 1, score: 10 },
      { id: 2, score: 12 },
      { id: 3, score: 14 },
      { id: 4, score: 15 },
      { id: 5, score: 17 },
      { id: 6, score: 18 },
      { id: 7, score: 18 },
      { id: 8, score: 20 },
      { id: 9, score: 22 },
      { id: 10, score: 24 },
    ];

    it('computes exact benchmark descriptive statistics on clean sample (N=10)', () => {
      const out = clientComputeDescriptives(rows, ['score']);
      assert.equal(out.type, 'descriptives');
      const r = out.data.rows[0];

      assert.equal(r.valid_n, 10);
      assert.equal(r.missing_n, 0);
      assert.equal(r.mean, 17.0);
      assert.equal(r.median, 17.5);
      assert.equal(r.min, 10.0);
      assert.equal(r.max, 24.0);
      assert.equal(r.range, 14.0);
      // Sample variance: 172 / 9 = 19.1111
      assert.equal(r.variance, 19.1111);
      // Std Dev: sqrt(172/9) = 4.3716
      assert.equal(r.std_dev, 4.3716);
      // Std Error of Mean: 4.3716 / sqrt(10) = 1.3824
      assert.equal(r.se_mean, 1.3824);
      // Skewness and Kurtosis should be numbers
      assert.notEqual(r.skewness, null);
      assert.notEqual(r.kurtosis, null);
      assert.notEqual(r.se_skewness, null);
      assert.notEqual(r.se_kurtosis, null);
      assert.equal(out.data.valid_n_listwise, 10);
    });

    it('properly filters system-missing and user-defined missing values (discrete & range)', () => {
      const varMeta: VariableMeta[] = [
        {
          name: 'score',
          label: 'Test Score',
          type: 'Numeric',
          width: 8,
          decimals: 2,
          missing: '99',
          values: {},
          columns: 8,
          align: 'Right',
          measure: 'Scale',
          role: 'Input',
        },
      ];

      const dirtyRows = [
        { score: 10 },
        { score: '.' },      // System missing
        { score: null },     // System missing
        { score: '' },       // System missing
        { score: 'invalid' },// Invalid type
        { score: 99 },       // User-missing discrete "99"
        { score: 20 },
      ];

      const out = clientComputeDescriptives(dirtyRows, ['score'], null, varMeta);
      const r = out.data.rows[0];
      // Only 10 and 20 are valid
      assert.equal(r.valid_n, 2);
      assert.equal(r.missing_n, 5);
      assert.equal(r.mean, 15.0);
      assert.equal(r.variance, 50.0); // ( (10-15)^2 + (20-15)^2 ) / 1 = 50.0
      assert.equal(r.std_dev, 7.0711);
      assert.equal(out.data.valid_n_listwise, 2);
    });

    it('handles edge case N=0 returning nulls for all moments without crashing', () => {
      const out = clientComputeDescriptives([], ['score']);
      const r = out.data.rows[0];
      assert.equal(r.valid_n, 0);
      assert.equal(r.mean, null);
      assert.equal(r.variance, null);
      assert.equal(r.std_dev, null);
      assert.equal(r.se_mean, null);
      assert.equal(r.skewness, null);
      assert.equal(r.kurtosis, null);
      assert.equal(out.data.valid_n_listwise, 0);
    });

    it('handles edge case N=1 returning mean and min/max but null variance/stddev', () => {
      const out = clientComputeDescriptives([{ score: 42 }], ['score']);
      const r = out.data.rows[0];
      assert.equal(r.valid_n, 1);
      assert.equal(r.mean, 42.0);
      assert.equal(r.min, 42.0);
      assert.equal(r.max, 42.0);
      assert.equal(r.range, 0.0);
      assert.equal(r.variance, null);
      assert.equal(r.std_dev, null);
      assert.equal(r.se_mean, null);
      assert.equal(r.skewness, null);
      assert.equal(r.kurtosis, null);
    });

    it('handles zero variance (constant values) returning variance=0 and null skewness/kurtosis', () => {
      const constantRows = [{ score: 5 }, { score: 5 }, { score: 5 }, { score: 5 }];
      const out = clientComputeDescriptives(constantRows, ['score']);
      const r = out.data.rows[0];
      assert.equal(r.valid_n, 4);
      assert.equal(r.mean, 5.0);
      assert.equal(r.variance, 0.0);
      assert.equal(r.std_dev, 0.0);
      assert.equal(r.se_mean, 0.0);
      assert.equal(r.range, 0.0);
      // Skewness and kurtosis are undefined (division by s=0)
      assert.equal(r.skewness, null);
      assert.equal(r.kurtosis, null);
    });
  });

  // =========================================================================
  // 2. FREQUENCIES
  // =========================================================================
  describe('2. Frequencies', () => {
    it('computes frequencies, valid percent, and cumulative percent accurately', () => {
      const rows = [
        { gender: 'm' },
        { gender: 'm' },
        { gender: 'm' },
        { gender: 'f' },
        { gender: 'f' },
      ];
      const out = clientComputeFrequencies(rows, ['gender']);
      const t = out.data.tables[0];
      assert.equal(t.total_valid, 5);
      assert.equal(t.total_missing, 0);
      assert.equal(t.total, 5);

      // 'f': count 2 (40.0%), 'm': count 3 (60.0%)
      const fRow = t.rows.find((r: any) => r.value === 'f');
      const mRow = t.rows.find((r: any) => r.value === 'm');
      assert.equal(fRow.frequency, 2);
      assert.equal(fRow.percent, 40.0);
      assert.equal(fRow.valid_percent, 40.0);
      assert.equal(fRow.cumulative_percent, 40.0);

      assert.equal(mRow.frequency, 3);
      assert.equal(mRow.percent, 60.0);
      assert.equal(mRow.valid_percent, 60.0);
      assert.equal(mRow.cumulative_percent, 100.0);
    });

    it('separates user-missing from system-missing categories and computes valid percent over valid total', () => {
      const varMeta: VariableMeta[] = [
        {
          name: 'satisfaction',
          label: 'Customer Satisfaction',
          type: 'Numeric',
          width: 8,
          decimals: 0,
          missing: '99',
          values: { '1': 'Dissatisfied', '2': 'Satisfied', '99': 'No Answer' },
          columns: 8,
          align: 'Right',
          measure: 'Ordinal',
          role: 'Input',
        },
      ];

      const rows = [
        { satisfaction: 1 },
        { satisfaction: 1 },
        { satisfaction: 2 },
        { satisfaction: 2 },
        { satisfaction: 99 },  // User-missing
        { satisfaction: '.' }, // System-missing
      ];

      const out = clientComputeFrequencies(rows, ['satisfaction'], {}, null, varMeta);
      const t = out.data.tables[0];
      assert.equal(t.total_valid, 4);
      assert.equal(t.total_missing, 2);
      assert.equal(t.total, 6);

      // Valid Percent: 2 / 4 = 50.0% each, Percent: 2 / 6 = 33.3%
      const r1 = t.rows.find((r: any) => r.value === '1');
      assert.equal(r1.label, 'Dissatisfied');
      assert.equal(r1.frequency, 2);
      assert.equal(r1.percent, 33.3);
      assert.equal(r1.valid_percent, 50.0);
      assert.equal(r1.cumulative_percent, 50.0);

      // Missing rows
      assert.equal(t.missing_rows.length, 2);
      const userMissing = t.missing_rows.find((mr: any) => mr.value === '99');
      const sysMissing = t.missing_rows.find((mr: any) => mr.value === '.');
      assert.equal(userMissing.label, 'No Answer');
      assert.equal(userMissing.frequency, 1);
      assert.equal(userMissing.is_user_missing, true);
      assert.equal(sysMissing.label, 'System');
      assert.equal(sysMissing.frequency, 1);
      assert.equal(sysMissing.is_user_missing, false);
    });

    it('handles all rows missing gracefully without division by zero', () => {
      const rows = [{ val: '.' }, { val: null }, { val: '' }];
      const out = clientComputeFrequencies(rows, ['val']);
      const t = out.data.tables[0];
      assert.equal(t.total_valid, 0);
      assert.equal(t.total_missing, 3);
      assert.equal(t.valid_percent_total, null);
    });
  });

  // =========================================================================
  // 3. PEARSON CORRELATION
  // =========================================================================
  describe('3. Pearson Correlation', () => {
    const x = [10, 12, 14, 15, 17, 18, 18, 20, 22, 24];
    const y = [15, 18, 20, 21, 24, 25, 27, 28, 30, 32];
    const rows = x.map((xv, i) => ({ x: xv, y: y[i] }));

    it('computes exact Pearson correlation coefficient, df, and significance matching SPSS', () => {
      const out = clientComputeCorrelations(rows, ['x', 'y']);
      assert.equal(out.type, 'correlations');

      // Diagonal self-correlation: r = 1.0, sig = null
      const selfCorr = out.data.matrix[0].correlations[0];
      assert.equal(selfCorr.var1, 'x');
      assert.equal(selfCorr.var2, 'x');
      assert.equal(selfCorr.coefficient, 1.0);
      assert.equal(selfCorr.sig_2_tailed, null);
      assert.equal(selfCorr.n, 10);

      // Off-diagonal correlation: r = 0.992, sig < 0.001
      const xyCorr = out.data.matrix[0].correlations[1];
      assert.equal(xyCorr.var1, 'x');
      assert.equal(xyCorr.var2, 'y');
      assert.equal(xyCorr.coefficient, 0.992);
      assert.equal(xyCorr.sig_2_tailed, 0.0);
      assert.equal(xyCorr.flag, '**');
      assert.equal(xyCorr.n, 10);
    });

    it('handles zero-variance constant column reporting coefficient=null and constant footnote', () => {
      const constRows = [
        { x: 10, y: 5 },
        { x: 12, y: 5 },
        { x: 14, y: 5 },
        { x: 16, y: 5 },
      ];
      const out = clientComputeCorrelations(constRows, ['x', 'y']);
      const xyCorr = out.data.matrix[0].correlations[1];
      assert.equal(xyCorr.coefficient, null);
      assert.equal(xyCorr.sig_2_tailed, null);
      assert.equal(xyCorr.is_constant, true);
      assert.ok(out.data.notes.some((n: string) => n.includes('Cannot be computed because at least one of the variables is constant')));
    });

    it('handles N < 3 returning null significance', () => {
      const smallRows = [{ x: 1, y: 2 }, { x: 3, y: 4 }];
      const out = clientComputeCorrelations(smallRows, ['x', 'y']);
      const xyCorr = out.data.matrix[0].correlations[1];
      assert.equal(xyCorr.coefficient, 1.0);
      assert.equal(xyCorr.sig_2_tailed, null); // df = 0, cannot test
      assert.equal(xyCorr.n, 2);
    });

    it('filters user-missing values before correlation calculation', () => {
      const varMeta: VariableMeta[] = [
        {
          name: 'x',
          label: 'X',
          type: 'Numeric',
          width: 8,
          decimals: 2,
          missing: '999',
          values: {},
          columns: 8,
          align: 'Right',
          measure: 'Scale',
          role: 'Input',
        },
      ];
      const rowsWithMissing = [
        { x: 10, y: 15 },
        { x: 12, y: 18 },
        { x: 999, y: 100 }, // User-missing in x
        { x: 14, y: 20 },
        { x: 16, y: 22 },
      ];
      const out = clientComputeCorrelations(rowsWithMissing, ['x', 'y'], varMeta);
      const xyCorr = out.data.matrix[0].correlations[1];
      assert.equal(xyCorr.n, 4); // 999 excluded
      assert.notEqual(xyCorr.coefficient, null);
    });
  });

  // =========================================================================
  // 4. ONE-SAMPLE T-TEST
  // =========================================================================
  describe('4. One-Sample T-Test', () => {
    const rows = [
      { x: 10 },
      { x: 12 },
      { x: 14 },
      { x: 15 },
      { x: 17 },
      { x: 18 },
      { x: 18 },
      { x: 20 },
      { x: 22 },
      { x: 24 },
    ];

    it('computes exact One-Sample t, df, sig, and 95% CI matching theoretical values against test value 15', () => {
      const out = clientComputeOneSampleTTest(rows, ['x'], 15);
      assert.equal(out.type, 'one_sample_t_test');

      const desc = out.data.descriptives[0];
      assert.equal(desc.n, 10);
      assert.equal(desc.mean, 17.0);
      assert.equal(desc.std_dev, 4.3716);
      assert.equal(desc.se_mean, 1.3824);

      const res = out.data.test_results[0];
      assert.equal(res.test_value, 15);
      assert.equal(res.df, 9);
      assert.equal(res.mean_difference, 2.0);
      // t = 2.0 / 1.3824 = 1.447
      assert.equal(res.t, 1.447);
      // p = 0.1819
      assert.equal(res.sig_2_tailed, 0.1819);
      // 95% CI: [-1.1273, 5.1273]
      assert.equal(res.ci_lower, -1.1273);
      assert.equal(res.ci_upper, 5.1273);
    });

    it('handles zero variance (constant values) reporting null t and informative note', () => {
      const constRows = [{ x: 5 }, { x: 5 }, { x: 5 }, { x: 5 }];
      const out = clientComputeOneSampleTTest(constRows, ['x'], 10);
      const res = out.data.test_results[0];
      assert.equal(res.t, null);
      assert.equal(res.sig_2_tailed, null);
      assert.equal(res.ci_lower, null);
      assert.equal(res.ci_upper, null);
      assert.ok(res.note.includes('standard deviation is 0'));
    });

    it('handles N < 2 gracefully without throwing', () => {
      const singleRow = [{ x: 42 }];
      const out = clientComputeOneSampleTTest(singleRow, ['x'], 0);
      const res = out.data.test_results[0];
      assert.equal(res.t, null);
      assert.equal(res.df, null);
      assert.equal(res.sig_2_tailed, null);
    });
  });

  // =========================================================================
  // 5. INDEPENDENT SAMPLES T-TEST
  // =========================================================================
  describe('5. Independent Samples T-Test', () => {
    const rows = [
      { grp: '1', score: 10 },
      { grp: '1', score: 12 },
      { grp: '1', score: 14 },
      { grp: '1', score: 15 },
      { grp: '1', score: 17 },
      { grp: '2', score: 18 },
      { grp: '2', score: 18 },
      { grp: '2', score: 20 },
      { grp: '2', score: 22 },
      { grp: '2', score: 24 },
    ];

    it('computes exact Levene test, pooled t-test, Welch t-test, and 95% CI', () => {
      const out = clientComputeIndependentTTest(rows, ['score'], 'grp', '1', '2');
      assert.equal(out.type, 'independent_t_test');

      const gStats = out.data.group_statistics;
      assert.equal(gStats[0].group, '1');
      assert.equal(gStats[0].n, 5);
      assert.equal(gStats[0].mean, 13.6);
      assert.equal(gStats[0].std_dev, 2.7019);

      assert.equal(gStats[1].group, '2');
      assert.equal(gStats[1].n, 5);
      assert.equal(gStats[1].mean, 20.4);
      assert.equal(gStats[1].std_dev, 2.6077);

      const res = out.data.test_results[0];
      // Levene test F and sig
      assert.notEqual(res.levene_f, null);
      assert.notEqual(res.levene_sig, null);

      // Pooled test (Equal Variances Assumed)
      const eq = res.equal_var_assumed;
      assert.equal(eq.df, 8);
      assert.equal(eq.mean_diff, -6.8);
      assert.equal(eq.se_diff, 1.6793);
      assert.equal(eq.t, -4.049);
      assert.equal(eq.sig_2_tailed, 0.0037);
      assert.equal(eq.ci_lower, -10.6724);
      assert.equal(eq.ci_upper, -2.9276);

      // Welch test (Equal Variances Not Assumed)
      const welch = res.equal_var_not_assumed;
      assert.equal(welch.df, 7.99);
      assert.equal(welch.t, -4.049);
      assert.equal(welch.sig_2_tailed, 0.0037);
    });

    it('handles zero variance in both groups returning null Levene and null t-statistics', () => {
      const constRows = [
        { grp: '1', score: 5 },
        { grp: '1', score: 5 },
        { grp: '1', score: 5 },
        { grp: '2', score: 5 },
        { grp: '2', score: 5 },
        { grp: '2', score: 5 },
      ];
      const out = clientComputeIndependentTTest(constRows, ['score'], 'grp', '1', '2');
      const res = out.data.test_results[0];
      assert.equal(res.levene_f, null);
      assert.equal(res.levene_sig, null);
      assert.equal(res.equal_var_assumed.t, null);
      assert.equal(res.equal_var_assumed.sig_2_tailed, null);
      assert.equal(res.equal_var_not_assumed.t, null);
      assert.equal(res.equal_var_not_assumed.sig_2_tailed, null);
    });

    it('filters missing group values and handles insufficient group observations', () => {
      const dirtyRows = [
        { grp: '1', score: 10 },
        { grp: '.', score: 20 }, // Missing group
        { grp: '2', score: 15 }, // Only 1 row in group 2
      ];
      const out = clientComputeIndependentTTest(dirtyRows, ['score'], 'grp', '1', '2');
      const res = out.data.test_results[0];
      assert.equal(res.equal_var_assumed.t, null);
      assert.equal(res.equal_var_assumed.df, null);
    });
  });

  // =========================================================================
  // 6. PAIRED SAMPLES T-TEST
  // =========================================================================
  describe('6. Paired Samples T-Test', () => {
    const x = [10, 12, 14, 15, 17, 18, 18, 20, 22, 24];
    const y = [15, 18, 20, 21, 24, 25, 27, 28, 30, 32];
    const rows = x.map((xv, i) => ({ pre: xv, post: y[i] }));

    it('computes exact paired differences, paired correlation, t, df, and 95% CI', () => {
      const out = clientComputePairedTTest(rows, [['post', 'pre']]);
      assert.equal(out.type, 'paired_t_test');

      // Paired Statistics
      const stat1 = out.data.paired_statistics[0];
      const stat2 = out.data.paired_statistics[1];
      assert.equal(stat1.variable, 'post');
      assert.equal(stat1.mean, 24.0);
      assert.equal(stat1.n, 10);
      assert.equal(stat2.variable, 'pre');
      assert.equal(stat2.mean, 17.0);
      assert.equal(stat2.n, 10);

      // Paired Correlation
      const corr = out.data.paired_correlations[0];
      assert.equal(corr.correlation, 0.992);
      assert.equal(corr.sig, 0.0);

      // Paired Differences Test
      const diff = out.data.paired_differences[0];
      assert.equal(diff.mean, 7.0);
      assert.equal(diff.std_dev, 1.2472);
      assert.equal(diff.se_mean, 0.3944);
      assert.equal(diff.df, 9);
      assert.equal(diff.t, 17.748);
      assert.equal(diff.sig_2_tailed, 0.0);
      assert.equal(diff.ci_lower, 6.1078);
      assert.equal(diff.ci_upper, 7.8922);
    });

    it('handles identical paired values (s_diff = 0) returning null t', () => {
      const constDiffRows = [
        { pre: 10, post: 15 },
        { pre: 12, post: 17 },
        { pre: 14, post: 19 },
      ]; // Differences are always 5, so variance of difference is 0
      const out = clientComputePairedTTest(constDiffRows, [['post', 'pre']]);
      const diff = out.data.paired_differences[0];
      assert.equal(diff.mean, 5.0);
      assert.equal(diff.std_dev, 0);
      assert.equal(diff.se_mean, 0);
      assert.equal(diff.t, null);
      assert.equal(diff.sig_2_tailed, null);
    });

    it('filters missing pairs pairwise and handles n < 2 gracefully', () => {
      const rowsWithMissing = [
        { pre: 10, post: 15 },
        { pre: '.', post: 18 }, // Invalid pre
        { pre: 12, post: null }, // Invalid post
      ];
      const out = clientComputePairedTTest(rowsWithMissing, [['pre', 'post']]);
      const stat = out.data.paired_statistics[0];
      assert.equal(stat.n, 1);
      const diff = out.data.paired_differences[0];
      assert.equal(diff.t, null);
      assert.equal(diff.df, null);
    });
  });

});
