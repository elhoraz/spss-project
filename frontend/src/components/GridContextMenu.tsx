import React, { useEffect, useRef } from 'react';
import {
  Scissors,
  Copy,
  Clipboard,
  Trash2,
  PlusCircle,
  ArrowUp,
  ArrowDown,
  BarChart2,
} from 'lucide-react';

export interface GridContextMenuProps {
  x: number;
  y: number;
  type: 'cell' | 'row' | 'col';
  varName?: string;
  caseNumber?: number;
  onClose: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onClear: () => void;
  onInsertVariable: () => void;
  onInsertCases: () => void;
  onDeleteRow?: () => void;
  onDeleteCol?: () => void;
  onSortAscending: () => void;
  onSortDescending: () => void;
  onDescriptives: () => void;
}

export const GridContextMenu: React.FC<GridContextMenuProps> = ({
  x,
  y,
  type,
  varName,
  caseNumber,
  onClose,
  onCut,
  onCopy,
  onPaste,
  onClear,
  onInsertVariable,
  onInsertCases,
  onDeleteRow,
  onDeleteCol,
  onSortAscending,
  onSortDescending,
  onDescriptives,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Adjust coordinates to ensure menu stays within viewport
  const menuWidth = 210;
  const menuHeight = 280;
  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 8);
  const adjustedY = Math.min(y, window.innerHeight - menuHeight - 8);

  return (
    <div
      ref={menuRef}
      className="spss-desktop-context-menu"
      style={{
        position: 'fixed',
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
        zIndex: 9999,
      }}
    >
      {/* Header Info */}
      <div className="spss-context-header">
        {type === 'col' && varName ? `Variable: ${varName}` : null}
        {type === 'row' && caseNumber !== undefined ? `Case: ${caseNumber}` : null}
        {type === 'cell' && varName ? `${caseNumber} : ${varName}` : null}
      </div>

      <div className="spss-context-separator" />

      {/* Clipboard actions */}
      <button
        className="spss-context-item"
        onClick={() => {
          onCut();
          onClose();
        }}
      >
        <Scissors size={14} className="spss-context-icon" />
        <span className="spss-context-label">Cut</span>
        <span className="spss-context-shortcut">Ctrl+X</span>
      </button>

      <button
        className="spss-context-item"
        onClick={() => {
          onCopy();
          onClose();
        }}
      >
        <Copy size={14} className="spss-context-icon" />
        <span className="spss-context-label">Copy</span>
        <span className="spss-context-shortcut">Ctrl+C</span>
      </button>

      <button
        className="spss-context-item"
        onClick={() => {
          onPaste();
          onClose();
        }}
      >
        <Clipboard size={14} className="spss-context-icon" />
        <span className="spss-context-label">Paste</span>
        <span className="spss-context-shortcut">Ctrl+V</span>
      </button>

      <button
        className="spss-context-item"
        onClick={() => {
          onClear();
          onClose();
        }}
      >
        <Trash2 size={14} className="spss-context-icon" />
        <span className="spss-context-label">Clear</span>
        <span className="spss-context-shortcut">Delete</span>
      </button>

      {/* Structural Insert & Delete Actions */}
      <button
        className="spss-context-item"
        onClick={() => {
          onInsertVariable();
          onClose();
        }}
      >
        <PlusCircle size={14} className="spss-context-icon" />
        <span className="spss-context-label">Insert Variable</span>
      </button>

      <button
        className="spss-context-item"
        onClick={() => {
          onInsertCases();
          onClose();
        }}
      >
        <PlusCircle size={14} className="spss-context-icon" />
        <span className="spss-context-label">Insert Cases</span>
      </button>

      {type === 'row' && onDeleteRow && (
        <button
          className="spss-context-item"
          style={{ color: 'var(--danger)' }}
          onClick={() => {
            onDeleteRow();
            onClose();
          }}
        >
          <Trash2 size={14} className="spss-context-icon" />
          <span className="spss-context-label">Delete Case</span>
        </button>
      )}

      {type === 'col' && onDeleteCol && (
        <button
          className="spss-context-item"
          style={{ color: 'var(--danger)' }}
          onClick={() => {
            onDeleteCol();
            onClose();
          }}
        >
          <Trash2 size={14} className="spss-context-icon" />
          <span className="spss-context-label">Delete Variable</span>
        </button>
      )}

      <div className="spss-context-separator" />

      {/* Sorting & Statistics Actions */}
      <button
        className="spss-context-item"
        onClick={() => {
          onSortAscending();
          onClose();
        }}
      >
        <ArrowUp size={14} className="spss-context-icon" />
        <span className="spss-context-label">Sort Ascending</span>
      </button>

      <button
        className="spss-context-item"
        onClick={() => {
          onSortDescending();
          onClose();
        }}
      >
        <ArrowDown size={14} className="spss-context-icon" />
        <span className="spss-context-label">Sort Descending</span>
      </button>

      <button
        className="spss-context-item"
        onClick={() => {
          onDescriptives();
          onClose();
        }}
      >
        <BarChart2 size={14} className="spss-context-icon" />
        <span className="spss-context-label">Descriptive Statistics...</span>
      </button>
    </div>
  );
};
