import { useCallback } from 'react';
import { usePromptSpaceStore } from '@/stores/promptSpace';
import { usePromptStore } from '@/stores/prompt';
import { useSidebarNavigation } from '@/hooks/sidebar/useSidebarNavigation';
import { promptSpaceApi } from '@/lib/api/promptSpace';

export const usePromptSpaceActions = () => {
  const {
    setAllSpaces,
    setCurrentSpace,
    loadSpaceOverview,
    addSpace,
    updateSpace,
    removeSpace,
    setLoading,
    setError,
    setCreatingSpace
  } = usePromptSpaceStore();
  const { fetchFolders } = usePromptStore();
  const navigation = useSidebarNavigation();

  const fetchSpaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await promptSpaceApi.getAll();

      // 轉換 owned spaces
      const ownedSpaces = response.ownedSpaces.map(space => ({
        id: space.id,
        name: space.name,
        userId: space.userId,
        createdAt: new Date(space.createdAt),
        updatedAt: space.updatedAt ? new Date(space.updatedAt) : undefined
      }));

      // 轉換 shared spaces
      const sharedSpaces = response.sharedSpaces.map(shared => ({
        space: {
          id: shared.space.id,
          name: shared.space.name,
          userId: shared.space.userId,
          createdAt: new Date(shared.space.createdAt),
          updatedAt: shared.space.updatedAt ? new Date(shared.space.updatedAt) : undefined
        },
        permission: shared.permission,
        sharedBy: shared.sharedBy,
        sharedAt: shared.sharedAt
      }));

      setAllSpaces(ownedSpaces, sharedSpaces);

      // 不在這裡設定 currentSpace，讓 fullPageLoading 處理初始化
    } catch (error) {
      console.error('Failed to fetch prompt spaces:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setAllSpaces]);

  const createSpace = async (name: string) => {
    try {
      setCreatingSpace(true);
      setError(null);

      // 1. 調用 API 創建新的 prompt space（後端只創建 space，不創建 folder）
      const newSpace = await promptSpaceApi.create({ name });

      // 2. 將新創建的 space 添加到本地狀態中
      addSpace({
        id: newSpace.id,
        name: newSpace.name,
        userId: newSpace.userId,
        createdAt: new Date(newSpace.createdAt)
      });

      // 3. 立即切換到新創建的 space 並觸發完整的數據載入流程
      // switchToSpace 會執行以下操作：
      // - setCurrentSpace(spaceId) 
      // - loadSpaceOverview(spaceId) 載入 space 詳細資訊
      // - fetchFolders(spaceId) 載入 folders
      // 
      // 關鍵：fetchFolders 在 folderSlice 中有自動創建預設 folder 的邏輯
      // 當檢測到 folders.length === 0 時，會自動調用 createFolder API
      // 創建名為 "My Sample Prompts" 的預設 folder
      //
      // forceNavigateToFolder=true 確保用戶會被導航到第一個 folder
      console.log('Creating new prompt space:', newSpace);
      await switchToSpace(newSpace.id, true);

      return newSpace;
    } catch (error) {
      console.error('Failed to create prompt space:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      setCreatingSpace(false);
    }
  };

  const renameSpace = useCallback(async (spaceId: string, newName: string) => {
    try {
      setLoading(true);
      setError(null);

      const updatedSpace = await promptSpaceApi.update(spaceId, { name: newName });
      updateSpace(spaceId, {
        name: updatedSpace.name,
        updatedAt: new Date(updatedSpace.updatedAt || updatedSpace.createdAt)
      });

      return updatedSpace;
    } catch (error) {
      console.error('Failed to rename prompt space:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, updateSpace]);

  const deleteSpace = useCallback(async (spaceId: string) => {
    try {
      setLoading(true);
      setError(null);

      await promptSpaceApi.delete(spaceId);
      removeSpace(spaceId);

    } catch (error) {
      console.error('Failed to delete prompt space:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, removeSpace]);

  // 切換 space 並自動獲取該 space 的完整資訊
  const switchToSpace = async (spaceId: string, forceNavigateToFolder = false) => {
    try {
      setCurrentSpace(spaceId);
      // 自動載入 overview 資訊
      await loadSpaceOverview(spaceId);

      // 同步 prompt store 的 folders 資料 - 等待完成後進行導航
      await fetchFolders(spaceId);

      // 使用 prompt store 的最新 folders 數據進行導航
      const { folders } = usePromptStore.getState();

      if (folders && folders.length > 0) {
        const shouldNavigate = forceNavigateToFolder || !navigation.currentPromptId;

        if (shouldNavigate) {
          const firstFolder = folders[0];
          console.log('Smart navigation: navigating to first folder after space switch', {
            folderId: firstFolder.id,
            folderName: firstFolder.name,
            wasViewingPrompt: !!navigation.currentPromptId,
            forceNavigate: forceNavigateToFolder
          });
          navigation.navigateToFolder(firstFolder.id);
        } else {
          console.log('Smart navigation: skipped navigation because user is viewing a prompt');
        }
      }
    } catch (error) {
      console.error('Failed to switch to space:', spaceId, error);
    }
  };

  return {
    fetchSpaces,
    createSpace,
    renameSpace,
    deleteSpace,
    switchToSpace
  };
};