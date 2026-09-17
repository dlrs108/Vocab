import * as XLSX from 'xlsx';
import { WordItem } from '../types';
import { generateId } from './storage';

export function parseXlsx(file: File): Promise<WordItem[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
        
        const words: WordItem[] = [];
        for (let i = 0; i < json.length; i++) {
          const row = json[i];
          if (row && row.length >= 2) {
            const english = String(row[0]).trim();
            const chinese = String(row[1]).trim();
            if (english && chinese) {
              words.push({
                id: generateId(),
                english,
                chinese,
                mastered: false,
                reviewCount: 0,
                lastReview: 0,
              });
            }
          }
        }
        resolve(words);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function parseMarkdown(text: string): WordItem[] {
  const words: WordItem[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Support formats: "english chinese", "english - chinese", "english: chinese", "english,chinese"
    let match = trimmed.match(/^(.+?)[\s]*[-:：\t][\s]*(.+)$/);
    if (!match) {
      match = trimmed.match(/^(.+?)[\s]+(.+)$/);
    }
    if (!match) {
      match = trimmed.match(/^(.+?)[,，][\s]*(.+)$/);
    }
    
    if (match) {
      const english = match[1].trim().replace(/^[-*\d.]+\s*/, '');
      const chinese = match[2].trim();
      if (english && chinese && /[a-zA-Z]/.test(english)) {
        words.push({
          id: generateId(),
          english,
          chinese,
          mastered: false,
          reviewCount: 0,
          lastReview: 0,
        });
      }
    }
  }
  
  return words;
}

export function parseText(text: string): WordItem[] {
  // Try markdown first, then CSV-like format
  const words = parseMarkdown(text);
  if (words.length > 0) return words;
  
  // Try line-by-line with comma or tab separation
  const lines = text.split('\n');
  const result: WordItem[] = [];
  
  for (const line of lines) {
    const parts = line.split(/[,\t]/);
    if (parts.length >= 2) {
      const english = parts[0].trim();
      const chinese = parts[1].trim();
      if (english && chinese) {
        result.push({
          id: generateId(),
          english,
          chinese,
          mastered: false,
          reviewCount: 0,
          lastReview: 0,
        });
      }
    }
  }
  
  return result;
}
