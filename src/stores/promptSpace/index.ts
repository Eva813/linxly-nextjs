import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PromptSpace {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt?: Date;
}

interface PromptSpaceState {
  spaces: PromptSpace[];
  currentSpaceId: string | null;
  isLoading: boolean;
  error: string | null;
  isCreatingSpace: boolean;
}

interface PromptSpaceActions {
  setSpaces: (spaces: PromptSpace[]) => void;
  setCurrentSpace: (spaceId: string) => void;
  addSpace: (space: PromptSpace) => void;
  updateSpace: (spaceId: string, updates: Partial<PromptSpace>) => void;
  removeSpace: (spaceId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCreatingSpace: (creating: boolean) => void;
  getCurrentSpace: () => PromptSpace | null;
}

export type PromptSpaceStore = PromptSpaceState & PromptSpaceActions;

export const usePromptSpaceStore = create<PromptSpaceStore>()(
  persist(
    (set, get) => ({
      spaces: [],
      currentSpaceId: null,
      isLoading: false,
      error: null,
      isCreatingSpace: false,

      setSpaces: (spaces) => set({ spaces }),
      
      setCurrentSpace: (spaceId) => set({ currentSpaceId: spaceId }),
      
      addSpace: (space) => set((state) => ({ 
        spaces: [...state.spaces, space],
        currentSpaceId: space.id 
      })),
      
      updateSpace: (spaceId, updates) => set((state) => ({
        spaces: state.spaces.map(space => 
          space.id === spaceId ? { ...space, ...updates } : space
        )
      })),
      
      removeSpace: (spaceId) => set((state) => {
        const newSpaces = state.spaces.filter(space => space.id !== spaceId);
        const newCurrentSpaceId = state.currentSpaceId === spaceId 
          ? (newSpaces.length > 0 ? newSpaces[0].id : null)
          : state.currentSpaceId;
        
        return {
          spaces: newSpaces,
          currentSpaceId: newCurrentSpaceId
        };
      }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      setCreatingSpace: (creating) => set({ isCreatingSpace: creating }),
      
      getCurrentSpace: () => {
        const { spaces, currentSpaceId } = get();
        return spaces.find(space => space.id === currentSpaceId) || null;
      }
    }),
    {
      name: 'prompt-space-storage',
      partialize: (state) => ({ 
        spaces: state.spaces, 
        currentSpaceId: state.currentSpaceId 
      }),
    }
  )
);