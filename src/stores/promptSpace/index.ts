import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PromptSpace {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface SharedSpace {
  space: PromptSpace;
  permission: 'view' | 'edit';
  sharedBy: string;
  sharedAt: string;
}

interface PromptSpaceState {
  ownedSpaces: PromptSpace[];
  sharedSpaces: SharedSpace[];
  currentSpaceId: string | null;
  currentSpaceRole: 'owner' | 'edit' | 'view' | null;
  isLoading: boolean;
  error: string | null;
  isCreatingSpace: boolean;
}

interface PromptSpaceActions {
  setOwnedSpaces: (spaces: PromptSpace[]) => void;
  setSharedSpaces: (spaces: SharedSpace[]) => void;
  setAllSpaces: (ownedSpaces: PromptSpace[], sharedSpaces: SharedSpace[]) => void;
  setCurrentSpace: (spaceId: string) => void;
  addSpace: (space: PromptSpace) => void;
  updateSpace: (spaceId: string, updates: Partial<PromptSpace>) => void;
  removeSpace: (spaceId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCreatingSpace: (creating: boolean) => void;
  getCurrentSpace: () => PromptSpace | null;
  getCurrentSpaceRole: () => 'owner' | 'edit' | 'view' | null;
  getAllSpaces: () => PromptSpace[];
}

export type PromptSpaceStore = PromptSpaceState & PromptSpaceActions;

export const usePromptSpaceStore = create<PromptSpaceStore>()(
  persist(
    (set, get) => ({
      ownedSpaces: [],
      sharedSpaces: [],
      currentSpaceId: null,
      currentSpaceRole: null,
      isLoading: false,
      error: null,
      isCreatingSpace: false,

      setOwnedSpaces: (spaces) => set({ ownedSpaces: spaces }),
      
      setSharedSpaces: (spaces) => set({ sharedSpaces: spaces }),
      
      setAllSpaces: (ownedSpaces, sharedSpaces) => set({ 
        ownedSpaces, 
        sharedSpaces 
      }),
      
      setCurrentSpace: (spaceId) => {
        const { ownedSpaces, sharedSpaces } = get();
        
        // Determine role for current space
        let role: 'owner' | 'edit' | 'view' | null = null;
        
        const ownedSpace = ownedSpaces.find(space => space.id === spaceId);
        if (ownedSpace) {
          role = 'owner';
        } else {
          const sharedSpace = sharedSpaces.find(shared => shared.space.id === spaceId);
          if (sharedSpace) {
            role = sharedSpace.permission;
          }
        }
        
        set({ 
          currentSpaceId: spaceId,
          currentSpaceRole: role
        });
      },
      
      addSpace: (space) => set((state) => ({ 
        ownedSpaces: [...state.ownedSpaces, space],
        currentSpaceId: space.id,
        currentSpaceRole: 'owner'
      })),
      
      updateSpace: (spaceId, updates) => set((state) => ({
        ownedSpaces: state.ownedSpaces.map(space => 
          space.id === spaceId ? { ...space, ...updates } : space
        ),
        sharedSpaces: state.sharedSpaces.map(shared =>
          shared.space.id === spaceId 
            ? { ...shared, space: { ...shared.space, ...updates } }
            : shared
        )
      })),
      
      removeSpace: (spaceId) => set((state) => {
        const newOwnedSpaces = state.ownedSpaces.filter(space => space.id !== spaceId);
        const newSharedSpaces = state.sharedSpaces.filter(shared => shared.space.id !== spaceId);
        
        let newCurrentSpaceId = state.currentSpaceId;
        let newCurrentSpaceRole = state.currentSpaceRole;
        
        if (state.currentSpaceId === spaceId) {
          if (newOwnedSpaces.length > 0) {
            newCurrentSpaceId = newOwnedSpaces[0].id;
            newCurrentSpaceRole = 'owner';
          } else if (newSharedSpaces.length > 0) {
            newCurrentSpaceId = newSharedSpaces[0].space.id;
            newCurrentSpaceRole = newSharedSpaces[0].permission;
          } else {
            newCurrentSpaceId = null;
            newCurrentSpaceRole = null;
          }
        }
        
        return {
          ownedSpaces: newOwnedSpaces,
          sharedSpaces: newSharedSpaces,
          currentSpaceId: newCurrentSpaceId,
          currentSpaceRole: newCurrentSpaceRole
        };
      }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      setCreatingSpace: (creating) => set({ isCreatingSpace: creating }),
      
      getCurrentSpace: () => {
        const { ownedSpaces, sharedSpaces, currentSpaceId } = get();
        
        const ownedSpace = ownedSpaces.find(space => space.id === currentSpaceId);
        if (ownedSpace) return ownedSpace;
        
        const sharedSpace = sharedSpaces.find(shared => shared.space.id === currentSpaceId);
        return sharedSpace?.space || null;
      },
      
      getCurrentSpaceRole: () => {
        const { currentSpaceRole } = get();
        return currentSpaceRole;
      },
      
      getAllSpaces: () => {
        const { ownedSpaces, sharedSpaces } = get();
        return [...ownedSpaces, ...sharedSpaces.map(shared => shared.space)];
      }
    }),
    {
      name: 'prompt-space-storage',
      partialize: (state) => ({ 
        ownedSpaces: state.ownedSpaces,
        sharedSpaces: state.sharedSpaces, 
        currentSpaceId: state.currentSpaceId,
        currentSpaceRole: state.currentSpaceRole
      }),
    }
  )
);