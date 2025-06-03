'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { usePromptStore } from "@/stores/prompt";
import { useBoardStorage } from './useBoardStorage';



// 預載 Flow 組件
const FlowWithNoSSR = dynamic(() => import('../../components/flow'), {
  ssr: false,
  loading: () => (
    <div className="w-full flex items-center justify-center" style={{
      background: 'var(--background)'
    }}>
      <div className="text-xl dark:text-white">Loading Flow Editor...</div>
    </div>
  )
});

export default function BoardPage() {
  const params = useParams();
  const boardId = params?.boardId as string;
  const { boardName, setBoardName, saveBoardName } = useBoardStorage(boardId);
  const { folders, fetchFolders } = usePromptStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchFolders();
      } catch (error) {
        console.error('Failed to fetch folders:', error);
      }
    };
    fetchData();
  }, [fetchFolders]);

  useEffect(() => {
      if (folders.length > 0) {
        console.log('Fetched folders:', folders);
      }
  }, [folders]);

  return (
    <div className="w-full h-[calc(100vh-64px)] bg-white-50">
      <div className="fixed top-19 left-4 flex items-center space-x-2 bg-white-50 p-2 rounded z-50">
        <Input
          type="text"
          value={boardName}
          onChange={(e) => setBoardName(e.target.value)}
          placeholder="Enter board name"
          className="w-64"
        />
        <Button type="button" onClick={saveBoardName}>Save name</Button>
      </div>
      <FlowWithNoSSR boardId={boardId} />
    </div>
  );
}
