import React, { useState, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Play, RotateCcw, Download, Upload, Sparkles, CheckCircle2 } from 'lucide-react';
import { OutputItem } from '../types/spss';
import { clientRunSyntax } from '../utils/clientStats';

interface SyntaxEditorProps {
  syntaxCode: string;
  onChangeSyntax: (code: string) => void;
  rows: Record<string, any>[];
  onOutputsGenerated: (newOutputs: OutputItem[]) => void;
}

export const SyntaxEditor: React.FC<SyntaxEditorProps> = ({
  syntaxCode,
  onChangeSyntax,
  rows,
  onOutputsGenerated,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const editorRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const samplePresets: Record<string, string> = {
    frequencies_and_descriptives: `* Analysis 1: Frequencies for demographic variables.\nFREQUENCIES VARIABLES=gender jobcat\n  /ORDER=ANALYSIS.\n\n* Analysis 2: Descriptive statistics for continuous variables.\nDESCRIPTIVES VARIABLES=salary salbegin educ\n  /STATISTICS=MEAN STDDEV MIN MAX.`,
    crosstabs_chisq: `* Analysis: Crosstabs of Gender by Employment Category with Chi-Square.\nCROSSTABS\n  /TABLES=gender BY jobcat\n  /STATISTICS=CHISQ\n  /CELLS=COUNT EXPECTED ROW COLUMN TOTAL.`,
    correlations_and_regression: `* Analysis 1: Bivariate Pearson correlations.\nCORRELATIONS\n  /VARIABLES=salary salbegin educ\n  /PRINT=TWOTAIL NOSIG.\n\n* Analysis 2: Multiple Linear Regression.\nREGRESSION\n  /DEPENDENT salary\n  /METHOD=ENTER salbegin educ.`,
    t_tests_and_anova: `* Analysis 1: Independent Samples T-Test by Gender.\nT-TEST GROUPS=gender('m' 'f')\n  /VARIABLES=salary.\n\n* Analysis 2: One-Way ANOVA by Employment Category.\nONEWAY salary BY jobcat\n  /STATISTICS DESCRIPTIVES\n  /POSTHOC=TUKEY.`,
    nonparametric_and_reliability: `* Analysis 1: Reliability Analysis (Cronbach's Alpha).\nRELIABILITY\n  /VARIABLES=salary salbegin educ\n  /SCALE('ALL VARIABLES') ALL\n  /MODEL=ALPHA.\n\n* Analysis 2: Mann-Whitney U Test.\nNPAR TESTS\n  /M-W= salary BY gender('m' 'f')\n  /MISSING ANALYSIS.`,
  };

  const handleSelectPreset = (presetKey: string) => {
    setSelectedPreset(presetKey);
    if (samplePresets[presetKey]) {
      onChangeSyntax(samplePresets[presetKey]);
    }
  };

  // Setup Monaco Custom SPSS Language Syntax & Autocomplete
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Register SPSS language if not already registered
    if (!monaco.languages.getLanguages().some((lang: any) => lang.id === 'spss')) {
      monaco.languages.register({ id: 'spss' });

      // Monarch Tokenizer definition for SPSS
      monaco.languages.setMonarchTokensProvider('spss', {
        keywords: [
          'FREQUENCIES',
          'DESCRIPTIVES',
          'CROSSTABS',
          'CORRELATIONS',
          'REGRESSION',
          'T-TEST',
          'ONEWAY',
          'ANOVA',
          'UNIANOVA',
          'RELIABILITY',
          'NPAR',
          'TESTS',
          'SORT',
          'CASES',
          'SPLIT',
          'FILE',
          'WEIGHT',
          'FILTER',
          'USE',
          'ALL',
          'COMPUTE',
          'EXECUTE',
          'GRAPH',
        ],
        subcommands: [
          'VARIABLES',
          'TABLES',
          'STATISTICS',
          'CELLS',
          'PRINT',
          'DEPENDENT',
          'METHOD',
          'GROUPS',
          'TESTVAL',
          'PAIRS',
          'ORDER',
          'POSTHOC',
          'DESIGN',
          'INTERCEPT',
          'CRITERIA',
          'SCALE',
          'MODEL',
          'MISSING',
          'BY',
          'WITH',
          'ENTER',
        ],
        tokenizer: {
          root: [
            // Comments starting with *
            [/^\s*\*.*$/, 'comment'],
            [/\/\*[\s\S]*?\*\//, 'comment'],

            // Subcommands starting with /
            [/\/[A-Za-z0-9_-]+/, 'keyword.subcommand'],

            // Strings
            [/'[^']*'/, 'string'],
            [/"[^"]*"/, 'string'],

            // Numbers
            [/\b\d+(\.\d+)?\b/, 'number'],

            // Identifiers / keywords
            [
              /[A-Za-z_][A-Za-z0-9_]*/,
              {
                cases: {
                  '@keywords': 'keyword',
                  '@subcommands': 'type',
                  '@default': 'identifier',
                },
              },
            ],

            // Delimiters
            [/[=,.]/, 'delimiter'],
          ],
        },
      });

      // Autocomplete Provider
      monaco.languages.registerCompletionItemProvider('spss', {
        provideCompletionItems: (model: any, position: any) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          const spssKeywords = [
            { label: 'FREQUENCIES', insertText: 'FREQUENCIES VARIABLES=${1:var1 var2}\n  /ORDER=ANALYSIS.', documentation: 'Compute frequency tables for discrete variables' },
            { label: 'DESCRIPTIVES', insertText: 'DESCRIPTIVES VARIABLES=${1:var1 var2}\n  /STATISTICS=MEAN STDDEV MIN MAX.', documentation: 'Compute continuous descriptive metrics' },
            { label: 'CROSSTABS', insertText: 'CROSSTABS\n  /TABLES=${1:row_var} BY ${2:col_var}\n  /STATISTICS=CHISQ\n  /CELLS=COUNT EXPECTED ROW COLUMN TOTAL.', documentation: 'Contingency tables and Chi-Square test' },
            { label: 'CORRELATIONS', insertText: 'CORRELATIONS\n  /VARIABLES=${1:var1 var2}\n  /PRINT=TWOTAIL NOSIG.', documentation: 'Pearson correlation matrix' },
            { label: 'REGRESSION', insertText: 'REGRESSION\n  /DEPENDENT ${1:dep_var}\n  /METHOD=ENTER ${2:indep_vars}.', documentation: 'Linear regression analysis' },
            { label: 'T-TEST', insertText: 'T-TEST GROUPS=${1:group_var}(\'${2:val1}\' \'${3:val2}\')\n  /VARIABLES=${4:test_var}.', documentation: 'Independent samples t-test' },
            { label: 'ONEWAY', insertText: 'ONEWAY ${1:dep_var} BY ${2:factor_var}\n  /STATISTICS DESCRIPTIVES\n  /POSTHOC=TUKEY.', documentation: 'One-Way Analysis of Variance' },
            { label: 'UNIANOVA', insertText: 'UNIANOVA ${1:dep_var} BY ${2:factor_a} ${3:factor_b}\n  /DESIGN=${2:factor_a} ${3:factor_b} ${2:factor_a}*${3:factor_b}.', documentation: 'Two-Way Analysis of Variance' },
            { label: 'RELIABILITY', insertText: 'RELIABILITY\n  /VARIABLES=${1:item1 item2 item3}\n  /SCALE(\'ALL VARIABLES\') ALL\n  /MODEL=ALPHA.', documentation: 'Cronbach\'s Alpha Reliability' },
            { label: 'NPAR TESTS', insertText: 'NPAR TESTS\n  /M-W= ${1:test_var} BY ${2:group_var}(\'${3:1}\' \'${4:2}\')\n  /MISSING ANALYSIS.', documentation: 'Nonparametric Mann-Whitney U test' },
          ];

          const suggestions = spssKeywords.map((item) => ({
            label: item.label,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: item.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: item.documentation,
            range,
          }));

          return { suggestions };
        },
      });
    }
  };

  const handleRunAll = () => {
    if (!syntaxCode.trim()) return;
    const generated = clientRunSyntax(syntaxCode, rows);
    if (generated.length > 0) {
      onOutputsGenerated(generated);
    }
  };

  const handleRunSelection = () => {
    if (!editorRef.current) return;
    const selection = editorRef.current.getSelection();
    let codeToRun = '';

    if (selection && !selection.isEmpty()) {
      codeToRun = editorRef.current.getModel().getValueInRange(selection);
    } else {
      const position = editorRef.current.getPosition();
      if (position) {
        codeToRun = editorRef.current.getModel().getLineContent(position.lineNumber);
      }
    }

    if (!codeToRun.trim()) {
      handleRunAll();
      return;
    }

    const generated = clientRunSyntax(codeToRun, rows);
    if (generated.length > 0) {
      onOutputsGenerated(generated);
    }
  };

  // Save Script to .sps file
  const handleSaveScript = () => {
    const blob = new Blob([syntaxCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Syntax1.sps';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Script from .sps file
  const handleOpenScript = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content !== undefined) {
        onChangeSyntax(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="spss-syntax-container">
      {/* Hidden file input for open script */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".sps,.txt"
        onChange={handleOpenScript}
      />

      {/* Syntax Toolbar */}
      <div className="spss-syntax-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button className="spss-btn spss-btn-primary" onClick={handleRunAll} title="Run Entire Syntax Script (Ctrl+R)">
            <Play size={13} fill="currentColor" /> Run All
          </button>
          <button className="spss-btn" onClick={handleRunSelection} title="Run Selected Syntax Command">
            <Play size={13} /> Run Selection
          </button>
          <button className="spss-btn" onClick={() => fileInputRef.current?.click()} title="Open .sps Syntax File">
            <Upload size={13} /> Open (.sps)
          </button>
          <button className="spss-btn" onClick={handleSaveScript} title="Save to .sps File">
            <Download size={13} /> Save (.sps)
          </button>
          <button className="spss-btn" onClick={() => onChangeSyntax('')} title="Clear Editor">
            <RotateCcw size={13} /> Clear
          </button>
        </div>

        {/* Templates Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
          <Sparkles size={13} color="var(--accent)" />
          <span>Preset Templates:</span>
          <select
            className="spss-text-input"
            style={{ width: 250, fontSize: 11 }}
            value={selectedPreset}
            onChange={(e) => handleSelectPreset(e.target.value)}
          >
            <option value="">-- Load Standard SPSS Syntax Script --</option>
            <option value="frequencies_and_descriptives">1. Frequencies & Descriptives</option>
            <option value="crosstabs_chisq">2. Crosstabs & Chi-Square</option>
            <option value="correlations_and_regression">3. Correlations & Multiple Regression</option>
            <option value="t_tests_and_anova">4. Independent T-Test & One-Way ANOVA</option>
            <option value="nonparametric_and_reliability">5. Reliability & Mann-Whitney</option>
          </select>
        </div>
      </div>

      {/* Monaco Editor Body */}
      <div className="spss-syntax-editor-body" style={{ flex: 1, minHeight: 0 }}>
        <Editor
          height="100%"
          language="spss"
          theme="vs-dark"
          value={syntaxCode}
          onChange={(val) => onChangeSyntax(val || '')}
          onMount={handleEditorDidMount}
          options={{
            fontFamily: "'Consolas', 'Courier New', monospace",
            fontSize: 13,
            lineNumbers: 'on',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            renderLineHighlight: 'all',
          }}
        />
      </div>

      {/* Bottom Status */}
      <div style={{ padding: '4px 12px', background: 'var(--bg-header)', borderTop: '1px solid var(--border-app)', fontSize: 11, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle2 size={13} color="#16a34a" />
          <span>Monaco SPSS Syntax Processor Ready</span>
        </div>
        <div>
          <span>Lines: {syntaxCode.split('\n').length} | Encoding: UTF-8</span>
        </div>
      </div>
    </div>
  );
};
