import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FolderSlice, createFolderSlice } from './slices/folderSlice';
import { PromptSlice, createPromptSlice } from './slices/promptSlice';
import { UISlice, createUISlice } from './slices/uiSlice';
import { FocusSlice, createFocusSlice } from './slices/focusSlice';
import { PromptSpaceSlice, createPromptSpaceSlice } from './slices/promptSpaceSlice';

// 組合所有模組的型別
export type AppStore = FolderSlice & PromptSlice & UISlice & FocusSlice & PromptSpaceSlice;

export const usePromptStore = create<AppStore>()(
  persist(
    (set, get, api) => ({
      ...createFolderSlice(set, get, api),
      ...createPromptSlice(set, get, api),
      ...createUISlice(set, get, api),
      ...createFocusSlice(set, get, api),
      ...createPromptSpaceSlice(set, get, api),
    }),
    {
      name: 'my-prompts-storage',
      // partialize 使我們只持久化 folders 和 promptSpaces，UI 狀態不必存入 localStorage
      partialize: (state) => ({
        folders: state.folders,
        promptSpaces: state.promptSpaces,
        currentPromptSpaceId: state.currentPromptSpaceId
      }),
    }
  )
);