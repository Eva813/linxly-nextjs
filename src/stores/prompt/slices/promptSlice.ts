import { StateCreator } from 'zustand';
import { Prompt } from '@/types/prompt';
import { FolderSlice } from './folderSlice';
import { getPrompts, createPrompt, deletePrompt as apiDeletePrompt, updatePrompt as apiUpdatePrompt } from '@/api/prompts';

export interface PromptSlice {
  fetchPromptsForFolder: (folderId: string, promptSpaceId?: string) => Promise<void>;
  addPromptToFolder: (folderId: string, prompt: Omit<Prompt, 'id'>, afterPromptId?: string, promptSpaceId?: string) => Promise<Prompt>;
  deletePromptFromFolder: (folderId: string, promptId: string) => Promise<void>;
  updatePrompt: (promptId: string, updatedPrompt: Partial<Prompt>) => Promise<Prompt>;
}

// 這裡依賴 FolderSlice，因為 prompts 都儲存在 folders 內
// 修改後，addPromptToFolder 回傳新 prompt
export const createPromptSlice: StateCreator<
  FolderSlice & PromptSlice,
  [],
  [],
  PromptSlice
> = (set, get) => ({
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
  addPromptToFolder: async (folderId, prompt, afterPromptId, promptSpaceId) => {
    try {
      if (!promptSpaceId) {
        throw new Error('promptSpaceId is required');
      }
      
      // 直接使用 API，讓後端處理所有排序邏輯
      const newPrompt = await createPrompt({ folderId, afterPromptId, promptSpaceId, ...prompt });

      // 重新獲取該資料夾的所有 prompts，確保排序正確
      await get().fetchPromptsForFolder(folderId, promptSpaceId);

      return newPrompt;
    } catch (error) {
      console.error('Failed to add prompt:', error);
      throw error;
    }
  },
  deletePromptFromFolder: async (folderId, promptId) => {
    try {
      await apiDeletePrompt(promptId);
      set({
        folders: get().folders.map((folder) =>
          folder.id === folderId
            ? {
              ...folder,
              prompts: folder.prompts.filter(
                (prompt) => prompt.id !== promptId
              ),
            }
            : folder
        ),
      });
    } catch (error) {
      console.error('刪除提示失敗:', error);
      throw error;
    }
  },
  updatePrompt: async (promptId, updatedPrompt) => {
    try {
      // 忽略 id 欄位，因為 API 不需要
      const { ...promptDataToUpdate } = updatedPrompt;

      const updated = await apiUpdatePrompt(promptId, promptDataToUpdate);

      set({
        folders: get().folders.map((folder) => ({
          ...folder,
          prompts: folder.prompts.map((prompt) =>
            prompt.id === promptId ? { ...prompt, ...updated } : prompt
          ),
        })),
      });

      return updated;
    } catch (error) {
      console.error('更新提示失敗:', error);
      throw error;
    }
  },
});
