import { useEffect } from 'react';
import { usePromptStore } from '@/stores/prompt';

/**
 * 初始化 Prompt 相關資料的 Hook
 * 負責載入 PromptSpaces，然後根據當前選定的 PromptSpace 載入對應的 Folders
 */
export const usePromptInitialization = () => {
  const {
    promptSpaces,
    currentPromptSpaceId,
    fetchPromptSpaces,
    fetchFolders,
    isLoading: promptSpacesLoading
  } = usePromptStore();

  // 首次載入 PromptSpaces
  useEffect(() => {
    if (promptSpaces.length === 0 && !promptSpacesLoading) {
      console.log('初始化載入 PromptSpaces...');
      fetchPromptSpaces();
    }
  }, [promptSpaces.length, promptSpacesLoading, fetchPromptSpaces]);

  // 當選定的 PromptSpace 改變時，載入對應的 Folders
  useEffect(() => {
    if (currentPromptSpaceId) {
      console.log('載入 PromptSpace 的 Folders:', currentPromptSpaceId);
      fetchFolders(currentPromptSpaceId);
    }
  }, [currentPromptSpaceId, fetchFolders]);

  return {
    isInitialized: promptSpaces.length > 0 && currentPromptSpaceId !== null,
    currentPromptSpaceId,
    promptSpaces,
  };
};
