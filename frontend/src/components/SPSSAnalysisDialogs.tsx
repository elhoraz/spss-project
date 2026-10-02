import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { VariableMeta, AnalysisModalType, OutputItem } from '../types/spss';
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
} from '../utils/clientStats';

interface SPSSAnalysisDialogsProps {
  modalType: AnalysisModalType;
  variables: VariableMeta[];
  rows: Record<string, any>[];
  onClose: () => void;
  onAnalysisComplete: (output: OutputItem) => void;
  onPasteSyntax: (syntax: string) => void;
  onApplyDataOperation?: (newRows: Record<string, any>[]) => void;
}

export const SPSSAnalysisDialogs: React.FC<SPSSAnalysisDialogsProps> = ({
  modalType,
  variables,
  rows,
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

  // Chart builder state
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'histogram' | 'scatter' | 'line'>('bar');
  const [chartXVar, setChartXVar] = useState<string>('');
  const [chartYVar, setChartYVar] = useState<string>('');
  const [chartTitle, setChartTitle] = useState<string>('');

  // Data management state
  const [sortOrder, setSortOrder] = useState<'A' | 'D'>('A');
  const [filterCondition, setFilterCondition] = useState<string>('salary > 30000');
  const [splitVar, setSplitVar] = useState<string>('');
  const [weightVar, setWeightVar] = useState<string>('');

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
  const handleRun = () => {
    let output: OutputItem | null = null;

    try {
      if (modalType === 'frequencies') {
        const vars = targetVars.length > 0 ? targetVars : [variables[0]?.name];
        output = clientComputeFrequencies(rows, vars);
      } else if (modalType === 'descriptives') {
        const vars = targetVars.length > 0 ? targetVars : variables.filter((v) => v.measure === 'Scale').map((v) => v.name);
        output = clientComputeDescriptives(rows, vars);
      } else if (modalType === 'crosstabs') {
        const r = rowVar || targetVars[0] || 'gender';
        const c = colVar || targetVars[1] || 'jobcat';
        output = clientComputeCrosstabs(rows, r, c);
      } else if (modalType === 'correlations') {
        const vars = targetVars.length > 1 ? targetVars : variables.filter((v) => v.measure === 'Scale').map((v) => v.name).slice(0, 3);
        output = clientComputeCorrelations(rows, vars);
      } else if (modalType === 'one_sample_t_test') {
        const vars = targetVars.length > 0 ? targetVars : ['salary'];
        output = clientComputeOneSampleTTest(rows, vars, testValue);
      } else if (modalType === 'independent_t_test') {
        const vars = targetVars.length > 0 ? targetVars : ['salary'];
        const g = groupVar || 'gender';
        output = clientComputeIndependentTTest(rows, vars, g, group1Val, group2Val);
      } else if (modalType === 'paired_t_test') {
        const v1 = targetVars[0] || 'salary';
        const v2 = targetVars[1] || 'salbegin';
        output = {
          id: `out_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          title: 'Paired Samples T-Test',
          type: 'paired_t_test',
          syntax: `T-TEST PAIRS=${v1} WITH ${v2} (PAIRED).`,
          data: clientComputeDescriptives(rows, [v1, v2]).data,
        };
      } else if (modalType === 'one_way_anova') {
        const d = depVar || targetVars[0] || 'salary';
        const f = factorVar || 'jobcat';
        output = clientComputeAnova(rows, d, f);
      } else if (modalType === 'two_way_anova') {
        const d = depVar || targetVars[0] || 'salary';
        const fA = factorVar || 'jobcat';
        const fB = factorVarB || 'gender';
        output = clientComputeTwoWayAnova(rows, d, fA, fB);
      } else if (modalType === 'linear_regression') {
        const d = depVar || 'salary';
        const ivs = targetVars.length > 0 ? targetVars : ['salbegin', 'educ'];
        output = clientComputeLinearRegression(rows, d, ivs);
      } else if (modalType === 'reliability') {
        const items = targetVars.length >= 2 ? targetVars : ['salary', 'salbegin', 'educ'];
        output = clientComputeReliability(rows, items);
      } else if (modalType === 'mann_whitney') {
        const testV = depVar || targetVars[0] || 'salary';
        const grpV = groupVar || 'gender';
        output = clientComputeMannWhitney(rows, testV, grpV);
      } else if (modalType === 'wilcoxon') {
        const v1 = targetVars[0] || 'salary';
        const v2 = targetVars[1] || 'salbegin';
        output = clientComputeWilcoxon(rows, v1, v2);
      } else if (modalType === 'kruskal_wallis') {
        const testV = depVar || targetVars[0] || 'salary';
        const grpV = factorVar || 'jobcat';
        output = clientComputeKruskalWallis(rows, testV, grpV);
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
        const sVar = splitVar || selectedSourceVar || targetVars[0] || variables[0]?.name;
        output = {
          id: `dm_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          title: 'Split File',
          type: 'data_management',
          syntax: `SORT CASES BY ${sVar}.\nSPLIT FILE LAYERED BY ${sVar}.`,
          data: {
            'Operation': 'SPLIT FILE',
            'Layer Variable': sVar,
            'Status': 'Output will be grouped by split categories',
          },
        };
      } else if (modalType === 'weight_cases') {
        const wVar = weightVar || selectedSourceVar || targetVars[0] || variables[0]?.name;
        output = {
          id: `dm_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          title: 'Weight Cases',
          type: 'data_management',
          syntax: `WEIGHT BY ${wVar}.`,
          data: {
            'Operation': 'WEIGHT CASES',
            'Frequency Variable': wVar,
            'Status': 'Active case weights applied',
          },
        };
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
    } else if (modalType === 'sort_cases') {
      syntax = `SORT CASES BY ${targetVars[0] || variables[0]?.name} (${sortOrder === 'A' ? 'A' : 'D'}).`;
    } else if (modalType === 'select_cases') {
      syntax = `USE ALL.\nCOMPUTE filter_$ = (${filterCondition}).\nFILTER BY filter_$.\nEXECUTE.`;
    } else if (modalType === 'split_file') {
      syntax = `SORT CASES BY ${splitVar || variables[0]?.name}.\nSPLIT FILE LAYERED BY ${splitVar || variables[0]?.name}.`;
    } else if (modalType === 'weight_cases') {
      syntax = `WEIGHT BY ${weightVar || variables[0]?.name}.`;
    }

    onPasteSyntax(syntax);
    onClose();
  };

  const dialogTitles: Record<string, string> = {
    frequencies: 'Frequencies',
    descriptives: 'Descriptives',
    crosstabs: 'Crosstabs',
    correlations: 'Bivariate Correlations',
    one_sample_t_test: 'One-Sample T Test',
    independent_t_test: 'Independent-Samples T Test',
    paired_t_test: 'Paired-Samples T Test',
    one_way_anova: 'One-Way ANOVA',
    two_way_anova: 'Univariate ANOVA (Two-Way)',
    linear_regression: 'Linear Regression',
    reliability: 'Reliability Analysis (Cronbach\'s Alpha)',
    mann_whitney: 'Two-Independent-Samples Tests (Mann-Whitney U)',
    wilcoxon: 'Two-Related-Samples Tests (Wilcoxon)',
    kruskal_wallis: 'Tests for Several Independent Samples (Kruskal-Wallis H)',
    sort_cases: 'Sort Cases',
    select_cases: 'Select Cases',
    split_file: 'Split File',
    weight_cases: 'Weight Cases',
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
                    if (!targetVars.includes(v.name)) {
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
            {modalType === 'crosstabs' ? (
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
                    {variables.filter((v) => v.measure === 'Scale').map((v) => (
                      <option key={v.name} value={v.name}>{v.name}</option>
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
                    {variables.filter((v) => v.measure !== 'Scale').map((v) => (
                      <option key={v.name} value={v.name}>{v.name}</option>
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
                    {variables.filter((v) => v.measure === 'Scale').map((v) => (
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
            ) : modalType === 'split_file' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span className="spss-picker-label">Groups Based On:</span>
                <select
                  className="spss-text-input"
                  value={splitVar}
                  onChange={(e) => setSplitVar(e.target.value)}
                >
                  <option value="">-- Select Split Variable --</option>
                  {variables.map((v) => (
                    <option key={v.name} value={v.name}>{v.name}</option>
                  ))}
                </select>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Compares groups or organizes output by selected grouping variable.
                </span>
              </div>
            ) : modalType === 'weight_cases' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span className="spss-picker-label">Frequency Variable:</span>
                <select
                  className="spss-text-input"
                  value={weightVar}
                  onChange={(e) => setWeightVar(e.target.value)}
                >
                  <option value="">-- Select Frequency Weight Variable --</option>
                  {variables.map((v) => (
                    <option key={v.name} value={v.name}>{v.name}</option>
                  ))}
                </select>
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
              }}
            >
              Reset
            </button>
            <button className="spss-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
