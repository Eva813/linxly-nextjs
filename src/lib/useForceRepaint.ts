import { useEffect, useRef } from 'react';

/**
 * 用於處理強制重繪以重置動畫效果的自定義 Hook
 * @param highlight 是否啟用高亮效果
 * @param focusPosition 聚焦位置
 * @returns 參照物件，應用到需要強制重繪的元素
 */
export function useForceRerender(highlight?: boolean, focusPosition?: string | null) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlight && focusPosition && containerRef.current) {
      // 移除現有的動畫
      containerRef.current.style.animation = 'none';
      // 強制重繪
      void containerRef.current.offsetHeight; // Use void operator to indicate intentional usage
      // 重新添加動畫
      containerRef.current.style.animation = '';
    }
  }, [highlight, focusPosition]);

  return containerRef;
}