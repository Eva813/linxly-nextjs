// src/stores/slices/folderSlice.ts
import { StateCreator } from 'zustand';
import { Folder } from '@/types/prompt';
import { getFolders, createFolder, updateFolder, deleteFolder } from '@/api/folders';

export interface FolderSlice {
  folders: Folder[];
  isLoading: boolean;
  error: string | null;
  fetchFolders: (promptSpaceId?: string) => Promise<void>;
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
    promptSpaceId: '1', // 預設指向 workspace-default
  }
];

export const createFolderSlice: StateCreator<FolderSlice> = (set, get) => ({
  folders: [],
  isLoading: false,
  error: null,
  // 從 API 取得資料夾，如果沒有資料則建立預設資料夾
  fetchFolders: async (promptSpaceId) => {
    try {
      console.log('fetchFolders 被調用，promptSpaceId:', promptSpaceId);
      set({ isLoading: true, error: null });
      const folders = await getFolders(promptSpaceId);
      console.log('獲得的 folders:', folders);

      if (folders.length === 0 && promptSpaceId) {
        // 如果指定的 promptSpace 沒有資料夾，建立一個預設資料夾
        console.log('為 promptSpace 建立預設資料夾:', promptSpaceId);
        const defaultFolder = DEFAULT_FOLDERS[0];
        const newFolder = await createFolder({
          name: defaultFolder.name,
          description: defaultFolder.description,
          promptSpaceId: promptSpaceId,
        });
        set({ folders: [newFolder], isLoading: false });
      } else if (folders.length === 0) {
        // 如果完全沒有資料夾，建立預設資料夾
        console.log('建立預設資料夾');
        const defaultFolder = DEFAULT_FOLDERS[0];
        const newFolder = await createFolder({
          name: defaultFolder.name,
          description: defaultFolder.description,
          promptSpaceId: promptSpaceId || '1',
        });
        set({ folders: [newFolder], isLoading: false });
      } else {
        console.log('設定 folders:', folders);
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
