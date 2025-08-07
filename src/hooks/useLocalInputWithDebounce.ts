import { useState, useEffect, useCallback, useRef } from 'react';

interface UseLocalInputWithDebounceOptions {
  initialValue: string;
  onValueChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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

  // 當父組件的值改變時同步本地狀態
  useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);

  // 立即更新本地狀態，延遲通知父組件
  const handleLocalChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // 立即更新本地狀態以確保流暢的用戶體驗
    setLocalValue(value);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // 設置新的定時器來延遲通知父組件
    timeoutRef.current = setTimeout(() => {
      onValueChange(e);
    }, delay);
  }, [onValueChange, delay]);

  // 清理定時器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    localValue,
    handleLocalChange
  };
};