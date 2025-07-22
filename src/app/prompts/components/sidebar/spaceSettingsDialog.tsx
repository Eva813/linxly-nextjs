"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePromptSpaceActions } from "@/hooks/promptSpace";
import { useSpaceSharing, useInviteLinks } from "@/hooks/spaceSharing";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FaSpinner } from "react-icons/fa";
import { Plus, Trash2 } from "lucide-react";
import { RowSelectionState } from "@tanstack/react-table";
import MessageAlert from "../shared/messageAlert";
import ShareRecordsTable from "../shared/shareRecordsTable";
import InviteLinksSection from "../shared/inviteLinksSection";
import ProgressBar from "../shared/progressBar";
import BatchEmailUpload from "../shared/batchEmailUpload";

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
  // Rename state
  const [spaceName, setSpaceName] = useState(currentName);
  const [isRenaming, setIsRenaming] = useState(false);
  
  // Sharing input state
  const [emailInput, setEmailInput] = useState("");
  const [selectedPermission, setSelectedPermission] = useState<'view' | 'edit'>('view');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [emailInputMode, setEmailInputMode] = useState<'single' | 'batch'>('single');
  
  // Message state
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Tab configuration
  const tabConfig = [
    {
      id: 'general' as const,
      label: 'General',
      icon: null, // 可以在未來新增圖示
    },
    {
      id: 'sharing' as const,
      label: 'Sharing',
      icon: null,
    }
  ];
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'general' | 'sharing'>('general');
  
  const { renameSpace } = usePromptSpaceActions();
  
  // Custom hooks
  const {
    shareRecords,
    loading,
    savingShares,
    progress,
    addEmailToShares,
    removeEmailFromShares,
    batchRemoveEmails,
    updateEmailPermission,
    saveAllShares
  } = useSpaceSharing({ spaceId, isOpen });
  
  const {
    inviteLinks,
    generatingLink,
    loading: inviteLinksLoading,
    generateInviteLink,
    copyInviteLink
  } = useInviteLinks({ spaceId, isOpen });

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSpaceName(currentName);
      setEmailInput("");
      setSelectedPermission('view');
      setSelectedEmails([]);
      setRowSelection({});
      setEmailInputMode('single');
      setSuccessMessage("");
      setErrorMessage("");
      setActiveTab('general');
      // Don't reset invite links - they should persist across dialog opens
    }
  }, [isOpen, currentName]);


  // Rename space
  const handleRenameSubmit = useCallback(async () => {
    const trimmedName = spaceName.trim();
    if (!trimmedName || trimmedName === currentName) return;

    try {
      setIsRenaming(true);
      await renameSpace(spaceId, trimmedName);
      setSuccessMessage("Space renamed successfully!");
    } catch (error) {
      console.error("Failed to rename space:", error);
      setErrorMessage("Failed to rename space");
    } finally {
      setIsRenaming(false);
    }
  }, [spaceName, currentName, spaceId, renameSpace]);

  // Add email to local list
  const handleAddEmail = useCallback(() => {
    if (!emailInput.trim()) return;
    
    const result = addEmailToShares(emailInput.trim(), selectedPermission);
    
    if (result.success) {
      setEmailInput("");
      setSelectedPermission('view');
      setErrorMessage("");
    } else {
      setErrorMessage(result.error || "Failed to add email");
    }
  }, [emailInput, selectedPermission, addEmailToShares]);

  // Handle batch email addition
  const handleBatchEmailsAdd = useCallback((emails: string[], permission: 'view' | 'edit') => {
    let successCount = 0;
    let failureCount = 0;
    
    emails.forEach(email => {
      const result = addEmailToShares(email, permission);
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
    });

    if (successCount > 0) {
      setSuccessMessage(`Successfully added ${successCount} emails`);
    }
    if (failureCount > 0) {
      setErrorMessage(`${failureCount} emails could not be added (duplicates or invalid)`);
    }
  }, [addEmailToShares]);



  // Handle single email removal
  const handleRemoveEmail = useCallback(async (email: string) => {
    const result = await removeEmailFromShares(email);
    if (result.success) {
      setSuccessMessage(`Successfully removed ${email}`);
      setSelectedEmails(prev => prev.filter(e => e !== email));
    } else {
      setErrorMessage(result.error || `Failed to remove ${email}`);
    }
  }, [removeEmailFromShares]);

  // Sync table selection with selectedEmails  
  const handleRowSelectionChange = useCallback((updater: RowSelectionState | ((prev: RowSelectionState) => RowSelectionState)) => {
    setRowSelection(updater);
    // Extract selected emails from the selection state
    if (typeof updater === 'function') {
      const newSelection = updater(rowSelection);
      const selectedIndexes = Object.keys(newSelection).filter(key => newSelection[key]);
      const emails = selectedIndexes.map(index => shareRecords[parseInt(index)]?.email).filter(Boolean);
      setSelectedEmails(emails);
    }
  }, [rowSelection, shareRecords]);

  const handleBatchDelete = useCallback(async () => {
    const result = await batchRemoveEmails(selectedEmails);
    if (result.success) {
      setSuccessMessage(`Successfully removed ${selectedEmails.length} emails`);
      setSelectedEmails([]);
      setRowSelection({});
    } else {
      setErrorMessage(result.error || 'Failed to delete selected emails');
    }
  }, [selectedEmails, batchRemoveEmails]);

  // Save all sharing changes
  const handleSaveSharing = useCallback(async () => {
    setErrorMessage("");
    const result = await saveAllShares();
    if (result.success) {
      setSuccessMessage('Successfully saved sharing settings!');
    } else {
      setErrorMessage(result.error || 'Failed to save sharing settings');
    }
  }, [saveAllShares]);

  // Generate universal invite link
  const handleGenerateInviteLink = useCallback(async (permission: 'view' | 'edit') => {
    setErrorMessage("");
    const result = await generateInviteLink(permission);
    if (result.success) {
      setSuccessMessage(`${permission} invite link generated and copied to clipboard!`);
    } else {
      setErrorMessage(result.error || 'Failed to generate invite link');
    }
  }, [generateInviteLink]);

  // Copy existing invite link
  const handleCopyInviteLink = useCallback((permission: 'view' | 'edit') => {
    const result = copyInviteLink(permission);
    if (result.success) {
      setSuccessMessage(`${permission} invite link copied to clipboard!`);
    } else {
      setErrorMessage(result.error || 'No invite link found');
    }
  }, [copyInviteLink]);


  const handleClose = useCallback(() => {
    if (!isRenaming && !savingShares) {
      setSpaceName(currentName);
      setEmailInput("");
      setSelectedEmails([]);
      setEmailInputMode('single');
      setSuccessMessage("");
      setErrorMessage("");
      // Keep invite links - they should persist across dialog sessions
      onClose();
    }
  }, [isRenaming, savingShares, currentName, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[750px] max-h-[85vh] overflow-hidden p-4" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Space Settings</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Manage your workspace name and sharing settings
          </p>
        </DialogHeader>
        
        <div className="flex h-[60vh]">
          {/* Left Sidebar */}
          <div className="w-32 border-r border-gray-200 pr-4">
            <nav className="space-y-1">
              {tabConfig.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-light text-primary dark:text-third' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.icon && <span className="mr-2">{tab.icon}</span>}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 pl-4 overflow-y-auto">
            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* Success/Error Messages */}
                {successMessage && (
                  <MessageAlert 
                    type="success" 
                    message={successMessage} 
                    onClose={() => setSuccessMessage("")} 
                  />
                )}

                {errorMessage && (
                  <MessageAlert 
                    type="error" 
                    message={errorMessage} 
                    onClose={() => setErrorMessage("")} 
                  />
                )}

                {/* Space Name Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Space Name</h3>
                  <div className="flex items-center gap-2">
                    <Input
                      value={spaceName}
                      onChange={(e) => setSpaceName(e.target.value)}
                      placeholder="Enter space name"
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
              </div>
            )}
            
            {activeTab === 'sharing' && (
              <div className="space-y-3">
                {/* Success/Error Messages */}
                {successMessage && (
                  <MessageAlert 
                    type="success" 
                    message={successMessage} 
                    onClose={() => setSuccessMessage("")} 
                  />
                )}

                {errorMessage && (
                  <MessageAlert 
                    type="error" 
                    message={errorMessage} 
                    onClose={() => setErrorMessage("")} 
                  />
                )}

                {/* Universal Invite Links */}
                <InviteLinksSection
                  inviteLinks={inviteLinks}
                  generatingLink={generatingLink}
                  loading={inviteLinksLoading}
                  onGenerateLink={handleGenerateInviteLink}
                  onCopyLink={handleCopyInviteLink}
                />
                
                {/* Add Email Section with Tabs */}
                <div className="space-y-3">
                  {/* Tab Selection */}
                  <div className="flex border-b">
                    <button
                      onClick={() => setEmailInputMode('single')}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        emailInputMode === 'single'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Single Email
                    </button>
                    <button
                      onClick={() => setEmailInputMode('batch')}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        emailInputMode === 'batch'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Batch Upload
                    </button>
                  </div>

                  {/* Tab Content */}
                  {emailInputMode === 'single' ? (
                    <div className="flex items-center gap-2">
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
                      <Select value={selectedPermission} onValueChange={(value: 'view' | 'edit') => setSelectedPermission(value)}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="view">View</SelectItem>
                          <SelectItem value="edit" disabled>Edit</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        onClick={handleAddEmail}
                        className="px-3"
                        disabled={!emailInput.trim() || loading}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  ) : (
                    <BatchEmailUpload
                      onEmailsAdd={handleBatchEmailsAdd}
                      disabled={loading}
                    />
                  )}
                </div>

                {/* Progress Bar */}
                <ProgressBar
                  completed={progress.completed}
                  total={progress.total}
                  isVisible={savingShares}
                />

                {/* Batch Operations */}
                {shareRecords.length > 0 && selectedEmails.length > 0 && (
                  <div className="flex items-center justify-between py-1 px-2 border rounded-md bg-gray-25 w-full min-h-[40px]">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {selectedEmails.length} of {shareRecords.length} selected
                      </span>
                    </div>
                    <div className="min-w-[100px] flex justify-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBatchDelete}
                        className="h-[30px] px-3 bg-rose-500 text-white hover:bg-rose-600"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete ({selectedEmails.length})
                      </Button>
                    </div>
                  </div>
                )}

                {/* Share Records Data Table */}
                {loading ? (
                  <div className="flex items-center justify-center p-8 border rounded-md">
                    <FaSpinner className="animate-spin mr-2" />
                    Loading shares...
                  </div>
                ) : shareRecords.length === 0 ? (
                  <div className="text-center p-8 border rounded-md">
                    <p className="text-sm text-gray-500 italic">
                      Not shared with anyone yet
                    </p>
                  </div>
                ) : (
                  <ShareRecordsTable
                    data={shareRecords}
                    rowSelection={rowSelection}
                    onRowSelectionChange={handleRowSelectionChange}
                    onPermissionChange={updateEmailPermission}
                    onRemoveEmail={handleRemoveEmail}
                    loading={loading}
                  />
                )}

                <p className="text-xs text-gray-500">
                  Once shared, others can view and edit this workspace based on their permissions.
                </p>

                {/* Save Sharing Settings Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveSharing}
                    disabled={savingShares || loading || shareRecords.length === 0}
                    size="sm"
                    className="px-4"
                  >
                    {savingShares ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      "Save Sharing Settings"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>



      </DialogContent>
    </Dialog>
  );
};

export default SpaceSettingsDialog;