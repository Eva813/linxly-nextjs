import { useState, useEffect, useCallback } from 'react';
import { usePromptStore } from "@/stores/prompt";
import { useCurrentPrompt } from '@/lib/useCurrentPrompt';
import { useAutoSave } from '@/hooks/useAutoSave';
import { deepEqual } from '@/lib/utils/deepEqual';

interface ShortcutError {
  conflictingShortcut: string;
  message: string;
}

interface UsePromptPageLogicProps {
  promptId: string;
}

export const usePromptPageLogic = ({ promptId }: UsePromptPageLogicProps) => {
  const { folders, updatePrompt } = usePromptStore();
  const { prompt: currentPrompt } = useCurrentPrompt(promptId);

  // 主要狀態
  const [name, setName] = useState("");
  const [shortcut, setShortcut] = useState("");
  const [content, setContent] = useState("");
  const [shortcutError, setShortcutError] = useState<ShortcutError | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // 儲存初始值用於比較
  const [initialValues, setInitialValues] = useState({
    name: "",
    shortcut: "",
    content: ""
  });

  // 檢查快捷鍵衝突的邏輯
  const validateShortcut = useCallback((newShortcut: string) => {
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

  // 自動儲存邏輯
  const autoSaveHandler = useCallback(async () => {
    if (!currentPrompt) return;

    const updatedPrompt = {
      ...currentPrompt,
      name,
      shortcut,
      content,
    };

    try {
      await updatePrompt(promptId, updatedPrompt);
      
      // 儲存成功後更新初始值
      setInitialValues({
        name,
        shortcut,
        content
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("儲存時發生錯誤:", error);
      throw error;
    }
  }, [currentPrompt, name, shortcut, content, promptId, updatePrompt]);

  const { triggerAutoSave } = useAutoSave({
    onSave: autoSaveHandler,
    delay: 2000,
    enabled: hasUnsavedChanges,
    promptId
  });

  // 處理快捷鍵變更
  const handleShortcutChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newShortcut = e.target.value;
    setShortcut(newShortcut);

    const trimmedShortcut = newShortcut.trim();
    if (!trimmedShortcut) {
      setShortcutError(null);
      return;
    }

    const validation = validateShortcut(trimmedShortcut);
    if (validation.isValid) {
      setShortcutError(null);
    } else {
      setShortcutError(validation.error || null);
    }
  }, [validateShortcut]);

  // 處理名稱變更
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  }, []);

  // 載入初始值
  useEffect(() => {
    if (currentPrompt) {
      setName(currentPrompt.name);
      setShortcut(currentPrompt.shortcut || "");
      setContent(currentPrompt.content);
      
      setInitialValues({
        name: currentPrompt.name,
        shortcut: currentPrompt.shortcut || "",
        content: currentPrompt.content
      });
      
      setHasUnsavedChanges(false);
    }
  }, [currentPrompt]);

  // 檢查是否有未儲存的變更並觸發自動儲存
  useEffect(() => {
    const currentValues = {
      name,
      shortcut,
      content
    };
    
    const hasChanges = !deepEqual(currentValues, initialValues);
    
    // 防止初始載入時觸發
    if (hasChanges && currentPrompt) {
      setHasUnsavedChanges(true);
      const timer = setTimeout(() => {
        triggerAutoSave();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [name, shortcut, content, initialValues, triggerAutoSave, currentPrompt]);

  // 提供設定內容的方法（給 Editor 使用）
  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  // 清除快捷鍵錯誤
  const clearShortcutError = useCallback(() => {
    setShortcutError(null);
  }, []);

  return {
    // 狀態
    name,
    shortcut,
    content,
    shortcutError,
    hasUnsavedChanges,
    currentPrompt,
    
    // 方法
    handleNameChange,
    handleShortcutChange,
    updateContent,
    clearShortcutError,
  };
};