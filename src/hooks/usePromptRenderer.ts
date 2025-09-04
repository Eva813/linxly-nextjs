import { useMemo } from "react";
import React from "react";
import { parseHtml } from "@/lib/utils/parseHtml";
import { renderCustomElement } from "@/app/prompts/components/renderers/renderCustomElement";
import { generateCompatibleSafeHTML } from "@/lib/utils/generateSafeHTML";
import type { JSONContent } from '@tiptap/react';

const VOID_TAGS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "source", "track", "wbr"
]);

/**
 * 將 prompt 內容渲染為 React 元素
 * 
 * - 純計算：基於輸入參數進行純函數計算
 * - 性能優化：依賴項不變時不會重新計算
 * 
 * @param content - 文字內容 (舊格式)
 * @param contentJSON - JSON 內容 (新格式)
 * @returns React.ReactNode - 渲染後的 React 元素
 */
export function usePromptRenderer(
  content: string | JSONContent | null | undefined,
  contentJSON?: JSONContent | null | undefined
): React.ReactNode {
  return useMemo(() => {
    // 生成安全的 HTML 內容 - 使用漸進式遷移策略
    const safeHTML = generateCompatibleSafeHTML(content, contentJSON);
    
    // 解析 HTML 為 DOM 樹
    const root = parseHtml(safeHTML);
    if (!root) return null;

    // 遞迴渲染 DOM 節點為 React 元素
    const renderNode = (node: ChildNode, key: string): React.ReactNode => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tagName = el.tagName.toLowerCase();

        // 處理自訂元素 (FormTextNode, FormMenuNode 等)
        if (el.tagName === "SPAN" && el.hasAttribute("data-type")) {
          return renderCustomElement(el, key);
        }

        // 遞迴處理子節點
        const children = Array.from(el.childNodes).map((child, i) =>
          renderNode(child, `${key}-${i}`)
        );

        // 處理 void 標籤 (自閉合標籤)
        if (VOID_TAGS.has(tagName)) {
          return React.createElement(tagName, { key });
        }

        // 處理樣式屬性
        const styleObj: React.CSSProperties = {};
        const style = el.style;

        for (let i = 0; i < style.length; i++) {
          const prop = style.item(i);
          if (!prop) continue;
          const camelProp = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) as keyof React.CSSProperties;
          const value = style.getPropertyValue(prop);
          if (value) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            styleObj[camelProp] = value as any;
          }
        }

        return React.createElement(
          tagName,
          {
            key,
            className: "my-1",
            style: styleObj,
          },
          children
        );
      }

      return null;
    };

    // 渲染根節點的所有子節點
    return Array.from(root.childNodes).map((child, i) =>
      renderNode(child, `root-${i}`)
    );
  }, [content, contentJSON]);
}