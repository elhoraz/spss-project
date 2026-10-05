import React, { useState, useRef, useEffect } from 'react';
import { VariableMeta, VariableType, VariableAlign, VariableMeasure, VariableRole } from '../types/spss';
import { Trash2, Plus } from 'lucide-react';
import { VariableTypeModal } from './VariableTypeModal';
import { MissingValuesModal } from './MissingValuesModal';

interface VariableViewGridProps {
  variables: VariableMeta[];
  onUpdateVariable: (index: number, updated: Partial<VariableMeta>) => void;
  onOpenValueLabels: (varName: string) => void;
  onAddVariable: () => void;
  onDeleteVariable: (index: number) => void;
}

export const VariableViewGrid: React.FC<VariableViewGridProps> = ({
  variables,
  onUpdateVariable,
  onOpenValueLabels,
  onAddVariable,
  onDeleteVariable,
}) => {
  const [selectedTypeVarIdx, setSelectedTypeVarIdx] = useState<number | null>(null);
  const [selectedMissingVarIdx, setSelectedMissingVarIdx] = useState<number | null>(null);

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

  const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    // 1. Enter Key: Commit and move down to next row (or create new variable at end)
    if (e.key === 'Enter') {
      e.preventDefault();
      if (row < variables.length - 1) {
        focusCell(row + 1, col);
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
        }
      } else {
        // Tab: move right
        if (col < 10) {
          focusCell(row, col + 1);
        } else if (row < variables.length - 1) {
          focusCell(row + 1, 0);
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
    <div className="spss-grid-container">
      <table className="spss-varview-table">
        <thead>
          <tr>
            <th className="spss-grid-corner-th" />
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
            <th className="spss-varview-th" style={{ width: 50 }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {variables.map((v, idx) => (
            <tr key={idx}>
              {/* Row Number */}
              <td className="spss-grid-row-header">{idx + 1}</td>

              {/* 0. Name */}
              <td className="spss-varview-td">
                <input
                  ref={(el) => {
                    cellRefs.current[`${idx}_0`] = el;
                  }}
                  className="spss-varview-input"
                  value={v.name}
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
                  onClick={() => setSelectedTypeVarIdx(idx)}
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
                  onClick={() => onOpenValueLabels(v.name)}
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
                  onClick={() => setSelectedMissingVarIdx(idx)}
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

              {/* Delete */}
              <td className="spss-varview-td" style={{ textAlign: 'center' }}>
                <button
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                  onClick={() => onDeleteVariable(idx)}
                  title={`Delete variable ${v.name}`}
                >
                  <Trash2 size={13} />
                </button>
              </td>
            </tr>
          ))}

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
