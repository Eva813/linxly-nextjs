"use client";

import React, { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { usePromptStore } from "@/stores/prompt";
import { useSidebarStore } from "@/stores/sidebar";
import { useSidebarActions } from "@/hooks/sidebar";
import { useEditableState } from "@/hooks/useEditableState";
import SmartLoadingSkeleton from "./components/smartLoadingSkeleton";
import FolderList from "./folderList";
import PromptSpaceSelector from "./promptSpaceSelector";
import ActionButtons from "./components/actionButtons";

// 懶載入 Modal 組件 (只在用戶點擊創建時才需要)
const CreateSpaceModal = dynamic(() => import("./createSpaceModal"), {
  ssr: false,
});

const SidebarComponent = () => {
  // 選擇性訂閱 Zustand store，只訂閱真正需要的狀態
  // 將不同的狀態訂閱分開，減少不必要的重新渲染
  const folders = usePromptStore(state => state.folders);
  const isLoading = usePromptStore(state => state.isLoading);
  const error = usePromptStore(state => state.error);
  
  // 按鈕相關狀態單獨訂閱
  const isCreatingFolder = useSidebarStore(state => state.isCreatingFolder);
  const isCreatingPrompt = useSidebarStore(state => state.isCreatingPrompt);
  
  const { handleCreateFolder, handleCreatePrompt } = useSidebarActions();
  const { canEdit } = useEditableState();
  const [isCreateSpaceModalOpen, setIsCreateSpaceModalOpen] = useState(false);

  const handleCreateSpaceModalOpen = useCallback(() => {
    setIsCreateSpaceModalOpen(true);
  }, []);

  const handleCreateSpaceModalClose = useCallback(() => {
    setIsCreateSpaceModalOpen(false);
  }, []);

  return (
    <div className="p-4 border-r border-gray-300 h-full flex flex-col">
      <PromptSpaceSelector onCreateSpace={handleCreateSpaceModalOpen} />
      
      {/* 使用抽取的 ActionButtons 組件，確保 props 穩定時不會重新渲染 */}
      <ActionButtons
        onCreateFolder={handleCreateFolder}
        onCreatePrompt={handleCreatePrompt}
        isCreatingFolder={isCreatingFolder}
        isCreatingPrompt={isCreatingPrompt}
        canEdit={canEdit}
      />
      
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="mb-4 p-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-sm">
            {error}
          </div>
        )}

        {isLoading && folders.length === 0 ? (
          <ul>
            {[1, 2, 3].map((i) => (
              <SmartLoadingSkeleton 
                key={i} 
                variant="folder" 
                isLoading={isLoading}
                delayMs={200}
              />
            ))}
          </ul>
        ) : (
          <FolderList />
        )}
      </div>
      
      <CreateSpaceModal 
        isOpen={isCreateSpaceModalOpen} 
        onClose={handleCreateSpaceModalClose} 
      />
    </div>
  );
};

const Sidebar = React.memo(SidebarComponent);

export default Sidebar;
