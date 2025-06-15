// src/stores/slices/folderSlice.ts
import { StateCreator } from 'zustand';
import { Folder } from '@/types/prompt';
import { getFolders, createFolder, updateFolder, deleteFolder } from '@/api/folders';

export interface FolderSlice {
  folders: Folder[];
  isLoading: boolean;
  error: string | null;
  fetchFolders: () => Promise<void>;
  setFolders: (folders: Folder[]) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => Promise<Folder>;
  addFolder: (folder: Omit<Folder, "id">) => Promise<Folder>;
  deleteFolder: (id: string) => Promise<void>;
}
// 預設資料夾結構
const DEFAULT_FOLDERS: Folder[] = [
  {
    id: 'sample-folder',
    name: 'My Sample Prompts',
    description: 'This is a sample folder',
    prompts: [],
  }
];

export const createFolderSlice: StateCreator<FolderSlice> = (set, get) => ({
  folders: [],
  isLoading: false,
  error: null,
  // 從 API 取得資料夾，如果沒有資料則建立預設資料夾
  fetchFolders: async () => {
    try {
      set({ isLoading: true, error: null });
      const folders = await getFolders();

      if (folders.length === 0) {
        const defaultFolder = DEFAULT_FOLDERS[0];
        const newFolder = await createFolder({
          name: defaultFolder.name,
          description: defaultFolder.description,
        });
        set({ folders: [newFolder], isLoading: false });
      } else {
        set({ folders, isLoading: false });
      }
    } catch (error: unknown) {
      const err = error as { status?: number };
      const msg = error instanceof Error ? error.message : 'unknown error';

      console.error('get folder Error:', {
        error,
        message: msg,
        status: err.status
      });

      if (err.status === 401) {
        set({ isLoading: false });
        throw error;
      }

      set({
        error: `Can not load folders: ${msg}`,
        folders: DEFAULT_FOLDERS,
        isLoading: false,
      });
    }
  },
  // setFolders 被呼叫時，它會觸發 React 的重新渲染機制，更新依賴 folders 狀態的元件。
  setFolders: (folders) => set({ folders }),
  // 更新資料夾
  updateFolder: async (id, updates) => {
    try {
      const updatedFolder = await updateFolder(id, updates);
      set({
        folders: get().folders.map((folder) =>
          folder.id === id ? { ...folder, ...updatedFolder } : folder
        ),
      });
      return updatedFolder;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'unknown error';
      set({ error: `update folder error: ${errorMessage}` });
      console.error('update folder error:', error);
      throw error;
    }
  },
  addFolder: async (folder) => {
    try {
      const newFolder = await createFolder({
        name: folder.name,
        description: folder.description
      });

      // 樂觀更新：先更新 UI，確保使用者體驗
      set((state) => ({
        folders: [...state.folders, newFolder],
      }));

      return newFolder;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'unknown error';
      console.error('新增資料夾失敗:', { error, message: errorMessage });

      set({ error: `無法新增資料夾: ${errorMessage}` });
      throw error;
    }
  },
  deleteFolder: async (id) => {
    try {
      await deleteFolder(id); // 呼叫 API 刪除資料夾
      set({
        folders: get().folders.filter((folder) => folder.id !== id),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'unknown error';
      set({ error: `delete folder error: ${errorMessage}` });
      console.error('delete folder error:', error);
      throw error;
    }
  },
});
