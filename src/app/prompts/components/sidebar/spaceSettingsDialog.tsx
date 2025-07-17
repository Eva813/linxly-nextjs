"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getSortedRowModel,
  RowSelectionState,
} from "@tanstack/react-table";
import { FaSpinner } from "react-icons/fa";
import { X, Mail, Plus, Trash2, Copy, CheckCircle, AlertCircle } from "lucide-react";
import { 
  getSpaceShares, 
  batchCreateShares, 
  batchUpdateShares,
  batchDeleteShares,
  createInviteLink,
  ShareItem,
  ShareRecord,
  isValidEmail 
} from "@/api/spaceShares";

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
  
  // Sharing state
  const [emailInput, setEmailInput] = useState("");
  const [selectedPermission, setSelectedPermission] = useState<'view' | 'edit'>('view');
  const [shareRecords, setShareRecords] = useState<ShareRecord[]>([]);
  const [originalShareRecords, setOriginalShareRecords] = useState<ShareRecord[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [loading, setLoading] = useState(false);
  const [savingShares, setSavingShares] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Invite link state
  const [inviteLinks, setInviteLinks] = useState<{
    view?: { link: string; shareId: string; expiresAt: string };
    edit?: { link: string; shareId: string; expiresAt: string };
  }>({});
  const [generatingLink, setGeneratingLink] = useState<'view' | 'edit' | null>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'general' | 'sharing'>('general');
  
  const { renameSpace } = usePromptSpaceActions();

  // Reset state when dialog opens
  useEffect(() => {
    const loadShareRecords = async () => {
      try {
        setLoading(true);
        const response = await getSpaceShares(spaceId);
        setShareRecords(response.shares);
        setOriginalShareRecords(response.shares);
      } catch (error) {
        console.error('Failed to load share records:', error);
        setErrorMessage('Failed to load sharing settings');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      setSpaceName(currentName);
      setEmailInput("");
      setSelectedPermission('view');
      setSelectedEmails([]);
      setRowSelection({});
      setSuccessMessage("");
      setErrorMessage("");
      setInviteLinks({});
      setActiveTab('general');
      loadShareRecords();
    }
  }, [isOpen, currentName, spaceId]);


  // Rename space
  const handleRenameSubmit = async () => {
    if (!spaceName.trim() || spaceName.trim() === currentName) return;

    try {
      setIsRenaming(true);
      await renameSpace(spaceId, spaceName.trim());
      setSuccessMessage("Space renamed successfully!");
    } catch (error) {
      console.error("Failed to rename space:", error);
      setErrorMessage("Failed to rename space");
    } finally {
      setIsRenaming(false);
    }
  };

  // Add email to local list
  const handleAddEmail = () => {
    if (!emailInput.trim()) return;
    
    if (!isValidEmail(emailInput.trim())) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    if (shareRecords.some(record => record.email === emailInput.trim())) {
      setErrorMessage("This email is already shared");
      return;
    }

    // Add to local list (will be saved when user clicks save)
    const newRecord: ShareRecord = {
      id: Date.now().toString(), // temporary ID
      email: emailInput.trim(),
      permission: selectedPermission,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setShareRecords([...shareRecords, newRecord]);
    setEmailInput("");
    setSelectedPermission('view');
    setErrorMessage("");
  };



  // Define columns for the data table
  const columns = useMemo<ColumnDef<ShareRecord>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-500" />
          <span className="text-sm">{row.getValue("email")}</span>
        </div>
      ),
    },
    {
      accessorKey: "permission",
      header: "Permission",
      cell: ({ row }) => (
        <Select
          value={row.original.permission}
          onValueChange={(value: 'view' | 'edit') => {
            setShareRecords(shareRecords.map(record => 
              record.email === row.original.email ? { ...record, permission: value } : record
            ));
          }}
        >
          <SelectTrigger className="w-20 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="view">View</SelectItem>
            <SelectItem value="edit">Edit</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
          onClick={async () => {
            const emailToRemove = row.original.email;
            try {
              // Check if this email exists in original records (was saved to backend)
              const existingRecord = originalShareRecords.find(record => record.email === emailToRemove);
              
              if (existingRecord) {
                // Email exists in backend, delete it immediately
                setLoading(true);
                const deleteResults = await batchDeleteShares(spaceId, [emailToRemove]);
                
                if (deleteResults.failed.length > 0) {
                  setErrorMessage(`Failed to delete ${emailToRemove}: ${deleteResults.failed[0].reason}`);
                  return;
                }
                
                // Update original records to reflect deletion
                setOriginalShareRecords(originalShareRecords.filter(record => record.email !== emailToRemove));
                setSuccessMessage(`Successfully removed ${emailToRemove}`);
              }
              
              // Remove from local state regardless
              setShareRecords(shareRecords.filter(record => record.email !== emailToRemove));
              setSelectedEmails(selectedEmails.filter(email => email !== emailToRemove));
              
            } catch (error) {
              console.error('Failed to remove email:', error);
              setErrorMessage(`Failed to remove ${emailToRemove}`);
            } finally {
              setLoading(false);
            }
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      ),
      enableSorting: false,
    },
  ], [shareRecords, originalShareRecords, selectedEmails, spaceId, setLoading, setErrorMessage, setSuccessMessage, setOriginalShareRecords, setShareRecords, setSelectedEmails]);

  // Create table instance
  const table = useReactTable({
    data: shareRecords,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  });

  // Sync table selection with selectedEmails
  useEffect(() => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const emails = selectedRows.map(row => row.original.email);
    setSelectedEmails(emails);
  }, [rowSelection, table]);

  const handleBatchDelete = async () => {
    try {
      // Find emails that exist in backend (need to be deleted via API)
      const emailsToDeleteFromBackend = selectedEmails.filter(email => 
        originalShareRecords.some(record => record.email === email)
      );
      
      if (emailsToDeleteFromBackend.length > 0) {
        setLoading(true);
        const deleteResults = await batchDeleteShares(spaceId, emailsToDeleteFromBackend);
        
        if (deleteResults.failed.length > 0) {
          setErrorMessage(`Failed to delete some emails. Check console for details.`);
          console.error('Failed batch delete:', deleteResults.failed);
        } else {
          setSuccessMessage(`Successfully removed ${emailsToDeleteFromBackend.length} emails`);
        }
        
        // Update original records to reflect deletions
        setOriginalShareRecords(originalShareRecords.filter(record => 
          !emailsToDeleteFromBackend.includes(record.email)
        ));
      }
      
      // Remove from local state
      setShareRecords(shareRecords.filter(record => !selectedEmails.includes(record.email)));
      setSelectedEmails([]);
      setRowSelection({});
      
    } catch (error) {
      console.error('Failed to batch delete:', error);
      setErrorMessage('Failed to delete selected emails');
    } finally {
      setLoading(false);
    }
  };

  // Save all sharing changes
  const handleSaveSharing = async () => {
    try {
      setSavingShares(true);
      setProgress({ completed: 0, total: shareRecords.length });
      setErrorMessage("");

      // Prepare shares for API
      const sharesToCreate: ShareItem[] = shareRecords
        .filter(record => !record.userId) // New shares without userId
        .map(record => ({ email: record.email, permission: record.permission }));

      const sharesToUpdate: ShareItem[] = shareRecords
        .filter(record => record.userId) // Existing shares with userId
        .map(record => ({ email: record.email, permission: record.permission }));

      // Note: Deletions are handled immediately in handleRemoveEmail and handleBatchDelete

      const results: {
        success: Array<{email: string; shareId: string; inviteLink: string}>;
        failed: Array<{email: string; reason: string}>;
      } = { success: [], failed: [] };

      // Create new shares
      if (sharesToCreate.length > 0) {
        const createResults = await batchCreateShares(
          spaceId, 
          sharesToCreate,
          (completed, total) => setProgress({ completed, total })
        );
        results.success.push(...(createResults.success || []));
        results.failed.push(...(createResults.failed || []));
      }

      // Update existing shares
      if (sharesToUpdate.length > 0) {
        const updateResults = await batchUpdateShares(
          spaceId,
          sharesToUpdate,
          (completed, total) => setProgress({ completed, total })
        );
        results.failed.push(...(updateResults.failed || []));
      }

      // Note: Deletions are handled immediately, no need to process here

      // Show results
      if (results.failed.length === 0) {
        setSuccessMessage(`Successfully shared with ${results.success.length} users!`);
      } else {
        setErrorMessage(`${results.failed.length} emails failed. Check console for details.`);
        console.error('Failed shares:', results.failed);
      }

      // Reload share records
      const response = await getSpaceShares(spaceId);
      setShareRecords(response.shares);
      setOriginalShareRecords(response.shares);

    } catch (error) {
      console.error('Failed to save sharing settings:', error);
      setErrorMessage('Failed to save sharing settings');
    } finally {
      setSavingShares(false);
      setProgress({ completed: 0, total: 0 });
    }
  };

  // Generate universal invite link
  const handleGenerateInviteLink = async (permission: 'view' | 'edit') => {
    try {
      setGeneratingLink(permission);
      setErrorMessage("");
      
      const response = await createInviteLink(spaceId, permission);
      const inviteLink = `${window.location.origin}/invite/${response.shareId}`;
      
      setInviteLinks(prev => ({
        ...prev,
        [permission]: {
          link: inviteLink,
          shareId: response.shareId,
          expiresAt: response.expiresAt
        }
      }));
      
      // Auto copy to clipboard
      navigator.clipboard.writeText(inviteLink);
      setSuccessMessage(`${permission} invite link generated and copied to clipboard!`);
      
    } catch (error) {
      console.error('Failed to generate invite link:', error);
      setErrorMessage('Failed to generate invite link');
    } finally {
      setGeneratingLink(null);
    }
  };

  // Copy existing invite link
  const handleCopyInviteLink = (permission: 'view' | 'edit') => {
    const linkData = inviteLinks[permission];
    if (linkData) {
      navigator.clipboard.writeText(linkData.link);
      setSuccessMessage(`${permission} invite link copied to clipboard!`);
    }
  };


  const handleClose = () => {
    if (!isRenaming && !savingShares) {
      setSpaceName(currentName);
      setEmailInput("");
      setSelectedEmails([]);
      setSuccessMessage("");
      setErrorMessage("");
      setInviteLinks({});
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden">
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
              <button
                onClick={() => setActiveTab('general')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'general' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                General
              </button>
              <button
                onClick={() => setActiveTab('sharing')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'sharing' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Sharing
              </button>
            </nav>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 pl-4">
            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* Success/Error Messages */}
                {successMessage && (
                  <div className="flex items-center justify-between gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700">{successMessage}</span>
                    </div>
                    <button onClick={() => setSuccessMessage("")} className="p-1 rounded-full hover:bg-green-100">
                      <X className="h-4 w-4 text-green-700" />
                    </button>
                  </div>
                )}

                {errorMessage && (
                  <div className="flex items-center justify-between gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-700">{errorMessage}</span>
                    </div>
                    <button onClick={() => setErrorMessage("")} className="p-1 rounded-full hover:bg-red-100">
                      <X className="h-4 w-4 text-red-700" />
                    </button>
                  </div>
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
                  <div className="flex items-center justify-between gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700">{successMessage}</span>
                    </div>
                    <button onClick={() => setSuccessMessage("")} className="p-1 rounded-full hover:bg-green-100">
                      <X className="h-4 w-4 text-green-700" />
                    </button>
                  </div>
                )}

                {errorMessage && (
                  <div className="flex items-center justify-between gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-700">{errorMessage}</span>
                    </div>
                    <button onClick={() => setErrorMessage("")} className="p-1 rounded-full hover:bg-red-100">
                      <X className="h-4 w-4 text-red-700" />
                    </button>
                  </div>
                )}

                {/* Universal Invite Links */}
                <div className="border rounded-md p-3 bg-blue-50 border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Universal Invite Links</h4>
                  <p className="text-xs text-blue-700 mb-3">
                    Generate shareable links for invited users. Only users with email addresses in the shared list above can join using these links.
                  </p>
                  
                  <div className="space-y-3">
                    {/* Generate Links Row */}
                    <div className="flex gap-2">
                      {/* View Permission Link */}
                      <div className="flex-1">
                        {inviteLinks.view ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={inviteLinks.view.link}
                              readOnly
                              className="flex-1 h-8 text-xs bg-green-50 border-green-200"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-green-100 flex-shrink-0"
                              onClick={() => handleCopyInviteLink('view')}
                              title="Copy link"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateInviteLink('view')}
                            disabled={generatingLink === 'view'}
                            className="w-full h-8 text-xs"
                          >
                            {generatingLink === 'view' ? (
                              <>
                                <FaSpinner className="animate-spin mr-1" />
                                Generating...
                              </>
                            ) : (
                              'Generate View Link'
                            )}
                          </Button>
                        )}
                      </div>

                      {/* Edit Permission Link */}
                      <div className="flex-1">
                        {inviteLinks.edit ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={inviteLinks.edit.link}
                              readOnly
                              className="flex-1 h-8 text-xs bg-green-50 border-green-200"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-green-100 flex-shrink-0"
                              onClick={() => handleCopyInviteLink('edit')}
                              title="Copy link"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateInviteLink('edit')}
                            disabled={generatingLink === 'edit'}
                            className="w-full h-8 text-xs"
                          >
                            {generatingLink === 'edit' ? (
                              <>
                                <FaSpinner className="animate-spin mr-1" />
                                Generating...
                              </>
                            ) : (
                              'Generate Edit Link'
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Add Email Input */}
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
                      <SelectItem value="edit">Edit</SelectItem>
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

                {/* Progress Bar */}
                {savingShares && progress.total > 0 && (
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      Processing {progress.completed}/{progress.total} emails...
                    </p>
                  </div>
                )}

                {/* Batch Operations */}
                {shareRecords.length > 0 && selectedEmails.length > 0 && (
                  <div className="flex items-center justify-between p-2 border rounded-md bg-gray-25 w-full min-h-[44px]">
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
                  <div className="relative w-full max-h-[200px] border rounded-md overflow-y-auto">
                    <Table noWrapper>
                      <TableHeader className="bg-background sticky top-0 z-10">
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                              <TableHead key={header.id}>
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {table.getRowModel().rows?.length ? (
                          table.getRowModel().rows.map((row) => (
                            <TableRow
                              key={row.id}
                              data-state={row.getIsSelected() && "selected"}
                            >
                              {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={columns.length}
                              className="h-24 text-center"
                            >
                              No results.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  Once shared, others will be able to view and edit the contents of this workspace based on their permission level.
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