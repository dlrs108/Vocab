import React, { useState, useRef } from 'react';
import { WordItem, WordList } from '../types';
import { parseXlsx, parseMarkdown, parseText } from '../utils/parser';
import { generateId } from '../utils/storage';

interface DataImportProps {
  onImport: (list: WordList) => void;
  onCancel: () => void;
}

const DataImport: React.FC<DataImportProps> = ({ onImport, onCancel }) => {
  const [listName, setListName] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<WordItem[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    try {
      let words: WordItem[] = [];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        words = await parseXlsx(file);
      } else if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        const text = await file.text();
        words = file.name.endsWith('.md') ? parseMarkdown(text) : parseText(text);
      } else {
        const text = await file.text();
        words = parseText(text);
      }

      if (words.length === 0) {
        setError('未能从文件中解析出单词，请检查格式');
        return;
      }
      setPreview(words);
      if (!listName) {
        setListName(file.name.replace(/\.[^.]+$/, ''));
      }
    } catch {
      setError('文件解析失败，请检查文件格式');
    }
  };

  const handleManualParse = () => {
    setError('');
    if (!manualInput.trim()) {
      setError('请输入单词内容');
      return;
    }
    const words = parseText(manualInput);
    if (words.length === 0) {
      setError('未能解析出单词。每行格式：英文 中文（用空格、Tab、冒号或逗号分隔）');
      return;
    }
    setPreview(words);
  };

  const handleConfirm = () => {
    if (preview.length === 0) {
      setError('请先导入或输入单词');
      return;
    }
    const name = listName.trim() || `词表${new Date().toLocaleDateString()}`;
    const list: WordList = {
      id: generateId(),
      name,
      words: preview,
      createdAt: Date.now(),
    };
    onImport(list);
  };

  // Handle Tab key in textarea: insert tab character for quick separation
  // Handle Enter key: add new line (default behavior)
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      // Insert a tab character
      const newValue = value.substring(0, start) + '\t' + value.substring(end);
      setManualInput(newValue);
      // Move cursor after the tab
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
    }
  };

  // Handle name field: Tab moves to textarea
  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      textareaRef.current?.focus();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <button onClick={onCancel} className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
          <span>&larr;</span> 返回
        </button>
        <h2 className="text-lg font-bold text-gray-800">导入单词表</h2>
        <div className="w-12"></div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1.5 text-gray-700">词表名称</label>
          <input
            ref={nameRef}
            type="text"
            value={listName}
            onChange={e => setListName(e.target.value)}
            onKeyDown={handleNameKeyDown}
            placeholder="例如：二年级上册Unit1"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1.5 text-gray-700">上传文件</label>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.md,.txt,.csv"
            onChange={handleFileUpload}
            className="text-sm w-full"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            支持 xlsx（第一列英文，第二列中文）、txt/md（每行一个词组，英文和中文用空格/Tab/逗号分隔）
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1.5 text-gray-700">手动输入</label>
          <textarea
            ref={textareaRef}
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder={"get up 起床\nbrush my teeth 刷牙\nwash my face 洗脸"}
            rows={8}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:border-blue-400 focus:outline-none resize-y"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            每行一个词条。电脑按 Tab 插入分隔符，手机按 Enter 换行。格式：英文 + 分隔符 + 中文
          </p>
          <button
            onClick={handleManualParse}
            className="mt-2.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            解析内容
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {preview.length > 0 && (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h3 className="text-sm font-medium mb-2 text-gray-700">
            预览（共 {preview.length} 个词条）
          </h3>
          <div className="border border-gray-200 rounded-lg max-h-52 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">英文</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">中文</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 50).map((w, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-3 py-1.5">{w.english}</td>
                    <td className="px-3 py-1.5">{w.chinese}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 50 && (
              <div className="text-center text-xs text-gray-400 py-2 bg-gray-50">
                ...还有 {preview.length - 50} 个词条
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleConfirm}
          disabled={preview.length === 0}
          className="bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          确认导入
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg text-sm hover:bg-gray-200"
        >
          取消
        </button>
      </div>
    </div>
  );
};

export default DataImport;
