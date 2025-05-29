"use client";

import React, { useContext } from "react";
import Link from "next/link";
import { SidebarContext } from '@/app/ClientRootProvider';
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PromptItemProps } from "@/types/prompt";

const PromptItem: React.FC<PromptItemProps> = React.memo(({
  prompt,
  folderId,
  activePromptMenu,
  setActivePromptMenu,
  deleteFile,
  pathname,
}) => {
  const isActivePrompt = pathname === `/prompts/prompt/${prompt.id}`;
  const { isOpen, toggleSidebar } = useContext(SidebarContext);

  return (
    <li className="mb-2">
      <div
        className={`flex items-center justify-between px-2 py-1 w-full font-bold block rounded hover:bg-light dark:hover:text-third ${
          isActivePrompt ? "bg-light text-primary dark:text-third" : "bg-transparent"
        }`}
      >
        <Link
          prefetch
          href={`/prompts/prompt/${prompt.id}`}
          onClick={() => {
            if (isOpen) toggleSidebar();
          }}
          className="flex-1 flex justify-between block"
        >
          {prompt.name}
          <span className="inline-flex items-center px-3 py-1 border-2 border-secondary dark:text-third  dark:border-third text-sm h-6 font-medium rounded-full">
            {prompt.shortcut}
          </span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActivePromptMenu(
                  activePromptMenu === prompt.id ? null : prompt.id
                );
              }}
              className="focus:outline-none hover:bg-light dark:hover:bg-light p-1 rounded"
            >
              <BsThreeDotsVertical className="text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          {activePromptMenu === prompt.id && (
            <DropdownMenuContent>
              <DropdownMenuItem className="dark:hover:bg-light">
                <button
                  onClick={() => deleteFile(folderId, prompt.id)}
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

PromptItem.displayName = "PromptItem";
export default PromptItem;
