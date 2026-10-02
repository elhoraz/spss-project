import { OutputItem } from '../types/spss';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const statsApiService = {
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      return res.ok;
    } catch {
      return false;
    }
  },

  async runDescriptives(data: Record<string, any>[], variables: string[]): Promise<OutputItem | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/analysis/descriptives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables, rows_data: data }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn('Backend unavailable, running via client engine:', e);
      return null;
    }
  },

  async runSyntax(syntaxText: string, data: Record<string, any>[]): Promise<OutputItem[] | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/scripts/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: syntaxText, rows_data: data }),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.results || [];
    } catch (e) {
      console.warn('Backend unavailable, running via client engine:', e);
      return null;
    }
  },
};
