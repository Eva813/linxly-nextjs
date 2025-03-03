'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Board {
  id: string;
  name: string;
}

// const FlowWithNoSSR = dynamic(
//   () => import('../../components/flow'),
//   {
//     ssr: false,
//     loading: () => (
//       <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center" style={{
//         background: 'var(--background)'
//       }}>
//         <div className="text-xl dark:text-white">Loading Flow Editor...</div>
//       </div>
//     )
//   }
// );
// 預載 Flow 組件
const FlowWithNoSSR = dynamic(() => import('../../components/flow'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center" style={{
        background: 'var(--background)'
      }}>
      <div className="text-xl dark:text-white">Loading Flow Editor...</div>
    </div>
  )
});

export default function BoardPage() {
  const [boardName, setBoardName] = useState<string>('');
  const params = useParams();
  const boardId = params?.boardId as string;

  const boards = useMemo(() => {
    return JSON.parse(localStorage.getItem('boards') || '[]');
  }, []);

  useEffect(() => {
    const savedBoardName = localStorage.getItem(`boardName-${boardId}`);
    if (savedBoardName) {
      if (savedBoardName !== boardName) setBoardName(savedBoardName);
    } else {
      const board = boards.find((b: Board) => b.id === boardId);
      if (board && board.name !== boardName) {
        setBoardName(board.name);
      }
    }
  }, [boardId, boardName, boards]);

  const saveBoardName = () => {
    if (!boardId) return;

    localStorage.setItem(`boardName-${boardId}`, boardName);
    console.log('Board name saved:', boardName);

    // 直接更新 useMemo 內的 boards，避免再次解析 JSON
    const updatedBoards = boards.map((board: Board) =>
      board.id === boardId ? { ...board, name: boardName } : board
    );
    localStorage.setItem('boards', JSON.stringify(updatedBoards));
  };

  return (
    <div className="w-full h-[calc(100vh-64px)] bg-white-50">
      <div className="fixed top-19 left-4 flex items-center space-x-2 bg-white-50 p-2 rounded z-50">
        <Input
          type="text"
          value={boardName}
          onChange={(e) => setBoardName(e.target.value)} // 更新 board 名稱
          placeholder="Enter board name"
          className="bord-none w-64"
        />
        <Button type="button" onClick={saveBoardName}>Save name</Button>
      </div>
      <FlowWithNoSSR boardId={boardId as string} />
    </div>
  );
}
