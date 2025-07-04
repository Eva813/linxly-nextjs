"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSkeletonProps {
  variant?: "folder" | "prompt";
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = "prompt",
  className
}) => {
  const baseClass = variant === "folder" ? "h-8" : "h-6";
  const containerClass = variant === "folder" ? "px-2 py-2" : "px-2 py-1";

  return (
    <li className={containerClass}>
      <Skeleton className={`${baseClass} w-full rounded-md ${className || ""}`} />
    </li>
  );
};

export default LoadingSkeleton;
