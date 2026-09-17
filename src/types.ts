export interface WordItem {
  id: string;
  english: string;
  chinese: string;
  mastered: boolean;
  reviewCount: number;
  lastReview: number;
}

export interface WordList {
  id: string;
  name: string;
  words: WordItem[];
  createdAt: number;
}

export type StudyMode = 'flashcard' | 'spelling' | 'fillblank' | 'dictation' | 'matching' | 'firstletter' | 'scramble' | 'rapid';

export type InputMode = 'handwriting' | 'keyboard';

export interface AppSettings {
  inputMode: InputMode;
  fontSize: number;
  showPinyin: boolean;
  autoSpeak: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  inputMode: 'handwriting',
  fontSize: 24,
  showPinyin: false,
  autoSpeak: true,
};

export const STUDY_MODE_LABELS: Record<StudyMode, string> = {
  flashcard: '闪卡记忆',
  spelling: '看中文写英文',
  fillblank: '填空拼写',
  dictation: '听写模式',
  matching: '配对连线',
  firstletter: '首字母提示',
  scramble: '字母重组',
  rapid: '快速复习',
};
