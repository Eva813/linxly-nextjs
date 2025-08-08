"use client";

import React, { useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { Folder } from "@/types/prompt";
import { useSidebarStore } from "@/stores/sidebar";
import LoadingSkeleton from "./components/loadingSkeleton";

const PromptItem = dynamic(() => import("./promptItem"), {
  ssr: false,
  loading: () => <LoadingSkeleton variant="prompt" />,
});

interface PromptListProps {
  folder: Folder;
}

const PromptListComponent: React.FC<PromptListProps> = ({ folder }) => {
  const { 
    isCreatingPrompt, 
    targetFolderIdForPrompt, 
    insertAfterPromptId 
  } = useSidebarStore();

  const shouldShowLoadingAfterPrompt = useCallback((promptId: string): boolean => {
    return (
      isCreatingPrompt &&
      targetFolderIdForPrompt === folder.id &&
      insertAfterPromptId === promptId
    );
  }, [isCreatingPrompt, targetFolderIdForPrompt, folder.id, insertAfterPromptId]);

  const shouldShowLoadingAtEnd = useCallback((): boolean => {
    return (
      isCreatingPrompt &&
      targetFolderIdForPrompt === folder.id &&
      insertAfterPromptId === null
    );
  }, [isCreatingPrompt, targetFolderIdForPrompt, folder.id, insertAfterPromptId]);
  
  const promptItems = useMemo(() => 
    folder.prompts.map((prompt) => (
      <React.Fragment key={prompt.id}>
        <PromptItem
          prompt={prompt}
          folderId={folder.id}
        />
        {shouldShowLoadingAfterPrompt(prompt.id) && (
          <LoadingSkeleton variant="prompt" />
        )}
      </React.Fragment>
    )),
    [folder.prompts, folder.id, shouldShowLoadingAfterPrompt]
  );

  if (folder.prompts.length === 0) {
    return (
      <ul className="ml-6 mt-1">
        <span className="ml-2 text-gray-500">No prompts in the folder</span>
        {shouldShowLoadingAtEnd() && <LoadingSkeleton variant="prompt" />}
      </ul>
    );
  }

  return (
    <ul className="ml-6 mt-1">
      {promptItems}
      {shouldShowLoadingAtEnd() && <LoadingSkeleton variant="prompt" />}
    </ul>
  );
};

// 自定義比較函數確保只在 folder.prompts 真正變化時重新渲染
const PromptList = React.memo(PromptListComponent, (prevProps, nextProps) => {
  // 只比較 folder.id 和 folder.prompts 的長度和內容
  if (prevProps.folder.id !== nextProps.folder.id) return false;
  if (prevProps.folder.prompts.length !== nextProps.folder.prompts.length) return false;
  
  // 比較 prompts 的 id，如果 id 順序和內容相同則認為相等
  return prevProps.folder.prompts.every((prompt, index) => 
    prompt.id === nextProps.folder.prompts[index]?.id
  );
});

export default PromptList;
