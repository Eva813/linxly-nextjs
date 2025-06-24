import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useSaveStore } from '@/stores/loading';
import { FaCheck, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

interface SaveStatusIndicatorProps {
  className?: string;
}

const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({ className = '' }) => {
  const params = useParams();
  const promptId = (params?.promptId as string) || '';
  const { isSaving, getSaveStateForPrompt } = useSaveStore();
  const { lastSavedAt, hasSaveError, isActive } = getSaveStateForPrompt(promptId);

  // 本地顯示狀態：idle、saving、saved、error
  const [displayState, setDisplayState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastStateRef = useRef<string>('');

  // 監聽儲存狀態，管理顯示時序，增加防抖邏輯
  useEffect(() => {
    // 清除先前的防抖計時器
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // 建立當前狀態字串用於比較
    const currentStateKey = `${isActive}-${isSaving}-${hasSaveError}-${lastSavedAt?.getTime()}`;
    
    // 如果狀態沒有實際變化，不執行更新
    if (currentStateKey === lastStateRef.current) {
      return;
    }

    // 防抖處理：延遲 100ms 執行狀態更新
    debounceRef.current = setTimeout(() => {
      lastStateRef.current = currentStateKey;
      
      // 清除先前的顯示計時器
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (hasSaveError) {
        setDisplayState('error');
      } else if (isActive || isSaving) {
        setDisplayState('saving');
      } else if (lastSavedAt) {
        setDisplayState('saved');
        // 成功訊息顯示 2 秒後隱藏
        timerRef.current = setTimeout(() => setDisplayState('idle'), 2000);
      } else {
        setDisplayState('idle');
      }
    }, 100);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [isActive, isSaving, hasSaveError, lastSavedAt]);

  // 計算從上次儲存到現在的時間
  const getTimeSinceLastSave = () => {
    if (!lastSavedAt) return null;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastSavedAt.getTime()) / 1000);

    if (diffInSeconds < 60) return '剛剛';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} 分鐘前`;
    return `${Math.floor(diffInSeconds / 3600)} 小時前`;
  };

  // 根據本地 displayState 渲染內容
  const renderContent = () => {
    switch (displayState) {
      case 'saving':
        return (
          <div className="flex items-center space-x-2 text-blue-600">
            <FaSpinner className="h-3 w-3 animate-spin" />
            <span className="text-sm font-medium">儲存中...</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center space-x-2 text-red-600">
            <FaExclamationTriangle className="h-3 w-3" />
            <span className="text-sm font-medium">儲存失敗</span>
          </div>
        );
      case 'saved': {
        const timeSince = getTimeSinceLastSave();
        return (
          <div className="flex items-center space-x-2 text-green-600">
            <FaCheck className="h-3 w-3" />
            <span className="text-sm font-medium">
              所有變更已儲存 {timeSince && `• ${timeSince}`}
            </span>
          </div>
        );
      }
      default:
        return null;
    }
  };

  const content = renderContent();
  if (!content) return null;

  return (
    <div className={`transition-all duration-200 ${className}`}>
      {content}
    </div>
  );
};

export default SaveStatusIndicator;
