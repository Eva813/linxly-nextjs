"use client";

import React, { useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { usePromptStore } from "@/stores/prompt";
import { Button } from "@/components/ui/button";
import { FaFolderPlus, FaFileMedical, FaSpinner } from "react-icons/fa";
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
    isLoading,
    error,
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
  const [addingFolder, setAddingFolder] = useState(false);
  const [addingPrompt, setAddingPrompt] = useState(false);
  const [addingPromptFolderId, setAddingPromptFolderId] = useState<string | null>(null);
  const [addingPromptAfterPromptId, setAddingPromptAfterPromptId] = useState<string | null>(null);

  const handleAddFolder = async () => {
    setAddingFolder(true);
    try {
      const folderData = {
        name: "New Folder",
        description: "",
        prompts: [],
      };

      const newFolder = await addFolder(folderData);
      router.push(`/prompts/folder/${newFolder.id}`);
    } catch (error) {
      console.error('新增資料夾失敗:', error);
      // 可以在這裡顯示 toast 通知使用者
    } finally {
      setAddingFolder(false);
    }
  };

  const determineTargetFolder = (): string | null => {
    if (currentFolderId) {
      return currentFolderId;
    }

    if (currentPromptId) {
      const folderContainingPrompt = folders.find(folder =>
        folder.prompts?.some(prompt => prompt.id === currentPromptId)
      );
      if (folderContainingPrompt) {
        return folderContainingPrompt.id;
      }
    }

    return folders.length > 0 ? folders[0].id : null;
  };


  const handleAddPrompt = async () => {
    if (!folders || folders.length === 0) return;

    const targetFolder = determineTargetFolder();
    if (!targetFolder) {
      console.error("No valid folder found to add the prompt.");
      return;
    }

    setAddingPrompt(true);
    setAddingPromptFolderId(targetFolder);
    setAddingPromptAfterPromptId(currentPromptId || null);

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
    } finally {
      setAddingPrompt(false);
      setAddingPromptFolderId(null);
      setAddingPromptAfterPromptId(null);
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
    <div className="p-4 border-r border-gray-300 h-full flex flex-col">
      <div className="grid grid-cols-2 gap-x-4 mb-4 sticky top-0 bg-white dark:bg-gray-900 z-10">
        <Button
          className="h-8 dark:text-third"
          onClick={handleAddFolder}
          disabled={addingFolder}
        >
          {addingFolder
            ? <FaSpinner className="animate-spin" />
            : <FaFolderPlus />
          }
          Add Folder
        </Button>
        <Button
          className="h-8 dark:text-third"
          onClick={handleAddPrompt}
          disabled={addingPrompt}
        >
          {addingPrompt ? <FaSpinner className="animate-spin" /> : <FaFileMedical />}
          Add Prompt
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="mb-4 p-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-sm">
            {error}
          </div>
        )}

        {isLoading && folders.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-full rounded-md" />
            ))}
          </div>
        ) : (
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
                <ul className="ml-6 mt-1">
                  {folder.prompts.length === 0 ? (
                    <span className="ml-2 text-gray-500">
                      No prompts in the folder
                    </span>
                  ) : (
                    folder.prompts.map((prompt) => (
                      <React.Fragment key={prompt.id}>
                        <PromptItem
                          prompt={prompt}
                          folderId={folder.id}
                          activePromptMenu={activePromptMenu}
                          setActivePromptMenu={setActivePromptMenu}
                          deleteFile={handleDeletePrompt}
                          pathname={pathname}
                        />
                        {addingPrompt &&
                          addingPromptFolderId === folder.id &&
                          addingPromptAfterPromptId === prompt.id && (
                            <li className="px-2 py-1">
                              <Skeleton className="h-6 w-full rounded-md" />
                            </li>
                          )}
                      </React.Fragment>
                    ))
                  )}
                  {addingPrompt &&
                    addingPromptFolderId === folder.id &&
                    addingPromptAfterPromptId === null && (
                      <li className="px-2 py-1">
                        <Skeleton className="h-6 w-full rounded-md" />
                      </li>
                    )}
                </ul>
              </FolderItem>
            ))}
            {addingFolder && (
              <li className="px-2 py-2">
                <Skeleton className="h-8 w-full rounded-md" />
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
