"use client";

import React, { useState, useRef } from "react";
import dynamic from "next/dynamic";
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
import { useSmartNavigation } from "@/hooks/sidebar/useSmartNavigation";
import debounce from "@/lib/utils/debounce";

// 懶載入 Dialog 組件 (只在用戶點擊時才需要)
const DeleteSpaceDialog = dynamic(() => import("./deleteSpaceDialog"), {
  ssr: false,
});

const SpaceSettingsDialog = dynamic(() => import("./spaceSettingsDialog"), {
  ssr: false,
});

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
  const { deleteSpace, switchToSpace, setAsDefaultSpace } = usePromptSpaceActions();
  const { navigation } = useSmartNavigation();

  // 防抖設置默認 space（3秒延遲）
  const debouncedSetDefault = useRef(
    debounce((...args: unknown[]) => {
      const spaceId = args[0] as string;
      setAsDefaultSpace(spaceId).catch(error => {
        console.error('Failed to auto-set default space:', error);
      });
    }, 3000)
  ).current;



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
      // 避免重複切換到相同的 space
      if (currentSpaceId === spaceId) return;
      
      // 1. 切換 space 並載入數據 - switchToSpace 會更新所有相關狀態
      await switchToSpace(spaceId);

      // 2. 導航到第一個 folder - 確保從最新狀態取得 folders
      const freshFolders = usePromptStore.getState().folders;
      if (freshFolders.length > 0) {
        navigation.navigateToFolder(freshFolders[0].id);
      }

      // 3. 防抖設置為默認 space（3秒後自動設置，如果用戶繼續切換則取消）
      debouncedSetDefault(spaceId);
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
                <div className="flex items-center gap-2">
                  <FaSpinner className="animate-spin h-3 w-3" />
                  <span className="truncate">
                    {currentSpace?.name || "Loading..."}
                  </span>
                </div>
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
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="truncate">{space.name}</span>
                      {space.defaultSpace && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0">
                          default
                        </span>
                      )}
                    </div>
                    {!space.defaultSpace && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 ml-2 hover:bg-red-100 hover:text-red-600"
                        onClick={(e) => handleDeleteClick(e, space)}
                        title="Delete workspace"
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