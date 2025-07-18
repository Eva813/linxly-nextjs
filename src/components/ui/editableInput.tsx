import React from 'react';
import { usePromptSpacePermission } from '@/hooks/usePromptSpacePermission';
import { Input, InputProps } from '@/components/ui/input';
import { Textarea, TextareaProps } from '@/components/ui/textarea';

/**
 * 權限感知的 Input 組件
 */
export const EditableInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => {
    const { getEditableProps } = usePromptSpacePermission();
    const editableProps = getEditableProps();

    return (
      <Input
        ref={ref}
        className={`${className} ${editableProps.className}`}
        {...editableProps}
        {...props}
      />
    );
  }
);

EditableInput.displayName = 'EditableInput';

/**
 * 權限感知的 Textarea 組件
 */
export const EditableTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', ...props }, ref) => {
    const { getEditableProps } = usePromptSpacePermission();
    const editableProps = getEditableProps();

    return (
      <Textarea
        ref={ref}
        className={`${className} ${editableProps.className}`}
        {...editableProps}
        {...props}
      />
    );
  }
);

EditableTextarea.displayName = 'EditableTextarea';

/**
 * 通用的權限感知包裝器
 */
interface EditableWrapperProps {
  children: React.ReactNode;
  showWhenDisabled?: boolean;
  disabledMessage?: string;
}

export const EditableWrapper: React.FC<EditableWrapperProps> = ({
  children,
  showWhenDisabled = true,
  disabledMessage = 'Read-only access'
}) => {
  const { canEdit, getRoleDisplay } = usePromptSpacePermission();

  if (!canEdit && !showWhenDisabled) {
    return null;
  }

  if (!canEdit) {
    return (
      <div className="relative">
        <div className="opacity-60 cursor-not-allowed" title={`${getRoleDisplay()} - ${disabledMessage}`}>
          {children}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};