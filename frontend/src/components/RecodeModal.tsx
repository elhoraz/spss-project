import React, { useState } from 'react';
import { VariableMeta, OutputItem } from '../types/spss';
import { RefreshCw, ArrowRight, ArrowLeft, X, Plus, Trash2, Edit3 } from 'lucide-react';

export interface RecodeRule {
  id: string;
  oldType: 'value' | 'sysmis' | 'range' | 'range_lowest' | 'range_highest' | 'else';
  oldVal?: string;
  rangeLow?: string;
  rangeHigh?: string;
  newType: 'value' | 'sysmis' | 'copy';
  newVal?: string;
  display: string;
}

interface RecodeModalProps {
  mode: 'different' | 'same';
  variables: VariableMeta[];
  rows: Record<string, any>[];
  onClose: () => void;
  onApply: (newVariables: VariableMeta[], newRows: Record<string, any>[], syntaxText: string) => void;
  onPasteSyntax?: (syntaxText: string) => void;
}

export const RecodeModal: React.FC<RecodeModalProps> = ({
  mode,
  variables,
  rows,
  onClose,
  onApply,
  onPasteSyntax,
}) => {
  // Main dialog state
  const [selectedSourceVar, setSelectedSourceVar] = useState<string | null>(null);
  const [selectedTargetVar, setSelectedTargetVar] = useState<string | null>(null);
  const [targetVars, setTargetVars] = useState<string[]>([]);

  // Output variable specification (for 'different' mode)
  const [outputVarMap, setOutputVarMap] = useState<Record<string, { name: string; label: string }>>({});
  const [outputNameInput, setOutputNameInput] = useState<string>('');
  const [outputLabelInput, setOutputLabelInput] = useState<string>('');

  // Sub-dialog state
  const [showOldNewDialog, setShowOldNewDialog] = useState<boolean>(false);
  const [rules, setRules] = useState<RecodeRule[]>([]);

  // Sub-dialog form state
  const [oldType, setOldType] = useState<RecodeRule['oldType']>('value');
  const [oldValInput, setOldValInput] = useState<string>('');
  const [rangeLowInput, setRangeLowInput] = useState<string>('');
  const [rangeHighInput, setRangeHighInput] = useState<string>('');

  const [newType, setNewType] = useState<RecodeRule['newType']>('value');
  const [newValInput, setNewValInput] = useState<string>('');
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  const isDifferent = mode === 'different';

  // Move variable into target
  const handleAddVariable = () => {
    if (selectedSourceVar && !targetVars.includes(selectedSourceVar)) {
      setTargetVars([...targetVars, selectedSourceVar]);
      if (isDifferent && !outputVarMap[selectedSourceVar]) {
        setOutputVarMap((prev) => ({
          ...prev,
          [selectedSourceVar]: { name: `${selectedSourceVar}_rec`, label: `Recoded ${selectedSourceVar}` },
        }));
        setOutputNameInput(`${selectedSourceVar}_rec`);
        setOutputLabelInput(`Recoded ${selectedSourceVar}`);
      }
      setSelectedTargetVar(selectedSourceVar);
    }
  };

  const handleRemoveVariable = () => {
    if (selectedTargetVar) {
      setTargetVars(targetVars.filter((v) => v !== selectedTargetVar));
      setSelectedTargetVar(null);
    }
  };

  // Change Output Variable name/label
  const handleChangeOutputVar = () => {
    if (selectedTargetVar && outputNameInput.trim()) {
      const cleanName = outputNameInput.trim().replace(/\s+/g, '_');
      setOutputVarMap((prev) => ({
        ...prev,
        [selectedTargetVar]: { name: cleanName, label: outputLabelInput.trim() },
      }));
    }
  };

  // Build rule display string
  const createRuleDisplay = (
    oType: RecodeRule['oldType'],
    oVal: string,
    rLow: string,
    rHigh: string,
    nType: RecodeRule['newType'],
    nVal: string
  ): string => {
    let oldStr = '';
    if (oType === 'value') oldStr = oVal || 'EMPTY';
    else if (oType === 'sysmis') oldStr = 'SYSMIS';
    else if (oType === 'range') oldStr = `${rLow} THRU ${rHigh}`;
    else if (oType === 'range_lowest') oldStr = `LOWEST THRU ${rLow}`;
    else if (oType === 'range_highest') oldStr = `${rHigh} THRU HIGHEST`;
    else if (oType === 'else') oldStr = 'ELSE';

    let newStr = '';
    if (nType === 'value') newStr = nVal;
    else if (nType === 'sysmis') newStr = 'SYSMIS';
    else if (nType === 'copy') newStr = 'COPY';

    return `${oldStr} --> ${newStr}`;
  };

  const handleAddRule = () => {
    const display = createRuleDisplay(
      oldType,
      oldValInput,
      rangeLowInput,
      rangeHighInput,
      newType,
      newValInput
    );
    const newRule: RecodeRule = {
      id: String(Date.now() + Math.random()),
      oldType,
      oldVal: oldValInput,
      rangeLow: rangeLowInput,
      rangeHigh: rangeHighInput,
      newType,
      newVal: newValInput,
      display,
    };
    setRules([...rules, newRule]);
    // Clear inputs
    setOldValInput('');
    setNewValInput('');
  };

  const handleRemoveRule = () => {
    if (selectedRuleId) {
      setRules(rules.filter((r) => r.id !== selectedRuleId));
      setSelectedRuleId(null);
    }
  };

  // Execute Recoding
  const handleExecute = () => {
    if (targetVars.length === 0 || rules.length === 0) return;

    const updatedRows = [...rows.map((r) => ({ ...r }))];
    const newVars = [...variables];

    targetVars.forEach((sourceVarName) => {
      const targetVarName = isDifferent ? outputVarMap[sourceVarName]?.name || `${sourceVarName}_rec` : sourceVarName;
      const targetVarLabel = isDifferent ? outputVarMap[sourceVarName]?.label || `Recoded ${sourceVarName}` : '';

      // If Different, add new variable metadata if not exists
      if (isDifferent) {
        const exists = newVars.find((v) => v.name === targetVarName);
        if (!exists) {
          const sourceMeta = variables.find((v) => v.name === sourceVarName);
          newVars.push({
            name: targetVarName,
            type: sourceMeta?.type || 'Numeric',
            width: sourceMeta?.width || 8,
            decimals: sourceMeta?.decimals || 2,
            label: targetVarLabel,
            values: {},
            missing: 'None',
            columns: 8,
            align: sourceMeta?.align || 'Right',
            measure: sourceMeta?.measure || 'Scale',
            role: 'Input',
          });
        }
      }

      // Apply rules per case
      updatedRows.forEach((row) => {
        const currentVal = row[sourceVarName];
        let newVal: any = currentVal;
        let matched = false;

        for (const rule of rules) {
          let isMatch = false;

          if (rule.oldType === 'value') {
            if (String(currentVal) === String(rule.oldVal) || (typeof currentVal === 'number' && currentVal === parseFloat(rule.oldVal || '0'))) {
              isMatch = true;
            }
          } else if (rule.oldType === 'sysmis') {
            if (currentVal === null || currentVal === undefined || currentVal === '') {
              isMatch = true;
            }
          } else if (rule.oldType === 'range') {
            const num = parseFloat(currentVal);
            const low = parseFloat(rule.rangeLow || '0');
            const high = parseFloat(rule.rangeHigh || '0');
            if (!isNaN(num) && num >= low && num <= high) isMatch = true;
          } else if (rule.oldType === 'range_lowest') {
            const num = parseFloat(currentVal);
            const low = parseFloat(rule.rangeLow || '0');
            if (!isNaN(num) && num <= low) isMatch = true;
          } else if (rule.oldType === 'range_highest') {
            const num = parseFloat(currentVal);
            const high = parseFloat(rule.rangeHigh || '0');
            if (!isNaN(num) && num >= high) isMatch = true;
          } else if (rule.oldType === 'else') {
            isMatch = true;
          }

          if (isMatch) {
            matched = true;
            if (rule.newType === 'value') {
              const parsedNum = parseFloat(rule.newVal || '');
              newVal = !isNaN(parsedNum) && isFinite(parsedNum) ? parsedNum : rule.newVal;
            } else if (rule.newType === 'sysmis') {
              newVal = null;
            } else if (rule.newType === 'copy') {
              newVal = currentVal;
            }
            break;
          }
        }

        row[targetVarName] = newVal;
      });
    });

    // Build SPSS Syntax
    const rulesSyntax = rules
      .map((r) => {
        let o = '';
        if (r.oldType === 'value') o = r.oldVal || '';
        else if (r.oldType === 'sysmis') o = 'SYSMIS';
        else if (r.oldType === 'range') o = `${r.rangeLow} THRU ${r.rangeHigh}`;
        else if (r.oldType === 'range_lowest') o = `LOWEST THRU ${r.rangeLow}`;
        else if (r.oldType === 'range_highest') o = `${r.rangeHigh} THRU HIGHEST`;
        else if (r.oldType === 'else') o = 'ELSE';

        let n = r.newType === 'value' ? r.newVal : r.newType === 'sysmis' ? 'SYSMIS' : 'COPY';
        return `(${o} = ${n})`;
      })
      .join(' ');

    let syntax = isDifferent
      ? `RECODE ${targetVars.join(' ')} ${rulesSyntax} INTO ${targetVars.map((v) => outputVarMap[v]?.name || `${v}_rec`).join(' ')}.\nEXECUTE.`
      : `RECODE ${targetVars.join(' ')} ${rulesSyntax}.\nEXECUTE.`;

    onApply(newVars, updatedRows, syntax);
    onClose();
  };

  return (
    <div className="spss-modal-backdrop" onClick={onClose}>
      <div
        className="spss-modal-content"
        style={{ width: 620, maxWidth: '95vw', padding: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="spss-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={16} className="text-accent" />
            <span style={{ fontWeight: 600, fontSize: 13 }}>
              {isDifferent ? 'Recode into Different Variables' : 'Recode into Same Variables'}
            </span>
          </div>
          <button className="spss-modal-close" onClick={onClose} title="Close">
            <X size={15} />
          </button>
        </div>

        {/* Main Body */}
        <div style={{ padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '180px 48px 1fr', gap: 10, alignItems: 'center' }}>
            {/* 1. Source Variables List */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' }}>
                Variables:
              </label>
              <div
                style={{
                  height: 220,
                  border: '1px solid var(--border-header)',
                  borderRadius: 4,
                  overflowY: 'auto',
                  background: 'var(--bg-surface)',
                  padding: 4,
                }}
              >
                {variables.map((v) => (
                  <div
                    key={v.name}
                    className={`spss-var-item ${selectedSourceVar === v.name ? 'selected' : ''}`}
                    style={{
                      padding: '4px 6px',
                      fontSize: 12,
                      cursor: 'pointer',
                      borderRadius: 3,
                      background: selectedSourceVar === v.name ? 'var(--accent-light)' : 'transparent',
                      color: selectedSourceVar === v.name ? 'var(--accent)' : 'var(--text-main)',
                      fontWeight: selectedSourceVar === v.name ? 600 : 400,
                    }}
                    onClick={() => setSelectedSourceVar(v.name)}
                  >
                    {v.name} {v.label ? `(${v.label})` : ''}
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Middle Arrow Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <button
                type="button"
                className="spss-dialog-btn"
                style={{ width: 34, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={handleAddVariable}
                title="Add variable"
              >
                <ArrowRight size={14} />
              </button>
              <button
                type="button"
                className="spss-dialog-btn"
                style={{ width: 34, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={handleRemoveVariable}
                title="Remove variable"
              >
                <ArrowLeft size={14} />
              </button>
            </div>

            {/* 3. Target Variables & Output Name specification */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' }}>
                {isDifferent ? 'Numeric Variable -> Output Variable:' : 'Variables to Recode:'}
              </label>
              <div
                style={{
                  height: 110,
                  border: '1px solid var(--border-header)',
                  borderRadius: 4,
                  overflowY: 'auto',
                  background: 'var(--bg-surface)',
                  padding: 4,
                  marginBottom: 10,
                }}
              >
                {targetVars.map((v) => {
                  const outName = isDifferent ? outputVarMap[v]?.name || '?' : '';
                  return (
                    <div
                      key={v}
                      style={{
                        padding: '4px 6px',
                        fontSize: 12,
                        cursor: 'pointer',
                        borderRadius: 3,
                        background: selectedTargetVar === v ? 'var(--accent-light)' : 'transparent',
                        color: selectedTargetVar === v ? 'var(--accent)' : 'var(--text-main)',
                        fontWeight: selectedTargetVar === v ? 600 : 400,
                      }}
                      onClick={() => {
                        setSelectedTargetVar(v);
                        if (isDifferent && outputVarMap[v]) {
                          setOutputNameInput(outputVarMap[v].name);
                          setOutputLabelInput(outputVarMap[v].label);
                        }
                      }}
                    >
                      {isDifferent ? `${v} --> ${outName}` : v}
                    </div>
                  );
                })}
              </div>

              {/* Output Variable Box (Different mode only) */}
              {isDifferent && (
                <div
                  style={{
                    padding: 8,
                    background: 'var(--bg-header)',
                    borderRadius: 4,
                    border: '1px solid var(--border-cell)',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Output Variable</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6 }}>
                    <div>
                      <label style={{ fontSize: 10, display: 'block' }}>Name:</label>
                      <input
                        type="text"
                        style={{
                          width: '100%',
                          padding: '4px 6px',
                          fontSize: 11,
                          border: '1px solid var(--border-header)',
                          borderRadius: 3,
                          background: 'var(--bg-surface)',
                        }}
                        value={outputNameInput}
                        onChange={(e) => setOutputNameInput(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, display: 'block' }}>Label:</label>
                      <input
                        type="text"
                        style={{
                          width: '100%',
                          padding: '4px 6px',
                          fontSize: 11,
                          border: '1px solid var(--border-header)',
                          borderRadius: 3,
                          background: 'var(--bg-surface)',
                        }}
                        value={outputLabelInput}
                        onChange={(e) => setOutputLabelInput(e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button
                        type="button"
                        className="spss-dialog-btn"
                        style={{ fontSize: 11, padding: '4px 8px' }}
                        onClick={handleChangeOutputVar}
                      >
                        Change
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rules Summary & Old and New Values Trigger */}
          <div
            style={{
              marginTop: 14,
              padding: 10,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-cell)',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: 12 }}>
              <span style={{ fontWeight: 600 }}>Active Rules: </span>
              {rules.length > 0 ? (
                <span style={{ color: 'var(--accent)', fontWeight: 500 }}>
                  {rules.length} rule(s) defined ({rules.map((r) => r.display).join('; ')})
                </span>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>None defined yet</span>
              )}
            </div>

            <button
              type="button"
              className="spss-dialog-btn primary"
              style={{ fontSize: 12, padding: '6px 14px' }}
              onClick={() => setShowOldNewDialog(true)}
            >
              Old and New Values...
            </button>
          </div>

          {/* Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
            <button
              type="button"
              className="spss-dialog-btn"
              style={{ padding: '6px 14px', fontSize: 12 }}
              onClick={onClose}
            >
              Cancel
            </button>
            {onPasteSyntax && (
              <button
                type="button"
                className="spss-dialog-btn"
                style={{ padding: '6px 14px', fontSize: 12 }}
                onClick={() => {
                  const rulesSyntax = rules.map((r) => `(${r.display.replace('-->', '=')})`).join(' ');
                  const syn = isDifferent
                    ? `RECODE ${targetVars.join(' ')} ${rulesSyntax} INTO ${targetVars.map((v) => outputVarMap[v]?.name || `${v}_rec`).join(' ')}.\nEXECUTE.`
                    : `RECODE ${targetVars.join(' ')} ${rulesSyntax}.\nEXECUTE.`;
                  onPasteSyntax(syn);
                  onClose();
                }}
              >
                Paste
              </button>
            )}
            <button
              type="button"
              className="spss-dialog-btn"
              style={{ padding: '6px 14px', fontSize: 12 }}
              onClick={() => {
                setTargetVars([]);
                setRules([]);
                setOutputVarMap({});
              }}
            >
              Reset
            </button>
            <button
              type="button"
              className="spss-dialog-btn primary"
              style={{ padding: '6px 18px', fontSize: 12, fontWeight: 600 }}
              disabled={targetVars.length === 0 || rules.length === 0}
              onClick={handleExecute}
            >
              OK
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SUB-DIALOG: Old and New Values                           */}
        {/* ======================================================== */}
        {showOldNewDialog && (
          <div className="spss-modal-backdrop" style={{ zIndex: 10000 }}>
            <div
              className="spss-modal-content"
              style={{ width: 560, maxWidth: '95vw', padding: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="spss-modal-header">
                <span style={{ fontWeight: 600, fontSize: 13 }}>Old and New Values</span>
                <button className="spss-modal-close" onClick={() => setShowOldNewDialog(false)}>
                  <X size={15} />
                </button>
              </div>

              <div style={{ padding: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {/* Left: Old Value */}
                  <div
                    style={{
                      border: '1px solid var(--border-header)',
                      borderRadius: 4,
                      padding: 10,
                      background: 'var(--bg-surface)',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 8 }}>Old Value</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="radio"
                          name="old_type"
                          checked={oldType === 'value'}
                          onChange={() => setOldType('value')}
                        />
                        Value:
                        <input
                          type="text"
                          disabled={oldType !== 'value'}
                          style={{ width: 70, padding: '2px 4px', fontSize: 11 }}
                          value={oldValInput}
                          onChange={(e) => setOldValInput(e.target.value)}
                        />
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="radio"
                          name="old_type"
                          checked={oldType === 'sysmis'}
                          onChange={() => setOldType('sysmis')}
                        />
                        System-missing
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="radio"
                          name="old_type"
                          checked={oldType === 'range'}
                          onChange={() => setOldType('range')}
                        />
                        Range:
                        <input
                          type="text"
                          disabled={oldType !== 'range'}
                          placeholder="from"
                          style={{ width: 50, padding: '2px 4px', fontSize: 11 }}
                          value={rangeLowInput}
                          onChange={(e) => setRangeLowInput(e.target.value)}
                        />
                        thru
                        <input
                          type="text"
                          disabled={oldType !== 'range'}
                          placeholder="to"
                          style={{ width: 50, padding: '2px 4px', fontSize: 11 }}
                          value={rangeHighInput}
                          onChange={(e) => setRangeHighInput(e.target.value)}
                        />
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="radio"
                          name="old_type"
                          checked={oldType === 'range_lowest'}
                          onChange={() => setOldType('range_lowest')}
                        />
                        Range, LOWEST thru:
                        <input
                          type="text"
                          disabled={oldType !== 'range_lowest'}
                          style={{ width: 50, padding: '2px 4px', fontSize: 11 }}
                          value={rangeLowInput}
                          onChange={(e) => setRangeLowInput(e.target.value)}
                        />
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="radio"
                          name="old_type"
                          checked={oldType === 'range_highest'}
                          onChange={() => setOldType('range_highest')}
                        />
                        Range,
                        <input
                          type="text"
                          disabled={oldType !== 'range_highest'}
                          style={{ width: 50, padding: '2px 4px', fontSize: 11 }}
                          value={rangeHighInput}
                          onChange={(e) => setRangeHighInput(e.target.value)}
                        />
                        thru HIGHEST
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="radio"
                          name="old_type"
                          checked={oldType === 'else'}
                          onChange={() => setOldType('else')}
                        />
                        All other values (ELSE)
                      </label>
                    </div>
                  </div>

                  {/* Right: New Value */}
                  <div
                    style={{
                      border: '1px solid var(--border-header)',
                      borderRadius: 4,
                      padding: 10,
                      background: 'var(--bg-surface)',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 8 }}>New Value</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="radio"
                          name="new_type"
                          checked={newType === 'value'}
                          onChange={() => setNewType('value')}
                        />
                        Value:
                        <input
                          type="text"
                          disabled={newType !== 'value'}
                          style={{ width: 80, padding: '3px 6px', fontSize: 11 }}
                          value={newValInput}
                          onChange={(e) => setNewValInput(e.target.value)}
                        />
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="radio"
                          name="new_type"
                          checked={newType === 'sysmis'}
                          onChange={() => setNewType('sysmis')}
                        />
                        System-missing
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="radio"
                          name="new_type"
                          checked={newType === 'copy'}
                          onChange={() => setNewType('copy')}
                        />
                        Copy old value(s)
                      </label>
                    </div>

                    <div style={{ marginTop: 24, textAlign: 'center' }}>
                      <button
                        type="button"
                        className="spss-dialog-btn primary"
                        style={{ width: '100%', padding: '6px 12px', fontSize: 11, fontWeight: 600 }}
                        onClick={handleAddRule}
                      >
                        Add Rule
                      </button>
                    </div>
                  </div>
                </div>

                {/* Old -> New List Box */}
                <div style={{ marginTop: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Old --&gt; New:
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div
                      style={{
                        flex: 1,
                        height: 100,
                        border: '1px solid var(--border-header)',
                        borderRadius: 4,
                        background: 'var(--bg-surface)',
                        overflowY: 'auto',
                        padding: 4,
                      }}
                    >
                      {rules.map((r) => (
                        <div
                          key={r.id}
                          style={{
                            padding: '3px 6px',
                            fontSize: 11,
                            cursor: 'pointer',
                            borderRadius: 3,
                            background: selectedRuleId === r.id ? 'var(--accent-light)' : 'transparent',
                            color: selectedRuleId === r.id ? 'var(--accent)' : 'var(--text-main)',
                            fontWeight: selectedRuleId === r.id ? 600 : 400,
                          }}
                          onClick={() => setSelectedRuleId(r.id)}
                        >
                          {r.display}
                        </div>
                      ))}
                    </div>
                    <div>
                      <button
                        type="button"
                        className="spss-dialog-btn"
                        style={{ padding: '6px 10px', fontSize: 11, color: 'var(--danger)', width: 80 }}
                        disabled={!selectedRuleId}
                        onClick={handleRemoveRule}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub-dialog Footer */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                  <button
                    type="button"
                    className="spss-dialog-btn primary"
                    style={{ padding: '6px 18px', fontSize: 12, fontWeight: 600 }}
                    onClick={() => setShowOldNewDialog(false)}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
