import { useCallback, useEffect, RefObject } from 'react';
import { useSnippets } from '@/contexts/SnippetsContext';

interface UseSnippetInsertionProps {
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  onInsert: (newValue: string) => void;
}

export const useSnippetInsertion = ({ inputRef, onInsert }: UseSnippetInsertionProps) => {
  const {
    matchedSnippet,
    setMatchedSnippet,
    snippetMap,
    setIsDialogOpen, // 添加這個
  } = useSnippets();

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    if (!target || (target !== inputRef.current)) return;

    const cursorPosition = target.selectionStart || 0;
    const textBeforeCursor = target.value.substring(0, cursorPosition);

    // Find matching snippet
    let longestMatch = null;
    for (const [shortcut, snippet] of snippetMap.entries()) {
      if (textBeforeCursor.endsWith(shortcut)) {
        if (!longestMatch || shortcut.length > longestMatch.shortcut.length) {
          longestMatch = {
            ...snippet,
            shortcut // 確保 shortcut 也被傳遞
          };
        }
      }
    }

    if (longestMatch) {
      // 檢查是否包含表單欄位
      const hasFormFields = longestMatch.content.includes('data-type="formtext"');

      if (hasFormFields) {
        // 如果有表單欄位，顯示 dialog
        setMatchedSnippet({
          content: longestMatch.content,
          targetElement: target,
          insert: false,
          shortcut: longestMatch.shortcut
        });
        setIsDialogOpen(true);
      } else {
        // 如果沒有表單欄位，直接插入
        setMatchedSnippet({
          content: longestMatch.content,
          targetElement: target,
          insert: true,
          shortcut: longestMatch.shortcut
        });
      }
    }
  }, [inputRef, setMatchedSnippet, setIsDialogOpen, snippetMap]);

  useEffect(() => {
    const currentInput = inputRef.current;
    if (!currentInput) return;

    currentInput.addEventListener('keyup', handleKeyUp as EventListener);
    return () => currentInput.removeEventListener('keyup', handleKeyUp as EventListener);
  }, [handleKeyUp, inputRef]);

  useEffect(() => {
    if (matchedSnippet.insert && inputRef.current === matchedSnippet.targetElement) {
      const input = inputRef.current;
      const currentValue = input?.value || '';
      if (!input) return;
      const cursorPosition = input.selectionStart || 0;

      const shortcutStart = currentValue.lastIndexOf(matchedSnippet.shortcut, cursorPosition);
      // 計算 shortcut 結束的位置
      // const shortcutEnd = shortcutStart + matchedSnippet.shortcut.length;

      console.log('Shortcut start position:', shortcutStart);
      if (shortcutStart !== -1) {
        const shortcutEnd = shortcutStart + matchedSnippet.shortcut.length;
        const newValue =
          currentValue.slice(0, shortcutStart) +
          matchedSnippet.content +
          currentValue.slice(shortcutEnd);

        onInsert(newValue);

        // 直接設置光標位置
        const newPosition = shortcutStart + matchedSnippet.content.length;
        input.focus();
        input.setSelectionRange(newPosition, newPosition);

        // Reset matched snippet
        setMatchedSnippet({
          content: '',
          targetElement: null,
          insert: false,
          shortcut: ''
        });
      }
    }
  }, [matchedSnippet, inputRef, onInsert, setMatchedSnippet]);

};
