import React, { useState } from 'react';
import { PlusCircle, X } from 'lucide-react';

interface InsertCasesDialogProps {
  currentCaseNumber: number;
  totalRows: number;
  isOpen: boolean;
  onClose: () => void;
  onInsert: (count: number, position: 'before' | 'after' | 'end', targetIndex: number) => void;
}

export const InsertCasesDialog: React.FC<InsertCasesDialogProps> = ({
  currentCaseNumber,
  totalRows,
  isOpen,
  onClose,
  onInsert,
}) => {
  const [count, setCount] = useState<number>(1);
  const [position, setPosition] = useState<'before' | 'after' | 'end'>('after');
  const [targetCase, setTargetCase] = useState<number>(Math.max(1, currentCaseNumber));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validatedCount = Math.max(1, Math.min(10000, count));
    const validatedTargetIdx = Math.max(0, targetCase - 1);
    onInsert(validatedCount, position, validatedTargetIdx);
    onClose();
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
            <PlusCircle size={16} style={{ color: 'var(--accent)' }} />
            <span style={{ fontWeight: 600, fontSize: 13 }}>Insert Cases</span>
          </div>
          <button className="spss-modal-close" onClick={onClose} title="Close">
            <X size={15} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>
              Number of cases to insert:
            </label>
            <input
              type="number"
              min={1}
              max={10000}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value, 10) || 1)}
              style={{
                width: '100%',
                padding: '6px 10px',
                fontSize: 13,
                border: '1px solid var(--border-app)',
                borderRadius: 4,
                background: 'var(--bg-surface)',
                color: 'var(--text-main)',
                outline: 'none',
              }}
              autoFocus
            />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Enter how many new blank cases/rows to add (e.g. 1, 10, 50, 100)
            </span>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
              Insert location:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="position"
                  checked={position === 'before'}
                  onChange={() => setPosition('before')}
                />
                <span>Before Case:</span>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, totalRows)}
                  value={targetCase}
                  disabled={position !== 'before'}
                  onChange={(e) => setTargetCase(parseInt(e.target.value, 10) || 1)}
                  style={{
                    width: 70,
                    padding: '2px 6px',
                    fontSize: 12,
                    border: '1px solid var(--border-app)',
                    borderRadius: 3,
                    background: position === 'before' ? 'var(--bg-surface)' : 'var(--bg-window)',
                    color: 'var(--text-main)',
                  }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="position"
                  checked={position === 'after'}
                  onChange={() => setPosition('after')}
                />
                <span>After Case:</span>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, totalRows)}
                  value={targetCase}
                  disabled={position !== 'after'}
                  onChange={(e) => setTargetCase(parseInt(e.target.value, 10) || 1)}
                  style={{
                    width: 70,
                    padding: '2px 6px',
                    fontSize: 12,
                    border: '1px solid var(--border-app)',
                    borderRadius: 3,
                    background: position === 'after' ? 'var(--bg-surface)' : 'var(--bg-window)',
                    color: 'var(--text-main)',
                  }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="position"
                  checked={position === 'end'}
                  onChange={() => setPosition('end')}
                />
                <span>At the end of dataset (Row {totalRows + 1})</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              paddingTop: 12,
              borderTop: '1px solid var(--border-app)',
            }}
          >
            <button type="button" className="spss-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="spss-btn spss-btn-primary">
              Insert Cases
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
