import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface SidebarState {
  // UI 狀態
  activeFolderMenu: string | null;
  activePromptMenu: string | null;
  collapsedFolders: Set<string>;
  
  // Loading 狀態
  addingFolder: boolean;
  addingPrompt: boolean;
  addingPromptFolderId: string | null;
  addingPromptAfterPromptId: string | null;
  
  // UI Actions
  setActiveFolderMenu: (id: string | null) => void;
  setActivePromptMenu: (id: string | null) => void;
  toggleCollapse: (folderId: string) => void;
  setAddingFolder: (loading: boolean) => void;
  setAddingPrompt: (loading: boolean, folderId?: string | null, afterPromptId?: string | null) => void;
  resetUI: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  devtools(
    (set) => ({
      // 初始狀態
      activeFolderMenu: null,
      activePromptMenu: null,
      collapsedFolders: new Set<string>(),
      addingFolder: false,
      addingPrompt: false,
      addingPromptFolderId: null,
      addingPromptAfterPromptId: null,
      
      // UI Actions
      setActiveFolderMenu: (id: string | null) => set({ activeFolderMenu: id }, false, 'setActiveFolderMenu'),
      setActivePromptMenu: (id: string | null) => set({ activePromptMenu: id }, false, 'setActivePromptMenu'),
      
      toggleCollapse: (folderId: string) => set((state) => {
        const newCollapsed = new Set(state.collapsedFolders);
        if (newCollapsed.has(folderId)) {
          newCollapsed.delete(folderId);
        } else {
          newCollapsed.add(folderId);
        }
        return { collapsedFolders: newCollapsed };
      }, false, 'toggleCollapse'),
      
      setAddingFolder: (loading: boolean) => set({ addingFolder: loading }, false, 'setAddingFolder'),
      
      setAddingPrompt: (loading: boolean, folderId: string | null = null, afterPromptId: string | null = null) => set({
        addingPrompt: loading,
        addingPromptFolderId: folderId,
        addingPromptAfterPromptId: afterPromptId
      }, false, 'setAddingPrompt'),
      
      resetUI: () => set({
        activeFolderMenu: null,
        activePromptMenu: null,
        addingFolder: false,
        addingPrompt: false,
        addingPromptFolderId: null,
        addingPromptAfterPromptId: null
      }, false, 'resetUI'),
    }),
    {
      name: 'sidebar-store',
    }
  )
);
