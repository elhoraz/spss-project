import { Dataset, OutputItem } from '../types/spss';

const STORAGE_KEY_DATASET = 'openspss_autosave_dataset';
const STORAGE_KEY_OUTPUTS = 'openspss_autosave_outputs';
const STORAGE_KEY_RECENT = 'openspss_recent_files';

export interface RecentFileItem {
  name: string;
  timestamp: string;
  rowCount: number;
  colCount: number;
}

export function saveSessionToStorage(dataset: Dataset, outputs: OutputItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_DATASET, JSON.stringify(dataset));
    localStorage.setItem(STORAGE_KEY_OUTPUTS, JSON.stringify(outputs.slice(0, 30)));
  } catch (err) {
    console.warn('Storage quota exceeded, could not autosave dataset:', err);
  }
}

export function loadSessionFromStorage(): { dataset: Dataset | null; outputs: OutputItem[] | null } {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY_DATASET);
    const rawOutputs = localStorage.getItem(STORAGE_KEY_OUTPUTS);

    const dataset = rawData ? JSON.parse(rawData) : null;
    const outputs = rawOutputs ? JSON.parse(rawOutputs) : null;

    return { dataset, outputs };
  } catch (err) {
    console.error('Failed to load session from storage:', err);
    return { dataset: null, outputs: null };
  }
}

export function clearSessionStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_DATASET);
    localStorage.removeItem(STORAGE_KEY_OUTPUTS);
  } catch (err) {
    console.warn('Failed to clear storage:', err);
  }
}

export function getRecentFiles(): RecentFileItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECENT);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentFile(name: string, rowCount: number, colCount: number): void {
  try {
    const recents = getRecentFiles();
    const filtered = recents.filter((r) => r.name !== name);
    filtered.unshift({
      name,
      timestamp: new Date().toLocaleDateString(),
      rowCount,
      colCount,
    });
    localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(filtered.slice(0, 8)));
  } catch (err) {
    console.warn('Failed to update recent files:', err);
  }
}
