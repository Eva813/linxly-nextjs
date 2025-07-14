"use client";

import React, { useState, useEffect } from "react";
import { usePromptSpaceActions } from "@/hooks/promptSpace";
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

interface RenameSpaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
  currentName: string;
  isRenaming: boolean;
}

const RenameSpaceDialog: React.FC<RenameSpaceDialogProps> = ({ 
  isOpen, 
  onClose, 
  spaceId, 
  currentName,
  isRenaming 
}) => {
  const [spaceName, setSpaceName] = useState(currentName);
  const { renameSpace } = usePromptSpaceActions();

  useEffect(() => {
    if (isOpen) {
      setSpaceName(currentName);
    }
  }, [isOpen, currentName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceName.trim() || spaceName.trim() === currentName) return;

    try {
      await renameSpace(spaceId, spaceName.trim());
      onClose();
    } catch (error) {
      console.error("Failed to rename space:", error);
    }
  };

  const handleClose = () => {
    if (!isRenaming) {
      setSpaceName(currentName);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
            <DialogTitle>Rename space</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="spaceName" className="text-sm font-medium">
              Workspace Name
              </label>
              <Input
              id="spaceName"
              value={spaceName}
              onChange={(e) => setSpaceName(e.target.value)}
              placeholder="Enter a new workspace name"
              disabled={isRenaming}
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
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!spaceName.trim() || spaceName.trim() === currentName || isRenaming}
            >
              {isRenaming ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Renaming...
                </>
              ) : (
                "Rename"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RenameSpaceDialog;