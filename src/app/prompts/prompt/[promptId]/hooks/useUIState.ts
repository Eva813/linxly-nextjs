import { useState, useCallback, useRef, useEffect } from 'react';
import { Mode } from "@/app/prompts/components/editViewButtons";

export const useUIState = () => {
  const [mode, setMode] = useState<Mode>("edit");
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [isMobilePanelClosing, setIsMobilePanelClosing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // 切換移動面板
  const toggleMobilePanel = useCallback(() => {
    clearPendingTimeout();
    
    if (isMobilePanelOpen) {
      setIsMobilePanelClosing(true);
      timeoutRef.current = setTimeout(() => {
        setIsMobilePanelClosing(false);
        setIsMobilePanelOpen(false);
        timeoutRef.current = null;
      }, 300);
    } else {
      setIsMobilePanelOpen(true);
    }
  }, [isMobilePanelOpen, clearPendingTimeout]);
  
  useEffect(() => {
    return () => {
      clearPendingTimeout();
    };
  }, [clearPendingTimeout]);

  return {
    mode,
    isMobilePanelOpen,
    isMobilePanelClosing,
    setMode,
    toggleMobilePanel,
  };
};
