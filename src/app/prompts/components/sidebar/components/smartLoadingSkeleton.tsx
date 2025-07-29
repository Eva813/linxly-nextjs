"use client";

import React, { useState, useEffect } from "react";
import LoadingSkeleton from "./loadingSkeleton";

interface SmartLoadingSkeletonProps {
  variant?: "folder" | "prompt";
  className?: string;
  isLoading: boolean;
  delayMs?: number; // 延遲顯示時間，預設 300ms
  minShowMs?: number; // 最小顯示時間，預設 500ms
}

/**
 * 智能載入骨架屏組件
 * 避免快速載入時的閃爍問題
 */
const SmartLoadingSkeleton: React.FC<SmartLoadingSkeletonProps> = ({
  variant = "prompt",
  className,
  isLoading,
  delayMs = 300,
  minShowMs = 500
}) => {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    let delayTimer: NodeJS.Timeout;
    let minShowTimer: NodeJS.Timeout;

    if (isLoading) {
      // 延遲顯示載入狀態
      delayTimer = setTimeout(() => {
        setShowSkeleton(true);
        setStartTime(Date.now());
      }, delayMs);
    } else {
      // 如果載入完成，但 skeleton 已經顯示，確保最小顯示時間
      if (showSkeleton && startTime) {
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, minShowMs - elapsed);
        
        minShowTimer = setTimeout(() => {
          setShowSkeleton(false);
          setStartTime(null);
        }, remainingTime);
      } else {
        setShowSkeleton(false);
        setStartTime(null);
      }
    }

    return () => {
      clearTimeout(delayTimer);
      clearTimeout(minShowTimer);
    };
  }, [isLoading, showSkeleton, startTime, delayMs, minShowMs]);

  if (!showSkeleton) {
    return null;
  }

  return <LoadingSkeleton variant={variant} className={className} />;
};

export default SmartLoadingSkeleton;