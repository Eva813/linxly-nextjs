'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Folder, Settings2, Eye, Edit, Users, RefreshCw } from 'lucide-react';
import LoadingSpinner from '@/app/components/loadingSpinner';
import {
  generateCompatibleSafeHTML,
  analyzeInteractiveElements,
  extractTextContent,
} from '@/lib/utils/generateSafeHTML';
import {
  useSharedFolderDetails,
  type SharedFolderDetails,
} from '@/hooks/useSharedFolders';
import type { JSONContent } from '@tiptap/react';

interface SharedFolderPageProps {
  params: {
    folderId: string;
  };
}

const extractContentInfo = (
  content: string | JSONContent | null | undefined,
  contentJSON?: JSONContent | null | undefined
) => {
  const analysis = analyzeInteractiveElements(content, contentJSON);
  const safeHTML = generateCompatibleSafeHTML(content, contentJSON);
  let cleanText = extractTextContent(content, contentJSON);

  if (analysis.totalCount <= 4) {
    cleanText = safeHTML
      .replace(
        /<span[^>]*data-type=\"formtext\"[^>]*><\/span>/g,
        ' [input field] '
      )
      .replace(
        /<span[^>]*data-type=\"formmenu\"[^>]*><\/span>/g,
        ' [dropdown menu] '
      );
  } else {
    cleanText = safeHTML.replace(
      /<span[^>]*data-type=\"[^\"]*\"[^>]*><\/span>/g,
      ' [...] '
    );
  }

  cleanText = cleanText
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    interactiveCount: analysis.totalCount,
    cleanText,
    formTextCount: analysis.formTextCount,
    formMenuCount: analysis.formMenuCount,
  };
};

const PromptItemCard: React.FC<{
  prompt: SharedFolderDetails['prompts'][0];
  folderId: string;
  folderName: string;
}> = ({ prompt, folderId, folderName }) => {
  const { interactiveCount, cleanText, formTextCount, formMenuCount } =
    extractContentInfo(prompt.content, prompt.contentJSON);
  const hasInteractiveElements = interactiveCount > 0;

  // 建立包含上下文的連結
  const promptUrl = `/shared-with-me/prompt/${prompt.id}?folderId=${folderId}&folderName=${encodeURIComponent(folderName)}`;

  return (
    <Card className="w-full hover:shadow-md transition-shadow rounded-md">
      <CardContent className="p-4">
        <Link href={promptUrl} className="block">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <h4 className="font-medium text-sm">{prompt.name}</h4>
                {hasInteractiveElements && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Settings2 className="h-3 w-3" />
                    <span className="text-xs">{interactiveCount}</span>
                  </div>
                )}
              </div>
              {prompt.shortcut && (
                <span className="inline-block px-2 py-1 border border-secondary dark:border-third text-xs rounded-full ml-2">
                  {prompt.shortcut}
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground line-clamp-2">
              {cleanText}
            </p>

            {interactiveCount > 2 && (
              <div className="flex gap-2 text-xs text-muted-foreground">
                {formTextCount > 0 && <span>{formTextCount} input fields</span>}
                {formMenuCount > 0 && (
                  <span>{formMenuCount} dropdown menus</span>
                )}
              </div>
            )}
          </div>
        </Link>
      </CardContent>
    </Card>
  );
};

const SharedFolderPage: React.FC<SharedFolderPageProps> = ({ params }) => {
  const { folderId } = params;
  const {
    folder: folderDetails,
    isLoading,
    error,
    refresh,
  } = useSharedFolderDetails(folderId);

  const getShareSourceText = (folder: SharedFolderDetails) => {
    if (folder.shareType === 'space' && folder.spaceName) {
      return folder.spaceName;
    }
    if (folder.shareType === 'additional' && folder.shareEmail) {
      return folder.shareEmail;
    }
    return 'Unknown source';
  };

  const getPermissionIcon = (permission: string) => {
    return permission === 'edit' ? (
      <Edit className="h-4 w-4" />
    ) : (
      <Eye className="h-4 w-4" />
    );
  };

  const getPermissionText = (permission: string) => {
    return permission === 'edit' ? 'Editable' : 'Read-only';
  };

  const getPermissionColor = (permission: string) => {
    return permission === 'edit'
      ? 'text-green-600 dark:text-green-400'
      : 'text-blue-600 dark:text-blue-400';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Folder className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          Load Error
        </h3>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!folderDetails) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Folder className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          Folder Not Found
        </h3>
        <p className="text-sm text-muted-foreground">
          This shared folder does not exist or has been removed.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 麵包屑導航 */}
      <div className="flex-shrink-0 mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/shared-with-me">Shared with Me</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{folderDetails.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* 資料夾資訊 */}
      <div className="flex-shrink-0 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Folder className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{folderDetails.name}</h1>
              {folderDetails.description && (
                <p className="text-muted-foreground mb-3">
                  {folderDetails.description}
                </p>
              )}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    From: {getShareSourceText(folderDetails)}
                  </span>
                </div>
                <div
                  className={`flex items-center gap-2 ${getPermissionColor(folderDetails.permission)}`}
                >
                  {getPermissionIcon(folderDetails.permission)}
                  <span className="font-medium">
                    {getPermissionText(folderDetails.permission)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
            className="flex items-center gap-2 flex-shrink-0"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Prompts 列表 */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex-shrink-0 mb-4">
          <h3 className="text-lg font-semibold">
            Prompts ({folderDetails.prompts?.length || 0})
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!folderDetails.prompts || folderDetails.prompts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              This folder currently has no Prompts
            </div>
          ) : (
            <div className="space-y-3 pr-2">
              {folderDetails.prompts.map((prompt) => (
                <PromptItemCard
                  key={prompt.id}
                  prompt={prompt}
                  folderId={folderId}
                  folderName={folderDetails.name}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SharedFolderPage;
