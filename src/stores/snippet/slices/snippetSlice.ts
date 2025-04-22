import { StateCreator } from 'zustand';
import { Snippet } from '@/types/snippets';
import { FolderSlice } from './folderSlice';
import { getSnippets, createSnippet, deleteSnippet as apiDeleteSnippet, updateSnippet as apiUpdateSnippet } from '@/api/snippets';

export interface SnippetSlice {
  fetchSnippetsForFolder: (folderId: string) => Promise<void>;
  addSnippetToFolder: (folderId: string, snippet: Omit<Snippet, 'id'>) => Promise<Snippet>;
  deleteSnippetFromFolder: (folderId: string, snippetId: string) => Promise<void>;
  updateSnippet: (snippetId: string, updatedSnippet: Partial<Snippet>) => Promise<Snippet>;
}

// 這裡依賴 FolderSlice，因為 snippets 都儲存在 folders 內
// 修改後，addSnippetToFolder 回傳新 snippet
export const createSnippetSlice: StateCreator<
  FolderSlice & SnippetSlice,
  [],
  [],
  SnippetSlice
> = (set, get) => ({
  fetchSnippetsForFolder: async (folderId) => {
    try {
      const snippets = await getSnippets(folderId);
      set({
        folders: get().folders.map((folder) =>
          folder.id === folderId
            ? { ...folder, snippets }
            : folder
        ),
      });
    } catch (error) {
      console.error('Failed to fetch snippets:', error);
    }
  },
  addSnippetToFolder: async (folderId, snippet) => {
    try {
      const newSnippet = await createSnippet({ folderId, ...snippet });
      set({
        folders: get().folders.map((folder) =>
          folder.id === folderId
            ? { ...folder, snippets: [...folder.snippets, newSnippet] }
            : folder
        ),
      });
      return newSnippet;
    } catch (error) {
      console.error('Failed to add snippet:', error);
      throw error;
    }
  },
  deleteSnippetFromFolder: async (folderId, snippetId) => {
      try {
        await apiDeleteSnippet(snippetId);
        set({
          folders: get().folders.map((folder) =>
            folder.id === folderId
              ? {
                  ...folder,
                  snippets: folder.snippets.filter(
                    (snippet) => snippet.id !== snippetId
                  ),
                }
              : folder
          ),
        });
      } catch (error) {
        console.error('刪除程式碼片段失敗:', error);
        throw error;
      }
    },
  updateSnippet: async (snippetId, updatedSnippet) => {
    try {
      // 忽略 id 欄位，因為 API 不需要
      const {...snippetDataToUpdate } = updatedSnippet;
      
      const updated = await apiUpdateSnippet(snippetId, snippetDataToUpdate);
      
      set({
        folders: get().folders.map((folder) => ({
          ...folder,
          snippets: folder.snippets.map((snippet) =>
            snippet.id === snippetId ? { ...snippet, ...updated } : snippet
          ),
        })),
      });
      
      return updated;
    } catch (error) {
      console.error('更新程式碼片段失敗:', error);
      throw error;
    }
  },
});
