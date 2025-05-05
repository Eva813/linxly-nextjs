"use client";

import { useEffect, useState, useRef } from "react";
import { useSnippetStore } from "@/stores/snippet";
import { Skeleton } from "@/components/ui/skeleton";
import EditorSkeleton from "@/app/snippets/components/editorSkeleton";
import LoadingOverlay from "@/app/components/loadingOverlay";
import { useRouter } from "next/navigation";

// 提供一個全頁載入的狀態，當資料尚未載入完成時顯示載入動畫
export default function FullPageLoading({ children }: { children: React.ReactNode }) {
  const { fetchFolders } = useSnippetStore();
  const [isLoaded, setIsLoaded] = useState(false);
  // guard ref，確保只呼叫一次
  const hasCalled = useRef(false);
  const router = useRouter();

useEffect(() => {
  if (hasCalled.current) return;
  hasCalled.current = true;

  fetchFolders()
    .then(() => {
      setIsLoaded(true);
    })
    .catch(err => {
      if (err.status === 401) {
        router.replace('/login');
      } else {
        console.error('fetchFolders error:', err);
        setIsLoaded(true); 
      }
    });
}, [fetchFolders, router]);

  if (!isLoaded) {
    return (
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* 側邊欄載入狀態 */}
        <div className="w-1/4 p-4 border-r border-gray-300 h-full overflow-y-auto">
          <div className="grid grid-cols-2 gap-x-4 mb-4">
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
          <div className="flex-1">
            <ul>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="px-2 py-2 mb-2">
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