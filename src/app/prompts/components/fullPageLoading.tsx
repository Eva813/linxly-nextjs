"use client";

import { useEffect, useState, useRef, useMemo, useCallback, memo } from "react";
import { usePromptSpaceStore } from "@/stores/promptSpace";
import { usePromptStore } from "@/stores/prompt";
import { getAllPromptSpaces } from '@/api/promptSpace';
import { Skeleton } from "@/components/ui/skeleton";
import EditorSkeleton from "@/app/prompts/components/editorSkeleton";
import LoadingOverlay from "@/app/components/loadingOverlay";
import { useRouter } from "next/navigation";

// 當資料尚未載入完成時顯示載入動畫
function FullPageLoading({ children }: { children: React.ReactNode }) {
  const { 
    currentSpaceId, 
    setAllSpaces,
    setCurrentSpace,
    loadSpaceOverview,
    setLoading,
    setError
  } = usePromptSpaceStore();
  const { fetchFolders } = usePromptStore();
  const [isInitialized, setIsInitialized] = useState(false);
  // guard ref，確保只呼叫一次
  const hasCalled = useRef(false);
  // 用於追蹤組件是否已卸載，防止記憶體洩漏
  const isMountedRef = useRef(true);
  const router = useRouter();

  // 使用 useCallback 穩定函數引用，並添加清理邏輯防止記憶體洩漏
  const initializeSpaces = useCallback(async () => {
    // 在開始時檢查組件是否已卸載
    if (!isMountedRef.current) return;
    
    try {
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }
      
      const response = await getAllPromptSpaces();
      
      // 再次檢查組件是否仍然存在
      if (!isMountedRef.current) return;
      
      // 轉換 owned spaces
      const ownedSpaces = response.ownedSpaces.map(space => ({
        id: space.id,
        name: space.name,
        userId: space.userId,
        defaultSpace: space.defaultSpace || false,
        createdAt: new Date(space.createdAt),
        updatedAt: space.updatedAt ? new Date(space.updatedAt) : undefined
      }));
      
      // 轉換 shared spaces
      const sharedSpaces = response.sharedSpaces.map(shared => ({
        space: {
          id: shared.space.id,
          name: shared.space.name,
          userId: shared.space.userId,
          defaultSpace: shared.space.defaultSpace || false,
          createdAt: new Date(shared.space.createdAt),
          updatedAt: shared.space.updatedAt ? new Date(shared.space.updatedAt) : undefined
        },
        permission: shared.permission,
        sharedBy: shared.sharedBy,
        sharedAt: shared.sharedAt
      }));
      
      if (!isMountedRef.current) return;
      setAllSpaces(ownedSpaces, sharedSpaces);
      
      // 優先載入默認 space，如沒有則載入第一個 space
      const allSpaces = [...ownedSpaces, ...sharedSpaces.map(s => s.space)];
      if (allSpaces.length > 0 && isMountedRef.current) {
        // 查找默認 space，如沒有則使用第一個
        const defaultSpace = allSpaces.find(space => space.defaultSpace === true);
        const selectedSpaceId = defaultSpace?.id || allSpaces[0].id;
        
        setCurrentSpace(selectedSpaceId);
        
        // 並行載入 folders 和 overview 提升性能
        await Promise.all([
          fetchFolders(selectedSpaceId),
          loadSpaceOverview(selectedSpaceId).catch(console.error)
        ]);
      }
      
      if (isMountedRef.current) {
        setIsInitialized(true);
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      
      console.error('Failed to initialize spaces:', error);
      const err = error as { status?: number };
      if (err.status === 401) {
        router.replace('/login');
      } else {
        setError(error instanceof Error ? error.message : 'Unknown error');
        setIsInitialized(true); 
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [setAllSpaces, setCurrentSpace, fetchFolders, loadSpaceOverview, setLoading, setError, router]);

  useEffect(() => {
    if (hasCalled.current) return;
    hasCalled.current = true;
    initializeSpaces();
  }, [initializeSpaces]);

  // 組件卸載時的清理邏輯
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);


  // 使用 useMemo 緩存載入狀態計算
  const isFullyLoaded = useMemo(() => 
    isInitialized && currentSpaceId, 
    [isInitialized, currentSpaceId]
  );

  // 使用 useMemo 緩存 skeleton 結構，避免每次渲染都創建新實例
  const loadingSkeleton = useMemo(() => (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* 側邊欄載入狀態 */}
      <div className="w-80 p-4 border-r border-gray-300 h-full overflow-y-auto hidden sm:block">
        <div className="grid grid-cols-2 gap-x-4 mb-4 ">
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-8 w-full rounded-md" />
        </div>
        <div className="flex-1">
          <ul>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="px-2 py-2">
                <Skeleton className="h-8 w-full rounded-md" />
              </div>
            ))}
          </ul>
        </div>
      </div>

      {/* 主內容載入狀態 */}
      <main className="flex-1 pl-4 pt-4 pr-4 h-full relative">
        <EditorSkeleton />
        <LoadingOverlay />
      </main>
    </div>
  ), []);

  if (!isFullyLoaded) {
    return loadingSkeleton;
  }

  return <>{children}</>;
}

export default memo(FullPageLoading);