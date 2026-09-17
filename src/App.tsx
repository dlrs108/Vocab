import React, { useState, useEffect } from 'react';
import { WordList, WordItem, StudyMode, AppSettings, STUDY_MODE_LABELS } from './types';
import { loadWordLists, saveWordLists, loadSettings, saveSettings, generateId } from './utils/storage';
import DataImport from './components/DataImport';
import StudySession from './components/StudySession';
import Settings from './components/Settings';

type Page = 'home' | 'import' | 'study' | 'settings' | 'manage';

function createSampleList(): WordList {
  const words: WordItem[] = [
    { id: generateId(), english: 'get up', chinese: '起床', mastered: false, reviewCount: 0, lastReview: 0 },
    { id: generateId(), english: 'brush my teeth', chinese: '刷牙', mastered: false, reviewCount: 0, lastReview: 0 },
    { id: generateId(), english: 'wash my face', chinese: '洗脸', mastered: false, reviewCount: 0, lastReview: 0 },
    { id: generateId(), english: 'have breakfast', chinese: '吃早餐', mastered: false, reviewCount: 0, lastReview: 0 },
    { id: generateId(), english: 'go to school', chinese: '去上学', mastered: false, reviewCount: 0, lastReview: 0 },
    { id: generateId(), english: 'read books', chinese: '读书', mastered: false, reviewCount: 0, lastReview: 0 },
    { id: generateId(), english: 'do homework', chinese: '做作业', mastered: false, reviewCount: 0, lastReview: 0 },
    { id: generateId(), english: 'go to bed', chinese: '上床睡觉', mastered: false, reviewCount: 0, lastReview: 0 },
    { id: generateId(), english: 'play games', chinese: '玩游戏', mastered: false, reviewCount: 0, lastReview: 0 },
    { id: generateId(), english: 'watch TV', chinese: '看电视', mastered: false, reviewCount: 0, lastReview: 0 },
    { id: generateId(), english: 'drink water', chinese: '喝水', mastered: false, reviewCount: 0, lastReview: 0 },
    { id: generateId(), english: 'eat lunch', chinese: '吃午餐', mastered: false, reviewCount: 0, lastReview: 0 },
  ];

  return {
    id: generateId(),
    name: '示例：日常活动',
    words,
    createdAt: Date.now(),
  };
}

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('home');
  const [wordLists, setWordLists] = useState<WordList[]>([]);
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [selectedList, setSelectedList] = useState<WordList | null>(null);
  const [studyMode, setStudyMode] = useState<StudyMode>('flashcard');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const lists = loadWordLists();
    if (lists.length === 0) {
      // Add sample list for first-time users
      const sample = createSampleList();
      setWordLists([sample]);
      saveWordLists([sample]);
    } else {
      setWordLists(lists);
    }
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (initialized) {
      saveSettings(settings);
    }
  }, [settings, initialized]);

  useEffect(() => {
    if (initialized) {
      saveWordLists(wordLists);
    }
  }, [wordLists, initialized]);

  const handleImport = (list: WordList) => {
    setWordLists(prev => [...prev, list]);
    setPage('home');
  };

  const handleDeleteList = (id: string) => {
    if (confirm('确定删除这个词表吗？')) {
      setWordLists(prev => prev.filter(l => l.id !== id));
    }
  };

  const handleUpdateWord = (listId: string, wordId: string, updates: Partial<WordItem>) => {
    setWordLists(prev => prev.map(list => {
      if (list.id !== listId) return list;
      return {
        ...list,
        words: list.words.map(w => w.id === wordId ? { ...w, ...updates } : w),
      };
    }));
    if (selectedList && selectedList.id === listId) {
      setSelectedList(prev => prev ? {
        ...prev,
        words: prev.words.map(w => w.id === wordId ? { ...w, ...updates } : w),
      } : null);
    }
  };

  const handleStartStudy = (list: WordList, mode: StudyMode) => {
    setSelectedList(list);
    setStudyMode(mode);
    setPage('study');
  };

  const handleExportList = (list: WordList) => {
    const text = list.words.map(w => `${w.english}\t${w.chinese}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${list.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render pages
  if (page === 'import') {
    return (
      <div className="min-h-screen bg-gray-50">
        <DataImport onImport={handleImport} onCancel={() => setPage('home')} />
      </div>
    );
  }

  if (page === 'settings') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Settings
          settings={settings}
          onChange={setSettings}
          onClose={() => setPage('home')}
        />
      </div>
    );
  }

  if (page === 'study' && selectedList) {
    const studyWords = selectedList.words.filter(w => !w.mastered);
    return (
      <div className="min-h-screen bg-gray-50">
        <StudySession
          words={studyWords.length > 0 ? studyWords : selectedList.words}
          mode={studyMode}
          settings={settings}
          onUpdateWord={(wordId, updates) => handleUpdateWord(selectedList.id, wordId, updates)}
          onBack={() => setPage('home')}
        />
      </div>
    );
  }

  if (page === 'manage' && selectedList) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => setPage('home')} className="text-sm text-gray-600 flex items-center gap-1">
              <span>&larr;</span> 返回
            </button>
            <h2 className="font-bold text-gray-800">{selectedList.name}</h2>
            <div className="w-12"></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">英文</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">中文</th>
                  <th className="text-center px-4 py-2.5 font-medium text-gray-600">状态</th>
                </tr>
              </thead>
              <tbody>
                {selectedList.words.map(w => (
                  <tr key={w.id} className="border-t border-gray-100">
                    <td className="px-4 py-2.5">{w.english}</td>
                    <td className="px-4 py-2.5">{w.chinese}</td>
                    <td className="px-4 py-2.5 text-center">
                      {w.mastered ? (
                        <span className="text-green-600 text-xs bg-green-50 px-2 py-0.5 rounded">已掌握</span>
                      ) : (
                        <span className="text-gray-400 text-xs bg-gray-50 px-2 py-0.5 rounded">学习中</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Home page
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-xl font-bold text-gray-800">单词记忆助手</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setPage('settings')}
              className="text-sm text-gray-600 hover:text-gray-900 px-2 py-1.5 rounded hover:bg-gray-100"
            >
              设置
            </button>
            <button
              onClick={() => setPage('import')}
              className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-blue-700"
            >
              导入词表
            </button>
          </div>
        </div>

        {/* Current mode indicator */}
        <div className="mb-4 px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-500 flex items-center justify-between">
          <span>
            输入模式：
            <span className="font-medium text-gray-700">
              {settings.inputMode === 'handwriting' ? '手写模式' : '键盘模式'}
            </span>
          </span>
          <span className="text-gray-400">
            {settings.inputMode === 'handwriting' ? '手写加深记忆' : '直接输入'}
          </span>
        </div>

        {/* Word lists */}
        {wordLists.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">还没有词表，请先导入</p>
            <button
              onClick={() => setPage('import')}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700"
            >
              导入词表
            </button>
            <div className="mt-8 text-xs text-gray-400 max-w-sm mx-auto text-left bg-white p-4 rounded-lg border border-gray-200">
              <p className="font-medium text-gray-600 mb-2">支持的导入格式：</p>
              <ul className="space-y-1">
                <li>xlsx 文件（第一列英文，第二列中文）</li>
                <li>txt/md 文件（每行：英文 中文）</li>
                <li>手动输入（每行一个词条）</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {wordLists.map(list => {
              const mastered = list.words.filter(w => w.mastered).length;
              const total = list.words.length;
              const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
              return (
                <div key={list.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-800">{list.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {total} 个词条 | 已掌握 {mastered}/{total} ({pct}%)
                      </p>
                    </div>
                    <div className="flex gap-0.5">
                      <button
                        onClick={() => { setSelectedList(list); setPage('manage'); }}
                        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                      >
                        查看
                      </button>
                      <button
                        onClick={() => handleExportList(list)}
                        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                      >
                        导出
                      </button>
                      <button
                        onClick={() => handleDeleteList(list.id)}
                        className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                      >
                        删除
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>

                  {/* Study modes */}
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.entries(STUDY_MODE_LABELS) as [StudyMode, string][]).map(([modeKey, label]) => (
                      <button
                        key={modeKey}
                        onClick={() => handleStartStudy(list, modeKey)}
                        className="text-xs bg-gray-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer help */}
        {wordLists.length > 0 && (
          <div className="mt-6 text-xs text-gray-400 text-center">
            数据保存在本地浏览器中，清除浏览器数据会丢失词表
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
