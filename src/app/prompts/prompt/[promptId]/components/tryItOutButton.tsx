import React, { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import TryItOutPopup from '../tryItOutPopup';

interface TryItOutButtonProps {
  shortcut: string;
}

export const TryItOutButton = React.memo(({
  shortcut,
}: TryItOutButtonProps) => {
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const tryItOutButtonRef = useRef<HTMLButtonElement>(null);

  // 使用 useCallback 穩定化事件處理器
  const handleTryItOutClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPopupVisible(prev => !prev);
  }, []);

  const handlePopupClose = useCallback(() => {
    setIsPopupVisible(false);
  }, []);

  return (
    <>
      <Button
        ref={tryItOutButtonRef}
        className="absolute right-[10px] top-1/2 h-8 px-2 text-xs sm:text-sm -translate-y-1/2"
        onClick={handleTryItOutClick}
      >
        Try it out
      </Button>
      {isPopupVisible && (
        <TryItOutPopup
          tryItOutButtonRef={tryItOutButtonRef}
          shortcut={shortcut}
          onClose={handlePopupClose}
        />
      )}
    </>
  );
});

TryItOutButton.displayName = 'TryItOutButton';
