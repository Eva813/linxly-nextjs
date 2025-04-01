"use client";
import React, { useState, useEffect } from "react";
import { parseHtml } from "@/lib/utils/parseHtml";
import { renderCustomElement } from "./renderers/renderCustomElement";

interface PreviewSnippetProps {
  content: string;
  shortcut: string;
}

const PreviewSnippet: React.FC<PreviewSnippetProps> = ({ content, shortcut }) => {
  const [rendered, setRendered] = useState<React.ReactNode[] | null>(null);
  const VOID_TAGS = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "source", "track", "wbr"
  ]);
  // 遞迴渲染 DOM ➝ React 元素
  const renderNode = (node: ChildNode, key: string): React.ReactNode => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();
    
      if (el.tagName === "SPAN" && el.hasAttribute("data-type")) {
        return renderCustomElement(el, key);
      }
      
      // 遞迴子節點
      const children = Array.from(el.childNodes).map((child, i) =>
        renderNode(child, `${key}-${i}`)
      );

      // void tag，不含 children
      if (VOID_TAGS.has(tagName)) {
        return React.createElement(tagName, { key });
      }
        
      // 建立 style object（使用 Vanilla JS）
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

  useEffect(() => {
    const root = parseHtml(content);
    if (!root) return;

    const children = Array.from(root.childNodes).map((child, i) =>
      renderNode(child, `root-${i}`)
    );

    setRendered(children);
  }, [content]);

  return (
    <main className="p-4 space-y-4 w-full h-[calc(100vh-160px)] flex flex-col">
      {/* 顯示提示 / shortcut */}
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="flex items-center">
        <p className="h-4 bg-gray-200 rounded w-1/3 mr-2" />
        <div className="inline-flex items-center rounded-full border border-blue-300 bg-white px-3 text-sm text-gray-700">
          {shortcut}
        </div>
      </div>

      {/* 預覽區塊 */}
      <div className="mt-4 border-2 border-dashed p-4 overflow-y-auto flex-1">
        {rendered}
      </div>
    </main>
  );
};

export default PreviewSnippet;
