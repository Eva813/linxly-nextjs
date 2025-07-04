import { StateCreator } from 'zustand';
import { SidebarUISlice } from './uiSlice';
import { SidebarLoadingSlice } from './loadingSlice';

export interface SidebarActionsSlice {
  resetAllStates: () => void;
}

export const createSidebarActionsSlice: StateCreator<
  SidebarUISlice & SidebarLoadingSlice & SidebarActionsSlice,
  [["zustand/devtools", never]],
  [],
  SidebarActionsSlice
> = (set) => ({
  resetAllStates: () => {
    set(
      {
        activeFolderMenuId: null,
        activePromptMenuId: null,
        collapsedFolderIds: new Set<string>(),
        
        isCreatingFolder: false,
        isCreatingPrompt: false,
        targetFolderIdForPrompt: null,
        insertAfterPromptId: null,
      },
      false,
      'sidebar/resetAllStates'
    );
  },
});
