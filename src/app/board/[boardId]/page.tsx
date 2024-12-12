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

const FlowWithNoSSR = dynamic(
  () => import('../../components/flow'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center" style={{
        background: 'var(--background)'
      }}>
        <div className="text-xl dark:text-white">Loading Flow Editor...</div>
      </div>
    )
  }
);

export default function BoardPage() {
  const [boardName, setBoardName] = useState<string>('');
  const params = useParams();
  const boardId = params?.boardId as string;
  // 在組件加載時檢查是否有已保存的 board 名稱
  // useEffect(() => {
  //   const savedBoardName = localStorage.getItem(`boardName-${boardId}`);
  //   if (savedBoardName) {
  //     setBoardName(savedBoardName);
  //   }
  // }, [boardId]);
  useEffect(() => {
    const savedBoardName = localStorage.getItem(`boardName-${boardId}`);
    if (savedBoardName) {
      setBoardName(savedBoardName);
    } else {
      // 如果沒有保存的名稱，從 boards 中獲取名稱
      const boards = JSON.parse(localStorage.getItem('boards') || '[]');
      const board = boards.find((b: Board) => b.id === boardId);
      if (board) {
        setBoardName(board.name); // 設置為從 Workspace 獲取的名稱
      }
    }
  }, [boardId]);

  const saveBoardName = () => {
    // 儲存 board 名稱到 localStorage
    localStorage.setItem(`boardName-${boardId}`, boardName);
    console.log('Board name saved:', boardName);

    // 更新 boards 陣列中的名稱
    const boards = JSON.parse(localStorage.getItem('boards') || '[]');
    const updatedBoards = boards.map((board: Board) =>
      board.id === boardId ? { ...board, name: boardName } : board
    );
    localStorage.setItem('boards', JSON.stringify(updatedBoards)); // 更新 boards 陣列
  };

  console.log('boardId', boardId);
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
