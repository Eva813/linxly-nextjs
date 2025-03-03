'use client'
// index.js
import { useEffect } from 'react';
import { useRouter } from 'next/navigation'
import { useSnippets } from "@/contexts/SnippetsContext";

const Snippets = () => {
  const router = useRouter();
  const { folders } = useSnippets();

  useEffect(() => {
    // 如果 folders 有資料，就跳轉到第一個 folder
    if (folders.length > 0) {
      router.push(`/snippets/folder/${folders[0].id}`);
    }
  }, [folders, router]);

  return (
    <div>
      <h1>Snippets</h1>
      <p>Loading...</p>
    </div>
  );
};

export default Snippets;