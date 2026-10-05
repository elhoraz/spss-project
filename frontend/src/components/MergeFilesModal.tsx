import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { VariableMeta, OutputItem, Dataset } from '../types/spss';
import { clinicalTrialDataset, employeeDataset } from '../data/defaultDatasets';

interface MergeFilesModalProps {
  isOpen: boolean;
  currentDataset: Dataset;
  onClose: () => void;
  onApplyMergedDataset: (newDataset: Dataset, output: OutputItem) => void;
  onPasteSyntax?: (syntax: string) => void;
}

export const MergeFilesModal: React.FC<MergeFilesModalProps> = ({
  isOpen,
  currentDataset,
  onClose,
  onApplyMergedDataset,
  onPasteSyntax,
}) => {
  const [mergeMode, setMergeMode] = useState<'add_cases' | 'add_variables'>('add_cases');
  const [secondDataset, setSecondDataset] = useState<Dataset | null>(() => {
    return currentDataset.name.includes('Clinical') ? employeeDataset : clinicalTrialDataset;
  });
  const [keyVarActive, setKeyVarActive] = useState<string>(currentDataset.variables[0]?.name || 'id');
  const [keyVarSecond, setKeyVarSecond] = useState<string>('id');
  const [fileName, setFileName] = useState<string>(
    currentDataset.name.includes('Clinical') ? 'Employee data.sav' : 'Clinical trial.sav'
  );
  const [showHelp, setShowHelp] = useState<boolean>(false);

  if (!isOpen) return null;

  // File Upload handler for second dataset
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length === 0) return;
        const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
        const newVars: VariableMeta[] = headers.map((h) => ({
          name: h,
          type: 'Numeric',
          width: 8,
          decimals: 2,
          label: h,
          values: {},
          missing: 'None',
          columns: 8,
          align: 'Right',
          measure: 'Scale',
          role: 'Input',
        }));

        const newRows = lines.slice(1).map((line, idx) => {
          const cells = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
          const rowObj: Record<string, any> = { id: idx + 1 };
          headers.forEach((h, cIdx) => {
            const val = parseFloat(cells[cIdx]);
            rowObj[h] = !isNaN(val) && isFinite(val) ? val : cells[cIdx];
          });
          return rowObj;
        });

        setSecondDataset({ name: file.name, variables: newVars, rows: newRows });
      };
      reader.readAsText(file);
    } else {
      // Excel or JSON
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const json: any[] = XLSX.utils.sheet_to_json(firstSheet);
          if (json.length > 0) {
            const keys = Object.keys(json[0]);
            const newVars: VariableMeta[] = keys.map((k) => ({
              name: k,
              type: typeof json[0][k] === 'number' ? 'Numeric' : 'String',
              width: 8,
              decimals: 2,
              label: k,
              values: {},
              missing: 'None',
              columns: 8,
              align: 'Right',
              measure: 'Scale',
              role: 'Input',
            }));
            setSecondDataset({ name: file.name, variables: newVars, rows: json });
          }
        } catch (err) {
          alert('Failed to parse uploaded dataset.');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const generateSyntax = () => {
    if (mergeMode === 'add_cases') {
      return `ADD FILES /FILE=*\n  /FILE='${fileName}'.\nEXECUTE.`;
    } else {
      return `MATCH FILES /FILE=*\n  /TABLE='${fileName}'\n  /BY ${keyVarActive}.\nEXECUTE.`;
    }
  };

  const handleRun = () => {
    if (!secondDataset || secondDataset.rows.length === 0) {
      alert('Please select or upload a second dataset to merge.');
      return;
    }

    const syntax = generateSyntax();

    if (mergeMode === 'add_cases') {
      // 1. ADD CASES (Union rows)
      const mergedVarsMap = new Map<string, VariableMeta>();
      currentDataset.variables.forEach((v) => mergedVarsMap.set(v.name, v));
      secondDataset.variables.forEach((v) => {
        if (!mergedVarsMap.has(v.name)) mergedVarsMap.set(v.name, v);
      });
      const allVars = Array.from(mergedVarsMap.values());

      let currentId = 1;
      const combinedRows = [
        ...currentDataset.rows.map((r) => ({ ...r, id: currentId++ })),
        ...secondDataset.rows.map((r) => {
          const copy: Record<string, any> = { ...r, id: currentId++ };
          allVars.forEach((v) => {
            if (copy[v.name] === undefined) copy[v.name] = null;
          });
          return copy;
        }),
      ];

      const outputItem: OutputItem = {
        id: `merge_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        title: 'Merge Files: Add Cases',
        type: 'compute_variable',
        syntax,
        data: {
          title: 'Merge Files: Add Cases',
          active_file: currentDataset.name,
          external_file: fileName,
          total_cases_result: combinedRows.length,
          cases_added: secondDataset.rows.length,
          message: `Successfully appended ${secondDataset.rows.length} cases from '${fileName}'. Total cases: ${combinedRows.length}.`,
        },
      };

      onApplyMergedDataset(
        {
          name: `${currentDataset.name.replace('.sav', '')}_merged.sav`,
          variables: allVars,
          rows: combinedRows,
        },
        outputItem
      );
    } else {
      // 2. ADD VARIABLES (Keyed Match Join)
      const secondKey = keyVarSecond || keyVarActive;
      const secondLookup = new Map<string, Record<string, any>>();
      secondDataset.rows.forEach((r) => {
        const kVal = String(r[secondKey] ?? '').trim();
        if (kVal !== '') secondLookup.set(kVal, r);
      });

      // Disallow duplicating existing names; rename if conflict
      const existingNames = new Set(currentDataset.variables.map((v) => v.name));
      const newVarsToAdd: VariableMeta[] = [];

      secondDataset.variables.forEach((v) => {
        if (v.name !== secondKey) {
          let targetName = v.name;
          if (existingNames.has(targetName)) {
            targetName = `${targetName}_2`;
          }
          newVarsToAdd.push({ ...v, name: targetName });
        }
      });

      const mergedRows = currentDataset.rows.map((r) => {
        const copy = { ...r };
        const kVal = String(r[keyVarActive] ?? '').trim();
        const matchedSecond = secondLookup.get(kVal);

        newVarsToAdd.forEach((v) => {
          const originalName = v.name.endsWith('_2') ? v.name.slice(0, -2) : v.name;
          copy[v.name] = matchedSecond ? (matchedSecond[originalName] ?? null) : null;
        });
        return copy;
      });

      const outputItem: OutputItem = {
        id: `merge_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        title: 'Merge Files: Add Variables',
        type: 'compute_variable',
        syntax,
        data: {
          title: 'Merge Files: Add Variables',
          key_variable: keyVarActive,
          variables_added: newVarsToAdd.map((v) => v.name),
          total_matched: Array.from(secondLookup.keys()).length,
          message: `Successfully matched on key '${keyVarActive}' and added ${newVarsToAdd.length} variables from '${fileName}'.`,
        },
      };

      onApplyMergedDataset(
        {
          name: `${currentDataset.name.replace('.sav', '')}_joined.sav`,
          variables: [...currentDataset.variables, ...newVarsToAdd],
          rows: mergedRows,
        },
        outputItem
      );
    }

    onClose();
  };

  return (
    <div className="spss-dialog-overlay" onClick={onClose}>
      <div className="spss-dialog" style={{ width: 620 }} onClick={(e) => e.stopPropagation()}>
        <div className="spss-dialog-header">
          <span>Merge Files (SPSS)</span>
          <button className="spss-dialog-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="spss-dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Mode Selector */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-app)', paddingBottom: 8 }}>
            <button
              className={`spss-tab-button ${mergeMode === 'add_cases' ? 'active' : ''}`}
              onClick={() => setMergeMode('add_cases')}
            >
              Add Cases (Append Rows)
            </button>
            <button
              className={`spss-tab-button ${mergeMode === 'add_variables' ? 'active' : ''}`}
              onClick={() => setMergeMode('add_variables')}
            >
              Add Variables (Match Columns via Key)
            </button>
          </div>

          {/* Dataset Selection */}
          <div style={{ border: '1px solid var(--border-app)', borderRadius: 4, padding: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8 }}>Second Dataset to Merge:</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.json,.txt"
                onChange={handleFileUpload}
                style={{ fontSize: 11, flex: 1 }}
              />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>or choose sample:</span>
              <button
                className="spss-btn"
                style={{ fontSize: 11 }}
                onClick={() => {
                  setSecondDataset(clinicalTrialDataset);
                  setFileName('Clinical trial.sav');
                }}
              >
                Clinical Trial
              </button>
              <button
                className="spss-btn"
                style={{ fontSize: 11 }}
                onClick={() => {
                  setSecondDataset(employeeDataset);
                  setFileName('Employee data.sav');
                }}
              >
                Employee Data
              </button>
            </div>

            {secondDataset && (
              <div
                style={{
                  fontSize: 11,
                  background: 'var(--bg-main)',
                  padding: '6px 10px',
                  borderRadius: 3,
                  border: '1px solid var(--border-app)',
                }}
              >
                <strong>Selected:</strong> {fileName} ({secondDataset.rows.length} cases,{' '}
                {secondDataset.variables.length} variables)
              </div>
            )}
          </div>

          {/* Add Variables Key Matching Options */}
          {mergeMode === 'add_variables' && (
            <div style={{ border: '1px solid var(--border-app)', borderRadius: 4, padding: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8 }}>Key Variable (Match / VLOOKUP by):</div>
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Active Dataset Key:
                  </label>
                  <select
                    className="spss-input"
                    style={{ width: '100%' }}
                    value={keyVarActive}
                    onChange={(e) => setKeyVarActive(e.target.value)}
                  >
                    {currentDataset.variables.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Second Dataset Key:
                  </label>
                  <select
                    className="spss-input"
                    style={{ width: '100%' }}
                    value={keyVarSecond}
                    onChange={(e) => setKeyVarSecond(e.target.value)}
                  >
                    {secondDataset?.variables.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dialog Footer */}
        <div className="spss-dialog-footer">
          <button className="spss-btn" onClick={() => setShowHelp(true)}>
            Help
          </button>
          <div style={{ flex: 1 }} />
          {onPasteSyntax && (
            <button className="spss-btn" onClick={() => onPasteSyntax(generateSyntax())}>
              Paste
            </button>
          )}
          <button className="spss-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="spss-btn spss-btn-primary" onClick={handleRun}>
            OK
          </button>
        </div>
      </div>

      {/* Help Subdialog */}
      {showHelp && (
        <div
          className="spss-dialog-overlay"
          style={{ zIndex: 1100 }}
          onClick={(e) => {
            e.stopPropagation();
            setShowHelp(false);
          }}
        >
          <div className="spss-dialog" style={{ width: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="spss-dialog-header">
              <span>Help: Merge Files</span>
              <button className="spss-dialog-close" onClick={() => setShowHelp(false)}>
                ✕
              </button>
            </div>
            <div className="spss-dialog-body" style={{ fontSize: 12, lineHeight: 1.6 }}>
              <p>
                <strong>Merge Files</strong> memungkinkan penggabungan data dari dua sumber terpisah:
              </p>
              <ul style={{ paddingLeft: 18, marginTop: 8 }}>
                <li>
                  <strong>Add Cases:</strong> Menambahkan baris kasus baru ke bawah dataset aktif (Union rows).
                </li>
                <li>
                  <strong>Add Variables:</strong> Menambahkan kolom baru ke samping dataset berdasarkan kesamaan nilai
                  pada <em>Key Variable</em> (Keyed Table Join).
                </li>
              </ul>
            </div>
            <div className="spss-dialog-footer">
              <button className="spss-btn spss-btn-primary" onClick={() => setShowHelp(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
