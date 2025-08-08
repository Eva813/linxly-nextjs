"use client";

import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { FaFolderPlus, FaFileMedical, FaSpinner } from "react-icons/fa";

interface ActionButtonsProps {
  onCreateFolder: () => void;
  onCreatePrompt: () => void;
  isCreatingFolder: boolean;
  isCreatingPrompt: boolean;
  canEdit: boolean;
}

// 抽取為獨立的 memo 組件，確保 props 完全穩定時不會重新渲染
const ActionButtons: React.FC<ActionButtonsProps> = React.memo(({
  onCreateFolder,
  onCreatePrompt,
  isCreatingFolder,
  isCreatingPrompt,
  canEdit
}) => {
  
  const isAddFolderDisabled = useMemo(() => 
    isCreatingFolder || !canEdit, 
    [isCreatingFolder, canEdit]
  );
  
  const isAddPromptDisabled = useMemo(() => 
    isCreatingPrompt || !canEdit, 
    [isCreatingPrompt, canEdit]
  );

  return (
    <div className="grid grid-cols-2 gap-x-4 mb-4 sticky top-0 bg-white dark:bg-gray-900 z-10">
      <Button
        className="h-8 dark:text-third"
        onClick={onCreateFolder}
        disabled={isAddFolderDisabled}
      >
        {isCreatingFolder ? <FaSpinner className="animate-spin" /> : <FaFolderPlus />}
        Add Folder
      </Button>
      <Button
        className="h-8 dark:text-third"
        onClick={onCreatePrompt}
        disabled={isAddPromptDisabled}
      >
        {isCreatingPrompt ? <FaSpinner className="animate-spin" /> : <FaFileMedical />}
        Add Prompt
      </Button>
    </div>
  );
});

ActionButtons.displayName = 'ActionButtons';

export default ActionButtons;
