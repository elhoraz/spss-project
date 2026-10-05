import React, { useState } from 'react';
import { VariableMeta, OutputItem } from '../types/spss';

interface AutomaticRecodeModalProps {
  isOpen: boolean;
  variables: VariableMeta[];
  rows: Record<string, any>[];
  onClose: () => void;
  onApply: (newRows: Record<string, any>[], newVar: VariableMeta, output: OutputItem) => void;
}

export const AutomaticRecodeModal: React.FC<AutomaticRecodeModalProps> = ({
  isOpen,
  variables,
  rows,
  onClose,
  onApply,
}) => {
  const [sourceVar, setSourceVar] = useState<string>(variables[0]?.name || '');
  const [targetVarName, setTargetVarName] = useState<string>('');
  const [targetLabel, setTargetLabel] = useState<string>('');
  const [startDirection, setStartDirection] = useState<'lowest' | 'highest'>('lowest');
  const [blankIsMissing, setBlankIsMissing] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleRun = () => {
    const cleanTarget = targetVarName.trim().replace(/\s+/g, '_');
    if (!cleanTarget) {
      alert('Please specify a target variable name.');
      return;
    }
    if (!sourceVar) {
      alert('Please select a source variable to recode.');
      return;
    }

    // Collect distinct values
    const distinctSet = new Set<string>();
    rows.forEach((r) => {
      const raw = r[sourceVar];
      if (raw !== undefined && raw !== null) {
        const s = String(raw).trim();
        if (s !== '' || !blankIsMissing) {
          distinctSet.add(s);
        }
      }
    });

    const sortedVals = Array.from(distinctSet).sort((a, b) => {
      const na = parseFloat(a);
      const nb = parseFloat(b);
      if (!isNaN(na) && !isNaN(nb)) {
        return startDirection === 'lowest' ? na - nb : nb - na;
      }
      return startDirection === 'lowest' ? a.localeCompare(b) : b.localeCompare(a);
    });

    const valueLabels: Record<string, string> = {};
    const valMap: Record<string, number> = {};

    sortedVals.forEach((val, idx) => {
      const code = idx + 1;
      valMap[val] = code;
      valueLabels[String(code)] = val;
    });

    // Update rows
    const newRows = rows.map((r) => {
      const raw = r[sourceVar];
      const s = raw !== undefined && raw !== null ? String(raw).trim() : '';
      const code = valMap[s] !== undefined ? valMap[s] : null;
      return {
        ...r,
        [cleanTarget]: code,
      };
    });

    // Create VariableMeta
    const newVarMeta: VariableMeta = {
      name: cleanTarget,
      type: 'Numeric',
      width: 8,
      decimals: 0,
      label: targetLabel.trim() || `Autorecoded from ${sourceVar}`,
      values: valueLabels,
      missing: 'None',
      columns: 8,
      align: 'Right',
      measure: 'Nominal',
      role: 'Input',
    };

    // Output item log
    const output: OutputItem = {
      id: `autorec_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      title: 'Automatic Recode',
      type: 'recode_variable',
      syntax: `AUTORECODE VARIABLES=${sourceVar}\n  /INTO ${cleanTarget}\n  /PRINT.`,
      data: {
        title: 'Automatic Recode Specifications',
        source_variable: sourceVar,
        target_variable: cleanTarget,
        direction: startDirection === 'lowest' ? 'Lowest value starts at 1' : 'Highest value starts at 1',
        mappings: sortedVals.map((v) => ({ original: v, recoded: valMap[v] })),
      },
    };

    onApply(newRows, newVarMeta, output);
    onClose();
  };

  return (
    <div className="spss-modal-backdrop" onClick={onClose}>
      <div
        className="spss-modal-window"
        style={{ width: 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="spss-modal-header">
          <span>Automatic Recode</span>
          <button className="spss-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="spss-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Source Variable Selection */}
          <div>
            <label className="spss-picker-label">Variable to Recode:</label>
            <select
              className="spss-text-input"
              value={sourceVar}
              onChange={(e) => {
                setSourceVar(e.target.value);
                if (!targetVarName) {
                  setTargetVarName(`${e.target.value}_rec`);
                }
              }}
            >
              {variables.map((v) => (
                <option key={v.name} value={v.name}>{v.name} {v.label ? `(${v.label})` : ''}</option>
              ))}
            </select>
          </div>

          {/* Target Variable specifications */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="spss-picker-label">New Variable Name:</label>
              <input
                type="text"
                className="spss-text-input"
                placeholder="e.g. var_rec"
                value={targetVarName}
                onChange={(e) => setTargetVarName(e.target.value)}
              />
            </div>
            <div>
              <label className="spss-picker-label">Variable Label (Optional):</label>
              <input
                type="text"
                className="spss-text-input"
                placeholder="e.g. Recoded Category"
                value={targetLabel}
                onChange={(e) => setTargetLabel(e.target.value)}
              />
            </div>
          </div>

          {/* Direction options */}
          <fieldset style={{ border: '1px solid var(--border-app)', borderRadius: 4, padding: '8px 12px' }}>
            <legend style={{ fontSize: 11, fontWeight: 600, padding: '0 4px', color: 'var(--text-main)' }}>
              Recode Starting From
            </legend>
            <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="startDir"
                  checked={startDirection === 'lowest'}
                  onChange={() => setStartDirection('lowest')}
                />
                Lowest value (1, 2, 3...)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="startDir"
                  checked={startDirection === 'highest'}
                  onChange={() => setStartDirection('highest')}
                />
                Highest value
              </label>
            </div>
          </fieldset>

          {/* Missing option */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={blankIsMissing}
              onChange={(e) => setBlankIsMissing(e.target.checked)}
            />
            Treat blank string values as missing
          </label>
        </div>

        <div className="spss-modal-footer">
          <button className="spss-btn spss-btn-primary" onClick={handleRun}>OK</button>
          <button className="spss-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};
