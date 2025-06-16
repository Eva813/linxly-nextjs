"use client";

import React, { useContext } from "react";
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
import { useSidebarStore } from "@/stores/sidebar/sidebarStore";
import { useSidebarActions } from "@/stores/sidebar/useSidebarActions";

const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  children,
}) => {
  const { isOpen, toggleSidebar } = useContext(SidebarContext);
  const { 
    activeFolderMenu, 
    setActiveFolderMenu, 
    collapsedFolders, 
    toggleCollapse 
  } = useSidebarStore();
  const { pathname, handleDeleteFolder } = useSidebarActions();
  const isActiveFolder = pathname === `/prompts/folder/${folder.id}`;
  const isCollapsed = collapsedFolders.has(folder.id);

  return (
    <li className="mb-2">
      <Link
        prefetch
        href={`/prompts/folder/${folder.id}`}
        onClick={() => {
          if (isOpen) toggleSidebar();
        }}
        className={`px-2 py-1 w-full block rounded font-extrabold hover:bg-light dark:hover:text-third flex items-center justify-between text-lg ${
          isActiveFolder ? "bg-light text-primary dark:text-third" : ""
        }`}
      >
        <div className="flex items-center">
          {/* 折疊/展開按鈕 移到資料夾圖示左側 */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleCollapse(folder.id);
            }}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveFolderMenu(
                    activeFolderMenu === folder.id ? null : folder.id
                  );
                }}
                className="focus:outline-none hover:bg-gray-200 dark:hover:bg-light p-1 rounded"
              >
                <BsThreeDotsVertical className="text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            {activeFolderMenu === folder.id && (
              <DropdownMenuContent>
                <DropdownMenuItem className="dark:hover:bg-light">
                  <button
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="w-full text-left"
                  >
                    Delete
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            )}
          </DropdownMenu>
        </div>
      </Link>
      {/* 如果沒有折疊，顯示 children（也就是 prompt 列表） */}
      {!isCollapsed && children}
    </li>
  );
};

export default FolderItem;
