import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  clientComputeDescriptives,
  clientComputeFrequencies,
  clientComputeAnova,
  clientComputeReliability,
  clientComputeCrosstabs,
  clientComputeExplore,
  clientComputeFactorAnalysis,
  clientComputeLinearRegression,
} from '../src/utils/clientStats';
import { getOutlineNodes, formatSig } from '../src/components/OutputViewer';

describe('SPSS Output Parity Comprehensive Verification (13 Tasks)', () => {
  const sampleData = [
    { id: 1, salary: 10, educ: 1, gender: 'm', jobcat: '1' },
    { id: 2, salary: 20, educ: 2, gender: 'm', jobcat: '1' },
    { id: 3, salary: 30, educ: 2, gender: 'f', jobcat: '2' },
    { id: 4, salary: 40, educ: 3, gender: 'f', jobcat: '2' },
    { id: 5, salary: 50, educ: 3, gender: 'f', jobcat: '3' },
    { id: 6, salary: 60, educ: 4, gender: 'm', jobcat: '3' },
  ];

  // Task 1: Descriptives
  it('Task 1: Descriptives provides all columns: Range, Min, Max, Mean, StdDev, Variance, Skewness, Kurtosis', () => {
    const desc = clientComputeDescriptives(sampleData, ['salary']);
    assert.equal(desc.type, 'descriptives');
    const row = desc.data.rows[0];
    assert.equal(row.valid_n, 6);
    assert.equal(row.range, 50);
    assert.equal(row.min, 10);
    assert.equal(row.max, 60);
    assert.equal(row.mean, 35);
    assert.ok(typeof row.std_dev === 'number');
    assert.ok(typeof row.variance === 'number');
    assert.ok(typeof row.skewness === 'number');
    assert.ok(typeof row.se_skewness === 'number');
    assert.ok(typeof row.kurtosis === 'number');
    assert.ok(typeof row.se_kurtosis === 'number');
    assert.equal(desc.data.valid_n_listwise, 6);
  });

  // Task 2: Frequencies Statistics Summary Table
  it('Task 2: Frequencies computes complete 16+ statistics per variable and outline node exists', () => {
    const freq = clientComputeFrequencies(sampleData, ['salary']);
    assert.equal(freq.type, 'frequencies');
    const table = freq.data.tables[0];
    assert.equal(table.total_valid, 6);
    assert.equal(table.total_missing, 0);
    assert.equal(table.mean, 35);
    assert.equal(table.median, 35);
    assert.ok(table.mode !== null);
    assert.equal(table.range, 50);
    assert.equal(table.min, 10);
    assert.equal(table.max, 60);
    assert.equal(table.sum, 210);
    assert.equal(table.percentile_25, 22.5); // Linear interpolation
    assert.equal(table.percentile_50, 35);
    assert.equal(table.percentile_75, 47.5);
    assert.ok(typeof table.std_dev === 'number');
    assert.ok(typeof table.variance === 'number');

    // Outline node exists even for 1 variable
    const nodes = getOutlineNodes(freq);
    const statsNode = nodes.find((n) => n.id === `output-${freq.id}-table-stats-summary`);
    assert.ok(statsNode, 'Statistics summary node must appear for single and multi-variable frequencies');
  });

  // Task 3: Frequencies label vs value display
  it('Task 3: Frequencies maps label accurately', () => {
    const freq = clientComputeFrequencies(
      sampleData,
      ['gender'],
      { gender: { 'm': 'Male', 'f': 'Female' } }
    );
    const table = freq.data.tables[0];
    const maleRow = table.rows.find((r: any) => r.value === 'm');
    assert.ok(maleRow);
    assert.equal(maleRow.label, 'Male');
    assert.equal(maleRow.value, 'm');
  });

  // Task 4: ANOVA Descriptives Total Row
  it('Task 4: One-Way ANOVA Descriptives includes Total row', () => {
    const anova = clientComputeAnova(sampleData, 'salary', 'gender');
    const desc = anova.data.descriptives;
    const totalRow = desc.find((d: any) => d.group === 'Total');
    assert.ok(totalRow, 'Descriptives must have Total row');
    assert.equal(totalRow.n, 6);
    assert.equal(totalRow.mean, 35);
    assert.equal(totalRow.min, 10);
    assert.equal(totalRow.max, 60);
    assert.ok(totalRow.std_dev > 0);
    assert.ok(totalRow.se_mean > 0);
    assert.ok(totalRow.ci_lower !== null && totalRow.ci_upper !== null);
  });

  // Task 5: Reliability Case Processing Summary
  it('Task 5: Reliability output includes case processing summary metrics', () => {
    const rowsWithMissing = [
      { q1: 1, q2: 2, q3: 3 },
      { q1: 2, q2: 2, q3: 3 },
      { q1: 3, q2: 3, q3: 4 },
      { q1: null, q2: 3, q3: 4 }, // Excluded case
    ];
    const rel = clientComputeReliability(rowsWithMissing, ['q1', 'q2', 'q3']);
    assert.equal(rel.data.total_cases, 4);
    assert.equal(rel.data.n_cases, 3);
    assert.equal(rel.data.excluded_cases, 1);
    assert.equal(rel.data.valid_percent, 75.0);
    assert.equal(rel.data.excluded_percent, 25.0);

    const nodes = getOutlineNodes(rel);
    const caseSummaryNode = nodes.find((n) => n.id === `output-${rel.id}-table-case-summary`);
    const relNode = nodes.find((n) => n.id === `output-${rel.id}-table-reliability`);
    assert.ok(caseSummaryNode, 'Case Processing Summary outline node must exist');
    assert.ok(relNode, 'Reliability Statistics outline node must exist');
  });

  // Task 6: Crosstabs Symmetric Measures Category
  it('Task 6: Crosstabs symmetric measures includes category: Nominal by Nominal', () => {
    const cross = clientComputeCrosstabs(sampleData, 'gender', 'jobcat', null, {
      chiSquare: true,
      phiCramer: true,
    });
    const sym = cross.data.symmetric_measures;
    assert.ok(Array.isArray(sym) && sym.length >= 3);
    sym.forEach((m: any) => {
      assert.equal(m.category, 'Nominal by Nominal');
    });
  });

  // Task 7 & Task 9: Explore Quartile Linear Interpolation & SE Skewness/Kurtosis
  it('Task 7 & 9: Explore computes linear interpolation quartiles and SE skewness/kurtosis', () => {
    const explore = clientComputeExplore(sampleData, ['salary']);
    const desc = explore.data.results.salary.descriptives;
    assert.equal(desc.median, 35);
    assert.equal(desc.interquartile_range, 25); // 47.5 - 22.5 = 25
    assert.ok(typeof desc.se_skewness === 'number' && desc.se_skewness > 0);
    assert.ok(typeof desc.se_kurtosis === 'number' && desc.se_kurtosis > 0);
  });

  // Task 8: Factor Analysis Extraction & Rotation Sums
  it('Task 8: Factor Analysis computes extraction and rotation sums in Total Variance Explained', () => {
    const factorData = [
      { x1: 1, x2: 2, x3: 5, x4: 6 },
      { x1: 2, x2: 1, x3: 6, x4: 5 },
      { x1: 5, x2: 6, x3: 1, x4: 2 },
      { x1: 6, x2: 5, x3: 2, x4: 1 },
      { x1: 3, x2: 4, x3: 4, x4: 3 },
      { x1: 4, x2: 3, x3: 3, x4: 4 },
    ];
    const fa = clientComputeFactorAnalysis(factorData, ['x1', 'x2', 'x3', 'x4']);
    const ve = fa.data.total_variance_explained;
    assert.ok(Array.isArray(ve) && ve.length === 4);
    assert.ok(typeof ve[0].extraction_total === 'number');
    assert.ok(typeof ve[0].extraction_percent === 'number');
    assert.ok(typeof ve[0].extraction_cumulative === 'number');
    assert.ok(typeof ve[0].rotation_total === 'number');
    assert.ok(typeof ve[0].rotation_percent === 'number');
    assert.ok(typeof ve[0].rotation_cumulative === 'number');
  });

  // Task 10: formatSig helper function
  it('Task 10: formatSig helper formats p-values consistently matching SPSS format', () => {
    assert.equal(formatSig(0), '<.001');
    assert.equal(formatSig(0.0001), '<.001');
    assert.equal(formatSig(0.0009), '<.001');
    assert.equal(formatSig(0.0456), '0.046');
    assert.equal(formatSig(0.5), '0.500');
    assert.equal(formatSig(null), '.');
    assert.equal(formatSig(undefined), '.');
    assert.equal(formatSig('< .001'), '<.001');
  });

  // Task 12: Linear Regression Dependent Variable & Predictors
  it('Task 12: Linear Regression passes dependent variable and predictors in data', () => {
    const reg = clientComputeLinearRegression(sampleData, 'salary', ['educ', 'id']);
    assert.equal(reg.data.dependent_variable, 'salary');
    assert.deepEqual(reg.data.independent_variables, ['educ', 'id']);
  });
});
