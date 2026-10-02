import React from 'react';
import { VariableMeta, VariableType, VariableAlign, VariableMeasure, VariableRole } from '../types/spss';
import { Trash2, Plus } from 'lucide-react';

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

              {/* 1. Name */}
              <td className="spss-varview-td">
                <input
                  className="spss-varview-input"
                  value={v.name}
                  onChange={(e) => onUpdateVariable(idx, { name: e.target.value.replace(/\s+/g, '_') })}
                />
              </td>

              {/* 2. Type */}
              <td className="spss-varview-td">
                <select
                  className="spss-varview-select"
                  value={v.type}
                  onChange={(e) => onUpdateVariable(idx, { type: e.target.value as VariableType })}
                >
                  <option value="Numeric">Numeric</option>
                  <option value="String">String</option>
                  <option value="Date">Date</option>
                  <option value="Dollar">Dollar</option>
                </select>
              </td>

              {/* 3. Width */}
              <td className="spss-varview-td">
                <input
                  type="number"
                  className="spss-varview-input"
                  value={v.width}
                  onChange={(e) => onUpdateVariable(idx, { width: parseInt(e.target.value) || 8 })}
                />
              </td>

              {/* 4. Decimals */}
              <td className="spss-varview-td">
                <input
                  type="number"
                  className="spss-varview-input"
                  value={v.decimals}
                  min={0}
                  max={10}
                  disabled={v.type === 'String'}
                  onChange={(e) => onUpdateVariable(idx, { decimals: Math.max(0, parseInt(e.target.value) || 0) })}
                />
              </td>

              {/* 5. Label */}
              <td className="spss-varview-td">
                <input
                  className="spss-varview-input"
                  placeholder="Variable label..."
                  value={v.label}
                  onChange={(e) => onUpdateVariable(idx, { label: e.target.value })}
                />
              </td>

              {/* 6. Values (Modal trigger) */}
              <td className="spss-varview-td">
                <button
                  className="spss-ellipsis-btn"
                  onClick={() => onOpenValueLabels(v.name)}
                  title="Define Value Labels"
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {formatValuesSummary(v)}
                  </span>
                  <span style={{ fontWeight: 700, paddingLeft: 4 }}>...</span>
                </button>
              </td>

              {/* 7. Missing */}
              <td className="spss-varview-td">
                <input
                  className="spss-varview-input"
                  value={v.missing}
                  onChange={(e) => onUpdateVariable(idx, { missing: e.target.value })}
                />
              </td>

              {/* 8. Columns */}
              <td className="spss-varview-td">
                <input
                  type="number"
                  className="spss-varview-input"
                  value={v.columns}
                  onChange={(e) => onUpdateVariable(idx, { columns: parseInt(e.target.value) || 8 })}
                />
              </td>

              {/* 9. Align */}
              <td className="spss-varview-td">
                <select
                  className="spss-varview-select"
                  value={v.align}
                  onChange={(e) => onUpdateVariable(idx, { align: e.target.value as VariableAlign })}
                >
                  <option value="Right">Right</option>
                  <option value="Left">Left</option>
                  <option value="Center">Center</option>
                </select>
              </td>

              {/* 10. Measure */}
              <td className="spss-varview-td">
                <select
                  className="spss-varview-select"
                  value={v.measure}
                  onChange={(e) => onUpdateVariable(idx, { measure: e.target.value as VariableMeasure })}
                >
                  <option value="Scale">Scale</option>
                  <option value="Ordinal">Ordinal</option>
                  <option value="Nominal">Nominal</option>
                </select>
              </td>

              {/* 11. Role */}
              <td className="spss-varview-td">
                <select
                  className="spss-varview-select"
                  value={v.role}
                  onChange={(e) => onUpdateVariable(idx, { role: e.target.value as VariableRole })}
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
    </div>
  );
};
