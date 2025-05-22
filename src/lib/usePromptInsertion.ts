import { useCallback, useEffect, RefObject, useMemo } from 'react';
import { usePromptStore } from "@/stores/prompt";
import { Prompt } from '@/types/prompt'

interface UsePromptInsertionProps {
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  onInsert: (newValue: string) => void;
}

export const usePromptInsertion = ({ inputRef, onInsert }: UsePromptInsertionProps) => {
  const {
    folders,
    matchedPrompt,
    setMatchedPrompt,
    setIsDialogOpen, // UI 狀態控制
  } = usePromptStore();

    // 根據 folders 計算 promptMap
    const promptMap = useMemo(() => {
      const map = new Map<string, Prompt>();
      folders.forEach(folder => {
        folder.prompts.forEach(prompt => {
          // 你可以根據需求過濾或加工，例如只處理以 "/" 開頭的 shortcut
          map.set(prompt.shortcut, prompt);
        });
      });
      return map;
    }, [folders]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    if (!target || target !== inputRef.current) return;

    const cursorPosition = target.selectionStart ?? 0;
    const textBeforeCursor = target.value.substring(0, cursorPosition);

    // 找出符合條件的 prompt (以 shortcut 為依據)
    let longestMatch: Prompt | null = null;
    for (const [shortcut, prompt] of promptMap.entries()) {
      if (textBeforeCursor.endsWith(shortcut)) {
        if (!longestMatch || shortcut.length > longestMatch.shortcut.length) {
          longestMatch = {
            ...prompt,
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
        setMatchedPrompt({
          content: longestMatch.content,
          targetElement: target,
          insert: false,
          shortcut: longestMatch.shortcut,
        });
        setIsDialogOpen(true);
      } else {
        // 若沒有表單欄位，直接標記插入
        setMatchedPrompt({
          content: longestMatch.content,
          targetElement: target,
          insert: true,
          shortcut: longestMatch.shortcut,
        });
      }
    }
  }, [inputRef, promptMap, setMatchedPrompt, setIsDialogOpen]);

  useEffect(() => {
    const currentInput = inputRef.current;
    if (!currentInput) return;

    currentInput.addEventListener('keyup', handleKeyUp as EventListener);
    return () => currentInput.removeEventListener('keyup', handleKeyUp as EventListener);
  }, [handleKeyUp, inputRef]);

  useEffect(() => {
    if (matchedPrompt.insert && inputRef.current === matchedPrompt.targetElement) {
      const input = inputRef.current;
      if (!input) return;
      const currentValue = input.value || '';
      const cursorPosition = input.selectionStart || 0;
      const shortcutStart = currentValue.lastIndexOf(matchedPrompt.shortcut, cursorPosition);

      console.log('Shortcut start position:', shortcutStart);
      if (shortcutStart !== -1) {
        const shortcutEnd = shortcutStart + matchedPrompt.shortcut.length;
        const newValue =
          currentValue.slice(0, shortcutStart) +
          matchedPrompt.content +
          currentValue.slice(shortcutEnd);

        onInsert(newValue);

        // 設定新光標位置
        const newPosition = shortcutStart + matchedPrompt.content.length;
        input.focus();
        input.setSelectionRange(newPosition, newPosition);

        // 重設 matchedPrompt 狀態
        setMatchedPrompt({
          content: '',
          targetElement: null,
          insert: false,
          shortcut: '',
        });
      }
    }
  }, [matchedPrompt, inputRef, onInsert, setMatchedPrompt]);
};