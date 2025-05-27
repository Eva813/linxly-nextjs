"use client";

import React, { useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { usePromptStore } from "@/stores/prompt";
import { Button } from "@/components/ui/button";
import { FaFolderPlus, FaFileMedical } from "react-icons/fa";
import { Skeleton } from "@/components/ui/skeleton"

// 動態載入 FolderItem 與 PromptItem
const FolderItem = dynamic(() => import("./folderItem"), {
  ssr: false,
  loading: () => (
    <div className="px-2 py-2">
      <Skeleton className="h-8 w-full rounded-md" />
    </div>
  ),
});

const PromptItem = dynamic(() => import("./promptItem"), {
  ssr: false,

  loading: () => (
    <div className="px-2 py-1">
      <Skeleton className="h-6 w-full rounded-md" />
    </div>
  ),
});

const Sidebar = () => {
  const {
    folders,
    addFolder,
    addPromptToFolder,
    deleteFolder,
    deletePromptFromFolder,
  } = usePromptStore();

  const router = useRouter();
  const pathname = usePathname() ?? "";
  const params = useParams<{ folderId?: string; promptId?: string }>() || {};
  const currentFolderId = params.folderId;
  const currentPromptId = params.promptId;

  const [activeFolderMenu, setActiveFolderMenu] = useState<string | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [activePromptMenu, setActivePromptMenu] = useState<string | null>(null);

  const handleAddFolder = async () => {
    try {
      const folderData = {
        name: "New Folder",
        description: "",
        prompts: [],
      };
      
      const newFolder = await addFolder(folderData);
      
      router.push(`/prompts/folder/${newFolder.id}`);
    } catch (error) {
      console.error('folder:', error);
      
    }
  };


  const handleAddPrompt = async () => {
    if (!folders || folders.length === 0) return;
    const targetFolder = currentFolderId ?? folders[0].id;
    try {
      const defaultPrompt = {
        name: "New prompt",
        content: "New prompt content",
        shortcut: "/newPrompt",
      };
    const newPrompt = await addPromptToFolder(targetFolder, defaultPrompt, currentPromptId);
      router.push(`/prompts/prompt/${newPrompt.id}`);
    } catch (error) {
      console.error("新增 Prompt 失敗:", error);
    }
  };

    const handleDeleteFolder = async (fid: string) => {
      try {
        await deleteFolder(fid);
        setActiveFolderMenu(null);

        if (fid === currentFolderId) {
          const updatedFolders = usePromptStore.getState().folders;

          if (updatedFolders.length > 0) {
            router.push(`/prompts/folder/${updatedFolders[0].id}`);
          } else {
            router.push("/prompts");
          }
        }
      } catch (error) {
        console.error("刪除 Folder 失敗:", error);
      }
  };

  const handleDeletePrompt = async (fid: string, pid: string) => {
    await deletePromptFromFolder(fid, pid);
    setActivePromptMenu(null);
    router.push(`/prompts/folder/${fid}`);
  };

  // 折疊/展開 Folder
  const toggleCollapse = (folderId: string) => {
    const newCollapsed = new Set(collapsedFolders);
    if (newCollapsed.has(folderId)) {
      newCollapsed.delete(folderId);
    } else {
      newCollapsed.add(folderId);
    }
    setCollapsedFolders(newCollapsed);
  };

  return (
    <div className="w-1/4 p-4 border-r border-gray-300 h-full overflow-y-auto">
      <div className="grid grid-cols-2 gap-x-4 mb-4">
        <Button className="h-8 dark:text-third" onClick={handleAddFolder}>
          <FaFolderPlus />
          Add Folder
        </Button>
        <Button className="h-8 dark:text-third" onClick={handleAddPrompt}>
          <FaFileMedical />
          Add Prompt
        </Button>
      </div>
      <div className="flex-1">
          <ul className="dark:text-gray-200">
            {folders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                activeFolderMenu={activeFolderMenu}
                setActiveFolderMenu={setActiveFolderMenu}
                collapsedFolders={collapsedFolders}
                toggleCollapse={toggleCollapse}
                deleteFolder={handleDeleteFolder}
                pathname={pathname}
              >
                <ul className="ml-4 mt-1">
                  {folder.prompts.length === 0 ? (
                    <span className="ml-2 text-gray-500">
                      No prompts in the folder
                    </span>
                  ) : (
                    folder.prompts.map((prompt) => (
                      <PromptItem
                        key={prompt.id}
                        prompt={prompt}
                        folderId={folder.id}
                        activePromptMenu={activePromptMenu}
                        setActivePromptMenu={setActivePromptMenu}
                        deleteFile={handleDeletePrompt}
                        pathname={pathname}
                      />
                    ))
                  )}
                </ul>
              </FolderItem>
            ))}
          </ul>
      </div>
    </div>
  );
};

export default Sidebar;
