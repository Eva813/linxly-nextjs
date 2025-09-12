'use client';

import React, { useContext, useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { BsThreeDotsVertical } from 'react-icons/bs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FolderItemProps } from '@/types/prompt';
import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';

import { SidebarContext } from '@/providers/clientRootProvider';
import { useSidebarStore } from '@/stores/sidebar';
import { useSidebarActions } from '@/hooks/sidebar';
import { useEditableState } from '@/hooks/useEditableState';
import { FolderShareDialog } from '@/components/folder/folderShareDialog';

const DIALOG_TEXTS = {
  deleteTitle: 'Confirm Delete Folder',
  deleteDescription: (name: string) =>
    `Are you sure you want to delete the folder "${name}"? This action cannot be undone, and all prompts inside the folder will also be deleted.`,
  cancelButton: 'Cancel',
  deleteButton: 'Delete',
  shareButton: 'Share Folder',
} as const;

const ICON_STYLES = {
  chevron: 'w-4 h-4 text-gray-400',
  folder: 'text-gray-500 w-4 h-4 mr-2',
} as const;

const FolderItemComponent: React.FC<FolderItemProps> = ({
  folder,
  children,
}) => {
  const { isOpen, toggleSidebar } = useContext(SidebarContext);
  const { collapsedFolderIds, toggleFolderCollapse } = useSidebarStore();
  const { navigation, handleDeleteFolder } = useSidebarActions();
  const { canDelete } = useEditableState();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const isActiveFolder = useMemo(
    () => navigation.currentFolderId === folder.id,
    [navigation.currentFolderId, folder.id]
  );

  const isCollapsed = useMemo(
    () => collapsedFolderIds.has(folder.id),
    [collapsedFolderIds, folder.id]
  );

  const ChevronIcon = isCollapsed ? ChevronRight : ChevronDown;
  const FolderIcon = isCollapsed ? Folder : FolderOpen;

  const handleLinkClick = useCallback(() => {
    if (isOpen) toggleSidebar();
  }, [isOpen, toggleSidebar]);

  const handleToggleCollapse = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFolderCollapse(folder.id);
    },
    [folder.id, toggleFolderCollapse]
  );

  const handleDeleteClick = useCallback(() => {
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    handleDeleteFolder(folder.id);
    setIsDeleteDialogOpen(false);
  }, [folder.id, handleDeleteFolder]);

  const handleShareClick = useCallback(() => {
    setIsShareDialogOpen(true);
  }, []);

  const handleCloseShareDialog = useCallback(() => {
    setIsShareDialogOpen(false);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
  }, []);

  const linkClassName = useMemo(
    () =>
      `px-2 py-1 w-full block rounded font-extrabold hover:bg-light dark:hover:text-third flex items-center justify-between text-lg ${
        isActiveFolder ? 'bg-light text-primary dark:text-third' : ''
      }`,
    [isActiveFolder]
  );

  return (
    <li className="mb-2">
      <Link
        prefetch={true}
        href={`/prompts/folder/${folder.id}`}
        onClick={handleLinkClick}
        className={linkClassName}
      >
        <div className="flex items-center">
          {/* 折疊/展開按鈕 */}
          <button
            onClick={handleToggleCollapse}
            aria-expanded={!isCollapsed}
            aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${folder.name} folder`}
            className="focus:outline-none p-1 hover:bg-gray-200 dark:hover:bg-light rounded"
          >
            <ChevronIcon className={ICON_STYLES.chevron} />
          </button>
          <FolderIcon className={ICON_STYLES.folder} />
          <strong className="cursor-pointer">{folder.name}</strong>
        </div>
        <div className="flex items-center">
          {/* DropdownMenu */}
          {canDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label={`Open menu for ${folder.name} folder`}
                  className="focus:outline-none hover:bg-gray-200 dark:hover:bg-light p-1 rounded"
                >
                  <BsThreeDotsVertical className="text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={handleShareClick}
                  className="dark:hover:bg-light"
                >
                  {DIALOG_TEXTS.shareButton}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDeleteClick}
                  className="dark:hover:bg-light"
                >
                  {DIALOG_TEXTS.deleteButton}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </Link>
      {/* 如果沒有折疊，顯示 children（也就是 prompt 列表） */}
      {!isCollapsed && children}

      {/* FolderShareDialog */}
      <FolderShareDialog
        folder={folder}
        isOpen={isShareDialogOpen}
        onClose={handleCloseShareDialog}
      />

      {/* DeleteConfirmationDialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{DIALOG_TEXTS.deleteTitle}</DialogTitle>
            <DialogDescription>
              {DIALOG_TEXTS.deleteDescription(folder.name)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDeleteDialog}>
              {DIALOG_TEXTS.cancelButton}
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              {DIALOG_TEXTS.deleteButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
};

const FolderItem = React.memo(FolderItemComponent);

export default FolderItem;
