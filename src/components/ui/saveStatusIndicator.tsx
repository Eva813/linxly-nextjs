import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useSaveStore } from '@/stores/loading';
import { FaCheck, FaSpinner, FaExclamationCircle } from 'react-icons/fa';

interface SaveStatusIndicatorProps {
  className?: string;
  type?: 'prompt' | 'folder'; // 新增 type 屬性
  id?: string; // 新增 id 屬性，優先於 params
}

const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({ 
  className = '', 
  type = 'prompt',
  id 
}) => {
  const params = useParams();
  
  // 根據 type 決定使用的 ID
  const entityId = id || (type === 'prompt' 
    ? (params?.promptId as string) || '' 
    : (params?.folderId as string) || ''
  );
  
  const { isSaving, getSaveStateForPrompt, getSaveStateForFolder } = useSaveStore();
  
  // 根據 type 選擇對應的 getSaveState 函式
  const getSaveState = type === 'prompt' ? getSaveStateForPrompt : getSaveStateForFolder;
  const { hasSaveError, isActive } = getSaveState(entityId);

  // 本地顯示狀態：idle、saving、saved、error
  // idle:表示「閒置狀態」，也就是目前沒有進行任何儲存操作或活動的狀態
  const [displayState, setDisplayState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [currentEntityId, setCurrentEntityId] = useState(entityId);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null ) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // 當 entityId 改變時，重置組件狀態
  useEffect(() => {
    if (currentEntityId === entityId) return;

    clearTimer();
    setDisplayState('idle');
    setCurrentEntityId(entityId);
  }, [entityId, currentEntityId]);

  // 根據儲存流程切換狀態
  useEffect(() => {
    const isDebouncing = isActive && !isSaving;
    const isTransitionToSaved = !isActive && !isSaving && displayState === 'saving';

    if (hasSaveError) {
      clearTimer();
      return setDisplayState('error');
    }

    if (isSaving || isDebouncing) {
      clearTimer(); // 正在儲存中，避免舊 timer 打斷流程
      return setDisplayState('saving');
    }

    if (isTransitionToSaved) {
      clearTimer();
      return setDisplayState('saved');
    }
  }, [isActive, isSaving, hasSaveError, displayState]);

  // saved 後自動隱藏
  useEffect(() => {
    if (displayState === 'saved') {
      timerRef.current = setTimeout(() => {
        setDisplayState('idle');
      }, 1200);
      return () => clearTimer();
    }
  }, [displayState]);

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
