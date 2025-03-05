import { StateCreator } from 'zustand';
import { Snippet } from '@/types/snippets';
import { FolderSlice } from './folderSlice';

export interface SnippetSlice {
  addSnippetToFolder: (folderId: string, snippet: Omit<Snippet, 'id'>) => void;
  deleteSnippetFromFolder: (folderId: string, snippetId: string) => void;
  updateSnippet: (snippetId: string, updatedSnippet: Partial<Snippet>) => void;
}

// 這裡依賴 FolderSlice，因為 snippets 都儲存在 folders 內
// 指定第四個型別參數 SnippetSlice，代表此 slice 只負責補充 SnippetSlice 的部分
export const createSnippetSlice: StateCreator<FolderSlice & SnippetSlice, [], [], SnippetSlice> = (set, get) => ({
  addSnippetToFolder: (folderId, snippet) => {
    const newSnippet = { ...snippet, id: `snippet-${Date.now()}` };
    set({
      folders: get().folders.map((folder) =>
        folder.id === folderId
          ? { ...folder, snippets: [...folder.snippets, newSnippet] }
          : folder
      ),
    });
  },
  deleteSnippetFromFolder: (folderId, snippetId) =>
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
    }),
  updateSnippet: (snippetId, updatedSnippet) =>
    set({
      folders: get().folders.map((folder) => ({
        ...folder,
        snippets: folder.snippets.map((snippet) =>
          snippet.id === snippetId ? { ...snippet, ...updatedSnippet } : snippet
        ),
      })),
    }),
});
