import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import { FontSize } from '@/app/components/fontSizeExtension';
import { FormTextNode } from '@/app/components/tipTapCustomNode/FormTextNode';
import { FormMenuNode } from '@/app/components/tipTapCustomNode/FormMenuNode';
import DOMPurify from 'dompurify';
import type { JSONContent } from '@tiptap/react';

// TipTap 擴展配置 (與編輯器保持一致)
const extensions = [
  StarterKit,
  TextStyle,
  FontSize.configure({ types: ['textStyle'] }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  FormTextNode,
  FormMenuNode,
];

/**
 * 安全的 DOMPurify 配置
 * 允許 TipTap 必要的標籤和屬性，但移除所有危險元素
 */
const SAFE_DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [
    // 基本文字格式
    'p', 'br', 'strong', 'em', 'u', 's', 'code',
    // 標題
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // 列表
    'ul', 'ol', 'li',
    // 其他
    'blockquote', 'div', 'span',
    // 自訂元素
    'formtext', 'formmenu'
  ],
  ALLOWED_ATTR: [
    // TipTap 樣式屬性
    'style', 'class',
    // 自訂節點屬性
    'data-type', 'data-prompt',
    // 文字對齊
    'align'
  ],
  ALLOW_DATA_ATTR: true,
  // 嚴格禁止危險標籤
  FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input', 'button'],
  // 嚴格禁止事件處理器
  FORBID_ATTR: [
    'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout',
    'onfocus', 'onblur', 'onchange', 'onsubmit', 'onkeydown',
    'onkeyup', 'onkeypress', 'onmousedown', 'onmouseup'
  ]
};

/**
 * 從 TipTap JSON 內容生成安全的 HTML
 * 
 * @param jsonContent - TipTap JSON 格式內容
 * @returns 經過 DOMPurify 清理的安全 HTML 字串
 */
export function generateSafeHTML(jsonContent: JSONContent | string | null | undefined): string {
  try {
    // 處理空值
    if (!jsonContent) {
      return '<p></p>';
    }

    // 如果傳入的是字串，假設是舊的 HTML 格式，直接清理
    if (typeof jsonContent === 'string') {
      const cleanContent = jsonContent.trim();
      if (!cleanContent) {
        return '<p></p>';
      }
      return DOMPurify.sanitize(cleanContent, SAFE_DOMPURIFY_CONFIG);
    }

    // 如果是空物件或無效的 JSON 結構，返回預設 HTML
    if (typeof jsonContent === 'object') {
      // 檢查是否為有效的 TipTap JSON
      if (!jsonContent.type || jsonContent.type !== 'doc') {
        return '<p></p>';
      }

      // 檢查是否有 content 陣列
      if (!jsonContent.content || !Array.isArray(jsonContent.content)) {
        return '<p></p>';
      }

      // 如果 content 為空陣列，返回空段落
      if (jsonContent.content.length === 0) {
        return '<p></p>';
      }
    }

    // 從 JSON 生成 HTML
    const html = generateHTML(jsonContent, extensions);
    
    // 使用 DOMPurify 清理生成的 HTML
    const safeHTML = DOMPurify.sanitize(html, SAFE_DOMPURIFY_CONFIG);
    
    // 如果清理後為空，返回預設段落
    return safeHTML.trim() || '<p></p>';
  } catch (error) {
    console.error('生成安全 HTML 時發生錯誤:', error, 'Content:', jsonContent);
    // 發生錯誤時返回安全的預設 HTML
    return '<p></p>';
  }
}

/**
 * 檢查內容是否為 JSON 格式
 * 
 * @param content - 要檢查的內容
 * @returns true 如果是 JSON 格式，false 如果是 HTML 字串
 */
export function isJSONContent(content: unknown): content is JSONContent {
  return (
    typeof content === 'object' &&
    content !== null &&
    ((content as JSONContent).type !== undefined || (content as JSONContent).content !== undefined)
  );
}

/**
 * 兼容處理函數 - 自動判斷內容格式並生成安全 HTML
 * 用於前端顯示時的漸進式遷移策略
 * 
 * @param content - JSON 或 HTML 格式的內容
 * @param contentJSON - 優先使用的 JSON 格式內容 (新格式)
 * @returns 安全的 HTML 字串
 */
export function generateCompatibleSafeHTML(
  content: JSONContent | string | null | undefined, 
  contentJSON?: JSONContent | null | undefined
): string {
  // 優先使用 JSON 格式 (新格式)
  if (contentJSON) {
    return generateSafeHTML(contentJSON);
  }
  
  // 向後相容：使用 HTML 格式 (舊格式)
  if (content) {
    return generateSafeHTML(content);
  }
  
  // 都沒有內容時返回預設
  return '<p></p>';
}

/**
 * 從安全 HTML 中提取純文字 (用於搜尋和預覽)
 * 
 * @param content - JSON 或 HTML 格式的內容
 * @param contentJSON - 優先使用的 JSON 格式內容
 * @returns 純文字內容
 */
export function extractTextContent(
  content: JSONContent | string | null | undefined,
  contentJSON?: JSONContent | null | undefined
): string {
  const safeHTML = generateCompatibleSafeHTML(content, contentJSON);
  
  // 移除所有 HTML 標籤，保留文字內容
  return safeHTML
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 分析內容中的互動元素 (FormText 和 FormMenu)
 * 
 * @param content - JSON 或 HTML 格式的內容
 * @param contentJSON - 優先使用的 JSON 格式內容
 * @returns 互動元素的統計資訊
 */
export function analyzeInteractiveElements(
  content: JSONContent | string | null | undefined,
  contentJSON?: JSONContent | null | undefined
) {
  const safeHTML = generateCompatibleSafeHTML(content, contentJSON);
  
  const formTextMatches = safeHTML.match(/data-type="formtext"/g) || [];
  const formMenuMatches = safeHTML.match(/data-type="formmenu"/g) || [];
  
  const formTextCount = formTextMatches.length;
  const formMenuCount = formMenuMatches.length;
  const totalCount = formTextCount + formMenuCount;
  
  return {
    formTextCount,
    formMenuCount,
    totalCount,
    hasInteractiveElements: totalCount > 0
  };
}