import React, { useState } from 'react';
import { VariableMeta, VariableType } from '../types/spss';
import { Sliders, X } from 'lucide-react';

interface VariableTypeModalProps {
  variable: VariableMeta;
  onClose: () => void;
  onSave: (updated: Partial<VariableMeta>) => void;
}

export const VariableTypeModal: React.FC<VariableTypeModalProps> = ({
  variable,
  onClose,
  onSave,
}) => {
  const [selectedType, setSelectedType] = useState<VariableType>(variable.type);
  const [width, setWidth] = useState<number>(variable.width || 8);
  const [decimals, setDecimals] = useState<number>(variable.decimals !== undefined ? variable.decimals : 2);
  const [dateFormat, setDateFormat] = useState<string>('dd-mmm-yyyy');

  const handleSave = () => {
    onSave({
      type: selectedType,
      width: Math.max(1, width),
      decimals: selectedType === 'String' ? 0 : Math.max(0, decimals),
    });
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
            <Sliders size={16} className="text-accent" />
            <span style={{ fontWeight: 600, fontSize: 13 }}>Variable Type: {variable.name}</span>
          </div>
          <button className="spss-modal-close" onClick={onClose} title="Close">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Left: Type list radio options */}
            <div
              style={{
                border: '1px solid var(--border-header)',
                borderRadius: 4,
                padding: 10,
                background: 'var(--bg-surface)',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, color: 'var(--text-main)' }}>
                Type:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="varType"
                    checked={selectedType === 'Numeric'}
                    onChange={() => setSelectedType('Numeric')}
                  />
                  Numeric
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="varType"
                    checked={selectedType === 'Dollar'}
                    onChange={() => setSelectedType('Dollar')}
                  />
                  Dollar
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="varType"
                    checked={selectedType === 'Date'}
                    onChange={() => setSelectedType('Date')}
                  />
                  Date
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="varType"
                    checked={selectedType === 'String'}
                    onChange={() => setSelectedType('String')}
                  />
                  String
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="varType"
                    checked={selectedType === 'Currency'}
                    onChange={() => setSelectedType('Currency')}
                  />
                  Custom Currency
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="varType"
                    checked={selectedType === 'Percentage'}
                    onChange={() => setSelectedType('Percentage')}
                  />
                  Percentage
                </label>
              </div>
            </div>

            {/* Right: Width and Decimals / Date format */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
                  Width:
                </label>
                <input
                  type="number"
                  min={1}
                  max={255}
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
                  value={width}
                  onChange={(e) => setWidth(parseInt(e.target.value) || 8)}
                />
              </div>

              {selectedType !== 'String' && selectedType !== 'Date' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
                    Decimal Places:
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
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
                    value={decimals}
                    onChange={(e) => setDecimals(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                </div>
              )}

              {selectedType === 'Date' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
                    Date Format:
                  </label>
                  <select
                    className="spss-dialog-input"
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      fontSize: 12,
                      border: '1px solid var(--border-header)',
                      borderRadius: 4,
                      background: 'var(--bg-surface)',
                      color: 'var(--text-main)',
                    }}
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                  >
                    <option value="dd-mmm-yyyy">dd-mmm-yyyy (e.g. 05-Oct-2026)</option>
                    <option value="mm/dd/yyyy">mm/dd/yyyy (e.g. 10/05/2026)</option>
                    <option value="yyyy-mm-dd">yyyy-mm-dd (e.g. 2026-10-05)</option>
                    <option value="dd.mm.yyyy">dd.mm.yyyy (e.g. 05.10.2026)</option>
                  </select>
                </div>
              )}

              <div
                style={{
                  marginTop: 'auto',
                  padding: 8,
                  background: 'var(--bg-header)',
                  borderRadius: 4,
                  fontSize: 11,
                  color: 'var(--text-muted)',
                }}
              >
                In SPSS, Numeric supports up to 40 characters width and 16 decimals.
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
