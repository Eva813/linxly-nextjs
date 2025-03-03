"use client";

import React from "react";
import Link from "next/link";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaCaretDown, FaCaretRight } from "react-icons/fa";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FolderItemProps } from "@/types/snippets";

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
  const isActiveFolder = pathname === `/snippets/folder/${folder.id}`;
  const isCollapsed = collapsedFolders.has(folder.id);

  return (
    <li className="mb-2">
      {/* 資料夾本身的連結區塊 */}
      <Link
        className={`px-2 py-1 w-full block rounded hover:bg-gray-100 dark:hover:text-black flex items-center justify-between text-lg ${
          isActiveFolder ? "bg-slate-100 dark:text-black" : ""
        }`}
        href={`/snippets/folder/${folder.id}`}
      >
        <strong className="cursor-pointer">{folder.name}</strong>
        <div className="flex items-center">
          {/* 折疊/展開按鈕 */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleCollapse(folder.id);
            }}
            className="focus:outline-none hover:bg-gray-200 dark:hover:bg-gray-800 p-1 rounded mr-1"
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
                className="focus:outline-none hover:bg-gray-200 dark:hover:bg-gray-800 p-1 rounded"
              >
                <BsThreeDotsVertical className="text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            {activeFolderMenu === folder.id && (
              <DropdownMenuContent>
                <DropdownMenuItem>
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
      {/* 如果沒有折疊，顯示 children（也就是 snippet 列表） */}
      {!isCollapsed && children}
    </li>
  );
};

export default FolderItem;
