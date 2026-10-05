import React, { useState } from 'react';
import { VariableMeta, OutputItem } from '../types/spss';

interface ReplaceMissingModalProps {
  isOpen: boolean;
  variables: VariableMeta[];
  rows: Record<string, any>[];
  onClose: () => void;
  onApply: (newRows: Record<string, any>[], newVar: VariableMeta, output: OutputItem) => void;
}

export const ReplaceMissingModal: React.FC<ReplaceMissingModalProps> = ({
  isOpen,
  variables,
  rows,
  onClose,
  onApply,
}) => {
  const [sourceVar, setSourceVar] = useState<string>(variables[0]?.name || '');
  const [targetVarName, setTargetVarName] = useState<string>('');
  const [method, setMethod] = useState<'smean' | 'nearby_mean' | 'nearby_median' | 'linear'>('smean');
  const [span, setSpan] = useState<number>(2);

  if (!isOpen) return null;

  const handleRun = () => {
    const cleanTarget = targetVarName.trim().replace(/\s+/g, '_');
    if (!cleanTarget) {
      alert('Please specify a target variable name for the imputed series.');
      return;
    }
    if (!sourceVar) {
      alert('Please select a variable.');
      return;
    }

    // Extract valid numeric values
    const vals = rows.map((r) => {
      const raw = r[sourceVar];
      if (raw === undefined || raw === null || String(raw).trim() === '') return NaN;
      const v = parseFloat(raw);
      return isNaN(v) ? NaN : v;
    });

    const validVals = vals.filter((v) => !isNaN(v));
    if (validVals.length === 0) {
      alert('No valid numeric values found in selected variable.');
      return;
    }

    const seriesMean = validVals.reduce((a, b) => a + b, 0) / validVals.length;

    // Imputation algorithm
    const imputedVals = vals.map((v, i) => {
      if (!isNaN(v)) return v;

      if (method === 'smean') {
        return Number(seriesMean.toFixed(4));
      }

      if (method === 'linear') {
        // Find previous valid and next valid
        let prevIdx = -1;
        for (let p = i - 1; p >= 0; p--) {
          if (!isNaN(vals[p])) {
            prevIdx = p;
            break;
          }
        }
        let nextIdx = -1;
        for (let n = i + 1; n < vals.length; n++) {
          if (!isNaN(vals[n])) {
            nextIdx = n;
            break;
          }
        }

        if (prevIdx !== -1 && nextIdx !== -1) {
          const slope = (vals[nextIdx] - vals[prevIdx]) / (nextIdx - prevIdx);
          const interpolated = vals[prevIdx] + slope * (i - prevIdx);
          return Number(interpolated.toFixed(4));
        }
        if (prevIdx !== -1) return vals[prevIdx];
        if (nextIdx !== -1) return vals[nextIdx];
        return Number(seriesMean.toFixed(4));
      }

      if (method === 'nearby_mean' || method === 'nearby_median') {
        const start = Math.max(0, i - span);
        const end = Math.min(vals.length - 1, i + span);
        const nearby: number[] = [];
        for (let k = start; k <= end; k++) {
          if (k !== i && !isNaN(vals[k])) {
            nearby.push(vals[k]);
          }
        }

        if (nearby.length === 0) return Number(seriesMean.toFixed(4));

        if (method === 'nearby_mean') {
          const m = nearby.reduce((a, b) => a + b, 0) / nearby.length;
          return Number(m.toFixed(4));
        } else {
          nearby.sort((a, b) => a - b);
          const med =
            nearby.length % 2 === 0
              ? (nearby[nearby.length / 2 - 1] + nearby[nearby.length / 2]) / 2
              : nearby[Math.floor(nearby.length / 2)];
          return Number(med.toFixed(4));
        }
      }

      return Number(seriesMean.toFixed(4));
    });

    const replacedCount = vals.filter((v) => isNaN(v)).length;

    // Build new rows
    const newRows = rows.map((r, i) => ({
      ...r,
      [cleanTarget]: imputedVals[i],
    }));

    // Target meta
    const sourceMeta = variables.find((v) => v.name === sourceVar);
    const newVarMeta: VariableMeta = {
      name: cleanTarget,
      type: 'Numeric',
      width: sourceMeta?.width || 8,
      decimals: sourceMeta?.decimals || 2,
      label: `Imputed (${method.toUpperCase()}) of ${sourceVar}`,
      values: {},
      missing: 'None',
      columns: 8,
      align: 'Right',
      measure: 'Scale',
      role: 'Input',
    };

    const methodNames: Record<string, string> = {
      smean: 'Series Mean',
      nearby_mean: `Mean of ${span} Nearby Points`,
      nearby_median: `Median of ${span} Nearby Points`,
      linear: 'Linear Interpolation',
    };

    const output: OutputItem = {
      id: `rmv_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      title: 'Replace Missing Values',
      type: 'compute_variable',
      syntax: `RMV /${cleanTarget}=${method.toUpperCase()}(${sourceVar}${method.startsWith('nearby') ? `, ${span}` : ''}).`,
      data: {
        title: 'Replace Missing Values Summary',
        source_variable: sourceVar,
        target_variable: cleanTarget,
        method: methodNames[method],
        cases_replaced: replacedCount,
        valid_cases: validVals.length,
        series_mean: Number(seriesMean.toFixed(4)),
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
          <span>Replace Missing Values</span>
          <button className="spss-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="spss-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Variable Selection */}
          <div>
            <label className="spss-picker-label">Variable with Missing Values:</label>
            <select
              className="spss-text-input"
              value={sourceVar}
              onChange={(e) => {
                setSourceVar(e.target.value);
                if (!targetVarName) {
                  setTargetVarName(`${e.target.value}_1`);
                }
              }}
            >
              {variables.map((v) => (
                <option key={v.name} value={v.name}>{v.name} ({v.type})</option>
              ))}
            </select>
          </div>

          {/* Target Variable Name */}
          <div>
            <label className="spss-picker-label">New Target Variable Name:</label>
            <input
              type="text"
              className="spss-text-input"
              placeholder="e.g. salary_1"
              value={targetVarName}
              onChange={(e) => setTargetVarName(e.target.value)}
            />
          </div>

          {/* Imputation Method */}
          <fieldset style={{ border: '1px solid var(--border-app)', borderRadius: 4, padding: '10px 14px' }}>
            <legend style={{ fontSize: 11, fontWeight: 600, padding: '0 4px', color: 'var(--text-main)' }}>
              Imputation Method
            </legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="rmvMethod"
                  checked={method === 'smean'}
                  onChange={() => setMethod('smean')}
                />
                <strong>Series mean</strong> (Mean of all valid values)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="rmvMethod"
                  checked={method === 'linear'}
                  onChange={() => setMethod('linear')}
                />
                <strong>Linear interpolation</strong> (Connect surrounding values)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="rmvMethod"
                  checked={method === 'nearby_mean'}
                  onChange={() => setMethod('nearby_mean')}
                />
                <strong>Mean of nearby points</strong>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="rmvMethod"
                  checked={method === 'nearby_median'}
                  onChange={() => setMethod('nearby_median')}
                />
                <strong>Median of nearby points</strong>
              </label>
            </div>

            {(method === 'nearby_mean' || method === 'nearby_median') && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 500 }}>Span (points above and below):</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  className="spss-text-input"
                  style={{ width: 60 }}
                  value={span}
                  onChange={(e) => setSpan(parseInt(e.target.value) || 2)}
                />
              </div>
            )}
          </fieldset>
        </div>

        <div className="spss-modal-footer">
          <button className="spss-btn spss-btn-primary" onClick={handleRun}>OK</button>
          <button className="spss-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};
