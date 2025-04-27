'use client';

import LoadingSpinner from "@/app/components/loadingSpinner";
import { useLoadingStore } from '@/stores/loading';

export default function LoadingOverlay() {
  const { isLoading } = useLoadingStore();
  
  if (!isLoading) return null;
  
  return (
    <div className="loading-overlay">
      <LoadingSpinner />
    </div>
  );
}