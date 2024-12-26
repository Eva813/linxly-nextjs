'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSnippets } from '@/contexts/SnippetsContext';
import { Button } from '@/components/ui/button';
import { FaFolderPlus } from "react-icons/fa";
import { FaFileMedical } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { FaCaretDown } from "react-icons/fa";
import { FaCaretRight } from "react-icons/fa";

const Sidebar = () => {
  const { folders, setFolders } = useSnippets();
  const router = useRouter();
  const pathname = usePathname();
  const [activeFolderMenu, setActiveFolderMenu] = useState<string | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [activeSnippetMenu, setActiveSnippetMenu] = useState<string | null>(null);

  // Helper function to extract folder or snippet ID from pathname
  const getCurrentContext = () => {
    // pathname examples:
    // /snippets/folder/HplOMyf2mDqvVMdphJbt
    // /snippets/snippet/5mJw031VPo2WxNIQyeXN
    const segments = (pathname ?? '').split('/').filter(Boolean);
    // segments after filter might look like ["snippets","folder","HplOMyf2mDqvVMdphJbt"] or ["snippets","snippet","5mJw031VPo2WxNIQyeXN"]
    let mode = null;
    let id = null;
    if (segments.length >= 3 && segments[1] === 'folder') {
      mode = 'folder';
      id = segments[2];
    } else if (segments.length >= 3 && segments[1] === 'snippet') {
      mode = 'snippet';
      id = segments[2];
    }
    return { mode, id };
  };

  const { mode, id } = getCurrentContext();

  // Find current folder/snippet based on the route
  let currentFolderIndex = -1;
  let currentSnippetIndex = -1;
  if (mode === 'folder') {
    // Find the folder by id
    currentFolderIndex = folders.findIndex((f) => f.id === id);
  } else if (mode === 'snippet') {
    // Find the snippet and its parent folder
    for (let fIndex = 0; fIndex < folders.length; fIndex++) {
      const sIndex = folders[fIndex].snippets.findIndex((s) => s.id === id);
      if (sIndex !== -1) {
        currentFolderIndex = fIndex;
        currentSnippetIndex = sIndex;
        break;
      }
    }
  }

  const addFolder = () => {
    const newFolder = {
      id: `folder-${Date.now()}`,
      name: 'New folder',
      description: '',
      snippets: [],
    };

    const newFolders = [...folders];

    if (mode === 'folder' && currentFolderIndex !== -1) {
      // Insert new folder right after current folder
      newFolders.splice(currentFolderIndex + 1, 0, newFolder);
    } else if (mode === 'snippet' && currentFolderIndex !== -1) {
      // Insert new folder right after the folder that contains the current snippet
      newFolders.splice(currentFolderIndex + 1, 0, newFolder);
    } else {
      // Not in a folder or snippet context, just push at the end
      newFolders.push(newFolder);
    }

    setFolders(newFolders);
    router.push(`/snippets/folder/${newFolder.id}`);
  };

  const addSnippet = () => {
    const newSnippet = {
      id: `snippet-${Date.now()}`,
      name: 'New snippet',
      content: 'New snippet content',
      shortcut: '', // Add the missing 'shortcut' property
    };

    const newFolders = [...folders];

    if (mode === 'folder' && currentFolderIndex !== -1) {
      // Add snippet at the end of the current folder's snippets
      newFolders[currentFolderIndex].snippets.push(newSnippet);
      setFolders(newFolders);
      router.push(`/snippets/snippet/${newSnippet.id}`);
    } else if (mode === 'snippet' && currentFolderIndex !== -1 && currentSnippetIndex !== -1) {
      // Add snippet right after the current snippet in the same folder
      newFolders[currentFolderIndex].snippets.splice(currentSnippetIndex + 1, 0, newSnippet);
      setFolders(newFolders);
      router.push(`/snippets/snippet/${newSnippet.id}`);
    } else {
      // Fallback: if no context, add snippet to the first folder if it exists
      if (folders.length > 0) {
        newFolders[0].snippets.push(newSnippet);
        setFolders(newFolders);
        router.push(`/snippets/snippet/${newSnippet.id}`);
      }
    }
  };

  const deleteFolder = (folderId: string) => {
    const updatedFolders = folders.filter(folder => folder.id !== folderId);
    setFolders(updatedFolders);
    setActiveFolderMenu(null);
    if (mode === 'folder' && id === folderId) {
      router.push('/snippets');
    }
  };
  const toggleCollapse = (folderId: string) => {
    const newCollapsed = new Set(collapsedFolders);
    if (newCollapsed.has(folderId)) {
      newCollapsed.delete(folderId);
    } else {
      newCollapsed.add(folderId);
    }
    setCollapsedFolders(newCollapsed);
  };

  const deleteFile = (folderId: string, snippetId: string) => {
    const updatedFolders = folders.map(folder => {
      if (folder.id === folderId) {
        return {
          ...folder,
          snippets: folder.snippets.filter(snippet => snippet.id !== snippetId)
        };
      }
      return folder;
    });
    setFolders(updatedFolders);
    setActiveSnippetMenu(null);
    console.log('folderId', folderId);
    if (mode === 'snippet') {
      console.log('Snippet deleted, redirecting to folder', folderId);
      router.push(`/snippets/folder/${folderId}`);
    }
  };


  return (
    <div className="w-1/4 h-screen p-4 flex flex-col border-r border-gray-300">
      <div className="grid grid-cols-2 gap-x-4 mb-4">
        <Button onClick={addFolder} >
          <FaFolderPlus />
          Add Folder
        </Button>
        <Button onClick={addSnippet} >
          < FaFileMedical />
          Add Snippet
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ul className='dark:text-gray-200'>
          {folders.map((folder) => (
            <li key={folder.id} className="mb-2">
              <Link className={`px-2 py-1 w-full block rounded hover:bg-gray-100 dark:hover:text-black flex items-center justify-between text-lg ${pathname === `/snippets/folder/${folder.id}` ? 'bg-slate-100 dark:text-black' : ''
                }`} href={`/snippets/folder/${folder.id}`}>
                <strong className="cursor-pointer">{folder.name}</strong>
                <div className="flex items-center">
                  <button
                    onClick={() => toggleCollapse(folder.id)}
                    className="focus:outline-none hover:bg-gray-200 dark:hover:bg-gray-800 p-1 rounded mr-1"
                  >
                    {collapsedFolders.has(folder.id) ? <FaCaretRight className="text-gray-400" /> : <FaCaretDown className="text-gray-400" />}
                  </button>
                  {/* DropdownMenu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
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
              {!collapsedFolders.has(folder.id) && (
                <ul className="ml-4 mt-1">
                  {folder.snippets.length === 0 ? (
                    <span className="ml-2 text-gray-500">No snippets in the folder</span>
                  ) : (
                    folder.snippets.map((snippet) => (
                      <li
                        key={snippet.id}
                        className="mb-2"
                      >
                        <div
                          className={`flex items-center justify-between px-2 py-1 w-full block rounded hover:bg-gray-100 dark:hover:text-black ${pathname === `/snippets/snippet/${snippet.id}` ? 'bg-slate-100 dark:text-black' : 'bg-transparent'
                            }`}
                        >
                          <Link className="flex-1 block" href={`/snippets/snippet/${snippet.id}`}>
                            {snippet.name}
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setActiveSnippetMenu(
                                    activeSnippetMenu === snippet.id ? null : snippet.id
                                  );
                                }}
                                className="focus:outline-none hover:bg-gray-200 dark:hover:bg-gray-800 p-1 rounded"
                              >
                                <BsThreeDotsVertical className="text-gray-400" />
                              </button>
                            </DropdownMenuTrigger>
                            {activeSnippetMenu === snippet.id && (
                              <DropdownMenuContent>
                                <DropdownMenuItem>
                                  <button
                                    onClick={() => deleteFile(folder.id, snippet.id)}
                                    className="w-full text-left"
                                  >
                                    Delete
                                  </button>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            )}
                          </DropdownMenu>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;