"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Folder } from "@/types/prompt";
import PromptList from "./promptList";
import LoadingSkeleton from "./components/loadingSkeleton";

const FolderItem = dynamic(() => import("./folderItem"), {
  ssr: false,
  loading: () => <LoadingSkeleton variant="folder" />,
});

interface FolderListProps {
  folders: Folder[];
  activeFolderMenu: string | null;
  setActiveFolderMenu: (id: string | null) => void;
  collapsedFolders: Set<string>;
  toggleCollapse: (folderId: string) => void;
  deleteFolder: (folderId: string) => void;
  pathname: string;
  activePromptMenu: string | null;
  setActivePromptMenu: (id: string | null) => void;
  deletePrompt: (folderId: string, promptId: string) => void;
  isAddingPrompt: boolean;
  targetFolderId: string | null;
  targetPromptId: string | null;
  isAddingFolder: boolean;
}

const FolderList: React.FC<FolderListProps> = ({
  folders,
  activeFolderMenu,
  setActiveFolderMenu,
  collapsedFolders,
  toggleCollapse,
  deleteFolder,
  pathname,
  activePromptMenu,
  setActivePromptMenu,
  deletePrompt,
  isAddingPrompt,
  targetFolderId,
  targetPromptId,
  isAddingFolder,
}) => {
  return (
    <ul className="dark:text-gray-200">
      {folders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          activeFolderMenu={activeFolderMenu}
          setActiveFolderMenu={setActiveFolderMenu}
          collapsedFolders={collapsedFolders}
          toggleCollapse={toggleCollapse}
          deleteFolder={deleteFolder}
          pathname={pathname}
        >
          <PromptList
            folder={folder}
            activePromptMenu={activePromptMenu}
            setActivePromptMenu={setActivePromptMenu}
            deletePrompt={deletePrompt}
            pathname={pathname}
            isAddingPrompt={isAddingPrompt}
            targetFolderId={targetFolderId}
            targetPromptId={targetPromptId}
          />
        </FolderItem>
      ))}
      {isAddingFolder && <LoadingSkeleton variant="folder" />}
    </ul>
  );
};

export default FolderList;
