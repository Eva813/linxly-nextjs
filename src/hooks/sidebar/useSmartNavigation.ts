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

    // 檢查當前是否在 prompt 頁面 - 如果是，不要進行自動導航
    if (navigation.currentPromptId) {
      console.log('Smart navigation skipped: user is viewing a prompt');
      return;
    }

    // 如果是不同的 space，導航到第一個資料夾
    if (lastNavigatedSpaceRef.current !== currentSpaceId) {
      console.log('Smart navigation: switching to first folder of new space', {
        lastNavigatedSpace: lastNavigatedSpaceRef.current,
        currentSpaceId,
        firstFolderId: folders[0]?.id
      });
      // 延遲導航，避免在快速切換時造成不必要的導航
      navigationTimeoutRef.current = setTimeout(() => {
        navigation.navigateToFolder(folders[0].id);
        lastNavigatedSpaceRef.current = currentSpaceId;
        console.log('Smart navigation: updated lastNavigatedSpace to', currentSpaceId);
      }, 100);
      return;
    }

    // 如果是同一個 space，但沒有選中任何資料夾，導航到第一個
    if (!currentFolderId && folders.length > 0) {
      console.log('Smart navigation: no folder selected, navigating to first folder');
      navigationTimeoutRef.current = setTimeout(() => {
        navigation.navigateToFolder(folders[0].id);
      }, 100);
    }

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