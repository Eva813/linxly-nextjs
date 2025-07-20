// src/stores/slices/folderSlice.ts
import { StateCreator } from 'zustand';
import { Folder } from '@/types/prompt';
import { getFolders, createFolder, updateFolder, deleteFolder } from '@/api/folders';

export interface FolderSlice {
  folders: Folder[];
  isLoading: boolean;
  error: string | null;
  folderCache: Record<string, { folders: Folder[]; lastFetched: number }>;
  fetchFolders: (promptSpaceId?: string, forceRefresh?: boolean) => Promise<void>;
  setFolders: (folders: Folder[]) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => Promise<Folder>;
  addFolder: (folder: Omit<Folder, "id">, promptSpaceId?: string) => Promise<Folder>;
  deleteFolder: (id: string) => Promise<void>;
  clearCache: () => void;
  clearSpaceCache: (spaceId: string) => void;
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
  folderCache: {},
  
  // 智能載入資料夾，支援快取和延遲載入指示器
  fetchFolders: async (promptSpaceId?: string, forceRefresh: boolean = false) => {
    try {
      if (!promptSpaceId) {
        console.warn('fetchFolders: promptSpaceId is required');
        set({ isLoading: false, folders: [] });
        return;
      }

      const state = get();
      const now = Date.now();
      const CACHE_DURATION = 5 * 60 * 1000; // 5分鐘快取
      
      // 檢查快取
      const cachedData = state.folderCache[promptSpaceId];
      if (!forceRefresh && cachedData && (now - cachedData.lastFetched) < CACHE_DURATION) {
        set({ folders: cachedData.folders, isLoading: false });
        return;
      }

      // 延遲顯示載入指示器 (300ms後才顯示，避免閃爍)
      const loadingTimer = setTimeout(() => {
        set({ isLoading: true });
      }, 300);

      set({ error: null });
      
      const folders = await getFolders(promptSpaceId);

      // 清除延遲計時器
      clearTimeout(loadingTimer);

      let finalFolders = folders;

      // Only create default folder if user is the owner of the space
      if (folders.length === 0) {
        try {
          const defaultFolder = DEFAULT_FOLDERS[0];
          const newFolder = await createFolder({
            name: defaultFolder.name,
            description: defaultFolder.description,
            promptSpaceId: promptSpaceId,
          });
          finalFolders = [newFolder];
        } catch (error) {
          // If folder creation fails (e.g., user doesn't have edit permission for shared space),
          // just show empty folders instead of creating default
          console.warn('Cannot create default folder, user might not have edit permissions:', error);
          finalFolders = [];
        }
      }

      // 更新快取
      set((state) => ({
        folders: finalFolders,
        isLoading: false,
        folderCache: {
          ...state.folderCache,
          [promptSpaceId]: {
            folders: finalFolders,
            lastFetched: now
          }
        }
      }));
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
      set((state) => ({
        folders: state.folders.map((folder) =>
          folder.id === id ? { ...folder, ...updatedFolder } : folder
        ),
        // 同步更新快取
        folderCache: Object.keys(state.folderCache).reduce((acc, spaceId) => {
          acc[spaceId] = {
            ...state.folderCache[spaceId],
            folders: state.folderCache[spaceId].folders.map((folder) =>
              folder.id === id ? { ...folder, ...updatedFolder } : folder
            ),
            lastFetched: Date.now() // 更新時間戳
          };
          return acc;
        }, {} as Record<string, { folders: Folder[]; lastFetched: number }>)
      }));
      return updatedFolder;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'unknown error';
      set({ error: `update folder error: ${errorMessage}` });
      console.error('update folder error:', error);
      throw error;
    }
  },
  addFolder: async (folder, promptSpaceId?: string) => {
    try {
      if (!promptSpaceId) {
        throw new Error('promptSpaceId is required');
      }
      
      const newFolder = await createFolder({
        name: folder.name,
        description: folder.description,
        promptSpaceId: promptSpaceId
      });

      // 樂觀更新：先更新 UI 和快取，確保使用者體驗
      set((state) => ({
        folders: [...state.folders, newFolder],
        // 同步更新快取
        folderCache: {
          ...state.folderCache,
          [promptSpaceId]: {
            folders: [...(state.folderCache[promptSpaceId]?.folders || []), newFolder],
            lastFetched: Date.now()
          }
        }
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
      set((state) => ({
        folders: state.folders.filter((folder) => folder.id !== id),
        // 清除相關快取
        folderCache: Object.keys(state.folderCache).reduce((acc, spaceId) => {
          acc[spaceId] = {
            ...state.folderCache[spaceId],
            folders: state.folderCache[spaceId].folders.filter((folder) => folder.id !== id)
          };
          return acc;
        }, {} as Record<string, { folders: Folder[]; lastFetched: number }>)
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'unknown error';
      set({ error: `delete folder error: ${errorMessage}` });
      console.error('delete folder error:', error);
      throw error;
    }
  },

  // 清除快取方法
  clearCache: () => set({ folderCache: {} }),
  // 清除特定 space 的快取
  clearSpaceCache: (spaceId: string) => set((state) => {
    const newCache = { ...state.folderCache };
    delete newCache[spaceId];
    return { folderCache: newCache };
  }),
});
