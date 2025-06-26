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

// 將快捷鍵驗證邏輯提取為函式
const validateShortcut = (
  newShortcut: string, 
  allPrompts: Array<{ id: string; shortcut?: string }>,
  currentPromptId: string
): { isValid: boolean; error?: ShortcutError } => {
  const trimmedShortcut = newShortcut.trim();
  
  if (!trimmedShortcut) {
    return { isValid: true };
  }

  const otherPrompts = allPrompts.filter(p => p.id !== currentPromptId);

  for (const prompt of otherPrompts) {
    const existingShortcut = prompt.shortcut ?? "";
    
    if (trimmedShortcut === existingShortcut) {
      return {
        isValid: false,
        error: {
          conflictingShortcut: existingShortcut,
          message: "Please choose a unique shortcut."
        }
      };
    }
    
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
          message: "Shortcuts cannot overlap with existing shortcuts."
        }
      };
    }
  }

  return { isValid: true };
};

export const usePromptPageLogic = ({ promptId }: UsePromptPageLogicProps) => {
  const { folders, updatePrompt } = usePromptStore();
  const { prompt: currentPrompt } = useCurrentPrompt(promptId);

  // 表單狀態
  const [formData, setFormData] = useState({
    name: "",
    shortcut: "",
    content: ""
  });
  
  const [shortcutError, setShortcutError] = useState<ShortcutError | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // 儲存初始值用於比較
  const [initialValues, setInitialValues] = useState({
    name: "",
    shortcut: "",
    content: ""
  });

  // 取得所有提示詞用於驗證
  const allPrompts = folders.flatMap(folder => folder.prompts);

  // 自動儲存處理器
  const autoSaveHandler = useCallback(async () => {
    if (!currentPrompt) return;

    const updatedPrompt = {
      ...currentPrompt,
      ...formData,
    };

    try {
      await updatePrompt(promptId, updatedPrompt);
      
      setInitialValues(formData);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("儲存時發生錯誤:", error);
      throw error;
    }
  }, [currentPrompt, formData, promptId, updatePrompt]);

  // 自動儲存 hook
  const { triggerAutoSave } = useAutoSave({
    onSave: autoSaveHandler,
    delay: 2000,
    enabled: hasUnsavedChanges,
    promptId
  });

  // 統一的表單更新函式
  const updateFormField = useCallback((field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 特殊處理快捷鍵驗證
    if (field === 'shortcut') {
      const trimmedValue = value.trim();
      if (!trimmedValue) {
        setShortcutError(null);
        return;
      }

      const validation = validateShortcut(trimmedValue, allPrompts, promptId);
      if (validation.isValid) {
        setShortcutError(null);
      } else {
        setShortcutError(validation.error || null);
      }
    }
  }, [allPrompts, promptId]);

  // 表單處理器
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormField('name', e.target.value);
  }, [updateFormField]);

  const handleShortcutChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormField('shortcut', e.target.value);
  }, [updateFormField]);

  const updateContent = useCallback((newContent: string) => {
    updateFormField('content', newContent);
  }, [updateFormField]);

  // 載入初始值
  useEffect(() => {
    if (currentPrompt) {
      const initialData = {
        name: currentPrompt.name,
        shortcut: currentPrompt.shortcut || "",
        content: currentPrompt.content
      };
      
      setFormData(initialData);
      setInitialValues(initialData);
      setHasUnsavedChanges(false);
    }
  }, [currentPrompt]);

  // 檢查變更並觸發自動儲存
  useEffect(() => {
    const hasChanges = !deepEqual(formData, initialValues);
    
    if (hasChanges && currentPrompt) {
      setHasUnsavedChanges(true);
      const timer = setTimeout(() => {
        triggerAutoSave();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [formData, initialValues, triggerAutoSave, currentPrompt]);

  // 清除快捷鍵錯誤
  const clearShortcutError = useCallback(() => {
    setShortcutError(null);
  }, []);

  return {
    // 表單狀態
    name: formData.name,
    shortcut: formData.shortcut,
    content: formData.content,
    shortcutError,
    hasUnsavedChanges,
    currentPrompt,
    
    handleNameChange,
    handleShortcutChange,
    updateContent,
    clearShortcutError,
  };
};