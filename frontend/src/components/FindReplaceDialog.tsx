import React, { useState } from 'react';
import { VariableMeta } from '../types/spss';
import { Search, Replace, X, Check } from 'lucide-react';

interface FindReplaceDialogProps {
  variables: VariableMeta[];
  rows: Record<string, any>[];
  activeColIdx: number;
  activeRowIdx: number;
  onClose: () => void;
  onNavigateToMatch: (rowIdx: number, colIdx: number) => void;
  onReplaceCell: (rowIdx: number, varName: string, newValue: any) => void;
  onBulkUpdateRows?: (updatedRows: Record<string, any>[]) => void;
}

export const FindReplaceDialog: React.FC<FindReplaceDialogProps> = ({
  variables,
  rows,
  activeColIdx,
  activeRowIdx,
  onClose,
  onNavigateToMatch,
  onReplaceCell,
  onBulkUpdateRows,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [replaceTerm, setReplaceTerm] = useState<string>('');
  const [scope, setScope] = useState<'current_var' | 'entire_data'>('current_var');
  const [matchCase, setMatchCase] = useState<boolean>(false);
  const [matchEntireCell, setMatchEntireCell] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [lastMatch, setLastMatch] = useState<{ row: number; col: number } | null>(null);

  const activeVar = variables[activeColIdx] || variables[0];

  const checkMatch = (val: any, target: string): boolean => {
    if (val === undefined || val === null) return false;
    let sVal = String(val);
    let sTarget = target;
    if (!matchCase) {
      sVal = sVal.toLowerCase();
      sTarget = sTarget.toLowerCase();
    }
    return matchEntireCell ? sVal === sTarget : sVal.includes(sTarget);
  };

  const handleFindNext = () => {
    if (!searchTerm.trim()) return;

    const startR = lastMatch ? (lastMatch.col === (scope === 'current_var' ? activeColIdx : variables.length - 1) ? lastMatch.row + 1 : lastMatch.row) : activeRowIdx;
    const startC = lastMatch ? (scope === 'current_var' ? activeColIdx : lastMatch.col + 1) : (scope === 'current_var' ? activeColIdx : 0);

    const checkCols = scope === 'current_var' && activeVar ? [activeColIdx] : variables.map((_, i) => i);

    // Search forward from current position
    for (let r = 0; r < rows.length; r++) {
      const actualR = (startR + r) % rows.length;
      for (const c of checkCols) {
        if (r === 0 && actualR === startR && c < startC) continue;
        const vMeta = variables[c];
        if (!vMeta) continue;
        const val = rows[actualR]?.[vMeta.name];
        if (checkMatch(val, searchTerm)) {
          setLastMatch({ row: actualR, col: c });
          onNavigateToMatch(actualR, c);
          setStatusMessage(`Found at Case ${actualR + 1}, Variable ${vMeta.name}`);
          return;
        }
      }
    }

    setStatusMessage('No matches found.');
  };

  const handleReplace = () => {
    if (!lastMatch) {
      handleFindNext();
      return;
    }
    const vMeta = variables[lastMatch.col];
    if (vMeta) {
      let finalVal: any = replaceTerm;
      if (vMeta.type === 'Numeric' || vMeta.type === 'Dollar') {
        const num = parseFloat(replaceTerm);
        finalVal = !isNaN(num) ? num : replaceTerm;
      }
      onReplaceCell(lastMatch.row, vMeta.name, finalVal);
      setStatusMessage(`Replaced at Case ${lastMatch.row + 1}, Variable ${vMeta.name}`);
      handleFindNext();
    }
  };

  const handleReplaceAll = () => {
    if (!searchTerm.trim()) return;
    const checkCols = scope === 'current_var' && activeVar ? [activeVar.name] : variables.map((v) => v.name);
    let count = 0;

    const updated = rows.map((row) => {
      const copy = { ...row };
      checkCols.forEach((varName) => {
        const val = copy[varName];
        if (checkMatch(val, searchTerm)) {
          count++;
          const vMeta = variables.find((v) => v.name === varName);
          let newVal: any = replaceTerm;
          if (vMeta && (vMeta.type === 'Numeric' || vMeta.type === 'Dollar')) {
            const num = parseFloat(replaceTerm);
            newVal = !isNaN(num) ? num : replaceTerm;
          }
          copy[varName] = newVal;
        }
      });
      return copy;
    });

    if (onBulkUpdateRows) {
      onBulkUpdateRows(updated);
    } else {
      updated.forEach((r, idx) => {
        checkCols.forEach((vName) => {
          if (r[vName] !== rows[idx]?.[vName]) {
            onReplaceCell(idx, vName, r[vName]);
          }
        });
      });
    }

    setStatusMessage(`Completed! Replaced ${count} occurrences.`);
  };

  return (
    <div className="spss-modal-backdrop" onClick={onClose}>
      <div
        className="spss-modal-content"
        style={{ width: 440, maxWidth: '95vw', padding: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="spss-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={16} className="text-accent" />
            <span style={{ fontWeight: 600, fontSize: 13 }}>Find and Replace</span>
          </div>
          <button className="spss-modal-close" onClick={onClose} title="Close">
            <X size={15} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: 16 }}>
          {/* Find field */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 4, fontWeight: 500 }}>
              Find what:
            </label>
            <input
              type="text"
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Text or number to find..."
            />
          </div>

          {/* Replace field */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 4, fontWeight: 500 }}>
              Replace with:
            </label>
            <input
              type="text"
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
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              placeholder="Replacement value..."
            />
          </div>

          {/* Options */}
          <div
            style={{
              padding: 10,
              background: 'var(--bg-header)',
              borderRadius: 4,
              border: '1px solid var(--border-cell)',
              marginBottom: 14,
              fontSize: 12,
            }}
          >
            <div style={{ marginBottom: 8, fontWeight: 600, color: 'var(--text-main)' }}>
              Search In:
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="find_scope"
                  checked={scope === 'current_var'}
                  onChange={() => setScope('current_var')}
                />
                Current Variable ({activeVar?.name || 'VAR'})
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="find_scope"
                  checked={scope === 'entire_data'}
                  onChange={() => setScope('entire_data')}
                />
                Entire Dataset
              </label>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={matchCase}
                  onChange={(e) => setMatchCase(e.target.checked)}
                />
                Match case
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={matchEntireCell}
                  onChange={(e) => setMatchEntireCell(e.target.checked)}
                />
                Match entire cell
              </label>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              style={{
                fontSize: 12,
                color: statusMessage.includes('No matches') ? 'var(--danger)' : 'var(--accent)',
                marginBottom: 12,
                fontWeight: 500,
              }}
            >
              {statusMessage}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              type="button"
              className="spss-dialog-btn"
              style={{
                padding: '6px 12px',
                fontSize: 12,
                borderRadius: 4,
                cursor: 'pointer',
                border: '1px solid var(--border-header)',
                background: 'var(--bg-header)',
                color: 'var(--text-main)',
              }}
              onClick={onClose}
            >
              Close
            </button>
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
                fontWeight: 600,
              }}
              onClick={handleFindNext}
            >
              Find Next
            </button>
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
                fontWeight: 600,
              }}
              onClick={handleReplace}
            >
              Replace
            </button>
            <button
              type="button"
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
              onClick={handleReplaceAll}
            >
              Replace All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
