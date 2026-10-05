import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { VariableMeta, AnalysisModalType, OutputItem } from '../types/spss';
import { statsApiService } from '../services/api';
import {
  clientComputeDescriptives,
  clientComputeFrequencies,
  clientComputeCrosstabs,
  clientComputeCorrelations,
  clientComputeOneSampleTTest,
  clientComputeIndependentTTest,
  clientComputePairedTTest,
  clientComputeAnova,
  clientComputeTwoWayAnova,
  clientComputeLinearRegression,
  clientComputeReliability,
  clientComputeMannWhitney,
  clientComputeWilcoxon,
  clientComputeKruskalWallis,
  clientComputeExplore,
  clientComputeFactorAnalysis,
  clientComputeLogisticRegression,
  clientComputeMeansReport,
  clientComputePartialCorrelation,
  clientComputeCurveEstimation,
  clientComputeChiSquareGoodness,
  clientComputeBinomialTest,
  clientComputeRunsTest,
} from '../utils/clientStats';

interface SPSSAnalysisDialogsProps {
  modalType: AnalysisModalType;
  variables: VariableMeta[];
  rows: Record<string, any>[];
  splitByVariable?: string | null;
  weightByVariable?: string | null;
  onSetSplitByVariable?: (varName: string | null) => void;
  onSetWeightByVariable?: (varName: string | null) => void;
  onClose: () => void;
  onAnalysisComplete: (output: OutputItem) => void;
  onPasteSyntax: (syntax: string) => void;
  onApplyDataOperation?: (newRows: Record<string, any>[]) => void;
}

export const SPSSAnalysisDialogs: React.FC<SPSSAnalysisDialogsProps> = ({
  modalType,
  variables,
  rows,
  splitByVariable,
  weightByVariable,
  onSetSplitByVariable,
  onSetWeightByVariable,
  onClose,
  onAnalysisComplete,
  onPasteSyntax,
  onApplyDataOperation,
}) => {
  // State for variables selection
  const [selectedSourceVar, setSelectedSourceVar] = useState<string | null>(null);
  const [targetVars, setTargetVars] = useState<string[]>([]);
  const [selectedTargetVar, setSelectedTargetVar] = useState<string | null>(null);

  // Additional fields for specialized dialogs
  const [rowVar, setRowVar] = useState<string>('');
  const [colVar, setColVar] = useState<string>('');
  const [depVar, setDepVar] = useState<string>('');
  const [factorVar, setFactorVar] = useState<string>('');
  const [factorVarB, setFactorVarB] = useState<string>('');
  const [testValue, setTestValue] = useState<number>(0);
  const [groupVar, setGroupVar] = useState<string>('');
  const [group1Val, setGroup1Val] = useState<string>('m');
  const [group2Val, setGroup2Val] = useState<string>('f');

  // Compute variable state
  const [computeTargetVar, setComputeTargetVar] = useState<string>('');
  const [computeExpression, setComputeExpression] = useState<string>('');

  // Chart builder state
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'histogram' | 'scatter' | 'line' | 'boxplot'>('bar');
  const [chartXVar, setChartXVar] = useState<string>('');
  const [chartYVar, setChartYVar] = useState<string>('');
  const [chartTitle, setChartTitle] = useState<string>('');

  // Data management state
  const [sortOrder, setSortOrder] = useState<'A' | 'D'>('A');
  const [filterCondition, setFilterCondition] = useState<string>('salary > 30000');
  const [splitVar, setSplitVar] = useState<string>(splitByVariable || '');
  const [splitMode, setSplitMode] = useState<'off' | 'layered'>(splitByVariable ? 'layered' : 'off');
  const [weightVar, setWeightVar] = useState<string>(weightByVariable || '');
  const [weightMode, setWeightMode] = useState<'off' | 'weighted'>(weightByVariable ? 'weighted' : 'off');

  // Advanced analysis options
  const [controlVar, setControlVar] = useState<string>('');
  const [indepVar, setIndepVar] = useState<string>('');
  const [testProp, setTestProp] = useState<number>(0.5);
  const [cutPointType, setCutPointType] = useState<'median' | 'mean' | 'custom'>('median');
  const [customCut, setCustomCut] = useState<number>(0);

  // Nested Sub-Dialog state
  const [activeSubDialog, setActiveSubDialog] = useState<
    'statistics' | 'charts' | 'options' | 'cells' | 'posthoc' | 'plots' | 'factor_options' | null
  >(null);

  // Sub-dialog options states
  const [statsOptions, setStatsOptions] = useState({
    mean: true,
    stdDev: true,
    min: true,
    max: true,
    variance: false,
    range: false,
    seMean: false,
    median: false,
    skewness: false,
    kurtosis: false,
    quartiles: false,
  });

  const [chartsOptions, setChartsOptions] = useState({
    chartType: 'none' as 'none' | 'bar' | 'pie' | 'histogram',
    showNormalCurve: false,
  });

  const [crosstabsOptions, setCrosstabsOptions] = useState({
    chiSquare: true,
    phiCramer: false,
    observed: true,
    expected: false,
    rowPct: false,
    colPct: false,
    totalPct: false,
  });

  const [postHocOptions, setPostHocOptions] = useState({
    tukey: true,
    bonferroni: false,
    scheffe: false,
    lsd: false,
    significanceLevel: 0.05,
  });

  const [exploreOptions, setExploreOptions] = useState({
    descriptives: true,
    mEstimators: false,
    outliers: true,
    percentiles: false,
    stemAndLeaf: true,
    normalityPlots: true,
    boxplots: 'factor' as 'factor' | 'dependents' | 'none',
  });

  const [factorOptions, setFactorOptions] = useState({
    extraction: 'pca' as 'pca' | 'pa',
    eigenvalueCutoff: 1.0,
    rotation: 'varimax' as 'varimax' | 'direct_oblimin' | 'quartimax' | 'none',
    screePlot: true,
  });

  const [logisticOptions, setLogisticOptions] = useState({
    ciLevel: 95,
    includeConstant: true,
    classificationCutoff: 0.5,
  });

  if (!modalType || modalType === 'import_data' || modalType === 'export_report' || modalType === 'value_labels' || modalType === 'about_spss') {
    return null;
  }

  // Measurement icon
  const renderIcon = (v: VariableMeta) => {
    if (v.measure === 'Scale') {
      return (
        <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <line x1="6" y1="6" x2="6" y2="10" />
          <line x1="10" y1="6" x2="10" y2="12" />
          <line x1="14" y1="6" x2="14" y2="10" />
          <line x1="18" y1="6" x2="18" y2="12" />
        </svg>
      );
    }
    if (v.measure === 'Ordinal') {
      return (
        <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
          <line x1="6" y1="20" x2="6" y2="14" />
          <line x1="12" y1="20" x2="12" y2="8" />
          <line x1="18" y1="20" x2="18" y2="4" />
        </svg>
      );
    }
    return (
      <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2">
        <circle cx="6" cy="12" r="3" fill="#ea580c" />
        <circle cx="12" cy="7" r="3" fill="#3b82f6" />
        <circle cx="18" cy="12" r="3" fill="#10b981" />
      </svg>
    );
  };

  // Variable Transfer helpers
  const handleMoveToTarget = () => {
    if (selectedSourceVar && !targetVars.includes(selectedSourceVar)) {
      setTargetVars([...targetVars, selectedSourceVar]);
    }
  };

  const handleMoveToSource = () => {
    if (selectedTargetVar) {
      setTargetVars(targetVars.filter((v) => v !== selectedTargetVar));
      setSelectedTargetVar(null);
    }
  };

  // Run Analysis
  const handleRun = async () => {
    let output: OutputItem | null = null;

    try {
      if (modalType === 'frequencies') {
        const vars = targetVars.length > 0 ? targetVars : (variables.length > 0 ? [variables[0].name] : []);
        if (vars.length === 0) throw new Error('Please select at least one variable for Frequencies.');
        output = await statsApiService.runFrequencies(rows, vars);
        if (!output) output = clientComputeFrequencies(rows, vars, {}, weightByVariable);
      } else if (modalType === 'descriptives') {
        const vars = targetVars.length > 0 ? targetVars : variables.filter((v) => v.type === 'Numeric' || v.measure === 'Scale').map((v) => v.name);
        if (vars.length === 0) throw new Error('Please select at least one numeric variable for Descriptives.');
        output = await statsApiService.runDescriptives(rows, vars);
        if (!output) output = clientComputeDescriptives(rows, vars, weightByVariable);
      } else if (modalType === 'crosstabs') {
        const r = rowVar || targetVars[0];
        const c = colVar || targetVars[1];
        if (!r || !c) throw new Error('Please select both a Row variable and a Column variable for Crosstabs.');
        output = await statsApiService.runCrosstabs(rows, r, c);
        if (!output) output = clientComputeCrosstabs(rows, r, c, weightByVariable);
      } else if (modalType === 'correlations') {
        const vars = targetVars.length >= 2 ? targetVars : variables.filter((v) => v.type === 'Numeric' || v.measure === 'Scale').map((v) => v.name).slice(0, 3);
        if (vars.length < 2) throw new Error('Please select at least two numeric variables for Bivariate Correlations.');
        output = await statsApiService.runCorrelations(rows, vars);
        if (!output) output = clientComputeCorrelations(rows, vars);
      } else if (modalType === 'one_sample_t_test') {
        const vars = targetVars.length > 0 ? targetVars : [];
        if (vars.length === 0) throw new Error('Please select at least one Test Variable for One-Sample T-Test.');
        output = await statsApiService.runOneSampleTTest(rows, vars, testValue);
        if (!output) output = clientComputeOneSampleTTest(rows, vars, testValue);
      } else if (modalType === 'independent_t_test') {
        const vars = targetVars.length > 0 ? targetVars : [];
        const g = groupVar;
        if (vars.length === 0 || !g) throw new Error('Please select Test Variable(s) and a Grouping Variable for Independent Samples T-Test.');
        output = await statsApiService.runIndependentTTest(rows, vars, g, group1Val, group2Val);
        if (!output) output = clientComputeIndependentTTest(rows, vars, g, group1Val, group2Val);
      } else if (modalType === 'paired_t_test') {
        const v1 = targetVars[0];
        const v2 = targetVars[1];
        if (!v1 || !v2) throw new Error('Please select two variables for Paired-Samples T-Test.');
        output = await statsApiService.runPairedTTest(rows, [[v1, v2]]);
        if (!output) output = clientComputePairedTTest(rows, [[v1, v2]]);
      } else if (modalType === 'one_way_anova') {
        const d = depVar || targetVars[0];
        const f = factorVar;
        if (!d || !f) throw new Error('Please select a Dependent Variable and a Factor Variable for One-Way ANOVA.');
        output = await statsApiService.runOneWayAnova(rows, d, f);
        if (!output) output = clientComputeAnova(rows, d, f);
      } else if (modalType === 'two_way_anova') {
        const d = depVar || targetVars[0];
        const fA = factorVar;
        const fB = factorVarB;
        if (!d || !fA || !fB) throw new Error('Please select Dependent Variable and both Factor Variables for Two-Way ANOVA.');
        output = clientComputeTwoWayAnova(rows, d, fA, fB);
      } else if (modalType === 'linear_regression') {
        const d = depVar;
        const ivs = targetVars.length > 0 ? targetVars : [];
        if (!d || ivs.length === 0) throw new Error('Please select a Dependent Variable and at least one Independent Variable for Linear Regression.');
        output = await statsApiService.runLinearRegression(rows, d, ivs);
        if (!output) output = clientComputeLinearRegression(rows, d, ivs);
      } else if (modalType === 'reliability') {
        const items = targetVars.length >= 2 ? targetVars : [];
        if (items.length < 2) throw new Error('Please select at least two items for Reliability Analysis (Cronbach Alpha).');
        output = await statsApiService.runReliability(rows, items);
        if (!output) output = clientComputeReliability(rows, items);
      } else if (modalType === 'mann_whitney') {
        const testV = depVar || targetVars[0];
        const grpV = groupVar;
        if (!testV || !grpV) throw new Error('Please select a Test Variable and a Grouping Variable for Mann-Whitney U Test.');
        output = await statsApiService.runNonparametric(rows, 'mann_whitney', { test_variable: testV, group_variable: grpV });
        if (!output) output = clientComputeMannWhitney(rows, testV, grpV);
      } else if (modalType === 'wilcoxon') {
        const v1 = targetVars[0];
        const v2 = targetVars[1];
        if (!v1 || !v2) throw new Error('Please select two paired variables for Wilcoxon Signed-Ranks Test.');
        output = await statsApiService.runNonparametric(rows, 'wilcoxon', { var1: v1, var2: v2 });
        if (!output) output = clientComputeWilcoxon(rows, v1, v2);
      } else if (modalType === 'kruskal_wallis') {
        const testV = depVar || targetVars[0];
        const grpV = factorVar;
        if (!testV || !grpV) throw new Error('Please select a Test Variable and a Grouping Variable for Kruskal-Wallis Test.');
        output = await statsApiService.runNonparametric(rows, 'kruskal_wallis', { test_variable: testV, group_variable: grpV });
        if (!output) output = clientComputeKruskalWallis(rows, testV, grpV);
      } else if (modalType === 'explore') {
        const vars = targetVars.length > 0 ? targetVars : variables.filter((v) => v.type === 'Numeric' || v.measure === 'Scale').map((v) => v.name).slice(0, 2);
        if (vars.length === 0) throw new Error('Please select at least one numeric variable for Explore.');
        output = clientComputeExplore(rows, vars);
      } else if (modalType === 'factor_analysis') {
        const vars = targetVars.length >= 2 ? targetVars : variables.filter((v) => v.type === 'Numeric' || v.measure === 'Scale').map((v) => v.name).slice(0, 4);
        if (vars.length < 2) throw new Error('Please select at least two numeric variables for Factor Analysis.');
        output = clientComputeFactorAnalysis(rows, vars);
      } else if (modalType === 'logistic_regression') {
        const d = depVar || targetVars[0];
        const ivs = targetVars.filter((v) => v !== d);
        if (!d || ivs.length === 0) throw new Error('Please select a Binary Dependent Variable and Covariates for Logistic Regression.');
        output = clientComputeLogisticRegression(rows, d, ivs);
      } else if (modalType === 'compute_variable') {
        if (!computeTargetVar.trim() || !computeExpression.trim()) {
          throw new Error('Please enter both a Target Variable name and a Numeric Expression.');
        }
        const cleanTarget = computeTargetVar.trim().replace(/\s+/g, '_');
        const expr = computeExpression.trim();

        const updatedRows = rows.map((r) => {
          const rowCopy = { ...r };
          try {
            let jsExpr = expr
              .replace(/\bLN\s*\(/gi, 'Math.log(')
              .replace(/\bLOG10\s*\(/gi, 'Math.log10(')
              .replace(/\bEXP\s*\(/gi, 'Math.exp(')
              .replace(/\bSQRT\s*\(/gi, 'Math.sqrt(')
              .replace(/\bABS\s*\(/gi, 'Math.abs(')
              .replace(/\bROUND\s*\(/gi, 'Math.round(');

            variables.forEach((v) => {
              const reg = new RegExp(`\\b${v.name}\\b`, 'g');
              const val = r[v.name];
              const safeNum = val !== undefined && val !== null && !isNaN(Number(val)) ? Number(val) : 0;
              jsExpr = jsExpr.replace(reg, String(safeNum));
            });

            const res = Function(`"use strict"; return (${jsExpr})`)();
            rowCopy[cleanTarget] = typeof res === 'number' && !isNaN(res) && isFinite(res) ? Number(res.toFixed(4)) : res;
          } catch {
            rowCopy[cleanTarget] = null;
          }
          return rowCopy;
        });

        if (onApplyDataOperation) {
          onApplyDataOperation(updatedRows);
        }

        output = {
          id: `compute_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          title: 'Compute Variable',
          type: 'data_management',
          syntax: `COMPUTE ${cleanTarget} = ${expr}.\nEXECUTE.`,
          data: {
            'Operation': 'COMPUTE VARIABLE',
            'Target Variable': cleanTarget,
            'Numeric Expression': expr,
            'Cases Computed': rows.length,
            'Status': 'New variable computed and stored in active dataset',
          },
        };
      } else if (modalType === 'sort_cases') {
        const sortField = selectedSourceVar || targetVars[0] || variables[0]?.name;
        if (sortField) {
          const sorted = [...rows].sort((a, b) => {
            const valA = a[sortField];
            const valB = b[sortField];
            if (typeof valA === 'number' && typeof valB === 'number') {
              return sortOrder === 'A' ? valA - valB : valB - valA;
            }
            return sortOrder === 'A'
              ? String(valA || '').localeCompare(String(valB || ''))
              : String(valB || '').localeCompare(String(valA || ''));
          });
          if (onApplyDataOperation) onApplyDataOperation(sorted);
          output = {
            id: `dm_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            title: 'Sort Cases',
            type: 'data_management',
            syntax: `SORT CASES BY ${sortField} (${sortOrder === 'A' ? 'A' : 'D'}).`,
            data: {
              'Operation': 'SORT CASES',
              'Key Variable': sortField,
              'Sort Order': sortOrder === 'A' ? 'Ascending' : 'Descending',
              'Cases Processed': rows.length,
            },
          };
        }
      } else if (modalType === 'select_cases') {
        output = {
          id: `dm_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          title: 'Select Cases (Filter)',
          type: 'data_management',
          syntax: `USE ALL.\nCOMPUTE filter_$ = (${filterCondition}).\nFILTER BY filter_$.\nEXECUTE.`,
          data: {
            'Operation': 'SELECT CASES / FILTER',
            'Filter Condition': filterCondition,
            'Status': 'Filter active across active dataset',
            'Cases': rows.length,
          },
        };
      } else if (modalType === 'split_file') {
        const sVar = splitMode === 'off' ? null : (splitVar || selectedSourceVar || targetVars[0] || variables[0]?.name);
        if (onSetSplitByVariable) {
          onSetSplitByVariable(sVar);
        }
        output = {
          id: `dm_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          title: 'Split File',
          type: 'data_management',
          syntax: sVar ? `SORT CASES BY ${sVar}.\nSPLIT FILE LAYERED BY ${sVar}.` : 'SPLIT FILE OFF.',
          data: {
            'Operation': 'SPLIT FILE',
            'Layer Variable': sVar || 'None (Split File Off)',
            'Status': sVar ? `Active Split by ${sVar}` : 'Split File disabled (All cases analyzed together)',
          },
        };
      } else if (modalType === 'weight_cases') {
        const wVar = weightMode === 'off' ? null : (weightVar || selectedSourceVar || targetVars[0] || variables[0]?.name);
        if (onSetWeightByVariable) {
          onSetWeightByVariable(wVar);
        }
        output = {
          id: `dm_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          title: 'Weight Cases',
          type: 'data_management',
          syntax: wVar ? `WEIGHT BY ${wVar}.` : 'WEIGHT OFF.',
          data: {
            'Operation': 'WEIGHT CASES',
            'Frequency Variable': wVar || 'None (Weight Cases Off)',
            'Status': wVar ? `Active case weights by ${wVar}` : 'Weighting disabled',
          },
        };
      } else if (modalType === 'means_report') {
        const deps = targetVars.length > 0 ? targetVars : [variables[0]?.name];
        const f = factorVar || variables[1]?.name;
        if (!f) throw new Error('Please select a Factor (Grouping) Variable for Means Report.');
        output = clientComputeMeansReport(rows, deps, f, weightByVariable);
      } else if (modalType === 'partial_correlation') {
        const vars = targetVars.length >= 2 ? targetVars : [variables[0]?.name, variables[1]?.name];
        const c = controlVar || variables[2]?.name;
        if (!c) throw new Error('Please select at least one Control Variable.');
        output = clientComputePartialCorrelation(rows, vars, [c]);
      } else if (modalType === 'curve_estimation') {
        const d = depVar || targetVars[0] || variables[0]?.name;
        const iv = indepVar || targetVars[1] || variables[1]?.name;
        if (!d || !iv) throw new Error('Please select both Dependent and Independent variables.');
        output = clientComputeCurveEstimation(rows, d, iv);
      } else if (modalType === 'chi_square_goodness') {
        const v = depVar || targetVars[0] || variables[0]?.name;
        if (!v) throw new Error('Please select a Test Variable.');
        output = clientComputeChiSquareGoodness(rows, v);
      } else if (modalType === 'binomial_test') {
        const v = depVar || targetVars[0] || variables[0]?.name;
        if (!v) throw new Error('Please select a Test Variable.');
        output = clientComputeBinomialTest(rows, v, testProp);
      } else if (modalType === 'runs_test') {
        const v = depVar || targetVars[0] || variables[0]?.name;
        if (!v) throw new Error('Please select a Test Variable.');
        output = clientComputeRunsTest(rows, v, cutPointType, customCut);
      } else if (modalType === 'chart_builder') {
        const x = chartXVar || targetVars[0] || variables[0]?.name;
        const y = chartYVar || targetVars[1];
        output = {
          id: `chart_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          title: chartTitle || `${chartType.toUpperCase()} Chart of ${x}`,
          type: 'chart',
          syntax: `GRAPH /${chartType.toUpperCase()}=${x} ${y ? `BY ${y}` : ''}.`,
          data: {
            chartType,
            xVar: x,
            yVar: y,
            title: chartTitle || `${chartType.toUpperCase()} Chart of ${x}`,
            rows,
          },
        };
      }
    } catch (err: any) {
      alert(`Error computing analysis: ${err.message}`);
      return;
    }

    if (output) {
      onAnalysisComplete(output);
      onClose();
    }
  };

  // Paste Syntax to Syntax Editor
  const handlePaste = () => {
    let syntax = '';
    if (modalType === 'frequencies') {
      syntax = `FREQUENCIES VARIABLES=${targetVars.join(' ')}\n  /ORDER=ANALYSIS.`;
    } else if (modalType === 'descriptives') {
      syntax = `DESCRIPTIVES VARIABLES=${targetVars.join(' ')}\n  /STATISTICS=MEAN STDDEV MIN MAX.`;
    } else if (modalType === 'crosstabs') {
      syntax = `CROSSTABS\n  /TABLES=${rowVar || 'gender'} BY ${colVar || 'jobcat'}\n  /STATISTICS=CHISQ\n  /CELLS=COUNT EXPECTED ROW COLUMN TOTAL.`;
    } else if (modalType === 'correlations') {
      syntax = `CORRELATIONS\n  /VARIABLES=${targetVars.join(' ')}\n  /PRINT=TWOTAIL NOSIG.`;
    } else if (modalType === 'one_sample_t_test') {
      syntax = `T-TEST\n  /TESTVAL=${testValue}\n  /VARIABLES=${targetVars.join(' ')}.`;
    } else if (modalType === 'independent_t_test') {
      syntax = `T-TEST GROUPS=${groupVar || 'gender'}('${group1Val}' '${group2Val}')\n  /VARIABLES=${targetVars.join(' ')}.`;
    } else if (modalType === 'one_way_anova') {
      syntax = `ONEWAY ${depVar || 'salary'} BY ${factorVar || 'jobcat'}\n  /STATISTICS DESCRIPTIVES\n  /POSTHOC=TUKEY.`;
    } else if (modalType === 'two_way_anova') {
      syntax = `UNIANOVA ${depVar || 'salary'} BY ${factorVar || 'jobcat'} ${factorVarB || 'gender'}\n  /METHOD=SSTYPE(3)\n  /INTERCEPT=INCLUDE\n  /DESIGN=${factorVar || 'jobcat'} ${factorVarB || 'gender'} ${factorVar || 'jobcat'}*${factorVarB || 'gender'}.`;
    } else if (modalType === 'linear_regression') {
      syntax = `REGRESSION\n  /DEPENDENT ${depVar || 'salary'}\n  /METHOD=ENTER ${targetVars.join(' ')}.`;
    } else if (modalType === 'reliability') {
      syntax = `RELIABILITY\n  /VARIABLES=${targetVars.join(' ')}\n  /SCALE('ALL VARIABLES') ALL\n  /MODEL=ALPHA\n  /STATISTICS=DESCRIPTIVE SCALE CORR.`;
    } else if (modalType === 'mann_whitney') {
      syntax = `NPAR TESTS\n  /M-W= ${depVar || targetVars[0] || 'salary'} BY ${groupVar || 'gender'}('${group1Val}' '${group2Val}')\n  /MISSING ANALYSIS.`;
    } else if (modalType === 'wilcoxon') {
      syntax = `NPAR TESTS\n  /WILCOXON= ${targetVars[0] || 'salary'} WITH ${targetVars[1] || 'salbegin'} (PAIRED)\n  /MISSING ANALYSIS.`;
    } else if (modalType === 'kruskal_wallis') {
      syntax = `NPAR TESTS\n  /K-W= ${depVar || targetVars[0] || 'salary'} BY ${factorVar || 'jobcat'}\n  /MISSING ANALYSIS.`;
    } else if (modalType === 'explore') {
      syntax = `EXAMINE VARIABLES=${(targetVars.length > 0 ? targetVars : ['salary']).join(' ')}\n  /PLOT NPPLOT STEMLEAF\n  /STATISTICS DESCRIPTIVES EXTREME(5).`;
    } else if (modalType === 'factor_analysis') {
      syntax = `FACTOR\n  /VARIABLES ${(targetVars.length > 0 ? targetVars : ['salary', 'salbegin', 'educ']).join(' ')}\n  /EXTRACTION PC\n  /CRITERIA MINEIGEN(${factorOptions.eigenvalueCutoff})\n  /ROTATION ${factorOptions.rotation.toUpperCase()}\n  /METHOD=CORRELATION.`;
    } else if (modalType === 'logistic_regression') {
      syntax = `LOGISTIC REGRESSION VARIABLES ${depVar || 'gender'}\n  /METHOD=ENTER ${targetVars.join(' ')}\n  /CRITERIA=PIN(.05) POUT(.10) ITERATE(20) CUT(${logisticOptions.classificationCutoff})\n  /PRINT=GOODFIT CI(${logisticOptions.ciLevel}).`;
    } else if (modalType === 'compute_variable') {
      syntax = `COMPUTE ${computeTargetVar || 'new_var'} = ${computeExpression || '0'}.\nEXECUTE.`;
    } else if (modalType === 'sort_cases') {
      syntax = `SORT CASES BY ${targetVars[0] || variables[0]?.name} (${sortOrder === 'A' ? 'A' : 'D'}).`;
    } else if (modalType === 'select_cases') {
      syntax = `USE ALL.\nCOMPUTE filter_$ = (${filterCondition}).\nFILTER BY filter_$.\nEXECUTE.`;
    } else if (modalType === 'split_file') {
      syntax = splitVar ? `SORT CASES BY ${splitVar}.\nSPLIT FILE LAYERED BY ${splitVar}.` : 'SPLIT FILE OFF.';
    } else if (modalType === 'weight_cases') {
      syntax = weightVar ? `WEIGHT BY ${weightVar}.` : 'WEIGHT OFF.';
    } else if (modalType === 'means_report') {
      syntax = `MEANS TABLES=${targetVars.join(' ')} BY ${factorVar || 'jobcat'}\n  /CELLS=MEAN COUNT STDDEV MEDIAN MIN MAX SEMEAN.`;
    } else if (modalType === 'partial_correlation') {
      syntax = `PRCORR\n  /VARIABLES=${targetVars.join(' ')} WITH ${controlVar || 'educ'}\n  /SIGNIFICANCE=TWOTAIL.`;
    } else if (modalType === 'curve_estimation') {
      syntax = `CURVEFIT\n  /VARIABLES=${depVar || 'salary'} WITH ${indepVar || 'salbegin'}\n  /MODEL=LINEAR LOGARITHMIC QUADRATIC EXPONENTIAL.`;
    } else if (modalType === 'chi_square_goodness') {
      syntax = `NPAR TESTS\n  /CHISQUARE=${depVar || targetVars[0] || 'jobcat'}\n  /EXPECTED=EQUAL.`;
    } else if (modalType === 'binomial_test') {
      syntax = `NPAR TESTS\n  /BINOMIAL(${testProp})=${depVar || targetVars[0] || 'gender'}.`;
    } else if (modalType === 'runs_test') {
      syntax = `NPAR TESTS\n  /RUNS(${cutPointType.toUpperCase()})=${depVar || targetVars[0] || 'salary'}.`;
    }

    onPasteSyntax(syntax);
    onClose();
  };

  const dialogTitles: Record<string, string> = {
    frequencies: 'Frequencies',
    descriptives: 'Descriptives',
    explore: 'Explore (Normality Tests & Outliers)',
    crosstabs: 'Crosstabs',
    correlations: 'Bivariate Correlations',
    means_report: 'Means Report',
    partial_correlation: 'Partial Correlations',
    curve_estimation: 'Curve Estimation',
    chi_square_goodness: 'Chi-Square Test (Goodness of Fit)',
    binomial_test: 'Binomial Test',
    runs_test: 'Runs Test',
    one_sample_t_test: 'One-Sample T Test',
    independent_t_test: 'Independent-Samples T Test',
    paired_t_test: 'Paired-Samples T Test',
    one_way_anova: 'One-Way ANOVA',
    two_way_anova: 'Univariate ANOVA (Two-Way)',
    linear_regression: 'Linear Regression',
    logistic_regression: 'Binary Logistic Regression',
    factor_analysis: 'Factor Analysis (PCA)',
    reliability: 'Reliability Analysis (Cronbach\'s Alpha)',
    mann_whitney: 'Two-Independent-Samples Tests (Mann-Whitney U)',
    wilcoxon: 'Two-Related-Samples Tests (Wilcoxon)',
    kruskal_wallis: 'Tests for Several Independent Samples (Kruskal-Wallis H)',
    sort_cases: 'Sort Cases',
    select_cases: 'Select Cases',
    split_file: 'Split File',
    weight_cases: 'Weight Cases',
    compute_variable: 'Compute Variable',
    recode_variable: 'Recode Variables',
    chart_builder: 'Chart Builder',
  };

  return (
    <div className="spss-modal-overlay">
      <div className="spss-modal-dialog">
        {/* Header */}
        <div className="spss-modal-header">
          <span className="spss-modal-title">{dialogTitles[modalType]}</span>
          <button className="spss-modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="spss-modal-body">
          {/* Source Variables Column */}
          <div className="spss-picker-col">
            <span className="spss-picker-label">Variables:</span>
            <div className="spss-var-listbox">
              {variables.map((v) => (
                <div
                  key={v.name}
                  className={`spss-var-list-item ${selectedSourceVar === v.name ? 'selected' : ''}`}
                  onClick={() => setSelectedSourceVar(v.name)}
                  onDoubleClick={() => {
                    if (modalType === 'compute_variable') {
                      setComputeExpression((prev) => (prev ? `${prev} ${v.name}` : v.name));
                    } else if (modalType === 'one_way_anova') {
                      if (!depVar) setDepVar(v.name);
                      else if (!factorVar) setFactorVar(v.name);
                    } else if (modalType === 'crosstabs') {
                      if (!rowVar) setRowVar(v.name);
                      else if (!colVar) setColVar(v.name);
                    } else if (modalType === 'linear_regression') {
                      if (!depVar) setDepVar(v.name);
                      else if (!targetVars.includes(v.name)) setTargetVars([...targetVars, v.name]);
                    } else if (!targetVars.includes(v.name)) {
                      setTargetVars([...targetVars, v.name]);
                    }
                  }}
                >
                  {renderIcon(v)}
                  <span>{v.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Transfer Arrow Column */}
          <div className="spss-transfer-col">
            <button
              className="spss-transfer-btn"
              onClick={handleMoveToTarget}
              disabled={!selectedSourceVar}
              title="Add to selection"
            >
              <ArrowRight size={14} />
            </button>
            <button
              className="spss-transfer-btn"
              onClick={handleMoveToSource}
              disabled={!selectedTargetVar}
              title="Remove from selection"
            >
              <ArrowLeft size={14} />
            </button>
          </div>

          {/* Target Variables / Configuration Column */}
          <div className="spss-picker-col">
            {modalType === 'compute_variable' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <span className="spss-picker-label">Target Variable:</span>
                  <input
                    className="spss-text-input"
                    placeholder="e.g. total_score"
                    value={computeTargetVar}
                    onChange={(e) => setComputeTargetVar(e.target.value.replace(/\s+/g, '_'))}
                    style={{ fontWeight: 600 }}
                  />
                </div>
                <div>
                  <span className="spss-picker-label">Numeric Expression:</span>
                  <textarea
                    className="spss-text-input"
                    rows={4}
                    placeholder="e.g. salary - salbegin  or  educ + 5  or  SQRT(salary)"
                    value={computeExpression}
                    onChange={(e) => setComputeExpression(e.target.value)}
                    style={{ fontFamily: 'Consolas, monospace', fontSize: 13, resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {['+', '-', '*', '/', '(', ')', '**', 'SQRT(', 'LN(', 'ABS(', 'ROUND('].map((op) => (
                    <button
                      key={op}
                      type="button"
                      className="spss-btn"
                      style={{ padding: '2px 7px', fontSize: 11, minWidth: 28 }}
                      onClick={() => setComputeExpression((prev) => prev + (op.endsWith('(') ? op : ` ${op} `))}
                    >
                      {op}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="spss-btn"
                    style={{ padding: '2px 7px', fontSize: 11, color: 'var(--text-muted)' }}
                    onClick={() => setComputeExpression('')}
                  >
                    Clear
                  </button>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Tip: Double-click a variable on the left to insert into expression.
                </span>
              </div>
            ) : modalType === 'linear_regression' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <span className="spss-picker-label">Dependent (Y):</span>
                  <select
                    className="spss-text-input"
                    value={depVar}
                    onChange={(e) => setDepVar(e.target.value)}
                  >
                    <option value="">-- Select Dependent Variable --</option>
                    {variables.map((v) => (
                      <option key={v.name} value={v.name}>{v.name} ({v.label || v.type})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="spss-picker-label">Independent(s) [Block 1 of 1]:</span>
                  <div className="spss-var-listbox" style={{ height: 120 }}>
                    {targetVars.map((tv) => (
                      <div
                        key={tv}
                        className={`spss-var-list-item ${selectedTargetVar === tv ? 'selected' : ''}`}
                        onClick={() => setSelectedTargetVar(tv)}
                        onDoubleClick={handleMoveToSource}
                      >
                        {tv}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : modalType === 'crosstabs' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <span className="spss-picker-label">Row(s):</span>
                  <select
                    className="spss-text-input"
                    value={rowVar}
                    onChange={(e) => setRowVar(e.target.value)}
                  >
                    <option value="">-- Select Row Variable --</option>
                    {variables.map((v) => (
                      <option key={v.name} value={v.name}>{v.name} ({v.label || v.measure})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="spss-picker-label">Column(s):</span>
                  <select
                    className="spss-text-input"
                    value={colVar}
                    onChange={(e) => setColVar(e.target.value)}
                  >
                    <option value="">-- Select Column Variable --</option>
                    {variables.map((v) => (
                      <option key={v.name} value={v.name}>{v.name} ({v.label || v.measure})</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : modalType === 'one_way_anova' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <span className="spss-picker-label">Dependent List:</span>
                  <select
                    className="spss-text-input"
                    value={depVar}
                    onChange={(e) => setDepVar(e.target.value)}
                  >
                    <option value="">-- Dependent Variable --</option>
                    {variables.map((v) => (
                      <option key={v.name} value={v.name}>{v.name} ({v.type})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="spss-picker-label">Factor:</span>
                  <select
                    className="spss-text-input"
                    value={factorVar}
                    onChange={(e) => setFactorVar(e.target.value)}
                  >
                    <option value="">-- Group Factor Variable --</option>
                    {variables.map((v) => (
                      <option key={v.name} value={v.name}>{v.name} ({v.type})</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : modalType === 'two_way_anova' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <span className="spss-picker-label">Dependent Variable:</span>
                  <select
                    className="spss-text-input"
                    value={depVar}
                    onChange={(e) => setDepVar(e.target.value)}
                  >
                    <option value="">-- Select Continuous DV --</option>
                    {variables.map((v) => (
                      <option key={v.name} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="spss-picker-label">Factor A (Fixed):</span>
                  <select
                    className="spss-text-input"
                    value={factorVar}
                    onChange={(e) => setFactorVar(e.target.value)}
                  >
                    <option value="">-- Factor A --</option>
                    {variables.map((v) => (
                      <option key={v.name} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="spss-picker-label">Factor B (Fixed):</span>
                  <select
                    className="spss-text-input"
                    value={factorVarB}
                    onChange={(e) => setFactorVarB(e.target.value)}
                  >
                    <option value="">-- Factor B --</option>
                    {variables.map((v) => (
                      <option key={v.name} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : modalType === 'independent_t_test' || modalType === 'mann_whitney' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span className="spss-picker-label">Test Variable(s):</span>
                <div className="spss-var-listbox" style={{ height: 90 }}>
                  {targetVars.map((tv) => (
                    <div
                      key={tv}
                      className={`spss-var-list-item ${selectedTargetVar === tv ? 'selected' : ''}`}
                      onClick={() => setSelectedTargetVar(tv)}
                    >
                      {tv}
                    </div>
                  ))}
                </div>
                <div>
                  <span className="spss-picker-label">Grouping Variable:</span>
                  <select
                    className="spss-text-input"
                    value={groupVar}
                    onChange={(e) => setGroupVar(e.target.value)}
                  >
                    <option value="">-- Select Group Variable --</option>
                    {variables.map((v) => (
                      <option key={v.name} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11 }}>
                  <span>Define Groups:</span>
                  <input
                    className="spss-text-input"
                    style={{ width: 45, textAlign: 'center' }}
                    value={group1Val}
                    onChange={(e) => setGroup1Val(e.target.value)}
                    title="Group 1 Value"
                  />
                  <span>&</span>
                  <input
                    className="spss-text-input"
                    style={{ width: 45, textAlign: 'center' }}
                    value={group2Val}
                    onChange={(e) => setGroup2Val(e.target.value)}
                    title="Group 2 Value"
                  />
                </div>
              </div>
            ) : modalType === 'kruskal_wallis' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <span className="spss-picker-label">Test Variable:</span>
                  <select
                    className="spss-text-input"
                    value={depVar}
                    onChange={(e) => setDepVar(e.target.value)}
                  >
                    <option value="">-- Test Variable --</option>
                    {variables.map((v) => (
                      <option key={v.name} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="spss-picker-label">Grouping Variable:</span>
                  <select
                    className="spss-text-input"
                    value={factorVar}
                    onChange={(e) => setFactorVar(e.target.value)}
                  >
                    <option value="">-- Grouping Variable --</option>
                    {variables.map((v) => (
                      <option key={v.name} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : modalType === 'one_sample_t_test' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span className="spss-picker-label">Test Variable(s):</span>
                <div className="spss-var-listbox" style={{ height: 140 }}>
                  {targetVars.map((tv) => (
                    <div
                      key={tv}
                      className={`spss-var-list-item ${selectedTargetVar === tv ? 'selected' : ''}`}
                      onClick={() => setSelectedTargetVar(tv)}
                    >
                      {tv}
                    </div>
                  ))}
                </div>
                <div>
                  <span className="spss-picker-label">Test Value:</span>
                  <input
                    type="number"
                    className="spss-text-input"
                    value={testValue}
                    onChange={(e) => setTestValue(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            ) : modalType === 'explore' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <span className="spss-picker-label">Dependent List:</span>
                  <div className="spss-var-listbox" style={{ height: 110 }}>
                    {targetVars.map((tv) => (
                      <div
                        key={tv}
                        className={`spss-var-list-item ${selectedTargetVar === tv ? 'selected' : ''}`}
                        onClick={() => setSelectedTargetVar(tv)}
                        onDoubleClick={handleMoveToSource}
                      >
                        {tv}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="spss-picker-label">Factor List (Optional):</span>
                  <select
                    className="spss-text-input"
                    value={factorVar}
                    onChange={(e) => setFactorVar(e.target.value)}
                  >
                    <option value="">-- None (Univariate) --</option>
                    {variables.map((v) => (
                      <option key={v.name} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : modalType === 'logistic_regression' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <span className="spss-picker-label">Dependent (Binary):</span>
                  <select
                    className="spss-text-input"
                    value={depVar}
                    onChange={(e) => setDepVar(e.target.value)}
                  >
                    <option value="">-- Select Binary Variable --</option>
                    {variables.map((v) => (
                      <option key={v.name} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="spss-picker-label">Covariates:</span>
                  <div className="spss-var-listbox" style={{ height: 110 }}>
                    {targetVars.map((tv) => (
                      <div
                        key={tv}
                        className={`spss-var-list-item ${selectedTargetVar === tv ? 'selected' : ''}`}
                        onClick={() => setSelectedTargetVar(tv)}
                        onDoubleClick={handleMoveToSource}
                      >
                        {tv}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : modalType === 'sort_cases' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span className="spss-picker-label">Sort by:</span>
                <div className="spss-var-listbox" style={{ height: 110 }}>
                  {targetVars.map((tv) => (
                    <div key={tv} className="spss-var-list-item selected">
                      {tv}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
                  <span style={{ fontWeight: 600 }}>Sort Order:</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="radio"
                      name="sortOrder"
                      checked={sortOrder === 'A'}
                      onChange={() => setSortOrder('A')}
                    />
                    Ascending
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="radio"
                      name="sortOrder"
                      checked={sortOrder === 'D'}
                      onChange={() => setSortOrder('D')}
                    />
                    Descending
                  </label>
                </div>
              </div>
            ) : modalType === 'select_cases' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span className="spss-picker-label">If condition is satisfied:</span>
                <input
                  className="spss-text-input"
                  value={filterCondition}
                  onChange={(e) => setFilterCondition(e.target.value)}
                  placeholder="e.g. salary > 30000 and gender = 'm'"
                />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Unselected cases will be filtered or marked for analysis exclusion.
                </span>
              </div>
            ) : modalType === 'means_report' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <span className="spss-picker-label">Dependent List:</span>
                  <div className="spss-var-listbox" style={{ height: 110 }}>
                    {targetVars.map((tv) => (
                      <div
                        key={tv}
                        className={`spss-var-list-item ${selectedTargetVar === tv ? 'selected' : ''}`}
                        onClick={() => setSelectedTargetVar(tv)}
                        onDoubleClick={handleMoveToSource}
                      >
                        {tv}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="spss-picker-label">Layer 1 of 1 (Factor / Grouping Variable):</span>
                  <select
                    className="spss-text-input"
                    value={factorVar}
                    onChange={(e) => setFactorVar(e.target.value)}
                  >
                    <option value="">-- Select Factor Variable --</option>
                    {variables.map((v) => (
                      <option key={v.name} value={v.name}>{v.name} ({v.label || v.type})</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : modalType === 'partial_correlation' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <span className="spss-picker-label">Variables (at least 2):</span>
                  <div className="spss-var-listbox" style={{ height: 110 }}>
                    {targetVars.map((tv) => (
                      <div
                        key={tv}
                        className={`spss-var-list-item ${selectedTargetVar === tv ? 'selected' : ''}`}
                        onClick={() => setSelectedTargetVar(tv)}
                        onDoubleClick={handleMoveToSource}
                      >
                        {tv}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="spss-picker-label">Controlling for:</span>
                  <select
                    className="spss-text-input"
                    value={controlVar}
                    onChange={(e) => setControlVar(e.target.value)}
                  >
                    <option value="">-- Select Control Variable --</option>
                    {variables.map((v) => (
                      <option key={v.name} value={v.name}>{v.name} ({v.type})</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : modalType === 'curve_estimation' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <span className="spss-picker-label">Dependent (Y):</span>
                  <select
                    className="spss-text-input"
                    value={depVar}
                    onChange={(e) => setDepVar(e.target.value)}
                  >
                    <option value="">-- Select Dependent Variable --</option>
                    {variables.map((v) => (
                      <option key={v.name} value={v.name}>{v.name} ({v.type})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="spss-picker-label">Independent (X):</span>
                  <select
                    className="spss-text-input"
                    value={indepVar}
                    onChange={(e) => setIndepVar(e.target.value)}
                  >
                    <option value="">-- Select Independent Variable --</option>
                    {variables.map((v) => (
                      <option key={v.name} value={v.name}>{v.name} ({v.type})</option>
                    ))}
                  </select>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Models fitted: Linear, Logarithmic, Quadratic, and Exponential.
                </div>
              </div>
            ) : modalType === 'chi_square_goodness' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <span className="spss-picker-label">Test Variable:</span>
                  <select
                    className="spss-text-input"
                    value={depVar || targetVars[0] || ''}
                    onChange={(e) => {
                      setDepVar(e.target.value);
                      setTargetVars([e.target.value]);
                    }}
                  >
                    <option value="">-- Select Test Variable --</option>
                    {variables.map((v) => (
                      <option key={v.name} value={v.name}>{v.name} ({v.type})</option>
                    ))}
                  </select>
                </div>
                <fieldset style={{ border: '1px solid var(--border-app)', borderRadius: 4, padding: '8px 12px' }}>
                  <legend style={{ fontSize: 11, fontWeight: 600, padding: '0 4px' }}>Expected Values</legend>
                  <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="radio" checked readOnly /> All categories equal
                  </label>
                </fieldset>
              </div>
            ) : modalType === 'binomial_test' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <span className="spss-picker-label">Test Variable (Dichotomous):</span>
                  <select
                    className="spss-text-input"
                    value={depVar || targetVars[0] || ''}
                    onChange={(e) => {
                      setDepVar(e.target.value);
                      setTargetVars([e.target.value]);
                    }}
                  >
                    <option value="">-- Select Test Variable --</option>
                    {variables.map((v) => (
                      <option key={v.name} value={v.name}>{v.name} ({v.type})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="spss-picker-label">Test Proportion:</span>
                  <input
                    type="number"
                    step="0.05"
                    min="0.01"
                    max="0.99"
                    className="spss-text-input"
                    style={{ width: 90 }}
                    value={testProp}
                    onChange={(e) => setTestProp(parseFloat(e.target.value) || 0.5)}
                  />
                </div>
              </div>
            ) : modalType === 'runs_test' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <span className="spss-picker-label">Test Variable:</span>
                  <select
                    className="spss-text-input"
                    value={depVar || targetVars[0] || ''}
                    onChange={(e) => {
                      setDepVar(e.target.value);
                      setTargetVars([e.target.value]);
                    }}
                  >
                    <option value="">-- Select Test Variable --</option>
                    {variables.filter((v) => v.type === 'Numeric').map((v) => (
                      <option key={v.name} value={v.name}>{v.name} ({v.type})</option>
                    ))}
                  </select>
                </div>
                <fieldset style={{ border: '1px solid var(--border-app)', borderRadius: 4, padding: '8px 12px' }}>
                  <legend style={{ fontSize: 11, fontWeight: 600, padding: '0 4px' }}>Cut Point</legend>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="radio"
                        name="runsCut"
                        checked={cutPointType === 'median'}
                        onChange={() => setCutPointType('median')}
                      /> Median
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="radio"
                        name="runsCut"
                        checked={cutPointType === 'mean'}
                        onChange={() => setCutPointType('mean')}
                      /> Mean
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="radio"
                        name="runsCut"
                        checked={cutPointType === 'custom'}
                        onChange={() => setCutPointType('custom')}
                      /> Custom:
                      <input
                        type="number"
                        className="spss-text-input"
                        style={{ width: 70, marginLeft: 6 }}
                        value={customCut}
                        onChange={(e) => setCustomCut(parseFloat(e.target.value) || 0)}
                        disabled={cutPointType !== 'custom'}
                      />
                    </label>
                  </div>
                </fieldset>
              </div>
            ) : modalType === 'split_file' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="splitRadio"
                    checked={splitMode === 'off'}
                    onChange={() => setSplitMode('off')}
                  />
                  Analyze all cases, do not create groups (Split File off)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="splitRadio"
                    checked={splitMode === 'layered'}
                    onChange={() => setSplitMode('layered')}
                  />
                  Compare groups / Organize output by groups
                </label>

                {splitMode === 'layered' && (
                  <div style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span className="spss-picker-label">Groups Based On:</span>
                    <select
                      className="spss-text-input"
                      value={splitVar}
                      onChange={(e) => setSplitVar(e.target.value)}
                    >
                      <option value="">-- Select Split Variable --</option>
                      {variables.map((v) => (
                        <option key={v.name} value={v.name}>{v.name} ({v.type})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ) : modalType === 'weight_cases' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="weightRadio"
                    checked={weightMode === 'off'}
                    onChange={() => setWeightMode('off')}
                  />
                  Do not weight cases (Weight off)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="weightRadio"
                    checked={weightMode === 'weighted'}
                    onChange={() => setWeightMode('weighted')}
                  />
                  Weight cases by:
                </label>

                {weightMode === 'weighted' && (
                  <div style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span className="spss-picker-label">Frequency Variable:</span>
                    <select
                      className="spss-text-input"
                      value={weightVar}
                      onChange={(e) => setWeightVar(e.target.value)}
                    >
                      <option value="">-- Select Frequency Weight Variable --</option>
                      {variables.filter((v) => v.type === 'Numeric').map((v) => (
                        <option key={v.name} value={v.name}>{v.name} ({v.label || 'Numeric'})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ) : modalType === 'chart_builder' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <span className="spss-picker-label">Chart Type:</span>
                  <select
                    className="spss-text-input"
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as any)}
                  >
                    <option value="bar">Bar Chart</option>
                    <option value="pie">Pie Chart</option>
                    <option value="histogram">Histogram</option>
                    <option value="scatter">Scatter Plot</option>
                    <option value="line">Line Chart</option>
                    <option value="boxplot">Boxplot (Box and Whisker)</option>
                  </select>
                </div>
                <div>
                  <span className="spss-picker-label">X-Axis Variable:</span>
                  <select
                    className="spss-text-input"
                    value={chartXVar}
                    onChange={(e) => setChartXVar(e.target.value)}
                  >
                    <option value="">-- Select X-Axis --</option>
                    {variables.map((v) => (
                      <option key={v.name} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>
                {chartType === 'scatter' && (
                  <div>
                    <span className="spss-picker-label">Y-Axis Variable:</span>
                    <select
                      className="spss-text-input"
                      value={chartYVar}
                      onChange={(e) => setChartYVar(e.target.value)}
                    >
                      <option value="">-- Select Y-Axis --</option>
                      {variables.map((v) => (
                        <option key={v.name} value={v.name}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <span className="spss-picker-label">Chart Title:</span>
                  <input
                    className="spss-text-input"
                    placeholder="Custom chart title..."
                    value={chartTitle}
                    onChange={(e) => setChartTitle(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              // Standard target list box
              <>
                <span className="spss-picker-label">Selected Variable(s) (Items):</span>
                <div className="spss-var-listbox">
                  {targetVars.map((tv) => {
                    const meta = variables.find((v) => v.name === tv);
                    return (
                      <div
                        key={tv}
                        className={`spss-var-list-item ${selectedTargetVar === tv ? 'selected' : ''}`}
                        onClick={() => setSelectedTargetVar(tv)}
                        onDoubleClick={handleMoveToSource}
                      >
                        {meta && renderIcon(meta)}
                        <span>{tv}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Action Column (Classic SPSS Right Buttons) */}
          <div className="spss-modal-actions-col">
            <button className="spss-btn spss-btn-primary" onClick={handleRun}>
              OK
            </button>
            <button className="spss-btn" onClick={handlePaste} title="Paste syntax to Syntax Editor">
              Paste
            </button>
            <button
              className="spss-btn"
              onClick={() => {
                setTargetVars([]);
                setSelectedSourceVar(null);
                setSelectedTargetVar(null);
                setRowVar('');
                setColVar('');
                setDepVar('');
                setFactorVar('');
                setFactorVarB('');
                setGroupVar('');
                setControlVar('');
                setIndepVar('');
              }}
              title="Reset dialog state"
            >
              Reset
            </button>
            <button className="spss-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              className="spss-btn"
              onClick={() => {
                const helpMap: Record<string, string> = {
                  frequencies: 'Frequencies: Counts occurrences and computes percentages, valid percent, and cumulative percent for discrete or categorical variables.',
                  descriptives: 'Descriptives: Computes univariate summary statistics (Mean, Std Dev, Min, Max, Variance, S.E. Mean, Skewness, Kurtosis) for numeric scale variables.',
                  crosstabs: 'Crosstabs: Cross-tabulates two categorical variables and calculates Pearson Chi-Square tests of independence and cell percentages.',
                  correlations: 'Bivariate Correlations: Computes Pearson r correlation matrix with two-tailed significance test between two or more scale variables.',
                  one_sample_t_test: 'One-Sample T-Test: Tests whether the sample mean of a scale variable differs significantly from a specified hypothesized test value.',
                  independent_t_test: 'Independent-Samples T-Test: Compares the means of two independent groups using Student\'s t and Levene\'s Test for Equality of Variances.',
                  paired_t_test: 'Paired-Samples T-Test: Compares means of two related measures on the same subjects (e.g., Pre-test vs Post-test).',
                  one_way_anova: 'One-Way ANOVA: Tests whether the means of several groups differ significantly using the F-test, with optional Tukey Post-Hoc comparisons.',
                  two_way_anova: 'Two-Way ANOVA: Analyzes the effects of two categorical factors and their interaction on a continuous dependent variable.',
                  linear_regression: 'Linear Regression: Estimates coefficients of a linear model predicting a dependent variable from one or more independent variables.',
                  reliability: 'Reliability Analysis: Evaluates internal consistency of multi-item questionnaires using Cronbach\'s Alpha.',
                  means_report: 'Means Report: Calculates detailed descriptive statistics (Mean, N, Std Dev, Median, Min, Max) for dependent variables broken down by grouping factors.',
                  partial_correlation: 'Partial Correlation: Measures linear relationship between two variables while controlling for the effects of one or more additional variables.',
                  curve_estimation: 'Curve Estimation: Compares multiple regression curve models (Linear, Logarithmic, Quadratic, Exponential) to identify best fit.',
                  chi_square_goodness: 'Chi-Square Goodness-of-Fit: Tests whether observed category frequencies match expected equal proportions.',
                  binomial_test: 'Binomial Test: Tests whether observed proportions of a dichotomous variable differ significantly from an expected proportion (e.g. 0.50).',
                  runs_test: 'Runs Test: Tests the hypothesis of randomness for a sequence of numeric data points relative to a specified cut point (median or mean).',
                  split_file: 'Split File: Stratifies your dataset by a grouping variable so that subsequent statistical analyses are performed separately for each category.',
                  weight_cases: 'Weight Cases: Gives cases different weights (by frequency or importance) for statistical calculations and frequency tables.',
                  chart_builder: 'Chart Builder: Generates statistical visualizations (Bar, Pie, Histogram, Scatter, Line, Boxplot).',
                };
                alert(helpMap[modalType || ''] || 'Refer to IBM SPSS Statistics 29.0 Core System User\'s Guide.');
              }}
            >
              Help
            </button>

            {/* Sub-Dialog Triggers */}
            {modalType === 'frequencies' && (
              <div className="spss-subdialog-btn-group">
                <button type="button" className="spss-subdialog-btn" onClick={() => setActiveSubDialog('statistics')}>Statistics...</button>
                <button type="button" className="spss-subdialog-btn" onClick={() => setActiveSubDialog('charts')}>Charts...</button>
              </div>
            )}
            {modalType === 'descriptives' && (
              <div className="spss-subdialog-btn-group">
                <button type="button" className="spss-subdialog-btn" onClick={() => setActiveSubDialog('options')}>Options...</button>
              </div>
            )}
            {modalType === 'explore' && (
              <div className="spss-subdialog-btn-group">
                <button type="button" className="spss-subdialog-btn" onClick={() => setActiveSubDialog('statistics')}>Statistics...</button>
                <button type="button" className="spss-subdialog-btn" onClick={() => setActiveSubDialog('plots')}>Plots...</button>
              </div>
            )}
            {modalType === 'crosstabs' && (
              <div className="spss-subdialog-btn-group">
                <button type="button" className="spss-subdialog-btn" onClick={() => setActiveSubDialog('statistics')}>Statistics...</button>
                <button type="button" className="spss-subdialog-btn" onClick={() => setActiveSubDialog('cells')}>Cells...</button>
              </div>
            )}
            {modalType === 'one_way_anova' && (
              <div className="spss-subdialog-btn-group">
                <button type="button" className="spss-subdialog-btn" onClick={() => setActiveSubDialog('posthoc')}>Post Hoc...</button>
                <button type="button" className="spss-subdialog-btn" onClick={() => setActiveSubDialog('options')}>Options...</button>
              </div>
            )}
            {modalType === 'two_way_anova' && (
              <div className="spss-subdialog-btn-group">
                <button type="button" className="spss-subdialog-btn" onClick={() => setActiveSubDialog('options')}>Options...</button>
              </div>
            )}
            {modalType === 'linear_regression' && (
              <div className="spss-subdialog-btn-group">
                <button type="button" className="spss-subdialog-btn" onClick={() => setActiveSubDialog('statistics')}>Statistics...</button>
                <button type="button" className="spss-subdialog-btn" onClick={() => setActiveSubDialog('options')}>Options...</button>
              </div>
            )}
            {modalType === 'factor_analysis' && (
              <div className="spss-subdialog-btn-group">
                <button type="button" className="spss-subdialog-btn" onClick={() => setActiveSubDialog('factor_options')}>Extraction & Rotation...</button>
              </div>
            )}
            {modalType === 'logistic_regression' && (
              <div className="spss-subdialog-btn-group">
                <button type="button" className="spss-subdialog-btn" onClick={() => setActiveSubDialog('options')}>Options...</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nested Sub-Dialog Modal */}
      {activeSubDialog && (
        <div className="spss-subdialog-overlay" onClick={() => setActiveSubDialog(null)}>
          <div className="spss-subdialog-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="spss-subdialog-header">
              <span>
                {activeSubDialog === 'statistics' && `${dialogTitles[modalType] || 'Analysis'}: Statistics`}
                {activeSubDialog === 'charts' && `${dialogTitles[modalType] || 'Analysis'}: Charts`}
                {activeSubDialog === 'options' && `${dialogTitles[modalType] || 'Analysis'}: Options`}
                {activeSubDialog === 'cells' && `${dialogTitles[modalType] || 'Analysis'}: Cell Display`}
                {activeSubDialog === 'posthoc' && 'One-Way ANOVA: Post Hoc Multiple Comparisons'}
                {activeSubDialog === 'plots' && 'Explore: Plots'}
                {activeSubDialog === 'factor_options' && 'Factor Analysis: Extraction & Rotation'}
              </span>
              <button className="spss-modal-close-btn" onClick={() => setActiveSubDialog(null)}>
                <X size={15} />
              </button>
            </div>

            <div className="spss-subdialog-body">
              {activeSubDialog === 'statistics' && (
                <div>
                  <fieldset className="spss-subdialog-fieldset">
                    <legend className="spss-subdialog-legend">Central Tendency</legend>
                    <div className="spss-subdialog-checkbox-grid">
                      <label className="spss-checkbox-label">
                        <input
                          type="checkbox"
                          checked={statsOptions.mean}
                          onChange={(e) => setStatsOptions({ ...statsOptions, mean: e.target.checked })}
                        /> Mean
                      </label>
                      <label className="spss-checkbox-label">
                        <input
                          type="checkbox"
                          checked={statsOptions.median}
                          onChange={(e) => setStatsOptions({ ...statsOptions, median: e.target.checked })}
                        /> Median
                      </label>
                    </div>
                  </fieldset>

                  <fieldset className="spss-subdialog-fieldset">
                    <legend className="spss-subdialog-legend">Dispersion</legend>
                    <div className="spss-subdialog-checkbox-grid">
                      <label className="spss-checkbox-label">
                        <input
                          type="checkbox"
                          checked={statsOptions.stdDev}
                          onChange={(e) => setStatsOptions({ ...statsOptions, stdDev: e.target.checked })}
                        /> Std. deviation
                      </label>
                      <label className="spss-checkbox-label">
                        <input
                          type="checkbox"
                          checked={statsOptions.variance}
                          onChange={(e) => setStatsOptions({ ...statsOptions, variance: e.target.checked })}
                        /> Variance
                      </label>
                      <label className="spss-checkbox-label">
                        <input
                          type="checkbox"
                          checked={statsOptions.range}
                          onChange={(e) => setStatsOptions({ ...statsOptions, range: e.target.checked })}
                        /> Range
                      </label>
                      <label className="spss-checkbox-label">
                        <input
                          type="checkbox"
                          checked={statsOptions.min}
                          onChange={(e) => setStatsOptions({ ...statsOptions, min: e.target.checked })}
                        /> Minimum
                      </label>
                      <label className="spss-checkbox-label">
                        <input
                          type="checkbox"
                          checked={statsOptions.max}
                          onChange={(e) => setStatsOptions({ ...statsOptions, max: e.target.checked })}
                        /> Maximum
                      </label>
                      <label className="spss-checkbox-label">
                        <input
                          type="checkbox"
                          checked={statsOptions.seMean}
                          onChange={(e) => setStatsOptions({ ...statsOptions, seMean: e.target.checked })}
                        /> S.E. mean
                      </label>
                    </div>
                  </fieldset>

                  <fieldset className="spss-subdialog-fieldset">
                    <legend className="spss-subdialog-legend">Distribution</legend>
                    <div className="spss-subdialog-checkbox-grid">
                      <label className="spss-checkbox-label">
                        <input
                          type="checkbox"
                          checked={statsOptions.skewness}
                          onChange={(e) => setStatsOptions({ ...statsOptions, skewness: e.target.checked })}
                        /> Skewness
                      </label>
                      <label className="spss-checkbox-label">
                        <input
                          type="checkbox"
                          checked={statsOptions.kurtosis}
                          onChange={(e) => setStatsOptions({ ...statsOptions, kurtosis: e.target.checked })}
                        /> Kurtosis
                      </label>
                    </div>
                  </fieldset>

                  <fieldset className="spss-subdialog-fieldset">
                    <legend className="spss-subdialog-legend">Percentile Values</legend>
                    <div className="spss-subdialog-checkbox-grid">
                      <label className="spss-checkbox-label">
                        <input
                          type="checkbox"
                          checked={statsOptions.quartiles}
                          onChange={(e) => setStatsOptions({ ...statsOptions, quartiles: e.target.checked })}
                        /> Quartiles
                      </label>
                    </div>
                  </fieldset>
                </div>
              )}

              {activeSubDialog === 'charts' && (
                <div>
                  <fieldset className="spss-subdialog-fieldset">
                    <legend className="spss-subdialog-legend">Chart Type</legend>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                      <label className="spss-checkbox-label">
                        <input
                          type="radio"
                          name="subChartType"
                          checked={chartsOptions.chartType === 'none'}
                          onChange={() => setChartsOptions({ ...chartsOptions, chartType: 'none' })}
                        /> None
                      </label>
                      <label className="spss-checkbox-label">
                        <input
                          type="radio"
                          name="subChartType"
                          checked={chartsOptions.chartType === 'bar'}
                          onChange={() => setChartsOptions({ ...chartsOptions, chartType: 'bar' })}
                        /> Bar charts
                      </label>
                      <label className="spss-checkbox-label">
                        <input
                          type="radio"
                          name="subChartType"
                          checked={chartsOptions.chartType === 'pie'}
                          onChange={() => setChartsOptions({ ...chartsOptions, chartType: 'pie' })}
                        /> Pie charts
                      </label>
                      <label className="spss-checkbox-label">
                        <input
                          type="radio"
                          name="subChartType"
                          checked={chartsOptions.chartType === 'histogram'}
                          onChange={() => setChartsOptions({ ...chartsOptions, chartType: 'histogram' })}
                        /> Histograms
                      </label>
                    </div>
                  </fieldset>

                  {chartsOptions.chartType === 'histogram' && (
                    <fieldset className="spss-subdialog-fieldset">
                      <legend className="spss-subdialog-legend">Chart Options</legend>
                      <label className="spss-checkbox-label">
                        <input
                          type="checkbox"
                          checked={chartsOptions.showNormalCurve}
                          onChange={(e) => setChartsOptions({ ...chartsOptions, showNormalCurve: e.target.checked })}
                        /> Show normal curve on histogram
                      </label>
                    </fieldset>
                  )}
                </div>
              )}

              {activeSubDialog === 'options' && (
                modalType === 'logistic_regression' ? (
                  <div>
                    <fieldset className="spss-subdialog-fieldset">
                      <legend className="spss-subdialog-legend">Logistic Regression Options</legend>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>Confidence Interval for Exp(B):</span>
                          <input
                            type="number"
                            className="spss-text-input"
                            style={{ width: 60 }}
                            value={logisticOptions.ciLevel}
                            onChange={(e) => setLogisticOptions({ ...logisticOptions, ciLevel: parseFloat(e.target.value) || 95 })}
                          />
                          <span>%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>Classification cutoff:</span>
                          <input
                            type="number"
                            step="0.05"
                            className="spss-text-input"
                            style={{ width: 60 }}
                            value={logisticOptions.classificationCutoff}
                            onChange={(e) => setLogisticOptions({ ...logisticOptions, classificationCutoff: parseFloat(e.target.value) || 0.5 })}
                          />
                        </div>
                        <label className="spss-checkbox-label">
                          <input
                            type="checkbox"
                            checked={logisticOptions.includeConstant}
                            onChange={(e) => setLogisticOptions({ ...logisticOptions, includeConstant: e.target.checked })}
                          /> Include constant in model
                        </label>
                      </div>
                    </fieldset>
                  </div>
                ) : (
                  <div>
                    <fieldset className="spss-subdialog-fieldset">
                      <legend className="spss-subdialog-legend">Display Order</legend>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                        <label className="spss-checkbox-label">
                          <input type="radio" name="displayOrder" defaultChecked /> Variable list
                        </label>
                        <label className="spss-checkbox-label">
                          <input type="radio" name="displayOrder" /> Alphabetic
                        </label>
                        <label className="spss-checkbox-label">
                          <input type="radio" name="displayOrder" /> Ascending means
                        </label>
                        <label className="spss-checkbox-label">
                          <input type="radio" name="displayOrder" /> Descending means
                        </label>
                      </div>
                    </fieldset>

                    <fieldset className="spss-subdialog-fieldset">
                      <legend className="spss-subdialog-legend">Missing Values</legend>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                        <label className="spss-checkbox-label">
                          <input type="radio" name="missingValues" defaultChecked /> Exclude cases listwise
                        </label>
                        <label className="spss-checkbox-label">
                          <input type="radio" name="missingValues" /> Exclude cases pairwise
                        </label>
                      </div>
                    </fieldset>
                  </div>
                )
              )}

              {activeSubDialog === 'cells' && (
                <div>
                  <fieldset className="spss-subdialog-fieldset">
                    <legend className="spss-subdialog-legend">Counts</legend>
                    <div className="spss-subdialog-checkbox-grid">
                      <label className="spss-checkbox-label">
                        <input
                          type="checkbox"
                          checked={crosstabsOptions.observed}
                          onChange={(e) => setCrosstabsOptions({ ...crosstabsOptions, observed: e.target.checked })}
                        /> Observed
                      </label>
                      <label className="spss-checkbox-label">
                        <input
                          type="checkbox"
                          checked={crosstabsOptions.expected}
                          onChange={(e) => setCrosstabsOptions({ ...crosstabsOptions, expected: e.target.checked })}
                        /> Expected
                      </label>
                    </div>
                  </fieldset>

                  <fieldset className="spss-subdialog-fieldset">
                    <legend className="spss-subdialog-legend">Percentages</legend>
                    <div className="spss-subdialog-checkbox-grid">
                      <label className="spss-checkbox-label">
                        <input
                          type="checkbox"
                          checked={crosstabsOptions.rowPct}
                          onChange={(e) => setCrosstabsOptions({ ...crosstabsOptions, rowPct: e.target.checked })}
                        /> Row
                      </label>
                      <label className="spss-checkbox-label">
                        <input
                          type="checkbox"
                          checked={crosstabsOptions.colPct}
                          onChange={(e) => setCrosstabsOptions({ ...crosstabsOptions, colPct: e.target.checked })}
                        /> Column
                      </label>
                      <label className="spss-checkbox-label">
                        <input
                          type="checkbox"
                          checked={crosstabsOptions.totalPct}
                          onChange={(e) => setCrosstabsOptions({ ...crosstabsOptions, totalPct: e.target.checked })}
                        /> Total
                      </label>
                    </div>
                  </fieldset>
                </div>
              )}

              {activeSubDialog === 'posthoc' && (
                <div>
                  <fieldset className="spss-subdialog-fieldset">
                    <legend className="spss-subdialog-legend">Equal Variances Assumed</legend>
                    <div className="spss-subdialog-checkbox-grid">
                      <label className="spss-checkbox-label">
                        <input
                          type="checkbox"
                          checked={postHocOptions.tukey}
                          onChange={(e) => setPostHocOptions({ ...postHocOptions, tukey: e.target.checked })}
                        /> Tukey (HSD)
                      </label>
                      <label className="spss-checkbox-label">
                        <input
                          type="checkbox"
                          checked={postHocOptions.bonferroni}
                          onChange={(e) => setPostHocOptions({ ...postHocOptions, bonferroni: e.target.checked })}
                        /> Bonferroni
                      </label>
                      <label className="spss-checkbox-label">
                        <input
                          type="checkbox"
                          checked={postHocOptions.scheffe}
                          onChange={(e) => setPostHocOptions({ ...postHocOptions, scheffe: e.target.checked })}
                        /> Scheffe
                      </label>
                      <label className="spss-checkbox-label">
                        <input
                          type="checkbox"
                          checked={postHocOptions.lsd}
                          onChange={(e) => setPostHocOptions({ ...postHocOptions, lsd: e.target.checked })}
                        /> LSD (Equal Variances)
                      </label>
                    </div>
                  </fieldset>

                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="spss-picker-label">Significance level:</span>
                    <input
                      type="number"
                      step="0.01"
                      className="spss-text-input"
                      style={{ width: 70 }}
                      value={postHocOptions.significanceLevel}
                      onChange={(e) => setPostHocOptions({ ...postHocOptions, significanceLevel: parseFloat(e.target.value) || 0.05 })}
                    />
                  </div>
                </div>
              )}

              {activeSubDialog === 'plots' && (
                <div>
                  <fieldset className="spss-subdialog-fieldset">
                    <legend className="spss-subdialog-legend">Boxplots</legend>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                      <label className="spss-checkbox-label">
                        <input
                          type="radio"
                          name="boxplots"
                          checked={exploreOptions.boxplots === 'factor'}
                          onChange={() => setExploreOptions({ ...exploreOptions, boxplots: 'factor' })}
                        /> Factor levels together
                      </label>
                      <label className="spss-checkbox-label">
                        <input
                          type="radio"
                          name="boxplots"
                          checked={exploreOptions.boxplots === 'dependents'}
                          onChange={() => setExploreOptions({ ...exploreOptions, boxplots: 'dependents' })}
                        /> Dependents together
                      </label>
                      <label className="spss-checkbox-label">
                        <input
                          type="radio"
                          name="boxplots"
                          checked={exploreOptions.boxplots === 'none'}
                          onChange={() => setExploreOptions({ ...exploreOptions, boxplots: 'none' })}
                        /> None
                      </label>
                    </div>
                  </fieldset>

                  <fieldset className="spss-subdialog-fieldset">
                    <legend className="spss-subdialog-legend">Descriptive</legend>
                    <div className="spss-subdialog-checkbox-grid">
                      <label className="spss-checkbox-label">
                        <input
                          type="checkbox"
                          checked={exploreOptions.stemAndLeaf}
                          onChange={(e) => setExploreOptions({ ...exploreOptions, stemAndLeaf: e.target.checked })}
                        /> Stem-and-leaf
                      </label>
                      <label className="spss-checkbox-label">
                        <input
                          type="checkbox"
                          checked={exploreOptions.normalityPlots}
                          onChange={(e) => setExploreOptions({ ...exploreOptions, normalityPlots: e.target.checked })}
                        /> Normality plots with tests
                      </label>
                    </div>
                  </fieldset>
                </div>
              )}

              {activeSubDialog === 'factor_options' && (
                <div>
                  <fieldset className="spss-subdialog-fieldset">
                    <legend className="spss-subdialog-legend">Extraction Method</legend>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                      <label className="spss-checkbox-label">
                        <input
                          type="radio"
                          name="factorExtraction"
                          checked={factorOptions.extraction === 'pca'}
                          onChange={() => setFactorOptions({ ...factorOptions, extraction: 'pca' })}
                        /> Principal components (PCA)
                      </label>
                      <label className="spss-checkbox-label">
                        <input
                          type="radio"
                          name="factorExtraction"
                          checked={factorOptions.extraction === 'pa'}
                          onChange={() => setFactorOptions({ ...factorOptions, extraction: 'pa' })}
                        /> Principal axis factoring
                      </label>
                    </div>
                  </fieldset>

                  <fieldset className="spss-subdialog-fieldset">
                    <legend className="spss-subdialog-legend">Rotation Method</legend>
                    <div className="spss-subdialog-checkbox-grid">
                      <label className="spss-checkbox-label">
                        <input
                          type="radio"
                          name="factorRotation"
                          checked={factorOptions.rotation === 'varimax'}
                          onChange={() => setFactorOptions({ ...factorOptions, rotation: 'varimax' })}
                        /> Varimax (Orthogonal)
                      </label>
                      <label className="spss-checkbox-label">
                        <input
                          type="radio"
                          name="factorRotation"
                          checked={factorOptions.rotation === 'direct_oblimin'}
                          onChange={() => setFactorOptions({ ...factorOptions, rotation: 'direct_oblimin' })}
                        /> Direct Oblimin (Oblique)
                      </label>
                      <label className="spss-checkbox-label">
                        <input
                          type="radio"
                          name="factorRotation"
                          checked={factorOptions.rotation === 'quartimax'}
                          onChange={() => setFactorOptions({ ...factorOptions, rotation: 'quartimax' })}
                        /> Quartimax
                      </label>
                      <label className="spss-checkbox-label">
                        <input
                          type="radio"
                          name="factorRotation"
                          checked={factorOptions.rotation === 'none'}
                          onChange={() => setFactorOptions({ ...factorOptions, rotation: 'none' })}
                        /> None
                      </label>
                    </div>
                  </fieldset>

                  <fieldset className="spss-subdialog-fieldset">
                    <legend className="spss-subdialog-legend">Display</legend>
                    <label className="spss-checkbox-label">
                      <input
                        type="checkbox"
                        checked={factorOptions.screePlot}
                        onChange={(e) => setFactorOptions({ ...factorOptions, screePlot: e.target.checked })}
                      /> Scree plot
                    </label>
                  </fieldset>
                </div>
              )}
            </div>

            <div className="spss-subdialog-footer">
              <button className="spss-btn spss-btn-primary" onClick={() => setActiveSubDialog(null)}>
                Continue
              </button>
              <button className="spss-btn" onClick={() => setActiveSubDialog(null)}>
                Cancel
              </button>
              <button
                className="spss-btn"
                onClick={() => alert('Refer to IBM SPSS Statistics Command Syntax Reference for statistical options.')}
              >
                Help
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
