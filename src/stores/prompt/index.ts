import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FolderSlice, createFolderSlice } from './slices/folderSlice';
import { PromptSlice, createPromptSlice } from './slices/promptSlice';
import { UISlice, createUISlice } from './slices/uiSlice';
import { FocusSlice, createFocusSlice } from './slices/focusSlice';

// 組合所有模組的型別
export type AppStore = FolderSlice & PromptSlice & UISlice & FocusSlice;

export const usePromptStore = create<AppStore>()(
  persist(
    (set, get, api) => ({
      ...createFolderSlice(set, get, api),
      ...createPromptSlice(set, get, api),
      ...createUISlice(set, get, api),
      ...createFocusSlice(set, get, api),
    }),
    {
      name: 'my-prompts-storage',
      // partialize 使我們只持久化 folders，UI 狀態不必存入 localStorage
      partialize: (state) => ({ folders: state.folders }),
    }
  )
);