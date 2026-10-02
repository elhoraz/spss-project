import React, { useState, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { VariableMeta } from '../types/spss';

interface DataViewGridProps {
  variables: VariableMeta[];
  rows: Record<string, any>[];
  showValueLabels: boolean;
  onCellChange: (rowIndex: number, varName: string, value: any) => void;
  onAddRow: () => void;
  onAddVariable: () => void;
  onSwitchToVariableView: (varName?: string) => void;
}

export const DataViewGrid: React.FC<DataViewGridProps> = ({
  variables,
  rows,
  showValueLabels,
  onCellChange,
  onAddRow,
  onAddVariable,
  onSwitchToVariableView,
}) => {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Virtualizer for smooth rendering with 100,000+ rows
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
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
    if (!editingCell) {
      rowVirtualizer.scrollToIndex(selectedCell.row, { align: 'auto' });
    }
  }, [selectedCell.row]);

  // Keyboard navigation & clipboard shortcuts on grid
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingCell) {
        if (e.key === 'Enter') {
          commitEdit();
          if (selectedCell.row < rows.length - 1) {
            setSelectedCell((prev) => ({ ...prev, row: prev.row + 1 }));
          }
        } else if (e.key === 'Escape') {
          setEditingCell(null);
        } else if (e.key === 'Tab') {
          e.preventDefault();
          commitEdit();
          if (selectedCell.col < variables.length - 1) {
            setSelectedCell((prev) => ({ ...prev, col: prev.col + 1 }));
          }
        }
        return;
      }

      // Clipboard Copy (Ctrl+C)
      if (e.ctrlKey && e.key === 'c') {
        const varMeta = variables[selectedCell.col];
        if (varMeta && rows[selectedCell.row]) {
          const val = rows[selectedCell.row][varMeta.name];
          navigator.clipboard.writeText(val !== undefined && val !== null ? String(val) : '');
        }
        return;
      }

      // Clipboard Paste (Ctrl+V)
      if (e.ctrlKey && e.key === 'v') {
        navigator.clipboard.readText().then((text) => {
          if (!text) return;
          const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
          lines.forEach((line, rOffset) => {
            const rIdx = selectedCell.row + rOffset;
            if (rIdx < rows.length) {
              const cells = line.split('\t');
              cells.forEach((cellVal, cOffset) => {
                const cIdx = selectedCell.col + cOffset;
                if (cIdx < variables.length) {
                  const varMeta = variables[cIdx];
                  let parsed: any = cellVal.trim();
                  if (varMeta.type === 'Numeric' || varMeta.type === 'Dollar') {
                    const num = parseFloat(parsed.replace(/[\$,]/g, ''));
                    parsed = isNaN(num) ? parsed : num;
                  }
                  onCellChange(rIdx, varMeta.name, parsed);
                }
              });
            }
          });
        });
        return;
      }

      // Fill Down (Ctrl+D)
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        if (selectedCell.row < rows.length - 1 && variables[selectedCell.col]) {
          const varName = variables[selectedCell.col].name;
          const currentVal = rows[selectedCell.row][varName];
          onCellChange(selectedCell.row + 1, varName, currentVal);
          setSelectedCell((prev) => ({ ...prev, row: prev.row + 1 }));
        }
        return;
      }

      // Not editing - navigate
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCell((prev) => ({ ...prev, row: Math.max(0, prev.row - 1) }));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCell((prev) => ({ ...prev, row: Math.min(rows.length - 1, prev.row + 1) }));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedCell((prev) => ({ ...prev, col: Math.max(0, prev.col - 1) }));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedCell((prev) => ({ ...prev, col: Math.min(variables.length - 1, prev.col + 1) }));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        startEditing(selectedCell.row, selectedCell.col);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingCell, selectedCell, variables, rows, editValue]);

  const startEditing = (rIdx: number, cIdx: number) => {
    if (cIdx >= variables.length || rIdx >= rows.length) return;
    const varName = variables[cIdx].name;
    const val = rows[rIdx][varName];
    setEditingCell({ row: rIdx, col: cIdx });
    setEditValue(val !== undefined && val !== null ? String(val) : '');
  };

  const commitEdit = () => {
    if (!editingCell) return;
    const varMeta = variables[editingCell.col];
    let parsedVal: any = editValue.trim();

    if (varMeta.type === 'Numeric' || varMeta.type === 'Dollar') {
      const num = parseFloat(parsedVal.replace(/[\$,]/g, ''));
      parsedVal = isNaN(num) ? parsedVal : num;
    }

    onCellChange(editingCell.row, varMeta.name, parsedVal);
    setEditingCell(null);
  };

  // Helper to format cell display
  const formatCellValue = (val: any, varMeta: VariableMeta) => {
    if (val === undefined || val === null || val === '') return '';

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
              <th className="spss-grid-corner-th" />
              {variables.map((v) => (
                <th
                  key={v.name}
                  className="spss-grid-th"
                  style={{ width: Math.max(90, v.columns * 11) }}
                  onDoubleClick={() => onSwitchToVariableView(v.name)}
                  title={`Double-click to edit variable '${v.name}' in Variable View`}
                >
                  <div className="spss-var-header-content">
                    {renderMeasureIcon(v.measure)}
                    <span>{v.name}</span>
                  </div>
                </th>
              ))}
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
              const row = rows[rIdx];
              if (!row) return null;

              return (
                <tr key={rIdx} style={{ height: 24 }}>
                  {/* Row Header Number */}
                  <td
                    className={`spss-grid-row-header ${selectedCell.row === rIdx ? 'active-row' : ''}`}
                    onClick={() => setSelectedCell((prev) => ({ ...prev, row: rIdx }))}
                  >
                    {rIdx + 1}
                  </td>

                  {/* Data Cells */}
                  {variables.map((v, cIdx) => {
                    const isSelected = selectedCell.row === rIdx && selectedCell.col === cIdx;
                    const isEditing = editingCell?.row === rIdx && editingCell?.col === cIdx;
                    const cellVal = row[v.name];
                    const alignClass = `align-${v.align.toLowerCase()}`;

                    return (
                      <td
                        key={v.name}
                        className={`spss-grid-td ${alignClass} ${isSelected ? 'active' : ''}`}
                        onClick={() => setSelectedCell({ row: rIdx, col: cIdx })}
                        onDoubleClick={() => startEditing(rIdx, cIdx)}
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
    </div>
  );
};
