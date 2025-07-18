import React from 'react';
import { usePromptSpacePermission } from '@/hooks/usePromptSpacePermission';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ComponentProps } from 'react';

type InputProps = ComponentProps<typeof Input>;
type TextareaProps = ComponentProps<typeof Textarea>;

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
        {...editableProps}
        className={`${className} ${editableProps.className}`}
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
        {...editableProps}
        className={`${className} ${editableProps.className}`}
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