import { useState, useCallback, useEffect } from 'react';

export type ShareStatus = 'none' | 'team' | 'public';

export interface FolderSharingState {
  shareStatus: ShareStatus;
  shareToken: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface UseFolderSharingReturn extends FolderSharingState {
  updateShareStatus: (newStatus: ShareStatus) => Promise<void>;
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
  const [state, setState] = useState<FolderSharingState>({
    shareStatus: 'none',
    shareToken: null,
    isLoading: false,
    error: null,
  });

  /**
   * 載入當前 folder 的分享狀態
   */
  const loadShareStatus = useCallback(async () => {
    if (!folderId) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // TODO: 實際 API 呼叫
      // const response = await fetch(`/api/v1/folders/${folderId}/shares`);
      // const data = await response.json();
      
      // 模擬 API 回應 - 初始化時生成 token
      const mockData = {
        shareType: 'none',
        shareToken: `mock-token-${folderId}-${Date.now()}`,
        isActive: false,
      };
      
      setState({
        shareStatus: mockData.isActive ? mockData.shareType as ShareStatus : 'none',
        shareToken: mockData.shareToken,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load share status';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [folderId]);

  /**
   * 更新分享狀態
   */
  const updateShareStatus = useCallback(async (newStatus: ShareStatus) => {
    if (newStatus === 'team') {
      // Team option is disabled for now
      return;
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // TODO: 實際 API 呼叫
      // const response = await fetch(`/api/v1/folders/${folderId}/shares`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ shareType: newStatus })
      // });
      // const data = await response.json();
      
      // 模擬 API 回應
      const mockData = {
        shareType: newStatus,
        shareToken: state.shareToken || `mock-token-${folderId}-${Date.now()}`,
        isActive: newStatus !== 'none',
      };
      
      setState({
        shareStatus: newStatus,
        shareToken: mockData.shareToken,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update share settings';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [folderId, state.shareToken]);

  /**
   * 複製分享連結到剪貼簿
   */
  const copyShareLink = useCallback(async (): Promise<boolean> => {
    if (!state.shareToken || state.shareStatus !== 'public') {
      return false;
    }
    
    const shareUrl = `https://app.linxly.ai/shared/folder/${state.shareToken}`;
    
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
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * 組件掛載時載入分享狀態
   */
  useEffect(() => {
    if (folderId) {
      loadShareStatus();
    }
  }, [folderId, loadShareStatus]);

  return {
    ...state,
    updateShareStatus,
    loadShareStatus,
    copyShareLink,
    clearError,
  };
};