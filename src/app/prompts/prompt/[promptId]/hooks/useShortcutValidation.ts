import { useState, useCallback } from 'react';
import { usePromptStore } from "@/stores/prompt";

interface ShortcutError {
  conflictingShortcut: string;
  message: string;
}

export const useShortcutValidation = (promptId: string) => {
  const { folders } = usePromptStore();
  const [shortcutError, setShortcutError] = useState<ShortcutError | null>(null);

  // 檢查快捷鍵衝突
  const validateShortcut = useCallback((
    newShortcut: string
  ): { isValid: boolean; error?: ShortcutError } => {
    const trimmedShortcut = newShortcut.trim();
    
    if (!trimmedShortcut) {
      return { isValid: true };
    }

    const allOtherPrompts = folders
      .flatMap(folder => folder.prompts)
      .filter(p => p.id !== promptId);

    for (const prompt of allOtherPrompts) {
      const existingShortcut = prompt.shortcut ?? "";
      
      // 完全相符
      if (trimmedShortcut === existingShortcut) {
        return {
          isValid: false,
          error: {
            conflictingShortcut: existingShortcut,
            message: "請選擇一個唯一的快捷鍵。"
          }
        };
      }
      
      // 部分重疊 (prefix)
      if (
        trimmedShortcut.length > 0 &&
        existingShortcut.length > 0 &&
        (existingShortcut.startsWith(trimmedShortcut) || 
         trimmedShortcut.startsWith(existingShortcut))
      ) {
        return {
          isValid: false,
          error: {
            conflictingShortcut: existingShortcut,
            message: "快捷鍵不能與現有快捷鍵重疊。"
          }
        };
      }
    }

    return { isValid: true };
  }, [folders, promptId]);

  // 設定快捷鍵並驗證
  const setShortcutWithValidation = useCallback((shortcut: string) => {
    const validation = validateShortcut(shortcut);
    
    if (validation.isValid) {
      setShortcutError(null);
    } else {
      setShortcutError(validation.error || null);
    }
    
    return validation.isValid;
  }, [validateShortcut]);

  // 清除錯誤
  const clearError = useCallback(() => {
    setShortcutError(null);
  }, []);

  return {
    shortcutError,
    validateShortcut,
    setShortcutWithValidation,
    clearError,
  };
};
