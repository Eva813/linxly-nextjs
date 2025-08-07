import { useCallback, useMemo } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';

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
  const params = useParams() || {};

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
    return (params.folderId as string) === folderId;
  }, [params.folderId]);

  const isCurrentPrompt = useCallback((promptId: string) => {
    return (params.promptId as string) === promptId;
  }, [params.promptId]);

  // 穩定化返回的物件，只有當依賴變化時才重新創建
  return useMemo(() => ({
    pathname,
    currentFolderId: (params.folderId as string) || null,
    currentPromptId: (params.promptId as string) || null,
    navigateToPath,
    navigateToFolder,
    navigateToPrompt,
    navigateToPrompts,
    isCurrentFolder,
    isCurrentPrompt,
  }), [
    pathname,
    params.folderId,
    params.promptId,
    navigateToPath,
    navigateToFolder,
    navigateToPrompt,
    navigateToPrompts,
    isCurrentFolder,
    isCurrentPrompt,
  ]);
};
