'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"

type Board = {
  id: string;
  name: string;
  createdAt: string;
};

const Workspace = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const router = useRouter();

  // 當組件加載時，從 localStorage 恢復已保存的 board 資料
  useEffect(() => {
    const savedBoards = localStorage.getItem('boards');
    if (savedBoards) {
      setBoards(JSON.parse(savedBoards));
    }
  }, []);

  // 新增 Board 的邏輯
  const addBoard = () => {
    const newBoardId = `board-${Date.now()}`; // 使用時間戳生成唯一 ID
    const newBoardName = 'Central Topic'; // 允許用戶輸入名稱
    const newBoard: Board = {
      id: newBoardId,
      name: newBoardName, // 使用用戶輸入的名稱
      createdAt: new Date().toLocaleString(),
    };
    const updatedBoards = [...boards, newBoard];
    setBoards(updatedBoards);
    // 將新增的 boards 更新到 localStorage
    localStorage.setItem('boards', JSON.stringify(updatedBoards));
  };

  // 刪除 Board 的邏輯
  const deleteBoard = (boardId: string) => {
    const updatedBoards = boards.filter((board) => board.id !== boardId);
    setBoards(updatedBoards);
    localStorage.setItem('boards', JSON.stringify(updatedBoards));
  };

  return (
    <div className={`p-6 min-h-screen dotted-bg`}>
      <h1 className="text-2xl font-bold mb-6">工作區</h1>
      <Button onClick={addBoard} variant="default" className="mb-6">
        Add Board
      </Button>

      <div className="boards-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {boards.map((board) => (
          <div
            key={board.id}
            className="from-gray-900 to-gray-800 border-2 border-primary dark:border-gray-800 text-black flex flex-col justify-between space-y-2 rounded-lg shadow-lg p-4  dark:bg-white dark:from-white dark:to-white dark:text-black"
          >
            <h3 className="text-lg font-semibold">{board.name}</h3>
            <p>{board.createdAt}</p>
            <div className="flex space-x-2 justify-end w-full">
              {/* 查看按鈕 - 使用 Shadcn Button */}
              <Button
                className='bg-primary text-white dark:text-black hover:bg-primary dark:hover:bg-primary dark:bg-primary dark:text-white'
                onClick={() => router.push(`/board/${board.id}`)}
                variant="secondary"
              >
                View
              </Button>

              {/* 刪除按鈕 - 使用 Shadcn Button */}
              <Button
                className='bg-red-500 dark:bg-rose-500 dark:text-white'
                onClick={() => deleteBoard(board.id)}
                variant="destructive"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Workspace;
