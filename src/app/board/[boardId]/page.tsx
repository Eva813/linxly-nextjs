'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Board {
  id: string;
  name: string;
}

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
  const [boardName, setBoardName] = useState<string>('');
  const [boards, setBoards] = useState<Board[]>([]);
  const params = useParams();
  const boardId = params?.boardId as string;

  useEffect(() => {
    const storedBoards = localStorage.getItem('boards');
    if (storedBoards) {
      setBoards(JSON.parse(storedBoards));
    }
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

    // 更新 boards 並存回 localStorage
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
