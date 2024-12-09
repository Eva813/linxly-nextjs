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
    const newBoard: Board = {
      id: newBoardId,
      name: 'Central Topic', // 預設名稱，可以允許用戶後續更改
      createdAt: new Date().toLocaleString(), // 記錄創建時間
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
        新增 Board
      </Button>

      <div className="boards-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {boards.map((board) => (
          <div
            key={board.id}
            className="bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col justify-between space-y-2 rounded-lg shadow-lg p-4  dark:bg-white dark:from-white dark:to-white dark:text-black"
          >
            <h3 className="text-lg font-semibold">{board.name}</h3>
            <p>{board.createdAt}</p>
            <div className="flex space-x-2 justify-end w-full">
              {/* 查看按鈕 - 使用 Shadcn Button */}
              <Button
                className='bg-gray-600 text-white dark:text-black hover:bg-gray-600 dark:hover:bg-gray-400 dark:bg-gray-400 dark:text-white'
                onClick={() => router.push(`/board/${board.id}`)}
                variant="secondary"
              >
                查看
              </Button>

              {/* 刪除按鈕 - 使用 Shadcn Button */}
              <Button
                className='bg-red-500 dark:bg-rose-500 dark:text-white'
                onClick={() => deleteBoard(board.id)}
                variant="destructive"
              >
                刪除
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Workspace;
