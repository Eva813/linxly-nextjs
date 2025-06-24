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
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  }, []);

  const performSave = useCallback(async () => {
    if (!enabled || !promptId) return;

    try {
      setSaving(true, promptId);
      await onSave();
      setSaved(promptId); // 這會自動設置 isActive 為 false
    } catch (error) {
      console.error('自動儲存失敗:', error);
      setSaveError(true, promptId);
      setActive(false, promptId); // 儲存失敗時也要清除活躍狀態
    }
  }, [onSave, enabled, promptId, setSaving, setSaved, setSaveError, setActive]);

  // 用戶開始編輯時調用
  const startActivity = useCallback(() => {
    if (!enabled || !promptId) return;
    
    clearTimeouts();
    setActive(true, promptId); // 設為活躍狀態，顯示「儲存中...」
  }, [enabled, promptId, setActive, clearTimeouts]);

  // 觸發自動儲存（防抖動）
  const triggerAutoSave = useCallback(() => {
    if (!enabled || !promptId) return;

    clearTimeouts();
    setActive(true, promptId); // 確保顯示「儲存中...」
    
    timeoutRef.current = setTimeout(() => {
      performSave();
    }, delay);
  }, [enabled, promptId, delay, performSave, setActive, clearTimeouts]);

  // 失焦時立即儲存
  const triggerBlurSave = useCallback(() => {
    if (!enabled || !promptId) return;

    clearTimeouts();
    
    // 短暫延遲後儲存，避免快速 focus/blur 切換
    blurTimeoutRef.current = setTimeout(() => {
      performSave();
    }, 100);
  }, [enabled, promptId, performSave, clearTimeouts]);

  // 清理函式
  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  return {
    triggerAutoSave,
    triggerBlurSave,
    startActivity,
    performSave
  };
};
