import React, { useState, useEffect, useRef } from 'react';
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
import { ServerSettingsModal } from './components/ServerSettingsModal';
import { GoToCaseDialog } from './components/GoToCaseDialog';
import { FindReplaceDialog } from './components/FindReplaceDialog';
import { RecodeModal } from './components/RecodeModal';
import { AutomaticRecodeModal } from './components/AutomaticRecodeModal';
import { ReplaceMissingModal } from './components/ReplaceMissingModal';
import { AggregateModal } from './components/AggregateModal';
import { MergeFilesModal } from './components/MergeFilesModal';
import { employeeDataset, clinicalTrialDataset } from './data/defaultDatasets';
import { Dataset, ActiveView, AnalysisModalType, AppTheme, OutputItem, VariableMeta } from './types/spss';
import { clientComputeDescriptives, clientComputeFrequencies, clientRunSyntax } from './utils/clientStats';
import { statsApiService } from './services/api';
import { exportReportToPdf, exportReportToWord, exportReportToExcel } from './utils/exportUtils';
import { saveSessionToStorage, loadSessionFromStorage } from './utils/storage';

export const App: React.FC = () => {
  // Application State - Restore from localStorage if previous session exists
  const [dataset, setDataset] = useState<Dataset>(() => {
    const saved = loadSessionFromStorage();
    if (saved.dataset && saved.dataset.variables && saved.dataset.variables.length > 0) {
      return saved.dataset;
    }
    return employeeDataset;
  });
  const [activeView, setActiveView] = useState<ActiveView>('data');
  const [showValueLabels, setShowValueLabels] = useState<boolean>(true);
  const [theme, setTheme] = useState<AppTheme>('spss-classic');
  const [activeModal, setActiveModal] = useState<AnalysisModalType>(null);
  const [valueLabelsVarName, setValueLabelsVarName] = useState<string | null>(null);

  // Split File & Weight Cases states
  const [splitByVariable, setSplitByVariable] = useState<string | null>(null);
  const [weightByVariable, setWeightByVariable] = useState<string | null>(null);

  // Jump / Focus navigation state
  const [showGoToCase, setShowGoToCase] = useState<boolean>(false);
  const [showFindReplace, setShowFindReplace] = useState<boolean>(false);
  const [focusTarget, setFocusTarget] = useState<{ row: number; col?: number; timestamp: number } | null>(null);

  // Undo / Redo history engine (50 snapshots)
  const pastRef = useRef<Dataset[]>([]);
  const futureRef = useRef<Dataset[]>([]);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  const pushHistory = (currentDataset: Dataset) => {
    pastRef.current.push(JSON.parse(JSON.stringify(currentDataset)));
    if (pastRef.current.length > 50) pastRef.current.shift();
    futureRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  };

  const handleUndo = () => {
    if (pastRef.current.length === 0) return;
    const previous = pastRef.current.pop()!;
    futureRef.current.push(JSON.parse(JSON.stringify(dataset)));
    setDataset(previous);
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(true);
  };

  const handleRedo = () => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current.pop()!;
    pastRef.current.push(JSON.parse(JSON.stringify(dataset)));
    setDataset(next);
    setCanUndo(true);
    setCanRedo(futureRef.current.length > 0);
  };

  // Syntax and Outputs
  const [syntaxCode, setSyntaxCode] = useState<string>(
    `* IBM SPSS Statistics Syntax\nFREQUENCIES VARIABLES=gender jobcat.\nDESCRIPTIVES VARIABLES=salary salbegin educ.`
  );

  // Generate initial descriptive output or restore from storage
  const [outputs, setOutputs] = useState<OutputItem[]>(() => {
    const saved = loadSessionFromStorage();
    if (saved.outputs && saved.outputs.length > 0) {
      return saved.outputs;
    }
    const initFreq = clientComputeFrequencies(employeeDataset.rows, ['gender', 'jobcat'], {
      gender: { m: 'Male', f: 'Female' },
      jobcat: { '1': 'Clerical', '2': 'Custodial', '3': 'Manager' },
    });
    const initDesc = clientComputeDescriptives(employeeDataset.rows, ['salary', 'salbegin', 'educ']);
    return [initFreq, initDesc];
  });

  // Session auto-save to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      saveSessionToStorage(dataset, outputs);
    }, 1000);
    return () => clearTimeout(timer);
  }, [dataset, outputs]);

  // Recent files tracking
  const [recentFiles, setRecentFiles] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('openspss_recent_files');
      return saved ? JSON.parse(saved) : ['Employee data.sav', 'Clinical Trial.sav'];
    } catch {
      return ['Employee data.sav', 'Clinical Trial.sav'];
    }
  });

  const recordRecentFile = (name: string) => {
    setRecentFiles((prev) => {
      const filtered = prev.filter((f) => f !== name);
      const updated = [name, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('openspss_recent_files', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleSelectRecentFile = (name: string) => {
    if (name === 'Employee data.sav' || name.includes('Employee')) {
      handleSelectSampleDataset('Employee data.sav');
    } else if (name === 'Clinical Trial.sav' || name.includes('Clinical')) {
      handleSelectSampleDataset('Clinical Trial.sav');
    } else {
      try {
        const saved = localStorage.getItem(`openspss_dataset_${name}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          handleDatasetLoaded(parsed);
          return;
        }
      } catch {}
      setActiveModal('import_data');
    }
  };

  // Backend server connection state
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    statsApiService.checkHealth().then((online) => {
      if (mounted) setIsBackendOnline(online);
    });
    const interval = setInterval(() => {
      statsApiService.checkHealth().then((online) => {
        if (mounted) setIsBackendOnline(online);
      });
    }, 25000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Apply theme to root html element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Global desktop keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes open modals and dialogs
      if (e.key === 'Escape') {
        if (showGoToCase) {
          setShowGoToCase(false);
          return;
        }
        if (showFindReplace) {
          setShowFindReplace(false);
          return;
        }
        if (activeModal) {
          setActiveModal(null);
          return;
        }
      }

      // F1 opens About / Help
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveModal('about_spss');
        return;
      }

      // Global Undo (Ctrl+Z)
      if (e.ctrlKey && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Global Redo (Ctrl+Y or Ctrl+Shift+Z)
      if (
        (e.ctrlKey && !e.shiftKey && (e.key === 'y' || e.key === 'Y')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'z' || e.key === 'Z'))
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Global Save (Ctrl+S)
      if (e.ctrlKey && !e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleExport('xlsx');
        return;
      }

      // Global Open (Ctrl+O)
      if (e.ctrlKey && !e.shiftKey && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        setActiveModal('import_data');
        return;
      }

      // Global New Dataset (Ctrl+N)
      if (e.ctrlKey && !e.shiftKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        handleNewDataset();
        return;
      }

      // Global Go to Case (Ctrl+G)
      if (e.ctrlKey && !e.shiftKey && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        setActiveView('data');
        setShowGoToCase(true);
        return;
      }

      // Global Find & Replace (Ctrl+F or Ctrl+H)
      if (e.ctrlKey && !e.shiftKey && (e.key === 'f' || e.key === 'F' || e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        setActiveView('data');
        setShowFindReplace(true);
        return;
      }

      // Global Print / Export PDF (Ctrl+P)
      if (e.ctrlKey && !e.shiftKey && !e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        handleExport('pdf');
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
  }, [activeModal, activeView, syntaxCode, dataset.rows, showGoToCase, showFindReplace]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'spss-classic' ? 'modern-light' : prev === 'modern-light' ? 'academic-dark' : 'spss-classic'));
  };

  // Cell editing in Data View (auto-expands rows and auto-creates variable if empty)
  const handleCellChange = (rowIndex: number, varName: string, value: any) => {
    pushHistory(dataset);
    let currentVars = [...dataset.variables];
    if (currentVars.length === 0) {
      const newVar: VariableMeta = {
        name: 'VAR00001',
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
      currentVars.push(newVar);
      varName = 'VAR00001';
    }

    const updatedRows = [...dataset.rows];
    while (updatedRows.length <= rowIndex) {
      const newRow: Record<string, any> = { id: updatedRows.length + 1 };
      currentVars.forEach((v) => {
        newRow[v.name] = null;
      });
      updatedRows.push(newRow);
    }
    updatedRows[rowIndex] = { ...updatedRows[rowIndex], [varName]: value };
    setDataset({ ...dataset, variables: currentVars, rows: updatedRows });
  };

  // High-performance bulk paste from Excel / Clipboard
  const handleBulkPaste = (startRow: number, startCol: number, matrix: string[][]) => {
    pushHistory(dataset);
    let currentVars = [...dataset.variables];
    const maxColNeeded = startCol + Math.max(...matrix.map((r) => r.length), 1);

    while (currentVars.length < maxColNeeded) {
      const varNum = currentVars.length + 1;
      const newVarName = `VAR0000${varNum}`.slice(-8);
      currentVars.push({
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
      });
    }

    const updatedRows = [...dataset.rows];
    const maxRowNeeded = startRow + matrix.length;
    while (updatedRows.length < maxRowNeeded) {
      const newRow: Record<string, any> = { id: updatedRows.length + 1 };
      currentVars.forEach((v) => {
        newRow[v.name] = null;
      });
      updatedRows.push(newRow);
    }

    matrix.forEach((rowVals, rOffset) => {
      const rIdx = startRow + rOffset;
      const rowObj = { ...updatedRows[rIdx] };
      rowVals.forEach((valStr, cOffset) => {
        const cIdx = startCol + cOffset;
        const vMeta = currentVars[cIdx];
        if (vMeta) {
          const trimmed = valStr.trim();
          if (trimmed === '') {
            rowObj[vMeta.name] = null;
          } else {
            const num = parseFloat(trimmed.replace(/[$,]/g, ''));
            rowObj[vMeta.name] = !isNaN(num) && isFinite(num) ? num : trimmed;
          }
        }
      });
      updatedRows[rIdx] = rowObj;
    });

    setDataset({
      ...dataset,
      variables: currentVars,
      rows: updatedRows,
    });
  };

  // Start a new blank dataset (File -> New -> Data)
  const handleNewDataset = () => {
    pushHistory(dataset);
    const defaultVars: VariableMeta[] = [
      { name: 'VAR00001', type: 'Numeric', width: 8, decimals: 2, label: '', values: {}, missing: 'None', columns: 8, align: 'Right', measure: 'Scale', role: 'Input' },
      { name: 'VAR00002', type: 'Numeric', width: 8, decimals: 2, label: '', values: {}, missing: 'None', columns: 8, align: 'Right', measure: 'Scale', role: 'Input' },
      { name: 'VAR00003', type: 'Numeric', width: 8, decimals: 2, label: '', values: {}, missing: 'None', columns: 8, align: 'Right', measure: 'Scale', role: 'Input' },
    ];
    setDataset({
      name: 'Untitled1.sav',
      variables: defaultVars,
      rows: [],
    });
    setOutputs([]);
    setActiveView('data');
  };

  // Add row (case)
  const handleAddRow = () => {
    pushHistory(dataset);
    const newRow: Record<string, any> = {};
    dataset.variables.forEach((v) => {
      newRow[v.name] = v.type === 'Numeric' || v.type === 'Dollar' ? 0 : '';
    });
    newRow.id = dataset.rows.length + 1;
    setDataset({ ...dataset, rows: [...dataset.rows, newRow] });
  };

  // Delete row (case) by index
  const handleDeleteRow = (rowIndex: number) => {
    if (rowIndex < 0 || rowIndex >= dataset.rows.length) return;
    pushHistory(dataset);
    const updatedRows = dataset.rows.filter((_, i) => i !== rowIndex);
    setDataset({ ...dataset, rows: updatedRows });
  };

  // Delete multiple rows (cases) by indices
  const handleDeleteRows = (rowIndices: number[]) => {
    if (rowIndices.length === 0) return;
    pushHistory(dataset);
    const indexSet = new Set(rowIndices);
    const updatedRows = dataset.rows.filter((_, i) => !indexSet.has(i));
    setDataset({ ...dataset, rows: updatedRows });
  };

  // Add variable
  const handleAddVariable = () => {
    pushHistory(dataset);
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
    pushHistory(dataset);
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

  // Delete variable by index
  const handleDeleteVariable = (index: number) => {
    pushHistory(dataset);
    const varToDelete = dataset.variables[index];
    const newVariables = dataset.variables.filter((_, i) => i !== index);
    const updatedRows = dataset.rows.map((row) => {
      const copy = { ...row };
      delete copy[varToDelete.name];
      return copy;
    });
    setDataset({ ...dataset, variables: newVariables, rows: updatedRows });
  };

  // Delete variable by name
  const handleDeleteVariableByName = (varName: string) => {
    const idx = dataset.variables.findIndex((v) => v.name === varName);
    if (idx !== -1) {
      handleDeleteVariable(idx);
    }
  };

  // Resize column width
  const handleResizeColumn = (varName: string, newWidthPx: number) => {
    const newCols = Math.max(3, Math.round(newWidthPx / 11));
    const idx = dataset.variables.findIndex((v) => v.name === varName);
    if (idx !== -1) {
      handleUpdateVariable(idx, { columns: newCols });
    }
  };

  // Reorder variables (from drag or move up/down in Variable View)
  const handleReorderVariables = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= dataset.variables.length ||
      toIndex >= dataset.variables.length
    ) {
      return;
    }
    pushHistory(dataset);
    const newVars = [...dataset.variables];
    const [moved] = newVars.splice(fromIndex, 1);
    newVars.splice(toIndex, 0, moved);
    setDataset({ ...dataset, variables: newVars });
  };

  // Bulk update rows (from Find & Replace All)
  const handleBulkUpdateRows = (updatedRows: Record<string, any>[]) => {
    pushHistory(dataset);
    setDataset({ ...dataset, rows: updatedRows });
  };

  // Insert row before specified index
  const handleInsertRow = (beforeIndex: number) => {
    pushHistory(dataset);
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
    pushHistory(dataset);
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
    pushHistory(dataset);
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
    pushHistory(dataset);
    if (name.includes('Clinical')) {
      setDataset(clinicalTrialDataset);
      recordRecentFile('Clinical Trial.sav');
      setOutputs([
        clientComputeDescriptives(clinicalTrialDataset.rows, ['baseline_bp', 'post_bp', 'cholesterol']),
      ]);
    } else {
      setDataset(employeeDataset);
      recordRecentFile('Employee data.sav');
      setOutputs([
        clientComputeFrequencies(employeeDataset.rows, ['gender', 'jobcat']),
        clientComputeDescriptives(employeeDataset.rows, ['salary', 'salbegin', 'educ']),
      ]);
    }
  };

  // Dataset loaded handler (from file upload or recent file)
  const handleDatasetLoaded = (newDs: Dataset) => {
    pushHistory(dataset);
    setDataset(newDs);
    recordRecentFile(newDs.name);
    try {
      localStorage.setItem(`openspss_dataset_${newDs.name}`, JSON.stringify(newDs));
    } catch {}
    setActiveView('data');
  };

  // Export functions (PDF, Word, Excel, CSV, Binary SPSS .sav, SPSS JSON)
  const handleExport = async (format: 'pdf' | 'xlsx' | 'csv' | 'sav' | 'sav_json' | 'word') => {
    if (format === 'pdf') {
      setActiveView('output');
      setTimeout(() => {
        exportReportToPdf(dataset.name);
      }, 300);
      return;
    }

    if (format === 'word') {
      exportReportToWord(outputs, dataset.name);
      return;
    }

    if (format === 'xlsx') {
      if (activeView === 'output' && outputs.length > 0) {
        exportReportToExcel(outputs, dataset.name);
        return;
      }
      const wb = XLSX.utils.book_new();
      const wsData = XLSX.utils.json_to_sheet(dataset.rows);
      XLSX.utils.book_append_sheet(wb, wsData, 'Data View');
      const wsVars = XLSX.utils.json_to_sheet(dataset.variables);
      XLSX.utils.book_append_sheet(wb, wsVars, 'Variable View');
      XLSX.writeFile(wb, `${dataset.name.replace('.sav', '')}_exported.xlsx`);
      return;
    }

    if (format === 'sav') {
      // Try exporting as true binary .sav via backend pyreadstat
      try {
        const res = await fetch('/api/datasets/export-sav', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataset }),
        });
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const fileName = dataset.name.endsWith('.sav') ? dataset.name : `${dataset.name}.sav`;
          link.setAttribute('download', fileName);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          return;
        }
      } catch (err) {
        console.warn('Backend binary .sav export failed, falling back to JSON', err);
      }
      // Fallback to JSON .sav.json
      const jsonStr = JSON.stringify(dataset, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${dataset.name.replace('.sav', '')}.sav.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    if (format === 'sav_json') {
      const jsonStr = JSON.stringify(dataset, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${dataset.name.replace('.sav', '')}.sav.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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
      URL.revokeObjectURL(url);
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

  const editingVariable = dataset.variables.find((v) => v.name === valueLabelsVarName) || dataset.variables[0];

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
        onNewData={handleNewDataset}
        onToggleValueLabels={() => setShowValueLabels(!showValueLabels)}
        showValueLabels={showValueLabels}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        recentFiles={recentFiles}
        onSelectRecentFile={handleSelectRecentFile}
        onGoToCase={() => {
          setActiveView('data');
          setShowGoToCase(true);
        }}
        onFindReplace={() => {
          setActiveView('data');
          setShowFindReplace(true);
        }}
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
        onNewData={handleNewDataset}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
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
              onBulkPaste={handleBulkPaste}
              onAddRow={handleAddRow}
              onAddVariable={handleAddVariable}
              onInsertRow={handleInsertRow}
              onInsertVariable={handleInsertVariable}
              onDeleteRow={handleDeleteRow}
              onDeleteRows={handleDeleteRows}
              onDeleteVariable={handleDeleteVariableByName}
              onResizeColumn={handleResizeColumn}
              onClearCells={handleClearCells}
              onSortCases={handleSortCases}
              onQuickDescriptives={handleQuickDescriptives}
              onSwitchToVariableView={(varName) => {
                setActiveView('variable');
              }}
              focusTarget={focusTarget}
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
              onReorderVariables={handleReorderVariables}
            />
          )}

          {activeView === 'output' && (
            <OutputViewer
              outputs={outputs}
              onClearOutputs={() => setOutputs([])}
              onDeleteOutputItem={(id) => setOutputs((prev) => prev.filter((item) => item.id !== id))}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span>IBM SPSS Statistics Processor is ready</span>
            <span>|</span>
            <span>Cases: {dataset.rows.length}</span>
            <span>Variables: {dataset.variables.length}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              onClick={() => setActiveModal('server_settings')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                padding: '2px 8px',
                borderRadius: 3,
                background: isBackendOnline ? 'rgba(34, 197, 94, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                color: isBackendOnline ? 'var(--success)' : '#2563eb',
                fontWeight: 600,
                fontSize: 11,
                border: `1px solid ${isBackendOnline ? 'rgba(34, 197, 94, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
              }}
              title="Click to configure backend server or Render cloud connection"
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: isBackendOnline ? 'var(--success)' : '#3b82f6',
                  display: 'inline-block',
                }}
              />
              <span>{isBackendOnline ? 'Backend: Online (Render / Python)' : 'Engine: Client-Side (Dual-Mode)'}</span>
            </div>
            <span>Filter off</span>
            <span
              onClick={() => setActiveModal('weight_cases')}
              style={{
                cursor: 'pointer',
                color: weightByVariable ? '#1d4ed8' : undefined,
                fontWeight: weightByVariable ? 600 : undefined,
                textDecoration: 'underline dotted',
              }}
              title="Click to configure Weight Cases"
            >
              {weightByVariable ? `Weight on (${weightByVariable})` : 'Weight off'}
            </span>
            <span
              onClick={() => setActiveModal('split_file')}
              style={{
                cursor: 'pointer',
                color: splitByVariable ? '#1d4ed8' : undefined,
                fontWeight: splitByVariable ? 600 : undefined,
                textDecoration: 'underline dotted',
              }}
              title="Click to configure Split File"
            >
              {splitByVariable ? `Split File on (${splitByVariable})` : 'Split File off'}
            </span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SPSSAnalysisDialogs
        modalType={activeModal}
        variables={dataset.variables}
        rows={dataset.rows}
        splitByVariable={splitByVariable}
        weightByVariable={weightByVariable}
        onSetSplitByVariable={setSplitByVariable}
        onSetWeightByVariable={setWeightByVariable}
        onClose={() => setActiveModal(null)}
        onAnalysisComplete={handleAnalysisComplete}
        onPasteSyntax={handlePasteSyntax}
        onApplyDataOperation={(newRows) => {
          if (newRows.length > 0) {
            const existingVarNames = new Set(dataset.variables.map((v) => v.name));
            const rowKeys = Object.keys(newRows[0]);
            const newVars = [...dataset.variables];
            rowKeys.forEach((k) => {
              if (k !== 'id' && !existingVarNames.has(k)) {
                newVars.push({
                  name: k,
                  type: 'Numeric',
                  width: 8,
                  decimals: 2,
                  label: k,
                  values: {},
                  missing: 'None',
                  columns: 8,
                  align: 'Right',
                  measure: 'Scale',
                  role: 'Input',
                });
              }
            });
            setDataset({ ...dataset, variables: newVars, rows: newRows });
          } else {
            setDataset((prev) => ({ ...prev, rows: newRows }));
          }
        }}
        onReplaceEntireDataset={(newVars, newRows) => {
          pushHistory(dataset);
          setDataset({ ...dataset, variables: newVars, rows: newRows });
          setActiveView('data');
        }}
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
        onDatasetLoaded={handleDatasetLoaded}
      />

      <AboutModal
        isOpen={activeModal === 'about_spss'}
        onClose={() => setActiveModal(null)}
      />

      <ServerSettingsModal
        isOpen={activeModal === 'server_settings'}
        onClose={() => setActiveModal(null)}
        onStatusChange={(online) => setIsBackendOnline(online)}
      />

      {/* Go to Case Dialog */}
      {showGoToCase && (
        <GoToCaseDialog
          variables={dataset.variables}
          totalRows={dataset.rows.length}
          onClose={() => setShowGoToCase(false)}
          onGoTo={(targetRow, targetCol) => {
            setFocusTarget({ row: targetRow, col: targetCol, timestamp: Date.now() });
          }}
        />
      )}

      {/* Find and Replace Dialog */}
      {showFindReplace && (
        <FindReplaceDialog
          variables={dataset.variables}
          rows={dataset.rows}
          activeColIdx={focusTarget?.col ?? 0}
          activeRowIdx={focusTarget?.row ?? 0}
          onClose={() => setShowFindReplace(false)}
          onNavigateToMatch={(r, c) => {
            setFocusTarget({ row: r, col: c, timestamp: Date.now() });
          }}
          onReplaceCell={(r, varName, newVal) => {
            handleCellChange(r, varName, newVal);
          }}
          onBulkUpdateRows={handleBulkUpdateRows}
        />
      )}

      {/* Recode into Different / Same Variables Modal */}
      {(activeModal === 'recode_different' || activeModal === 'recode_same') && (
        <RecodeModal
          mode={activeModal === 'recode_different' ? 'different' : 'same'}
          variables={dataset.variables}
          rows={dataset.rows}
          onClose={() => setActiveModal(null)}
          onPasteSyntax={(syn) => handlePasteSyntax(syn)}
          onApply={(newVars, newRows, syn) => {
            pushHistory(dataset);
            setDataset({ ...dataset, variables: newVars, rows: newRows });
            const logItem: OutputItem = {
              id: String(Date.now()),
              timestamp: new Date().toLocaleTimeString(),
              title: activeModal === 'recode_different' ? 'Recode into Different Variables' : 'Recode into Same Variables',
              type: 'compute_variable',
              syntax: syn,
              data: {
                message: `Recode executed successfully on ${newRows.length} cases.`,
              },
            };
            setOutputs((prev) => [logItem, ...prev]);
            setActiveView('output');
          }}
        />
      )}

      {/* Automatic Recode Modal */}
      <AutomaticRecodeModal
        isOpen={activeModal === 'automatic_recode'}
        variables={dataset.variables}
        rows={dataset.rows}
        onClose={() => setActiveModal(null)}
        onApply={(newRows, newVar, output) => {
          pushHistory(dataset);
          const exists = dataset.variables.some((v) => v.name === newVar.name);
          const updatedVars = exists
            ? dataset.variables.map((v) => (v.name === newVar.name ? newVar : v))
            : [...dataset.variables, newVar];
          setDataset({ ...dataset, variables: updatedVars, rows: newRows });
          setOutputs((prev) => [output, ...prev]);
          setActiveView('output');
        }}
      />

      {/* Replace Missing Values Modal */}
      <ReplaceMissingModal
        isOpen={activeModal === 'replace_missing'}
        variables={dataset.variables}
        rows={dataset.rows}
        onClose={() => setActiveModal(null)}
        onApply={(newRows, newVar, output) => {
          pushHistory(dataset);
          const exists = dataset.variables.some((v) => v.name === newVar.name);
          const updatedVars = exists
            ? dataset.variables.map((v) => (v.name === newVar.name ? newVar : v))
            : [...dataset.variables, newVar];
          setDataset({ ...dataset, variables: updatedVars, rows: newRows });
          setOutputs((prev) => [output, ...prev]);
          setActiveView('output');
        }}
      />

      {/* Aggregate Data Modal */}
      <AggregateModal
        isOpen={activeModal === 'aggregate_data'}
        variables={dataset.variables}
        rows={dataset.rows}
        onClose={() => setActiveModal(null)}
        onApplyNewDataset={(newDs, out) => {
          pushHistory(dataset);
          setDataset(newDs);
          setOutputs((prev) => [out, ...prev]);
          setActiveView('data');
        }}
        onApplyToCurrent={(newVars, newRows, out) => {
          pushHistory(dataset);
          setDataset({ ...dataset, variables: [...dataset.variables, ...newVars], rows: newRows });
          setOutputs((prev) => [out, ...prev]);
          setActiveView('output');
        }}
        onPasteSyntax={(syn) => handlePasteSyntax(syn)}
      />

      {/* Merge Files Modal */}
      <MergeFilesModal
        isOpen={activeModal === 'merge_files'}
        currentDataset={dataset}
        onClose={() => setActiveModal(null)}
        onApplyMergedDataset={(mergedDs, out) => {
          pushHistory(dataset);
          setDataset(mergedDs);
          setOutputs((prev) => [out, ...prev]);
          setActiveView('data');
        }}
        onPasteSyntax={(syn) => handlePasteSyntax(syn)}
      />
    </div>
  );
};

export default App;
