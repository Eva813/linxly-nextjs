"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useSnippetStore } from "@/stores/snippet";
import { Button } from "@/components/ui/button";
import { FaFolderPlus, FaFileMedical } from "react-icons/fa";

// 動態載入 FolderItem 與 SnippetItem
const FolderItem = dynamic(() => import("./folderItem"), { ssr: false });
const SnippetItem = dynamic(() => import("./snippetItem"), { ssr: false });

const Sidebar = () => {
  const {
    folders,
    addFolder,
    addSnippetToFolder,
    deleteFolder,
    deleteSnippetFromFolder,
  } = useSnippetStore();

  const router = useRouter();
  const pathname = usePathname();

  const [activeFolderMenu, setActiveFolderMenu] = useState<string | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [activeSnippetMenu, setActiveSnippetMenu] = useState<string | null>(null);

  // 解析目前路由資訊 (/snippets/folder/[folderId] 或 /snippets/snippet/[snippetId])
  const getCurrentContext = () => {
    const segments = (pathname ?? "").split("/").filter(Boolean);
    let mode: "folder" | "snippet" | null = null;
    let id: string | null = null;
    if (segments.length >= 3 && segments[1] === "folder") {
      mode = "folder";
      id = segments[2];
    } else if (segments.length >= 3 && segments[1] === "snippet") {
      mode = "snippet";
      id = segments[2];
    }
    return { mode, id };
  };
  const { mode, id } = getCurrentContext();

  // 找出目前 folder 與 snippet 的索引（決定插入位置）
  let currentFolderIndex = -1;
  let currentSnippetIndex = -1;
  if (mode === "folder") {
    currentFolderIndex = folders.findIndex((f) => f.id === id);
  } else if (mode === "snippet") {
    for (let fIndex = 0; fIndex < folders.length; fIndex++) {
      const sIndex = folders[fIndex].snippets.findIndex((s) => s.id === id);
      if (sIndex !== -1) {
        currentFolderIndex = fIndex;
        currentSnippetIndex = sIndex;
        break;
      }
    }
  }

  // 新增 Folder，將插入位置邏輯封裝進 store API
  const handleAddFolder = () => {
    let insertIndex: number | undefined;
    if ((mode === "folder" || mode === "snippet") && currentFolderIndex !== -1) {
      insertIndex = currentFolderIndex + 1;
    }
    const newFolder = addFolder(
      {
        name: "New folder",
        description: "",
        snippets: [],
      },
      insertIndex
    );
    router.push(`/snippets/folder/${newFolder.id}`);
  };

  // 新增 Snippet（這裡不做插入位置，僅調用 store API，若有類似邏輯可同理封裝）
  const handleAddSnippet = () => {
    let newSnippet;
    if (mode === "folder" && currentFolderIndex !== -1) {
      newSnippet = addSnippetToFolder(folders[currentFolderIndex].id, {
        name: "New snippet",
        content: "New snippet content",
        shortcut: "",
      });
      router.push(`/snippets/snippet/${newSnippet.id}`);
    } else if (mode === "snippet" && currentFolderIndex !== -1 && currentSnippetIndex !== -1) {
      newSnippet = addSnippetToFolder(folders[currentFolderIndex].id, {
        name: "New snippet",
        content: "New snippet content",
        shortcut: "",
      });
      router.push(`/snippets/snippet/${newSnippet.id}`);
    } else if (folders.length > 0) {
      newSnippet = addSnippetToFolder(folders[0].id, {
        name: "New snippet",
        content: "New snippet content",
        shortcut: "",
      });
      router.push(`/snippets/snippet/${newSnippet.id}`);
    }
  };

  // 刪除 Folder
  const handleDeleteFolder = (folderId: string) => {
    deleteFolder(folderId);
    setActiveFolderMenu(null);
    if (mode === "folder" && id === folderId) {
      router.push("/snippets");
    }
  };

  // 刪除 Snippet
  const handleDeleteSnippet = (folderId: string, snippetId: string) => {
    deleteSnippetFromFolder(folderId, snippetId);
    setActiveSnippetMenu(null);
    if (mode === "snippet") {
      router.push(`/snippets/folder/${folderId}`);
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
        <Button className="h-10 text-lg" onClick={handleAddFolder}>
          <FaFolderPlus />
          Add Folder
        </Button>
        <Button className="h-10 text-lg" onClick={handleAddSnippet}>
          <FaFileMedical />
          Add Snippet
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
                {folder.snippets.length === 0 ? (
                  <span className="ml-2 text-gray-500">
                    No snippets in the folder
                  </span>
                ) : (
                  folder.snippets.map((snippet) => (
                    <SnippetItem
                      key={snippet.id}
                      snippet={snippet}
                      folderId={folder.id}
                      activeSnippetMenu={activeSnippetMenu}
                      setActiveSnippetMenu={setActiveSnippetMenu}
                      deleteFile={handleDeleteSnippet}
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
