import React, { useState, useRef, useEffect } from 'react';
import { VariableMeta, VariableType, VariableAlign, VariableMeasure, VariableRole } from '../types/spss';
import { Trash2, Plus, ArrowUp, ArrowDown, Copy, Clipboard, Check, HelpCircle } from 'lucide-react';
import { VariableTypeModal } from './VariableTypeModal';
import { MissingValuesModal } from './MissingValuesModal';

interface VariableViewGridProps {
  variables: VariableMeta[];
  onUpdateVariable: (index: number, updated: Partial<VariableMeta>) => void;
  onOpenValueLabels: (varName: string) => void;
  onAddVariable: () => void;
  onDeleteVariable: (index: number) => void;
  onReorderVariables?: (fromIndex: number, toIndex: number) => void;
}

export const VariableViewGrid: React.FC<VariableViewGridProps> = ({
  variables,
  onUpdateVariable,
  onOpenValueLabels,
  onAddVariable,
  onDeleteVariable,
  onReorderVariables,
}) => {
  const [selectedTypeVarIdx, setSelectedTypeVarIdx] = useState<number | null>(null);
  const [selectedMissingVarIdx, setSelectedMissingVarIdx] = useState<number | null>(null);
  const [selectedRowIdx, setSelectedRowIdx] = useState<number | null>(0);
  const [draggedRowIdx, setDraggedRowIdx] = useState<number | null>(null);
  const [dragOverRowIdx, setDragOverRowIdx] = useState<number | null>(null);

  // Variable Attributes Clipboard
  const [copiedAttributes, setCopiedAttributes] = useState<{
    sourceName: string;
    attrs: Partial<VariableMeta>;
  } | null>(null);
  const [clipboardFeedback, setClipboardFeedback] = useState<string | null>(null);

  // Focus management across the 11 columns of Variable View
  const cellRefs = useRef<Record<string, HTMLElement | null>>({});
  const pendingFocusRef = useRef<{ row: number; col: number } | null>(null);

  const focusCell = (row: number, col: number) => {
    const key = `${row}_${col}`;
    const el = cellRefs.current[key];
    if (el) {
      el.focus();
      if (el instanceof HTMLInputElement) {
        el.select();
      }
    }
  };

  useEffect(() => {
    if (pendingFocusRef.current) {
      const { row, col } = pendingFocusRef.current;
      pendingFocusRef.current = null;
      setTimeout(() => {
        focusCell(row, col);
      }, 50);
    }
  }, [variables.length]);

  // Keep selectedRowIdx valid
  useEffect(() => {
    if (variables.length === 0) {
      setSelectedRowIdx(null);
    } else if (selectedRowIdx !== null && selectedRowIdx >= variables.length) {
      setSelectedRowIdx(variables.length - 1);
    }
  }, [variables.length, selectedRowIdx]);

  const handleCopyAttributes = (idx: number) => {
    const target = variables[idx];
    if (!target) return;
    const attrs: Partial<VariableMeta> = {
      type: target.type,
      width: target.width,
      decimals: target.decimals,
      label: target.label,
      values: JSON.parse(JSON.stringify(target.values || {})),
      missing: target.missing,
      columns: target.columns,
      align: target.align,
      measure: target.measure,
      role: target.role,
    };
    setCopiedAttributes({ sourceName: target.name, attrs });
    setClipboardFeedback(`Attributes copied from "${target.name}"`);
    setTimeout(() => setClipboardFeedback(null), 3500);
  };

  const handlePasteAttributes = (idx: number) => {
    if (!copiedAttributes || !variables[idx]) return;
    onUpdateVariable(idx, copiedAttributes.attrs);
    setClipboardFeedback(`Pasted attributes to "${variables[idx].name}"`);
    setTimeout(() => setClipboardFeedback(null), 3500);
  };

  const handleMoveUp = (idx: number) => {
    if (idx > 0 && onReorderVariables) {
      onReorderVariables(idx, idx - 1);
      setSelectedRowIdx(idx - 1);
    }
  };

  const handleMoveDown = (idx: number) => {
    if (idx < variables.length - 1 && onReorderVariables) {
      onReorderVariables(idx, idx + 1);
      setSelectedRowIdx(idx + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    // Alt + Up / Alt + Down: Move Variable Row up/down
    if (e.altKey && e.key === 'ArrowUp') {
      e.preventDefault();
      handleMoveUp(row);
      return;
    }
    if (e.altKey && e.key === 'ArrowDown') {
      e.preventDefault();
      handleMoveDown(row);
      return;
    }

    // 1. Enter Key: Commit and move down to next row (or create new variable at end)
    if (e.key === 'Enter') {
      e.preventDefault();
      if (row < variables.length - 1) {
        focusCell(row + 1, col);
        setSelectedRowIdx(row + 1);
      } else {
        // Last row: automatically create new variable and focus it!
        pendingFocusRef.current = { row: row + 1, col };
        onAddVariable();
      }
      return;
    }

    // 2. Tab Key: Move horizontally across columns, wrapping to next/previous row
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift+Tab: move left
        if (col > 0) {
          focusCell(row, col - 1);
        } else if (row > 0) {
          focusCell(row - 1, 10);
          setSelectedRowIdx(row - 1);
        }
      } else {
        // Tab: move right
        if (col < 10) {
          focusCell(row, col + 1);
        } else if (row < variables.length - 1) {
          focusCell(row + 1, 0);
          setSelectedRowIdx(row + 1);
        } else {
          // Last cell of last row: add new variable
          pendingFocusRef.current = { row: row + 1, col: 0 };
          onAddVariable();
        }
      }
      return;
    }

    // 3. Arrow Down: Move to same column in row below
    if (e.key === 'ArrowDown') {
      if (e.target instanceof HTMLSelectElement) return; // let select change option
      if (row < variables.length - 1) {
        e.preventDefault();
        focusCell(row + 1, col);
        setSelectedRowIdx(row + 1);
      } else if (col === 0) {
        // At the last row's Name column: pressing down creates new variable row
        e.preventDefault();
        pendingFocusRef.current = { row: row + 1, col: 0 };
        onAddVariable();
      }
      return;
    }

    // 4. Arrow Up: Move to same column in row above
    if (e.key === 'ArrowUp') {
      if (e.target instanceof HTMLSelectElement) return; // let select change option
      if (row > 0) {
        e.preventDefault();
        focusCell(row - 1, col);
        setSelectedRowIdx(row - 1);
      }
      return;
    }
  };

  const formatValuesSummary = (v: VariableMeta) => {
    const keys = Object.keys(v.values || {});
    if (keys.length === 0) return '{None}';
    const firstTwo = keys.slice(0, 2).map((k) => `{${k}, ${v.values[k]}}`).join('; ');
    return keys.length > 2 ? `${firstTwo}...` : firstTwo;
  };

  return (
    <div className="spss-grid-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Variable View Toolbar: Reorder, Copy/Paste Attributes, Add */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          background: 'var(--bg-header)',
          borderBottom: '1px solid var(--border-header)',
          fontSize: 12,
          flexShrink: 0,
        }}
      >
        <button
          className="spss-btn spss-btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          onClick={onAddVariable}
          title="Add a new variable to the dataset"
        >
          <Plus size={13} /> Add Variable
        </button>

        <div style={{ width: 1, height: 18, background: 'var(--border-header)', margin: '0 4px' }} />

        <button
          className="spss-btn spss-btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          disabled={selectedRowIdx === null || selectedRowIdx <= 0}
          onClick={() => selectedRowIdx !== null && handleMoveUp(selectedRowIdx)}
          title="Move selected variable up (Alt+Up)"
        >
          <ArrowUp size={13} /> Move Up
        </button>

        <button
          className="spss-btn spss-btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          disabled={selectedRowIdx === null || selectedRowIdx >= variables.length - 1}
          onClick={() => selectedRowIdx !== null && handleMoveDown(selectedRowIdx)}
          title="Move selected variable down (Alt+Down)"
        >
          <ArrowDown size={13} /> Move Down
        </button>

        <div style={{ width: 1, height: 18, background: 'var(--border-header)', margin: '0 4px' }} />

        <button
          className="spss-btn spss-btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          disabled={selectedRowIdx === null || !variables[selectedRowIdx]}
          onClick={() => selectedRowIdx !== null && handleCopyAttributes(selectedRowIdx)}
          title="Copy properties (Type, Decimals, Label, Values, Missing, Align, Measure, Role) of selected variable"
        >
          <Copy size={13} /> Copy Attributes
        </button>

        <button
          className="spss-btn spss-btn-sm"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: copiedAttributes ? 'rgba(16, 185, 129, 0.15)' : undefined,
            borderColor: copiedAttributes ? 'var(--accent)' : undefined,
          }}
          disabled={!copiedAttributes || selectedRowIdx === null}
          onClick={() => selectedRowIdx !== null && handlePasteAttributes(selectedRowIdx)}
          title={
            copiedAttributes
              ? `Paste copied attributes from "${copiedAttributes.sourceName}" to selected variable`
              : 'Copy attributes from a variable first'
          }
        >
          <Clipboard size={13} /> Paste Attributes
        </button>

        {copiedAttributes && (
          <button
            className="spss-btn spss-btn-sm"
            style={{ fontSize: 11, color: 'var(--text-muted)' }}
            onClick={() => setCopiedAttributes(null)}
            title="Clear clipboard"
          >
            Clear Clipboard
          </button>
        )}

        {clipboardFeedback && (
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              color: 'var(--accent)',
              fontWeight: 500,
            }}
          >
            <Check size={13} /> {clipboardFeedback}
          </div>
        )}

        {!clipboardFeedback && (
          <div style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 11 }}>
            Total Variables: <strong>{variables.length}</strong>
            {selectedRowIdx !== null && variables[selectedRowIdx] && (
              <span style={{ marginLeft: 8 }}>
                (Selected: <strong>{variables[selectedRowIdx].name}</strong>)
              </span>
            )}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <table className="spss-varview-table">
          <thead>
            <tr>
              <th className="spss-grid-corner-th" style={{ width: 45 }} title="Drag row numbers to reorder variables">#</th>
              <th className="spss-varview-th" style={{ width: 140 }}>Name</th>
              <th className="spss-varview-th" style={{ width: 100 }}>Type</th>
              <th className="spss-varview-th" style={{ width: 70 }}>Width</th>
              <th className="spss-varview-th" style={{ width: 80 }}>Decimals</th>
              <th className="spss-varview-th" style={{ width: 220 }}>Label</th>
              <th className="spss-varview-th" style={{ width: 130 }}>Values</th>
              <th className="spss-varview-th" style={{ width: 90 }}>Missing</th>
              <th className="spss-varview-th" style={{ width: 80 }}>Columns</th>
              <th className="spss-varview-th" style={{ width: 90 }}>Align</th>
              <th className="spss-varview-th" style={{ width: 110 }}>Measure</th>
              <th className="spss-varview-th" style={{ width: 90 }}>Role</th>
              <th className="spss-varview-th" style={{ width: 75, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {variables.map((v, idx) => {
              const isSelected = selectedRowIdx === idx;
              const isDragOver = dragOverRowIdx === idx;
              return (
                <tr
                  key={v.name || idx}
                  style={{
                    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.08)' : undefined,
                    borderTop: isDragOver ? '2px solid var(--accent)' : undefined,
                  }}
                  onClick={() => setSelectedRowIdx(idx)}
                >
                  {/* Row Number with Drag Handle */}
                  <td
                    className="spss-grid-row-header"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', String(idx));
                      e.dataTransfer.effectAllowed = 'move';
                      setDraggedRowIdx(idx);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverRowIdx !== idx) setDragOverRowIdx(idx);
                    }}
                    onDragLeave={() => {
                      if (dragOverRowIdx === idx) setDragOverRowIdx(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                      if (!isNaN(fromIdx) && fromIdx !== idx && onReorderVariables) {
                        onReorderVariables(fromIdx, idx);
                        setSelectedRowIdx(idx);
                      }
                      setDraggedRowIdx(null);
                      setDragOverRowIdx(null);
                    }}
                    onDragEnd={() => {
                      setDraggedRowIdx(null);
                      setDragOverRowIdx(null);
                    }}
                    title="Click to select row, or drag up/down to reorder columns in Data View"
                    style={{
                      cursor: 'grab',
                      userSelect: 'none',
                      backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.2)' : undefined,
                      fontWeight: isSelected ? 700 : undefined,
                    }}
                  >
                    {idx + 1}
                  </td>

                  {/* 0. Name */}
                  <td className="spss-varview-td">
                    <input
                      ref={(el) => {
                        cellRefs.current[`${idx}_0`] = el;
                      }}
                      className="spss-varview-input"
                      value={v.name}
                      onFocus={() => setSelectedRowIdx(idx)}
                      onChange={(e) => onUpdateVariable(idx, { name: e.target.value.replace(/\s+/g, '_') })}
                      onKeyDown={(e) => handleKeyDown(e, idx, 0)}
                    />
                  </td>

                  {/* 1. Type */}
                  <td className="spss-varview-td">
                    <button
                      ref={(el) => {
                        cellRefs.current[`${idx}_1`] = el;
                      }}
                      className="spss-ellipsis-btn"
                      onFocus={() => setSelectedRowIdx(idx)}
                      onClick={() => {
                        setSelectedRowIdx(idx);
                        setSelectedTypeVarIdx(idx);
                      }}
                      onKeyDown={(e) => handleKeyDown(e, idx, 1)}
                      title="Define Variable Type"
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {v.type}
                      </span>
                      <span style={{ fontWeight: 700, paddingLeft: 4 }}>...</span>
                    </button>
                  </td>

                  {/* 2. Width */}
                  <td className="spss-varview-td">
                    <input
                      ref={(el) => {
                        cellRefs.current[`${idx}_2`] = el;
                      }}
                      type="number"
                      className="spss-varview-input"
                      value={v.width}
                      onFocus={() => setSelectedRowIdx(idx)}
                      onChange={(e) => onUpdateVariable(idx, { width: parseInt(e.target.value) || 8 })}
                      onKeyDown={(e) => handleKeyDown(e, idx, 2)}
                    />
                  </td>

                  {/* 3. Decimals */}
                  <td className="spss-varview-td">
                    <input
                      ref={(el) => {
                        cellRefs.current[`${idx}_3`] = el;
                      }}
                      type="number"
                      className="spss-varview-input"
                      value={v.decimals}
                      min={0}
                      max={10}
                      disabled={v.type === 'String'}
                      onFocus={() => setSelectedRowIdx(idx)}
                      onChange={(e) => onUpdateVariable(idx, { decimals: Math.max(0, parseInt(e.target.value) || 0) })}
                      onKeyDown={(e) => handleKeyDown(e, idx, 3)}
                    />
                  </td>

                  {/* 4. Label */}
                  <td className="spss-varview-td">
                    <input
                      ref={(el) => {
                        cellRefs.current[`${idx}_4`] = el;
                      }}
                      className="spss-varview-input"
                      placeholder="Variable label..."
                      value={v.label}
                      onFocus={() => setSelectedRowIdx(idx)}
                      onChange={(e) => onUpdateVariable(idx, { label: e.target.value })}
                      onKeyDown={(e) => handleKeyDown(e, idx, 4)}
                    />
                  </td>

                  {/* 5. Values (Modal trigger) */}
                  <td className="spss-varview-td">
                    <button
                      ref={(el) => {
                        cellRefs.current[`${idx}_5`] = el;
                      }}
                      className="spss-ellipsis-btn"
                      onFocus={() => setSelectedRowIdx(idx)}
                      onClick={() => {
                        setSelectedRowIdx(idx);
                        onOpenValueLabels(v.name);
                      }}
                      onKeyDown={(e) => handleKeyDown(e, idx, 5)}
                      title="Define Value Labels"
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {formatValuesSummary(v)}
                      </span>
                      <span style={{ fontWeight: 700, paddingLeft: 4 }}>...</span>
                    </button>
                  </td>

                  {/* 6. Missing */}
                  <td className="spss-varview-td">
                    <button
                      ref={(el) => {
                        cellRefs.current[`${idx}_6`] = el;
                      }}
                      className="spss-ellipsis-btn"
                      onFocus={() => setSelectedRowIdx(idx)}
                      onClick={() => {
                        setSelectedRowIdx(idx);
                        setSelectedMissingVarIdx(idx);
                      }}
                      onKeyDown={(e) => handleKeyDown(e, idx, 6)}
                      title="Define Missing Values"
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {v.missing || 'None'}
                      </span>
                      <span style={{ fontWeight: 700, paddingLeft: 4 }}>...</span>
                    </button>
                  </td>

                  {/* 7. Columns */}
                  <td className="spss-varview-td">
                    <input
                      ref={(el) => {
                        cellRefs.current[`${idx}_7`] = el;
                      }}
                      type="number"
                      className="spss-varview-input"
                      value={v.columns}
                      onFocus={() => setSelectedRowIdx(idx)}
                      onChange={(e) => onUpdateVariable(idx, { columns: parseInt(e.target.value) || 8 })}
                      onKeyDown={(e) => handleKeyDown(e, idx, 7)}
                    />
                  </td>

                  {/* 8. Align */}
                  <td className="spss-varview-td">
                    <select
                      ref={(el) => {
                        cellRefs.current[`${idx}_8`] = el;
                      }}
                      className="spss-varview-select"
                      value={v.align}
                      onFocus={() => setSelectedRowIdx(idx)}
                      onChange={(e) => onUpdateVariable(idx, { align: e.target.value as VariableAlign })}
                      onKeyDown={(e) => handleKeyDown(e, idx, 8)}
                    >
                      <option value="Right">Right</option>
                      <option value="Left">Left</option>
                      <option value="Center">Center</option>
                    </select>
                  </td>

                  {/* 9. Measure */}
                  <td className="spss-varview-td">
                    <select
                      ref={(el) => {
                        cellRefs.current[`${idx}_9`] = el;
                      }}
                      className="spss-varview-select"
                      value={v.measure}
                      onFocus={() => setSelectedRowIdx(idx)}
                      onChange={(e) => onUpdateVariable(idx, { measure: e.target.value as VariableMeasure })}
                      onKeyDown={(e) => handleKeyDown(e, idx, 9)}
                    >
                      <option value="Scale">Scale</option>
                      <option value="Ordinal">Ordinal</option>
                      <option value="Nominal">Nominal</option>
                    </select>
                  </td>

                  {/* 10. Role */}
                  <td className="spss-varview-td">
                    <select
                      ref={(el) => {
                        cellRefs.current[`${idx}_10`] = el;
                      }}
                      className="spss-varview-select"
                      value={v.role}
                      onFocus={() => setSelectedRowIdx(idx)}
                      onChange={(e) => onUpdateVariable(idx, { role: e.target.value as VariableRole })}
                      onKeyDown={(e) => handleKeyDown(e, idx, 10)}
                    >
                      <option value="Input">Input</option>
                      <option value="Target">Target</option>
                      <option value="Both">Both</option>
                      <option value="None">None</option>
                      <option value="Partition">Partition</option>
                      <option value="Split">Split</option>
                    </select>
                  </td>

                  {/* Actions: Move Up/Down, Copy Attrs, Delete */}
                  <td className="spss-varview-td" style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <button
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          padding: 1,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyAttributes(idx);
                        }}
                        title={`Copy attributes of ${v.name}`}
                      >
                        <Copy size={12} />
                      </button>

                      {copiedAttributes && (
                        <button
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--accent)',
                            padding: 1,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePasteAttributes(idx);
                          }}
                          title={`Paste attributes from ${copiedAttributes.sourceName}`}
                        >
                          <Clipboard size={12} />
                        </button>
                      )}

                      <button
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--danger)',
                          padding: 1,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteVariable(idx);
                        }}
                        title={`Delete variable ${v.name}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Add Variable row */}
            <tr>
              <td className="spss-grid-row-header" style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={onAddVariable}>
                *
              </td>
              <td colSpan={12} className="spss-varview-td" style={{ cursor: 'pointer', color: 'var(--accent)' }} onClick={onAddVariable}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={14} /> Add new variable...
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Variable Type Modal */}
      {selectedTypeVarIdx !== null && variables[selectedTypeVarIdx] && (
        <VariableTypeModal
          variable={variables[selectedTypeVarIdx]}
          onClose={() => setSelectedTypeVarIdx(null)}
          onSave={(updated) => onUpdateVariable(selectedTypeVarIdx, updated)}
        />
      )}

      {/* Missing Values Modal */}
      {selectedMissingVarIdx !== null && variables[selectedMissingVarIdx] && (
        <MissingValuesModal
          variable={variables[selectedMissingVarIdx]}
          onClose={() => setSelectedMissingVarIdx(null)}
          onSave={(missingDef) => onUpdateVariable(selectedMissingVarIdx, { missing: missingDef })}
        />
      )}
    </div>
  );
};
