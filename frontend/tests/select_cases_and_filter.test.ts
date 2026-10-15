import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateFilterCondition } from '../src/utils/filterEvaluator';
import {
  clientComputeDescriptives,
  clientComputeFrequencies,
  clientComputeOneSampleTTest,
} from '../src/utils/clientStats';

describe('SPSS Select Cases & Active Filter Audit', () => {
  const sampleRows = [
    { id: 1, salary: 57000, educ: 15, gender: 'm', jobcat: 'manager' },
    { id: 2, salary: 40200, educ: 16, gender: 'm', jobcat: 'clerical' },
    { id: 3, salary: 21450, educ: 12, gender: 'f', jobcat: 'clerical' },
    { id: 4, salary: 21900, educ: 8,  gender: 'f', jobcat: 'clerical' },
    { id: 5, salary: 45000, educ: 15, gender: 'm', jobcat: 'custodial' },
    { id: 6, salary: 32100, educ: 15, gender: 'm', jobcat: 'clerical' },
  ];

  describe('1. Condition Evaluator (evaluateFilterCondition)', () => {
    it('handles numeric comparison (> , <, >=, <=, =)', () => {
      const rowHigh = { salary: 50000 };
      const rowLow = { salary: 20000 };

      assert.strictEqual(evaluateFilterCondition('salary > 30000', rowHigh), true);
      assert.strictEqual(evaluateFilterCondition('salary > 30000', rowLow), false);
      assert.strictEqual(evaluateFilterCondition('salary <= 20000', rowLow), true);
      assert.strictEqual(evaluateFilterCondition('salary = 50000', rowHigh), true);
      assert.strictEqual(evaluateFilterCondition('salary = 20000', rowHigh), false);
    });

    it('handles string comparison with single and double quotes', () => {
      const rowMale = { gender: 'm', name: 'John' };
      const rowFemale = { gender: 'f', name: 'Jane' };

      assert.strictEqual(evaluateFilterCondition("gender = 'm'", rowMale), true);
      assert.strictEqual(evaluateFilterCondition("gender = 'm'", rowFemale), false);
      assert.strictEqual(evaluateFilterCondition('gender = "f"', rowFemale), true);
      assert.strictEqual(evaluateFilterCondition("gender <> 'f'", rowMale), true);
      assert.strictEqual(evaluateFilterCondition("gender ~= 'f'", rowMale), true);
    });

    it('handles logical AND, OR, NOT keywords case-insensitively', () => {
      const row = { salary: 45000, educ: 16, gender: 'm' };

      assert.strictEqual(evaluateFilterCondition("salary > 40000 AND educ >= 16", row), true);
      assert.strictEqual(evaluateFilterCondition("salary > 50000 AND educ >= 16", row), false);
      assert.strictEqual(evaluateFilterCondition("salary > 50000 OR educ >= 16", row), true);
      assert.strictEqual(evaluateFilterCondition("NOT (salary < 30000)", row), true);
    });

    it('evaluates variable identifiers case-insensitively matching SPSS behavior', () => {
      const row = { salary: 35000 };

      assert.strictEqual(evaluateFilterCondition('SALARY > 30000', row), true);
      assert.strictEqual(evaluateFilterCondition('Salary > 30000', row), true);
    });

    it('safely handles strings that contain variable names or keywords', () => {
      const row = { jobcat: 'manager', salary: 60000 };

      assert.strictEqual(evaluateFilterCondition("jobcat = 'manager'", row), true);
      assert.strictEqual(evaluateFilterCondition("jobcat = 'clerical'", row), false);
    });

    it('returns true on empty or ALL filter conditions (reset behavior)', () => {
      const row = { salary: 25000 };

      assert.strictEqual(evaluateFilterCondition('', row), true);
      assert.strictEqual(evaluateFilterCondition('ALL', row), true);
      assert.strictEqual(evaluateFilterCondition('1', row), true);
    });

    it('recovers gracefully from malformed expressions without throwing', () => {
      const row = { salary: 25000 };

      assert.strictEqual(evaluateFilterCondition('salary >>> &&', row), false);
    });
  });

  describe('2. Filter Exclusion on Statistical Calculations', () => {
    // Condition: salary > 30000
    // Matching cases in sampleRows:
    // id 1: 57000 (included)
    // id 2: 40200 (included)
    // id 3: 21450 (excluded)
    // id 4: 21900 (excluded)
    // id 5: 45000 (included)
    // id 6: 32100 (included)
    // Total matching = 4 cases. Excluded = 2 cases.
    const filteredRows = sampleRows.map((r) => ({
      ...r,
      filter_$: r.salary > 30000 ? 1 : 0,
    }));

    it('accurately identifies active vs excluded rows based on filter_$', () => {
      const activeRows = filteredRows.filter((r) => r.filter_$ !== 0);
      assert.strictEqual(activeRows.length, 4);
      assert.deepStrictEqual(activeRows.map((r) => r.id), [1, 2, 5, 6]);
    });

    it('computes Descriptives only on active (non-excluded) cases', () => {
      const activeRows = filteredRows.filter((r) => r.filter_$ !== 0);

      // Descriptives of all 6 rows
      const allDesc = clientComputeDescriptives(sampleRows, ['salary']);
      assert.strictEqual(allDesc.data.rows[0].valid_n, 6);

      // Descriptives of active 4 rows: (57000 + 40200 + 45000 + 32100) / 4 = 174300 / 4 = 43575
      const activeDesc = clientComputeDescriptives(activeRows, ['salary']);
      const r = activeDesc.data.rows[0];
      assert.strictEqual(r.valid_n, 4);
      assert.strictEqual(r.mean, 43575);
      assert.strictEqual(r.min, 32100);
      assert.strictEqual(r.max, 57000);
    });

    it('computes Frequencies correctly on filtered active cases', () => {
      const activeRows = filteredRows.filter((r) => r.filter_$ !== 0);

      // In all 6 rows: m=4, f=2
      const allFreq = clientComputeFrequencies(sampleRows, ['gender']);
      assert.strictEqual(allFreq.data.tables[0].total_valid, 6);

      // In active 4 rows (ids 1, 2, 5, 6): all 4 are 'm', 0 are 'f'
      const activeFreq = clientComputeFrequencies(activeRows, ['gender']);
      const table = activeFreq.data.tables[0];
      assert.strictEqual(table.total_valid, 4);

      const mRow = table.rows.find((row: any) => row.value === 'm');
      assert.strictEqual(mRow.frequency, 4);
      assert.strictEqual(mRow.valid_percent, 100);
    });

    it('computes One-Sample T-Test correctly on filtered active cases', () => {
      const activeRows = filteredRows.filter((r) => r.filter_$ !== 0);

      // Active salaries: [57000, 40200, 45000, 32100], N=4
      // Mean = 43575, Test value = 40000 -> Diff = 3575
      const res = clientComputeOneSampleTTest(activeRows, ['salary'], 40000);
      const desc = res.data.descriptives[0];
      const test = res.data.test_results[0];

      assert.strictEqual(desc.n, 4);
      assert.strictEqual(desc.mean, 43575);
      assert.strictEqual(test.mean_difference, 3575);
      assert.strictEqual(test.df, 3);
    });
  });
});
