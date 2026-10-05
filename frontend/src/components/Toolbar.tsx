import {
  FolderOpen,
  Save,
  Printer,
  Undo2,
  Redo2,
  Table,
  Sliders,
  Plus,
  Play,
  Layers,
  FileCode,
  Tag,
  Sun,
  Moon,
  Database,
  BarChart2,
  Filter,
  FilePlus,
} from 'lucide-react';
import { AnalysisModalType, ActiveView, AppTheme } from '../types/spss';

interface ToolbarProps {
  onOpenModal: (modal: AnalysisModalType) => void;
  activeView: ActiveView;
  onSetActiveView: (view: ActiveView) => void;
  showValueLabels: boolean;
  onToggleValueLabels: () => void;
  theme: AppTheme;
  onToggleTheme: () => void;
  datasetName: string;
  onSelectSampleDataset: (name: string) => void;
  onExport: (format: 'pdf' | 'xlsx' | 'csv' | 'sav' | 'word') => void;
  onNewData: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onOpenModal,
  activeView,
  onSetActiveView,
  showValueLabels,
  onToggleValueLabels,
  theme,
  onToggleTheme,
  datasetName,
  onSelectSampleDataset,
  onExport,
  onNewData,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  return (
    <div className="spss-toolbar">
      <div className="spss-toolbar-group">
        {/* New Data */}
        <button
          className="spss-toolbar-btn"
          title="New Dataset Document (Ctrl+N)"
          onClick={onNewData}
        >
          <FilePlus size={16} />
        </button>

        {/* Open Data */}
        <button
          className="spss-toolbar-btn"
          title="Open Data Document (Ctrl+O)"
          onClick={() => onOpenModal('import_data')}
        >
          <FolderOpen size={16} />
        </button>

        {/* Save */}
        <button
          className="spss-toolbar-btn"
          title="Save As Excel / Project (Ctrl+S)"
          onClick={() => onExport('xlsx')}
        >
          <Save size={16} />
        </button>

        {/* Print / Export PDF */}
        <button
          className="spss-toolbar-btn"
          title="Export / Print Output Report (Ctrl+P)"
          onClick={() => onExport('pdf')}
        >
          <Printer size={16} />
        </button>

        <div className="spss-toolbar-separator" />

        {/* Undo / Redo */}
        <button
          className={`spss-toolbar-btn ${!canUndo ? 'disabled' : ''}`}
          title="Undo (Ctrl+Z)"
          disabled={!canUndo}
          onClick={onUndo}
        >
          <Undo2 size={16} />
        </button>
        <button
          className={`spss-toolbar-btn ${!canRedo ? 'disabled' : ''}`}
          title="Redo (Ctrl+Y)"
          disabled={!canRedo}
          onClick={onRedo}
        >
          <Redo2 size={16} />
        </button>

        <div className="spss-toolbar-separator" />

        {/* Data View Toggle */}
        <button
          className={`spss-toolbar-btn ${activeView === 'data' ? 'active' : ''}`}
          title="Data View (Spreadsheet)"
          onClick={() => onSetActiveView('data')}
        >
          <Table size={16} />
        </button>

        {/* Variable View Toggle */}
        <button
          className={`spss-toolbar-btn ${activeView === 'variable' ? 'active' : ''}`}
          title="Variable View (Metadata)"
          onClick={() => onSetActiveView('variable')}
        >
          <Sliders size={16} />
        </button>

        {/* Output Viewer Toggle */}
        <button
          className={`spss-toolbar-btn ${activeView === 'output' ? 'active' : ''}`}
          title="Output Viewer (Statistics & Charts)"
          onClick={() => onSetActiveView('output')}
        >
          <Layers size={16} />
        </button>

        {/* Syntax Editor Toggle */}
        <button
          className={`spss-toolbar-btn ${activeView === 'syntax' ? 'active' : ''}`}
          title="Syntax Editor (SPSS Command Scripts)"
          onClick={() => onSetActiveView('syntax')}
        >
          <FileCode size={16} />
        </button>

        <div className="spss-toolbar-separator" />

        {/* Value Labels Toggle */}
        <button
          className={`spss-toolbar-btn ${showValueLabels ? 'active' : ''}`}
          title="Toggle Value Labels (1 ↔ Male)"
          onClick={onToggleValueLabels}
        >
          <Tag size={16} />
        </button>

        {/* Quick Frequencies */}
        <button
          className="spss-toolbar-btn"
          title="Frequencies Analysis Dialog"
          onClick={() => onOpenModal('frequencies')}
        >
          <BarChart2 size={16} />
        </button>

        {/* Quick Descriptives */}
        <button
          className="spss-toolbar-btn"
          title="Descriptives Analysis Dialog"
          onClick={() => onOpenModal('descriptives')}
        >
          <Sliders size={16} />
        </button>

        {/* Split File */}
        <button
          className="spss-toolbar-btn"
          title="Split File..."
          onClick={() => onOpenModal('split_file')}
        >
          <Layers size={16} />
        </button>

        {/* Select Cases */}
        <button
          className="spss-toolbar-btn"
          title="Select Cases (Filter)..."
          onClick={() => onOpenModal('select_cases')}
        >
          <Filter size={16} />
        </button>

        {/* Weight Cases */}
        <button
          className="spss-toolbar-btn"
          title="Weight Cases..."
          onClick={() => onOpenModal('weight_cases')}
        >
          <Tag size={16} />
        </button>

        {/* Chart Builder */}
        <button
          className="spss-toolbar-btn"
          title="Chart Builder"
          onClick={() => onOpenModal('chart_builder')}
        >
          <BarChart2 size={16} color="#059669" />
        </button>
      </div>

      {/* Right controls: Sample Dataset switch & Theme */}
      <div className="spss-toolbar-group">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
          <Database size={13} />
          <span>Dataset:</span>
          <select
            value={datasetName}
            onChange={(e) => onSelectSampleDataset(e.target.value)}
            style={{
              fontSize: 11,
              padding: '2px 6px',
              borderRadius: 3,
              border: '1px solid var(--border-app)',
              background: 'var(--bg-surface)',
              color: 'var(--text-main)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="Employee data.sav">Employee data.sav (40 cases, 9 vars)</option>
            <option value="Clinical Trial.sav">Clinical Trial.sav (15 cases, 6 vars)</option>
          </select>
        </div>

        <div className="spss-toolbar-separator" />

        {/* Theme Toggle */}
        <button
          className="spss-toolbar-btn"
          title={`Switch Theme (Current: ${theme})`}
          onClick={onToggleTheme}
        >
          {theme === 'academic-dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </div>
  );
};
