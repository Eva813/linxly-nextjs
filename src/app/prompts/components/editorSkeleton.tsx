'use client'

import { Skeleton } from "@/components/ui/skeleton"

const EditorSkeleton = () => {
  return (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-6 w-[250px]" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
};

export default EditorSkeleton;