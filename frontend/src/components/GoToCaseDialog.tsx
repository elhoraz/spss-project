import React, { useState } from 'react';
import { VariableMeta } from '../types/spss';
import { Hash, Sliders, X } from 'lucide-react';

interface GoToCaseDialogProps {
  variables: VariableMeta[];
  totalRows: number;
  onClose: () => void;
  onGoTo: (targetRow: number, targetCol?: number) => void;
}

export const GoToCaseDialog: React.FC<GoToCaseDialogProps> = ({
  variables,
  totalRows,
  onClose,
  onGoTo,
}) => {
  const [mode, setMode] = useState<'case' | 'variable'>('case');
  const [caseInput, setCaseInput] = useState<string>('1');
  const [selectedVar, setSelectedVar] = useState<string>(variables[0]?.name || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'case') {
      const rowNum = parseInt(caseInput, 10);
      if (!isNaN(rowNum) && rowNum >= 1) {
        onGoTo(rowNum - 1);
        onClose();
      }
    } else {
      const colIdx = variables.findIndex((v) => v.name === selectedVar);
      if (colIdx !== -1) {
        onGoTo(0, colIdx);
        onClose();
      }
    }
  };

  return (
    <div className="spss-modal-backdrop" onClick={onClose}>
      <div
        className="spss-modal-content"
        style={{ width: 380, maxWidth: '95vw', padding: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="spss-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Hash size={16} className="text-accent" />
            <span style={{ fontWeight: 600, fontSize: 13 }}>Go to Case or Variable</span>
          </div>
          <button className="spss-modal-close" onClick={onClose} title="Close">
            <X size={15} />
          </button>
        </div>

        {/* Tab switch */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-cell)', background: 'var(--bg-header)' }}>
          <button
            type="button"
            className={`spss-tab-btn ${mode === 'case' ? 'active' : ''}`}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 600,
              background: mode === 'case' ? 'var(--bg-surface)' : 'transparent',
              border: 'none',
              borderBottom: mode === 'case' ? '2px solid var(--accent)' : 'none',
              cursor: 'pointer',
              color: mode === 'case' ? 'var(--accent)' : 'var(--text-muted)',
            }}
            onClick={() => setMode('case')}
          >
            Case Number
          </button>
          <button
            type="button"
            className={`spss-tab-btn ${mode === 'variable' ? 'active' : ''}`}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 600,
              background: mode === 'variable' ? 'var(--bg-surface)' : 'transparent',
              border: 'none',
              borderBottom: mode === 'variable' ? '2px solid var(--accent)' : 'none',
              cursor: 'pointer',
              color: mode === 'variable' ? 'var(--accent)' : 'var(--text-muted)',
            }}
            onClick={() => setMode('variable')}
          >
            Variable Name
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} style={{ padding: 16 }}>
          {mode === 'case' ? (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 6, fontWeight: 500 }}>
                Case number (1 to {Math.max(1, totalRows)}):
              </label>
              <input
                type="number"
                min={1}
                autoFocus
                className="spss-dialog-input"
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  fontSize: 13,
                  border: '1px solid var(--border-header)',
                  borderRadius: 4,
                  background: 'var(--bg-surface)',
                  color: 'var(--text-main)',
                }}
                value={caseInput}
                onChange={(e) => setCaseInput(e.target.value)}
              />
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 6, fontWeight: 500 }}>
                Select Variable:
              </label>
              <select
                className="spss-dialog-input"
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  fontSize: 13,
                  border: '1px solid var(--border-header)',
                  borderRadius: 4,
                  background: 'var(--bg-surface)',
                  color: 'var(--text-main)',
                }}
                value={selectedVar}
                onChange={(e) => setSelectedVar(e.target.value)}
              >
                {variables.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} {v.label ? `(${v.label})` : ''} [{v.type}, {v.measure}]
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Footer buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button
              type="button"
              className="spss-dialog-btn"
              style={{
                padding: '6px 14px',
                fontSize: 12,
                borderRadius: 4,
                cursor: 'pointer',
                border: '1px solid var(--border-header)',
                background: 'var(--bg-header)',
                color: 'var(--text-main)',
              }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="spss-dialog-btn primary"
              style={{
                padding: '6px 16px',
                fontSize: 12,
                borderRadius: 4,
                cursor: 'pointer',
                border: 'none',
                background: 'var(--accent)',
                color: '#fff',
                fontWeight: 600,
              }}
            >
              Go To
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
