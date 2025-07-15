import { useCallback } from 'react';
import { usePromptSpaceStore } from '@/stores/promptSpace';
import { promptSpaceApi } from '@/lib/api/promptSpace';

export const usePromptSpaceActions = () => {
  const { 
    setAllSpaces,
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
      
      // 如果沒有當前選中的空間，選擇第一個可用的
      const allSpaces = [...ownedSpaces, ...sharedSpaces.map(s => s.space)];
      if (allSpaces.length > 0) {
        setCurrentSpace(allSpaces[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch prompt spaces:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setAllSpaces, setCurrentSpace]);

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