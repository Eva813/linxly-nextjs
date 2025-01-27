// hooks/useSnippets.js
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'my_snippets';
// 定義 Snippet 的類型
export interface Snippet {
  id: string;
  name: string;
  content: string;
}
export default function useSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);

  // 加載片段
  useEffect(() => {
    if (typeof window !== 'undefined') { // 確保在客戶端執行
      const storedSnippets = localStorage.getItem(STORAGE_KEY);
      if (storedSnippets) {
        try {
          const parsedSnippets: Snippet[] = JSON.parse(storedSnippets);
          setSnippets(parsedSnippets);
        } catch (error) {
          console.error('Failed to parse snippets from localStorage:', error);
        }
      }
    }
  }, []);

  // 更新 LocalStorage
  const updateStorage = (newSnippets: Snippet[]): void => {
    setSnippets(newSnippets);
    if (typeof window !== 'undefined') { // 確保在客戶端執行
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSnippets));
    }
  };

  // 添加片段
  const addSnippet = (snippet: Snippet): void => {
    const newSnippets = [...snippets, snippet];
    updateStorage(newSnippets);
  };

  // 刪除片段
  const deleteSnippet = (id: string): void => {
    const newSnippets = snippets.filter(snippet => snippet.id !== id);
    updateStorage(newSnippets);
  };

  // 更新片段
  const updateSnippet = (updatedSnippet: Snippet): void => {
    const newSnippets = snippets.map(snippet =>
      snippet.id === updatedSnippet.id ? updatedSnippet : snippet
    );
    updateStorage(newSnippets);
  };

  return {
    snippets,
    addSnippet,
    deleteSnippet,
    updateSnippet,
  };
}
