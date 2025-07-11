import { usePromptSpaceStore } from '@/stores/promptSpace';
import { promptSpaceApi } from '@/lib/api/promptSpace';
import { useAuthStore } from '@/stores/auth';

export const usePromptSpaceActions = () => {
  const { user } = useAuthStore();
  const { 
    setSpaces, 
    setCurrentSpace, 
    addSpace, 
    setLoading, 
    setError, 
    setCreatingSpace 
  } = usePromptSpaceStore();

  // Mock user for development - replace with actual auth user
  const mockUser = user || { uid: 'mock-user-id' };

  const fetchSpaces = async () => {
    if (!mockUser?.uid) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await promptSpaceApi.getAll(mockUser.uid);
      setSpaces(response.spaces);
      
      // 如果沒有當前選中的空間，選擇第一個
      if (response.spaces.length > 0) {
        setCurrentSpace(response.spaces[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch prompt spaces:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createSpace = async (name: string) => {
    if (!mockUser?.uid) return;

    try {
      setCreatingSpace(true);
      setError(null);
      
      const newSpace = await promptSpaceApi.create(mockUser.uid, { name });
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

  return {
    fetchSpaces,
    createSpace
  };
};