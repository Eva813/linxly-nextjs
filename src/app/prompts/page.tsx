'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation'
import { usePromptStore } from "@/stores/prompt";
import EditorSkeleton from '@/app/prompts/components/editorSkeleton';

const Prompts = () => {
  const router = useRouter();
  const { folders } = usePromptStore();

  useEffect(() => {
    // 如果 folders 有資料，就跳轉到第一個 folder
    if (folders.length > 0) {
      router.push(`/prompts/folder/${folders[0].id}`);
    }
  }, [folders, router]);

  return (
    <EditorSkeleton />
  );
};

export default Prompts;