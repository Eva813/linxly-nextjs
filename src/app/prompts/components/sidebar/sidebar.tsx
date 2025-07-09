"use client";

import React from "react";
import { usePromptStore } from "@/stores/prompt";
import { useSidebarStore } from "@/stores/sidebar";
import { useSidebarActions } from "@/hooks/sidebar";
import { Button } from "@/components/ui/button";
import { FaFolderPlus, FaFileMedical, FaSpinner } from "react-icons/fa";
import { Skeleton } from "@/components/ui/skeleton";
import FolderList from "./folderList";
import PromptSpaceSelector from "./promptSpaceSelector";

const Sidebar = () => {
  const { folders, isLoading, error } = usePromptStore();
  const { isCreatingFolder, isCreatingPrompt } = useSidebarStore();
  const { handleCreateFolder, handleCreatePrompt } = useSidebarActions();

  return (
    <div className="p-4 border-r border-gray-300 h-full flex flex-col">
      <PromptSpaceSelector />

      <div className="grid grid-cols-2 gap-x-4 mb-4 sticky top-0 bg-white dark:bg-gray-900 z-10">
        <Button
          className="h-8 dark:text-third"
          onClick={handleCreateFolder}
          disabled={isCreatingFolder}
        >
          {isCreatingFolder ? <FaSpinner className="animate-spin" /> : <FaFolderPlus />}
          Add Folder
        </Button>
        <Button
          className="h-8 dark:text-third"
          onClick={handleCreatePrompt}
          disabled={isCreatingPrompt}
        >
          {isCreatingPrompt ? <FaSpinner className="animate-spin" /> : <FaFileMedical />}
          Add Prompt
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="mb-4 p-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-sm">
            {error}
          </div>
        )}

        {isLoading && folders.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-full rounded-md" />
            ))}
          </div>
        ) : (
          <FolderList />
        )}
      </div>
    </div>
  );
};

export default Sidebar;
