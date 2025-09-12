import { useCallback, useEffect, useReducer, useRef } from 'react';
import { getFolderShareStatus, updateFolderSharing } from '@/api/folderShares';

export type ShareStatus = 'none' | 'team' | 'public';

export interface SpaceMembers {
  count: number;
  spaceName: string;
}

export interface FolderSharingState {
  shareStatus: ShareStatus;
  shareToken: string | null;
  additionalEmails: string[];
  spaceMembers: SpaceMembers | null;
  totalMembers: number;
  isLoading: boolean;
  error: string | null;
}

// Action types for reducer
type FolderSharingAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | {
      type: 'LOAD_SUCCESS';
      payload: Omit<FolderSharingState, 'isLoading' | 'error'>;
    }
  | {
      type: 'UPDATE_SUCCESS';
      payload: {
        shareStatus: ShareStatus;
        shareToken: string | null;
        additionalEmails: string[];
        spaceMembers: SpaceMembers | null;
        totalMembers: number;
      };
    }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

// Reducer function
const folderSharingReducer = (
  state: FolderSharingState,
  action: FolderSharingAction
): FolderSharingState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
        error: action.payload ? null : state.error, // Clear error when starting to load
      };
    case 'LOAD_SUCCESS':
      return {
        ...action.payload,
        isLoading: false,
        error: null,
      };
    case 'UPDATE_SUCCESS':
      return {
        ...state,
        ...action.payload,
        isLoading: false,
        error: null,
      };
    case 'SET_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// AbortController wrapper for API calls that need cancellation
const createAbortableRequest = <T>(
  apiCall: () => Promise<T>,
  signal?: AbortSignal
): Promise<T> => {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('AbortError'));
      return;
    }

    const cleanup = () => {
      signal?.removeEventListener('abort', onAbort);
    };

    const onAbort = () => {
      cleanup();
      reject(new Error('AbortError'));
    };

    signal?.addEventListener('abort', onAbort);

    apiCall()
      .then((result) => {
        cleanup();
        resolve(result);
      })
      .catch((error) => {
        cleanup();
        reject(error);
      });
  });
};

export interface UseFolderSharingReturn extends FolderSharingState {
  updateShareStatus: (
    newStatus: ShareStatus,
    additionalEmails?: string[]
  ) => Promise<void>;
  updateAdditionalEmails: (emails: string[]) => Promise<void>;
  loadShareStatus: () => Promise<void>;
  copyShareLink: () => Promise<boolean>;
  clearError: () => void;
}

/**
 * Folder 分享功能的狀態管理 Hook
 *
 * 功能包含：
 * - 分享狀態管理 (none/team/public)
 * - ShareToken 生成和管理
 * - API 呼叫封裝
 * - 錯誤處理
 * - 複製連結到剪貼簿
 */
export const useFolderSharing = (folderId: string): UseFolderSharingReturn => {
  const [state, dispatch] = useReducer(folderSharingReducer, {
    shareStatus: 'none',
    shareToken: null,
    additionalEmails: [],
    spaceMembers: null,
    totalMembers: 0,
    isLoading: false,
    error: null,
  });

  // AbortController for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  // Store current shareStatus in ref to avoid dependency issues
  const shareStatusRef = useRef<ShareStatus>(state.shareStatus);
  shareStatusRef.current = state.shareStatus;

  /**
   * 載入當前 folder 的分享狀態
   */
  const loadShareStatus = useCallback(async () => {
    if (!folderId) return;

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const data = await createAbortableRequest(
        () => getFolderShareStatus(folderId),
        abortControllerRef.current.signal
      );

      dispatch({
        type: 'LOAD_SUCCESS',
        payload: {
          shareStatus: data.shareStatus,
          shareToken: data.shareToken || null,
          additionalEmails: data.additionalEmails || [],
          spaceMembers: data.spaceMembers || null,
          totalMembers: data.totalMembers || 0,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'AbortError') {
        return; // Request was cancelled, don't update state
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load share status';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [folderId]);

  /**
   * 更新分享狀態 (支援階層式權限管理)
   */
  const updateShareStatus = useCallback(
    async (newStatus: ShareStatus, additionalEmails: string[] = []) => {
      // Cancel previous request if exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        const data = await createAbortableRequest(
          () => updateFolderSharing(folderId, newStatus, additionalEmails),
          abortControllerRef.current.signal
        );

        dispatch({
          type: 'UPDATE_SUCCESS',
          payload: {
            shareStatus: data.shareStatus,
            shareToken: data.shareToken || null,
            additionalEmails: additionalEmails,
            spaceMembers: data.spaceMembers || null,
            totalMembers: data.totalMembers || 0,
          },
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'AbortError') {
          return; // Request was cancelled, don't update state
        }
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to update share settings';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
      }
    },
    [folderId]
  );
  /**
   * 更新額外邀請 emails
   * 使用當前的 shareStatus 更新邀請列表
   */
  const updateAdditionalEmails = useCallback(
    async (emails: string[]) => {
      // 使用 ref 獲取當前的 shareStatus，避免將狀態作為依賴
      await updateShareStatus(shareStatusRef.current, emails);
    },
    [updateShareStatus]
  );

  /**
   * 複製分享連結到剪貼簿
   */
  const copyShareLink = useCallback(async (): Promise<boolean> => {
    if (!state.shareToken || state.shareStatus !== 'public') {
      return false;
    }

    if (typeof window === 'undefined') {
      return false;
    }

    const shareUrl = `${window.location.origin}/shared/folder/${state.shareToken}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }, [state.shareToken, state.shareStatus]);

  /**
   * 清除錯誤狀態
   */
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  /**
   * 組件掛載時載入分享狀態
   */
  useEffect(() => {
    if (folderId) {
      loadShareStatus();
    }
  }, [folderId, loadShareStatus]);

  // Cleanup: abort any ongoing requests when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    updateShareStatus,
    updateAdditionalEmails,
    loadShareStatus,
    copyShareLink,
    clearError,
  };
};
