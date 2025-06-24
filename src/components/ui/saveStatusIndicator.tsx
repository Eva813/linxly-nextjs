import React from 'react';
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
  
  // 獲取當前 prompt 的儲存狀態
  const { lastSavedAt, hasSaveError, isActive } = getSaveStateForPrompt(promptId);

  // 計算從上次儲存到現在的時間
  const getTimeSinceLastSave = () => {
    if (!lastSavedAt) return null;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastSavedAt.getTime()) / 1000);
    
    if (diffInSeconds < 60) return '剛剛';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} 分鐘前`;
    return `${Math.floor(diffInSeconds / 3600)} 小時前`;
  };

  const renderContent = () => {
    // 如果正在編輯或有變更需要儲存，顯示「儲存中...」
    if (isActive || isSaving) {
      return (
        <div className="flex items-center space-x-2 text-blue-600">
          <FaSpinner className="h-3 w-3 animate-spin" />
          <span className="text-sm font-medium">儲存中...</span>
        </div>
      );
    }

    // 如果有儲存錯誤
    if (hasSaveError) {
      return (
        <div className="flex items-center space-x-2 text-red-600">
          <FaExclamationTriangle className="h-3 w-3" />
          <span className="text-sm font-medium">儲存失敗</span>
        </div>
      );
    }

    // 如果有儲存過且沒有正在儲存或錯誤狀態時才顯示成功訊息
    if (lastSavedAt && !isSaving && !hasSaveError && !isActive) {
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

    // 預設不顯示任何內容，直到使用者開始編輯並觸發儲存
    return null;
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
