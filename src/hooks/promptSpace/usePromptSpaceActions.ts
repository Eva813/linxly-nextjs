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
    getCurrentSpaceOverview,
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
      
      const newSpace = await promptSpaceApi.create({ name });
      addSpace({
        id: newSpace.id,
        name: newSpace.name,
        userId: newSpace.userId,
        createdAt: new Date(newSpace.createdAt)
      });
      
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
      
      // fetchFolders 完成後，store 的 folders 應該已經更新
      // 導航邏輯：只有在強制導航或用戶不在查看 prompt 時才導航
      const overview = getCurrentSpaceOverview();
      if (overview?.folders && overview.folders.length > 0) {
        const shouldNavigate = forceNavigateToFolder || !navigation.currentPromptId;
        
        if (shouldNavigate) {
          const firstFolder = overview.folders[0];
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