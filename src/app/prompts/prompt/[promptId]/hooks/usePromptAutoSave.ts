import { useCallback } from 'react';
import { usePromptStore } from "@/stores/prompt";
import { useAutoSave } from '@/hooks/useAutoSave';

interface PromptData {
  id: string;
  name: string;
  shortcut?: string;
  content: string;
}

interface UsePromptAutoSaveProps {
  promptId: string;
  formData: {
    name: string;
    shortcut: string;
    content: string;
  };
  currentPrompt: PromptData | null;
  hasUnsavedChanges: boolean;
  onSaveSuccess: () => void;
}

export const usePromptAutoSave = ({
  promptId,
  formData,
  currentPrompt,
  hasUnsavedChanges,
  onSaveSuccess
}: UsePromptAutoSaveProps) => {
  const { updatePrompt } = usePromptStore();

  const autoSaveHandler = useCallback(async () => {
    if (!currentPrompt) return;

    const updatedPrompt = {
      ...currentPrompt,
      ...formData,
    };

    try {
      await updatePrompt(promptId, updatedPrompt);
      onSaveSuccess();
    } catch (error) {
      console.error("儲存時發生錯誤:", error);
      throw error;
    }
  }, [currentPrompt, formData, promptId, updatePrompt, onSaveSuccess]);

  const { triggerAutoSave } = useAutoSave({
    onSave: autoSaveHandler,
    delay: 2000,
    enabled: hasUnsavedChanges,
    promptId
  });

  return {
    triggerAutoSave,
    saveNow: autoSaveHandler,
  };
};
