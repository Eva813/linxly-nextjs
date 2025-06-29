import React, { useState } from 'react';
import SecureInput from '@/components/ui/secureInput';

const SecureInputTest = () => {
  const [nameValue, setNameValue] = useState('');
  const [shortcutValue, setShortcutValue] = useState('');

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">SecureInput 測試頁面</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            預設樣式 (類似 prompt name):
          </label>
          <div className="relative">
            <SecureInput
              placeholder="輸入 prompt 名稱..."
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
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
          <p className="text-sm text-gray-600 mt-1">值: {nameValue}</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            快捷鍵樣式:
          </label>
          <div className="relative">
            <SecureInput
              placeholder="新增快捷鍵..."
              value={shortcutValue}
              onChange={(e) => setShortcutValue(e.target.value)}
              variant="shortcut"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              ⌨️
            </div>
            <button className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-500 text-white text-xs rounded">
              測試
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">值: {shortcutValue}</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            自訂樣式配置:
          </label>
          <SecureInput
            placeholder="自訂樣式..."
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            styleConfig={{
              paddingLeft: '1rem',
              paddingRight: '1rem',
              height: '2.5rem'
            }}
          />
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">測試項目:</h3>
        <ul className="text-sm space-y-1">
          <li>✅ 基本輸入功能</li>
          <li>✅ 樣式配置靈活性</li>
          <li>✅ 防護措施 (檢查開發者工具)</li>
          <li>✅ React 事件處理</li>
          <li>✅ Shadow DOM 隔離</li>
        </ul>
      </div>
    </div>
  );
};

export default SecureInputTest;
