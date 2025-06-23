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
  const { lastSavedAt, hasSaveError } = getSaveStateForPrompt(promptId);

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
    // 只有在使用者實際進行儲存動作時才顯示狀態
    if (isSaving) {
      return (
        <div className="flex items-center space-x-2 text-blue-600">
          <FaSpinner className="h-3 w-3 animate-spin" />
          <span className="text-sm font-medium">Saving...</span>
        </div>
      );
    }

    if (hasSaveError) {
      return (
        <div className="flex items-center space-x-2 text-red-600">
          <FaExclamationTriangle className="h-3 w-3" />
          <span className="text-sm font-medium">Saving failed</span>
        </div>
      );
    }

    // 只有在有儲存過且沒有正在儲存或錯誤狀態時才顯示成功訊息
    if (lastSavedAt && !isSaving && !hasSaveError) {
      const timeSince = getTimeSinceLastSave();
      return (
        <div className="flex items-center space-x-2 text-green-600">
          <FaCheck className="h-3 w-3" />
          <span className="text-sm font-medium">
            All changes saved {timeSince && `• ${timeSince}`}
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
