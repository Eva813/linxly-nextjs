"use client";

import React, { useState, useEffect } from "react";
import { usePromptStore } from "@/stores/prompt";
import { Button } from "@/components/ui/button";
import { FaChevronDown, FaPlus, FaSpinner } from "react-icons/fa";
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
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PromptSpaceSelector = () => {
  const {
    promptSpaces,
    currentPromptSpaceId,
    setCurrentPromptSpace,
    addPromptSpace,
    fetchPromptSpaces
  } = usePromptStore();

  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');

  const currentSpace = promptSpaces.find(space => space.id === currentPromptSpaceId);

  // 確保 PromptSpaces 已載入
  useEffect(() => {
    if (promptSpaces.length === 0) {
      console.log('PromptSpaceSelector: 載入 PromptSpaces...');
      fetchPromptSpaces();
    }
  }, [promptSpaces.length, fetchPromptSpaces]);

  // Debug: 監控 promptSpaces 和 currentPromptSpaceId 的變化
  useEffect(() => {
    console.log('PromptSpaceSelector: promptSpaces 更新', {
      length: promptSpaces.length,
      spaces: promptSpaces,
      currentId: currentPromptSpaceId
    });
  }, [promptSpaces, currentPromptSpaceId]);

  const handleCreateSpace = async () => {
    if (!newSpaceName.trim()) return;

    setIsCreating(true);
    try {
      console.log('建立新的 PromptSpace:', newSpaceName.trim());
      const newSpace = await addPromptSpace({ name: newSpaceName.trim() });
      console.log('新 PromptSpace 已建立:', newSpace);
      console.log('目前所有 PromptSpaces:', promptSpaces);

      // 重新獲取 PromptSpaces 以確保數據同步
      await fetchPromptSpaces();

      setCurrentPromptSpace(newSpace.id);
      setIsDialogOpen(false);
      setNewSpaceName('');
    } catch (error) {
      console.error('建立 Prompt Space 失敗:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateSpace();
    }
  };

  return (
    <>
      <div className="mb-4 p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Prompt Space ({promptSpaces.length})
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsDialogOpen(true)}
          >
            <FaPlus className="h-3 w-3" />
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between h-10 text-left"
            >
              <div className="flex items-center">
                <div className="w-3 h-3 rounded border border-gray-400 mr-2 bg-gray-100 dark:bg-gray-700 flex-shrink-0" />
                <span className="truncate">
                  {currentSpace?.name || '工作空間'}
                </span>
              </div>
              <FaChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            {promptSpaces.length === 0 ? (
              <DropdownMenuItem disabled>
                載入中...
              </DropdownMenuItem>
            ) : (
              promptSpaces.map((space) => (
                <DropdownMenuItem
                  key={space.id}
                  onClick={() => {
                    console.log('切換到 PromptSpace:', space);
                    setCurrentPromptSpace(space.id);
                  }}
                  className={currentPromptSpaceId === space.id ? "bg-gray-100 dark:bg-gray-800" : ""}
                >
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded border border-gray-400 mr-2 bg-gray-100 dark:bg-gray-700 flex-shrink-0" />
                    <span className="truncate">{space.name}</span>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>建立新的 Prompt Space</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                名稱
              </Label>
              <Input
                id="name"
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="col-span-3"
                placeholder="輸入 Prompt Space 名稱"
                disabled={isCreating}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isCreating}
            >
              取消
            </Button>
            <Button
              onClick={handleCreateSpace}
              disabled={!newSpaceName.trim() || isCreating}
            >
              {isCreating ? <FaSpinner className="animate-spin mr-2" /> : null}
              建立
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PromptSpaceSelector;
