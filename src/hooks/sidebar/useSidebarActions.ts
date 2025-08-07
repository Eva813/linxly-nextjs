import { useCallback, useRef, useEffect } from 'react';
import { useSidebarStore } from '@/stores/sidebar';
import { usePromptStore } from '@/stores/prompt';
import { usePromptSpaceStore } from '@/stores/promptSpace';
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
  const { currentSpaceId } = usePromptSpaceStore();

  // 使用 ref 來保存最新的值，避免 useCallback 依賴問題
  const foldersRef = useRef(folders);
  const currentSpaceIdRef = useRef(currentSpaceId);

  // 更新 ref 值
  useEffect(() => {
    foldersRef.current = folders;
  }, [folders]);

  useEffect(() => {
    currentSpaceIdRef.current = currentSpaceId;
  }, [currentSpaceId]);

  // 決定新增提示時的目標資料夾 - 使用 ref 獲取最新值
  const determineTargetFolder = useCallback((
    currentFolderId?: string,
    currentPromptId?: string
  ): string | null => {
    const currentFolders = foldersRef.current; // 從 ref 獲取最新值
    
    if (currentFolderId) {
      return currentFolderId;
    }

    if (currentPromptId) {
      const containerFolder = currentFolders.find(folder =>
        folder.prompts?.some(prompt => prompt.id === currentPromptId)
      );
      if (containerFolder) {
        return containerFolder.id;
      }
    }

    return currentFolders.length > 0 ? currentFolders[0].id : null;
  }, []); // 不需要任何依賴

  /**
   * 處理新增資料夾的完整流程
   * 包含建立資料夾和自動導航
   */
  const handleCreateFolder = useCallback(async () => {
    const spaceId = currentSpaceIdRef.current; // 從 ref 獲取當前值
    if (!spaceId) {
      console.error('No current space selected');
      return;
    }
    
    setFolderCreationLoading(true);
    
    try {
      const newFolder = await addFolder(DEFAULT_FOLDER_DATA, spaceId);
      
      navigation.navigateToFolder(newFolder.id);
      
      closeAllMenus();
    } catch (error) {
      console.error('處理新增資料夾失敗:', error);
    } finally {
      setFolderCreationLoading(false);
    }
  }, [addFolder, navigation, closeAllMenus, setFolderCreationLoading]); // 穩定的依賴

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
        const currentFolders = foldersRef.current; // 從 ref 獲取最新的 folders
        if (currentFolders.length > 0) {
          // 導航到第一個剩餘資料夾
          navigation.navigateToFolder(currentFolders[0].id);
        } else {
          // 沒有資料夾時導航到提示總覽頁面
          navigation.navigateToPrompts();
        }
      }
    } catch (error) {
      console.error('處理刪除資料夾失敗:', error);
    }
  }, [deleteFolder, navigation, setActiveFolderMenu]); // 移除 folders 依賴

  /**
   * 處理新增提示的完整流程
   * 包含智能目標資料夾選擇和自動導航
   */
  const handleCreatePrompt = useCallback(async () => {
    const currentFolders = foldersRef.current; // 從 ref 獲取當前值
    if (currentFolders.length === 0) {
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
      const spaceId = currentSpaceIdRef.current; // 從 ref 獲取當前值
      if (!spaceId) {
        console.error('No current space selected');
        return;
      }
      
      const newPrompt = await addPromptToFolder(
        targetFolderId,
        DEFAULT_PROMPT_DATA,
        navigation.currentPromptId || undefined,
        spaceId
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
  }, [determineTargetFolder, navigation, setPromptCreationLoading, addPromptToFolder, closeAllMenus]); // 穩定的依賴

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
    const currentFolders = foldersRef.current; // 從 ref 獲取最新值
    return navigation.currentFolderId 
      ? currentFolders.find(f => f.id === navigation.currentFolderId) || null
      : null;
  }, [navigation.currentFolderId]); // 只依賴 currentFolderId

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
