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
import { Checkbox } from "@/components/ui/checkbox";
import { FaSpinner } from "react-icons/fa";
import { X, Mail, Plus, Trash2 } from "lucide-react";

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
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
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
    setSelectedEmails(selectedEmails.filter(email => email !== emailToRemove));
  };

  const handleSelectEmail = (email: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedEmails([...selectedEmails, email]);
    } else {
      setSelectedEmails(selectedEmails.filter(e => e !== email));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedEmails([...sharedEmails]);
    } else {
      setSelectedEmails([]);
    }
  };

  const handleBatchDelete = () => {
    setSharedEmails(sharedEmails.filter(email => !selectedEmails.includes(email)));
    setSelectedEmails([]);
  };

  const isAllSelected = sharedEmails.length > 0 && selectedEmails.length === sharedEmails.length;

  const handleClose = () => {
    if (!isRenaming) {
      setSpaceName(currentName);
      setEmailInput("");
      setSelectedEmails([]);
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

        <div className="space-y-6 py-2">
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
            
            <div className="flex gap-2">
              <Input
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter email address"
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

            {/* 批量操作控制 */}
            <div className="h-[48px] flex items-center">
              {sharedEmails.length >= 2 && (
                <div className="flex items-center justify-between p-2 border rounded-md bg-gray-25 w-full h-[44px]">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                    />
                    <span className="text-sm text-gray-600">Select All</span>
                  </div>
                  <div className="min-w-[100px] flex justify-end">
                    {selectedEmails.length > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBatchDelete}
                        className="h-[30px] px-3 bg-rose-500 text-white hover:bg-rose-600"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete ({selectedEmails.length})
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 已分享的 emails */}
            <div className="space-y-2 max-h-[150px] overflow-y-auto">
              {sharedEmails.map((email, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 flex items-center justify-center">
                      {sharedEmails.length >= 2 ? (
                        <Checkbox
                          checked={selectedEmails.includes(email)}
                          onCheckedChange={(checked) => handleSelectEmail(email, checked as boolean)}
                        />
                      ) : null}
                    </div>
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