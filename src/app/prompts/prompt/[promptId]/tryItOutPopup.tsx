import { useRef, useEffect, useState } from "react";
import ReactDOM from "react-dom";

// 注意，這邊的 tryItOutPopup 他會搭配擴充，當你輸入捷徑時，會自動替換成對應的程式碼片段(然後他是會打擴充的)
const TryItOutPopup = ({ shortcut, onClose, tryItOutButtonRef }: { shortcut: string; onClose: () => void; tryItOutButtonRef: React.RefObject<HTMLButtonElement> }) => {
  const popupRef = useRef<HTMLDivElement>(null);
  // 計算並設定彈出視窗位置
  const [position, setPosition] = useState({ top: 0, left: 0 });

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
  
  // 動態計算位置，隨視窗縮放或捲動更新
  useEffect(() => {
    const calculatePosition = () => {
      if (tryItOutButtonRef.current && popupRef.current) {
        const rect = tryItOutButtonRef.current.getBoundingClientRect();
        const popupWidth = popupRef.current.offsetWidth;
        // 讓彈窗出現在按鈕下方，並對齊右邊
        setPosition({ top: rect.bottom + 10, left: rect.right - popupWidth });
      }
    };
    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition);
    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition);
    };
  }, [tryItOutButtonRef]);

  const popupContent = (
    <div
      ref={popupRef}
      style={{ position: 'fixed', top: position.top, left: position.left }}
      className="bg-white border border-gray-300 shadow-lg rounded-md z-[999] p-4 w-full max-w-sm max-h-[calc(100vh-2rem)] overflow-auto md:w-96 md:max-w-none sm:max-w-[65%]"
    >
      <p className="text-sm font-medium">
        Type the shortcut：
        <span className="inline-flex items-center px-3 py-1 border border-secondary text-sm h-6 font-medium rounded-full">
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
      <p className="text-xs text-gray-500 mt-2">When typed, your shortcut will insert the prompt.</p>
    </div>
  );

  return ReactDOM.createPortal(popupContent, document.body);
};

export default TryItOutPopup;