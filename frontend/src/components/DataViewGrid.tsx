import React, { useState, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { VariableMeta } from '../types/spss';
import { GridContextMenu } from './GridContextMenu';

interface SelectionRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

interface ContextMenuState {
  x: number;
  y: number;
  type: 'cell' | 'row' | 'col';
  targetRow: number;
  targetCol: number;
}

interface DataViewGridProps {
  variables: VariableMeta[];
  rows: Record<string, any>[];
  showValueLabels: boolean;
  onCellChange: (rowIndex: number, varName: string, value: any) => void;
  onBulkPaste?: (startRow: number, startCol: number, matrix: string[][]) => void;
  onAddRow: () => void;
  onAddVariable: () => void;
  onInsertRow?: (beforeIndex: number) => void;
  onInsertVariable?: (beforeIndex: number) => void;
  onDeleteRow?: (rowIndex: number) => void;
  onDeleteRows?: (rowIndices: number[]) => void;
  onDeleteVariable?: (varName: string) => void;
  onResizeColumn?: (varName: string, newWidthPx: number) => void;
  onClearCells?: (range: SelectionRange) => void;
  onSortCases?: (varName: string, ascending: boolean) => void;
  onQuickDescriptives?: (varName: string) => void;
  onSwitchToVariableView: (varName?: string) => void;
  focusTarget?: { row: number; col?: number; timestamp: number } | null;
}

export const DataViewGrid: React.FC<DataViewGridProps> = ({
  variables,
  rows,
  showValueLabels,
  onCellChange,
  onBulkPaste,
  onAddRow,
  onAddVariable,
  onInsertRow,
  onInsertVariable,
  onDeleteRow,
  onDeleteRows,
  onDeleteVariable,
  onResizeColumn,
  onClearCells,
  onSortCases,
  onQuickDescriptives,
  onSwitchToVariableView,
  focusTarget,
}) => {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const [selectedRows, setSelectedRows] = useState<number[]>([0]);
  const [selectionRange, setSelectionRange] = useState<SelectionRange>({
    startRow: 0,
    startCol: 0,
    endRow: 0,
    endCol: 0,
  });
  const [selectionType, setSelectionType] = useState<'cell' | 'row' | 'col'>('cell');
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [customColWidths, setCustomColWidths] = useState<Record<string, number>>({});
  const [resizingCol, setResizingCol] = useState<{ colIdx: number; startX: number; startWidth: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Guarantee at least 50 visible rows for data entry (authentic SPSS behavior)
  const displayRowCount = Math.max(50, rows.length);

  // Virtualizer for smooth rendering with 100,000+ rows
  const rowVirtualizer = useVirtualizer({
    count: displayRowCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 24,
    overscan: 30,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalHeight = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom = virtualRows.length > 0 ? totalHeight - virtualRows[virtualRows.length - 1].end : 0;

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // Keep selected row in view when navigating
  useEffect(() => {
    if (!editingCell && selectedCell.row >= 0 && selectedCell.row < displayRowCount) {
      rowVirtualizer.scrollToIndex(selectedCell.row, { align: 'auto' });
    }
  }, [selectedCell.row, displayRowCount]);

  // Handle external focus target (e.g. from Go to Case or Find & Replace)
  useEffect(() => {
    if (focusTarget) {
      const targetRow = Math.max(0, Math.min(displayRowCount - 1, focusTarget.row));
      const targetCol = focusTarget.col !== undefined ? Math.max(0, Math.min(variables.length - 1, focusTarget.col)) : selectedCell.col;
      selectSingleCell(targetRow, targetCol);
      rowVirtualizer.scrollToIndex(targetRow, { align: 'center' });
    }
  }, [focusTarget]);

  // Column Resizer mouse drag listener
  useEffect(() => {
    if (!resizingCol) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizingCol.startX;
      const newWidth = Math.max(50, resizingCol.startWidth + diff);
      const varMeta = variables[resizingCol.colIdx];
      if (varMeta) {
        setCustomColWidths((prev) => ({ ...prev, [varMeta.name]: newWidth }));
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const diff = e.clientX - resizingCol.startX;
      const finalWidth = Math.max(50, resizingCol.startWidth + diff);
      const varMeta = variables[resizingCol.colIdx];
      if (varMeta && onResizeColumn) {
        onResizeColumn(varMeta.name, finalWidth);
      }
      setResizingCol(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingCol, variables, onResizeColumn]);

  const isMouseDownRef = useRef<boolean>(false);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isMouseDownRef.current = false;
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Handle cell selection
  const selectSingleCell = (rIdx: number, cIdx: number) => {
    setSelectedCell({ row: rIdx, col: cIdx });
    setSelectionRange({ startRow: rIdx, startCol: cIdx, endRow: rIdx, endCol: cIdx });
    setSelectedRows([rIdx]);
    setSelectionType('cell');
  };

  const extendSelection = (targetRow: number, targetCol: number) => {
    const clampedRow = Math.max(0, Math.min(displayRowCount - 1, targetRow));
    const clampedCol = Math.max(0, Math.min(Math.max(0, variables.length - 1), targetCol));
    setSelectionRange((prev) => ({
      ...prev,
      endRow: clampedRow,
      endCol: clampedCol,
    }));
    setSelectionType('cell');
  };

  const handleCellMouseDown = (rIdx: number, cIdx: number, e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only primary left-click
    if (e.shiftKey && selectedCell.row >= 0 && selectedCell.col >= 0) {
      // Shift+Click: Extend selection range from active cell to clicked cell
      extendSelection(rIdx, cIdx);
      return;
    }
    isMouseDownRef.current = true;
    selectSingleCell(rIdx, cIdx);
  };

  const handleCellMouseEnter = (rIdx: number, cIdx: number) => {
    if (isMouseDownRef.current) {
      setSelectionRange((prev) => ({
        ...prev,
        endRow: rIdx,
        endCol: cIdx,
      }));
    }
  };

  // Handle full row selection with optional multi-select (Ctrl+Click)
  const selectFullRow = (rIdx: number, isMulti = false) => {
    setSelectedCell({ row: rIdx, col: 0 });
    if (isMulti) {
      setSelectedRows((prev) => {
        const next = prev.includes(rIdx) ? prev.filter((r) => r !== rIdx) : [...prev, rIdx];
        return next.length > 0 ? next : [rIdx];
      });
    } else {
      setSelectedRows([rIdx]);
    }
    setSelectionRange({
      startRow: rIdx,
      startCol: 0,
      endRow: rIdx,
      endCol: Math.max(0, variables.length - 1),
    });
    setSelectionType('row');
  };

  // Handle full column selection
  const selectFullColumn = (cIdx: number) => {
    setSelectedCell({ row: 0, col: cIdx });
    setSelectionRange({
      startRow: 0,
      startCol: cIdx,
      endRow: Math.max(0, rows.length - 1),
      endCol: cIdx,
    });
    setSelectionType('col');
  };

  // Check if a cell is inside the current selection range
  const isCellInRange = (r: number, c: number) => {
    const minR = Math.min(selectionRange.startRow, selectionRange.endRow);
    const maxR = Math.max(selectionRange.startRow, selectionRange.endRow);
    const minC = Math.min(selectionRange.startCol, selectionRange.endCol);
    const maxC = Math.max(selectionRange.startCol, selectionRange.endCol);
    return r >= minR && r <= maxR && c >= minC && c <= maxC;
  };

  // Check if row is filtered out (filter_$ == 0)
  const isRowFiltered = (row: Record<string, any>) => {
    if (!row) return false;
    const f = row['filter_$'];
    return f !== undefined && (f === 0 || f === '0' || f === false);
  };

  // Edit lifecycle
  const startEditing = (rIdx: number, cIdx: number, initialChar?: string) => {
    if (variables.length === 0) {
      onAddVariable();
      setEditingCell({ row: rIdx, col: 0 });
      setEditValue(initialChar ?? '');
      return;
    }
    if (cIdx >= variables.length) return;
    const varName = variables[cIdx].name;
    const val = rows[rIdx]?.[varName];
    setEditingCell({ row: rIdx, col: cIdx });
    setEditValue(initialChar !== undefined ? initialChar : val !== undefined && val !== null ? String(val) : '');
  };

  const commitEdit = () => {
    if (!editingCell) return;
    const varMeta = variables[editingCell.col];
    if (!varMeta) {
      setEditingCell(null);
      return;
    }

    let parsedVal: any = editValue.trim();
    if (parsedVal === '') {
      parsedVal = null;
    } else if (varMeta.type === 'Numeric' || varMeta.type === 'Dollar') {
      const num = parseFloat(parsedVal.replace(/[$,]/g, ''));
      parsedVal = isNaN(num) ? parsedVal : num;
    }

    onCellChange(editingCell.row, varMeta.name, parsedVal);
    setEditingCell(null);
  };

  // Clipboard operations
  const handleCopy = () => {
    const minR = Math.min(selectionRange.startRow, selectionRange.endRow);
    const maxR = Math.max(selectionRange.startRow, selectionRange.endRow);
    const minC = Math.min(selectionRange.startCol, selectionRange.endCol);
    const maxC = Math.max(selectionRange.startCol, selectionRange.endCol);

    const lines: string[] = [];
    for (let r = minR; r <= maxR; r++) {
      const rowVals: string[] = [];
      for (let c = minC; c <= maxC; c++) {
        const vMeta = variables[c];
        const val = rows[r]?.[vMeta?.name];
        rowVals.push(val !== undefined && val !== null ? String(val) : '');
      }
      lines.push(rowVals.join('\t'));
    }
    navigator.clipboard.writeText(lines.join('\r\n'));
  };

  const handleCut = () => {
    handleCopy();
    handleClearSelection();
  };

  const handlePaste = () => {
    navigator.clipboard.readText().then((text) => {
      if (!text) return;
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const matrix = lines.map((l) => l.split('\t'));
      if (onBulkPaste) {
        onBulkPaste(selectedCell.row, selectedCell.col, matrix);
      } else {
        lines.forEach((line, rOffset) => {
          const rIdx = selectedCell.row + rOffset;
          const cells = line.split('\t');
          cells.forEach((cellVal, cOffset) => {
            const cIdx = selectedCell.col + cOffset;
            if (cIdx < variables.length) {
              const varMeta = variables[cIdx];
              let parsed: any = cellVal.trim();
              if (varMeta.type === 'Numeric' || varMeta.type === 'Dollar') {
                const num = parseFloat(parsed.replace(/[$,]/g, ''));
                parsed = isNaN(num) ? parsed : num;
              }
              onCellChange(rIdx, varMeta.name, parsed);
            }
          });
        });
      }
    });
  };

  const handleClearSelection = () => {
    if (selectionType === 'row' && selectedRows.length > 1) {
      selectedRows.forEach((r) => {
        variables.forEach((v) => {
          onCellChange(r, v.name, null);
        });
      });
      return;
    }
    if (onClearCells) {
      onClearCells(selectionRange);
      return;
    }
    const minR = Math.min(selectionRange.startRow, selectionRange.endRow);
    const maxR = Math.max(selectionRange.startRow, selectionRange.endRow);
    const minC = Math.min(selectionRange.startCol, selectionRange.endCol);
    const maxC = Math.max(selectionRange.startCol, selectionRange.endCol);

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const vMeta = variables[c];
        if (vMeta) {
          onCellChange(r, vMeta.name, null);
        }
      }
    }
  };

  // Keyboard navigation & clipboard shortcuts on grid
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingCell) {
        if (e.key === 'Enter') {
          const nextRow = selectedCell.row + 1;
          commitEdit();
          selectSingleCell(nextRow, selectedCell.col);
        } else if (e.key === 'Escape') {
          setEditingCell(null);
        } else if (e.key === 'Tab') {
          e.preventDefault();
          commitEdit();
          if (e.shiftKey) {
            // Shift+Tab: Move left, or wrap up to previous row
            if (selectedCell.col > 0) {
              selectSingleCell(selectedCell.row, selectedCell.col - 1);
            } else if (selectedCell.row > 0) {
              selectSingleCell(selectedCell.row - 1, Math.max(0, variables.length - 1));
            }
          } else {
            // Tab: Move right, or wrap to next row
            if (selectedCell.col < variables.length - 1) {
              selectSingleCell(selectedCell.row, selectedCell.col + 1);
            } else {
              selectSingleCell(selectedCell.row + 1, 0);
            }
          }
        }
        return;
      }

      // Ctrl+A: Select All (Entire Dataset)
      if (e.ctrlKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setSelectedCell({ row: 0, col: 0 });
        setSelectionRange({
          startRow: 0,
          startCol: 0,
          endRow: Math.max(0, displayRowCount - 1),
          endCol: Math.max(0, variables.length - 1),
        });
        setSelectionType('cell');
        return;
      }

      // Backspace: Clear cell and start editing immediately
      if (e.key === 'Backspace') {
        e.preventDefault();
        if (selectedCell.row >= 0 && selectedCell.col >= 0 && variables[selectedCell.col]) {
          onCellChange(selectedCell.row, variables[selectedCell.col].name, null);
          startEditing(selectedCell.row, selectedCell.col, '');
        }
        return;
      }

      // Home & End keys
      if (e.key === 'Home') {
        e.preventDefault();
        if (e.ctrlKey) {
          selectSingleCell(0, 0);
        } else {
          selectSingleCell(selectedCell.row, 0);
        }
        return;
      }

      if (e.key === 'End') {
        e.preventDefault();
        const lastCol = Math.max(0, variables.length - 1);
        if (e.ctrlKey) {
          selectSingleCell(Math.max(0, rows.length - 1), lastCol);
        } else {
          selectSingleCell(selectedCell.row, lastCol);
        }
        return;
      }

      // Page Up & Page Down
      const pageSize = Math.max(5, Math.floor((containerRef.current?.clientHeight || 480) / 24));
      if (e.key === 'PageUp') {
        e.preventDefault();
        selectSingleCell(Math.max(0, selectedCell.row - pageSize), selectedCell.col);
        return;
      }

      if (e.key === 'PageDown') {
        e.preventDefault();
        selectSingleCell(Math.min(displayRowCount - 1, selectedCell.row + pageSize), selectedCell.col);
        return;
      }

      // Shift + Arrow Keys (Extend Selection Range)
      if (e.shiftKey) {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          extendSelection(selectionRange.endRow - 1, selectionRange.endCol);
          return;
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          extendSelection(selectionRange.endRow + 1, selectionRange.endCol);
          return;
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          extendSelection(selectionRange.endRow, selectionRange.endCol - 1);
          return;
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          extendSelection(selectionRange.endRow, selectionRange.endCol + 1);
          return;
        }
      }

      // Direct typing of alphanumeric character starts editing immediately (Excel / SPSS standard)
      if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1 && /[a-zA-Z0-9\.\-\_\,\$\#]/.test(e.key)) {
        if (selectedCell.row >= 0 && selectedCell.col >= 0) {
          e.preventDefault();
          startEditing(selectedCell.row, selectedCell.col, e.key);
          return;
        }
      }

      // F2 to start editing
      if (e.key === 'F2') {
        e.preventDefault();
        startEditing(selectedCell.row, selectedCell.col);
        return;
      }

      // Clipboard Copy (Ctrl+C)
      if (e.ctrlKey && e.key === 'c') {
        handleCopy();
        return;
      }

      // Clipboard Cut (Ctrl+X)
      if (e.ctrlKey && e.key === 'x') {
        handleCut();
        return;
      }

      // Clipboard Paste (Ctrl+V)
      if (e.ctrlKey && e.key === 'v') {
        handlePaste();
        return;
      }

      // Delete key clears selection
      if (e.key === 'Delete') {
        handleClearSelection();
        return;
      }

      // Fill Down (Ctrl+D) - standard Excel / SPSS range fill down
      if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        const minR = Math.min(selectionRange.startRow, selectionRange.endRow);
        const maxR = Math.max(selectionRange.startRow, selectionRange.endRow);
        const minC = Math.min(selectionRange.startCol, selectionRange.endCol);
        const maxC = Math.max(selectionRange.startCol, selectionRange.endCol);

        if (minR < maxR) {
          // Range selection: fill top row down to all selected rows
          for (let r = minR + 1; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
              const varMeta = variables[c];
              if (varMeta) {
                const topVal = rows[minR]?.[varMeta.name];
                onCellChange(r, varMeta.name, topVal !== undefined ? topVal : null);
              }
            }
          }
        } else {
          // Single cell selection: copy selected cell to row immediately below
          if (variables[selectedCell.col]) {
            const varName = variables[selectedCell.col].name;
            const currentVal = rows[selectedCell.row]?.[varName];
            onCellChange(selectedCell.row + 1, varName, currentVal !== undefined ? currentVal : null);
            selectSingleCell(selectedCell.row + 1, selectedCell.col);
          }
        }
        return;
      }

      // Not editing - navigate
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectSingleCell(Math.max(0, selectedCell.row - 1), selectedCell.col);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectSingleCell(Math.min(displayRowCount - 1, selectedCell.row + 1), selectedCell.col);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        selectSingleCell(selectedCell.row, Math.max(0, selectedCell.col - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        selectSingleCell(selectedCell.row, Math.min(Math.max(0, variables.length - 1), selectedCell.col + 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        startEditing(selectedCell.row, selectedCell.col);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          if (selectedCell.col > 0) {
            selectSingleCell(selectedCell.row, selectedCell.col - 1);
          } else if (selectedCell.row > 0) {
            selectSingleCell(selectedCell.row - 1, Math.max(0, variables.length - 1));
          }
        } else {
          if (selectedCell.col < variables.length - 1) {
            selectSingleCell(selectedCell.row, selectedCell.col + 1);
          } else {
            selectSingleCell(selectedCell.row + 1, 0);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingCell, selectedCell, selectionRange, variables, rows, editValue, displayRowCount]);

  const isSystemMissing = (val: any, varMeta: VariableMeta) => {
    if (val === undefined || val === null || val === '') {
      return varMeta.type === 'Numeric' || varMeta.type === 'Dollar';
    }
    return false;
  };

  // Helper to format cell display
  const formatCellValue = (val: any, varMeta: VariableMeta) => {
    if (val === undefined || val === null || val === '') {
      // In IBM SPSS, numeric system-missing values are displayed as '.'
      if (varMeta.type === 'Numeric' || varMeta.type === 'Dollar') {
        return '.';
      }
      return '';
    }

    // If Value Labels is ON and mapped
    if (showValueLabels && varMeta.values && varMeta.values[String(val)]) {
      return varMeta.values[String(val)];
    }

    if (varMeta.type === 'Dollar') {
      const num = typeof val === 'number' ? val : parseFloat(val);
      return !isNaN(num)
        ? `$${num.toLocaleString('en-US', { minimumFractionDigits: varMeta.decimals, maximumFractionDigits: varMeta.decimals })}`
        : String(val);
    }

    if (varMeta.type === 'Numeric') {
      const num = typeof val === 'number' ? val : parseFloat(val);
      return !isNaN(num) ? num.toFixed(varMeta.decimals) : String(val);
    }

    return String(val);
  };

  // Measurement icon renderer
  const renderMeasureIcon = (measure: string) => {
    if (measure === 'Scale') {
      return (
        <svg className="spss-measure-icon" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <line x1="6" y1="6" x2="6" y2="10" />
          <line x1="10" y1="6" x2="10" y2="12" />
          <line x1="14" y1="6" x2="14" y2="10" />
          <line x1="18" y1="6" x2="18" y2="12" />
        </svg>
      );
    }
    if (measure === 'Ordinal') {
      return (
        <svg className="spss-measure-icon" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
          <line x1="6" y1="20" x2="6" y2="14" />
          <line x1="12" y1="20" x2="12" y2="8" />
          <line x1="18" y1="20" x2="18" y2="4" />
        </svg>
      );
    }
    return (
      <svg className="spss-measure-icon" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2">
        <circle cx="6" cy="12" r="3" fill="#ea580c" />
        <circle cx="12" cy="7" r="3" fill="#3b82f6" />
        <circle cx="18" cy="12" r="3" fill="#10b981" />
      </svg>
    );
  };

  const activeVar = variables[selectedCell.col];
  const activeVal = rows[selectedCell.row]?.[activeVar?.name];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      {/* Active Cell Formula / Status Bar */}
      <div className="spss-cell-status-bar">
        <div className="spss-active-cell-coord">
          {selectedCell.row + 1} : {activeVar?.name || ''}
        </div>
        <div className="spss-cell-value-display">
          {activeVal !== undefined && activeVal !== null ? String(activeVal) : ''}
          {activeVar?.label && <span style={{ color: 'var(--text-dim)', marginLeft: 8 }}>({activeVar.label})</span>}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
          <span>Virtual Rows: {rows.length.toLocaleString()}</span>
        </div>
      </div>

      {/* Spreadsheet Virtual Grid Container */}
      <div className="spss-grid-container" ref={containerRef} style={{ flex: 1, overflow: 'auto' }}>
        <table className="spss-grid-table" style={{ width: 'max-content' }}>
          <thead>
            <tr>
              <th
                className="spss-grid-corner-th"
                onClick={() => {
                  setSelectedCell({ row: 0, col: 0 });
                  setSelectionRange({
                    startRow: 0,
                    startCol: 0,
                    endRow: Math.max(0, rows.length - 1),
                    endCol: Math.max(0, variables.length - 1),
                  });
                  setSelectionType('cell');
                }}
                title="Select All (Ctrl+A)"
              />
              {variables.map((v, cIdx) => {
                const isColSelected = selectionType === 'col' && selectedCell.col === cIdx;
                const colWidth = customColWidths[v.name] || Math.max(90, v.columns * 11);
                return (
                  <th
                    key={v.name}
                    className={`spss-grid-th ${isColSelected ? 'selected-full-col' : ''}`}
                    style={{ width: colWidth, minWidth: 50 }}
                    onClick={() => selectFullColumn(cIdx)}
                    onDoubleClick={() => onSwitchToVariableView(v.name)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      selectFullColumn(cIdx);
                      setContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        type: 'col',
                        targetRow: selectedCell.row,
                        targetCol: cIdx,
                      });
                    }}
                    title={`Column ${v.name} (Right-click for options, Double-click for Variable View)`}
                  >
                    <div className="spss-var-header-content">
                      {renderMeasureIcon(v.measure)}
                      <span>{v.name}</span>
                    </div>
                    {/* Column Resizer Handle */}
                    <div
                      className={`spss-th-resizer ${resizingCol?.colIdx === cIdx ? 'resizing' : ''}`}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setResizingCol({
                          colIdx: cIdx,
                          startX: e.clientX,
                          startWidth: colWidth,
                        });
                      }}
                      title="Drag to resize column"
                    />
                  </th>
                );
              })}
              {/* Add Variable Column */}
              <th
                className="spss-grid-th"
                style={{ width: 80, color: 'var(--text-dim)', cursor: 'pointer' }}
                onClick={onAddVariable}
                title="Add new variable"
              >
                + var...
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Top Virtual Spacer */}
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} colSpan={variables.length + 2} />
              </tr>
            )}

            {/* Virtualized Rows */}
            {virtualRows.map((virtualRow) => {
              const rIdx = virtualRow.index;
              const row = rows[rIdx] || {};

              const isRowSelected =
                (selectionType === 'row' && selectedRows.includes(rIdx)) ||
                (selectionType === 'row' && selectedCell.row === rIdx);
              const isFiltered = isRowFiltered(row);

              return (
                <tr key={rIdx} className={isFiltered ? 'filtered-case-row' : ''} style={{ height: 24 }}>
                  {/* Row Header Number */}
                  <td
                    className={`spss-grid-row-header ${isRowSelected ? 'selected-full-row' : ''} ${
                      isFiltered ? 'filtered-case' : ''
                    } ${selectedCell.row === rIdx ? 'active-row' : ''}`}
                    onClick={(e) => selectFullRow(rIdx, e.ctrlKey || e.metaKey)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (!selectedRows.includes(rIdx)) {
                        selectFullRow(rIdx, false);
                      }
                      setContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        type: 'row',
                        targetRow: rIdx,
                        targetCol: selectedCell.col,
                      });
                    }}
                    title={isFiltered ? `Case ${rIdx + 1} (Filtered out by filter_$)` : `Case ${rIdx + 1}`}
                  >
                    {rIdx + 1}
                  </td>

                  {/* Data Cells */}
                  {variables.map((v, cIdx) => {
                    const isSelected = selectedCell.row === rIdx && selectedCell.col === cIdx;
                    const inRange = isCellInRange(rIdx, cIdx);
                    const inMultiRow = selectionType === 'row' && selectedRows.includes(rIdx);
                    const isEditing = editingCell?.row === rIdx && editingCell?.col === cIdx;
                    const cellVal = row[v.name];
                    const alignClass = `align-${v.align.toLowerCase()}`;
                    const isMissing = isSystemMissing(cellVal, v);

                    return (
                      <td
                        key={v.name}
                        className={`spss-grid-td ${alignClass} ${isSelected ? 'active' : ''} ${
                          (inRange && !isSelected) || (inMultiRow && !isSelected) ? 'in-selection-range' : ''
                        } ${isMissing ? 'system-missing' : ''}`}
                        onMouseDown={(e) => handleCellMouseDown(rIdx, cIdx, e)}
                        onMouseEnter={() => handleCellMouseEnter(rIdx, cIdx)}
                        onDoubleClick={() => startEditing(rIdx, cIdx)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          selectSingleCell(rIdx, cIdx);
                          setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            type: 'cell',
                            targetRow: rIdx,
                            targetCol: cIdx,
                          });
                        }}
                      >
                        {isEditing ? (
                          <input
                            ref={inputRef}
                            className="spss-cell-input"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={commitEdit}
                          />
                        ) : (
                          formatCellValue(cellVal, v)
                        )}
                      </td>
                    );
                  })}

                  {/* Trailing empty cell */}
                  <td className="spss-grid-td" style={{ background: 'var(--bg-window)' }} />
                </tr>
              );
            })}

            {/* Bottom Virtual Spacer */}
            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: `${paddingBottom}px` }} colSpan={variables.length + 2} />
              </tr>
            )}

            {/* Bottom Add Row row */}
            <tr>
              <td
                className="spss-grid-row-header"
                style={{ cursor: 'pointer', color: 'var(--accent)', fontWeight: 600 }}
                onClick={onAddRow}
                title="Add new row (case)"
              >
                *
              </td>
              {variables.map((v) => (
                <td
                  key={v.name}
                  className="spss-grid-td"
                  style={{ background: 'var(--bg-window)', cursor: 'pointer' }}
                  onClick={onAddRow}
                />
              ))}
              <td className="spss-grid-td" style={{ background: 'var(--bg-window)' }} />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Desktop Context Menu */}
      {contextMenu && (
        <GridContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          type={contextMenu.type}
          varName={variables[contextMenu.targetCol]?.name}
          caseNumber={contextMenu.targetRow + 1}
          onClose={() => setContextMenu(null)}
          onCut={handleCut}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onClear={handleClearSelection}
          onInsertVariable={() => {
            if (onInsertVariable) {
              onInsertVariable(contextMenu.targetCol);
            } else {
              onAddVariable();
            }
          }}
          onInsertCases={() => {
            if (onInsertRow) {
              onInsertRow(contextMenu.targetRow);
            } else {
              onAddRow();
            }
          }}
          onDeleteRow={() => {
            if (selectedRows.length > 1 && onDeleteRows) {
              onDeleteRows(selectedRows);
            } else if (onDeleteRow) {
              onDeleteRow(contextMenu.targetRow);
            }
          }}
          onDeleteCol={() => {
            const vName = variables[contextMenu.targetCol]?.name;
            if (vName && onDeleteVariable) {
              onDeleteVariable(vName);
            }
          }}
          onSortAscending={() => {
            const vName = variables[contextMenu.targetCol]?.name;
            if (vName && onSortCases) {
              onSortCases(vName, true);
            }
          }}
          onSortDescending={() => {
            const vName = variables[contextMenu.targetCol]?.name;
            if (vName && onSortCases) {
              onSortCases(vName, false);
            }
          }}
          onDescriptives={() => {
            const vName = variables[contextMenu.targetCol]?.name;
            if (vName && onQuickDescriptives) {
              onQuickDescriptives(vName);
            }
          }}
        />
      )}
    </div>
  );
};
