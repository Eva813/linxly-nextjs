import { useCallback, useEffect, RefObject, useMemo } from 'react';
import { useSnippetStore } from "@/stores/snippet";
import { Snippet } from '@/types/snippets'

interface UseSnippetInsertionProps {
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  onInsert: (newValue: string) => void;
}

export const useSnippetInsertion = ({ inputRef, onInsert }: UseSnippetInsertionProps) => {
  const {
    folders,
    matchedSnippet,
    setMatchedSnippet,
    setIsDialogOpen, // UI 狀態控制
  } = useSnippetStore();

    // 根據 folders 計算 snippetMap
    const snippetMap = useMemo(() => {
      const map = new Map<string, Snippet>();
      folders.forEach(folder => {
        folder.snippets.forEach(snippet => {
          // 你可以根據需求過濾或加工，例如只處理以 "/" 開頭的 shortcut
          map.set(snippet.shortcut, snippet);
        });
      });
      return map;
    }, [folders]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    if (!target || target !== inputRef.current) return;

    const cursorPosition = target.selectionStart || 0;
    const textBeforeCursor = target.value.substring(0, cursorPosition);

    // 找出符合條件的 snippet (以 shortcut 為依據)
    let longestMatch: Snippet | null = null;
    for (const [shortcut, snippet] of snippetMap.entries()) {
      if (textBeforeCursor.endsWith(shortcut)) {
        if (!longestMatch || shortcut.length > longestMatch.shortcut.length) {
          longestMatch = {
            ...snippet,
            shortcut, // 保證 shortcut 也被傳遞
          };
        }
      }
    }

    if (longestMatch) {
      // 檢查內容中是否包含表單欄位
      const hasFormFields = longestMatch.content.includes('data-type="formtext"');

      if (hasFormFields) {
        // 若有表單欄位，顯示對話框
        setMatchedSnippet({
          content: longestMatch.content,
          targetElement: target,
          insert: false,
          shortcut: longestMatch.shortcut,
        });
        setIsDialogOpen(true);
      } else {
        // 若沒有表單欄位，直接標記插入
        setMatchedSnippet({
          content: longestMatch.content,
          targetElement: target,
          insert: true,
          shortcut: longestMatch.shortcut,
        });
      }
    }
  }, [inputRef, snippetMap, setMatchedSnippet, setIsDialogOpen]);

  useEffect(() => {
    const currentInput = inputRef.current;
    if (!currentInput) return;

    currentInput.addEventListener('keyup', handleKeyUp as EventListener);
    return () => currentInput.removeEventListener('keyup', handleKeyUp as EventListener);
  }, [handleKeyUp, inputRef]);

  useEffect(() => {
    if (matchedSnippet.insert && inputRef.current === matchedSnippet.targetElement) {
      const input = inputRef.current;
      if (!input) return;
      const currentValue = input.value || '';
      const cursorPosition = input.selectionStart || 0;
      const shortcutStart = currentValue.lastIndexOf(matchedSnippet.shortcut, cursorPosition);

      console.log('Shortcut start position:', shortcutStart);
      if (shortcutStart !== -1) {
        const shortcutEnd = shortcutStart + matchedSnippet.shortcut.length;
        const newValue =
          currentValue.slice(0, shortcutStart) +
          matchedSnippet.content +
          currentValue.slice(shortcutEnd);

        onInsert(newValue);

        // 設定新光標位置
        const newPosition = shortcutStart + matchedSnippet.content.length;
        input.focus();
        input.setSelectionRange(newPosition, newPosition);

        // 重設 matchedSnippet 狀態
        setMatchedSnippet({
          content: '',
          targetElement: null,
          insert: false,
          shortcut: '',
        });
      }
    }
  }, [matchedSnippet, inputRef, onInsert, setMatchedSnippet]);
};