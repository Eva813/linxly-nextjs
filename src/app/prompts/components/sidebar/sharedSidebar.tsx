'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSharedFoldersCount } from '@/hooks/useSharedFolders';

const SharedSidebar: React.FC = () => {
  const pathname = usePathname();
  const { count: sharedFolderCount, isLoading } = useSharedFoldersCount();

  const isSharedOverview = pathname === '/shared-with-me';

  return (
    <div className="p-4 border-r border-gray-300 h-full flex flex-col">
      {/* 返回主頁按鈕 */}
      <div className="mb-6">
        <Link href="/prompts">
          <Button variant="outline" className="w-full justify-start gap-2 h-10">
            <ArrowLeft className="h-4 w-4" />
            Back to My Space
          </Button>
        </Link>
      </div>

      {/* Page Title Section */}
      <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-light dark:bg-blue-900/30 rounded-md">
            <Users className="h-5 w-5 text-primary dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Shared with Me
            </h2>
          </div>
        </div>

        {/* Statistics Information */}
        {!isLoading && sharedFolderCount > 0 && (
          <div className="text-sm text-muted-foreground">
            {sharedFolderCount} shared folders in total
          </div>
        )}
      </div>

      {/* Navigation Section */}
      <div className="flex-1">
        <nav className="space-y-2">
          {/* Overview Page */}
          <Link
            href="/shared-with-me"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full',
              isSharedOverview
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            )}
          >
            <Home className="h-4 w-4" />
            <span className="flex-1">All Shared Folders</span>
            {!isLoading && sharedFolderCount > 0 && (
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  isSharedOverview
                    ? 'bg-background/80 text-foreground/80'
                    : 'bg-light text-muted-foreground'
                )}
              >
                {sharedFolderCount}
              </span>
            )}
          </Link>
        </nav>
      </div>

      {/* 底部資訊 */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-muted-foreground">
        <p>You can only view or edit content shared with you</p>
        <p className="mt-1">Permissions are determined by the sharer</p>
      </div>
    </div>
  );
};

export default SharedSidebar;
