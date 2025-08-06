import React from 'react';
import { FaKeyboard } from "react-icons/fa6";
import ShortcutErrorAlert from "@/app/prompts/components/shortcutErrorAlert";
import SecureInput from '@/components/ui/secureInput';
import { TryItOutButton } from './tryItOutButton';
import { useEditableState } from '@/hooks/useEditableState';

interface ShortcutError {
  conflictingShortcut: string;
  message: string;
}

interface ShortcutInputProps {
  shortcut: string;
  shortcutError: ShortcutError | null;
  onShortcutChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearShortcutError: () => void;
}

export const ShortcutInput = React.memo(({
  shortcut,
  shortcutError,
  onShortcutChange,
  onClearShortcutError,
}: ShortcutInputProps) => {
  const { canEdit } = useEditableState();

  return (
    <div className="relative">
      <div className="relative">
        <SecureInput
          placeholder="Add a shortcut..."
          value={shortcut}
          onChange={onShortcutChange}
          variant="shortcut"
          disabled={!canEdit}
        />
        <FaKeyboard className="absolute left-[10px] top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
        <TryItOutButton shortcut={shortcut} />
      </div>
      {shortcutError && (
        <ShortcutErrorAlert
          error={shortcutError}
          onClose={onClearShortcutError}
        />
      )}
    </div>
  );
});

ShortcutInput.displayName = 'ShortcutInput';
