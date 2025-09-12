'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSharedFoldersCount } from '@/hooks/useSharedFolders';

const SharedWithMeSection: React.FC = () => {
  const pathname = usePathname();
  const { count: sharedFolderCount, isLoading } = useSharedFoldersCount();

  const isActive = pathname?.startsWith('/shared-with-me') || false;

  return (
    <div className="pb-2">
      <Link
        href="/shared-with-me"
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
        )}
      >
        <Users className="h-4 w-4" />
        <span className="flex-1">Shared with Me</span>
        {!isLoading && sharedFolderCount > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-light text-muted-foreground">
            {sharedFolderCount}
          </span>
        )}
      </Link>
    </div>
  );
};

export default SharedWithMeSection;
