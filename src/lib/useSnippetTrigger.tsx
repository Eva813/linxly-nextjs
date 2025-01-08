// lib/useSnippetTrigger.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSnippets } from '@/contexts/SnippetsContext';

export function useSnippetTrigger() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [triggerPosition, setTriggerPosition] = useState({ x: 0, y: 0 });
  const [matchedSnippet, setMatchedSnippet] = useState<{
    content: string;
    targetElement: HTMLInputElement | HTMLTextAreaElement | null;
  }>({
    content: '',
    targetElement: null
  });

  const { folders } = useSnippets();

  useEffect(() => {
    // 找到符合 shortcut 的 snippet
    const findSnippetByShortcut = (shortcut: string) => {
      for (const folder of folders) {
        const snippet = folder.snippets.find(s => s.shortcut === shortcut);
        if (snippet) return snippet;
      }
      return null;
    };

    // 監聽所有輸入事件
    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      const value = target.value;

      // 檢查是否有任何 snippet 的 shortcut 被輸入
      for (const folder of folders) {
        for (const snippet of folder.snippets) {
          if (value.endsWith(snippet.shortcut)) {
            const rect = target.getBoundingClientRect();
            setTriggerPosition({
              x: rect.left,
              y: rect.bottom + window.scrollY
            });
            setMatchedSnippet({
              content: snippet.content,
              targetElement: target
            });
            setIsDialogOpen(true);
            return;
          }
        }
      }
    };

    // 為所有輸入框添加監聽器
    document.addEventListener('input', handleInput);
    return () => document.removeEventListener('input', handleInput);
  }, [folders]);

  return {
    isDialogOpen,
    setIsDialogOpen,
    triggerPosition,
    matchedSnippet,
    setMatchedSnippet
  };
}
