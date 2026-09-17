import { WordList, AppSettings, DEFAULT_SETTINGS } from '../types';

const WORD_LISTS_KEY = 'wordapp_lists';
const SETTINGS_KEY = 'wordapp_settings';

export function loadWordLists(): WordList[] {
  try {
    const data = localStorage.getItem(WORD_LISTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveWordLists(lists: WordList[]): void {
  localStorage.setItem(WORD_LISTS_KEY, JSON.stringify(lists));
}

export function loadSettings(): AppSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
