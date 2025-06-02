"use client";
import { useEffect, useRef, useState } from "react";

interface LoadingBarProps {
  active: boolean;
  pathname: string;
}

export default function LoadingBar({ active, pathname }: LoadingBarProps) {
  const isFirst = useRef(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!active) return; 
    if (isFirst.current) {
      isFirst.current = false; 
      return;
    }
    setLoading(true);   
  }, [pathname, active]);

  const onAnimEnd = () => setLoading(false);
  if (!loading) return null;

  return (
    <div
      onAnimationEnd={onAnimEnd}
      className="fixed sm:hidden top-0 left-0 h-1 bg-secondary z-[999] animate-progress-sm"
    />
  );
}