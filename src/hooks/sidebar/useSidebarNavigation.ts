import { useCallback } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';

interface SidebarRouteParams {
  folderId?: string;
  promptId?: string;
}

/**
 * 側邊欄導航相關的 Hook
 * 
 * - 管理路由參數和路徑資訊
 * - 提供導航相關的輔助函式
 * - 保持導航邏輯的純淨性
 */
export const useSidebarNavigation = () => {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const params = useParams<SidebarRouteParams>() || {};

  const navigateToPath = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  const navigateToFolder = useCallback((folderId: string) => {
    router.push(`/prompts/folder/${folderId}`);
  }, [router]);

  const navigateToPrompt = useCallback((promptId: string) => {
    router.push(`/prompts/prompt/${promptId}`);
  }, [router]);

  const navigateToPrompts = useCallback(() => {
    router.push('/prompts');
  }, [router]);

  const isCurrentFolder = useCallback((folderId: string) => {
    return params.folderId === folderId;
  }, [params.folderId]);

  const isCurrentPrompt = useCallback((promptId: string) => {
    return params.promptId === promptId;
  }, [params.promptId]);

  return {
    pathname,
    currentFolderId: params.folderId || null,
    currentPromptId: params.promptId || null,
    navigateToPath,
    navigateToFolder,
    navigateToPrompt,
    navigateToPrompts,
    isCurrentFolder,
    isCurrentPrompt,
  };
};
