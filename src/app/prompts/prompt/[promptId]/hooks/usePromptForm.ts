import { useState, useEffect, useCallback } from 'react';
import { useCurrentPrompt } from '@/lib/useCurrentPrompt';
import { deepEqual } from '@/lib/utils/deepEqual';

interface PromptFormState {
  name: string;
  shortcut: string;
  content: string;
}

export const usePromptForm = (promptId: string) => {
  const { prompt: currentPrompt } = useCurrentPrompt(promptId);
  
  // 表單狀態
  const [formState, setFormState] = useState<PromptFormState>({
    name: "",
    shortcut: "",
    content: ""
  });
  
  // 初始值（用於比較變更）
  const [initialValues, setInitialValues] = useState<PromptFormState>({
    name: "",
    shortcut: "",
    content: ""
  });
  
  // 是否有未儲存變更
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 載入初始值
  useEffect(() => {
    if (currentPrompt) {
      const newFormState = {
        name: currentPrompt.name,
        shortcut: currentPrompt.shortcut || "",
        content: currentPrompt.content
      };
      
      setFormState(newFormState);
      setInitialValues(newFormState);
      setHasUnsavedChanges(false);
    }
  }, [currentPrompt]);

  // 檢查變更
  useEffect(() => {
    const hasChanges = !deepEqual(formState, initialValues);
    setHasUnsavedChanges(hasChanges && !!currentPrompt);
  }, [formState, initialValues, currentPrompt]);

  // 更新表單欄位
  const updateField = useCallback(<K extends keyof PromptFormState>(
    field: K, 
    value: PromptFormState[K]
  ) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  }, []);

  // 重置為初始值
  const resetForm = useCallback(() => {
    setFormState(initialValues);
    setHasUnsavedChanges(false);
  }, [initialValues]);

  // 標記為已儲存
  const markAsSaved = useCallback(() => {
    setInitialValues(formState);
    setHasUnsavedChanges(false);
  }, [formState]);

  // 便利的更新方法
  const setName = useCallback((name: string) => updateField('name', name), [updateField]);
  const setShortcut = useCallback((shortcut: string) => updateField('shortcut', shortcut), [updateField]);
  const setContent = useCallback((content: string) => updateField('content', content), [updateField]);

  return {
    // 狀態
    ...formState,
    hasUnsavedChanges,
    currentPrompt,
    
    // 方法
    updateField,
    resetForm,
    markAsSaved,
    
    // 便利的更新方法
    setName,
    setShortcut,
    setContent,
  };
};
