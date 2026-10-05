import React, { useState, useEffect } from 'react';
import { X, Server, CheckCircle2, AlertCircle, RefreshCw, Globe, ShieldCheck } from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl, statsApiService } from '../services/api';

interface ServerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (isOnline: boolean, url: string) => void;
}

export const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({ isOpen, onClose, onStatusChange }) => {
  const [url, setUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected' | 'idle'>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      const current = getApiBaseUrl();
      setUrl(current);
      checkConnection(current);
    }
  }, [isOpen]);

  const checkConnection = async (targetUrl: string) => {
    setTesting(true);
    setStatus('checking');
    setStatusMsg('Testing connection to server...');
    try {
      const cleanUrl = targetUrl.trim().replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/health`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        setStatus('connected');
        setStatusMsg(`Connected successfully! Engine: ${data.engine || 'FastAPI Python'}`);
        if (onStatusChange) onStatusChange(true, cleanUrl);
      } else {
        setStatus('disconnected');
        setStatusMsg(`Server responded with HTTP ${res.status}. Falling back to Client-side Engine.`);
        if (onStatusChange) onStatusChange(false, cleanUrl);
      }
    } catch {
      setStatus('disconnected');
      setStatusMsg('Cannot reach backend server. OpenSPSS will automatically use the built-in Client-side Engine for all statistical analyses.');
      if (onStatusChange) onStatusChange(false, targetUrl);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setApiBaseUrl(url);
    checkConnection(url);
    onClose();
  };

  const handleResetDefault = () => {
    setApiBaseUrl('');
    const def = getApiBaseUrl();
    setUrl(def);
    checkConnection(def);
  };

  if (!isOpen) return null;

  return (
    <div className="spss-modal-overlay">
      <div className="spss-modal-dialog" style={{ width: 520 }}>
        <div className="spss-modal-header">
          <span className="spss-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Server size={16} /> Backend Server & Cloud Configuration
          </span>
          <button className="spss-modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="spss-modal-body" style={{ flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 12, color: 'var(--text-main)', margin: 0, lineHeight: 1.5 }}>
            Configure your statistical compute backend (Render Cloud, Local FastAPI server, or Client-side Engine).
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)' }}>
              Backend API URL:
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                className="spss-input"
                style={{ flex: 1, padding: '6px 10px', fontSize: 12 }}
                placeholder="e.g. https://stat-spss-backend.onrender.com or http://127.0.0.1:8000"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button
                className="spss-btn spss-btn-secondary"
                onClick={() => checkConnection(url)}
                disabled={testing}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
              >
                <RefreshCw size={13} className={testing ? 'animate-spin' : ''} />
                {testing ? 'Testing...' : 'Test'}
              </button>
            </div>
          </div>

          {/* Quick presets */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11 }}>
            <span style={{ color: 'var(--text-muted)' }}>Quick Presets:</span>
            <button
              className="spss-btn spss-btn-secondary"
              style={{ fontSize: 11, padding: '2px 8px' }}
              onClick={() => {
                const renderUrl = 'https://stat-spss-backend.onrender.com';
                setUrl(renderUrl);
                checkConnection(renderUrl);
              }}
            >
              <Globe size={11} style={{ marginRight: 4 }} /> Render Cloud
            </button>
            <button
              className="spss-btn spss-btn-secondary"
              style={{ fontSize: 11, padding: '2px 8px' }}
              onClick={() => {
                const localUrl = 'http://127.0.0.1:8000';
                setUrl(localUrl);
                checkConnection(localUrl);
              }}
            >
              <Server size={11} style={{ marginRight: 4 }} /> Localhost (8000)
            </button>
          </div>

          {/* Status Box */}
          <div
            style={{
              padding: 12,
              borderRadius: 6,
              background: status === 'connected' ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              border: `1px solid ${status === 'connected' ? 'var(--success)' : 'var(--border-app)'}`,
              fontSize: 12,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            {status === 'connected' ? (
              <CheckCircle2 size={18} color="var(--success)" style={{ flexShrink: 0, marginTop: 1 }} />
            ) : (
              <AlertCircle size={18} color="var(--accent)" style={{ flexShrink: 0, marginTop: 1 }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: status === 'connected' ? 'var(--success)' : 'var(--text-main)', marginBottom: 2 }}>
                {status === 'connected' ? 'Backend Connected' : 'Client-Side Engine Active'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {statusMsg || 'Ready'}
              </div>
            </div>
          </div>

          {/* Notice about dual engine */}
          <div style={{ background: 'var(--bg-menu)', padding: 10, borderRadius: 6, fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <ShieldCheck size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
            <span>
              <strong>Dual-Engine Architecture:</strong> If the cloud backend is sleeping (Render free-tier cold start) or unreachable, all calculations (T-Tests, ANOVA, Regression, Crosstabs, Compute) run instantly in your browser via the built-in TypeScript engine.
            </span>
          </div>
        </div>

        <div style={{ padding: '10px 16px', background: 'var(--bg-header)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-app)' }}>
          <button className="spss-btn spss-btn-secondary" onClick={handleResetDefault}>
            Reset to Default
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="spss-btn spss-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="spss-btn spss-btn-primary" onClick={handleSave}>
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
