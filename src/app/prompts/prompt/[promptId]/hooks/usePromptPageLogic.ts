import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { usePromptStore } from "@/stores/prompt";
import { useCurrentPrompt } from '@/lib/useCurrentPrompt';
import { useSaveStore } from '@/stores/loading';
import { deepEqual } from '@/lib/utils/deepEqual';
import debounce from '@/lib/utils/debounce';

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
  const { setSaving, setSaved, setSaveError, setActive } = useSaveStore();

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

  // 追蹤是否正在進行外部更新（例如從 API 載入資料）
  const isExternalUpdateRef = useRef(false);
  
  // 使用 ref 來避免不必要的重新建立
  const formDataRef = useRef(formData);
  const currentPromptRef = useRef(currentPrompt);

  // 更新 ref
  useEffect(() => {
    formDataRef.current = formData;
    currentPromptRef.current = currentPrompt;
  });

  // 取得所有提示詞用於驗證
  const allPrompts = folders.flatMap(folder => folder.prompts);

  // 穩定的儲存函式，使用 ref 來取得最新值
  const savePrompt = useCallback(async () => {
    const currentFormData = formDataRef.current;
    const currentPromptData = currentPromptRef.current;

    if (!currentPromptData) return;

    const updatedPrompt = {
      ...currentPromptData,
      ...currentFormData,
    };

    try {
      setSaving(true, promptId);
      await updatePrompt(promptId, updatedPrompt);

      setSaved(promptId);
      setInitialValues(currentFormData);
      setHasUnsavedChanges(false);
    } catch (error) {
      setSaveError(true, promptId);
      console.error("儲存時發生錯誤:", error);
    }
  }, [promptId, updatePrompt, setSaving, setSaved, setSaveError]);

  // 建立穩定的 debounced 儲存函式
  const debouncedSave = useMemo(
    () => debounce(savePrompt, 800),
    [savePrompt]
  );

  // 統一的表單更新函式
  const updateFormField = useCallback((field: keyof typeof formData, value: string) => {
    // 如果是外部更新，直接設定不觸發儲存
    if (isExternalUpdateRef.current) {
      setFormData(prev => ({ ...prev, [field]: value }));
      return;
    }

    // 立即更新表單資料
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // 立即檢查是否有變更
      const hasChanges = !deepEqual(newData, initialValues);
      setHasUnsavedChanges(hasChanges);

      // 延遲狀態更新到下一個事件循環，避免在渲染期間更新其他元件
      setTimeout(() => {
        if (hasChanges && currentPrompt) {
          setActive(true, promptId);
          // 觸發 debounced 儲存
          debouncedSave();
        } else if (!hasChanges) {
          setActive(false, promptId);
        }
      }, 0);

      return newData;
    });

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
  }, [allPrompts, promptId, initialValues, currentPrompt, setActive, debouncedSave]);

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

  // 初始化資料
  useEffect(() => {
    if (currentPrompt) {
      const initialData = {
        name: currentPrompt.name,
        shortcut: currentPrompt.shortcut || "",
        content: currentPrompt.content
      };

      // 標記為外部更新
      isExternalUpdateRef.current = true;
      
      setFormData(initialData);
      setInitialValues(initialData);
      setHasUnsavedChanges(false);
      
      // 在下一個事件循環中重置標記
      setTimeout(() => {
        isExternalUpdateRef.current = false;
      }, 0);
    }
  }, [currentPrompt]);

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
    
    // 檢查是否為外部更新
    isExternalUpdate: () => isExternalUpdateRef.current,
  };
};