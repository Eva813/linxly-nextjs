// src/stores/slices/folderSlice.ts
import { StateCreator } from 'zustand';
import { Folder } from '@/types/snippets';
import { getFolders, createFolder, updateFolder, deleteFolder } from '@/api/folders';

export interface FolderSlice {
  folders: Folder[];
  isLoading: boolean;
  error: string | null;
  fetchFolders: () => Promise<void>;
  setFolders: (folders: Folder[]) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => Promise<Folder>;
  addFolder: (folder: Omit<Folder, "id">) => Promise<Folder>;
  deleteFolder: (id: string) => void;
}
// 預設資料夾結構
const DEFAULT_FOLDERS: Folder[] = [
  {
    id: 'sample-folder',
    name: 'My Sample Snippets',
    description: 'This is a sample folder',
    snippets: [
      // {
      //   id: 'sample-snippet-1',
      //   name: 'Demo - Plain text',
      //   content: 'be a software engineer',
      //   shortcut: '/do',
      // },
      // {
      //   id: 'sample-snippet-2',
      //   name: 'Demo - Styled Text',
      //   content:
      //     'be a translate expert, I will give you a sentence and help me translate to english',
      //   shortcut: '/doT',
      // },
    ],
  }
];

export const createFolderSlice: StateCreator<FolderSlice> = (set, get) => ({
  folders: [],
  isLoading: false,
  error: null,
  // 從 API 取得資料夾，如果沒有資料則使用預設
  fetchFolders: async () => {
    try {
      set({ isLoading: true, error: null });
      const folders = await getFolders();
      
      // 檢查是否有資料，如果沒有則使用預設資料
      if (folders.length === 0) {
        // set({ folders: DEFAULT_FOLDERS, isLoading: false });
        
        // 順序可能要考慮：先設定狀態，再非同步建立到 DB
        // 若要同步到 DB，可以在這裡遍歷 DEFAULT_FOLDERS 並依序建立到 DB
          for (const folder of DEFAULT_FOLDERS) {
            await createFolder({
              name: folder.name,
              description: folder.description,
            });
          }

          // 再次從資料庫取得資料夾
          const updatedFolders = await getFolders();
          set({ folders: updatedFolders, isLoading: false });
        
        console.log('use default folders:');
      } else {
        set({ folders, isLoading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'unknown error';
      set({ 
        error: `get folder failed: ${errorMessage}`, 
        isLoading: false,
        // 發生錯誤時也使用預設資料
        folders: DEFAULT_FOLDERS
      });
      console.error('取得資料夾失敗:', error);
    }
  },
  // 當 setFolders 被呼叫時，它會觸發 React 的重新渲染機制，更新依賴 folders 狀態的元件。
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
      // 呼叫 API 建立資料夾
      const newFolder = await createFolder({
        name: folder.name,
        description: folder.description
      });
      
      // 更新狀態
      set((state) => ({
        folders: [...state.folders, newFolder],
      }));
      
      return newFolder;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'unknown error';
      set({ error: `add folder error: ${errorMessage}` });
      console.error('add folder error:', error);
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
