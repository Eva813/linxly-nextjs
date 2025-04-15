'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation'
import { useSnippetStore } from "@/stores/snippet";
import { Skeleton } from "@/components/ui/skeleton"

const Snippets = () => {
  const router = useRouter();
  const { folders } = useSnippetStore();

  useEffect(() => {
    // 如果 folders 有資料，就跳轉到第一個 folder
    if (folders.length > 0) {
      router.push(`/snippets/folder/${folders[0].id}`);
    }
  }, [folders, router]);

  return (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-6 w-[250px]" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
};

export default Snippets;