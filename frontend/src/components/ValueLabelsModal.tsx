import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { VariableMeta } from '../types/spss';

interface ValueLabelsModalProps {
  variable: VariableMeta;
  onSave: (values: Record<string, string>) => void;
  onClose: () => void;
}

export const ValueLabelsModal: React.FC<ValueLabelsModalProps> = ({ variable, onSave, onClose }) => {
  const [valMap, setValMap] = useState<Record<string, string>>({ ...(variable.values || {}) });
  const [valueInput, setValueInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const handleAddOrChange = () => {
    if (!valueInput.trim()) return;
    setValMap((prev) => ({
      ...prev,
      [valueInput.trim()]: labelInput.trim(),
    }));
    setValueInput('');
    setLabelInput('');
    setSelectedKey(null);
  };

  const handleRemove = () => {
    if (!selectedKey) return;
    setValMap((prev) => {
      const copy = { ...prev };
      delete copy[selectedKey];
      return copy;
    });
    setValueInput('');
    setLabelInput('');
    setSelectedKey(null);
  };

  const handleSelectKey = (k: string) => {
    setSelectedKey(k);
    setValueInput(k);
    setLabelInput(valMap[k]);
  };

  const handleApply = () => {
    onSave(valMap);
    onClose();
  };

  return (
    <div className="spss-modal-overlay">
      <div className="spss-modal-dialog" style={{ width: 480 }}>
        {/* Header */}
        <div className="spss-modal-header">
          <span className="spss-modal-title">Value Labels: {variable.name}</span>
          <button className="spss-modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="spss-modal-body" style={{ flexDirection: 'column', gap: 12 }}>
          {/* Inputs Row */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ width: 60, fontSize: 12, fontWeight: 600 }}>Value:</label>
              <input
                className="spss-text-input"
                style={{ width: 120 }}
                placeholder="e.g. 1 or m"
                value={valueInput}
                onChange={(e) => setValueInput(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ width: 60, fontSize: 12, fontWeight: 600 }}>Label:</label>
              <input
                className="spss-text-input"
                style={{ flex: 1 }}
                placeholder="e.g. Male or High"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddOrChange();
                }}
              />
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start', marginLeft: 72 }}>
            <button className="spss-btn spss-btn-primary" onClick={handleAddOrChange} disabled={!valueInput.trim()}>
              <Plus size={13} /> {selectedKey ? 'Change' : 'Add'}
            </button>
            <button className="spss-btn" onClick={handleRemove} disabled={!selectedKey}>
              <Trash2 size={13} /> Remove
            </button>
          </div>

          {/* Mappings List Box */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
            <label className="spss-picker-label">Defined Value Labels:</label>
            <div className="spss-var-listbox" style={{ height: 160 }}>
              {Object.keys(valMap).length === 0 ? (
                <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 11, fontStyle: 'italic', textAlign: 'center' }}>
                  No value labels defined. Enter Value and Label above and click Add.
                </div>
              ) : (
                Object.keys(valMap).map((k) => (
                  <div
                    key={k}
                    className={`spss-var-list-item ${selectedKey === k ? 'selected' : ''}`}
                    onClick={() => handleSelectKey(k)}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--accent)', minWidth: 40 }}>{k}</span>
                    <span>=</span>
                    <span>"{valMap[k]}"</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 16px', background: 'var(--bg-header)', display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid var(--border-app)' }}>
          <button className="spss-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="spss-btn spss-btn-primary" onClick={handleApply}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
