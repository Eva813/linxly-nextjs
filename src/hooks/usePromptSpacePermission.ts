import React from 'react';
import { usePromptSpaceStore } from '@/stores/promptSpace';

export interface PromptSpacePermissionState {
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  isOwner: boolean;
  currentRole: 'owner' | 'edit' | 'view' | null;
  getRoleDisplay: () => string;
  getEditableProps: () => {
    disabled: boolean;
    className: string;
    title?: string;
  };
}

/**
 * Prompt Space 權限檢查 Hook
 * 提供所有頁面和組件需要的 prompt space 權限狀態
 */
export const usePromptSpacePermission = (): PromptSpacePermissionState => {
  const { getCurrentSpaceRole } = usePromptSpaceStore();
  const currentRole = getCurrentSpaceRole();

  const isOwner = currentRole === 'owner';
  const canEdit = isOwner || currentRole === 'edit';
  const canDelete = isOwner || currentRole === 'edit';
  const canShare = isOwner; // 只有擁有者可以分享

  const getRoleDisplay = () => {
    switch (currentRole) {
      case 'owner':
        return 'Owner';
      case 'edit':
        return 'Editor';
      case 'view':
        return 'Viewer';
      default:
        return 'Unknown';
    }
  };

  const getEditableProps = () => ({
    disabled: !canEdit,
    className: !canEdit ? 'cursor-not-allowed opacity-60' : '',
    title: !canEdit ? `${getRoleDisplay()} - Read-only access` : undefined,
  });

  return {
    canEdit,
    canDelete,
    canShare,
    isOwner,
    currentRole,
    getRoleDisplay,
    getEditableProps,
  };
};

/**
 * Prompt Space 權限檢查的高階組件
 */
export const withPromptSpacePermissionCheck = <T extends object>(
  Component: React.ComponentType<T>,
  requiredPermission: 'edit' | 'delete' | 'share' = 'edit'
): React.ComponentType<T> => {
  const WrappedComponent = (props: T) => {
    const permissions = usePromptSpacePermission();
    
    const hasPermission = (() => {
      switch (requiredPermission) {
        case 'edit':
          return permissions.canEdit;
        case 'delete':
          return permissions.canDelete;
        case 'share':
          return permissions.canShare;
        default:
          return false;
      }
    })();

    if (!hasPermission) {
      return null; // 或返回禁用狀態的組件
    }

    return React.createElement(Component, props);
  };

  return WrappedComponent;
};