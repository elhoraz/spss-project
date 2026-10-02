import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  FolderOpen,
  Save,
  Printer,
  Undo2,
  Redo2,
  Table,
  BarChart2,
  HelpCircle,
  ChevronRight,
  Database,
  Sliders,
  Layers,
  CheckSquare,
} from 'lucide-react';
import { AnalysisModalType, ActiveView } from '../types/spss';

interface TopMenuBarProps {
  onOpenModal: (modal: AnalysisModalType) => void;
  onSetActiveView: (view: ActiveView) => void;
  onExport: (format: 'pdf' | 'xlsx' | 'csv') => void;
  onResetData: () => void;
  onToggleValueLabels: () => void;
  showValueLabels: boolean;
}

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  onOpenModal,
  onSetActiveView,
  onExport,
  onResetData,
  onToggleValueLabels,
  showValueLabels,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleAction = (callback: () => void) => {
    callback();
    setOpenMenu(null);
  };

  return (
    <div className="spss-menubar" ref={menuRef}>
      {/* 1. FILE */}
      <div className="spss-menu-item">
        <button
          className={`spss-menu-button ${openMenu === 'file' ? 'active' : ''}`}
          onClick={() => handleMenuClick('file')}
        >
          File
        </button>
        {openMenu === 'file' && (
          <div className="spss-dropdown">
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('import_data'))}>
              <div className="spss-dropdown-item-left">
                <FolderOpen size={14} /> Open Data (CSV, Excel, JSON)...
              </div>
              <span className="spss-dropdown-shortcut">Ctrl+O</span>
            </div>
            <div className="spss-dropdown-item" onClick={() => handleAction(onResetData)}>
              <div className="spss-dropdown-item-left">
                <Database size={14} /> Reset to Sample Dataset
              </div>
            </div>
            <div className="spss-dropdown-divider" />
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onExport('xlsx'))}>
              <div className="spss-dropdown-item-left">
                <Save size={14} /> Save As Excel (.xlsx)...
              </div>
              <span className="spss-dropdown-shortcut">Ctrl+S</span>
            </div>
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onExport('csv'))}>
              <div className="spss-dropdown-item-left">
                <FileText size={14} /> Export to CSV...
              </div>
            </div>
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onExport('pdf'))}>
              <div className="spss-dropdown-item-left">
                <Printer size={14} /> Export Report to PDF...
              </div>
              <span className="spss-dropdown-shortcut">Ctrl+P</span>
            </div>
            <div className="spss-dropdown-divider" />
            <div className="spss-dropdown-item" onClick={() => handleAction(() => window.print())}>
              <div className="spss-dropdown-item-left">
                <Printer size={14} /> Print...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. EDIT */}
      <div className="spss-menu-item">
        <button
          className={`spss-menu-button ${openMenu === 'edit' ? 'active' : ''}`}
          onClick={() => handleMenuClick('edit')}
        >
          Edit
        </button>
        {openMenu === 'edit' && (
          <div className="spss-dropdown">
            <div className="spss-dropdown-item disabled">
              <div className="spss-dropdown-item-left">
                <Undo2 size={14} /> Undo
              </div>
              <span className="spss-dropdown-shortcut">Ctrl+Z</span>
            </div>
            <div className="spss-dropdown-item disabled">
              <div className="spss-dropdown-item-left">
                <Redo2 size={14} /> Redo
              </div>
              <span className="spss-dropdown-shortcut">Ctrl+Y</span>
            </div>
            <div className="spss-dropdown-divider" />
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onSetActiveView('variable'))}>
              <div className="spss-dropdown-item-left">
                <Sliders size={14} /> Insert Variable
              </div>
            </div>
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onSetActiveView('data'))}>
              <div className="spss-dropdown-item-left">
                <Table size={14} /> Go to Case...
              </div>
              <span className="spss-dropdown-shortcut">Ctrl+G</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. VIEW */}
      <div className="spss-menu-item">
        <button
          className={`spss-menu-button ${openMenu === 'view' ? 'active' : ''}`}
          onClick={() => handleMenuClick('view')}
        >
          View
        </button>
        {openMenu === 'view' && (
          <div className="spss-dropdown">
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onSetActiveView('data'))}>
              <div className="spss-dropdown-item-left">
                <Table size={14} /> Data View
              </div>
            </div>
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onSetActiveView('variable'))}>
              <div className="spss-dropdown-item-left">
                <Sliders size={14} /> Variable View
              </div>
            </div>
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onSetActiveView('output'))}>
              <div className="spss-dropdown-item-left">
                <Layers size={14} /> Output Viewer
              </div>
            </div>
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onSetActiveView('syntax'))}>
              <div className="spss-dropdown-item-left">
                <FileText size={14} /> Syntax Editor
              </div>
            </div>
            <div className="spss-dropdown-divider" />
            <div className="spss-dropdown-item" onClick={() => handleAction(onToggleValueLabels)}>
              <div className="spss-dropdown-item-left">
                <input type="checkbox" checked={showValueLabels} readOnly style={{ marginRight: 6 }} />
                Value Labels
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. DATA */}
      <div className="spss-menu-item">
        <button
          className={`spss-menu-button ${openMenu === 'data' ? 'active' : ''}`}
          onClick={() => handleMenuClick('data')}
        >
          Data
        </button>
        {openMenu === 'data' && (
          <div className="spss-dropdown">
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onSetActiveView('variable'))}>
              Define Variable Properties...
            </div>
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('value_labels'))}>
              Value Labels Editor...
            </div>
            <div className="spss-dropdown-divider" />
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('sort_cases'))}>
              Sort Cases...
            </div>
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('select_cases'))}>
              Select Cases (Filter)...
            </div>
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('split_file'))}>
              Split File...
            </div>
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('weight_cases'))}>
              Weight Cases...
            </div>
          </div>
        )}
      </div>

      {/* 5. TRANSFORM */}
      <div className="spss-menu-item">
        <button
          className={`spss-menu-button ${openMenu === 'transform' ? 'active' : ''}`}
          onClick={() => handleMenuClick('transform')}
        >
          Transform
        </button>
        {openMenu === 'transform' && (
          <div className="spss-dropdown">
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('descriptives'))}>
              Compute Variable...
            </div>
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('frequencies'))}>
              Recode into Same Variables...
            </div>
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('frequencies'))}>
              Recode into Different Variables...
            </div>
          </div>
        )}
      </div>

      {/* 6. ANALYZE (The Star of SPSS) */}
      <div className="spss-menu-item">
        <button
          className={`spss-menu-button ${openMenu === 'analyze' ? 'active' : ''}`}
          onClick={() => handleMenuClick('analyze')}
          style={{ fontWeight: 600 }}
        >
          Analyze
        </button>
        {openMenu === 'analyze' && (
          <div className="spss-dropdown" style={{ minWidth: 280 }}>
            {/* Descriptive Statistics Submenu */}
            <div className="spss-dropdown-item">
              <div className="spss-dropdown-item-left">
                <BarChart2 size={14} /> Descriptive Statistics
              </div>
              <ChevronRight size={14} />
              <div className="spss-submenu">
                <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('frequencies'))}>
                  Frequencies...
                </div>
                <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('descriptives'))}>
                  Descriptives...
                </div>
                <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('explore'))}>
                  Explore (Normality Tests)...
                </div>
                <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('crosstabs'))}>
                  Crosstabs (Chi-Square)...
                </div>
              </div>
            </div>

            {/* Compare Means Submenu */}
            <div className="spss-dropdown-item">
              <div className="spss-dropdown-item-left">
                <Table size={14} /> Compare Means
              </div>
              <ChevronRight size={14} />
              <div className="spss-submenu">
                <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('one_sample_t_test'))}>
                  One-Sample T Test...
                </div>
                <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('independent_t_test'))}>
                  Independent-Samples T Test...
                </div>
                <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('paired_t_test'))}>
                  Paired-Samples T Test...
                </div>
                <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('one_way_anova'))}>
                  One-Way ANOVA...
                </div>
                <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('two_way_anova'))}>
                  Univariate ANOVA (Two-Way)...
                </div>
              </div>
            </div>

            {/* Correlate Submenu */}
            <div className="spss-dropdown-item">
              <div className="spss-dropdown-item-left">
                <Layers size={14} /> Correlate
              </div>
              <ChevronRight size={14} />
              <div className="spss-submenu">
                <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('correlations'))}>
                  Bivariate (Pearson, Spearman)...
                </div>
              </div>
            </div>

            {/* Regression Submenu */}
            <div className="spss-dropdown-item">
              <div className="spss-dropdown-item-left">
                <BarChart2 size={14} /> Regression
              </div>
              <ChevronRight size={14} />
              <div className="spss-submenu">
                <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('linear_regression'))}>
                  Linear & Multiple Regression...
                </div>
                <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('logistic_regression'))}>
                  Binary Logistic Regression...
                </div>
              </div>
            </div>

            {/* Dimension Reduction Submenu */}
            <div className="spss-dropdown-item">
              <div className="spss-dropdown-item-left">
                <Layers size={14} /> Dimension Reduction
              </div>
              <ChevronRight size={14} />
              <div className="spss-submenu">
                <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('factor_analysis'))}>
                  Factor Analysis (PCA)...
                </div>
              </div>
            </div>

            {/* Nonparametric Tests Submenu */}
            <div className="spss-dropdown-item">
              <div className="spss-dropdown-item-left">
                <Sliders size={14} /> Nonparametric Tests
              </div>
              <ChevronRight size={14} />
              <div className="spss-submenu">
                <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('mann_whitney'))}>
                  Two Independent Samples (Mann-Whitney U)...
                </div>
                <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('wilcoxon'))}>
                  Two Related Samples (Wilcoxon)...
                </div>
                <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('kruskal_wallis'))}>
                  K Independent Samples (Kruskal-Wallis)...
                </div>
              </div>
            </div>

            {/* Scale / Reliability Submenu */}
            <div className="spss-dropdown-item">
              <div className="spss-dropdown-item-left">
                <CheckSquare size={14} /> Scale
              </div>
              <ChevronRight size={14} />
              <div className="spss-submenu">
                <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('reliability'))}>
                  Reliability Analysis (Cronbach's Alpha)...
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 7. GRAPHS */}
      <div className="spss-menu-item">
        <button
          className={`spss-menu-button ${openMenu === 'graphs' ? 'active' : ''}`}
          onClick={() => handleMenuClick('graphs')}
        >
          Graphs
        </button>
        {openMenu === 'graphs' && (
          <div className="spss-dropdown">
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('chart_builder'))}>
              <div className="spss-dropdown-item-left">
                <BarChart2 size={14} /> Chart Builder...
              </div>
            </div>
            <div className="spss-dropdown-divider" />
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('chart_builder'))}>
              Legacy Dialogs: Bar...
            </div>
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('chart_builder'))}>
              Legacy Dialogs: Pie...
            </div>
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('chart_builder'))}>
              Legacy Dialogs: Histogram...
            </div>
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('chart_builder'))}>
              Legacy Dialogs: Scatter/Dot...
            </div>
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('chart_builder'))}>
              Legacy Dialogs: Boxplot...
            </div>
          </div>
        )}
      </div>

      {/* 8. UTILITIES */}
      <div className="spss-menu-item">
        <button
          className={`spss-menu-button ${openMenu === 'utilities' ? 'active' : ''}`}
          onClick={() => handleMenuClick('utilities')}
        >
          Utilities
        </button>
        {openMenu === 'utilities' && (
          <div className="spss-dropdown">
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onSetActiveView('variable'))}>
              Variables...
            </div>
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('value_labels'))}>
              Value Labels...
            </div>
          </div>
        )}
      </div>

      {/* 9. EXTENSIONS */}
      <div className="spss-menu-item">
        <button
          className={`spss-menu-button ${openMenu === 'extensions' ? 'active' : ''}`}
          onClick={() => handleMenuClick('extensions')}
        >
          Extensions
        </button>
        {openMenu === 'extensions' && (
          <div className="spss-dropdown">
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onSetActiveView('syntax'))}>
              Python Statistics Engine (FastAPI)
            </div>
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onSetActiveView('syntax'))}>
              Client-Side Fast Engine (TypeScript)
            </div>
          </div>
        )}
      </div>

      {/* 10. WINDOW */}
      <div className="spss-menu-item">
        <button
          className={`spss-menu-button ${openMenu === 'window' ? 'active' : ''}`}
          onClick={() => handleMenuClick('window')}
        >
          Window
        </button>
        {openMenu === 'window' && (
          <div className="spss-dropdown">
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onSetActiveView('data'))}>
              1. IBM SPSS Statistics Data Editor [Data View]
            </div>
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onSetActiveView('variable'))}>
              2. IBM SPSS Statistics Data Editor [Variable View]
            </div>
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onSetActiveView('output'))}>
              3. IBM SPSS Statistics Viewer [Output]
            </div>
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onSetActiveView('syntax'))}>
              4. IBM SPSS Statistics Syntax Editor
            </div>
          </div>
        )}
      </div>

      {/* 11. HELP */}
      <div className="spss-menu-item">
        <button
          className={`spss-menu-button ${openMenu === 'help' ? 'active' : ''}`}
          onClick={() => handleMenuClick('help')}
        >
          Help
        </button>
        {openMenu === 'help' && (
          <div className="spss-dropdown">
            <div className="spss-dropdown-item" onClick={() => handleAction(() => onOpenModal('about_spss'))}>
              <div className="spss-dropdown-item-left">
                <HelpCircle size={14} /> About OpenSPSS Statistics Studio...
              </div>
            </div>
            <div className="spss-dropdown-item" onClick={() => handleAction(() => window.open('https://www.ibm.com/docs/en/spss-statistics', '_blank'))}>
              SPSS Syntax Reference & Algorithms
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
