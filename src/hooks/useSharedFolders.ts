import { useState, useEffect, useCallback } from 'react';

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
 * Hook for managing shared folders list
 */
export const useSharedFolders = (): UseSharedFoldersReturn => {
  const [state, setState] = useState<UseSharedFoldersState>({
    folders: [],
    isLoading: true,
    error: null,
    folderCount: 0,
  });

  const fetchSharedFolders = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // 添加超時機制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超時

      const response = await fetch('/api/v1/shared-folders', {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const folders = data.folders || [];

      setState({
        folders,
        isLoading: false,
        error: null,
        folderCount: folders.length,
      });
    } catch (error) {
      console.error('Error fetching shared folders:', error);
      let errorMessage = 'Failed to fetch shared folders';

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout - please try again';
        } else {
          errorMessage = error.message;
        }
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchSharedFolders();
  }, [fetchSharedFolders]);

  const getFolderById = useCallback(
    (id: string) => {
      return state.folders.find((folder) => folder.id === id);
    },
    [state.folders]
  );

  useEffect(() => {
    fetchSharedFolders();
  }, [fetchSharedFolders]);

  return {
    ...state,
    refresh,
    getFolderById,
  };
};

/**
 * Hook for managing specific shared folder details
 */
export const useSharedFolderDetails = (
  folderId: string
): UseSharedFolderDetailsReturn => {
  const [state, setState] = useState<UseSharedFolderDetailsState>({
    folder: null,
    isLoading: true,
    error: null,
  });

  const fetchFolderDetails = useCallback(async () => {
    if (!folderId) {
      setState({ folder: null, isLoading: false, error: 'Invalid folder ID' });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // 添加超時機制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超時

      const response = await fetch(`/api/v1/shared-folders/${folderId}`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('你沒有權限查看此資料夾');
        }
        if (response.status === 404) {
          throw new Error('找不到此共享資料夾');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setState({
        folder: data,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching folder details:', error);
      let errorMessage = 'Failed to fetch folder details';

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout - please try again';
        } else {
          errorMessage = error.message;
        }
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [folderId]);

  const refresh = useCallback(async () => {
    await fetchFolderDetails();
  }, [fetchFolderDetails]);

  useEffect(() => {
    fetchFolderDetails();
  }, [fetchFolderDetails]);

  return {
    ...state,
    refresh,
  };
};

/**
 * Hook for getting shared folders count only (lightweight)
 */
export const useSharedFoldersCount = () => {
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        setIsLoading(true);

        // 添加超時機制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超時

        const response = await fetch('/api/v1/shared-folders', {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          setCount(data.folders?.length || 0);
        } else {
          console.error(
            'Failed to fetch shared folders:',
            response.status,
            response.statusText
          );
          setCount(0);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.error('Shared folders fetch timeout');
        } else {
          console.error('Error fetching shared folders count:', error);
        }
        setCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCount();
  }, []);

  return { count, isLoading };
};
