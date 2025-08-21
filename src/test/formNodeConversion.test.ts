/**
 * 測試 FormText 和 FormMenu 節點的 JSON→HTML 轉換
 * 驗證修正後的 renderHTML 方法是否產生正確的 HTML 結構
 */

import { generateSafeHTML } from '@/lib/utils/generateSafeHTML';
import type { JSONContent } from '@tiptap/react';

// 測試用的 FormText JSON 資料
const formTextJSON: JSONContent = {
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
};

// 測試用的 FormMenu JSON 資料
const formMenuJSON: JSONContent = {
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
};

// 複合內容 JSON 資料
const complexJSON: JSONContent = {
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
};

// 執行測試並記錄結果
function runConversionTests() {
  console.log('=== FormText/FormMenu JSON→HTML 轉換測試 ===\n');

  // 測試 FormText
  console.log('1. FormText 轉換測試:');
  console.log('輸入 JSON:', JSON.stringify(formTextJSON, null, 2));
  const formTextHTML = generateSafeHTML(formTextJSON);
  console.log('輸出 HTML:', formTextHTML);
  console.log('包含 data-type="formtext":', formTextHTML.includes('data-type="formtext"'));
  console.log('包含 data-prompt 屬性:', formTextHTML.includes('data-prompt='));
  console.log('包含顯示文字 [userName:請輸入姓名]:', formTextHTML.includes('[userName:請輸入姓名]'));
  console.log('\n');

  // 測試 FormMenu
  console.log('2. FormMenu 轉換測試:');
  console.log('輸入 JSON:', JSON.stringify(formMenuJSON, null, 2));
  const formMenuHTML = generateSafeHTML(formMenuJSON);
  console.log('輸出 HTML:', formMenuHTML);
  console.log('包含 data-type="formmenu":', formMenuHTML.includes('data-type="formmenu"'));
  console.log('包含 data-prompt 屬性:', formMenuHTML.includes('data-prompt='));
  console.log('包含顯示文字 [userRole:用戶]:', formMenuHTML.includes('[userRole:用戶]'));
  console.log('\n');

  // 測試複合內容
  console.log('3. 複合內容轉換測試:');
  console.log('輸入 JSON:', JSON.stringify(complexJSON, null, 2));
  const complexHTML = generateSafeHTML(complexJSON);
  console.log('輸出 HTML:', complexHTML);
  console.log('包含 FormText 元素:', complexHTML.includes('data-type="formtext"'));
  console.log('包含 FormMenu 元素:', complexHTML.includes('data-type="formmenu"'));
  console.log('\n');

  // 分析 data-prompt 屬性內容
  console.log('4. data-prompt 屬性分析:');
  const parser = new DOMParser();
  const doc = parser.parseFromString(complexHTML, 'text/html');
  const formElements = doc.querySelectorAll('span[data-type]');
  
  formElements.forEach((element, index) => {
    const type = element.getAttribute('data-type');
    const promptData = element.getAttribute('data-prompt');
    console.log(`表單元素 ${index + 1}:`);
    console.log(`  類型: ${type}`);
    console.log(`  data-prompt: ${promptData}`);
    try {
      const parsed = JSON.parse(promptData || '{}');
      console.log(`  解析後的 promptData:`, parsed);
    } catch (error) {
      console.log(`  解析失敗: ${error}`);
    }
    console.log('');
  });

  return {
    formTextHTML,
    formMenuHTML,
    complexHTML,
    formElementsCount: formElements.length
  };
}

// 驗證函數：檢查轉換結果是否符合 Chrome Extension 的期望
function validateConversionResult(html: string): boolean {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const formElements = doc.querySelectorAll('span[data-type]');
  
  let isValid = true;
  
  formElements.forEach(element => {
    const type = element.getAttribute('data-type');
    const promptData = element.getAttribute('data-prompt');
    
    if (!type || !promptData) {
      console.error('❌ 表單元素缺少必要屬性:', element.outerHTML);
      isValid = false;
      return;
    }
    
    try {
      const parsed = JSON.parse(promptData);
      if (!parsed.name) {
        console.error('❌ promptData 缺少 name 屬性:', parsed);
        isValid = false;
      }
    } catch (error) {
      console.error('❌ 無法解析 data-prompt:', promptData);
      isValid = false;
    }
  });
  
  return isValid;
}

// 導出測試函數供外部使用
export {
  runConversionTests,
  validateConversionResult,
  formTextJSON,
  formMenuJSON,
  complexJSON
};

// 如果直接執行這個檔案，則運行測試
if (typeof window !== 'undefined') {
  console.log('在瀏覽器環境中執行測試...');
  const results = runConversionTests();
  console.log('測試完成，結果:', results);
}