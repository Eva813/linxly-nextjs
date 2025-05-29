"use client";

import React, { useContext } from "react";
import Link from "next/link";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaCaretDown, FaCaretRight } from "react-icons/fa";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FolderItemProps } from "@/types/prompt";
import { FaFolder } from "react-icons/fa";

import { SidebarContext } from '@/app/ClientRootProvider';
const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  activeFolderMenu,
  setActiveFolderMenu,
  collapsedFolders,
  toggleCollapse,
  deleteFolder,
  pathname,
  children,
}) => {
  const isActiveFolder = pathname === `/prompts/folder/${folder.id}`;
  const isCollapsed = collapsedFolders.has(folder.id);
  const { isOpen, toggleSidebar } = useContext(SidebarContext);

  return (
    <li className="mb-2">
      {/* 資料夾本身的連結區塊 */}
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
        <div className="flex items-center space-x-2">
          <FaFolder className="text-gray-500" size={20} />
          <strong className="cursor-pointer">{folder.name}</strong>
        </div>
        <div className="flex items-center">
          {/* 折疊/展開按鈕 */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleCollapse(folder.id);
            }}
            className="focus:outline-none hover:bg-gray-200 dark:hover:bg-light p-1 rounded mr-1"
          >
            {isCollapsed ? (
              <FaCaretRight className="text-gray-400" />
            ) : (
              <FaCaretDown className="text-gray-400" />
            )}
          </button>
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
                    onClick={() => deleteFolder(folder.id)}
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
