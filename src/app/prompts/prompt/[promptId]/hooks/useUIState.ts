import { useState, useCallback } from 'react';
import { Mode } from "@/app/prompts/components/editViewButtons";

export const useUIState = () => {
  // 模式狀態
  const [mode, setMode] = useState<Mode>("edit");
  
  // 移動裝置工具面板狀態
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [isMobilePanelClosing, setIsMobilePanelClosing] = useState(false);

  // 切換移動面板
  const toggleMobilePanel = useCallback(() => {
    if (isMobilePanelOpen) {
      setIsMobilePanelClosing(true);
      setTimeout(() => {
        setIsMobilePanelClosing(false);
        setIsMobilePanelOpen(false);
      }, 300);
    } else {
      setIsMobilePanelOpen(true);
    }
  }, [isMobilePanelOpen]);

  return {
    // 狀態
    mode,
    isMobilePanelOpen,
    isMobilePanelClosing,
    
    // 設定方法
    setMode,
    toggleMobilePanel,
  };
};
