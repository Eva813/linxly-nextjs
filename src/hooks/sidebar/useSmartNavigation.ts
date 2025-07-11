import { useCallback, useRef } from 'react';
import { useSidebarNavigation } from './useSidebarNavigation';
import { Folder } from '@/types/prompt';

/**
 * 智能導航 Hook
 * 避免不必要的導航和閃爍問題
 */
export const useSmartNavigation = () => {
  const navigation = useSidebarNavigation();
  const lastNavigatedSpaceRef = useRef<string | null>(null);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 智能導航到第一個資料夾
   * 只在真正需要時進行導航
   */
  const navigateToFirstFolderIfNeeded = useCallback((
    folders: Folder[], 
    currentSpaceId: string,
    currentFolderId: string | null
  ) => {
    // 清除之前的計時器
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    // 如果沒有資料夾，不進行導航
    if (folders.length === 0) return;

    // 如果當前已經在某個資料夾頁面，且該資料夾存在於新的 space 中，不進行導航
    if (currentFolderId && folders.some(folder => folder.id === currentFolderId)) {
      return;
    }

    // 如果是同一個 space，不進行導航
    if (lastNavigatedSpaceRef.current === currentSpaceId) {
      return;
    }

    // 延遲導航，避免在快速切換時造成不必要的導航
    navigationTimeoutRef.current = setTimeout(() => {
      navigation.navigateToFolder(folders[0].id);
      lastNavigatedSpaceRef.current = currentSpaceId;
    }, 300);

  }, [navigation]);

  /**
   * 重置導航狀態
   */
  const resetNavigation = useCallback(() => {
    lastNavigatedSpaceRef.current = null;
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
  }, []);

  return {
    navigateToFirstFolderIfNeeded,
    resetNavigation,
    navigation
  };
};