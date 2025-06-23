import { useCallback, useEffect, useRef } from 'react';
import debounce, { DebouncedFunction } from '@/lib/utils/debounce';
import { useSaveStore } from '@/stores/loading';

interface UseAutoSaveOptions {
  onSave: () => Promise<void>;
  delay?: number;
  enabled?: boolean;
  promptId?: string;
}

export const useAutoSave = ({ onSave, delay = 1000, enabled = true, promptId }: UseAutoSaveOptions) => {
  const { setSaving, setSaved, setSaveError } = useSaveStore();
  const savePromiseRef = useRef<Promise<void> | null>(null);
  const debouncedSaveRef = useRef<DebouncedFunction<() => Promise<void>> | null>(null);

  const performSave = useCallback(async () => {
    if (!enabled || !promptId) return;

    // 如果已經有正在執行的儲存操作，等待它完成
    if (savePromiseRef.current) {
      await savePromiseRef.current;
    }

    setSaving(true, promptId);

    try {
      const savePromise = onSave();
      savePromiseRef.current = savePromise;
      await savePromise;
      setSaved(promptId);
    } catch (error) {
      console.error('自動儲存失敗:', error);
      setSaveError(true, promptId);
    } finally {
      savePromiseRef.current = null;
    }
  }, [onSave, enabled, promptId, setSaving, setSaved, setSaveError]);

  // 建立 debounced save 函式
  useEffect(() => {
    debouncedSaveRef.current = debounce(performSave, delay);
    
    return () => {
      debouncedSaveRef.current?.cancel();
    };
  }, [performSave, delay]);

  const triggerAutoSave = useCallback(() => {
    if (enabled && debouncedSaveRef.current) {
      debouncedSaveRef.current();
    }
  }, [enabled]);

  // 組件卸載時清理
  useEffect(() => {
    return () => {
      debouncedSaveRef.current?.cancel();
    };
  }, []);

  return { triggerAutoSave, performSave };
};
