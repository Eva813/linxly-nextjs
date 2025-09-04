"use client";
import React from "react";
import { usePromptRenderer } from "@/hooks/usePromptRenderer";
import type { JSONContent } from '@tiptap/react';

interface PreviewPromptProps {
  content: string | JSONContent | null | undefined;
  contentJSON?: JSONContent | null | undefined;
  shortcut: string;
}

const PreviewPrompt: React.FC<PreviewPromptProps> = ({ content, contentJSON, shortcut }) => {
  const renderedContent = usePromptRenderer(content, contentJSON);

  return (
    <div className="p-4 space-y-4 h-[calc(100vh-160px)] flex flex-col">
      {/* 顯示提示 / shortcut */}
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="flex items-center">
        <p className="h-4 bg-gray-200 rounded w-1/3 mr-2" />
        <div className="inline-flex items-center rounded-full border border-blue-300 bg-white px-3 text-sm text-gray-700">
          {shortcut}
        </div>
      </div>

      {/* 預覽區塊 */}
      <div className="mt-4 border-2 border-dashed p-4 overflow-auto flex-1">
        {renderedContent}
      </div>
    </div>
  );
};

export default PreviewPrompt;
