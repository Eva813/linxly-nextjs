import { StateCreator } from 'zustand';
import { SidebarLoadingSlice } from './loadingSlice';
import { SidebarActionsSlice } from './actionsSlice';

export interface SidebarUISlice {
  activeFolderMenuId: string | null;
  activePromptMenuId: string | null;
  collapsedFolderIds: Set<string>;
  
  setActiveFolderMenu: (id: string | null) => void;
  setActivePromptMenu: (id: string | null) => void;
  toggleFolderCollapse: (folderId: string) => void;
  closeAllMenus: () => void;
}

export const createSidebarUISlice: StateCreator<
  SidebarUISlice & SidebarLoadingSlice & SidebarActionsSlice,
  [],
  [],
  SidebarUISlice
> = (set, get) => ({
  activeFolderMenuId: null,
  activePromptMenuId: null,
  collapsedFolderIds: new Set<string>(),

  setActiveFolderMenu: (id: string | null) => {
    set(
      { activeFolderMenuId: id },
      false,
      'sidebar/setActiveFolderMenu'
    );
  },

  setActivePromptMenu: (id: string | null) => {
    set(
      { activePromptMenuId: id },
      false,
      'sidebar/setActivePromptMenu'
    );
  },

  toggleFolderCollapse: (folderId: string) => {
    const currentState = get();
    const newCollapsedIds = new Set(currentState.collapsedFolderIds);
    
    if (newCollapsedIds.has(folderId)) {
      newCollapsedIds.delete(folderId);
    } else {
      newCollapsedIds.add(folderId);
    }
    
    set(
      { collapsedFolderIds: newCollapsedIds },
      false,
      'sidebar/toggleFolderCollapse'
    );
  },

  closeAllMenus: () => {
    set(
      {
        activeFolderMenuId: null,
        activePromptMenuId: null,
      },
      false,
      'sidebar/closeAllMenus'
    );
  },
});
