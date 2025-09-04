"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check } from 'lucide-react';
import { Folder } from '@/types/prompt';
import { useFolderSharing, ShareStatus } from '@/hooks/folder/useFolderSharing';

interface FolderShareDialogProps {
  folder: Folder;
  isOpen: boolean;
  onClose: () => void;
}

export const FolderShareDialog: React.FC<FolderShareDialogProps> = ({
  folder,
  isOpen,
  onClose,
}) => {
  const {
    shareStatus,
    shareToken,
    isLoading,
    error,
    updateShareStatus,
    copyShareLink,
    clearError,
  } = useFolderSharing(folder.id);
  
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCopySuccess(false);
    }
  }, [isOpen]);

  const shareOptions = [
    {
      value: 'none' as const,
      label: 'None',
      description: 'Do not share this folder',
      disabled: false,
    },
    {
      value: 'team' as const,
      label: 'Team Only',
      description: 'Team sharing feature coming soon',
      disabled: true,
    },
    {
      value: 'public' as const,
      label: 'Public',
      description: 'Anyone with the link can view this folder',
      disabled: false,
    },
  ];

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined' || !shareToken) return '';
    return `${window.location.origin}/shared/folder/${shareToken}`;
  }, [shareToken]);

  const handleShareChange = async (newStatus: string) => {
    if (newStatus === 'team') return; // Team option is disabled
    
    clearError();
    await updateShareStatus(newStatus as ShareStatus);
  };

  const handleCopyClick = async () => {
    const success = await copyShareLink();
    if (success) {
      setCopySuccess(true);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Share &quot;{folder.name}&quot;</DialogTitle>
        </DialogHeader>
        
        <div className="">
          <p className="text-sm text-gray-600 mb-6">
            Who do you want to share {folder.name} with?
          </p>
          
          <RadioGroup 
            value={shareStatus} 
            onValueChange={handleShareChange}
            disabled={isLoading}
            className="grid gap-4"
          >
            {shareOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-3">
                <RadioGroupItem 
                  value={option.value} 
                  id={option.value}
                  disabled={option.disabled || isLoading}
                />
                <Label 
                  htmlFor={option.value} 
                  className={`flex-1 cursor-pointer ${
                    option.disabled ? 'opacity-50' : ''
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className={`text-sm ${
                    option.disabled ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {option.description}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
          
          {/* 錯誤狀態顯示 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-600">{error}</div>
            </div>
          )}
          
          {/* 公開連結顯示區域 */}
          {shareStatus === 'public' && shareToken && (
            <div className="p-4 mt-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex gap-2">
                <Input 
                  value={shareUrl}
                  readOnly 
                  className="flex-1 text-sm bg-white"
                />
                <Button 
                  onClick={handleCopyClick}
                  variant="outline" 
                  size="sm"
                  className="shrink-0"
                  disabled={isLoading}
                >
                  {copySuccess ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {/* Loading 狀態 */}
          {isLoading && (
            <div className="text-center py-4">
              <div className="text-sm text-gray-500">Updating share settings...</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};