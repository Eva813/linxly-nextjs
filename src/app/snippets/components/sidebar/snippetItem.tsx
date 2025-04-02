"use client";

import React from "react";
import Link from "next/link";
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SnippetItemProps } from "@/types/snippets";

const SnippetItem: React.FC<SnippetItemProps> = React.memo(({
  snippet,
  folderId,
  activeSnippetMenu,
  setActiveSnippetMenu,
  deleteFile,
  pathname,
}) => {
  const isActiveSnippet = pathname === `/snippets/snippet/${snippet.id}`;

  return (
    <li className="mb-2">
      <div
        className={`flex items-center justify-between px-2 py-1 w-full font-bold block rounded hover:bg-light dark:hover:text-black ${
          isActiveSnippet ? "bg-light text-primary dark:text-black" : "bg-transparent"
        }`}
      >
        <Link
          prefetch
          className="flex-1 flex justify-between block"
          href={`/snippets/snippet/${snippet.id}`}
        >
          {snippet.name}
          <span className="inline-flex items-center px-3 py-1 border-2 border-secondary text-sm h-6 font-medium rounded-full">
            {snippet.shortcut}
          </span>
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
                  onClick={() => deleteFile(folderId, snippet.id)}
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
  );
});

SnippetItem.displayName = "SnippetItem";
export default SnippetItem;
