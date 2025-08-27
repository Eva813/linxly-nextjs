import { useCallback, useRef, useEffect, useMemo } from 'react';
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
  const navigationRef = useRef(navigation);

  // 更新 ref 值
  useEffect(() => {
    foldersRef.current = folders;
  }, [folders]);

  useEffect(() => {
    currentSpaceIdRef.current = currentSpaceId;
  }, [currentSpaceId]);

  useEffect(() => {
    navigationRef.current = navigation;
  }, [navigation]);

  /**
   * 決定新增提示時的目標資料夾
   * 
   * 使用空依賴陣列的安全性說明：
   * - 所有狀態都通過 ref 訪問 (foldersRef.current)，確保獲取最新值
   * - 函式邏輯純粹基於傳入參數，不依賴外部閉包變數
   * - ref.current 的訪問總是同步且即時的，不受 React 渲染週期影響
   * - 避免了因依賴陣列變化導致的函式重新建立和子組件重新渲染
   */
  const determineTargetFolder = useCallback((
    currentFolderId?: string,
    currentPromptId?: string
  ): string | null => {
    const currentFolders = foldersRef.current; // 從 ref 獲取最新值，保證資料即時性
    
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
  }, []); // 空依賴陣列安全：所有狀態通過 ref 訪問，函式邏輯不依賴閉包

  /**
   * 處理新增資料夾的完整流程
   * 包含建立資料夾和自動導航
   * 
   * 空依賴陣列安全性：
   * - currentSpaceIdRef.current 確保獲取最新的 space ID
   * - navigationRef.current 確保使用最新的導航方法
   * - 所有狀態更新函式（addFolder, closeAllMenus 等）來自 store，本身穩定
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
      
      navigationRef.current.navigateToFolder(newFolder.id);
      
      closeAllMenus();
    } catch (error) {
      console.error('處理新增資料夾失敗:', error);
    } finally {
      setFolderCreationLoading(false);
    }
  }, [addFolder, closeAllMenus, setFolderCreationLoading]); // 移除 navigation 依賴

  /**
   * 處理刪除資料夾的完整流程
   * 包含刪除和智能導航
   * 
   * 安全性說明：
   * - navigationRef.current 訪問最新的導航狀態
   * - foldersRef.current 獲取即時的資料夾列表
   * - store 函式 (deleteFolder, setActiveFolderMenu) 本身穩定，不需要額外依賴
   */
  const handleDeleteFolder = useCallback(async (folderId: string) => {
    try {
      await deleteFolder(folderId);
      
      // 關閉資料夾選單
      setActiveFolderMenu(null);
      
      // 如果刪除的是當前正在查看的資料夾，需要導航到其他地方
      if (navigationRef.current.isCurrentFolder(folderId)) {
        const currentFolders = foldersRef.current; // 從 ref 獲取最新的 folders
        if (currentFolders.length > 0) {
          // 導航到第一個剩餘資料夾
          navigationRef.current.navigateToFolder(currentFolders[0].id);
        } else {
          // 沒有資料夾時導航到提示總覽頁面
          navigationRef.current.navigateToPrompts();
        }
      }
    } catch (error) {
      console.error('處理刪除資料夾失敗:', error);
    }
  }, [deleteFolder, setActiveFolderMenu]); // 移除 navigation 依賴

  /**
   * 處理新增提示的完整流程
   * 包含智能目標資料夾選擇和自動導航
   * 
   * 安全性保證：
   * - foldersRef.current、navigationRef.current、currentSpaceIdRef.current 確保獲取最新狀態
   * - determineTargetFolder 已經是穩定的 useCallback，不會導致重新渲染
   * - store 函式 (setPromptCreationLoading, addPromptToFolder, closeAllMenus) 來自 Zustand，本身穩定
   */
  const handleCreatePrompt = useCallback(async () => {
    const currentFolders = foldersRef.current; // 從 ref 獲取當前值
    if (currentFolders.length === 0) {
      console.warn('無可用資料夾，無法新增提示');
      return;
    }

    const currentNavigation = navigationRef.current; // 從 ref 獲取最新的導航信息
    const targetFolderId = determineTargetFolder(
      currentNavigation.currentFolderId || undefined,
      currentNavigation.currentPromptId || undefined
    );
    
    if (!targetFolderId) {
      console.error('無法找到有效的目標資料夾');
      return;
    }

    setPromptCreationLoading(true, targetFolderId, currentNavigation.currentPromptId || null);

    try {
      const spaceId = currentSpaceIdRef.current; // 從 ref 獲取當前值
      if (!spaceId) {
        console.error('No current space selected');
        return;
      }
      
      const newPrompt = await addPromptToFolder(
        targetFolderId,
        DEFAULT_PROMPT_DATA,
        spaceId,
        currentNavigation.currentPromptId || undefined
      );
      
      // 新增成功後自動導航到新提示
      navigationRef.current.navigateToPrompt(newPrompt.id);
      
      // 關閉所有開啟的選單
      closeAllMenus();
    } catch (error) {
      console.error('處理新增提示失敗:', error);
    } finally {
      setPromptCreationLoading(false);
    }
  }, [determineTargetFolder, setPromptCreationLoading, addPromptToFolder, closeAllMenus]); // 移除 navigation 依賴

  /**
   * 處理刪除提示的完整流程
   * 包含刪除和自動導航回資料夾
   * 
   * 安全性說明：
   * - deletePromptFromFolder, setActivePromptMenu 來自 store，本身穩定
   * - navigationRef.current 用於訪問最新的導航方法
   * - 函式僅依賴參數，不依賴外部閉包變數
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
      navigationRef.current.navigateToFolder(folderId);
    } catch (error) {
      console.error('處理刪除提示失敗:', error);
    }
  }, [deletePromptFromFolder, setActivePromptMenu]);

  /**
   * 獲取當前資料夾資訊
   * 
   * 使用空依賴陣列的安全性：
   * - foldersRef.current 獲取最新的資料夾列表
   * - navigationRef.current 獲取最新的導航狀態
   * - 函式邏輯完全基於 ref 中的即時資料，不依賴外部閉包
   * - 返回值為純函式計算結果，無副作用
   */
  const getCurrentFolder = useCallback(() => {
    const currentFolders = foldersRef.current; // 從 ref 獲取最新值
    const currentNavigation = navigationRef.current; // 從 ref 獲取最新值
    return currentNavigation.currentFolderId 
      ? currentFolders.find(f => f.id === currentNavigation.currentFolderId) || null
      : null;
  }, []); // 無依賴，完全穩定

  // 穩定化返回物件，避免不必要的重新渲染
  const stableNavigation = useMemo(() => ({
    pathname: navigation.pathname,
    currentFolderId: navigation.currentFolderId,
    currentPromptId: navigation.currentPromptId,
    isCurrentFolder: navigation.isCurrentFolder,
    isCurrentPrompt: navigation.isCurrentPrompt,
  }), [
    navigation.pathname,
    navigation.currentFolderId,
    navigation.currentPromptId,
    navigation.isCurrentFolder,
    navigation.isCurrentPrompt,
  ]);

  const stableData = useMemo(() => ({
    folders: folders,
    hasFolder: folders.length > 0,
    currentFolder: getCurrentFolder(),
  }), [folders, getCurrentFolder]);

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
    navigation: stableNavigation,
    
    // === 資料狀態 ===
    data: stableData,
  };
};
