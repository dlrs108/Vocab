import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { WordItem, StudyMode, AppSettings } from '../types';
import { speak } from '../utils/speech';
import HandwritingCanvas from './HandwritingCanvas';

interface StudySessionProps {
  words: WordItem[];
  mode: StudyMode;
  settings: AppSettings;
  onUpdateWord: (id: string, updates: Partial<WordItem>) => void;
  onBack: () => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateBlanks(word: string): string[] {
  const chars = word.split('');
  return chars.map((ch, i) => {
    if (ch === ' ') return ' ';
    if (i === 0) return ch;
    return Math.random() > 0.55 ? ch : '_';
  });
}

const StudySession: React.FC<StudySessionProps> = ({
  words,
  mode,
  settings,
  onUpdateWord,
  onBack,
}) => {
  const [order, setOrder] = useState(() => shuffleArray(words));
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [matchPairs, setMatchPairs] = useState<{ en: WordItem; cn: WordItem; matched: boolean }[]>([]);
  const [selectedEn, setSelectedEn] = useState<string | null>(null);
  const [selectedCn, setSelectedCn] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [blanks, setBlanks] = useState<string[]>([]);
  const [scrambled, setScrambled] = useState<string[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = order[idx];
  const isHandwriting = settings.inputMode === 'handwriting';

  // Generate stable blanks and scrambled letters per word
  useEffect(() => {
    if (current) {
      setBlanks(generateBlanks(current.english));
      setScrambled(shuffleArray(current.english.replace(/\s/g, '').split('')));
    }
  }, [current?.id]);

  useEffect(() => {
    if (settings.autoSpeak && current && mode !== 'flashcard' && mode !== 'matching') {
      const timer = setTimeout(() => speak(current.english), 300);
      return () => clearTimeout(timer);
    }
  }, [current?.id, mode]);

  useEffect(() => {
    if (mode === 'matching') {
      const shuffledCn = shuffleArray(words);
      setMatchPairs(words.map((w, i) => ({
        en: w,
        cn: shuffledCn[i],
        matched: false,
      })));
      setScore({ correct: 0, total: 0 });
    }
  }, [mode, words]);

  const checkAnswer = useCallback((userAnswer: string) => {
    if (!current) return false;
    const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
    return normalize(userAnswer) === normalize(current.english);
  }, [current]);

  const handleSubmit = () => {
    if (!current) return;
    const correct = checkAnswer(answer);
    setIsCorrect(correct);
    setShowResult(true);
    setScore(prev => ({ correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 }));
    onUpdateWord(current.id, {
      reviewCount: current.reviewCount + 1,
      mastered: correct && current.reviewCount >= 2,
      lastReview: Date.now(),
    });
  };

  const handleNext = () => {
    setAnswer('');
    setShowResult(false);
    setFlipped(false);
    setIsCorrect(false);
    setShowAnswer(false);
    if (idx < order.length - 1) {
      setIdx(idx + 1);
    } else {
      setOrder(shuffleArray(words));
      setIdx(0);
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleMarkMastered = () => {
    if (current) {
      onUpdateWord(current.id, { mastered: true, lastReview: Date.now() });
    }
    handleNext();
  };

  const handleHandwritingCheck = () => {
    setShowAnswer(true);
    setShowResult(true);
    setScore(prev => ({ ...prev, total: prev.total + 1 }));
    onUpdateWord(current.id, {
      reviewCount: current.reviewCount + 1,
      lastReview: Date.now(),
    });
  };

  // Navigation header
  const renderNav = (extra?: string) => (
    <div className="flex justify-between items-center mb-4">
      <button onClick={onBack} className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
        <span>&larr;</span> 返回
      </button>
      <span className="text-sm text-gray-500">
        {idx + 1} / {order.length}
        {extra ? ` | ${extra}` : ''}
      </span>
    </div>
  );

  // Flashcard mode
  if (mode === 'flashcard') {
    return (
      <div className="max-w-lg mx-auto p-4">
        {renderNav()}

        <div
          className="border-2 border-gray-200 rounded-xl p-8 min-h-[220px] flex flex-col items-center justify-center cursor-pointer select-none bg-white shadow-sm"
          onClick={() => setFlipped(!flipped)}
        >
          {!flipped ? (
            <>
              <div className="text-center text-gray-800" style={{ fontSize: settings.fontSize * 1.1 }}>
                {current.english}
              </div>
              <div className="text-xs text-gray-400 mt-8">点击翻转查看释义</div>
            </>
          ) : (
            <>
              <div className="text-center text-gray-400 mb-4" style={{ fontSize: settings.fontSize * 0.7 }}>
                {current.english}
              </div>
              <div className="text-center font-bold text-gray-800" style={{ fontSize: settings.fontSize * 1.3 }}>
                {current.chinese}
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 mt-5 justify-center">
          <button
            onClick={(e) => { e.stopPropagation(); handleMarkMastered(); }}
            className="bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm hover:bg-green-700"
          >
            记住了
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="bg-orange-100 text-orange-700 px-5 py-2.5 rounded-lg text-sm hover:bg-orange-200"
          >
            再看一次
          </button>
          <button
            onClick={() => speak(current.english)}
            className="bg-gray-100 text-gray-600 px-4 py-2.5 rounded-lg text-sm hover:bg-gray-200"
          >
            朗读
          </button>
        </div>
      </div>
    );
  }

  // Matching mode
  if (mode === 'matching') {
    const allMatched = matchPairs.every(p => p.matched);

    const handleClickEn = (id: string) => {
      if (selectedEn === id) {
        setSelectedEn(null);
        return;
      }
      setSelectedEn(id);
      if (selectedCn) {
        const enItem = matchPairs.find(p => p.en.id === id);
        const cnItem = matchPairs.find(p => p.cn.id === selectedCn);
        if (enItem && cnItem && enItem.en.id === cnItem.cn.id) {
          setMatchPairs(prev => prev.map(p =>
            p.en.id === id ? { ...p, matched: true } : p
          ));
          setScore(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }));
        } else {
          setScore(prev => ({ ...prev, total: prev.total + 1 }));
        }
        setSelectedEn(null);
        setSelectedCn(null);
      }
    };

    const handleClickCn = (id: string) => {
      if (selectedCn === id) {
        setSelectedCn(null);
        return;
      }
      setSelectedCn(id);
      if (selectedEn) {
        const enItem = matchPairs.find(p => p.en.id === selectedEn);
        const cnItem = matchPairs.find(p => p.cn.id === id);
        if (enItem && cnItem && enItem.en.id === cnItem.cn.id) {
          setMatchPairs(prev => prev.map(p =>
            p.en.id === selectedEn ? { ...p, matched: true } : p
          ));
          setScore(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }));
        } else {
          setScore(prev => ({ ...prev, total: prev.total + 1 }));
        }
        setSelectedEn(null);
        setSelectedCn(null);
      }
    };

    return (
      <div className="max-w-lg mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onBack} className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
            <span>&larr;</span> 返回
          </button>
          <span className="text-sm text-gray-500">
            正确 {score.correct} / {score.total}
          </span>
        </div>

        {allMatched ? (
          <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
            <p className="text-lg font-bold mb-2 text-gray-800">全部配对完成</p>
            <p className="text-sm text-gray-500 mb-6">
              正确率：{score.total > 0 ? Math.round(score.correct / score.total * 100) : 0}%
            </p>
            <button
              onClick={() => {
                const shuffledCn = shuffleArray(words);
                setMatchPairs(words.map((w, i) => ({
                  en: w,
                  cn: shuffledCn[i],
                  matched: false,
                })));
                setScore({ correct: 0, total: 0 });
              }}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm hover:bg-blue-700"
            >
              再来一轮
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-2 text-center text-gray-600">英文</h3>
              <div className="space-y-2">
                {matchPairs.map((p, i) => (
                  <button
                    key={`en-${i}`}
                    disabled={p.matched}
                    onClick={() => handleClickEn(p.en.id)}
                    className={`w-full p-2.5 rounded-lg text-sm border transition-all ${
                      p.matched
                        ? 'bg-green-50 border-green-300 text-green-700 opacity-50'
                        : selectedEn === p.en.id
                        ? 'bg-blue-100 border-blue-400 shadow-sm scale-[1.02]'
                        : 'bg-white border-gray-200 hover:border-gray-400'
                    }`}
                    style={{ fontSize: settings.fontSize * 0.6 }}
                  >
                    {p.en.english}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2 text-center text-gray-600">中文</h3>
              <div className="space-y-2">
                {matchPairs.map((p, i) => (
                  <button
                    key={`cn-${i}`}
                    disabled={p.matched}
                    onClick={() => handleClickCn(p.cn.id)}
                    className={`w-full p-2.5 rounded-lg text-sm border transition-all ${
                      p.matched
                        ? 'bg-green-50 border-green-300 text-green-700 opacity-50'
                        : selectedCn === p.cn.id
                        ? 'bg-blue-100 border-blue-400 shadow-sm scale-[1.02]'
                        : 'bg-white border-gray-200 hover:border-gray-400'
                    }`}
                    style={{ fontSize: settings.fontSize * 0.6 }}
                  >
                    {p.cn.chinese}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Common answer area for writing modes
  const renderAnswerArea = (placeholder: string, showListenBtn: boolean = true) => {
    if (isHandwriting) {
      return (
        <div className="flex flex-col items-center gap-3">
          <div className="text-xs text-gray-400">在下方手写英文，写完后点击"对照答案"</div>
          <HandwritingCanvas
            width={360}
            height={130}
            guideline={showAnswer ? current.english : ''}
          />
          <div className="flex gap-2">
            {!showResult ? (
              <>
                <button
                  onClick={handleHandwritingCheck}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700"
                >
                  对照答案
                </button>
                {showListenBtn && (
                  <button
                    onClick={() => speak(current.english)}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200"
                  >
                    听发音
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => { setIsCorrect(true); handleNext(); }}
                  className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-green-700"
                >
                  写对了
                </button>
                <button
                  onClick={() => { setIsCorrect(false); handleNext(); }}
                  className="bg-orange-100 text-orange-700 px-5 py-2 rounded-lg text-sm hover:bg-orange-200"
                >
                  写错了，再看
                </button>
              </>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-3">
        <input
          ref={inputRef}
          type="text"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              if (showResult) handleNext();
              else handleSubmit();
            }
          }}
          placeholder={placeholder}
          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-center focus:border-blue-400 focus:outline-none bg-white"
          style={{ fontSize: settings.fontSize }}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <div className="flex gap-2">
          <button
            onClick={showResult ? handleNext : handleSubmit}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            {showResult ? '下一个' : '提交'}
          </button>
          {showListenBtn && !showResult && (
            <button
              onClick={() => speak(current.english)}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200"
            >
              听发音
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderResult = () => {
    if (!showResult) return null;
    return (
      <div className={`mt-4 p-4 rounded-lg text-center ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
        {isCorrect ? (
          <span className="text-green-700 font-medium">正确</span>
        ) : (
          <div className="text-orange-700">
            <span className="font-medium">正确答案：</span>
            <span className="font-mono">{current.english}</span>
            <span className="text-gray-500 ml-2">({current.chinese})</span>
          </div>
        )}
      </div>
    );
  };

  // Spelling mode (看中文写英文)
  if (mode === 'spelling') {
    return (
      <div className="max-w-lg mx-auto p-4">
        {renderNav(`正确 ${score.correct}/${score.total}`)}

        <div className="text-center mb-6 bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="text-gray-500 text-sm mb-2">请写出下面的中文对应的英文</div>
          <div className="font-bold text-gray-800" style={{ fontSize: settings.fontSize * 1.3 }}>
            {current.chinese}
          </div>
        </div>

        {renderAnswerArea('输入英文...')}
        {renderResult()}
      </div>
    );
  }

  // Fill blank mode
  if (mode === 'fillblank') {
    return (
      <div className="max-w-lg mx-auto p-4">
        {renderNav(`正确 ${score.correct}/${score.total}`)}

        <div className="text-center mb-6 bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="text-gray-500 text-sm mb-2">{current.chinese}</div>
          <div className="font-mono tracking-[0.3em] text-gray-800" style={{ fontSize: settings.fontSize * 1.2 }}>
            {blanks.map((ch, i) => (
              <span key={i} className={ch === '_' ? 'text-blue-400 font-bold' : ''}>
                {ch === '_' ? '_' : ch}
              </span>
            ))}
          </div>
          <div className="text-xs text-gray-400 mt-2">
            补全划线处的字母
          </div>
        </div>

        {renderAnswerArea('补全单词...')}
        {renderResult()}
      </div>
    );
  }

  // Dictation mode
  if (mode === 'dictation') {
    return (
      <div className="max-w-lg mx-auto p-4">
        {renderNav(`正确 ${score.correct}/${score.total}`)}

        <div className="text-center mb-6 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="text-gray-500 text-sm mb-4">听发音，写出英文</div>
          <button
            onClick={() => speak(current.english, 0.7)}
            className="bg-blue-100 text-blue-700 px-8 py-4 rounded-xl text-lg hover:bg-blue-200 transition-colors"
          >
            播放发音
          </button>
          <div className="mt-3">
            <button
              onClick={() => speak(current.english, 0.4)}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              慢速重播
            </button>
          </div>
        </div>

        {renderAnswerArea('写出你听到的...', false)}
        {renderResult()}
      </div>
    );
  }

  // First letter mode
  if (mode === 'firstletter') {
    return (
      <div className="max-w-lg mx-auto p-4">
        {renderNav(`正确 ${score.correct}/${score.total}`)}

        <div className="text-center mb-6 bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="text-gray-500 text-sm mb-2">{current.chinese}</div>
          <div className="font-mono text-gray-800" style={{ fontSize: settings.fontSize * 1.5 }}>
            <span>{current.english[0]}</span>
            <span className="text-gray-300">{' _'.repeat(current.english.length - 1)}</span>
          </div>
          <div className="text-xs text-gray-400 mt-2">
            共 {current.english.length} 个字符
          </div>
        </div>

        {renderAnswerArea('根据首字母写出完整单词...')}
        {renderResult()}
      </div>
    );
  }

  // Scramble mode
  if (mode === 'scramble') {
    return (
      <div className="max-w-lg mx-auto p-4">
        {renderNav(`正确 ${score.correct}/${score.total}`)}

        <div className="text-center mb-6 bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="text-gray-500 text-sm mb-2">{current.chinese}</div>
          <div className="text-xs text-gray-400 mb-3">将下面的字母重新排列组成正确的词组</div>
          <div className="flex flex-wrap gap-2 justify-center">
            {scrambled.map((ch, i) => (
              <span
                key={i}
                className="inline-flex items-center justify-center w-9 h-9 bg-gray-100 border border-gray-300 rounded-lg font-mono text-gray-700"
                style={{ fontSize: settings.fontSize * 0.7 }}
              >
                {ch}
              </span>
            ))}
          </div>
        </div>

        {renderAnswerArea('重新排列字母...')}
        {renderResult()}
      </div>
    );
  }

  // Rapid review mode
  if (mode === 'rapid') {
    return (
      <div className="max-w-lg mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onBack} className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
            <span>&larr;</span> 返回
          </button>
          <span className="text-sm text-gray-500">
            {idx + 1} / {order.length} | 认识 {score.correct}/{score.total}
          </span>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm text-center">
          <div className="text-gray-400 text-sm mb-2">{current.chinese}</div>
          <div className="font-bold text-gray-800 mb-6" style={{ fontSize: settings.fontSize * 1.4 }}>
            {current.english}
          </div>

          <div className="text-sm text-gray-500 mb-4">你认识这个词吗？</div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setScore(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }));
                onUpdateWord(current.id, {
                  reviewCount: current.reviewCount + 1,
                  mastered: current.reviewCount >= 2,
                  lastReview: Date.now(),
                });
                handleNext();
              }}
              className="bg-green-600 text-white px-8 py-3 rounded-lg text-sm hover:bg-green-700"
            >
              认识
            </button>
            <button
              onClick={() => {
                setScore(prev => ({ ...prev, total: prev.total + 1 }));
                handleNext();
              }}
              className="bg-orange-100 text-orange-700 px-8 py-3 rounded-lg text-sm hover:bg-orange-200"
            >
              不认识
            </button>
          </div>

          <button
            onClick={() => speak(current.english)}
            className="mt-4 text-xs text-gray-400 hover:text-gray-600 underline"
          >
            听发音
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default StudySession;
