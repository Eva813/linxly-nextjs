"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useSnippets } from "@/contexts/SnippetsContext";
import { Button } from "@/components/ui/button";
import { FaFolderPlus, FaFileMedical } from "react-icons/fa";

// 動態載入
const FolderItem = dynamic(() => import("./folderItem"), { ssr: false });
const SnippetItem = dynamic(() => import("./snippetItem"), { ssr: false });

const Sidebar = () => {
  const { folders, setFolders } = useSnippets();
  const router = useRouter();
  const pathname = usePathname();

  const [activeFolderMenu, setActiveFolderMenu] = useState<string | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [activeSnippetMenu, setActiveSnippetMenu] = useState<string | null>(null);

  // 取得當前路徑資訊 (/snippets/folder/[folderId] or /snippets/snippet/[snippetId])
  const getCurrentContext = () => {
    const segments = (pathname ?? "").split("/").filter(Boolean);
    let mode = null;
    let id = null;
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

  // 找出當前 folder / snippet 的索引，以便插入新資料
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

  // 新增 Folder
  const addFolder = () => {
    const newFolder = {
      id: `folder-${Date.now()}`,
      name: "New folder",
      description: "",
      snippets: [],
    };
    const newFolders = [...folders];

    if (mode === "folder" && currentFolderIndex !== -1) {
      newFolders.splice(currentFolderIndex + 1, 0, newFolder);
    } else if (mode === "snippet" && currentFolderIndex !== -1) {
      newFolders.splice(currentFolderIndex + 1, 0, newFolder);
    } else {
      newFolders.push(newFolder);
    }

    setFolders(newFolders);
    router.push(`/snippets/folder/${newFolder.id}`);
  };

  // 新增 Snippet
  const addSnippet = () => {
    const newSnippet = {
      id: `snippet-${Date.now()}`,
      name: "New snippet",
      content: "New snippet content",
      shortcut: "",
    };
    const newFolders = [...folders];

    if (mode === "folder" && currentFolderIndex !== -1) {
      newFolders[currentFolderIndex].snippets.push(newSnippet);
      setFolders(newFolders);
      router.push(`/snippets/snippet/${newSnippet.id}`);
    } else if (mode === "snippet" && currentFolderIndex !== -1 && currentSnippetIndex !== -1) {
      newFolders[currentFolderIndex].snippets.splice(currentSnippetIndex + 1, 0, newSnippet);
      setFolders(newFolders);
      router.push(`/snippets/snippet/${newSnippet.id}`);
    } else {
      if (folders.length > 0) {
        newFolders[0].snippets.push(newSnippet);
        setFolders(newFolders);
        router.push(`/snippets/snippet/${newSnippet.id}`);
      }
    }
  };

  // 刪除 Folder
  const deleteFolder = (folderId: string) => {
    const updatedFolders = folders.filter((folder) => folder.id !== folderId);
    setFolders(updatedFolders);
    setActiveFolderMenu(null);
    if (mode === "folder" && id === folderId) {
      router.push("/snippets");
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

  // 刪除 Snippet
  const deleteFile = (folderId: string, snippetId: string) => {
    const updatedFolders = folders.map((folder) => {
      if (folder.id === folderId) {
        return {
          ...folder,
          snippets: folder.snippets.filter((snippet) => snippet.id !== snippetId),
        };
      }
      return folder;
    });
    setFolders(updatedFolders);
    setActiveSnippetMenu(null);
    if (mode === "snippet") {
      router.push(`/snippets/folder/${folderId}`);
    }
  };

  return (
    <div className="w-1/4 h-screen p-4 flex flex-col border-r border-gray-300">
      <div className="grid grid-cols-2 gap-x-4 mb-4">
        <Button onClick={addFolder}>
          <FaFolderPlus />
          Add Folder
        </Button>
        <Button onClick={addSnippet}>
          <FaFileMedical />
          Add Snippet
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ul className="dark:text-gray-200">
          {folders.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              activeFolderMenu={activeFolderMenu}
              setActiveFolderMenu={setActiveFolderMenu}
              collapsedFolders={collapsedFolders}
              toggleCollapse={toggleCollapse}
              deleteFolder={deleteFolder}
              pathname={pathname ?? ""}
            >
              <ul className="ml-4 mt-1">
                {folder.snippets.length === 0 ? (
                  <span className="ml-2 text-gray-500">No snippets in the folder</span>
                ) : (
                  folder.snippets.map((snippet) => (
                    <SnippetItem
                      key={snippet.id}
                      snippet={snippet}
                      folderId={folder.id}
                      activeSnippetMenu={activeSnippetMenu}
                      setActiveSnippetMenu={setActiveSnippetMenu}
                      deleteFile={deleteFile}
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
