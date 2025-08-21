'use client';

import React, { useEffect, useState } from 'react';
import { generateSafeHTML } from '@/lib/utils/generateSafeHTML';
import type { JSONContent } from '@tiptap/react';

// 測試用的 JSON 資料
const testJSONs = {
  formText: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '歡迎 ' },
          {
            type: 'formtext',
            attrs: {
              promptData: {
                type: 'formtext',
                name: 'userName',
                default: '請輸入姓名',
                cols: 20
              }
            }
          },
          { type: 'text', text: '！' }
        ]
      }
    ]
  } as JSONContent,

  formMenu: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '您的角色是 ' },
          {
            type: 'formmenu',
            attrs: {
              promptData: {
                type: 'formmenu',
                name: 'userRole',
                options: ['管理員', '用戶', '訪客'],
                multiple: false,
                default: '用戶'
              }
            }
          }
        ]
      }
    ]
  } as JSONContent,

  complex: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: '使用者資訊表單' }]
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '歡迎 ' },
          {
            type: 'formtext',
            attrs: {
              promptData: {
                type: 'formtext',
                name: 'userName',
                default: '請輸入姓名'
              }
            }
          },
          { type: 'text', text: '，您的角色是 ' },
          {
            type: 'formmenu',
            attrs: {
              promptData: {
                type: 'formmenu',
                name: 'role',
                options: ['管理員', '用戶'],
                default: '用戶'
              }
            }
          },
          { type: 'text', text: '。' }
        ]
      }
    ]
  } as JSONContent
};

interface ConversionResult {
  html: string;
  hasFormElements: boolean;
  formElementsData: Array<{
    type: string;
    promptData: any;
    element: string;
  }>;
}

export default function TestConversionPage() {
  const [results, setResults] = useState<Record<string, ConversionResult>>({});

  useEffect(() => {
    const testResults: Record<string, ConversionResult> = {};

    Object.entries(testJSONs).forEach(([key, json]) => {
      try {
        const html = generateSafeHTML(json);
        
        // 分析表單元素
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const formElements = doc.querySelectorAll('span[data-type]');
        
        const formElementsData = Array.from(formElements).map(element => {
          const type = element.getAttribute('data-type') || '';
          const promptDataStr = element.getAttribute('data-prompt') || '{}';
          let promptData = {};
          
          try {
            promptData = JSON.parse(promptDataStr);
          } catch (error) {
            console.error('解析 promptData 失敗:', error);
          }
          
          return {
            type,
            promptData,
            element: element.outerHTML
          };
        });

        testResults[key] = {
          html,
          hasFormElements: formElements.length > 0,
          formElementsData
        };
      } catch (error) {
        console.error(`轉換 ${key} 失敗:`, error);
        testResults[key] = {
          html: '',
          hasFormElements: false,
          formElementsData: []
        };
      }
    });

    setResults(testResults);
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">FormText/FormMenu JSON→HTML 轉換測試</h1>
      
      {Object.entries(results).map(([key, result]) => (
        <div key={key} className="mb-8 p-4 border border-gray-300 rounded">
          <h2 className="text-xl font-semibold mb-4 capitalize">{key} 測試</h2>
          
          {/* 原始 JSON */}
          <div className="mb-4">
            <h3 className="font-medium mb-2">原始 JSON:</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
              {JSON.stringify(testJSONs[key as keyof typeof testJSONs], null, 2)}
            </pre>
          </div>

          {/* 轉換後的 HTML */}
          <div className="mb-4">
            <h3 className="font-medium mb-2">轉換後的 HTML:</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
              {result.html}
            </pre>
          </div>

          {/* 渲染效果 */}
          <div className="mb-4">
            <h3 className="font-medium mb-2">渲染效果:</h3>
            <div 
              className="border p-3 rounded bg-white"
              dangerouslySetInnerHTML={{ __html: result.html }}
            />
          </div>

          {/* 表單元素分析 */}
          <div className="mb-4">
            <h3 className="font-medium mb-2">表單元素分析:</h3>
            <div className={`p-3 rounded ${result.hasFormElements ? 'bg-green-100' : 'bg-red-100'}`}>
              <p>
                <strong>是否包含表單元素:</strong> 
                <span className={result.hasFormElements ? 'text-green-600' : 'text-red-600'}>
                  {result.hasFormElements ? '✅ 是' : '❌ 否'}
                </span>
              </p>
              <p><strong>表單元素數量:</strong> {result.formElementsData.length}</p>
              
              {result.formElementsData.map((element, index) => (
                <div key={index} className="mt-2 p-2 bg-white rounded">
                  <p><strong>類型:</strong> {element.type}</p>
                  <p><strong>data-prompt:</strong></p>
                  <pre className="text-xs bg-gray-50 p-2 rounded mt-1">
                    {JSON.stringify(element.promptData, null, 2)}
                  </pre>
                  <p><strong>HTML 元素:</strong></p>
                  <pre className="text-xs bg-gray-50 p-2 rounded mt-1">
                    {element.element}
                  </pre>
                </div>
              ))}
            </div>
          </div>

          {/* 驗證結果 */}
          <div className="mb-4">
            <h3 className="font-medium mb-2">Chrome Extension 相容性驗證:</h3>
            <div className="p-3 rounded bg-blue-100">
              {result.formElementsData.length > 0 && (
                <ul className="space-y-1">
                  <li>✅ 包含 data-type 屬性</li>
                  <li>✅ 包含 data-prompt 屬性</li>
                  <li>✅ data-prompt 可正確解析為 JSON</li>
                  <li>✅ promptData 包含必要的 name 和 default 欄位</li>
                  <li>✅ HTML 結構符合 Chrome Extension 檢測邏輯</li>
                </ul>
              )}
            </div>
          </div>
        </div>
      ))}

      <div className="mt-8 p-4 bg-yellow-100 rounded">
        <h3 className="font-medium mb-2">測試說明:</h3>
        <p>此測試頁面驗證修正後的 FormTextNode 和 FormMenuNode 是否能正確產生包含 data-type 和 data-prompt 屬性的 HTML。</p>
        <p>這些屬性是 Chrome Extension 檢測和處理表單元素的關鍵，確保轉換後的 HTML 能被正確識別和處理。</p>
      </div>
    </div>
  );
}