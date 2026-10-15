import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { clientComputeRepeatedMeasuresAnova } from '../src/utils/clientStats';

describe('Repeated Measures ANOVA Multivariate Statistics Verification', () => {
  // 5 subjects measured across 3 timepoints
  const testData = [
    { t1: 10, t2: 15, t3: 20 },
    { t1: 12, t2: 18, t3: 22 },
    { t1: 14, t2: 16, t3: 25 },
    { t1: 11, t2: 14, t3: 19 },
    { t1: 13, t2: 17, t3: 24 },
  ];

  it('computes exact Pillai, Wilks, Hotelling, and Roy multivariate statistics with correct degrees of freedom', () => {
    const res = clientComputeRepeatedMeasuresAnova(testData, ['t1', 't2', 't3']);
    const data = res.data;

    assert.ok(Array.isArray(data.multivariate_tests), 'multivariate_tests should be an array');
    assert.equal(data.multivariate_tests.length, 4);

    const pillai = data.multivariate_tests.find((m: any) => m.test === "Pillai's Trace")!;
    const wilks = data.multivariate_tests.find((m: any) => m.test === "Wilks' Lambda")!;
    const hotelling = data.multivariate_tests.find((m: any) => m.test === "Hotelling's Trace")!;
    const roy = data.multivariate_tests.find((m: any) => m.test === "Roy's Largest Root")!;

    assert.ok(pillai, "Pillai's Trace must be present");
    assert.ok(wilks, "Wilks' Lambda must be present");
    assert.ok(hotelling, "Hotelling's Trace must be present");
    assert.ok(roy, "Roy's Largest Root must be present");

    // Check Degrees of Freedom:
    // Hypothesis df = k - 1 = 3 - 1 = 2
    // Error df = n - k + 1 = 5 - 3 + 1 = 3
    assert.equal(pillai.hypothesis_df, 2);
    assert.equal(pillai.error_df, 3);
    assert.equal(wilks.hypothesis_df, 2);
    assert.equal(wilks.error_df, 3);
    assert.equal(hotelling.hypothesis_df, 2);
    assert.equal(hotelling.error_df, 3);
    assert.equal(roy.hypothesis_df, 2);
    assert.equal(roy.error_df, 3);

    // In a single-factor repeated measures design (rank 1 hypothesis),
    // all four multivariate criteria produce the exact same F, Sig, and Partial Eta Squared.
    assert.equal(pillai.f, wilks.f);
    assert.equal(wilks.f, hotelling.f);
    assert.equal(hotelling.f, roy.f);

    assert.equal(pillai.sig, wilks.sig);
    assert.equal(wilks.sig, hotelling.sig);
    assert.equal(hotelling.sig, roy.sig);

    assert.equal(pillai.partial_eta_squared, wilks.partial_eta_squared);
    assert.equal(wilks.partial_eta_squared, hotelling.partial_eta_squared);

    // Verify mathematical invariants:
    // Hotelling's Trace == Roy's Largest Root == lambda_1
    assert.equal(hotelling.value, roy.value);

    // Pillai's trace V = lambda_1 / (1 + lambda_1) = 1 - Wilks
    // V + Wilks = 1.0 (within rounding precision)
    const sumPillaiWilks = pillai.value + wilks.value;
    assert.ok(Math.abs(sumPillaiWilks - 1.0) <= 0.002, `Pillai (${pillai.value}) + Wilks (${wilks.value}) should equal 1.0`);

    // Partial Eta Squared must equal Pillai's Trace in a rank-1 design
    assert.equal(pillai.partial_eta_squared, pillai.value);

    // Significance of large progression (10->15->20 etc.) should be significant (p < 0.05)
    assert.ok(pillai.sig < 0.05, `Multivariate p-value (${pillai.sig}) should be < 0.05`);
  });

  it('handles edge case where error degrees of freedom are zero or negative (n <= k - 1)', () => {
    // 2 subjects across 3 timepoints: n = 2, k = 3 -> error_df = 2 - 3 + 1 = 0
    const fewSubjects = [
      { t1: 10, t2: 15, t3: 20 },
      { t1: 12, t2: 18, t3: 22 },
    ];

    const res = clientComputeRepeatedMeasuresAnova(fewSubjects, ['t1', 't2', 't3']);
    const data = res.data;

    assert.ok(Array.isArray(data.multivariate_tests));
    assert.equal(data.multivariate_tests.length, 4);

    data.multivariate_tests.forEach((m: any) => {
      assert.equal(m.f, null, 'F should be null when error df <= 0');
      assert.equal(m.sig, null, 'Sig should be null when error df <= 0');
    });

    assert.ok(
      data.multivariate_notes.some((note: string) =>
        note.includes('Cannot be computed because the error degrees of freedom are zero or negative')
      ),
      'Explanatory note must be attached when error degrees of freedom are <= 0'
    );
  });
});
