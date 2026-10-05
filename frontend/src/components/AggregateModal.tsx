import React, { useState } from 'react';
import { VariableMeta, OutputItem, Dataset } from '../types/spss';

interface AggregateModalProps {
  isOpen: boolean;
  variables: VariableMeta[];
  rows: Record<string, any>[];
  onClose: () => void;
  onApplyNewDataset: (newDataset: Dataset, output: OutputItem) => void;
  onApplyToCurrent: (newVariables: VariableMeta[], newRows: Record<string, any>[], output: OutputItem) => void;
  onPasteSyntax?: (syntax: string) => void;
}

type AggFunction = 'MEAN' | 'SUM' | 'N' | 'MIN' | 'MAX' | 'SD';

interface AggItem {
  sourceVar: string;
  targetName: string;
  func: AggFunction;
  label: string;
}

export const AggregateModal: React.FC<AggregateModalProps> = ({
  isOpen,
  variables,
  rows,
  onClose,
  onApplyNewDataset,
  onApplyToCurrent,
  onPasteSyntax,
}) => {
  const [breakVar, setBreakVar] = useState<string>(variables[0]?.name || '');
  const [selectedSourceVar, setSelectedSourceVar] = useState<string>(variables[1]?.name || variables[0]?.name || '');
  const [aggList, setAggList] = useState<AggItem[]>([
    {
      sourceVar: variables[1]?.name || variables[0]?.name || 'VAR00001',
      targetName: `${(variables[1]?.name || variables[0]?.name || 'VAR').toLowerCase()}_mean`,
      func: 'MEAN',
      label: `Mean of ${variables[1]?.name || variables[0]?.name || 'VAR'}`,
    },
  ]);
  const [destType, setDestType] = useState<'new_dataset' | 'active_dataset'>('new_dataset');
  const [newDatasetName, setNewDatasetName] = useState<string>('Aggregated_Data.sav');
  const [showHelp, setShowHelp] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleAddAggVar = () => {
    if (!selectedSourceVar) return;
    const exists = aggList.some((a) => a.sourceVar === selectedSourceVar);
    const newTarget = `${selectedSourceVar.toLowerCase()}_mean`;
    if (exists) {
      alert(`Variable ${selectedSourceVar} is already in the aggregation list.`);
      return;
    }
    setAggList((prev) => [
      ...prev,
      {
        sourceVar: selectedSourceVar,
        targetName: newTarget,
        func: 'MEAN',
        label: `Mean of ${selectedSourceVar}`,
      },
    ]);
  };

  const handleRemoveAggVar = (idx: number) => {
    setAggList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateItem = (idx: number, patch: Partial<AggItem>) => {
    setAggList((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  };

  const handleReset = () => {
    setBreakVar(variables[0]?.name || '');
    setSelectedSourceVar(variables[1]?.name || variables[0]?.name || '');
    setAggList([
      {
        sourceVar: variables[1]?.name || variables[0]?.name || 'VAR00001',
        targetName: `${(variables[1]?.name || variables[0]?.name || 'VAR').toLowerCase()}_mean`,
        func: 'MEAN',
        label: `Mean of ${variables[1]?.name || variables[0]?.name || 'VAR'}`,
      },
    ]);
    setDestType('new_dataset');
  };

  const generateSyntax = () => {
    const aggClauses = aggList.map((a) => `/${a.targetName}=${a.func}(${a.sourceVar})`).join('\n  ');
    const outClause = destType === 'new_dataset' ? `OUTFILE='${newDatasetName}'` : `OUTFILE=* MODE=ADDVARIABLES`;
    return `AGGREGATE\n  /${outClause}\n  /BREAK=${breakVar}\n  ${aggClauses}.`;
  };

  const handleRun = () => {
    if (!breakVar) {
      alert('Please select a Break Variable.');
      return;
    }
    if (aggList.length === 0) {
      alert('Please specify at least one Aggregated Variable.');
      return;
    }

    // 1. Group rows by break variable
    const groups: Record<string, Record<string, any>[]> = {};
    rows.forEach((r) => {
      const bVal = r[breakVar] !== undefined && r[breakVar] !== null ? String(r[breakVar]) : '(Missing)';
      if (!groups[bVal]) groups[bVal] = [];
      groups[bVal].push(r);
    });

    // 2. Compute aggregated metrics per group
    const summaryPerGroup: Record<string, Record<string, number>> = {};
    Object.entries(groups).forEach(([bVal, grpRows]) => {
      const metrics: Record<string, number> = {};
      aggList.forEach((agg) => {
        const vals = grpRows.map((r) => parseFloat(r[agg.sourceVar])).filter((v) => !isNaN(v) && isFinite(v));
        const n = vals.length;
        if (n === 0) {
          metrics[agg.targetName] = 0;
          return;
        }

        switch (agg.func) {
          case 'MEAN':
            metrics[agg.targetName] = Number((vals.reduce((a, b) => a + b, 0) / n).toFixed(3));
            break;
          case 'SUM':
            metrics[agg.targetName] = Number(vals.reduce((a, b) => a + b, 0).toFixed(3));
            break;
          case 'N':
            metrics[agg.targetName] = n;
            break;
          case 'MIN':
            metrics[agg.targetName] = Math.min(...vals);
            break;
          case 'MAX':
            metrics[agg.targetName] = Math.max(...vals);
            break;
          case 'SD':
            if (n < 2) metrics[agg.targetName] = 0;
            else {
              const m = vals.reduce((a, b) => a + b, 0) / n;
              const v = vals.reduce((a, b) => a + Math.pow(b - m, 2), 0) / (n - 1);
              metrics[agg.targetName] = Number(Math.sqrt(v).toFixed(3));
            }
            break;
        }
      });
      summaryPerGroup[bVal] = metrics;
    });

    const syntax = generateSyntax();
    const outputItem: OutputItem = {
      id: `agg_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      title: 'Aggregate Data',
      type: 'compute_variable',
      syntax,
      data: {
        title: 'Aggregate Data Summary',
        break_variable: breakVar,
        total_groups: Object.keys(groups).length,
        aggregated_variables: aggList.map((a) => `${a.targetName} (${a.func} of ${a.sourceVar})`),
        message:
          destType === 'new_dataset'
            ? `Created aggregated dataset '${newDatasetName}' with ${Object.keys(groups).length} group rows.`
            : `Added ${aggList.length} aggregated variable(s) to active dataset matching break variable '${breakVar}'.`,
      },
    };

    if (destType === 'new_dataset') {
      const breakMeta = variables.find((v) => v.name === breakVar) || {
        name: breakVar,
        type: 'String' as const,
        width: 8,
        decimals: 0,
        label: breakVar,
        values: {},
        missing: 'None',
        columns: 8,
        align: 'Left' as const,
        measure: 'Nominal' as const,
        role: 'Input' as const,
      };

      const newVars: VariableMeta[] = [
        breakMeta,
        ...aggList.map((a) => ({
          name: a.targetName,
          type: 'Numeric' as const,
          width: 8,
          decimals: 2,
          label: a.label || a.targetName,
          values: {},
          missing: 'None',
          columns: 8,
          align: 'Right' as const,
          measure: 'Scale' as const,
          role: 'Target' as const,
        })),
      ];

      const newRows: Record<string, any>[] = Object.entries(summaryPerGroup).map(([bVal, metrics], idx) => {
        const rowObj: Record<string, any> = {
          id: idx + 1,
          [breakVar]: isNaN(Number(bVal)) ? bVal : Number(bVal),
        };
        aggList.forEach((a) => {
          rowObj[a.targetName] = metrics[a.targetName];
        });
        return rowObj;
      });

      onApplyNewDataset({ name: newDatasetName, variables: newVars, rows: newRows }, outputItem);
    } else {
      // Add aggregated variables to active dataset
      const newMetas: VariableMeta[] = aggList.map((a) => ({
        name: a.targetName,
        type: 'Numeric' as const,
        width: 8,
        decimals: 2,
        label: a.label || a.targetName,
        values: {},
        missing: 'None',
        columns: 8,
        align: 'Right' as const,
        measure: 'Scale' as const,
        role: 'Input' as const,
      }));

      const newRows = rows.map((r) => {
        const copy = { ...r };
        const bVal = r[breakVar] !== undefined && r[breakVar] !== null ? String(r[breakVar]) : '(Missing)';
        const metrics = summaryPerGroup[bVal] || {};
        aggList.forEach((a) => {
          copy[a.targetName] = metrics[a.targetName] ?? null;
        });
        return copy;
      });

      onApplyToCurrent(newMetas, newRows, outputItem);
    }

    onClose();
  };

  return (
    <div className="spss-dialog-overlay" onClick={onClose}>
      <div className="spss-dialog" style={{ width: 620 }} onClick={(e) => e.stopPropagation()}>
        <div className="spss-dialog-header">
          <span>Aggregate Data</span>
          <button className="spss-dialog-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="spss-dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Break Variable */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <label style={{ width: 140, fontWeight: 600, fontSize: 12 }}>Break Variable(s):</label>
            <select
              className="spss-input"
              style={{ flex: 1 }}
              value={breakVar}
              onChange={(e) => setBreakVar(e.target.value)}
            >
              {variables.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} {v.label ? `[${v.label}]` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Aggregated Variables Management */}
          <div style={{ border: '1px solid var(--border-app)', borderRadius: 4, padding: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8 }}>Aggregated Variables:</div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <select
                className="spss-input"
                style={{ flex: 1 }}
                value={selectedSourceVar}
                onChange={(e) => setSelectedSourceVar(e.target.value)}
              >
                {variables.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.type})
                  </option>
                ))}
              </select>
              <button className="spss-btn spss-btn-primary" onClick={handleAddAggVar}>
                + Add Variable
              </button>
            </div>

            <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid var(--border-app)', background: 'var(--bg-main)' }}>
              <table className="spss-grid-table" style={{ width: '100%', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-header)' }}>
                    <th style={{ padding: '4px 8px' }}>Source</th>
                    <th style={{ padding: '4px 8px' }}>Name</th>
                    <th style={{ padding: '4px 8px' }}>Function</th>
                    <th style={{ padding: '4px 8px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {aggList.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '4px 8px', fontWeight: 600 }}>{item.sourceVar}</td>
                      <td style={{ padding: '4px 8px' }}>
                        <input
                          type="text"
                          className="spss-input"
                          style={{ padding: '2px 4px', fontSize: 11, width: 110 }}
                          value={item.targetName}
                          onChange={(e) => handleUpdateItem(idx, { targetName: e.target.value })}
                        />
                      </td>
                      <td style={{ padding: '4px 8px' }}>
                        <select
                          className="spss-input"
                          style={{ padding: '2px 4px', fontSize: 11 }}
                          value={item.func}
                          onChange={(e) => handleUpdateItem(idx, { func: e.target.value as AggFunction })}
                        >
                          <option value="MEAN">Mean</option>
                          <option value="SUM">Sum</option>
                          <option value="N">Number of Cases (N)</option>
                          <option value="MIN">Minimum</option>
                          <option value="MAX">Maximum</option>
                          <option value="SD">Standard Deviation</option>
                        </select>
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <button
                          className="spss-btn spss-btn-danger"
                          style={{ padding: '2px 6px', fontSize: 10 }}
                          onClick={() => handleRemoveAggVar(idx)}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Destination */}
          <div style={{ border: '1px solid var(--border-app)', borderRadius: 4, padding: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8 }}>Save / Destination:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="dest"
                  checked={destType === 'new_dataset'}
                  onChange={() => setDestType('new_dataset')}
                />
                <span>Create a new dataset containing only the aggregated variables</span>
              </label>
              {destType === 'new_dataset' && (
                <div style={{ marginLeft: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11 }}>Dataset name:</span>
                  <input
                    type="text"
                    className="spss-input"
                    style={{ width: 220, fontSize: 11 }}
                    value={newDatasetName}
                    onChange={(e) => setNewDatasetName(e.target.value)}
                  />
                </div>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="dest"
                  checked={destType === 'active_dataset'}
                  onChange={() => setDestType('active_dataset')}
                />
                <span>Add aggregated variables to active dataset (broadcast per case)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Dialog Footer */}
        <div className="spss-dialog-footer">
          <button className="spss-btn" onClick={() => setShowHelp(true)}>
            Help
          </button>
          <button className="spss-btn" onClick={handleReset}>
            Reset
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
              <span>Help: Aggregate Data (SPSS)</span>
              <button className="spss-dialog-close" onClick={() => setShowHelp(false)}>
                ✕
              </button>
            </div>
            <div className="spss-dialog-body" style={{ fontSize: 12, lineHeight: 1.6 }}>
              <p>
                <strong>Aggregate Data</strong> menggabungkan baris data yang memiliki nilai <em>Break Variable</em> yang
                sama menjadi satu ringkasan baris teragregasi.
              </p>
              <ul style={{ paddingLeft: 18, marginTop: 8 }}>
                <li>
                  <strong>Mean:</strong> Nilai rata-rata kelompok.
                </li>
                <li>
                  <strong>Sum:</strong> Total penjumlahan nilai kelompok.
                </li>
                <li>
                  <strong>Number of Cases (N):</strong> Jumlah responden/observasi per kelompok.
                </li>
                <li>
                  <strong>Min & Max:</strong> Nilai terendah dan tertinggi dalam kelompok.
                </li>
                <li>
                  <strong>Add to active dataset:</strong> Nilai agregasi kelompok ditempelkan kembali ke setiap baris kasus aktif.
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
