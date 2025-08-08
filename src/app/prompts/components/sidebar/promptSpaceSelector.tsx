"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { usePromptSpaceStore } from "@/stores/promptSpace";
import { usePromptStore } from "@/stores/prompt";
import { usePromptSpaceActions } from "@/hooks/promptSpace";
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
  const router = useRouter();
  const {
    ownedSpaces,
    sharedSpaces,
    currentSpaceId,
    getCurrentSpace,
    getCurrentSpaceRole,
    isLoading
  } = usePromptSpaceStore();
  const { deleteSpace, switchToSpace, setAsDefaultSpace } = usePromptSpaceActions();
  
  // 訂閱 folders 狀態
  const folders = usePromptStore(state => state.folders);

  // 防抖設置默認 space（3秒延遲）
  const debouncedSetDefault = useRef(
    debounce((...args: unknown[]) => {
      const spaceId = args[0] as string;
      setAsDefaultSpace(spaceId).catch(error => {
        console.error('Failed to auto-set default space:', error);
      });
    }, 3000)
  ).current;

    // 用於追蹤是否需要在 folders 更新後進行導航
  const pendingNavigationRef = useRef<string | null>(null);
  
  // 追蹤上一次的 folders，用來檢測 folders 真正的變化
  const prevFoldersRef = useRef<string[]>(folders.map(f => f.id));

  // 監聽 folders 變化，當切換 space 後自動導航
  useEffect(() => {
    const pendingSpaceId = pendingNavigationRef.current;
    const currentFolderIds = folders.map(f => f.id);
    const prevFolderIds = prevFoldersRef.current;
    
    // 檢查 folders 是否真正發生了變化 (不只是順序，而是實際內容)
    const foldersChanged = JSON.stringify(currentFolderIds.sort()) !== JSON.stringify(prevFolderIds.sort());
    
    console.log('useEffect triggered:', {
      pendingSpaceId,
      currentSpaceId,
      foldersLength: folders.length,
      firstFolderId: folders[0]?.id,
      foldersChanged
    });

    if (pendingSpaceId && 
        folders.length > 0 && 
        pendingSpaceId === currentSpaceId &&
        foldersChanged) {
      
      // folders 內容發生變化且 space 匹配，進行導航
      const targetPath = `/prompts/folder/${folders[0].id}`;
      console.log('Navigating to folder:', folders[0].id, 'from space:', currentSpaceId);
      router.push(targetPath);
      pendingNavigationRef.current = null; // 清除待處理的導航
      console.log('Navigation executed, pending cleared');
    }
    
    // 更新 prevFoldersRef
    prevFoldersRef.current = currentFolderIds;
    
  }, [folders, currentSpaceId, router]);

  // 組件卸載時清理
  useEffect(() => {
    return () => {
      // 清理 debounced 函式
      debouncedSetDefault.cancel?.();
      // 清除待處理的導航
      pendingNavigationRef.current = null;
      // 重置 prevFoldersRef
      prevFoldersRef.current = [];
    };
  }, [debouncedSetDefault]);



  const currentSpace = getCurrentSpace();
  const currentSpaceRole = getCurrentSpaceRole();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [spaceToDelete, setSpaceToDelete] = useState<{ id: string, name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [spaceToEdit, setSpaceToEdit] = useState<{ id: string, name: string } | null>(null);

  // Spaces are already initialized by fullPageLoading, no need to fetch again

  const handleSpaceChange = useCallback(async (spaceId: string) => {
    try {
      // 避免重複切換到相同的 space
      if (currentSpaceId === spaceId) return;
      
      console.log('handleSpaceChange called:', { spaceId, currentSpaceId });
      
      // 1. 設置待處理的導航標記
      pendingNavigationRef.current = spaceId;
      console.log('Set pending navigation:', spaceId);
      
      // 2. 切換 space 並載入數據 - switchToSpace 會更新所有相關狀態
      await switchToSpace(spaceId);
      console.log('switchToSpace completed');

      // 3. 不在這裡立即導航，讓 useEffect 處理
      // 因為 React 狀態更新是異步的，此時的 folders 可能還是舊的
      console.log('Waiting for useEffect to handle navigation...');
      
      // 4. 防抖設置為默認 space（3秒後自動設置，如果用戶繼續切換則取消）
      debouncedSetDefault(spaceId);
    } catch (error) {
      console.error('Error in handleSpaceChange:', error);
      // 發生錯誤時清除待處理的導航
      pendingNavigationRef.current = null;
    }
  }, [currentSpaceId, switchToSpace, debouncedSetDefault]);

  const handleDeleteClick = useCallback((e: React.MouseEvent, space: { id: string, name: string }) => {
    e.stopPropagation();
    setSpaceToDelete(space);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
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
  }, [spaceToDelete, deleteSpace]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setSpaceToDelete(null);
  }, []);

  const handleSettingsClose = useCallback(() => {
    setSettingsDialogOpen(false);
    setSpaceToEdit(null);
  }, []);

  const handleSettingsClick = useCallback(() => {
    if (currentSpace) {
      setSpaceToEdit({ id: currentSpace.id, name: currentSpace.name });
      setSettingsDialogOpen(true);
    }
  }, [currentSpace]);

  const renderSpaceAction = useCallback((space: { id: string, name: string, defaultSpace?: boolean }) => {
    if (space.defaultSpace) {
      return (
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 ml-2">
          default
        </span>
      );
    }

    const handleClick = (e: React.MouseEvent) => handleDeleteClick(e, space);

    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 ml-2 hover:bg-red-100 hover:text-red-600"
        onClick={handleClick}
        title="Delete workspace"
      >
        <TrashIcon className="h-3 w-3" />
      </Button>
    );
  }, [handleDeleteClick]);


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
                {ownedSpaces.map((space, index) => {
                  const handleClick = () => handleSpaceChange(space.id);
                  return (
                    <DropdownMenuItem
                      key={space.id}
                      onClick={handleClick}
                      className={`cursor-pointer flex items-center justify-between ${currentSpaceId === space.id ? "bg-accent" : ""
                        } ${index > 0 ? "mt-1" : ""}`}
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <span className="truncate">{space.name}</span>
                      </div>
                      {renderSpaceAction(space)}
                    </DropdownMenuItem>
                  );
                })}
              </>
            )}

            {/* Shared Spaces */}
            {sharedSpaces.length > 0 && (
              <>
                {ownedSpaces.length > 0 && <div className="border-t my-2" />}
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  Shared with Me
                </div>
                {sharedSpaces.map((shared, index) => {
                  const handleClick = () => handleSpaceChange(shared.space.id);
                  return (
                    <DropdownMenuItem
                      key={shared.space.id}
                      onClick={handleClick}
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
                  );
                })}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSettingsClick}
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