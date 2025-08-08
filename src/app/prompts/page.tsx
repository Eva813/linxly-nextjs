'use client'

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation'
import { usePromptStore } from "@/stores/prompt";
import { usePromptSpaceStore } from "@/stores/promptSpace";
import EditorSkeleton from '@/app/prompts/components/editorSkeleton';

const Prompts = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { folders } = usePromptStore();
  const { currentSpaceId } = usePromptSpaceStore();
  
  // 使用 ref 記錄是否已經自動導航過，避免重複導航
  const hasAutoNavigatedRef = useRef(false);
  const lastSpaceIdRef = useRef<string | null>(null);

  useEffect(() => {
    // 只有在當前路徑是根 /prompts 路徑時才進行跳轉
    // 避免在其他頁面（如 /prompts/prompt/xxx 或 /prompts/folder/xxx）時被誤觸發
    if (pathname !== '/prompts') {
      // 如果離開了 /prompts 頁面，重置導航標記，允許下次回到此頁面時重新導航
      hasAutoNavigatedRef.current = false;
      return;
    }
    
    // 檢測是否為 space 切換：如果 currentSpaceId 發生變化，說明是切換 space
    // 這種情況下應該讓 promptSpaceSelector 處理導航，避免衝突
    const isSpaceChange = lastSpaceIdRef.current !== null && lastSpaceIdRef.current !== currentSpaceId;
    lastSpaceIdRef.current = currentSpaceId;
    
    if (isSpaceChange) {
      // Space 切換時，不進行導航，讓 promptSpaceSelector 處理
      return;
    }
    
    // 如果沒有資料夾，不進行導航
    if (folders.length === 0) return;
    
    // 只在初始載入時進行自動導航
    if (!hasAutoNavigatedRef.current) {
      router.push(`/prompts/folder/${folders[0].id}`);
      hasAutoNavigatedRef.current = true;
    }
  }, [folders, router, pathname, currentSpaceId]);

  return (
    <EditorSkeleton />
  );
};

export default Prompts;