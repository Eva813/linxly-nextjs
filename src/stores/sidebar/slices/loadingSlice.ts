import { StateCreator } from 'zustand';

export interface SidebarLoadingSlice {
  // 載入狀態
  isCreatingFolder: boolean;
  isCreatingPrompt: boolean;
  targetFolderIdForPrompt: string | null;
  insertAfterPromptId: string | null;
  
  // 載入操作方法
  setFolderCreationLoading: (loading: boolean) => void;
  setPromptCreationLoading: (
    loading: boolean, 
    targetFolderId?: string | null, 
    afterPromptId?: string | null
  ) => void;
  resetLoadingStates: () => void;
}

export const createSidebarLoadingSlice: StateCreator<
  SidebarLoadingSlice,
  [],
  [],
  SidebarLoadingSlice
> = (set) => ({
  isCreatingFolder: false,
  isCreatingPrompt: false,
  targetFolderIdForPrompt: null,
  insertAfterPromptId: null,

  setFolderCreationLoading: (loading: boolean) => {
    set(
      { isCreatingFolder: loading },
      false,
      'sidebar/setFolderCreationLoading'
    );
  },

  setPromptCreationLoading: (
    loading: boolean,
    targetFolderId: string | null = null,
    afterPromptId: string | null = null
  ) => {
    set(
      {
        isCreatingPrompt: loading,
        targetFolderIdForPrompt: targetFolderId,
        insertAfterPromptId: afterPromptId,
      },
      false,
      'sidebar/setPromptCreationLoading'
    );
  },

  resetLoadingStates: () => {
    set(
      {
        isCreatingFolder: false,
        isCreatingPrompt: false,
        targetFolderIdForPrompt: null,
        insertAfterPromptId: null,
      },
      false,
      'sidebar/resetLoadingStates'
    );
  },
});
