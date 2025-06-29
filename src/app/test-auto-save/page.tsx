import React, { useState, useEffect, useCallback } from 'react';
import SecureInput from '@/components/ui/secureInput';

// 模擬 auto save 的簡化版本
const useAutoSaveTest = (value: string, delay: number = 1000) => {
  const [lastSaved, setLastSaved] = useState<string>('');
  const [saveCount, setSaveCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const save = useCallback(async () => {
    setSaveStatus('saving');

    // 模擬 API 呼叫
    await new Promise(resolve => setTimeout(resolve, 500));

    setLastSaved(value);
    setSaveCount(prev => prev + 1);
    setSaveStatus('saved');

    // 2秒後重置狀態
    setTimeout(() => setSaveStatus('idle'), 2000);
  }, [value]);

  useEffect(() => {
    if (value !== lastSaved && value.trim()) {
      const timeoutId = setTimeout(save, delay);
      return () => clearTimeout(timeoutId);
    }
  }, [value, lastSaved, save, delay]);

  return { lastSaved, saveCount, saveStatus };
};

const AutoSaveTest = () => {
  const [nameValue, setNameValue] = useState('');
  const [shortcutValue, setShortcutValue] = useState('');

  const { lastSaved: nameSaved, saveCount: nameSaveCount, saveStatus: nameStatus } = useAutoSaveTest(nameValue);
  const { lastSaved: shortcutSaved, saveCount: shortcutSaveCount, saveStatus: shortcutStatus } = useAutoSaveTest(shortcutValue);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Name onChange triggered:', e.target.value);
    setNameValue(e.target.value);
  };

  const handleShortcutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Shortcut onChange triggered:', e.target.value);
    setShortcutValue(e.target.value);
  };

  return (
    <div className="p-8 space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Auto Save 功能測試</h1>

      <div className="space-y-6">
        {/* Prompt Name 測試 */}
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Prompt 名稱 (預設樣式)</h3>

          <div className="relative">
            <SecureInput
              placeholder="輸入 prompt 名稱..."
              value={nameValue}
              onChange={handleNameChange}
              variant="default"
              styleConfig={{
                paddingLeft: '2.25rem',
                paddingRight: '0.75rem',
                height: '3rem'
              }}
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              📝
            </div>
          </div>

          <div className="mt-3 text-sm space-y-1">
            <p><strong>目前值:</strong> {nameValue}</p>
            <p><strong>最後儲存:</strong> {nameSaved}</p>
            <p><strong>儲存次數:</strong> {nameSaveCount}</p>
            <p><strong>狀態:</strong>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${nameStatus === 'saving' ? 'bg-yellow-100 text-yellow-800' :
                nameStatus === 'saved' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                {nameStatus === 'saving' ? '儲存中...' :
                  nameStatus === 'saved' ? '已儲存' : '待機'}
              </span>
            </p>
          </div>
        </div>

        {/* Shortcut 測試 */}
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">快捷鍵 (shortcut 樣式)</h3>

          <div className="relative">
            <SecureInput
              placeholder="輸入快捷鍵..."
              value={shortcutValue}
              onChange={handleShortcutChange}
              variant="shortcut"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              ⌨️
            </div>
            <button className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-500 text-white text-xs rounded">
              測試
            </button>
          </div>

          <div className="mt-3 text-sm space-y-1">
            <p><strong>目前值:</strong> {shortcutValue}</p>
            <p><strong>最後儲存:</strong> {shortcutSaved}</p>
            <p><strong>儲存次數:</strong> {shortcutSaveCount}</p>
            <p><strong>狀態:</strong>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${shortcutStatus === 'saving' ? 'bg-yellow-100 text-yellow-800' :
                shortcutStatus === 'saved' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                {shortcutStatus === 'saving' ? '儲存中...' :
                  shortcutStatus === 'saved' ? '已儲存' : '待機'}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">測試指南:</h3>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>在輸入框中輸入文字</li>
          <li>檢查 console 是否有 onChange 事件</li>
          <li>確認狀態在 1 秒後變為「儲存中」</li>
          <li>確認 0.5 秒後變為「已儲存」</li>
          <li>每次變更都應該觸發新的儲存週期</li>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">預期行為:</h3>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>onChange 事件正確觸發</li>
          <li>e.target.value 包含正確的值</li>
          <li>Auto save 在停止輸入 1 秒後觸發</li>
          <li>防護機制不影響正常功能</li>
        </ul>
      </div>
    </div>
  );
};

export default AutoSaveTest;
