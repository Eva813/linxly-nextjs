import React from 'react';
import { FaKeyboard } from "react-icons/fa6";
import ShortcutErrorAlert from "@/app/prompts/components/shortcutErrorAlert";
import SecureInput from '@/components/ui/secureInput';
import { TryItOutButton } from './tryItOutButton';
import { useEditableState } from '@/hooks/useEditableState';
import { useLocalInputWithDebounce } from '@/hooks/useLocalInputWithDebounce';

interface ShortcutError {
  conflictingShortcut: string;
  message: string;
}

interface ShortcutInputProps {
  shortcut: string;
  shortcutError: ShortcutError | null;
  onShortcutChange: (value: string) => void; // 簡化為直接接收字符串值
  onClearShortcutError: () => void;
}

const ShortcutInputComponent = ({
  shortcut,
  shortcutError,
  onShortcutChange,
  onClearShortcutError,
}: ShortcutInputProps) => {
  const { canEdit } = useEditableState();
  
  // 使用自定義 hook 處理本地狀態和 debounce 邏輯
  const { localValue: localShortcut, handleLocalChange: handleLocalShortcutChange } = useLocalInputWithDebounce({
    initialValue: shortcut,
    onValueChange: onShortcutChange,
    delay: 800
  });

  return (
    <div className="relative">
      <div className="relative">
        <SecureInput
          placeholder="Add a shortcut..."
          value={localShortcut}
          onChange={handleLocalShortcutChange}
          variant="shortcut"
          disabled={!canEdit}
        />
        <FaKeyboard className="absolute left-[10px] top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
        <TryItOutButton shortcut={localShortcut} />
      </div>
      {shortcutError && (
        <ShortcutErrorAlert
          error={shortcutError}
          onClose={onClearShortcutError}
        />
      )}
    </div>
  );
};

export const ShortcutInput = React.memo(ShortcutInputComponent);

ShortcutInput.displayName = 'ShortcutInput';