import React, { useState } from 'react';
import { VariableMeta } from '../types/spss';
import { HelpCircle, X } from 'lucide-react';

interface MissingValuesModalProps {
  variable: VariableMeta;
  onClose: () => void;
  onSave: (missingDef: string) => void;
}

export const MissingValuesModal: React.FC<MissingValuesModalProps> = ({
  variable,
  onClose,
  onSave,
}) => {
  const [option, setOption] = useState<'none' | 'discrete' | 'range'>(() => {
    if (!variable.missing || variable.missing === 'None') return 'none';
    if (variable.missing.includes('THRU') || variable.missing.includes('thru')) return 'range';
    return 'discrete';
  });

  const [discrete1, setDiscrete1] = useState<string>(() => {
    if (!variable.missing || variable.missing === 'None') return '';
    const parts = variable.missing.split(',').map((s) => s.trim());
    return parts[0] || '';
  });
  const [discrete2, setDiscrete2] = useState<string>(() => {
    if (!variable.missing || variable.missing === 'None') return '';
    const parts = variable.missing.split(',').map((s) => s.trim());
    return parts[1] || '';
  });
  const [discrete3, setDiscrete3] = useState<string>(() => {
    if (!variable.missing || variable.missing === 'None') return '';
    const parts = variable.missing.split(',').map((s) => s.trim());
    return parts[2] || '';
  });

  const [rangeLow, setRangeLow] = useState<string>('90');
  const [rangeHigh, setRangeHigh] = useState<string>('99');
  const [rangeDiscrete, setRangeDiscrete] = useState<string>('999');

  const handleSave = () => {
    if (option === 'none') {
      onSave('None');
    } else if (option === 'discrete') {
      const vals = [discrete1.trim(), discrete2.trim(), discrete3.trim()].filter(Boolean);
      onSave(vals.length > 0 ? vals.join(', ') : 'None');
    } else {
      let def = `${rangeLow} THRU ${rangeHigh}`;
      if (rangeDiscrete.trim()) {
        def += `, ${rangeDiscrete.trim()}`;
      }
      onSave(def);
    }
    onClose();
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
            <HelpCircle size={16} className="text-accent" />
            <span style={{ fontWeight: 600, fontSize: 13 }}>Missing Values: {variable.name}</span>
          </div>
          <button className="spss-modal-close" onClick={onClose} title="Close">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Option 1: None */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
              <input
                type="radio"
                name="missing_type"
                checked={option === 'none'}
                onChange={() => setOption('none')}
              />
              No missing values
            </label>

            {/* Option 2: Discrete missing values */}
            <div
              style={{
                border: '1px solid var(--border-header)',
                borderRadius: 4,
                padding: 10,
                background: option === 'discrete' ? 'var(--bg-surface)' : 'var(--bg-header)',
                opacity: option === 'discrete' ? 1 : 0.8,
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 8,
                }}
              >
                <input
                  type="radio"
                  name="missing_type"
                  checked={option === 'discrete'}
                  onChange={() => setOption('discrete')}
                />
                Discrete missing values:
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, paddingLeft: 22 }}>
                <input
                  type="text"
                  placeholder="e.g. 99"
                  disabled={option !== 'discrete'}
                  className="spss-dialog-input"
                  style={{
                    padding: '5px 8px',
                    fontSize: 12,
                    border: '1px solid var(--border-header)',
                    borderRadius: 4,
                    background: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                  }}
                  value={discrete1}
                  onChange={(e) => setDiscrete1(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="e.g. 999"
                  disabled={option !== 'discrete'}
                  className="spss-dialog-input"
                  style={{
                    padding: '5px 8px',
                    fontSize: 12,
                    border: '1px solid var(--border-header)',
                    borderRadius: 4,
                    background: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                  }}
                  value={discrete2}
                  onChange={(e) => setDiscrete2(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="e.g. -1"
                  disabled={option !== 'discrete'}
                  className="spss-dialog-input"
                  style={{
                    padding: '5px 8px',
                    fontSize: 12,
                    border: '1px solid var(--border-header)',
                    borderRadius: 4,
                    background: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                  }}
                  value={discrete3}
                  onChange={(e) => setDiscrete3(e.target.value)}
                />
              </div>
            </div>

            {/* Option 3: Range plus optional discrete */}
            <div
              style={{
                border: '1px solid var(--border-header)',
                borderRadius: 4,
                padding: 10,
                background: option === 'range' ? 'var(--bg-surface)' : 'var(--bg-header)',
                opacity: option === 'range' ? 1 : 0.8,
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 8,
                }}
              >
                <input
                  type="radio"
                  name="missing_type"
                  checked={option === 'range'}
                  onChange={() => setOption('range')}
                />
                Range plus one optional discrete missing value:
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 12, width: 40 }}>Low:</label>
                  <input
                    type="text"
                    disabled={option !== 'range'}
                    style={{
                      width: 80,
                      padding: '5px 8px',
                      fontSize: 12,
                      border: '1px solid var(--border-header)',
                      borderRadius: 4,
                      background: 'var(--bg-surface)',
                      color: 'var(--text-main)',
                    }}
                    value={rangeLow}
                    onChange={(e) => setRangeLow(e.target.value)}
                  />
                  <label style={{ fontSize: 12, width: 40, marginLeft: 8 }}>High:</label>
                  <input
                    type="text"
                    disabled={option !== 'range'}
                    style={{
                      width: 80,
                      padding: '5px 8px',
                      fontSize: 12,
                      border: '1px solid var(--border-header)',
                      borderRadius: 4,
                      background: 'var(--bg-surface)',
                      color: 'var(--text-main)',
                    }}
                    value={rangeHigh}
                    onChange={(e) => setRangeHigh(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 12, width: 90 }}>Discrete value:</label>
                  <input
                    type="text"
                    disabled={option !== 'range'}
                    style={{
                      width: 80,
                      padding: '5px 8px',
                      fontSize: 12,
                      border: '1px solid var(--border-header)',
                      borderRadius: 4,
                      background: 'var(--bg-surface)',
                      color: 'var(--text-main)',
                    }}
                    value={rangeDiscrete}
                    onChange={(e) => setRangeDiscrete(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
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
              onClick={handleSave}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
