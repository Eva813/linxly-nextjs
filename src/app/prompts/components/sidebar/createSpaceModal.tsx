"use client";

import React, { useState } from "react";
import { usePromptSpaceStore } from "@/stores/promptSpace";
import { usePromptStore } from "@/stores/prompt";
import { usePromptSpaceActions } from "@/hooks/promptSpace";
import { useSidebarNavigation } from "@/hooks/sidebar/useSidebarNavigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaSpinner } from "react-icons/fa";

interface CreateSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateSpaceModal: React.FC<CreateSpaceModalProps> = ({ isOpen, onClose }) => {
  const [spaceName, setSpaceName] = useState("");
  const { isCreatingSpace } = usePromptSpaceStore();
  const { createSpace } = usePromptSpaceActions();
  const navigation = useSidebarNavigation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceName.trim()) return;

    try {
      // 1. 創建 space（包含自動創建預設 folder）
      await createSpace(spaceName.trim());

      // 2. 直接導航到第一個 folder（參考 useSidebarActions 的模式）
      // createSpace 完成後，folders 狀態應該已經更新
      const currentFolders = usePromptStore.getState().folders;
      if (currentFolders.length > 0) {
        navigation.navigateToFolder(currentFolders[0].id);
      }

      // 3. 關閉 modal
      setSpaceName("");
      onClose();
    } catch (error) {
      console.error("Failed to create space:", error);
    }
  };

  const handleClose = () => {
    if (!isCreatingSpace) {
      setSpaceName("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Space</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="spaceName" className="text-sm font-medium">
                Space Name
              </label>
              <Input
                id="spaceName"
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
                placeholder="Enter a new space name"
                disabled={isCreatingSpace}
                autoFocus
                maxLength={50}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreatingSpace}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!spaceName.trim() || isCreatingSpace}
            >
              {isCreatingSpace ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSpaceModal;