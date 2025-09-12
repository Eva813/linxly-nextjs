import { useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { fetcher, sharedFoldersConfig } from '@/lib/swr';

export interface SharedFolder {
  id: string;
  name: string;
  description?: string;
  promptCount: number;
  sharedFrom: string;
  shareType: 'space' | 'additional';
  permission: 'view' | 'edit';
  shareEmail?: string;
}

export interface SharedFolderDetails extends SharedFolder {
  prompts: Array<{
    id: string;
    name: string;
    content: string | object | null;
    contentJSON?: object | null;
    shortcut?: string;
  }>;
}

interface UseSharedFoldersState {
  folders: SharedFolder[];
  isLoading: boolean;
  error: string | null;
  folderCount: number;
}

interface UseSharedFolderDetailsState {
  folder: SharedFolderDetails | null;
  isLoading: boolean;
  error: string | null;
}

interface UseSharedFoldersReturn extends UseSharedFoldersState {
  refresh: () => Promise<void>;
  getFolderById: (id: string) => SharedFolder | undefined;
}

interface UseSharedFolderDetailsReturn extends UseSharedFolderDetailsState {
  refresh: () => Promise<void>;
}

/**
 * Hook for managing shared folders list with SWR
 */
export const useSharedFolders = (): UseSharedFoldersReturn => {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/v1/shared-folders',
    fetcher,
    sharedFoldersConfig
  );

  const folders = useMemo(() => data?.folders || [], [data?.folders]);
  const folderCount = folders.length;

  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const getFolderById = useCallback(
    (id: string) => {
      return folders.find((folder: SharedFolder) => folder.id === id);
    },
    [folders]
  );

  return {
    folders,
    isLoading,
    error: error?.message || null,
    folderCount,
    refresh,
    getFolderById,
  };
};

/**
 * Hook for managing specific shared folder details with SWR
 */
export const useSharedFolderDetails = (
  folderId: string
): UseSharedFolderDetailsReturn => {
  const { data, error, isLoading, mutate } = useSWR(
    folderId ? `/api/v1/shared-folders/${folderId}` : null,
    fetcher,
    {
      ...sharedFoldersConfig,
      onError: (error) => {
        // 自定義錯誤處理
        if (error.message.includes('403')) {
          error.message = '你沒有權限查看此資料夾';
        } else if (error.message.includes('404')) {
          error.message = '找不到此共享資料夾';
        }
      },
    }
  );

  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return {
    folder: data || null,
    isLoading,
    error: error?.message || null,
    refresh,
  };
};

/**
 * Hook for getting shared folders count only (lightweight) with SWR
 */
export const useSharedFoldersCount = () => {
  const { data, isLoading } = useSWR('/api/v1/shared-folders', fetcher, {
    ...sharedFoldersConfig,
    onError: () => {
      // 靜默處理錯誤，不在控制台顯示
    },
  });

  const count = data?.folders?.length || 0;

  return { count, isLoading };
};
