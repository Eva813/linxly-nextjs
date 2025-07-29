"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FaSpinner } from "react-icons/fa";

interface DeleteSpaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  spaceName: string;
  isDeleting: boolean;
}

const DeleteSpaceDialog: React.FC<DeleteSpaceDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  spaceName,
  isDeleting
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
            <DialogTitle>Delete Workspace</DialogTitle>
            <DialogDescription>
            Are you sure you want to delete the workspace &quot;{spaceName}&quot;?
            <br />
            <span className="text-rose-600 font-medium">
              This action cannot be undone. All folders and prompts within this workspace will be deleted.
            </span>
            </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
              <Button 
              variant="destructive" 
              onClick={onConfirm}
              disabled={isDeleting}
              className="bg-rose-600 text-white hover:bg-rose-700"
              >
              {isDeleting ? (
                <>
                <FaSpinner className="animate-spin mr-2" />
                Deleting...
                </>
              ) : (
                "Confirm Delete"
              )}
              </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteSpaceDialog;