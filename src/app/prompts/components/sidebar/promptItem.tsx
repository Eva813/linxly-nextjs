"use client";

import React, { useContext } from "react";
import Link from "next/link";
import { SidebarContext } from '@/providers/clientRootProvider';
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PromptItemProps } from "@/types/prompt";
import { useSidebarStore } from "@/stores/sidebar";
import { useSidebarActions } from "@/hooks/sidebar";
import { useEditableState } from '@/hooks/useEditableState';

const PromptItem: React.FC<PromptItemProps> = React.memo(({
  prompt,
  folderId,
}) => {
  const { isOpen, toggleSidebar } = useContext(SidebarContext);
  const { activePromptMenuId, setActivePromptMenu } = useSidebarStore();
  const { navigation, handleDeletePrompt } = useSidebarActions();
  const { canDelete } = useEditableState();
  
  const isActivePrompt = navigation.currentPromptId === prompt.id;

  return (
    <li className="mb-2">
      <div
        className={`flex items-center justify-between px-2 py-1 w-full font-bold rounded hover:bg-light dark:hover:text-third ${
          isActivePrompt ? "bg-light text-primary dark:text-third" : "bg-transparent"
        }`}
      >
        <Link
          prefetch={true}
          href={`/prompts/prompt/${prompt.id}`}
          onClick={() => {
            if (isOpen) toggleSidebar();
          }}
          className="flex items-center justify-between flex-1"
        >
          <span className="max-w-[110px] truncate">{prompt.name}</span>
            <span className="inline-block px-3 py-0 border-2 border-secondary dark:text-third dark:border-third text-sm leading-5 rounded-full max-w-[80px] truncate">
            {prompt.shortcut}
            </span>
        </Link>
        {canDelete && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActivePromptMenu(
                  activePromptMenuId === prompt.id ? null : prompt.id
                );
              }}
              className="focus:outline-none hover:bg-light dark:hover:bg-light p-1 rounded ml-2"
            >
              <BsThreeDotsVertical className="text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          {activePromptMenuId === prompt.id && (
            <DropdownMenuContent>
              <DropdownMenuItem className="dark:hover:bg-light">
                <button
                  onClick={() => handleDeletePrompt(folderId, prompt.id)}
                  className="w-full text-left"
                >
                  Delete
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          )}
        </DropdownMenu>
        )}
      </div>
    </li>
  );
});

PromptItem.displayName = "PromptItem";
export default PromptItem;
