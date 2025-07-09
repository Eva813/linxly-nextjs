import { StateCreator } from 'zustand';
import { PromptSpace } from '@/types/prompt';
import { getPromptSpaces, createPromptSpace, updatePromptSpace, deletePromptSpace } from '@/api/promptSpaces';

export interface PromptSpaceSlice {
  promptSpaces: PromptSpace[];
  currentPromptSpaceId: string | null;
  isLoading: boolean;
  error: string | null;
  fetchPromptSpaces: () => Promise<void>;
  setCurrentPromptSpace: (promptSpaceId: string) => void;
  addPromptSpace: (promptSpace: Omit<PromptSpace, "id">) => Promise<PromptSpace>;
  updatePromptSpace: (id: string, updates: Partial<PromptSpace>) => Promise<PromptSpace>;
  deletePromptSpace: (id: string) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const createPromptSpaceSlice: StateCreator<PromptSpaceSlice, [], [], PromptSpaceSlice> = (set, _get, _api) => ({
  promptSpaces: [],
  currentPromptSpaceId: null,
  isLoading: false,
  error: null,

  fetchPromptSpaces: async () => {
    try {
      set({ isLoading: true, error: null });
      const promptSpaces = await getPromptSpaces();

      // 設定預設的 currentPromptSpaceId 為 workspace-default 或第一個
      const defaultSpace = promptSpaces.find(space => space.name === 'workspace-default') || promptSpaces[0];

      set({
        promptSpaces,
        currentPromptSpaceId: defaultSpace?.id || null,
        isLoading: false
      });
    } catch (error: unknown) {
      const err = error as { status?: number };
      const msg = error instanceof Error ? error.message : 'unknown error';

      console.error('get promptSpaces Error:', {
        error,
        message: msg,
        status: err.status
      });

      if (err.status === 401) {
        set({ isLoading: false });
        throw error;
      }

      set({
        error: `Can not load prompt spaces: ${msg}`,
        promptSpaces: [],
        isLoading: false,
      });
    }
  },

  setCurrentPromptSpace: (promptSpaceId: string) => {
    console.log('設定當前 PromptSpace:', promptSpaceId);
    set({ currentPromptSpaceId: promptSpaceId });
  },

  addPromptSpace: async (promptSpace) => {
    try {
      const newPromptSpace = await createPromptSpace(promptSpace);
      set((state) => ({
        promptSpaces: [...state.promptSpaces, newPromptSpace],
      }));
      return newPromptSpace;
    } catch (error) {
      console.error('新增 prompt space 失敗:', error);
      throw error;
    }
  },

  updatePromptSpace: async (id, updates) => {
    try {
      const updatedPromptSpace = await updatePromptSpace(id, updates);
      set((state) => ({
        promptSpaces: state.promptSpaces.map((space) =>
          space.id === id ? { ...space, ...updatedPromptSpace } : space
        ),
      }));
      return updatedPromptSpace;
    } catch (error) {
      console.error('更新 prompt space 失敗:', error);
      throw error;
    }
  },

  deletePromptSpace: async (id) => {
    try {
      await deletePromptSpace(id);
      set((state) => ({
        promptSpaces: state.promptSpaces.filter((space) => space.id !== id),
        currentPromptSpaceId: state.currentPromptSpaceId === id ?
          (state.promptSpaces.find(s => s.id !== id)?.id || null) :
          state.currentPromptSpaceId
      }));
    } catch (error) {
      console.error('刪除 prompt space 失敗:', error);
      throw error;
    }
  },
});
