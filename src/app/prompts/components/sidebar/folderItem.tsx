"use client";

import React, { useContext, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FolderItemProps } from "@/types/prompt";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
} from "lucide-react"

import { SidebarContext } from '@/providers/clientRootProvider';
import { useSidebarStore } from "@/stores/sidebar";
import { useSidebarActions } from "@/hooks/sidebar";
import { useEditableState } from '@/hooks/useEditableState';
import { FolderShareDialog } from '@/components/folder/folderShareDialog';

const FolderItemComponent: React.FC<FolderItemProps> = ({
  folder,
  children,
}) => {
  const { isOpen, toggleSidebar } = useContext(SidebarContext);
  const { 
    activeFolderMenuId, 
    setActiveFolderMenu, 
    collapsedFolderIds, 
    toggleFolderCollapse
  } = useSidebarStore();
  const { navigation, handleDeleteFolder } = useSidebarActions();
  const { canDelete } = useEditableState();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  
  const isActiveFolder = useMemo(() => 
    navigation.currentFolderId === folder.id, 
    [navigation.currentFolderId, folder.id]
  );
  
  const isCollapsed = useMemo(() => 
    collapsedFolderIds.has(folder.id), 
    [collapsedFolderIds, folder.id]
  );
  
  const handleLinkClick = useCallback(() => {
    if (isOpen) toggleSidebar();
  }, [isOpen, toggleSidebar]);
  
  const handleToggleCollapse = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFolderCollapse(folder.id);
  }, [folder.id, toggleFolderCollapse]);
  
  const handleMenuClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveFolderMenu(
      activeFolderMenuId === folder.id ? null : folder.id
    );
  }, [activeFolderMenuId, folder.id, setActiveFolderMenu]);
  
  const handleDeleteClick = useCallback(() => {
    handleDeleteFolder(folder.id);
  }, [folder.id, handleDeleteFolder]);
  
  const handleShareClick = useCallback(() => {
    setIsShareDialogOpen(true);
  }, []);
  
  const handleCloseShareDialog = useCallback(() => {
    setIsShareDialogOpen(false);
  }, []);
  
  const linkClassName = useMemo(() => 
    `px-2 py-1 w-full block rounded font-extrabold hover:bg-light dark:hover:text-third flex items-center justify-between text-lg ${
      isActiveFolder ? "bg-light text-primary dark:text-third" : ""
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
            className="focus:outline-none p-1 hover:bg-gray-light dark:hover:bg-light rounded"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4  text-gray-400" />
            )}
          </button>
          {isCollapsed ? (
            <Folder className="text-gray-500 w-4 h-4 mr-2" />
          ) : (
            <FolderOpen className="text-gray-500 w-4 h-4 mr-2" />
          )}
          <strong className="cursor-pointer">{folder.name}</strong>
        </div>
        <div className="flex items-center">
          {/* DropdownMenu */}
          {canDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={handleMenuClick}
                className="focus:outline-none hover:bg-gray-200 dark:hover:bg-light p-1 rounded"
              >
                <BsThreeDotsVertical className="text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            {activeFolderMenuId === folder.id && (
              <DropdownMenuContent>
                {canDelete && (
                  <>
                    <DropdownMenuItem className="dark:hover:bg-light">
                      <button
                        onClick={handleShareClick}
                        className="w-full text-left"
                      >
                        Share Folder
                      </button>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="dark:hover:bg-light">
                      <button
                        onClick={handleDeleteClick}
                        className="w-full text-left"
                      >
                        Delete
                      </button>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            )}
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
    </li>
  );
};

const FolderItem = React.memo(FolderItemComponent);

export default FolderItem;
