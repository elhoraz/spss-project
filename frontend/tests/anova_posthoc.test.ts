import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { clientComputeAnova } from '../src/utils/clientStats';
import { VariableMeta } from '../src/types/spss';

describe('One-Way ANOVA Post-Hoc Pairwise Comparisons Verification', () => {
  // Benchmark 3-group dataset with known theoretical properties:
  // Group 1: 10, 12, 14, 16 -> mean = 13.0, n = 4, SS1 = 20
  // Group 2: 20, 22, 24, 26 -> mean = 23.0, n = 4, SS2 = 20
  // Group 3: 30, 32, 34, 36 -> mean = 33.0, n = 4, SS3 = 20
  // Total N = 12, k = 3, df_between = 2, df_within = 9
  // MS_within = (20 + 20 + 20) / 9 = 6.6667
  // SE for any pair (n1=4, n2=4) = sqrt(6.6667 * (1/4 + 1/4)) = sqrt(3.3333) = 1.8257
  const benchmarkRows = [
    { group: '1', score: 10 },
    { group: '1', score: 12 },
    { group: '1', score: 14 },
    { group: '1', score: 16 },
    { group: '2', score: 20 },
    { group: '2', score: 22 },
    { group: '2', score: 24 },
    { group: '2', score: 26 },
    { group: '3', score: 30 },
    { group: '3', score: 32 },
    { group: '3', score: 34 },
    { group: '3', score: 36 },
  ];

  it('computes exact pairwise comparisons for all directed pairs (k*(k-1) = 6 rows)', () => {
    const res = clientComputeAnova(benchmarkRows, 'score', 'group', null, {
      tukey: true,
      significanceLevel: 0.05,
    });

    const data = res.data;
    assert.ok(data.post_hoc_tests, 'post_hoc_tests should be present');
    assert.equal(data.post_hoc_tests.length, 1);

    const tukeyTest = data.post_hoc_tests[0];
    assert.equal(tukeyTest.test_name, 'Tukey HSD');
    assert.equal(tukeyTest.alpha, 0.05);

    // 3 groups -> 3 * 2 = 6 pairwise rows
    assert.equal(tukeyTest.comparisons.length, 6);

    // Verify pairs: (1,2), (1,3), (2,1), (2,3), (3,1), (3,2)
    const pair12 = tukeyTest.comparisons.find((c) => c.group_i === '1' && c.group_j === '2');
    const pair21 = tukeyTest.comparisons.find((c) => c.group_i === '2' && c.group_j === '1');
    const pair13 = tukeyTest.comparisons.find((c) => c.group_i === '1' && c.group_j === '3');

    assert.ok(pair12, 'pair (1,2) should exist');
    assert.ok(pair21, 'pair (2,1) should exist');
    assert.ok(pair13, 'pair (1,3) should exist');

    // Mean differences: (1-2) = -10.0, (2-1) = 10.0, (1-3) = -20.0
    assert.equal(pair12.mean_diff, -10.0);
    assert.equal(pair21.mean_diff, 10.0);
    assert.equal(pair13.mean_diff, -20.0);

    // Standard error: sqrt(6.6667 * 0.5) = 1.8257
    assert.ok(Math.abs(pair12.se - 1.8257) < 0.01, `SE ${pair12.se} should be ~1.8257`);
    assert.ok(Math.abs(pair21.se - 1.8257) < 0.01, `SE ${pair21.se} should be ~1.8257`);

    // All pairs have huge differences compared to SE (t ~ 5.48 and 10.95), so sig should be highly significant (< 0.001)
    assert.ok(Number(pair12.sig) < 0.001, 'Pair 1-2 should be significant at p < 0.001');
    assert.equal(pair12.significant, true);

    // 95% Confidence Interval for (1-2) must not contain 0 and must be symmetric around mean difference
    assert.ok(typeof pair12.ci_lower === 'number' && typeof pair12.ci_upper === 'number');
    assert.ok(pair12.ci_lower < pair12.mean_diff && pair12.mean_diff < pair12.ci_upper);
    assert.ok(pair12.ci_upper < 0, 'Upper CI bound for -10.0 should remain strictly below 0');
  });

  it('computes distinct Tukey, Bonferroni, Scheffe, and LSD tests concurrently when selected', () => {
    const res = clientComputeAnova(benchmarkRows, 'score', 'group', null, {
      tukey: true,
      bonferroni: true,
      scheffe: true,
      lsd: true,
      significanceLevel: 0.05,
    });

    const data = res.data;
    assert.equal(data.post_hoc_tests.length, 4);

    const testNames = data.post_hoc_tests.map((t) => t.test_name);
    assert.deepEqual(testNames, ['Tukey HSD', 'Bonferroni', 'Scheffe', 'LSD']);

    // Find comparison (1, 2) in each test
    const tukeyComp = data.post_hoc_tests[0].comparisons.find((c) => c.group_i === '1' && c.group_j === '2')!;
    const bonfComp = data.post_hoc_tests[1].comparisons.find((c) => c.group_i === '1' && c.group_j === '2')!;
    const scheffeComp = data.post_hoc_tests[2].comparisons.find((c) => c.group_i === '1' && c.group_j === '2')!;
    const lsdComp = data.post_hoc_tests[3].comparisons.find((c) => c.group_i === '1' && c.group_j === '2')!;

    // Mean differences and standard errors must be identical across all 4 methods
    assert.equal(tukeyComp.mean_diff, -10.0);
    assert.equal(bonfComp.mean_diff, -10.0);
    assert.equal(scheffeComp.mean_diff, -10.0);
    assert.equal(lsdComp.mean_diff, -10.0);

    assert.equal(tukeyComp.se, bonfComp.se);
    assert.equal(bonfComp.se, scheffeComp.se);
    assert.equal(scheffeComp.se, lsdComp.se);

    // Confidence interval width hierarchy: Scheffe >= Bonferroni >= Tukey >= LSD
    const widthScheffe = Number(scheffeComp.ci_upper) - Number(scheffeComp.ci_lower);
    const widthBonf = Number(bonfComp.ci_upper) - Number(bonfComp.ci_lower);
    const widthTukey = Number(tukeyComp.ci_upper) - Number(tukeyComp.ci_lower);
    const widthLsd = Number(lsdComp.ci_upper) - Number(lsdComp.ci_lower);

    // Both simultaneous correction methods (Bonferroni & Scheffe) produce wider intervals than Tukey HSD, which in turn is wider than unadjusted LSD
    assert.ok(widthBonf > widthTukey, `Bonferroni CI (${widthBonf.toFixed(3)}) is wider than Tukey (${widthTukey.toFixed(3)})`);
    assert.ok(widthScheffe > widthTukey, `Scheffe CI (${widthScheffe.toFixed(3)}) is wider than Tukey (${widthTukey.toFixed(3)})`);
    assert.ok(widthTukey > widthLsd, `Tukey CI (${widthTukey.toFixed(3)}) is wider than unadjusted LSD (${widthLsd.toFixed(3)})`);
  });

  it('correctly handles unequal group sizes (Tukey-Kramer adjustment)', () => {
    // Group A: 3 observations, Group B: 5 observations, Group C: 4 observations
    const unequalRows = [
      { grp: 'A', val: 10 }, { grp: 'A', val: 12 }, { grp: 'A', val: 14 },
      { grp: 'B', val: 20 }, { grp: 'B', val: 22 }, { grp: 'B', val: 24 }, { grp: 'B', val: 26 }, { grp: 'B', val: 28 },
      { grp: 'C', val: 30 }, { grp: 'C', val: 32 }, { grp: 'C', val: 34 }, { grp: 'C', val: 36 },
    ];

    const res = clientComputeAnova(unequalRows, 'val', 'grp', null, {
      tukey: true,
      bonferroni: true,
      significanceLevel: 0.05,
    });

    const data = res.data;
    const descA = data.descriptives.find((d: any) => d.group === 'A');
    const descB = data.descriptives.find((d: any) => d.group === 'B');
    const descC = data.descriptives.find((d: any) => d.group === 'C');

    assert.equal(descA.n, 3);
    assert.equal(descB.n, 5);
    assert.equal(descC.n, 4);

    const tukey = data.post_hoc_tests[0];
    const pairAB = tukey.comparisons.find((c: any) => c.group_i === 'A' && c.group_j === 'B')!;
    const pairAC = tukey.comparisons.find((c: any) => c.group_i === 'A' && c.group_j === 'C')!;

    // SE for A-B uses (1/3 + 1/5) = 0.5333, SE for A-C uses (1/3 + 1/4) = 0.5833
    // Since MS_within is common, SE(A-C) must be strictly greater than SE(A-B)
    assert.ok(pairAC.se > pairAB.se, `SE(A-C) [${pairAC.se}] must be > SE(A-B) [${pairAB.se}]`);
  });

  it('filters user-defined missing values and system missing cases', () => {
    const varMeta: VariableMeta[] = [
      {
        name: 'score',
        type: 'Numeric',
        width: 8,
        decimals: 2,
        label: 'Exam Score',
        values: {},
        missing: '99', // User missing value 99
        columns: 8,
        align: 'Right',
        measure: 'Scale',
        role: 'Input',
      },
      {
        name: 'group',
        type: 'Numeric',
        width: 8,
        decimals: 0,
        label: 'Treatment Group',
        values: {},
        missing: '9', // User missing group 9
        columns: 8,
        align: 'Right',
        measure: 'Nominal',
        role: 'Input',
      },
    ];

    const rowsWithMissing = [
      ...benchmarkRows,
      { group: '1', score: 99 },   // User missing score
      { group: '9', score: 25 },   // User missing group
      { group: '2', score: null }, // System missing
      { group: null, score: 30 },  // System missing group
      { group: '3', score: 'NaN' },// Invalid numeric
    ];

    const res = clientComputeAnova(rowsWithMissing, 'score', 'group', null, { tukey: true }, varMeta);

    // Total N must equal exactly 12 (the valid cases from benchmarkRows)
    const totalN = res.data.descriptives.reduce((sum: number, d: any) => sum + d.n, 0);
    assert.equal(totalN, 12, 'Missing cases must be filtered out listwise');
    assert.equal(res.data.descriptives.length, 3);
  });

  it('handles invalid inputs and insufficient groups gracefully', () => {
    // Only 1 group with valid data
    const singleGroupRows = [
      { group: 'A', score: 10 },
      { group: 'A', score: 12 },
    ];

    assert.throws(
      () => clientComputeAnova(singleGroupRows, 'score', 'group'),
      /One-Way ANOVA requires at least 2 distinct groups/
    );
  });
});
