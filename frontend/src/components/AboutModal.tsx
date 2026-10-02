import React from 'react';
import { X, Award, Cpu, Database, Check } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="spss-modal-overlay">
      <div className="spss-modal-dialog" style={{ width: 500 }}>
        <div className="spss-modal-header">
          <span className="spss-modal-title">About OpenSPSS Statistics Studio</span>
          <button className="spss-modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="spss-modal-body" style={{ flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                background: 'var(--accent)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Award size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>OpenSPSS Statistics Studio</h2>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Release 1.0.0 Pro Edition</div>
            </div>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-main)', lineHeight: 1.6 }}>
            OpenSPSS Statistics Studio is a high-fidelity web statistical suite replicating the desktop workflow, layout, variable management, and report generation of IBM SPSS Statistics.
          </p>

          <div style={{ background: 'var(--bg-menu)', padding: 12, borderRadius: 6, border: '1px solid var(--border-app)' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
              FEATURES & CAPABILITIES:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={12} color="var(--success)" /> Data View & Variable View
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={12} color="var(--success)" /> Value Labels & Measure Types
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={12} color="var(--success)" /> Frequencies & Descriptives
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={12} color="var(--success)" /> Crosstabs & Chi-Square Tests
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={12} color="var(--success)" /> One-Sample, Indep, Paired T-Tests
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={12} color="var(--success)" /> One-Way ANOVA & Tukey HSD
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={12} color="var(--success)" /> Multiple Linear Regression
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={12} color="var(--success)" /> SPSS Syntax Editor & Runner
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
            <span>Dual Engine: TypeScript + Python FastAPI</span>
            <span>Database: PostgreSQL</span>
          </div>
        </div>

        <div style={{ padding: '10px 16px', background: 'var(--bg-header)', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-app)' }}>
          <button className="spss-btn spss-btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
