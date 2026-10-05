import React, { useState } from 'react';
import { X, Upload, CheckCircle2, Database } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Dataset, VariableMeta } from '../types/spss';
import { employeeDataset, clinicalTrialDataset } from '../data/defaultDatasets';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetLoaded: (dataset: Dataset) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  onDatasetLoaded,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewData, setPreviewData] = useState<{ name: string; vars: VariableMeta[]; rows: any[] } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    setErrorMsg(null);
    const reader = new FileReader();

    if (file.name.endsWith('.json')) {
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          if (Array.isArray(json) && json.length > 0) {
            setupPreview(file.name, json);
          } else {
            setErrorMsg('Invalid JSON structure: Expected an array of objects.');
          }
        } catch (_err: any) {
          setErrorMsg('Failed to parse JSON file.');
        }
      };
      reader.readAsText(file);
    } else {
      // Excel, CSV, TSV
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheetName];
          const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, any>[];

          if (rows.length > 0) {
            setupPreview(file.name, rows);
          } else {
            setErrorMsg('File has no data rows.');
          }
        } catch (err: any) {
          setErrorMsg('Failed to parse spreadsheet: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const setupPreview = (filename: string, rawRows: Record<string, any>[]) => {
    const keys = Object.keys(rawRows[0] || {});
    const keyMap: Record<string, string> = {};

    const vars: VariableMeta[] = keys.map((k, kIdx) => {
      // Check if numeric
      const numericCount = rawRows.filter((r) => {
        const v = parseFloat(r[k]);
        return !isNaN(v) && isFinite(v);
      }).length;

      const isNumeric = numericCount > rawRows.length * 0.5;
      const cleanName = k.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '') || `VAR0000${kIdx + 1}`.slice(-8);
      keyMap[k] = cleanName;

      return {
        name: cleanName,
        type: isNumeric ? 'Numeric' : 'String',
        width: 8,
        decimals: isNumeric ? 2 : 0,
        label: k,
        values: {},
        missing: 'None',
        columns: 8,
        align: isNumeric ? 'Right' : 'Left',
        measure: isNumeric ? 'Scale' : 'Nominal',
        role: 'Input',
      };
    });

    const normalizedRows = rawRows.map((r, idx) => {
      const newRow: Record<string, any> = { id: idx + 1 };
      for (const [origKey, cleanKey] of Object.entries(keyMap)) {
        const val = r[origKey];
        if (val !== undefined && val !== null && val !== '') {
          const num = parseFloat(val);
          newRow[cleanKey] = !isNaN(num) && isFinite(num) && typeof val !== 'boolean' ? num : val;
        } else {
          newRow[cleanKey] = null;
        }
      }
      return newRow;
    });

    setPreviewData({
      name: filename,
      vars,
      rows: normalizedRows,
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (!previewData) return;
    onDatasetLoaded({
      name: previewData.name,
      variables: previewData.vars,
      rows: previewData.rows,
    });
    onClose();
  };

  return (
    <div className="spss-modal-overlay">
      <div className="spss-modal-dialog" style={{ width: 620 }}>
        {/* Header */}
        <div className="spss-modal-header">
          <span className="spss-modal-title">Open / Import Data Document</span>
          <button className="spss-modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="spss-modal-body" style={{ flexDirection: 'column', gap: 16 }}>
          {/* Quick Sample Selector */}
          <div style={{ background: 'var(--bg-menu)', padding: 12, borderRadius: 6, border: '1px solid var(--border-app)' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
              LOAD STANDARD SPSS SAMPLE DATASET:
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="spss-btn spss-btn-primary"
                onClick={() => {
                  onDatasetLoaded(employeeDataset);
                  onClose();
                }}
              >
                <Database size={13} /> Employee data.sav (40 cases)
              </button>
              <button
                className="spss-btn"
                onClick={() => {
                  onDatasetLoaded(clinicalTrialDataset);
                  onClose();
                }}
              >
                <Database size={13} /> Clinical Trial.sav (15 cases)
              </button>
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragActive ? 'var(--accent)' : 'var(--border-app)'}`,
              borderRadius: 6,
              padding: 24,
              textAlign: 'center',
              background: dragActive ? 'var(--accent-light)' : 'var(--bg-window)',
              transition: 'all 0.15s ease',
              cursor: 'pointer',
            }}
            onClick={() => document.getElementById('spss-file-input')?.click()}
          >
            <Upload size={32} style={{ color: 'var(--accent)', margin: '0 auto 8px', opacity: 0.8 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
              Drag & Drop data file here, or click to browse
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Supports CSV, Excel (.xlsx, .xls), TSV, and JSON formats
            </div>
            <input
              id="spss-file-input"
              type="file"
              accept=".csv,.xlsx,.xls,.tsv,.json"
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
          </div>

          {errorMsg && (
            <div style={{ color: 'var(--danger)', fontSize: 12, padding: 8, background: '#fee2e2', borderRadius: 4 }}>
              {errorMsg}
            </div>
          )}

          {/* Data Preview */}
          {previewData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>
                <CheckCircle2 size={16} /> Ready to import "{previewData.name}" ({previewData.rows.length} rows, {previewData.vars.length} variables)
              </div>
              <div style={{ maxHeight: 140, overflowY: 'auto', border: '1px solid var(--border-app)', borderRadius: 4 }}>
                <table className="spss-grid-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      {previewData.vars.map((v) => (
                        <th key={v.name} className="spss-grid-th">
                          {v.name} ({v.type})
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.rows.slice(0, 4).map((r, i) => (
                      <tr key={i}>
                        {previewData.vars.map((v) => (
                          <td key={v.name} className="spss-grid-td">
                            {String(r[v.label] ?? r[v.name] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 16px', background: 'var(--bg-header)', display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid var(--border-app)' }}>
          <button className="spss-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="spss-btn spss-btn-primary"
            onClick={handleConfirmImport}
            disabled={!previewData}
          >
            Import Data
          </button>
        </div>
      </div>
    </div>
  );
};
