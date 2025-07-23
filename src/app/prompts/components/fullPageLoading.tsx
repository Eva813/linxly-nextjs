"use client";

import { useEffect, useState, useRef } from "react";
import { usePromptSpaceStore } from "@/stores/promptSpace";
import { usePromptStore } from "@/stores/prompt";
import { getAllPromptSpaces } from '@/api/promptSpace';
import { Skeleton } from "@/components/ui/skeleton";
import EditorSkeleton from "@/app/prompts/components/editorSkeleton";
import LoadingOverlay from "@/app/components/loadingOverlay";
import { useRouter } from "next/navigation";

// 當資料尚未載入完成時顯示載入動畫
export default function FullPageLoading({ children }: { children: React.ReactNode }) {
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
  const router = useRouter();

useEffect(() => {
  if (hasCalled.current) return;
  hasCalled.current = true;

  // 優化：並行初始化 spaces 和相關資料
  const initializeSpaces = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getAllPromptSpaces();
      
      // 轉換 owned spaces
      const ownedSpaces = response.ownedSpaces.map(space => ({
        id: space.id,
        name: space.name,
        userId: space.userId,
        createdAt: new Date(space.createdAt),
        updatedAt: space.updatedAt ? new Date(space.updatedAt) : undefined
      }));
      
      // 轉換 shared spaces
      const sharedSpaces = response.sharedSpaces.map(shared => ({
        space: {
          id: shared.space.id,
          name: shared.space.name,
          userId: shared.space.userId,
          createdAt: new Date(shared.space.createdAt),
          updatedAt: shared.space.updatedAt ? new Date(shared.space.updatedAt) : undefined
        },
        permission: shared.permission,
        sharedBy: shared.sharedBy,
        sharedAt: shared.sharedAt
      }));
      
      setAllSpaces(ownedSpaces, sharedSpaces);
      
      // 第一個 space 並並行載入 overview 和 folders
      const allSpaces = [...ownedSpaces, ...sharedSpaces.map(s => s.space)];
      if (allSpaces.length > 0) {
        const firstSpaceId = allSpaces[0].id;
        setCurrentSpace(firstSpaceId);
        
        // 優先載入 folders (用戶最常用)，然後載入 overview
        await fetchFolders(firstSpaceId);
        // overview 在背景載入，不阻塞 UI
        loadSpaceOverview(firstSpaceId).catch(console.error);
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize spaces:', error);
      const err = error as { status?: number };
      if (err.status === 401) {
        router.replace('/login');
      } else {
        setError(error instanceof Error ? error.message : 'Unknown error');
        setIsInitialized(true); 
      }
    } finally {
      setLoading(false);
    }
  };

  initializeSpaces();
}, [router, setAllSpaces, setCurrentSpace, loadSpaceOverview, setLoading, setError, fetchFolders]);


const isFullyLoaded = isInitialized && currentSpaceId;

  if (!isFullyLoaded) {
    return (
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
    );
  }

  return <>{children}</>;
}