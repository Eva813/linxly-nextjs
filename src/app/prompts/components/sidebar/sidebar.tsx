"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  const pathname = usePathname();

  const [activeFolderMenu, setActiveFolderMenu] = useState<string | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [activePromptMenu, setActivePromptMenu] = useState<string | null>(null);

  // 解析目前路由資訊 (/prompts/folder/[folderId] 或 /prompts/prompt/[promptId])
  const getCurrentContext = () => {
    const segments = (pathname ?? "").split("/").filter(Boolean);
    let mode: "folder" | "prompt" | null = null;
    let id: string | null = null;
    if (segments.length >= 3 && segments[1] === "folder") {
      mode = "folder";
      id = segments[2];
    } else if (segments.length >= 3 && segments[1] === "prompt") {
      mode = "prompt";
      id = segments[2];
    }
    return { mode, id };
  };
  const { mode, id } = getCurrentContext();

  // 找出目前 folder 與 prompt 的索引（決定插入位置）
  let currentFolderIndex = -1;
  let currentPromptIndex = -1;
  if (mode === "folder") {
    currentFolderIndex = folders.findIndex((f) => f.id === id);
  } else if (mode === "prompt") {
    for (let fIndex = 0; fIndex < folders.length; fIndex++) {
      const pIndex = folders[fIndex].prompts.findIndex((p) => p.id === id);
      if (pIndex !== -1) {
        currentFolderIndex = fIndex;
        currentPromptIndex = pIndex;
        break;
      }
    }
  }

  // 新增 Folder，將插入位置邏輯封裝進 store API
  const handleAddFolder = async () => {
    try {
      // 建立新資料夾的資料
      const folderData = {
        name: "New Folder",
        description: "",
        prompts: [],
      };
      
      // 使用 API 建立資料夾並保存到 MongoDB
      const newFolder = await addFolder(folderData);
      
      // 導向到新建立的資料夾
      router.push(`/prompts/folder/${newFolder.id}`);
    } catch (error) {
      console.error('folder:', error);
      
    }
  };


  // 新增 Prompt
  const handleAddPrompt = async () => {
  try {
    let newPrompt;
    const defaultPrompt = {
      name: "New prompt", // 必填欄位
      content: "New prompt content", // 可選欄位
      shortcut: "/newPrompt", // 必填欄位
    };

    if (mode === "folder" && currentFolderIndex !== -1) {
      newPrompt = await addPromptToFolder(folders[currentFolderIndex].id, defaultPrompt);
      router.push(`/prompts/prompt/${newPrompt.id}`);
    } else if (mode === "prompt" && currentFolderIndex !== -1 && currentPromptIndex !== -1) {
      newPrompt = await addPromptToFolder(folders[currentFolderIndex].id, defaultPrompt);
      router.push(`/prompts/prompt/${newPrompt.id}`);
    } else if (folders.length > 0) {
      newPrompt = await addPromptToFolder(folders[0].id, defaultPrompt);
      router.push(`/prompts/prompt/${newPrompt.id}`);
    }
  } catch (error) {
    console.error("新增 Prompt 失敗:", error);
  }
};

  // 刪除 Folder
  const handleDeleteFolder = (folderId: string) => {
    deleteFolder(folderId);
    setActiveFolderMenu(null);
    if (mode === "folder" && id === folderId) {
      router.push("/prompts");
    }
  };

  // 刪除 Prompt
  const handleDeletePrompt = (folderId: string, promptId: string) => {
    deletePromptFromFolder(folderId, promptId);
    setActivePromptMenu(null);
    if (mode === "prompt") {
      router.push(`/prompts/folder/${folderId}`);
    }
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
                pathname={pathname ?? ""}
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
                        pathname={pathname ?? ""}
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
