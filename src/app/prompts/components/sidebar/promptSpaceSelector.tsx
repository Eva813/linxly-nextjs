"use client";

import React, { useState } from "react";
import { usePromptSpaceStore } from "@/stores/promptSpace";
import { usePromptSpaceActions } from "@/hooks/promptSpace";
import { usePromptStore } from "@/stores/prompt";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { Settings } from "lucide-react";
import { FaSpinner } from "react-icons/fa";
import DeleteSpaceDialog from "./deleteSpaceDialog";
import SpaceSettingsDialog from "./spaceSettingsDialog";
import { useSmartNavigation } from "@/hooks/sidebar/useSmartNavigation";

interface PromptSpaceSelectorProps {
  onCreateSpace: () => void;
}

const PromptSpaceSelector: React.FC<PromptSpaceSelectorProps> = ({ onCreateSpace }) => {
  const {
    ownedSpaces,
    sharedSpaces,
    currentSpaceId,
    getCurrentSpace,
    getCurrentSpaceRole,
    isLoading
  } = usePromptSpaceStore();
  const { deleteSpace, switchToSpace } = usePromptSpaceActions();
  const { navigation } = useSmartNavigation();



  const currentSpace = getCurrentSpace();
  const currentSpaceRole = getCurrentSpaceRole();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [spaceToDelete, setSpaceToDelete] = useState<{ id: string, name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [spaceToEdit, setSpaceToEdit] = useState<{ id: string, name: string } | null>(null);

  // Spaces are already initialized by fullPageLoading, no need to fetch again

  const handleSpaceChange = async (spaceId: string) => {
    try {
      // 1. 切換 space 並載入數據
      await switchToSpace(spaceId);

      // 2. 導航到第一個 folder
      const currentFolders = usePromptStore.getState().folders;
      if (currentFolders.length > 0) {
        navigation.navigateToFolder(currentFolders[0].id);
      }
    } catch (error) {
      console.error('Error in handleSpaceChange:', error);
    }
  };

  const handleSettingsClose = () => {
    setSettingsDialogOpen(false);
    setSpaceToEdit(null);
  };

  const handleDeleteClick = (e: React.MouseEvent, space: { id: string, name: string }) => {
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
                    {currentSpace?.name || "Select a workspace"}
                  </span>
                  <ChevronDownIcon className="h-4 w-4" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 p-2 mt-2">
            {/* Owned Spaces */}
            {ownedSpaces.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  My Workspaces
                </div>
                {ownedSpaces.map((space, index) => (
                  <DropdownMenuItem
                    key={space.id}
                    onClick={() => handleSpaceChange(space.id)}
                    className={`cursor-pointer flex items-center justify-between ${currentSpaceId === space.id ? "bg-accent" : ""
                      } ${index > 0 ? "mt-1" : ""}`}
                  >
                    <span className="flex-1 truncate">{space.name}</span>
                    {space.name !== 'promptSpace-default' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 ml-2 hover:bg-red-100 hover:text-red-600"
                        onClick={(e) => handleDeleteClick(e, space)}
                        title="delete"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                    )}
                  </DropdownMenuItem>
                ))}
              </>
            )}

            {/* Shared Spaces */}
            {sharedSpaces.length > 0 && (
              <>
                {ownedSpaces.length > 0 && <div className="border-t my-2" />}
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  Shared with Me
                </div>
                {sharedSpaces.map((shared, index) => (
                  <DropdownMenuItem
                    key={shared.space.id}
                    onClick={() => handleSpaceChange(shared.space.id)}
                    className={`cursor-pointer flex items-center justify-between ${currentSpaceId === shared.space.id ? "bg-accent" : ""
                      } ${index > 0 ? "mt-1" : ""}`}
                  >
                    <div className="flex-1 flex items-center gap-2">
                      <span className="flex-1 truncate">{shared.space.name}</span>
                      <span className="text-xs text-muted-foreground bg-gray-100 px-1 py-0.5 rounded">
                        {shared.permission}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (currentSpace) {
              setSpaceToEdit({ id: currentSpace.id, name: currentSpace.name });
              setSettingsDialogOpen(true);
            }
          }}
          className="h-8 w-8 p-0"
          disabled={isLoading || !currentSpace || currentSpaceRole === 'view'}
          title={currentSpaceRole === 'view' ? 'View-only access' : 'Configure Current Workspace'}
        >
          <Settings className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onCreateSpace}
          className="h-8 w-8 p-0"
          disabled={isLoading}
          title="Create New Workspace"
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>

      <SpaceSettingsDialog
        isOpen={settingsDialogOpen}
        onClose={handleSettingsClose}
        spaceId={spaceToEdit?.id || ""}
        currentName={spaceToEdit?.name || ""}
      />

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