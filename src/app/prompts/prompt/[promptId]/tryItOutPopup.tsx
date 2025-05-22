import { useRef, useEffect } from "react";

// 注意，這邊的 tryItOutPopup 他會搭配擴充，當你輸入捷徑時，會自動替換成對應的程式碼片段(然後他是會打擴充的)
const TryItOutPopup = ({ shortcut, onClose, tryItOutButtonRef  }: { shortcut: string; onClose: () => void; tryItOutButtonRef: React.RefObject<HTMLButtonElement> }) => {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {

      // 檢查點擊是否在按鈕上，如果點擊在按鈕上，不執行關閉操作
      if (tryItOutButtonRef.current && (tryItOutButtonRef.current === event.target || tryItOutButtonRef.current.contains(event.target as Node))) {
        return;
      }
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose, tryItOutButtonRef]);

  return (
    <div 
      ref={popupRef} 
      className="absolute top-full left-0 mt-2 w-96 p-4 bg-white border border-gray-300 shadow-lg rounded-md z-50"
    >
      <p className="text-sm font-medium">
        Type the shortcut：  <span className="inline-flex items-center px-3 py-1 border border-secondary text-sm h-6 font-medium rounded-full">
            {shortcut}
          </span>
      </p>
      <div
        contentEditable
        role="textbox"
        aria-multiline="true"
        suppressContentEditableWarning
        className="w-full mt-2 p-2 border border-gray-300 rounded-md text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y overflow-auto overflow-y-auto scroll-m-0 scroll-p-0 scroll-auto overscroll-none transition-none animate-none outline-none min-h-20 max-h-40"
        
      />
      <p className="text-xs text-gray-500 mt-2">
        When typed, your shortcut will insert the prompt. 
      </p>
    </div>
  );
};

export default TryItOutPopup;