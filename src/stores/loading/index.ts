import { create } from 'zustand';

interface LoadingState {
  isLoading: boolean;
  setLoading: (isLoading: boolean) => void;
}

interface SaveState {
  isSaving: boolean;
  promptSaveStates: Record<string, { 
    lastSavedAt: Date | null; 
    hasSaveError: boolean;
    isActive: boolean; // 是否正在編輯或有變更需要儲存
  }>;
  folderSaveStates: Record<string, { 
    lastSavedAt: Date | null; 
    hasSaveError: boolean;
    isActive: boolean; // 是否正在編輯或有變更需要儲存
  }>;
  setSaving: (isSaving: boolean, promptId?: string) => void;
  setSaved: (promptId: string) => void;
  setSaveError: (hasError: boolean, promptId?: string) => void;
  setActive: (isActive: boolean, promptId: string) => void;
  getSaveStateForPrompt: (promptId: string) => { 
    lastSavedAt: Date | null; 
    hasSaveError: boolean;
    isActive: boolean;
  };
  // Folder 相關的方法
  setFolderSaving: (isSaving: boolean, folderId?: string) => void;
  setFolderSaved: (folderId: string) => void;
  setFolderSaveError: (hasError: boolean, folderId?: string) => void;
  setFolderActive: (isActive: boolean, folderId: string) => void;
  getSaveStateForFolder: (folderId: string) => { 
    lastSavedAt: Date | null; 
    hasSaveError: boolean;
    isActive: boolean;
  };
}

export const useLoadingStore = create<LoadingState>((set) => ({
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
}));

export const useSaveStore = create<SaveState>((set, get) => ({
  isSaving: false,
  promptSaveStates: {},
  folderSaveStates: {},
  setSaving: (isSaving, promptId) => set((state) => ({
    isSaving,
    promptSaveStates: promptId ? {
      ...state.promptSaveStates,
      [promptId]: {
        ...state.promptSaveStates[promptId],
        lastSavedAt: state.promptSaveStates[promptId]?.lastSavedAt || null,
        hasSaveError: false,
        isActive: state.promptSaveStates[promptId]?.isActive || false
      }
    } : state.promptSaveStates
  })),
  setSaved: (promptId) => set((state) => ({
    isSaving: false,
    promptSaveStates: {
      ...state.promptSaveStates,
      [promptId]: {
        ...state.promptSaveStates[promptId],
        lastSavedAt: new Date(),
        hasSaveError: false,
        isActive: false // 儲存完成後設為非活躍狀態
      }
    }
  })),
  setSaveError: (hasError, promptId) => set((state) => ({
    isSaving: false,
    promptSaveStates: promptId ? {
      ...state.promptSaveStates,
      [promptId]: {
        ...state.promptSaveStates[promptId],
        lastSavedAt: state.promptSaveStates[promptId]?.lastSavedAt || null,
        hasSaveError: hasError,
        isActive: state.promptSaveStates[promptId]?.isActive || false
      }
    } : state.promptSaveStates
  })),
  setActive: (isActive, promptId) => set((state) => ({
    promptSaveStates: {
      ...state.promptSaveStates,
      [promptId]: {
        ...state.promptSaveStates[promptId],
        lastSavedAt: state.promptSaveStates[promptId]?.lastSavedAt || null,
        hasSaveError: state.promptSaveStates[promptId]?.hasSaveError || false,
        isActive
      }
    }
  })),
  getSaveStateForPrompt: (promptId) => {
    const state = get();
    return state.promptSaveStates[promptId] || { 
      lastSavedAt: null, 
      hasSaveError: false,
      isActive: false
    };
  },
  // Folder 相關的方法實作
  setFolderSaving: (isSaving, folderId) => set((state) => ({
    isSaving,
    folderSaveStates: folderId ? {
      ...state.folderSaveStates,
      [folderId]: {
        ...state.folderSaveStates[folderId],
        lastSavedAt: state.folderSaveStates[folderId]?.lastSavedAt || null,
        hasSaveError: false,
        isActive: state.folderSaveStates[folderId]?.isActive || false
      }
    } : state.folderSaveStates
  })),
  setFolderSaved: (folderId) => set((state) => ({
    isSaving: false,
    folderSaveStates: {
      ...state.folderSaveStates,
      [folderId]: {
        ...state.folderSaveStates[folderId],
        lastSavedAt: new Date(),
        hasSaveError: false,
        isActive: false // 儲存完成後設為非活躍狀態
      }
    }
  })),
  setFolderSaveError: (hasError, folderId) => set((state) => ({
    isSaving: false,
    folderSaveStates: folderId ? {
      ...state.folderSaveStates,
      [folderId]: {
        ...state.folderSaveStates[folderId],
        lastSavedAt: state.folderSaveStates[folderId]?.lastSavedAt || null,
        hasSaveError: hasError,
        isActive: state.folderSaveStates[folderId]?.isActive || false
      }
    } : state.folderSaveStates
  })),
  setFolderActive: (isActive, folderId) => set((state) => ({
    folderSaveStates: {
      ...state.folderSaveStates,
      [folderId]: {
        ...state.folderSaveStates[folderId],
        lastSavedAt: state.folderSaveStates[folderId]?.lastSavedAt || null,
        hasSaveError: state.folderSaveStates[folderId]?.hasSaveError || false,
        isActive
      }
    }
  })),
  getSaveStateForFolder: (folderId) => {
    const state = get();
    return state.folderSaveStates[folderId] || { 
      lastSavedAt: null, 
      hasSaveError: false,
      isActive: false
    };
  }
}));