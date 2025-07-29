import { useCallback } from 'react';
import { usePromptSpaceStore } from '@/stores/promptSpace';
import { usePromptStore } from '@/stores/prompt';
import { getAllPromptSpaces, createPromptSpace, updatePromptSpace, deletePromptSpace, setDefaultSpace } from '@/api/promptSpace';

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

  const fetchSpaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getAllPromptSpaces();

      // 轉換 owned spaces
      const ownedSpaces = response.ownedSpaces.map(space => ({
        id: space.id,
        name: space.name,
        userId: space.userId,
        defaultSpace: space.defaultSpace || false,
        createdAt: new Date(space.createdAt),
        updatedAt: space.updatedAt ? new Date(space.updatedAt) : undefined
      }));

      // 轉換 shared spaces
      const sharedSpaces = response.sharedSpaces.map(shared => ({
        space: {
          id: shared.space.id,
          name: shared.space.name,
          userId: shared.space.userId,
          defaultSpace: shared.space.defaultSpace || false,
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
      const newSpace = await createPromptSpace({ name });

      // 2. 將新創建的 space 添加到本地狀態中
      addSpace({
        id: newSpace.id,
        name: newSpace.name,
        userId: newSpace.userId,
        defaultSpace: newSpace.defaultSpace || false,
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
      // 切換到新創建的 space，載入 folders 數據
      await switchToSpace(newSpace.id);

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

      const updatedSpace = await updatePromptSpace(spaceId, { name: newName });
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

      await deletePromptSpace(spaceId);
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
  const switchToSpace = async (spaceId: string) => {
    try {
      // 設定載入狀態，避免 UI 閃爍
      setLoading(true);

      // 先更新當前 space
      setCurrentSpace(spaceId);

      await Promise.all([
        loadSpaceOverview(spaceId),
        fetchFolders(spaceId)
      ]);
    } catch (error) {
      console.error('Failed to switch to space:', spaceId, error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const setAsDefaultSpace = useCallback(async (spaceId: string) => {
    try {
      setLoading(true);
      setError(null);

      // 調用 API 設置默認 space
      await setDefaultSpace(spaceId);
      
      // 更新本地狀態：將其他 space 設為非默認，目標 space 設為默認
      const { ownedSpaces, sharedSpaces } = usePromptSpaceStore.getState();
      
      // 更新 owned spaces
      const updatedOwnedSpaces = ownedSpaces.map(space => ({
        ...space,
        defaultSpace: space.id === spaceId
      }));
      
      // 更新 shared spaces（雖然共享空間通常不會是用戶的默認，但保持一致性）
      const updatedSharedSpaces = sharedSpaces.map(shared => ({
        ...shared,
        space: {
          ...shared.space,
          defaultSpace: shared.space.id === spaceId
        }
      }));
      
      setAllSpaces(updatedOwnedSpaces, updatedSharedSpaces);
      
    } catch (error) {
      console.error('Failed to set default space:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setAllSpaces]);

  return {
    fetchSpaces,
    createSpace,
    renameSpace,
    deleteSpace,
    switchToSpace,
    setAsDefaultSpace
  };
};