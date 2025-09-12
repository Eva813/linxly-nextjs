'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Folder, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/app/components/loadingSpinner';
import { useSharedFolders, type SharedFolder } from '@/hooks/useSharedFolders';

const SharedFoldersOverview: React.FC = () => {
  const {
    folders: sharedFolders,
    isLoading,
    error,
    refresh,
  } = useSharedFolders();

  const getShareSourceText = (folder: SharedFolder) => {
    return `From: ${folder.sharedFrom}`;
  };

  const getPermissionText = (permission: string) => {
    return permission === 'edit' ? 'Editable' : 'Read-only';
  };

  const getPermissionColor = (permission: string) => {
    return permission === 'edit'
      ? 'text-green-600 dark:text-green-400'
      : 'text-primary dark:text-blue-400';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 頁面標題 */}
      <div className="flex-shrink-0 mb-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground mt-2">
            View folders and Prompts shared with you by others
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* 錯誤提示 */}
      {error && (
        <div className="flex-shrink-0 mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* 主要內容區域 */}
      <div className="flex-1 overflow-y-auto">
        {sharedFolders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Folder className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No shared folders
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              When others share folders with you, they will appear here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-2">
            {sharedFolders.map((folder) => (
              <Card
                key={folder.id}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <Link href={`/shared-with-me/${folder.id}`}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* 資料夾標題 */}
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-md group-hover:bg-primary/20 transition-colors">
                          <Folder className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {folder.name}
                          </h3>
                          <span
                            className={`text-sm font-medium ${getPermissionColor(folder.permission)}`}
                          >
                            {getPermissionText(folder.permission)}
                          </span>
                        </div>
                      </div>

                      {/* 統計資訊 */}
                      <div className="text-sm">
                        <span className="text-muted-foreground">
                          {folder.promptCount} 個 Prompts
                        </span>
                      </div>

                      {/* 分享來源 */}
                      <div className="text-sm text-muted-foreground">
                        {getShareSourceText(folder)}
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedFoldersOverview;
