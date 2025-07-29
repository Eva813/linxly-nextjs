'use client'

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'
import { usePromptStore } from "@/stores/prompt";
import EditorSkeleton from '@/app/prompts/components/editorSkeleton';

const Prompts = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { folders } = usePromptStore();

  useEffect(() => {
    // 只有在當前路徑是根 /prompts 路徑時才進行跳轉
    // 避免在其他頁面（如 /prompts/prompt/xxx 或 /prompts/folder/xxx）時被誤觸發
    if (pathname === '/prompts' && folders.length > 0) {
      router.push(`/prompts/folder/${folders[0].id}`);
    }
  }, [folders, router, pathname]);

  return (
    <EditorSkeleton />
  );
};

export default Prompts;