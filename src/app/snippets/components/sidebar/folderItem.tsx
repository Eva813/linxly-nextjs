"use client";

import React, { useState, useEffect } from "react";
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
import ShareFolderDialog from "./shareFolderDialog";
import { getFolderShares } from "@/api/folders";
import { useSession } from "next-auth/react";

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
  const [isShareDialogOpen, setShareDialogOpen] = React.useState(false);
  const isActiveFolder = pathname === `/snippets/folder/${folder.id}`;
  const isCollapsed = collapsedFolders.has(folder.id);
  const [shares, setShares] = useState<{ email: string; permission: string; _id: string }[]>([]);
  const { data: session } = useSession();
  const userPermission = shares.find(s => s.email === session?.user?.email)?.permission;

  useEffect(() => {
    if (session?.user?.email && session.user.id) {
      getFolderShares(folder.id)
        .then((list) => {
          setShares(list);
        })
        .catch((err) => console.error("Share folder error", err));
    }
  }, [folder.id, session?.user?.email, session?.user?.id]);


  return (
    <li className="mb-2">
      {/* 資料夾本身的連結區塊 */}
      <Link
        prefetch
        className={`px-2 py-1 w-full block rounded font-extrabold hover:bg-light dark:hover:text-third flex items-center justify-between text-lg ${isActiveFolder ? "bg-light text-primary dark:text-third" : ""
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
                    onClick={() => {
                      setShareDialogOpen(true);
                      setActiveFolderMenu(null);
                    }}
                    className="w-full text-left"
                  >
                    share folder
                  </button>
                </DropdownMenuItem>
                <DropdownMenuItem 
                    className="dark:hover:bg-light disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={userPermission !== "owner"}
                    onSelect={() => deleteFolder(folder.id)}>
                  <button>
                    Delete
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            )}
          </DropdownMenu>
        </div>
      </Link>
      <ShareFolderDialog
        isOpen={isShareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        folderId={folder.id}
        setShares={setShares}
        shares={shares}
      />
      {/* 如果沒有折疊，顯示 children（也就是 snippet 列表） */}
      {!isCollapsed && children}
    </li>
  );
};

export default FolderItem;
