import { useCallback, useEffect, useRef } from 'react';
import { useSaveStore } from '@/stores/loading';

interface UseAutoSaveOptions {
  onSave: () => Promise<void>;
  delay?: number;
  enabled?: boolean;
  promptId?: string;
}

export const useAutoSave = ({ onSave, delay = 2000, enabled = true, promptId }: UseAutoSaveOptions) => {
  const { setSaving, setSaved, setSaveError, setActive } = useSaveStore();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearCurrentTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const cancelCurrentSave = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const performSave = useCallback(async () => {
    if (!enabled || !promptId) return;

    // 取消進行中的儲存
    cancelCurrentSave();
    
    // 建立新的 AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setSaving(true, promptId);
      
      // 檢查是否已被取消
      if (abortController.signal.aborted) return;
      
      await onSave();
      
      // 再次檢查是否已被取消
      if (abortController.signal.aborted) return;
      
      setSaved(promptId);
    } catch {
      // 如果是因為取消而失敗，不顯示錯誤
      if (abortController.signal.aborted) return;
      
      setSaveError(true, promptId);
      setActive(false, promptId);
    } finally {
      // 只有當前的 controller 才清理
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, [onSave, enabled, promptId, setSaving, setSaved, setSaveError, setActive, cancelCurrentSave]);

  // 觸發自動儲存（防抖動）
  const triggerAutoSave = useCallback(() => {
    if (!enabled || !promptId) return;

    clearCurrentTimeout();
    setActive(true, promptId);
    
    timeoutRef.current = setTimeout(() => {
      performSave();
    }, delay);
  }, [enabled, promptId, delay, performSave, setActive, clearCurrentTimeout]);

  // 立即儲存（例如失焦時）
  const triggerImmediateSave = useCallback(() => {
    if (!enabled || !promptId) return;

    clearCurrentTimeout();
    performSave();
  }, [enabled, promptId, performSave, clearCurrentTimeout]);

  // 清理函式
  useEffect(() => {
    return () => {
      clearCurrentTimeout();
      cancelCurrentSave();
    };
  }, [clearCurrentTimeout, cancelCurrentSave]);

  return {
    triggerAutoSave,
    triggerImmediateSave,
    performSave
  };
};
