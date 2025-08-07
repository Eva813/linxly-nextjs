import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { usePromptStore } from "@/stores/prompt";
import { usePromptSpaceStore } from "@/stores/promptSpace";
import { useCurrentPrompt } from '@/lib/useCurrentPrompt';
import { useSaveStore } from '@/stores/loading';
import { deepEqual } from '@/lib/utils/deepEqual';
import debounce from '@/lib/utils/debounce';
import { useEditableState } from '@/hooks/useEditableState';

interface ShortcutError {
  conflictingShortcut: string;
  message: string;
}

interface UsePromptPageLogicProps {
  promptId: string;
}

// 輸入清理函數 - 移除潛在危險字元並標準化輸入（保留 / 用於快捷指令）
const sanitizeShortcut = (input: string): string => {
  return input
    .trim()
    .replace(/[<>"'`\\]/g, '') // 移除潛在危險字元，但保留 / 用於快捷指令
    .replace(/\s+/g, ' ')
    .slice(0, 50); // 限制長度
};

const validateShortcut = (
  newShortcut: string,
  otherPrompts: Array<{ id: string; shortcut?: string }>,
): { isValid: boolean; error?: ShortcutError } => {
  const trimmedShortcut = sanitizeShortcut(newShortcut);

  if (!trimmedShortcut) {
    return { isValid: true };
  }

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
  const { currentSpaceId } = usePromptSpaceStore();
  const { prompt: currentPrompt } = useCurrentPrompt(promptId);
  const { setSaving, setSaved, setSaveError, setActive } = useSaveStore();
  const { canEdit } = useEditableState();

  const [formData, setFormData] = useState(() => ({
    name: "",
    shortcut: "",
    content: ""
  }));

  const [shortcutError, setShortcutError] = useState<ShortcutError | null>(null);

  // 儲存初始值用於比較 - 這個值只在 currentPrompt 變化時更新
  const [initialValues, setInitialValues] = useState(() => ({
    name: "",
    shortcut: "",
    content: ""
  }));

  // 只用一個 ref 來追蹤是否正在進行 API 操作，避免在 API 回應期間重複觸發
  const isApiOperationRef = useRef(false);

  // 使用 useMemo 優化 allPrompts 計算，只在 folders 變化時重新計算
  const allPrompts = useMemo(() => 
    folders.flatMap(folder => folder.prompts), 
    [folders]
  );

  // 預先篩選非目前 prompt 的其他 prompts，避免在驗證時重複篩選
  const otherPrompts = useMemo(() => 
    allPrompts.filter(p => p.id !== promptId),
    [allPrompts, promptId]
  );

  // 穩定的儲存函式
  const savePrompt = useCallback(async (dataToSave: typeof formData) => {
    if (!currentPrompt || isApiOperationRef.current || !canEdit) return;

    const updatedPrompt = {
      ...currentPrompt,
      ...dataToSave,
    };

    try {
      isApiOperationRef.current = true;
      setSaving(true, promptId);
      await updatePrompt(promptId, updatedPrompt, currentSpaceId || undefined);

      setSaved(promptId);
      setInitialValues(dataToSave);
    } catch (error) {
      setSaveError(true, promptId);
      console.error("儲存時發生錯誤:", error);
    } finally {
      isApiOperationRef.current = false;
    }
  }, [currentPrompt, promptId, updatePrompt, setSaving, setSaved, setSaveError, canEdit, currentSpaceId]);

  // 建立穩定的 debounced 儲存函式
  const debouncedSave = useMemo(() => {
    const saveFunction = (data: { name: string; shortcut: string; content: string }) => {
      savePrompt(data);
    };
    return debounce(saveFunction as (...args: unknown[]) => void, 800);
  }, [savePrompt]);

  // 移除 derived state，改用 useMemo 計算
  const hasUnsavedChanges = useMemo(() => 
    !deepEqual(formData, initialValues),
    [formData, initialValues]
  );

  // 穩定的表單更新函式 - 移除不必要的依賴
  const updateFormField = useCallback((field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []); // 空依賴數組，因為 setFormData 是穩定的


  // 表單處理
  const handleNameChange = useCallback((value: string) => {
    updateFormField('name', value);
  }, [updateFormField]);

  const handleShortcutChange = useCallback((value: string) => {
    const sanitizedValue = sanitizeShortcut(value);
    
    // 先更新表單欄位
    updateFormField('shortcut', sanitizedValue);
    
    // 然後進行驗證
    if (!sanitizedValue) {
      setShortcutError(null);
    } else {
      const validation = validateShortcut(sanitizedValue, otherPrompts);
      setShortcutError(validation.isValid ? null : validation.error || null);
    }
  }, [updateFormField, otherPrompts]);

  const updateContent = useCallback((newContent: string) => {
    updateFormField('content', newContent);
  }, [updateFormField]);

  // 初始化資料 - 使用 useMemo 來穩定初始值計算
  const currentInitialData = useMemo(() => {
    if (!currentPrompt) return null;
    return {
      name: currentPrompt.name,
      shortcut: currentPrompt.shortcut || "",
      content: currentPrompt.content
    };
  }, [currentPrompt]);

  // 分離的初始化邏輯，避免循環依賴
  useEffect(() => {
    if (currentInitialData && !isApiOperationRef.current) {
      setFormData(prevFormData => {
        if (!deepEqual(prevFormData, currentInitialData)) {
          setInitialValues(currentInitialData);
          return currentInitialData;
        }
        return prevFormData;
      });
    }
  }, [currentInitialData]);

  // 自動儲存邏輯 - 獨立的 effect
  useEffect(() => {
    if (hasUnsavedChanges && currentPrompt && !isApiOperationRef.current && canEdit) {
      setActive(true, promptId);
      debouncedSave(formData);
    } else if (!hasUnsavedChanges) {
      setActive(false, promptId);
    }
  }, [hasUnsavedChanges, currentPrompt, canEdit, promptId, formData, debouncedSave, setActive]);

  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

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

    // 表單更新函式
    handleNameChange,
    handleShortcutChange,
    updateContent,
    clearShortcutError,
  };
};