'use client';

import { useState } from 'react';
import { runSortingTests } from '@/test/sorting-test';
import { runSortingTests as runValidationTests } from '@/test/sort-validation';

/**
 * 排序功能測試展示頁面
 * 用於測試和展示新的排序功能
 */
export default function SortingTestPage() {
  const [testResults, setTestResults] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  const handleRunAPITests = async () => {
    setIsRunning(true);
    setTestResults('開始執行 API 測試...\n');

    // 重新導向 console.log 到畫面上
    const originalLog = console.log;
    console.log = (...args) => {
      setTestResults(prev => prev + args.join(' ') + '\n');
      originalLog(...args);
    };

    try {
      await runSortingTests();
      setTestResults(prev => prev + '\n✅ 所有 API 測試執行完成');
    } catch (error) {
      setTestResults(prev => prev + `\n❌ API 測試執行失敗: ${error}`);
    } finally {
      console.log = originalLog;
      setIsRunning(false);
    }
  };

  const handleRunValidationTests = () => {
    setTestResults('開始執行排序邏輯驗證...\n');

    // 重新導向 console.log 到畫面上
    const originalLog = console.log;
    console.log = (...args) => {
      setTestResults(prev => prev + args.join(' ') + '\n');
      originalLog(...args);
    };

    try {
      const results = runValidationTests();
      setTestResults(prev => prev + '\n✅ 排序邏輯驗證完成');
      setTestResults(prev => prev + `\n📊 測試結果數量: ${Object.keys(results).length}`);
    } catch (error) {
      setTestResults(prev => prev + `\n❌ 驗證測試失敗: ${error}`);
    } finally {
      console.log = originalLog;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Prompt 排序功能測試</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">🎯 測試目標</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><strong>Lazy Migration:</strong> 自動為缺少 seqNo 的舊資料補上排序號碼</li>
          <li><strong>新增 Prompt:</strong> 測試新增到最後和插入到指定位置</li>
          <li><strong>批次重寫:</strong> 測試完整重新排序功能</li>
          <li><strong>穩定排序:</strong> 確保重新整理後順序不會改變</li>
        </ul>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">⚠️ 注意事項</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>此測試需要有效的 Firebase 連線和測試資料</li>
          <li>測試會實際操作資料庫，請在測試環境中執行</li>
          <li>確保有 <code>test-folder-123</code> 資料夾和測試 prompts</li>
        </ul>
      </div>

      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={handleRunValidationTests}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            🧪 排序邏輯驗證
          </button>

          <button
            onClick={handleRunAPITests}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? '🔄 執行中...' : '🌐 API 測試'}
          </button>
        </div>

        <div className="bg-gray-50 border rounded-lg p-4">
          <h3 className="font-semibold mb-2">測試結果:</h3>
          <pre className="text-sm whitespace-pre-wrap bg-white p-3 rounded border min-h-[200px] max-h-[500px] overflow-y-auto">
            {testResults || '點擊上方按鈕開始測試...'}
          </pre>
        </div>
      </div>

      <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">📋 實作清單</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-medium mb-2">✅ 後端 API 更新</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>GET prompts - Lazy Migration</li>
              <li>POST prompts - 插入邏輯</li>
              <li>POST prompts/batch - 批次重寫</li>
              <li>PUT/GET prompts/[id] - seqNo 支援</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">✅ 前端 Store 更新</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Prompt 型別增加 seqNo</li>
              <li>新增 reorderPrompts 方法</li>
              <li>更新 addPromptToFolder 邏輯</li>
              <li>API 函式支援批次操作</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
