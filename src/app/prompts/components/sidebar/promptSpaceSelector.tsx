"use client";

import React, { useEffect, useState } from "react";
import { usePromptSpaceStore } from "@/stores/promptSpace";
import { usePromptSpaceActions } from "@/hooks/promptSpace";
import { usePromptStore } from "@/stores/prompt";
import { useSmartNavigation } from "@/hooks/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { FaSpinner } from "react-icons/fa";
import DeleteSpaceDialog from "./deleteSpaceDialog";

interface PromptSpaceSelectorProps {
  onCreateSpace: () => void;
}

const PromptSpaceSelector: React.FC<PromptSpaceSelectorProps> = ({ onCreateSpace }) => {
  const { 
    spaces, 
    currentSpaceId, 
    setCurrentSpace, 
    getCurrentSpace, 
    isLoading 
  } = usePromptSpaceStore();
  const { fetchSpaces, deleteSpace } = usePromptSpaceActions();
  const { fetchFolders, folders } = usePromptStore();
  const { navigateToFirstFolderIfNeeded, navigation } = useSmartNavigation();

  const currentSpace = getCurrentSpace();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [spaceToDelete, setSpaceToDelete] = useState<{id: string, name: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  // When currentSpaceId changes, fetch folders for that space
  useEffect(() => {
    if (currentSpaceId) {
      fetchFolders(currentSpaceId);
    }
  }, [currentSpaceId, fetchFolders]);

  // 智能導航：只在需要時導航到第一個資料夾
  useEffect(() => {
    if (currentSpaceId && folders.length > 0) {
      navigateToFirstFolderIfNeeded(
        folders, 
        currentSpaceId, 
        navigation.currentFolderId
      );
    }
  }, [folders, currentSpaceId, navigation.currentFolderId, navigateToFirstFolderIfNeeded]);

  const handleSpaceChange = (spaceId: string) => {
    setCurrentSpace(spaceId);
  };

  const handleDeleteClick = (e: React.MouseEvent, space: {id: string, name: string}) => {
    e.stopPropagation();
    setSpaceToDelete(space);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!spaceToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteSpace(spaceToDelete.id);
      setDeleteDialogOpen(false);
      setSpaceToDelete(null);
    } catch (error) {
      console.error('Failed to delete space:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSpaceToDelete(null);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex-1 justify-between h-8 text-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <>
                  <span className="truncate">
                    {currentSpace?.name || "工作空間"}
                  </span>
                  <ChevronDownIcon className="h-4 w-4" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 p-2 mt-2">
            {spaces.map((space, index) => (
              <DropdownMenuItem
                key={space.id}
                onClick={() => handleSpaceChange(space.id)}
                className={`cursor-pointer flex items-center justify-between ${
                  currentSpaceId === space.id ? "bg-accent" : ""
                } ${index > 0 ? "mt-1" : ""}`}
              >
                <span className="flex-1 truncate">{space.name}</span>
                {space.name !== 'promptSpace-default' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-2 hover:bg-red-100 hover:text-red-600"
                    onClick={(e) => handleDeleteClick(e, space)}
                  >
                    <TrashIcon className="h-3 w-3" />
                  </Button>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onCreateSpace}
          className="h-8 w-8 p-0"
          disabled={isLoading}
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>
      
      <DeleteSpaceDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        spaceName={spaceToDelete?.name || ""}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default PromptSpaceSelector;