import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeFisherExact2x2,
  computeLinearByLinearAssociation,
  computeSymmetricMeasures,
  computeRiskEstimates,
  computeSpearmanCorrelation,
  computeKendallTauB,
  computeRanks,
} from '../src/utils/statsMath';
import {
  clientComputeCrosstabs,
  clientComputeCorrelations,
} from '../src/utils/clientStats';
import { buildExcelWorkbook } from '../src/utils/exportUtils';

describe('IBM SPSS Statistics Parity & Verification Suite', () => {
  // Benchmark 2x2 Contingency Table (Case REF-CROSSTAB-001)
  // Rows: Drug A vs Placebo, Columns: Recovered vs Not Recovered
  // [ [30, 10],   row sum = 40
  //   [15, 25] ]  row sum = 40
  // col sum: 45, 35. Grand Total = 80
  const rows2x2: Record<string, any>[] = [];
  for (let i = 0; i < 30; i++) rows2x2.push({ treatment: 'Drug A', outcome: 'Recovered' });
  for (let i = 0; i < 10; i++) rows2x2.push({ treatment: 'Drug A', outcome: 'Not Recovered' });
  for (let i = 0; i < 15; i++) rows2x2.push({ treatment: 'Placebo', outcome: 'Recovered' });
  for (let i = 0; i < 25; i++) rows2x2.push({ treatment: 'Placebo', outcome: 'Not Recovered' });

  describe('1. 2x2 Contingency Table & Chi-Square Parity', () => {
    it('computes Pearson, Yates continuity correction, and Likelihood Ratio matching benchmark', () => {
      const out = clientComputeCrosstabs(rows2x2, 'treatment', 'outcome', null, {
        chiSquare: true,
        linearByLinear: true,
        phiCramer: true,
        contingencyCoeff: true,
        riskEstimate: true,
      });

      assert.equal(out.type, 'crosstabs');
      const data = out.data;
      assert.equal(data.grand_total, 80);

      // Verify Case Summary
      assert.ok(data.case_summary, 'Case processing summary must be present');
      assert.equal(data.case_summary.valid, 80);
      assert.equal(data.case_summary.valid_percent, 100);
      assert.equal(data.case_summary.missing, 0);

      // Verify Chi-Square Tests
      assert.ok(data.chi_square_tests, 'Chi-square tests must be present');
      const tests = data.chi_square_tests;

      // 1. Pearson Chi-Square: 11.429, df = 1, p = 0.000723
      const pearson = tests.find((t: any) => t.test.includes('Pearson Chi-Square'));
      assert.ok(pearson, 'Pearson Chi-Square must exist');
      assert.equal(pearson.value, 11.429);
      assert.equal(pearson.df, 1);
      assert.equal(pearson.asymp_sig_2_sided, 0.0007);

      // 2. Continuity Correction (Yates): 9.956, df = 1, p = 0.0016
      const yates = tests.find((t: any) => t.test.includes('Continuity Correction'));
      assert.ok(yates, 'Continuity Correction must exist for 2x2');
      assert.equal(yates.value, 9.956);
      assert.equal(yates.df, 1);
      assert.equal(yates.asymp_sig_2_sided, 0.0016);

      // 3. Likelihood Ratio: 11.738, df = 1, p = 0.0006
      const lr = tests.find((t: any) => t.test.includes('Likelihood Ratio'));
      assert.ok(lr, 'Likelihood Ratio must exist');
      assert.equal(lr.value, 11.738);
      assert.equal(lr.df, 1);
      assert.equal(lr.asymp_sig_2_sided, 0.0006);

      // 4. Fisher's Exact Test: exact 2-sided = 0.0014, 1-sided = 0.0007
      const fisher = tests.find((t: any) => t.test.includes("Fisher's Exact Test"));
      assert.ok(fisher, "Fisher's Exact Test must exist for 2x2 table");
      assert.equal(fisher.exact_sig_2_sided, 0.0014);
      assert.equal(fisher.exact_sig_1_sided, 0.0007);

      // 5. Linear-by-Linear Association: 11.286, df = 1, p = 0.000781
      const lbl = tests.find((t: any) => t.test.includes('Linear-by-Linear Association'));
      assert.ok(lbl, 'Linear-by-Linear Association must exist');
      assert.equal(lbl.value, 11.286);
      assert.equal(lbl.df, 1);
      assert.equal(lbl.asymp_sig_2_sided, 0.0008);

      // 6. Cell counts footnote
      assert.ok(data.chi_square_footnote, 'Cell count warning footnote must be present');
      assert.ok(data.chi_square_footnote.includes('0 cells (0.0%) have expected count less than 5'));
      assert.ok(data.chi_square_footnote.includes('The minimum expected count is 17.50'));
    });

    it('computes exact Fisher 2x2 probabilities using hypergeometric distribution', () => {
      // Benchmark table:
      // a=30, b=10, c=15, d=25
      const res = computeFisherExact2x2(30, 10, 15, 25);
      assert.equal(res.twoSided, 0.0014);
      assert.equal(res.oneSided, 0.0007);
    });

    it('computes Linear-by-Linear Association M^2 = (N-1)*r^2', () => {
      // 2x2 with table [ [30, 10], [15, 25] ], N=80
      // In a 2x2 table, r^2 = Pearson ChiSquare / N = 11.42857 / 80 = 0.142857
      // M^2 = (N - 1) * r^2 = 79 * (11.42857 / 80) = 11.2857
      const lbl = computeLinearByLinearAssociation([ [30, 10], [15, 25] ]);
      assert.ok(lbl);
      assert.equal(lbl.value, 11.286);
      assert.equal(lbl.df, 1);
      assert.equal(lbl.sig, 0.0008);
    });
  });

  describe('2. Symmetric Measures & Risk Estimates', () => {
    it('computes exact Phi, Cramer V, and Contingency Coefficient for 2x2 table', () => {
      // ChiSquare = 11.4286, N = 80
      // Phi = sqrt(11.4286 / 80) = 0.378
      // Cramer's V = 0.378
      // Contingency Coefficient C = sqrt(11.4286 / (11.4286 + 80)) = 0.354
      const sym = computeSymmetricMeasures(11.42857, 80, 2, 2);
      assert.equal(sym.phi, 0.378);
      assert.equal(sym.cramersV, 0.378);
      assert.equal(sym.contingencyCoeff, 0.354);
      assert.equal(sym.approxSig, 0.0007);
    });

    it('computes Odds Ratio and Cohort Relative Risks with 95% confidence intervals', () => {
      // a=30, b=10, c=15, d=25
      // Odds Ratio = (30 * 25) / (10 * 15) = 750 / 150 = 5.000
      // ln(OR) = 1.6094, SE(ln(OR)) = sqrt(1/30 + 1/10 + 1/15 + 1/25) = sqrt(0.24) = 0.4899
      // 95% CI: exp(1.6094 +/- 1.96 * 0.4899) = exp([0.6492, 2.5696]) = [1.914, 13.061]
      // Cohort RR (outcome 1): (30/40) / (15/40) = 0.75 / 0.375 = 2.000
      // SE(ln(RR1)) = sqrt((1-0.75)/30 + (1-0.375)/15) = sqrt(0.00833 + 0.04167) = sqrt(0.05) = 0.2236
      // 95% CI: exp(ln(2) +/- 1.96 * 0.2236) = exp([0.2549, 1.1314]) = [1.290, 3.100]
      // Cohort RR (outcome 2): (10/40) / (25/40) = 0.25 / 0.625 = 0.400
      // 95% CI: [0.222, 0.720]
      const risk = computeRiskEstimates(30, 10, 15, 25, 'Drug A', 'Placebo', 'Recovered', 'Not Recovered');
      assert.equal(risk.length, 3);

      const orEst = risk[0];
      assert.ok(orEst.statistic.includes('Odds Ratio'));
      assert.equal(orEst.value, 5.0);
      assert.equal(orEst.ciLower, 1.914);
      assert.equal(orEst.ciUpper, 13.061);

      const rr1Est = risk[1];
      assert.ok(rr1Est.statistic.includes('Recovered'));
      assert.equal(rr1Est.value, 2.0);
      assert.equal(rr1Est.ciLower, 1.29);
      assert.equal(rr1Est.ciUpper, 3.1);

      const rr2Est = risk[2];
      assert.ok(rr2Est.statistic.includes('Not Recovered'));
      assert.equal(rr2Est.value, 0.4);
      assert.equal(rr2Est.ciLower, 0.222);
      assert.equal(rr2Est.ciUpper, 0.72);
    });
  });

  describe('3. Nonparametric Rank Correlations (Spearman rho & Kendall tau-b)', () => {
    it('computes tie-adjusted fractional ranks accurately', () => {
      // 10, 20, 20, 30 -> ranks 1, 2.5, 2.5, 4
      const ranks = computeRanks([10, 20, 20, 30]);
      assert.deepEqual(ranks, [1, 2.5, 2.5, 4]);
    });

    it('computes Spearman rank correlation coefficient and p-value', () => {
      // Benchmark pairs: monotonic with ties
      const pairs: [number, number][] = [
        [1, 2],
        [2, 3],
        [3, 5],
        [4, 4],
        [5, 6],
        [6, 7],
        [7, 8],
        [8, 9],
      ];
      const res = computeSpearmanCorrelation(pairs, true);
      assert.equal(res.n, 8);
      assert.equal(res.coefficient, 0.976);
      assert.ok(res.sig !== null && res.sig < 0.001);
    });

    it('computes Kendall tau-b rank correlation coefficient and asymptotic p-value', () => {
      const pairs: [number, number][] = [
        [1, 2],
        [2, 3],
        [3, 5],
        [4, 4],
        [5, 6],
        [6, 7],
        [7, 8],
        [8, 9],
      ];
      const res = computeKendallTauB(pairs, true);
      assert.equal(res.n, 8);
      assert.equal(res.coefficient, 0.929);
      assert.ok(res.sig !== null && res.sig < 0.005);
    });

    it('executes clientComputeCorrelations with both Pearson, Spearman, and Kendall', () => {
      const rows = [
        { x: 10, y: 15 },
        { x: 20, y: 25 },
        { x: 30, y: 28 },
        { x: 40, y: 42 },
        { x: 50, y: 55 },
      ];
      const out = clientComputeCorrelations(rows, ['x', 'y'], undefined, {
        pearson: true,
        spearman: true,
        kendall: true,
        twoTailed: true,
        flagSignificant: true,
      });

      assert.equal(out.type, 'correlations');
      assert.ok(out.data.pearson_matrix, 'Pearson matrix must exist');
      assert.ok(out.data.spearman_matrix, 'Spearman matrix must exist');
      assert.ok(out.data.kendall_matrix, 'Kendall matrix must exist');

      // Verify off-diagonal
      const pXY = out.data.pearson_matrix[0].correlations[1];
      const sXY = out.data.spearman_matrix[0].correlations[1];
      const kXY = out.data.kendall_matrix[0].correlations[1];

      assert.equal(pXY.coefficient, 0.981);
      assert.equal(sXY.coefficient, 1.0);
      assert.equal(kXY.coefficient, 1.0);
    });
  });

  describe('4. Multi-Table Excel Workbook Export for Crosstabs and Correlations', () => {
    it('exports all Crosstabs tables (Cases, Crosstab, ChiSquare, Symmetric, Risk) into dedicated sheets', () => {
      const ctOut = clientComputeCrosstabs(rows2x2, 'treatment', 'outcome', null, {
        chiSquare: true,
        linearByLinear: true,
        phiCramer: true,
        contingencyCoeff: true,
        riskEstimate: true,
        observed: true,
        expected: true,
        rowPct: true,
      });

      const wb = buildExcelWorkbook([ctOut], 'Survey_Data');
      assert.ok(wb.SheetNames.length >= 4, 'Workbook must contain at least 4 sheets for comprehensive crosstabs');
      assert.ok(wb.SheetNames.some((n) => n.startsWith('Cases_')), 'Cases sheet must exist');
      assert.ok(wb.SheetNames.some((n) => n.startsWith('Crosstab_')), 'Crosstab sheet must exist');
      assert.ok(wb.SheetNames.some((n) => n.startsWith('ChiSquare_')), 'ChiSquare sheet must exist');
      assert.ok(wb.SheetNames.some((n) => n.startsWith('Symmetric_')), 'Symmetric sheet must exist');
      assert.ok(wb.SheetNames.some((n) => n.startsWith('Risk_')), 'Risk sheet must exist');
    });

    it('exports both parametric and nonparametric correlation sheets', () => {
      const corrOut = clientComputeCorrelations(
        [
          { a: 1, b: 2 },
          { a: 2, b: 4 },
          { a: 3, b: 5 },
          { a: 4, b: 8 },
        ],
        ['a', 'b'],
        undefined,
        { pearson: true, spearman: true, kendall: true }
      );

      const wb = buildExcelWorkbook([corrOut], 'Survey_Data');
      assert.ok(wb.SheetNames.some((n) => n.startsWith('Correlations_')), 'Pearson correlations sheet must exist');
      assert.ok(wb.SheetNames.some((n) => n.startsWith('Nonpar_Corr_')), 'Nonparametric correlations sheet must exist');
    });
  });
});
