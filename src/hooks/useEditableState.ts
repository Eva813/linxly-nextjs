import { useCallback } from 'react';
import { usePromptSpacePermission } from './usePromptSpacePermission';

/**
 * 權限感知的編輯狀態 Hook
 * 包裝所有編輯相關的操作，自動加入權限檢查
 */
export const useEditableState = () => {
  const { canEdit, canDelete, getEditableProps } = usePromptSpacePermission();

  /**
   * 檢查是否有編輯權限，用於在函數內部檢查
   */
  const checkEditPermission = useCallback(() => {
    if (!canEdit) {
      console.warn('Edit operation blocked: insufficient permissions');
      return false;
    }
    return true;
  }, [canEdit]);

  /**
   * 檢查是否有刪除權限，用於在函數內部檢查
   */
  const checkDeletePermission = useCallback(() => {
    if (!canDelete) {
      console.warn('Delete operation blocked: insufficient permissions');
      return false;
    }
    return true;
  }, [canDelete]);


  /**
   * 獲取按鈕的 props（包含權限狀態）
   */
  const getButtonProps = useCallback(
    (requiredPermission: 'edit' | 'delete' = 'edit', additionalProps: Record<string, unknown> = {}) => {
      const hasPermission = requiredPermission === 'edit' ? canEdit : canDelete;
      const { className: additionalClassName, ...otherProps } = additionalProps;
      const permissionClassName = !hasPermission ? 'cursor-not-allowed opacity-50' : '';
      
      return {
        disabled: !hasPermission,
        title: !hasPermission ? 'Insufficient permissions' : '',
        ...otherProps,
        className: `${additionalClassName || ''} ${permissionClassName}`.trim(),
      };
    },
    [canEdit, canDelete]
  );

  return {
    canEdit,
    canDelete,
    checkEditPermission,
    checkDeletePermission,
    getButtonProps,
    getEditableProps,
  };
};