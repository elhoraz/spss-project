import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { TopMenuBar } from './components/TopMenuBar';
import { Toolbar } from './components/Toolbar';
import { DataViewGrid } from './components/DataViewGrid';
import { VariableViewGrid } from './components/VariableViewGrid';
import { OutputViewer } from './components/OutputViewer';
import { SyntaxEditor } from './components/SyntaxEditor';
import { SPSSAnalysisDialogs } from './components/SPSSAnalysisDialogs';
import { ValueLabelsModal } from './components/ValueLabelsModal';
import { ImportExportModal } from './components/ImportExportModal';
import { AboutModal } from './components/AboutModal';
import { employeeDataset, clinicalTrialDataset } from './data/defaultDatasets';
import { Dataset, ActiveView, AnalysisModalType, AppTheme, OutputItem, VariableMeta } from './types/spss';
import { clientComputeDescriptives, clientComputeFrequencies, clientRunSyntax } from './utils/clientStats';

export const App: React.FC = () => {
  // Application State
  const [dataset, setDataset] = useState<Dataset>(employeeDataset);
  const [activeView, setActiveView] = useState<ActiveView>('data');
  const [showValueLabels, setShowValueLabels] = useState<boolean>(true);
  const [theme, setTheme] = useState<AppTheme>('spss-classic');
  const [activeModal, setActiveModal] = useState<AnalysisModalType>(null);
  const [valueLabelsVarName, setValueLabelsVarName] = useState<string | null>(null);

  // Syntax and Outputs
  const [syntaxCode, setSyntaxCode] = useState<string>(
    `* IBM SPSS Statistics Syntax\nFREQUENCIES VARIABLES=gender jobcat.\nDESCRIPTIVES VARIABLES=salary salbegin educ.`
  );

  // Generate initial descriptive output for instant satisfaction upon load!
  const [outputs, setOutputs] = useState<OutputItem[]>(() => {
    const initFreq = clientComputeFrequencies(employeeDataset.rows, ['gender', 'jobcat'], {
      gender: { m: 'Male', f: 'Female' },
      jobcat: { '1': 'Clerical', '2': 'Custodial', '3': 'Manager' },
    });
    const initDesc = clientComputeDescriptives(employeeDataset.rows, ['salary', 'salbegin', 'educ']);
    return [initFreq, initDesc];
  });

  // Apply theme to root html element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Global desktop keyboard shortcuts (Wave 6)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes open modals
      if (e.key === 'Escape' && activeModal) {
        setActiveModal(null);
        return;
      }

      // F1 opens About / Help
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveModal('about_spss');
        return;
      }

      // Ctrl + 1/2/3/4 for view switching
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        if (e.key === '1') {
          e.preventDefault();
          setActiveView('data');
        } else if (e.key === '2') {
          e.preventDefault();
          setActiveView('variable');
        } else if (e.key === '3') {
          e.preventDefault();
          setActiveView('output');
        } else if (e.key === '4') {
          e.preventDefault();
          setActiveView('syntax');
        } else if (e.key === 'r' || e.key === 'R') {
          if (activeView === 'syntax' && syntaxCode.trim()) {
            e.preventDefault();
            const gen = clientRunSyntax(syntaxCode, dataset.rows);
            if (gen.length > 0) {
              setOutputs((prev) => [...gen, ...prev]);
              setActiveView('output');
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, activeView, syntaxCode, dataset.rows]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'spss-classic' ? 'modern-light' : prev === 'modern-light' ? 'academic-dark' : 'spss-classic'));
  };

  // Cell editing in Data View
  const handleCellChange = (rowIndex: number, varName: string, value: any) => {
    const updatedRows = [...dataset.rows];
    updatedRows[rowIndex] = { ...updatedRows[rowIndex], [varName]: value };
    setDataset({ ...dataset, rows: updatedRows });
  };

  // Add row (case)
  const handleAddRow = () => {
    const newRow: Record<string, any> = {};
    dataset.variables.forEach((v) => {
      newRow[v.name] = v.type === 'Numeric' || v.type === 'Dollar' ? 0 : '';
    });
    newRow.id = dataset.rows.length + 1;
    setDataset({ ...dataset, rows: [...dataset.rows, newRow] });
  };

  // Add variable
  const handleAddVariable = () => {
    const varNum = dataset.variables.length + 1;
    const newVarName = `VAR0000${varNum}`.slice(-8);
    const newVar: VariableMeta = {
      name: newVarName,
      type: 'Numeric',
      width: 8,
      decimals: 2,
      label: '',
      values: {},
      missing: 'None',
      columns: 8,
      align: 'Right',
      measure: 'Scale',
      role: 'Input',
    };
    const updatedRows = dataset.rows.map((r) => ({ ...r, [newVarName]: 0 }));
    setDataset({
      ...dataset,
      variables: [...dataset.variables, newVar],
      rows: updatedRows,
    });
  };

  // Update variable metadata
  const handleUpdateVariable = (index: number, updated: Partial<VariableMeta>) => {
    const oldVar = dataset.variables[index];
    const newVariables = [...dataset.variables];
    newVariables[index] = { ...oldVar, ...updated };

    // If variable name changed, update keys in rows
    if (updated.name && updated.name !== oldVar.name) {
      const updatedRows = dataset.rows.map((row) => {
        const copy = { ...row };
        copy[updated.name!] = copy[oldVar.name];
        delete copy[oldVar.name];
        return copy;
      });
      setDataset({ ...dataset, variables: newVariables, rows: updatedRows });
      return;
    }

    setDataset({ ...dataset, variables: newVariables });
  };

  // Delete variable
  const handleDeleteVariable = (index: number) => {
    const varToDelete = dataset.variables[index];
    const newVariables = dataset.variables.filter((_, i) => i !== index);
    const updatedRows = dataset.rows.map((row) => {
      const copy = { ...row };
      delete copy[varToDelete.name];
      return copy;
    });
    setDataset({ ...dataset, variables: newVariables, rows: updatedRows });
  };

  // Insert row before specified index
  const handleInsertRow = (beforeIndex: number) => {
    const newRow: Record<string, any> = {};
    dataset.variables.forEach((v) => {
      newRow[v.name] = v.type === 'Numeric' || v.type === 'Dollar' ? 0 : '';
    });
    newRow.id = dataset.rows.length + 1;
    const newRows = [...dataset.rows];
    newRows.splice(beforeIndex, 0, newRow);
    setDataset({ ...dataset, rows: newRows });
  };

  // Insert variable before specified index
  const handleInsertVariable = (beforeIndex: number) => {
    const varNum = dataset.variables.length + 1;
    const newVarName = `VAR0000${varNum}`.slice(-8);
    const newVar: VariableMeta = {
      name: newVarName,
      type: 'Numeric',
      width: 8,
      decimals: 2,
      label: '',
      values: {},
      missing: 'None',
      columns: 8,
      align: 'Right',
      measure: 'Scale',
      role: 'Input',
    };
    const newVars = [...dataset.variables];
    newVars.splice(beforeIndex, 0, newVar);
    const updatedRows = dataset.rows.map((r) => ({ ...r, [newVarName]: 0 }));
    setDataset({ ...dataset, variables: newVars, rows: updatedRows });
  };

  // Clear cells in selection range
  const handleClearCells = (range: { startRow: number; startCol: number; endRow: number; endCol: number }) => {
    const minR = Math.min(range.startRow, range.endRow);
    const maxR = Math.max(range.startRow, range.endRow);
    const minC = Math.min(range.startCol, range.endCol);
    const maxC = Math.max(range.startCol, range.endCol);

    const updatedRows = [...dataset.rows];
    for (let r = minR; r <= maxR; r++) {
      if (updatedRows[r]) {
        const copy = { ...updatedRows[r] };
        for (let c = minC; c <= maxC; c++) {
          const vMeta = dataset.variables[c];
          if (vMeta) {
            copy[vMeta.name] = null;
          }
        }
        updatedRows[r] = copy;
      }
    }
    setDataset({ ...dataset, rows: updatedRows });
  };

  // Sort cases
  const handleSortCases = (varName: string, ascending: boolean = true) => {
    const sorted = [...dataset.rows].sort((a, b) => {
      const vA = a[varName];
      const vB = b[varName];
      if (typeof vA === 'number' && typeof vB === 'number') {
        return ascending ? vA - vB : vB - vA;
      }
      return ascending ? String(vA).localeCompare(String(vB)) : String(vB).localeCompare(String(vA));
    });
    setDataset({ ...dataset, rows: sorted });
  };

  // Quick descriptives from context menu
  const handleQuickDescriptives = (varName: string) => {
    const output = clientComputeDescriptives(dataset.rows, [varName]);
    setOutputs((prev) => [output, ...prev]);
    setActiveView('output');
  };

  // Switch between sample datasets
  const handleSelectSampleDataset = (name: string) => {
    if (name.includes('Clinical')) {
      setDataset(clinicalTrialDataset);
      setOutputs([
        clientComputeDescriptives(clinicalTrialDataset.rows, ['baseline_bp', 'post_bp', 'cholesterol']),
      ]);
    } else {
      setDataset(employeeDataset);
      setOutputs([
        clientComputeFrequencies(employeeDataset.rows, ['gender', 'jobcat']),
        clientComputeDescriptives(employeeDataset.rows, ['salary', 'salbegin', 'educ']),
      ]);
    }
  };

  // Export functions
  const handleExport = (format: 'pdf' | 'xlsx' | 'csv') => {
    if (format === 'pdf') {
      setActiveView('output');
      setTimeout(() => window.print(), 200);
      return;
    }

    if (format === 'xlsx') {
      const wb = XLSX.utils.book_new();
      const wsData = XLSX.utils.json_to_sheet(dataset.rows);
      XLSX.utils.book_append_sheet(wb, wsData, 'Data View');
      const wsVars = XLSX.utils.json_to_sheet(dataset.variables);
      XLSX.utils.book_append_sheet(wb, wsVars, 'Variable View');
      XLSX.writeFile(wb, `${dataset.name.replace('.sav', '')}_exported.xlsx`);
      return;
    }

    if (format === 'csv') {
      const ws = XLSX.utils.json_to_sheet(dataset.rows);
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${dataset.name.replace('.sav', '')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Analysis completion callback
  const handleAnalysisComplete = (newOutput: OutputItem) => {
    setOutputs((prev) => [newOutput, ...prev]);
    setActiveView('output');
  };

  // Paste syntax from dialogs
  const handlePasteSyntax = (newSyntax: string) => {
    setSyntaxCode((prev) => `${prev}\n\n${newSyntax}`);
    setActiveView('syntax');
  };

  const editingVariable = dataset.variables.find((v) => v.name === valueLabelsVarName);

  return (
    <div className="spss-app-container">
      {/* 1. Title Bar */}
      <div className="spss-titlebar">
        <div className="spss-titlebar-left">
          <div className="spss-titlebar-logo">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
              <rect x="3" y="13" width="4" height="8" rx="1" />
              <rect x="10" y="7" width="4" height="14" rx="1" />
              <rect x="17" y="3" width="4" height="18" rx="1" />
            </svg>
          </div>
          <span className="spss-titlebar-title">IBM SPSS Statistics</span>
          <span className="spss-titlebar-status">[{dataset.name}]</span>
        </div>
        <div className="spss-titlebar-right">
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pro Edition v1.0</span>
        </div>
      </div>

      {/* 2. Top Menu Bar */}
      <TopMenuBar
        onOpenModal={(m) => setActiveModal(m)}
        onSetActiveView={(v) => setActiveView(v)}
        onExport={handleExport}
        onResetData={() => handleSelectSampleDataset('Employee data.sav')}
        onToggleValueLabels={() => setShowValueLabels(!showValueLabels)}
        showValueLabels={showValueLabels}
      />

      {/* 3. Toolbar */}
      <Toolbar
        onOpenModal={(m) => setActiveModal(m)}
        activeView={activeView}
        onSetActiveView={(v) => setActiveView(v)}
        showValueLabels={showValueLabels}
        onToggleValueLabels={() => setShowValueLabels(!showValueLabels)}
        theme={theme}
        onToggleTheme={toggleTheme}
        datasetName={dataset.name}
        onSelectSampleDataset={handleSelectSampleDataset}
        onExport={handleExport}
      />

      {/* 4. Main Workspace */}
      <div className="spss-workspace">
        <div className="spss-content-area">
          {activeView === 'data' && (
            <DataViewGrid
              variables={dataset.variables}
              rows={dataset.rows}
              showValueLabels={showValueLabels}
              onCellChange={handleCellChange}
              onAddRow={handleAddRow}
              onAddVariable={handleAddVariable}
              onInsertRow={handleInsertRow}
              onInsertVariable={handleInsertVariable}
              onClearCells={handleClearCells}
              onSortCases={handleSortCases}
              onQuickDescriptives={handleQuickDescriptives}
              onSwitchToVariableView={(varName) => {
                setActiveView('variable');
              }}
            />
          )}

          {activeView === 'variable' && (
            <VariableViewGrid
              variables={dataset.variables}
              onUpdateVariable={handleUpdateVariable}
              onOpenValueLabels={(vName) => {
                setValueLabelsVarName(vName);
                setActiveModal('value_labels');
              }}
              onAddVariable={handleAddVariable}
              onDeleteVariable={handleDeleteVariable}
            />
          )}

          {activeView === 'output' && (
            <OutputViewer
              outputs={outputs}
              onClearOutputs={() => setOutputs([])}
              onExport={handleExport}
            />
          )}

          {activeView === 'syntax' && (
            <SyntaxEditor
              syntaxCode={syntaxCode}
              onChangeSyntax={setSyntaxCode}
              rows={dataset.rows}
              onOutputsGenerated={(newItems) => {
                setOutputs((prev) => [...newItems, ...prev]);
                setActiveView('output');
              }}
            />
          )}
        </div>

        {/* Bottom Tab Bar (Authentic SPSS Bottom View Switcher) */}
        <div className="spss-bottom-tabs">
          <button
            className={`spss-tab-button ${activeView === 'data' ? 'active' : ''}`}
            onClick={() => setActiveView('data')}
          >
            Data View
          </button>
          <button
            className={`spss-tab-button ${activeView === 'variable' ? 'active' : ''}`}
            onClick={() => setActiveView('variable')}
          >
            Variable View
          </button>
          <div style={{ width: 1, height: 16, background: 'var(--border-app)', margin: '0 6px' }} />
          <button
            className={`spss-tab-button ${activeView === 'output' ? 'active' : ''}`}
            onClick={() => setActiveView('output')}
          >
            Output Viewer ({outputs.length})
          </button>
          <button
            className={`spss-tab-button ${activeView === 'syntax' ? 'active' : ''}`}
            onClick={() => setActiveView('syntax')}
          >
            Syntax Editor
          </button>
        </div>

        {/* 5. Bottom Status Bar */}
        <div className="spss-bottom-statusbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span>IBM SPSS Statistics Processor is ready</span>
            <span>|</span>
            <span>Cases: {dataset.rows.length}</span>
            <span>Variables: {dataset.variables.length}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>Filter off</span>
            <span>Weight off</span>
            <span>Split File off</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SPSSAnalysisDialogs
        modalType={activeModal}
        variables={dataset.variables}
        rows={dataset.rows}
        onClose={() => setActiveModal(null)}
        onAnalysisComplete={handleAnalysisComplete}
        onPasteSyntax={handlePasteSyntax}
        onApplyDataOperation={(newRows) => setDataset((prev) => ({ ...prev, rows: newRows }))}
      />

      {activeModal === 'value_labels' && editingVariable && (
        <ValueLabelsModal
          variable={editingVariable}
          onSave={(newValues) => {
            const idx = dataset.variables.findIndex((v) => v.name === editingVariable.name);
            if (idx >= 0) handleUpdateVariable(idx, { values: newValues });
          }}
          onClose={() => {
            setActiveModal(null);
            setValueLabelsVarName(null);
          }}
        />
      )}

      <ImportExportModal
        isOpen={activeModal === 'import_data'}
        onClose={() => setActiveModal(null)}
        onDatasetLoaded={(newDs) => {
          setDataset(newDs);
          setActiveView('data');
        }}
      />

      <AboutModal
        isOpen={activeModal === 'about_spss'}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
};

export default App;
