'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSnippets } from '@/contexts/SnippetsContext';

const Sidebar = () => {
  const { folders, setFolders } = useSnippets();
  const router = useRouter();
  const pathname = usePathname();

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

  return (
    <div className="w-1/4 h-screen p-4 bg-gray-100 flex flex-col border-r border-gray-300">
      <div className="flex space-x-2 mb-4">
        <button onClick={addFolder} className="px-3 py-1 bg-blue-500 text-white rounded">
          Add Folder
        </button>
        <button onClick={addSnippet} className="px-3 py-1 bg-green-500 text-white rounded">
          Add Snippet
        </button>
      </div>
      <h2 className="text-lg font-semibold mb-4">Folders</h2>
      <div className="flex-1 overflow-y-auto">
        <ul>
          {folders.map((folder) => (
            <li key={folder.id}
              className="mb-2">
              <div className={`px-2 py-1 ${pathname === `/snippets/folder/${folder.id}` ? 'bg-blue-200' : ''
                }`}>
                <Link href={`/snippets/folder/${folder.id}`}>
                  <strong className="cursor-pointer">{folder.name}</strong>
                </Link>
              </div>
              <ul className="ml-4 mt-1">
                {folder.snippets.length === 0 ? (
                  <span className="ml-2 text-gray-500">No snippets in the folder</span>
                ) : (
                  folder.snippets.map((snippet) => (
                    <li
                      key={snippet.id}
                      className={`mt-1 pa-2 ${pathname === `/snippets/snippet/${snippet.id}` ? 'bg-green-200' : 'bg-transparent'
                        }`}
                    >
                      <Link href={`/snippets/snippet/${snippet.id}`}>
                        {snippet.name}
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;