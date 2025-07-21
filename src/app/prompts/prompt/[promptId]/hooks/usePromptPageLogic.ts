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
  const { currentSpaceId } = usePromptSpaceStore();
  const { prompt: currentPrompt } = useCurrentPrompt(promptId);
  const { setSaving, setSaved, setSaveError, setActive } = useSaveStore();
  const { canEdit } = useEditableState();

  // 表單狀態
  const [formData, setFormData] = useState({
    name: "",
    shortcut: "",
    content: ""
  });

  const [shortcutError, setShortcutError] = useState<ShortcutError | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 儲存初始值用於比較 - 這個值只在 currentPrompt 變化時更新
  const [initialValues, setInitialValues] = useState({
    name: "",
    shortcut: "",
    content: ""
  });

  // 只用一個 ref 來追蹤是否正在進行 API 操作，避免在 API 回應期間重複觸發
  const isApiOperationRef = useRef(false);

  // 取得所有提示詞用於驗證
  const allPrompts = folders.flatMap(folder => folder.prompts);

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
      setHasUnsavedChanges(false);
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

  // 統一的表單更新函式
  const updateFormField = useCallback((field: keyof typeof formData, value: string) => {
    const newData = { ...formData, [field]: value };
    const hasChanges = !deepEqual(newData, initialValues);

    // 更新狀態
    setFormData(newData);
    setHasUnsavedChanges(hasChanges);

    if (hasChanges && currentPrompt && !isApiOperationRef.current && canEdit) {
        setActive(true, promptId);
        debouncedSave(newData);
    } else if (!hasChanges) {
        setActive(false, promptId);
    }

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
}, [allPrompts, promptId, initialValues, currentPrompt, setActive, debouncedSave, formData, canEdit]);

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
      // 使用函式更新來避免依賴 formData
      setFormData(prevFormData => {
        if (!deepEqual(prevFormData, currentInitialData)) {
          setInitialValues(currentInitialData);
          setHasUnsavedChanges(false);
          return currentInitialData;
        }
        return prevFormData;
      });
    }
  }, [currentInitialData, setInitialValues, setHasUnsavedChanges]);

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