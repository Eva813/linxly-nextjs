"use client";

import React, { useState, useEffect } from "react";
import { usePromptSpaceActions } from "@/hooks/promptSpace";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaSpinner } from "react-icons/fa";
import { X, Mail, Plus } from "lucide-react";

interface SpaceSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
  currentName: string;
}

const SpaceSettingsDialog: React.FC<SpaceSettingsDialogProps> = ({ 
  isOpen, 
  onClose, 
  spaceId, 
  currentName
}) => {
  const [spaceName, setSpaceName] = useState(currentName);
  const [isRenaming, setIsRenaming] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [sharedEmails, setSharedEmails] = useState<string[]>([
    "user@example.com",
    "team@company.com"
  ]);
  const { renameSpace } = usePromptSpaceActions();

  useEffect(() => {
    if (isOpen) {
      setSpaceName(currentName);
    }
  }, [isOpen, currentName]);

  const handleRenameSubmit = async () => {
    if (!spaceName.trim() || spaceName.trim() === currentName) return;

    try {
      setIsRenaming(true);
      await renameSpace(spaceId, spaceName.trim());
      // TODO: 顯示成功提示
    } catch (error) {
      console.error("Failed to rename space:", error);
      // TODO: 顯示錯誤提示
    } finally {
      setIsRenaming(false);
    }
  };

  const handleAddEmail = () => {
    if (emailInput.trim() && !sharedEmails.includes(emailInput.trim())) {
      setSharedEmails([...sharedEmails, emailInput.trim()]);
      setEmailInput("");
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setSharedEmails(sharedEmails.filter(email => email !== emailToRemove));
  };

  const handleClose = () => {
    if (!isRenaming) {
      setSpaceName(currentName);
      setEmailInput("");
      onClose();
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
                <span>Space Settings</span>
            </DialogTitle>
          </div>
            <p className="text-sm text-muted-foreground">
            Manage your workspace name and sharing settings
            </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 空間名稱 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Space Name</h3>
            <div className="flex items-center gap-2">
              <Input
              value={spaceName}
              onChange={(e) => setSpaceName(e.target.value)}
              placeholder="個人專案"
              disabled={isRenaming}
              maxLength={50}
              className="flex-1"
              />
              <Button
              onClick={handleRenameSubmit}
              disabled={!spaceName.trim() || spaceName.trim() === currentName || isRenaming}
              size="sm"
              className="px-4"
              >
                {isRenaming ? (
                <>
                <FaSpinner className="animate-spin mr-2" />
                Updating...
                </>
                ) : (
                "Update Name"
                )}
              </Button>
            </div>
          </div>

          {/* 分享設定 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Sharing Settings</h3>
            
            {/* 添加 email */}
            <div className="flex gap-2">
              <Input
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="輸入 email 地址"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddEmail();
                  }
                }}
              />
                <Button
                type="button"
                onClick={handleAddEmail}
                className="px-3"
                disabled={!emailInput.trim()}
                >
                <Plus className="h-4 w-4 mr-1" />
                Add
                </Button>
            </div>

            {/* 已分享的 emails */}
            <div className="space-y-2">
              {sharedEmails.map((email, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                    onClick={() => handleRemoveEmail(email)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            {sharedEmails.length === 0 && (
                <p className="text-sm text-gray-500 italic">Not shared with anyone yet</p>
            )}

            <p className="text-xs text-gray-500">
              Once shared, others will be able to view the contents of this workspace.
            </p>

            <div className="flex justify-end">
              <Button
                onClick={() => {
                  // TODO: 實作分享設定儲存
                  console.log("Save sharing settings:", sharedEmails);
                }}
                size="sm"
                className="px-4"
              >
                Save Sharing Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isRenaming}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SpaceSettingsDialog;