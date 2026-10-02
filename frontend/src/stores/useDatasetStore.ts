import { create } from 'zustand';
import { Dataset, VariableMeta } from '../types/spss';
import { employeeDataset } from '../data/defaultDatasets';

interface DatasetState {
  dataset: Dataset;
  activeCell: { row: number; col: number };
  showValueLabels: boolean;
  history: Dataset[];
  historyIndex: number;

  // Actions
  setDataset: (dataset: Dataset) => void;
  setActiveCell: (cell: { row: number; col: number }) => void;
  toggleValueLabels: () => void;
  updateCell: (rowIndex: number, varName: string, value: any) => void;
  addRow: () => void;
  addVariable: () => void;
  updateVariable: (index: number, updated: Partial<VariableMeta>) => void;
  deleteVariable: (index: number) => void;
  sortCases: (varName: string, ascending?: boolean) => void;
  filterCases: (predicate: (row: Record<string, any>) => boolean) => void;
  undo: () => void;
  redo: () => void;
}

export const useDatasetStore = create<DatasetState>((set, get) => ({
  dataset: employeeDataset,
  activeCell: { row: 0, col: 0 },
  showValueLabels: true,
  history: [employeeDataset],
  historyIndex: 0,

  setDataset: (dataset) => {
    set({
      dataset,
      history: [dataset],
      historyIndex: 0,
      activeCell: { row: 0, col: 0 },
    });
  },

  setActiveCell: (cell) => set({ activeCell: cell }),

  toggleValueLabels: () => set((state) => ({ showValueLabels: !state.showValueLabels })),

  updateCell: (rowIndex, varName, value) => {
    const { dataset, history, historyIndex } = get();
    const updatedRows = [...dataset.rows];
    updatedRows[rowIndex] = { ...updatedRows[rowIndex], [varName]: value };
    const nextDataset = { ...dataset, rows: updatedRows };

    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(nextDataset);

    set({
      dataset: nextDataset,
      history: nextHistory,
      historyIndex: nextHistory.length - 1,
    });
  },

  addRow: () => {
    const { dataset } = get();
    const newRow: Record<string, any> = { id: dataset.rows.length + 1 };
    dataset.variables.forEach((v) => {
      newRow[v.name] = v.type === 'Numeric' || v.type === 'Currency' ? 0 : '';
    });
    set({
      dataset: { ...dataset, rows: [...dataset.rows, newRow] },
    });
  },

  addVariable: () => {
    const { dataset } = get();
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
    set({
      dataset: {
        ...dataset,
        variables: [...dataset.variables, newVar],
        rows: updatedRows,
      },
    });
  },

  updateVariable: (index, updated) => {
    const { dataset } = get();
    const oldVar = dataset.variables[index];
    const newVars = [...dataset.variables];
    newVars[index] = { ...oldVar, ...updated };

    if (updated.name && updated.name !== oldVar.name) {
      const updatedRows = dataset.rows.map((r) => {
        const copy = { ...r };
        copy[updated.name!] = copy[oldVar.name];
        delete copy[oldVar.name];
        return copy;
      });
      set({ dataset: { ...dataset, variables: newVars, rows: updatedRows } });
      return;
    }

    set({ dataset: { ...dataset, variables: newVars } });
  },

  deleteVariable: (index) => {
    const { dataset } = get();
    const varToDelete = dataset.variables[index];
    const newVars = dataset.variables.filter((_, i) => i !== index);
    const updatedRows = dataset.rows.map((r) => {
      const copy = { ...r };
      delete copy[varToDelete.name];
      return copy;
    });
    set({ dataset: { ...dataset, variables: newVars, rows: updatedRows } });
  },

  sortCases: (varName, ascending = true) => {
    const { dataset } = get();
    const sorted = [...dataset.rows].sort((a, b) => {
      const vA = a[varName];
      const vB = b[varName];
      if (typeof vA === 'number' && typeof vB === 'number') {
        return ascending ? vA - vB : vB - vA;
      }
      return ascending
        ? String(vA).localeCompare(String(vB))
        : String(vB).localeCompare(String(vA));
    });
    set({ dataset: { ...dataset, rows: sorted } });
  },

  filterCases: (predicate) => {
    const { dataset } = get();
    const filtered = dataset.rows.filter(predicate);
    set({ dataset: { ...dataset, rows: filtered } });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      set({
        historyIndex: historyIndex - 1,
        dataset: history[historyIndex - 1],
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      set({
        historyIndex: historyIndex + 1,
        dataset: history[historyIndex + 1],
      });
    }
  },
}));
