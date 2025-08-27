import { StateCreator } from 'zustand';
import { Prompt, Folder } from '@/types/prompt';
import { FolderSlice } from './folderSlice';
import { getPrompts, createPrompt, deletePrompt as apiDeletePrompt, updatePrompt as apiUpdatePrompt } from '@/api/prompts';
import debounce from '@/lib/utils/debounce';

export interface PromptSlice {
  fetchPromptsForFolder: (folderId: string, promptSpaceId?: string) => Promise<void>;
  addPromptToFolder: (folderId: string, prompt: Omit<Prompt, 'id'>, promptSpaceId: string, afterPromptId?: string) => Promise<Prompt>;
  deletePromptFromFolder: (folderId: string, promptId: string) => Promise<void>;
  updatePrompt: (promptId: string, updatedPrompt: Partial<Prompt>, promptSpaceId?: string) => Promise<Prompt>;
  
  // 內部防抖方法
  _debouncedRefreshFolder: (folderId: string, promptSpaceId: string) => void;
}

// 這裡依賴 FolderSlice，因為 prompts 都儲存在 folders 內
// 修改後，addPromptToFolder 回傳新 prompt
export const createPromptSlice: StateCreator<
  FolderSlice & PromptSlice,
  [],
  [],
  PromptSlice
> = (set, get) => {
  // 創建防抖函數，延遲 60ms 執行資料夾刷新，避免頻繁 API 呼叫且減少視覺延遲
  const debouncedRefresh = debounce((...args: unknown[]) => {
    const [folderId, promptSpaceId] = args as [string, string];
    get().fetchPromptsForFolder(folderId, promptSpaceId).catch(error => {
      console.error('Debounced refresh failed:', error);
    });
  }, 60);

  return {
  fetchPromptsForFolder: async (folderId, promptSpaceId) => {
    try {
      const prompts = await getPrompts(folderId, promptSpaceId);
      set({
        folders: get().folders.map((folder) =>
          folder.id === folderId
            ? { ...folder, prompts }
            : folder
        ),
      });
    } catch (error) {
      console.error('Failed to fetch prompts:', error);
    }
  },
  addPromptToFolder: async (folderId, prompt, promptSpaceId, afterPromptId) => {
    try {
      // 使用 API，傳入 promptSpaceId 進行驗證和確保資料一致性
      const newPrompt = await createPrompt({ folderId, promptSpaceId, afterPromptId, ...prompt });

      // 條件性本地更新：只在安全的情況下立即更新
      if (!afterPromptId) {
        // 沒有插入需求，安全地添加到最後，消除視覺延遲
        set(state => ({
          folders: state.folders.map(folder => 
            folder.id === folderId 
              ? { ...folder, prompts: [...folder.prompts, newPrompt] }
              : folder
          )
        }));
      }
      // 有 afterPromptId 時不做本地更新，等 debounce 處理確保順序正確

      // 背景同步確保最終資料一致性（順序、seqNo等）
      get()._debouncedRefreshFolder(folderId, promptSpaceId);

      return newPrompt;
    } catch (error) {
      console.error('Failed to add prompt:', error);
      throw error;
    }
  },
  deletePromptFromFolder: async (folderId, promptId) => {
    try {
      await apiDeletePrompt(promptId);
      set((state) => ({
        folders: state.folders.map((folder) =>
          folder.id === folderId
            ? {
              ...folder,
              prompts: folder.prompts.filter(
                (prompt) => prompt.id !== promptId
              ),
            }
            : folder
        ),
        // 同步更新快取
        folderCache: Object.keys(state.folderCache).reduce((acc, spaceId) => {
          acc[spaceId] = {
            ...state.folderCache[spaceId],
            folders: state.folderCache[spaceId].folders.map((folder) =>
              folder.id === folderId
                ? {
                  ...folder,
                  prompts: folder.prompts.filter(
                    (prompt) => prompt.id !== promptId
                  ),
                }
                : folder
            ),
            lastFetched: Date.now()
          };
          return acc;
        }, {} as Record<string, { folders: Folder[]; lastFetched: number }>)
      }));
    } catch (error) {
      console.error('刪除提示失敗:', error);
      throw error;
    }
  },
  updatePrompt: async (promptId, updatedPrompt, promptSpaceId) => {
    try {
      // 忽略 id 欄位，因為 API 不需要
      const { ...promptDataToUpdate } = updatedPrompt;

      const updated = await apiUpdatePrompt(promptId, promptDataToUpdate);

      // 如果提供了 promptSpaceId，清除該 space 的快取確保資料同步
      if (promptSpaceId) {
        get().clearSpaceCache(promptSpaceId);
      }

      set((state) => ({
        folders: state.folders.map((folder) => ({
          ...folder,
          prompts: folder.prompts.map((prompt) =>
            prompt.id === promptId ? { ...prompt, ...updated } : prompt
          ),
        })),
      }));

      return updated;
    } catch (error) {
      console.error('更新提示失敗:', error);
      throw error;
    }
  },

  // 內部防抖方法
  _debouncedRefreshFolder: (folderId: string, promptSpaceId: string) => {
    get().clearSpaceCache(promptSpaceId);
    debouncedRefresh(folderId, promptSpaceId);
  }
  };
};
