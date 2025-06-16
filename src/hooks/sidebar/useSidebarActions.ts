import { useCallback } from 'react';
import { useSidebarStore } from '@/stores/sidebar';
import { usePromptStore } from '@/stores/prompt';
import { useSidebarNavigation } from './useSidebarNavigation';
import { Prompt } from '@/types/prompt';

const DEFAULT_FOLDER_DATA = {
  name: 'New Folder',
  description: '',
  prompts: [] as Prompt[],
} as const;

const DEFAULT_PROMPT_DATA = {
  name: 'New prompt',
  content: 'New prompt content',
  shortcut: '/newPrompt',
} as const;

/**
 * 側邊欄業務邏輯統合 Hook
 * 
 * - 整合導航和資料操作邏輯
 * - 提供高級業務操作方法
 * - 處理複雜的使用者互動流程
 */
export const useSidebarActions = () => {
  const navigation = useSidebarNavigation();
  const { closeAllMenus, setActiveFolderMenu, setActivePromptMenu, setFolderCreationLoading, setPromptCreationLoading } = useSidebarStore();
  const {
    folders,
    addFolder,
    addPromptToFolder,
    deleteFolder,
    deletePromptFromFolder,
  } = usePromptStore();

  // 決定新增提示時的目標資料夾
  const determineTargetFolder = useCallback((
    currentFolderId?: string,
    currentPromptId?: string
  ): string | null => {
    if (currentFolderId) {
      return currentFolderId;
    }

    if (currentPromptId) {
      const containerFolder = folders.find(folder =>
        folder.prompts?.some(prompt => prompt.id === currentPromptId)
      );
      if (containerFolder) {
        return containerFolder.id;
      }
    }

    return folders.length > 0 ? folders[0].id : null;
  }, [folders]);

  /**
   * 處理新增資料夾的完整流程
   * 包含建立資料夾和自動導航
   */
  const handleCreateFolder = useCallback(async () => {
    setFolderCreationLoading(true);
    
    try {
      const newFolder = await addFolder(DEFAULT_FOLDER_DATA);
      
      navigation.navigateToFolder(newFolder.id);
      
      closeAllMenus();
    } catch (error) {
      console.error('處理新增資料夾失敗:', error);
    } finally {
      setFolderCreationLoading(false);
    }
  }, [addFolder, navigation, closeAllMenus, setFolderCreationLoading]);

  /**
   * 處理刪除資料夾的完整流程
   * 包含刪除和智能導航
   */
  const handleDeleteFolder = useCallback(async (folderId: string) => {
    try {
      await deleteFolder(folderId);
      
      // 關閉資料夾選單
      setActiveFolderMenu(null);
      
      // 如果刪除的是當前正在查看的資料夾，需要導航到其他地方
      if (navigation.isCurrentFolder(folderId)) {
        if (folders.length > 0) {
          // 導航到第一個剩餘資料夾
          navigation.navigateToFolder(folders[0].id);
        } else {
          // 沒有資料夾時導航到提示總覽頁面
          navigation.navigateToPrompts();
        }
      }
    } catch (error) {
      console.error('處理刪除資料夾失敗:', error);
    }
  }, [deleteFolder, navigation, setActiveFolderMenu, folders]);

  /**
   * 處理新增提示的完整流程
   * 包含智能目標資料夾選擇和自動導航
   */
  const handleCreatePrompt = useCallback(async () => {
    if (folders.length === 0) {
      console.warn('無可用資料夾，無法新增提示');
      return;
    }

    const targetFolderId = determineTargetFolder(
      navigation.currentFolderId || undefined,
      navigation.currentPromptId || undefined
    );
    
    if (!targetFolderId) {
      console.error('無法找到有效的目標資料夾');
      return;
    }

    setPromptCreationLoading(true, targetFolderId, navigation.currentPromptId || null);

    try {
      const newPrompt = await addPromptToFolder(
        targetFolderId,
        DEFAULT_PROMPT_DATA,
        navigation.currentPromptId || undefined
      );
      
      // 新增成功後自動導航到新提示
      navigation.navigateToPrompt(newPrompt.id);
      
      // 關閉所有開啟的選單
      closeAllMenus();
    } catch (error) {
      console.error('處理新增提示失敗:', error);
    } finally {
      setPromptCreationLoading(false);
    }
  }, [folders, determineTargetFolder, navigation, setPromptCreationLoading, addPromptToFolder, closeAllMenus]);

  /**
   * 處理刪除提示的完整流程
   * 包含刪除和自動導航回資料夾
   */
  const handleDeletePrompt = useCallback(async (
    folderId: string,
    promptId: string
  ) => {
    try {
      await deletePromptFromFolder(folderId, promptId);
      
      // 關閉提示選單
      setActivePromptMenu(null);
      
      // 導航回資料夾頁面
      navigation.navigateToFolder(folderId);
    } catch (error) {
      console.error('處理刪除提示失敗:', error);
    }
  }, [deletePromptFromFolder, navigation, setActivePromptMenu]);

  /**
   * 獲取當前資料夾資訊
   */
  const getCurrentFolder = useCallback(() => {
    return navigation.currentFolderId 
      ? folders.find(f => f.id === navigation.currentFolderId) || null
      : null;
  }, [navigation.currentFolderId, folders]);

  return {
    // === 業務邏輯操作 ===
    handleCreateFolder,
    handleDeleteFolder,
    handleCreatePrompt,
    handleDeletePrompt,
    
    // === 輔助操作 ===
    closeAllMenus,
    getCurrentFolder,
    
    // === 導航資訊 ===
    navigation: {
      pathname: navigation.pathname,
      currentFolderId: navigation.currentFolderId,
      currentPromptId: navigation.currentPromptId,
      isCurrentFolder: navigation.isCurrentFolder,
      isCurrentPrompt: navigation.isCurrentPrompt,
    },
    
    // === 資料狀態 ===
    data: {
      folders: folders,
      hasFolder: folders.length > 0,
      currentFolder: getCurrentFolder(),
    },
  };
};
