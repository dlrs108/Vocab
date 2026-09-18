import React from 'react';
import { AppSettings, InputMode } from '../types';

interface SettingsProps {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onChange, onClose }) => {
  const update = (partial: Partial<AppSettings>) => {
    onChange({ ...settings, ...partial });
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onClose} className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
          <span>&larr;</span> 返回
        </button>
        <h2 className="text-lg font-bold text-gray-800">设置</h2>
        <div className="w-12"></div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-medium mb-3 text-gray-700">输入模式</label>
          <div className="space-y-2">
            {([
              { value: 'handwriting' as InputMode, label: '手写模式', desc: '通过手写英文字母加深记忆（推荐）' },
              { value: 'keyboard' as InputMode, label: '键盘模式', desc: '直接键盘输入英文' },
            ]).map(item => (
              <label
                key={item.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  settings.inputMode === item.value
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="inputMode"
                  checked={settings.inputMode === item.value}
                  onChange={() => update({ inputMode: item.value })}
                  className="w-4 h-4 mt-0.5"
                />
                <div>
                  <div className="text-sm font-medium text-gray-800">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            字体大小
          </label>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">小</span>
            <input
              type="range"
              min={16}
              max={40}
              value={settings.fontSize}
              onChange={e => update({ fontSize: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-xs text-gray-400">大</span>
            <span className="text-xs text-gray-500 w-10 text-right">{settings.fontSize}px</span>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoSpeak}
              onChange={e => update({ autoSpeak: e.target.checked })}
              className="w-4 h-4"
            />
            <div>
              <div className="text-sm font-medium text-gray-800">自动朗读英文</div>
              <div className="text-xs text-gray-500">进入每个单词时自动播放发音</div>
            </div>
          </label>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={onClose}
          className="w-full bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm hover:bg-blue-700"
        >
          保存
        </button>
      </div>
    </div>
  );
};

export default Settings;
