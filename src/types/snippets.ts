import React from "react";
export interface Snippet {
  id: string;
  name: string;
  content: string;
  shortcut: string;
}

export interface Folder {
  id: string;
  name: string;
  description: string;
  snippets: Snippet[];
}

/**
 * FolderItem 元件的 Props
 */
export interface FolderItemProps {
  folder: Folder;
  activeFolderMenu: string | null;
  setActiveFolderMenu: (id: string | null) => void;
  collapsedFolders: Set<string>;
  toggleCollapse: (folderId: string) => void;
  deleteFolder: (folderId: string) => void;
  pathname: string;
  children?: React.ReactNode;
}

/**
 * SnippetItem 元件的 Props
 */
export interface SnippetItemProps {
  snippet: Snippet;
  folderId: string;
  activeSnippetMenu: string | null;
  setActiveSnippetMenu: (id: string | null) => void;
  deleteFile: (folderId: string, snippetId: string) => void;
  pathname: string;
}
