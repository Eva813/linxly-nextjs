import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FolderSlice, createFolderSlice } from './slices/folderSlice';
import { SnippetSlice, createSnippetSlice } from './slices/snippetSlice';
import { UISlice, createUISlice } from './slices/uiSlice';

// 組合所有模組的型別
export type AppStore = FolderSlice & SnippetSlice & UISlice;

export const useSnippetStore = create<AppStore>()(
  persist(
    (set, get, api) => ({
      ...createFolderSlice(set, get, api),
      ...createSnippetSlice(set, get, api),
      ...createUISlice(set, get, api),
    }),
    {
      name: 'my-snippets-storage',
      // partialize 使我們只持久化 folders，UI 狀態不必存入 localStorage
      partialize: (state) => ({ folders: state.folders }),
    }
  )
);