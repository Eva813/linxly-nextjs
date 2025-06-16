"use client";

import React from "react";
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

const PromptList: React.FC<PromptListProps> = ({ folder }) => {
  const { 
    isCreatingPrompt, 
    targetFolderIdForPrompt, 
    insertAfterPromptId 
  } = useSidebarStore();

  const shouldShowLoadingAfterPrompt = (promptId: string): boolean => {
    return (
      isCreatingPrompt &&
      targetFolderIdForPrompt === folder.id &&
      insertAfterPromptId === promptId
    );
  };

  const shouldShowLoadingAtEnd = (): boolean => {
    return (
      isCreatingPrompt &&
      targetFolderIdForPrompt === folder.id &&
      insertAfterPromptId === null
    );
  };

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
      {folder.prompts.map((prompt) => (
        <React.Fragment key={prompt.id}>
          <PromptItem
            prompt={prompt}
            folderId={folder.id}
          />
          {shouldShowLoadingAfterPrompt(prompt.id) && (
            <LoadingSkeleton variant="prompt" />
          )}
        </React.Fragment>
      ))}
      {shouldShowLoadingAtEnd() && <LoadingSkeleton variant="prompt" />}
    </ul>
  );
};

export default PromptList;
