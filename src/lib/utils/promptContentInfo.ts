import {
  generateCompatibleSafeHTML,
  analyzeInteractiveElements,
  extractTextContent,
} from '@/lib/utils/generateSafeHTML';
import type { JSONContent } from '@tiptap/react';

export interface PromptContentInfo {
  interactiveCount: number;
  cleanText: string;
  formTextCount: number;
  formMenuCount: number;
}

/**
 * 提取並分析 Prompt 內容資訊
 * 統一處理內容的清理、分析和格式化
 */
export const extractContentInfo = (
  content: JSONContent | string | object | null | undefined,
  contentJSON?: JSONContent | object | null | undefined
): PromptContentInfo => {
  const analysis = analyzeInteractiveElements(content, contentJSON);
  const safeHTML = generateCompatibleSafeHTML(content, contentJSON);
  let cleanText = extractTextContent(content, contentJSON);

  // 根據互動元素數量調整顯示方式
  if (analysis.totalCount <= 4) {
    cleanText = safeHTML
      .replace(
        /<span[^>]*data-type="formtext"[^>]*><\/span>/g,
        ' [input field] '
      )
      .replace(
        /<span[^>]*data-type="formmenu"[^>]*><\/span>/g,
        ' [dropdown menu] '
      );
  } else {
    cleanText = safeHTML.replace(
      /<span[^>]*data-type="[^"]*"[^>]*><\/span>/g,
      ' [...] '
    );
  }

  cleanText = cleanText
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    interactiveCount: analysis.totalCount,
    cleanText,
    formTextCount: analysis.formTextCount,
    formMenuCount: analysis.formMenuCount,
  };
};
