// src/stores/slices/folderSlice.ts
import { StateCreator } from 'zustand';
import { Folder } from '@/types/snippets';

export interface FolderSlice {
  folders: Folder[];
  setFolders: (folders: Folder[]) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  addFolder: (folder: Omit<Folder, "id">, index?: number) => Folder;
  deleteFolder: (id: string) => void;
}

export const createFolderSlice: StateCreator<FolderSlice> = (set, get) => ({
  folders: [
    {
      id: 'HplOMyf2mDqvVMdphJbt',
      name: 'My Sample Snippets',
      description: 'This is a sample folder',
      snippets: [
        {
          id: '5mJw031VPo2WxNIQyeXN',
          name: 'Demo - Plain text',
          content: 'be a software engineer',
          shortcut: '/do',
        },
        {
          id: '6mJw031VPo2WxNIQyeYN',
          name: 'Demo - Styled Text',
          content:
            'be a translate expert, I will give you a sentence and help me translate to english',
          shortcut: '/doT',
        },
      ],
    },
    {
      id: 'folder-1741057188488',
      name: 'Test',
      description: 'test',
      snippets: [
        {
          id: 'snippet-1741057206823',
          name: 'test',
          content: '<p>New snippet content Test</p>',
          shortcut: '/test',
        },
      ],
    },
  ],
  setFolders: (folders) => set({ folders }),
  updateFolder: (id, updates) =>
    set({
      folders: get().folders.map((folder) =>
        folder.id === id ? { ...folder, ...updates } : folder
      ),
    }),
    addFolder: (folder, index) => {
      const newFolder: Folder = { ...folder, id: `folder-${Date.now()}` };
      set((state) => ({
        folders:
          typeof index === "number"
            ? [
                ...state.folders.slice(0, index),
                newFolder,
                ...state.folders.slice(index),
              ]
            : [...state.folders, newFolder],
      }));
      return newFolder;
    },
  deleteFolder: (id) =>
    set({
      folders: get().folders.filter((folder) => folder.id !== id),
    }),
});
