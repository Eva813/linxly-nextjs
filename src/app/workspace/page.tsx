'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">工作區</h1>
      <button onClick={addBoard} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors mb-6">
        新增 Board
      </button>
      <div className="boards-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {boards.map((board) => (
          <div key={board.id} className="bg-gray-400 text-white p-4 rounded-lg shadow-lg flex flex-col justify-between items-start space-y-2">
            <h3 className="text-lg font-semibold">{board.name}</h3>
            <p>{board.createdAt}</p>
            <button onClick={() => router.push(`/board/${board.id}`)} className="bg-green-500 text-white p-1 rounded hover:bg-green-600 transition-colors">查看</button>
            <button onClick={() => deleteBoard(board.id)} className="bg-red-500 text-white p-1 rounded hover:bg-red-600 transition-colors">
              刪除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Workspace;
