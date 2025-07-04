"use client";

import React, { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ShareFolderDialog from "./shareFolderDialog";
import { getFolderShares } from "@/api/folders";
import { useSession } from "next-auth/react";
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

const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  children,
}) => {
  const [isShareDialogOpen, setShareDialogOpen] = React.useState(false);
  const [shares, setShares] = useState<{ email: string; permission: string; _id: string }[]>([]);
  const { data: session } = useSession();
  const userPermission = shares.find(s => s.email === session?.user?.email)?.permission;

  const { isOpen, toggleSidebar } = useContext(SidebarContext);
  const { 
    activeFolderMenuId, 
    setActiveFolderMenu, 
    collapsedFolderIds, 
    toggleFolderCollapse 
  } = useSidebarStore();
  const { navigation, handleDeleteFolder } = useSidebarActions();
  const isActiveFolder = navigation.pathname === `/prompts/folder/${folder.id}`;
  const isCollapsed = collapsedFolderIds.has(folder.id);

  useEffect(() => {
    if (session?.user?.email && session.user.id) {
      getFolderShares(folder.id)
        .then((list) => {
          console.log("Shares data:", list);
          setShares(list);
        })
        .catch((err) => console.error("Share folder error", err));
    }
  }, [folder.id, session?.user?.email, session?.user?.id]);
  console.log("User permission:", userPermission);

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
              toggleFolderCollapse(folder.id);
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
                    activeFolderMenuId === folder.id ? null : folder.id
                  );
                }}
                className="focus:outline-none hover:bg-gray-200 dark:hover:bg-light p-1 rounded"
              >
                <BsThreeDotsVertical className="text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            {activeFolderMenuId === folder.id && (
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
                    onSelect={() => handleDeleteFolder(folder.id)}>
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
      {/* 如果沒有折疊，顯示 children（也就是 prompt 列表） */}
      {!isCollapsed && children}
    </li>
  );
};

export default FolderItem;
