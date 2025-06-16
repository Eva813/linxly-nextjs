"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Prompt, Folder } from "@/types/prompt";
import LoadingSkeleton from "./components/loadingSkeleton";

const PromptItem = dynamic(() => import("./promptItem"), {
  ssr: false,
  loading: () => <LoadingSkeleton variant="prompt" />,
});

interface PromptListProps {
  folder: Folder;
  activePromptMenu: string | null;
  setActivePromptMenu: (id: string | null) => void;
  deletePrompt: (folderId: string, promptId: string) => void;
  pathname: string;
  isAddingPrompt: boolean;
  targetFolderId: string | null;
  targetPromptId: string | null;
}

const PromptList: React.FC<PromptListProps> = ({
  folder,
  activePromptMenu,
  setActivePromptMenu,
  deletePrompt,
  pathname,
  isAddingPrompt,
  targetFolderId,
  targetPromptId,
}) => {
  const shouldShowLoadingAfterPrompt = (promptId: string): boolean => {
    return (
      isAddingPrompt &&
      targetFolderId === folder.id &&
      targetPromptId === promptId
    );
  };

  const shouldShowLoadingAtEnd = (): boolean => {
    return (
      isAddingPrompt &&
      targetFolderId === folder.id &&
      targetPromptId === null
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
            activePromptMenu={activePromptMenu}
            setActivePromptMenu={setActivePromptMenu}
            deleteFile={deletePrompt}
            pathname={pathname}
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
