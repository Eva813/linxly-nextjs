import { useCallback } from 'react';
import { usePromptSpaceStore } from '@/stores/promptSpace';
import { promptSpaceApi } from '@/lib/api/promptSpace';

export const usePromptSpaceActions = () => {
  const { 
    setSpaces, 
    setCurrentSpace, 
    addSpace, 
    updateSpace,
    removeSpace,
    setLoading, 
    setError, 
    setCreatingSpace 
  } = usePromptSpaceStore();

  const fetchSpaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await promptSpaceApi.getAll();
      
      // 轉換 API 回應格式到 store 格式
      const spaces = response.spaces.map(space => ({
        id: space.id,
        name: space.name,
        userId: space.userId,
        createdAt: new Date(space.createdAt)
      }));
      
      setSpaces(spaces);
      
      // 如果沒有當前選中的空間，選擇第一個
      if (spaces.length > 0) {
        setCurrentSpace(spaces[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch prompt spaces:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setSpaces, setCurrentSpace]);

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

  return {
    fetchSpaces,
    createSpace,
    renameSpace,
    deleteSpace
  };
};