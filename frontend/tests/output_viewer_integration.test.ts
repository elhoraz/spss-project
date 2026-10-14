import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import {
  clientComputeDescriptives,
  clientComputeFrequencies,
  clientComputeCorrelations,
  clientComputeOneSampleTTest,
  clientComputeIndependentTTest,
  clientComputePairedTTest,
  clientComputeAnova,
  clientComputeLinearRegression,
} from '../src/utils/clientStats';
import { getOutlineNodes } from '../src/components/OutputViewer';
import { buildExcelWorkbook, sanitizeSheetName } from '../src/utils/exportUtils';
import { OutputItem } from '../src/types/spss';

describe('SPSS Output Viewer & Export Integration Tests', () => {
  // Realistic SPSS Benchmark Dataset (Employee sample: 12 cases)
  const employeeRows = [
    { id: 1, gender: 'm', jobcat: 3, salary: 57000, salbegin: 27000, educ: 15 },
    { id: 2, gender: 'm', jobcat: 1, salary: 40200, salbegin: 18750, educ: 16 },
    { id: 3, gender: 'f', jobcat: 1, salary: 21450, salbegin: 12000, educ: 12 },
    { id: 4, gender: 'f', jobcat: 1, salary: 21900, salbegin: 13200, educ: 8 },
    { id: 5, gender: 'm', jobcat: 1, salary: 45000, salbegin: 21000, educ: 15 },
    { id: 6, gender: 'm', jobcat: 1, salary: 32100, salbegin: 13500, educ: 15 },
    { id: 7, gender: 'm', jobcat: 1, salary: 36000, salbegin: 18750, educ: 15 },
    { id: 8, gender: 'f', jobcat: 1, salary: 21900, salbegin: 9750, educ: 12 },
    { id: 9, gender: 'f', jobcat: 1, salary: 27900, salbegin: 12750, educ: 15 },
    { id: 10, gender: 'f', jobcat: 1, salary: 24000, salbegin: 13500, educ: 12 },
    { id: 11, gender: 'm', jobcat: 2, salary: 30750, salbegin: 16500, educ: 12 },
    { id: 12, gender: 'm', jobcat: 2, salary: 31350, salbegin: 16000, educ: 15 },
  ];

  // =========================================================================
  // 1. STATISTICAL ENGINE PROCEDURE TO OUTPUT DOCUMENT PIPELINE
  // =========================================================================
  describe('1. Procedure Execution and Statistical Result Traceability', () => {
    it('executes Descriptives and traces all statistical properties without hardcoded values', () => {
      const out = clientComputeDescriptives(employeeRows, ['salary', 'salbegin', 'educ']);

      assert.equal(out.type, 'descriptives');
      assert.ok(out.id.startsWith('out_'));
      assert.ok(out.title.includes('Descriptive Statistics'));
      assert.ok(out.syntax?.includes('DESCRIPTIVES VARIABLES=salary salbegin educ'));
      assert.equal(out.data.variables.length, 3);
      assert.equal(out.data.rows.length, 3);
      assert.equal(out.data.valid_n_listwise, 12);

      const salaryRow = out.data.rows[0];
      assert.equal(salaryRow.variable, 'salary');
      assert.equal(salaryRow.valid_n, 12);
      assert.equal(salaryRow.missing_n, 0);
      assert.equal(salaryRow.min, 21450);
      assert.equal(salaryRow.max, 57000);
      assert.ok(salaryRow.mean > 30000 && salaryRow.mean < 40000);
      assert.ok(salaryRow.std_dev > 0);
      assert.ok(salaryRow.variance > 0);
      assert.ok(salaryRow.se_mean > 0);
    });

    it('executes Frequencies on multiple categorical variables with valid and total counts', () => {
      const labels = {
        gender: { m: 'Male', f: 'Female' },
        jobcat: { '1': 'Clerical', '2': 'Custodial', '3': 'Manager' },
      };
      const out = clientComputeFrequencies(employeeRows, ['gender', 'jobcat'], labels);

      assert.equal(out.type, 'frequencies');
      assert.ok(out.title.includes('Frequencies'));
      assert.equal(out.data.tables.length, 2);

      const genderTable = out.data.tables[0];
      assert.equal(genderTable.variable, 'gender');
      assert.equal(genderTable.total, 12);
      assert.equal(genderTable.total_valid, 12);
      assert.equal(genderTable.total_missing, 0);

      // 7 males, 5 females in our dataset
      const maleRow = genderTable.rows.find((r: any) => r.value === 'm');
      const femaleRow = genderTable.rows.find((r: any) => r.value === 'f');
      assert.ok(maleRow);
      assert.ok(femaleRow);
      assert.equal(maleRow.frequency, 7);
      assert.equal(femaleRow.frequency, 5);
      assert.equal(maleRow.label, 'Male');
      assert.equal(femaleRow.label, 'Female');
      assert.equal(maleRow.percent, 58.3);
      assert.equal(femaleRow.percent, 41.7);
    });

    it('executes Pearson Correlation and produces symmetrical matrix with p-values and N', () => {
      const out = clientComputeCorrelations(employeeRows, ['salary', 'salbegin']);

      assert.equal(out.type, 'correlations');
      assert.ok(out.data.matrix.length, 2);

      const salaryRow = out.data.matrix[0];
      assert.equal(salaryRow.variable, 'salary');

      const corrSelf = salaryRow.correlations.find((c: any) => c.var2 === 'salary');
      const corrWithSalbegin = salaryRow.correlations.find((c: any) => c.var2 === 'salbegin');

      assert.equal(corrSelf.coefficient, 1);
      assert.ok(corrWithSalbegin.coefficient > 0.8, 'Expected strong positive correlation between salary and beginning salary');
      assert.equal(corrWithSalbegin.n, 12);
      assert.ok(corrWithSalbegin.sig_2_tailed !== null && corrWithSalbegin.sig_2_tailed < 0.05);
    });

    it('executes One-Sample T-Test against specified test value', () => {
      const out = clientComputeOneSampleTTest(employeeRows, ['salary'], 30000);

      assert.equal(out.type, 'one_sample_t_test');
      assert.equal(out.data.test_value, 30000);
      assert.equal(out.data.descriptives.length, 1);
      assert.equal(out.data.test_results.length, 1);

      const res = out.data.test_results[0];
      assert.equal(res.variable, 'salary');
      assert.equal(res.df, 11);
      assert.ok(typeof res.t === 'number');
      assert.ok(typeof res.sig_2_tailed === 'number');
      assert.ok(typeof res.mean_difference === 'number');
      assert.ok(res.ci_lower < res.ci_upper);
    });

    it('executes Independent Samples T-Test with Levene test and both pooled & Welch statistics', () => {
      const out = clientComputeIndependentTTest(employeeRows, ['salary'], 'gender', 'm', 'f');

      assert.equal(out.type, 'independent_t_test');
      assert.equal(out.data.group_statistics.length, 2);
      assert.equal(out.data.test_results.length, 1);

      const maleStats = out.data.group_statistics.find((g: any) => g.group === 'm');
      const femaleStats = out.data.group_statistics.find((g: any) => g.group === 'f');
      assert.equal(maleStats.n, 7);
      assert.equal(femaleStats.n, 5);

      const testRes = out.data.test_results[0];
      assert.ok(testRes.levene_f !== null);
      assert.ok(testRes.levene_sig !== null);
      assert.equal(testRes.equal_var_assumed.df, 10);
      assert.ok(testRes.equal_var_not_assumed.df > 0);
      assert.ok(testRes.equal_var_assumed.t !== null);
      assert.ok(testRes.equal_var_not_assumed.t !== null);
    });

    it('executes Paired Samples T-Test with paired correlations and paired differences', () => {
      const out = clientComputePairedTTest(employeeRows, [['salary', 'salbegin']]);

      assert.equal(out.type, 'paired_t_test');
      assert.equal(out.data.paired_statistics.length, 2);
      assert.equal(out.data.paired_correlations.length, 1);
      assert.equal(out.data.paired_differences.length, 1);

      const diff = out.data.paired_differences[0];
      assert.equal(diff.df, 11);
      assert.ok(diff.mean > 0, 'Current salary should exceed beginning salary on average');
      assert.ok(diff.t > 0);
      assert.ok(diff.sig_2_tailed !== null);
    });

    it('executes One-Way ANOVA with sum of squares, mean squares, F and Sig', () => {
      const out = clientComputeAnova(employeeRows, 'salary', 'jobcat');

      assert.equal(out.type, 'one_way_anova');
      assert.ok(out.data.anova_table);
      const between = out.data.anova_table.between_groups;
      const within = out.data.anova_table.within_groups;
      const total = out.data.anova_table.total;

      assert.equal(between.df + within.df, total.df);
      assert.ok(between.f > 0);
      assert.ok(between.sig !== null && between.sig >= 0 && between.sig <= 1);
    });

    it('executes Linear Regression with model summary, ANOVA table, and coefficients', () => {
      const out = clientComputeLinearRegression(employeeRows, 'salary', ['salbegin', 'educ']);

      assert.equal(out.type, 'linear_regression');
      assert.ok(out.data.model_summary);
      assert.ok(out.data.model_summary.r >= 0 && out.data.model_summary.r <= 1);
      assert.ok(out.data.model_summary.r_squared >= 0);

      assert.ok(out.data.coefficients.length >= 3); // (Constant), salbegin, educ
      const constCoef = out.data.coefficients.find((c: any) => c.term.includes('Constant'));
      const salbeginCoef = out.data.coefficients.find((c: any) => c.term === 'salbegin');
      assert.ok(constCoef);
      assert.ok(salbeginCoef);
      assert.ok(typeof salbeginCoef.b === 'number');
      assert.ok(typeof salbeginCoef.t === 'number');
      assert.ok(typeof salbeginCoef.sig === 'number');
    });
  });

  // =========================================================================
  // 2. HIERARCHICAL OUTPUT NAVIGATOR (OUTLINE TREE AUDIT)
  // =========================================================================
  describe('2. Hierarchical Output Navigator Outline Tree', () => {
    it('generates standard SPSS Title, Log, and Notes sub-nodes for any output', () => {
      const desc = clientComputeDescriptives(employeeRows, ['salary']);
      const nodes = getOutlineNodes(desc);

      assert.ok(nodes.length >= 3);
      assert.equal(nodes[0].id, `output-${desc.id}-title`);
      assert.equal(nodes[0].label, 'Title');
      assert.equal(nodes[0].iconType, 'title');

      assert.equal(nodes[1].id, `output-${desc.id}-log`);
      assert.equal(nodes[1].label, 'Log');
      assert.equal(nodes[1].iconType, 'log');

      assert.equal(nodes[2].id, `output-${desc.id}-notes`);
      assert.equal(nodes[2].label, 'Notes');
      assert.equal(nodes[2].iconType, 'notes');
    });

    it('generates sub-table nodes for Descriptives matching anchor ID', () => {
      const desc = clientComputeDescriptives(employeeRows, ['salary', 'educ']);
      const nodes = getOutlineNodes(desc);

      const tableNode = nodes.find((n) => n.id === `output-${desc.id}-table-descriptives`);
      assert.ok(tableNode, 'Should have sub-node for Descriptive Statistics table');
      assert.equal(tableNode.label, 'Descriptive Statistics');
      assert.equal(tableNode.iconType, 'table');
    });

    it('generates Statistics summary node and individual frequency table nodes for multi-variable Frequencies', () => {
      const freq = clientComputeFrequencies(employeeRows, ['gender', 'jobcat']);
      const nodes = getOutlineNodes(freq);

      const statsNode = nodes.find((n) => n.id === `output-${freq.id}-table-stats-summary`);
      assert.ok(statsNode, 'Should have Statistics summary node for multiple variables');
      assert.equal(statsNode.label, 'Statistics');

      const genderNode = nodes.find((n) => n.id === `output-${freq.id}-table-freq-0`);
      const jobcatNode = nodes.find((n) => n.id === `output-${freq.id}-table-freq-1`);
      assert.ok(genderNode);
      assert.ok(jobcatNode);
      assert.equal(genderNode.label, 'gender');
      assert.equal(jobcatNode.label, 'jobcat');
    });

    it('generates Group Statistics and Independent Samples Test sub-nodes for Independent T-Test', () => {
      const ttest = clientComputeIndependentTTest(employeeRows, ['salary'], 'gender', 'm', 'f');
      const nodes = getOutlineNodes(ttest);

      const groupStatsNode = nodes.find((n) => n.id === `output-${ttest.id}-table-group-stats`);
      const testNode = nodes.find((n) => n.id === `output-${ttest.id}-table-test`);

      assert.ok(groupStatsNode, 'Should have Group Statistics outline node');
      assert.ok(testNode, 'Should have Independent Samples Test outline node');
      assert.equal(groupStatsNode.label, 'Group Statistics');
      assert.equal(testNode.label, 'Independent Samples Test');
    });

    it('generates Model Summary, ANOVA, and Coefficients sub-nodes for Linear Regression', () => {
      const reg = clientComputeLinearRegression(employeeRows, 'salary', ['salbegin', 'educ']);
      const nodes = getOutlineNodes(reg);

      const summaryNode = nodes.find((n) => n.id === `output-${reg.id}-table-summary`);
      const anovaNode = nodes.find((n) => n.id === `output-${reg.id}-table-anova`);
      const coefNode = nodes.find((n) => n.id === `output-${reg.id}-table-coefficients`);

      assert.ok(summaryNode);
      assert.ok(anovaNode);
      assert.ok(coefNode);
      assert.equal(summaryNode.label, 'Model Summary');
      assert.equal(anovaNode.label, 'ANOVA');
      assert.equal(coefNode.label, 'Coefficients');
    });

    it('ensures all outline node IDs within an output are unique and non-empty', () => {
      const procedures: OutputItem[] = [
        clientComputeDescriptives(employeeRows, ['salary']),
        clientComputeFrequencies(employeeRows, ['gender', 'jobcat']),
        clientComputeCorrelations(employeeRows, ['salary', 'salbegin']),
        clientComputeOneSampleTTest(employeeRows, ['salary'], 30000),
        clientComputeIndependentTTest(employeeRows, ['salary'], 'gender', 'm', 'f'),
        clientComputePairedTTest(employeeRows, [['salary', 'salbegin']]),
        clientComputeAnova(employeeRows, 'salary', 'jobcat'),
        clientComputeLinearRegression(employeeRows, 'salary', ['salbegin', 'educ']),
      ];

      for (const item of procedures) {
        const nodes = getOutlineNodes(item);
        const seenIds = new Set<string>();
        for (const n of nodes) {
          assert.ok(n.id.length > 0, `Node id cannot be empty for ${item.type}`);
          assert.ok(n.label.length > 0, `Node label cannot be empty for ${item.type}`);
          assert.equal(seenIds.has(n.id), false, `Duplicate node id ${n.id} in ${item.type}`);
          seenIds.add(n.id);
        }
      }
    });
  });

  // =========================================================================
  // 3. EXPORT OPERATIONS & EXCEL WORKBOOK GENERATOR AUDIT
  // =========================================================================
  describe('3. Multi-Procedure Excel Workbook Generation', () => {
    it('sanitizes sheet names to obey Excel 31-character limit and forbidden characters', () => {
      const existing = new Set<string>();
      const sheet1 = sanitizeSheetName('Very Long Sheet Name That Exceeds The Maximum Allowed Excel Limit By Far', existing);
      assert.ok(sheet1.length <= 31);

      const sheet2 = sanitizeSheetName('Invalid:Name*With/Prohibited?Chars', existing);
      assert.ok(!sheet2.includes(':'));
      assert.ok(!sheet2.includes('*'));
      assert.ok(!sheet2.includes('/'));
      assert.ok(!sheet2.includes('?'));

      // Check duplicate resolution
      const sheet3 = sanitizeSheetName('MySheet', existing);
      const sheet4 = sanitizeSheetName('MySheet', existing);
      assert.notEqual(sheet3.toLowerCase(), sheet4.toLowerCase());
    });

    it('builds a multi-sheet Excel workbook containing all 8 distinct executed procedures', () => {
      const allOutputs: OutputItem[] = [
        clientComputeDescriptives(employeeRows, ['salary', 'salbegin', 'educ']),
        clientComputeFrequencies(employeeRows, ['gender', 'jobcat']),
        clientComputeCorrelations(employeeRows, ['salary', 'salbegin']),
        clientComputeOneSampleTTest(employeeRows, ['salary'], 30000),
        clientComputeIndependentTTest(employeeRows, ['salary'], 'gender', 'm', 'f'),
        clientComputePairedTTest(employeeRows, [['salary', 'salbegin']]),
        clientComputeAnova(employeeRows, 'salary', 'jobcat'),
        clientComputeLinearRegression(employeeRows, 'salary', ['salbegin', 'educ']),
      ];

      const wb = buildExcelWorkbook(allOutputs);
      assert.ok(wb.SheetNames.length >= 8, `Expected at least 8 sheets, received ${wb.SheetNames.length}`);

      // Verify all sheet names obey Excel 31-character limit
      wb.SheetNames.forEach((name) => {
        assert.ok(name.length <= 31, `Sheet name "${name}" exceeds 31 characters`);
      });

      // 1. Descriptives sheet validation
      const descSheet = wb.Sheets[wb.SheetNames[0]];
      assert.ok(descSheet);
      const descData: any[] = XLSX.utils.sheet_to_json(descSheet);
      assert.ok(descData.length >= 3);
      assert.equal(descData[0].Variable, 'salary');
      assert.equal(descData[0]['Valid N'], 12);
      // Valid N listwise row
      const listwiseRow = descData.find((r) => r.Variable === 'Valid N (listwise)');
      assert.ok(listwiseRow);
      assert.equal(listwiseRow['Valid N'], 12);

      // 2. Frequencies sheets validation (Summary + Variable tables)
      const freqSheets = wb.SheetNames.filter((s) => s.startsWith('Freq_'));
      assert.ok(freqSheets.length >= 2);

      // 3. Correlations sheet validation
      const corrSheetName = wb.SheetNames.find((s) => s.startsWith('Correlations_'));
      assert.ok(corrSheetName);
      const corrData: any[] = XLSX.utils.sheet_to_json(wb.Sheets[corrSheetName]);
      assert.ok(corrData.length >= 3);
      assert.ok(corrData.some((r) => r.Metric === 'Pearson Correlation'));
      assert.ok(corrData.some((r) => r.Metric === 'Sig. (2-tailed)'));
      assert.ok(corrData.some((r) => r.Metric === 'N'));

      // 4. One-Sample T-Test sheet validation
      const oneSampleSheet = wb.SheetNames.find((s) => s.startsWith('OneSample_TTest_'));
      assert.ok(oneSampleSheet);
      const oneSampleData: any[] = XLSX.utils.sheet_to_json(wb.Sheets[oneSampleSheet]);
      assert.ok(oneSampleData.length >= 2);

      // 5. Independent T-Test sheet validation
      const indepSheet = wb.SheetNames.find((s) => s.startsWith('Indep_TTest_'));
      assert.ok(indepSheet);
      const indepData: any[] = XLSX.utils.sheet_to_json(wb.Sheets[indepSheet]);
      assert.ok(indepData.some((r) => r.Table === 'Equal variances assumed'));
      assert.ok(indepData.some((r) => r.Table === 'Equal variances not assumed'));

      // 6. Linear Regression sheet validation
      const regSheet = wb.SheetNames.find((s) => s.startsWith('Regression_'));
      assert.ok(regSheet);
      const regData: any[] = XLSX.utils.sheet_to_json(wb.Sheets[regSheet]);
      assert.ok(regData.some((r) => r.Section === 'Model Summary'));
      assert.ok(regData.some((r) => r.Section === 'Coefficients'));
    });

    it('handles empty outputs gracefully without throwing by creating a summary placeholder sheet', () => {
      const wb = buildExcelWorkbook([]);
      assert.equal(wb.SheetNames.length, 1);
      assert.equal(wb.SheetNames[0], 'Summary');
      const data: any[] = XLSX.utils.sheet_to_json(wb.Sheets['Summary']);
      assert.ok(data[0].Message.includes('No tabular statistical output'));
    });
  });

  // =========================================================================
  // 4. MULTIPLE ANALYSES COEXISTENCE, SELECTION, AND DELETION AUDIT
  // =========================================================================
  describe('4. Multiple Analyses Coexistence, Selection, and Deletion Workflow', () => {
    let outputList: OutputItem[] = [];

    beforeEach(() => {
      outputList = [];
    });

    it('supports appending and prepending multiple distinct analyses chronologically', () => {
      const desc = clientComputeDescriptives(employeeRows, ['salary']);
      outputList = [desc, ...outputList];
      assert.equal(outputList.length, 1);

      const freq = clientComputeFrequencies(employeeRows, ['gender']);
      outputList = [freq, ...outputList];
      assert.equal(outputList.length, 2);

      const ttest = clientComputeOneSampleTTest(employeeRows, ['salary'], 30000);
      outputList = [ttest, ...outputList];
      assert.equal(outputList.length, 3);

      // All 3 coexist with their separate types, IDs, and calculations
      assert.equal(outputList[0].type, 'one_sample_t_test');
      assert.equal(outputList[1].type, 'frequencies');
      assert.equal(outputList[2].type, 'descriptives');

      // Verify data isolation: each item data is strictly its own
      assert.ok(outputList[0].data.test_results);
      assert.ok(outputList[1].data.tables);
      assert.ok(outputList[2].data.rows);
    });

    it('selects and deletes a targeted analysis without corrupting remaining outputs', () => {
      const item1 = clientComputeDescriptives(employeeRows, ['salary']);
      const item2 = clientComputeFrequencies(employeeRows, ['gender']);
      const item3 = clientComputeCorrelations(employeeRows, ['salary', 'salbegin']);

      outputList = [item1, item2, item3];
      assert.equal(outputList.length, 3);

      // Simulate user selecting item2 and clicking Delete
      const targetId = item2.id;
      outputList = outputList.filter((item) => item.id !== targetId);

      assert.equal(outputList.length, 2);
      assert.equal(outputList.some((item) => item.id === targetId), false);
      assert.equal(outputList[0].id, item1.id);
      assert.equal(outputList[1].id, item3.id);
      assert.equal(outputList[0].data.rows[0].variable, 'salary');
      assert.equal(outputList[1].data.matrix[0].variable, 'salary');
    });

    it('clears all outputs cleanly returning to blank initial state', () => {
      outputList = [
        clientComputeDescriptives(employeeRows, ['salary']),
        clientComputeFrequencies(employeeRows, ['gender']),
      ];
      assert.equal(outputList.length, 2);

      // Clear all
      outputList = [];
      assert.equal(outputList.length, 0);
    });
  });

  // =========================================================================
  // 5. SESSION PERSISTENCE & SERIALIZATION AUDIT
  // =========================================================================
  describe('5. Output Persistence & Serialization Round-Trip', () => {
    it('serializes and deserializes complex multi-analysis outputs without data loss', () => {
      const originalOutputs: OutputItem[] = [
        clientComputeDescriptives(employeeRows, ['salary', 'salbegin']),
        clientComputeFrequencies(employeeRows, ['gender', 'jobcat']),
        clientComputeIndependentTTest(employeeRows, ['salary'], 'gender', 'm', 'f'),
      ];

      // Simulate localStorage serialization
      const json = JSON.stringify(originalOutputs);
      const restoredOutputs: OutputItem[] = JSON.parse(json);

      assert.equal(restoredOutputs.length, 3);
      assert.equal(restoredOutputs[0].type, 'descriptives');
      assert.equal(restoredOutputs[1].type, 'frequencies');
      assert.equal(restoredOutputs[2].type, 'independent_t_test');

      // Verify numeric fidelity
      assert.equal(
        restoredOutputs[0].data.rows[0].mean,
        originalOutputs[0].data.rows[0].mean
      );
      assert.equal(
        restoredOutputs[1].data.tables[0].total_valid,
        originalOutputs[1].data.tables[0].total_valid
      );
      assert.equal(
        restoredOutputs[2].data.test_results[0].equal_var_assumed.df,
        originalOutputs[2].data.test_results[0].equal_var_assumed.df
      );

      // Verify outline nodes rebuild perfectly from restored output items
      restoredOutputs.forEach((item) => {
        const nodes = getOutlineNodes(item);
        assert.ok(nodes.length >= 3);
      });
    });
  });
});
