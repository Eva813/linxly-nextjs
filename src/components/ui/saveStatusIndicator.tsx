import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useSaveStore } from '@/stores/loading';
import { FaCheck, FaSpinner, FaExclamationCircle } from 'react-icons/fa';

interface SaveStatusIndicatorProps {
  className?: string;
}

const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({ className = '' }) => {
  const params = useParams();
  const promptId = (params?.promptId as string) || '';
  const { isSaving, getSaveStateForPrompt } = useSaveStore();
  const { hasSaveError, isActive } = getSaveStateForPrompt(promptId);

  // 本地顯示狀態：idle、saving、saved、error
  // idle:表示「閒置狀態」，也就是目前沒有進行任何儲存操作或活動的狀態
  const [displayState, setDisplayState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [currentPromptId, setCurrentPromptId] = useState(promptId);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // 當 promptId 改變時，重置組件狀態
  useEffect(() => {
    if (currentPromptId !== promptId) {
      clearTimer();
      setDisplayState('idle');
      setCurrentPromptId(promptId);
    }
  }, [promptId, currentPromptId]);

  // 監聽儲存狀態變化
  useEffect(() => {
    if (hasSaveError) {
      clearTimer();
      setDisplayState('error');
    } else if (isActive || isSaving) {
      clearTimer();
      setDisplayState('saving');
    } else if (displayState === 'saving') {
      // 從 saving 轉為 saved，並設定 1.2 秒後自動隱藏
      setDisplayState('saved');
      timerRef.current = setTimeout(() => {
        setDisplayState('idle');
      }, 1200);
    }
  }, [isActive, isSaving, hasSaveError, displayState]);

  useEffect(() => {
    return clearTimer;
  }, []);


  const renderContent = () => {
    switch (displayState) {
      case 'saving':
        return (
          <div className="flex items-center space-x-2 text-primary">
            <FaSpinner className="h-3 w-3 animate-spin" />
            <span className="text-sm font-medium">Saving...</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center space-x-2 text-rose-600">
            <FaExclamationCircle className="h-3 w-3" />
            <span className="text-sm font-medium">Save failed</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center space-x-2 text-teal-600">
            <FaCheck className="h-3 w-3" />
            <span className="text-sm font-medium">All changes saved</span>
          </div>
        );
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
