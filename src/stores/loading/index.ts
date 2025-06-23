import { create } from 'zustand';

interface LoadingState {
  isLoading: boolean;
  setLoading: (isLoading: boolean) => void;
}

interface SaveState {
  isSaving: boolean;
  promptSaveStates: Record<string, { lastSavedAt: Date | null; hasSaveError: boolean }>;
  setSaving: (isSaving: boolean, promptId?: string) => void;
  setSaved: (promptId: string) => void;
  setSaveError: (hasError: boolean, promptId?: string) => void;
  getSaveStateForPrompt: (promptId: string) => { lastSavedAt: Date | null; hasSaveError: boolean };
}

export const useLoadingStore = create<LoadingState>((set) => ({
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
}));

export const useSaveStore = create<SaveState>((set, get) => ({
  isSaving: false,
  promptSaveStates: {},
  setSaving: (isSaving, promptId) => set((state) => ({
    isSaving,
    promptSaveStates: promptId ? {
      ...state.promptSaveStates,
      [promptId]: {
        lastSavedAt: state.promptSaveStates[promptId]?.lastSavedAt || null,
        hasSaveError: false
      }
    } : state.promptSaveStates
  })),
  setSaved: (promptId) => set((state) => ({
    isSaving: false,
    promptSaveStates: {
      ...state.promptSaveStates,
      [promptId]: {
        lastSavedAt: new Date(),
        hasSaveError: false
      }
    }
  })),
  setSaveError: (hasError, promptId) => set((state) => ({
    isSaving: false,
    promptSaveStates: promptId ? {
      ...state.promptSaveStates,
      [promptId]: {
        lastSavedAt: state.promptSaveStates[promptId]?.lastSavedAt || null,
        hasSaveError: hasError
      }
    } : state.promptSaveStates
  })),
  getSaveStateForPrompt: (promptId) => {
    const state = get();
    return state.promptSaveStates[promptId] || { lastSavedAt: null, hasSaveError: false };
  }
}));