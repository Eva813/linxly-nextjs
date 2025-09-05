"use client";

import React, { useContext, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { SidebarContext } from '@/providers/clientRootProvider';
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PromptItemProps } from "@/types/prompt";
import { useSidebarActions } from "@/hooks/sidebar";
import { useEditableState } from '@/hooks/useEditableState';
import { usePromptStore } from "@/stores/prompt";

const DIALOG_TEXTS = {
  deleteTitle: "Confirm Delete Prompt",
  deleteDescription: (name: string) => 
    `Are you sure you want to delete the prompt "${name}"? This action cannot be undone.`,
  cancelButton: "Cancel",
  deleteButton: "Delete"
} as const;

const PromptItem: React.FC<PromptItemProps> = React.memo(({
  prompt,
  folderId,
}) => {
  const { isOpen, toggleSidebar } = useContext(SidebarContext);
  const { navigation, handleDeletePrompt } = useSidebarActions();
  const { canDelete } = useEditableState();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // 使用 store selector 獲取最新的 prompt 資料，確保與 PromptHeader 編輯同步
  const storePrompt = usePromptStore((state) => {
    for (const folder of state.folders) {
      const foundPrompt = folder.prompts.find(p => p.id === prompt.id);
      if (foundPrompt) return foundPrompt;
    }
    return null;
  });
  
  // 建立計算後的 prompt 物件，優先使用 store 資料以確保同步
  const computedPrompt = useMemo(() => ({
    ...prompt,
    name: storePrompt?.name || prompt.name,
    shortcut: storePrompt?.shortcut || prompt.shortcut,
  }), [prompt, storePrompt?.name, storePrompt?.shortcut]);
  
  const isActivePrompt = navigation.currentPromptId === prompt.id;
  
  const handleDeleteClick = useCallback(() => {
    setIsDeleteDialogOpen(true);
  }, []);
  
  const handleConfirmDelete = useCallback(() => {
    handleDeletePrompt(folderId, prompt.id);
    setIsDeleteDialogOpen(false);
  }, [folderId, prompt.id, handleDeletePrompt]);
  
  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
  }, []);

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
          <span className="max-w-[110px] truncate">{computedPrompt.name}</span>
            <span className="inline-block px-3 py-0 border-2 border-secondary dark:text-third dark:border-third text-sm leading-5 rounded-full max-w-[80px] truncate">
            {computedPrompt.shortcut}
            </span>
        </Link>
        {canDelete && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label={`Open menu for ${computedPrompt.name} prompt`}
              className="focus:outline-none hover:bg-light dark:hover:bg-light p-1 rounded ml-2"
            >
              <BsThreeDotsVertical className="text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleDeleteClick} className="dark:hover:bg-light">
              {DIALOG_TEXTS.deleteButton}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        )}
      </div>
      
      {/* DeleteConfirmationDialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
        <DialogTitle>{DIALOG_TEXTS.deleteTitle}</DialogTitle>
        <DialogDescription>
          {DIALOG_TEXTS.deleteDescription(computedPrompt.name)}
        </DialogDescription>
          </DialogHeader>
          <DialogFooter>
        <Button variant="outline" onClick={handleCloseDeleteDialog}>
          {DIALOG_TEXTS.cancelButton}
        </Button>
        <Button variant="danger" onClick={handleConfirmDelete}>
          {DIALOG_TEXTS.deleteButton}
        </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
});

PromptItem.displayName = "PromptItem";
export default PromptItem;
