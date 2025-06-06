"use client";
import { useState, useEffect, useCallback } from 'react';

interface Board {
  id: string;
  name: string;
}

export function useBoardStorage(boardId: string) {
  const [boardName, setBoardName] = useState<string>('');
  const [boards, setBoards] = useState<Board[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('boards');
      const parsed: Board[] = stored ? JSON.parse(stored) : [];
      setBoards(parsed);
      const savedName = localStorage.getItem(`boardName-${boardId}`);
      if (savedName) {
        setBoardName(savedName);
      } else {
        const b = parsed.find((b) => b.id === boardId);
        if (b) {
          setBoardName(b.name);
        }
      }
    } catch (e) {
			console.error('Failed to load boards or boardName', e);
      setBoards([]);
      setBoardName('');
    }
  }, [boardId]);

  const saveBoardName = useCallback(() => {
    if (!boardId) return;
    localStorage.setItem(`boardName-${boardId}`, boardName);
    const updated = boards.map((b) =>
      b.id === boardId ? { ...b, name: boardName } : b
    );
    localStorage.setItem('boards', JSON.stringify(updated));
    setBoards(updated);
		setBoardName(boardName);
  }, [boardId, boardName, boards]);

  return { boardName, setBoardName, saveBoardName, boards };
}
