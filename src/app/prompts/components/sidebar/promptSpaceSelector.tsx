"use client";

import React, { useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { usePromptSpaceStore } from "@/stores/promptSpace";
import { usePromptStore } from "@/stores/prompt";
import { usePromptSpaceActions } from "@/hooks/promptSpace";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, PlusIcon } from "@radix-ui/react-icons";
import { Settings } from "lucide-react";
import { FaSpinner } from "react-icons/fa";
import debounce from "@/lib/utils/debounce";
import SpaceMenuItem from "./spaceMenuItem";
import { useSpaceDialogs } from "./hooks/useSpaceDialogs";
import type { PromptSpaceSelectorProps } from "./types/promptSpaceSelector.types";

// 懶載入 Dialog 組件 (只在用戶點擊時才需要)
const DeleteSpaceDialog = dynamic(() => import("./deleteSpaceDialog"), {
  ssr: false,
});

const SpaceSettingsDialog = dynamic(() => import("./spaceSettingsDialog"), {
  ssr: false,
  loading: () => null,
});


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
  
  // 使用 custom hook 管理 dialog 狀態
  const {
    deleteDialogOpen,
    spaceToDelete,
    isDeleting,
    setIsDeleting,
    openDeleteDialog,
    closeDeleteDialog,
    settingsDialogOpen,
    openSettingsDialog,
    closeSettingsDialog,
  } = useSpaceDialogs();

  // 防抖設置默認 space（3秒延遲）
  const debouncedSetDefault = useRef(
    debounce((...args: unknown[]) => {
      const spaceId = args[0] as string;
      setAsDefaultSpace(spaceId).catch(error => {
        console.error('Failed to auto-set default space:', error);
      });
    }, 3000)
  ).current;

  
  // 使用 ref 來穩定 currentSpaceId 和 router 的引用，避免 useEffect 依賴問題
  const currentSpaceIdRef = useRef(currentSpaceId);
  const routerRef = useRef(router);
  
  useEffect(() => {
    currentSpaceIdRef.current = currentSpaceId;
    routerRef.current = router;
  }, [currentSpaceId, router]);

  // 使用 callback 方式處理導航，避免直接訂閱 folders 狀態
  const handleNavigationAfterSwitch = useCallback(async () => {
    try {
      // 等待一小段時間確保 switchToSpace 完成
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 獲取最新的 folders 狀態
      const currentFolders = usePromptStore.getState().folders;
      
      if (currentFolders.length > 0) {
        const targetPath = `/prompts/folder/${currentFolders[0].id}`;
        routerRef.current.push(targetPath);
      }
    } catch (error) {
      console.error('Navigation after switch failed:', error);
    }
  }, []);

  // 組件卸載時清理
  useEffect(() => {
    return () => {
      // 清理 debounced 函式
      debouncedSetDefault.cancel?.();
    };
  }, [debouncedSetDefault]);



  const currentSpace = getCurrentSpace();
  const currentSpaceRole = getCurrentSpaceRole();

  // 計算 spaceToEdit 值，避免 Derived State anti-pattern
  const spaceToEdit = useMemo(() => 
    settingsDialogOpen && currentSpace 
      ? { id: currentSpace.id, name: currentSpace.name }
      : null
  , [settingsDialogOpen, currentSpace]);

  // Spaces are already initialized by fullPageLoading, no need to fetch again

  const handleSpaceChange = useCallback(async (spaceId: string) => {
    try {
      // 避免重複切換到相同的 space
      if (currentSpaceId === spaceId) return;
      
      // 1. 切換 space 並載入數據 - switchToSpace 會更新所有相關狀態
      await switchToSpace(spaceId);

      // 2. 切換完成後進行導航
      await handleNavigationAfterSwitch();
      
      // 3. 防抖設置為默認 space（3秒後自動設置，如果用戶繼續切換則取消）
      debouncedSetDefault(spaceId);
    } catch (error) {
      console.error('Error in handleSpaceChange:', error);
    }
  }, [currentSpaceId, switchToSpace, debouncedSetDefault, handleNavigationAfterSwitch]);

  const handleDeleteClick = useCallback((e: React.MouseEvent, space: { id: string, name: string }) => {
    e.stopPropagation();
    openDeleteDialog(space);
  }, [openDeleteDialog]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!spaceToDelete) return;

    try {
      setIsDeleting(true);
      await deleteSpace(spaceToDelete.id);
      closeDeleteDialog();
    } catch (error) {
      console.error('Failed to delete space:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [spaceToDelete, deleteSpace, setIsDeleting, closeDeleteDialog]);

  const handleDeleteCancel = useCallback(() => {
    closeDeleteDialog();
  }, [closeDeleteDialog]);

  const handleSettingsClose = useCallback(() => {
    closeSettingsDialog();
  }, [closeSettingsDialog]);

  const handleSettingsClick = useCallback(() => {
    if (currentSpace?.id) {
      openSettingsDialog();
    }
  }, [currentSpace?.id, openSettingsDialog]); // 只依賴 id，避免物件引用變化造成不必要的重新創建

  // 使用 useCallback 穩定化事件處理函數，避免子元件不必要的重新渲染，並加入錯誤處理
  const memoizedHandleSpaceChange = useCallback(async (spaceId: string) => {
    try {
      await handleSpaceChange(spaceId);
    } catch (error) {
      console.error('Failed to change workspace:', error);
      // 這裡可以加入使用者友善的錯誤提示
    }
  }, [handleSpaceChange]);

  const memoizedHandleDeleteClick = useCallback((e: React.MouseEvent, space: { id: string; name: string }) => {
    try {
      handleDeleteClick(e, space);
    } catch (error) {
      console.error('Failed to initiate workspace deletion:', error);
      // 這裡可以加入使用者友善的錯誤提示
    }
  }, [handleDeleteClick]);

  const triggerContent = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
          <FaSpinner className="animate-spin h-3 w-3" />
          <span className="truncate">
            {currentSpace?.name || "Loading..."}
          </span>
        </div>
      );
    }

    return (
      <>
        <span className="truncate">
          {currentSpace?.name || "Select a workspace"}
        </span>
        <ChevronDownIcon className="h-4 w-4" />
      </>
    );
  }, [isLoading, currentSpace?.name]);


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
              {triggerContent}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            className="w-56 p-2 mt-2"
            role="menu"
            aria-label="Workspace selector menu"
          >
            {/* Owned Spaces */}
            {ownedSpaces.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  My Workspaces
                </div>
                {ownedSpaces.map((space, index) => (
                  <SpaceMenuItem
                    key={space.id}
                    space={space}
                    isCurrentSpace={currentSpaceId === space.id}
                    onSpaceClick={memoizedHandleSpaceChange}
                    onDeleteClick={memoizedHandleDeleteClick}
                    index={index}
                  />
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
                  <SpaceMenuItem
                    key={shared.space.id}
                    space={shared.space}
                    isCurrentSpace={currentSpaceId === shared.space.id}
                    onSpaceClick={memoizedHandleSpaceChange}
                    index={index}
                    permission={shared.permission}
                  />
                ))}
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