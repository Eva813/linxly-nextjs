import { useState, useEffect, useCallback, useRef } from 'react';

interface UseLocalInputWithDebounceOptions {
  initialValue: string;
  onValueChange: (value: string) => void; // 簡化介面，直接傳遞值
  delay?: number;
}

export const useLocalInputWithDebounce = ({
  initialValue,
  onValueChange,
  delay = 800
}: UseLocalInputWithDebounceOptions) => {
  // 本地狀態管理輸入，減少父組件重新渲染
  const [localValue, setLocalValue] = useState(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true); // 追蹤組件掛載狀態

  // 當父組件的值改變時同步本地狀態
  useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);

  // 立即更新本地狀態，延遲通知父組件
  const handleLocalChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value; // 提取值，避免事件對象引用問題
    
    // 立即更新本地狀態以確保流暢的用戶體驗
    setLocalValue(value);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // 設置新的定時器來延遲通知父組件
    timeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) { // 檢查組件是否仍然掛載
        onValueChange(value); // 直接傳遞值而非事件對象
      }
    }, delay);
  }, [onValueChange, delay]);

  // 清除防抖的方法
  const clearDebounce = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // 清理定時器和標記組件狀態
  useEffect(() => {
    isMountedRef.current = true; // 標記組件已掛載
    return () => {
      isMountedRef.current = false; // 標記組件卸載
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    localValue,
    handleLocalChange,
    clearDebounce // 提供清除方法供組件使用
  };
};