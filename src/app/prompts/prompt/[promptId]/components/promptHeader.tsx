import React from 'react';
import { Button } from '@/components/ui/button';
import EditViewButtons, { Mode } from "@/app/prompts/components/editViewButtons";
import { NameInput } from './nameInput';
import { ShortcutInput } from './shortcutInput';
import { useEditableState } from '@/hooks/useEditableState';

interface ShortcutError {
  conflictingShortcut: string;
  message: string;
}

interface PromptHeaderProps {
  name: string;
  shortcut: string;
  shortcutError: ShortcutError | null;
  mode: Mode;
  onNameChange: (value: string) => void;
  onShortcutChange: (value: string) => void;
  onModeChange: (mode: Mode) => void;
  onClearShortcutError: () => void;
  onToggleMobilePanel: () => void;
}

export const PromptHeader = React.memo(({
  name,
  shortcut,
  shortcutError,
  mode,
  onNameChange,
  onShortcutChange,
  onModeChange,
  onClearShortcutError,
  onToggleMobilePanel,
}: PromptHeaderProps) => {
  const { canEdit } = useEditableState();

  return (
    <header className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] mb-4 pt-4 sm:pt-6 md:pt-4 gap-y-4 lg:gap-y-0 justify-items-start sm:justify-items-stretch">
      <div className="grid grid-cols-2 gap-x-4 lg:pr-4">
        {/* Prompt 名稱 */}
        <NameInput
          name={name}
          onNameChange={onNameChange}
        />

        {/* 快捷鍵 */}
        <ShortcutInput
          shortcut={shortcut}
          shortcutError={shortcutError}
          onShortcutChange={onShortcutChange}
          onClearShortcutError={onClearShortcutError}
        />
      </div>

      <div className="flex items-center justify-between lg:justify-end space-x-2">
        <EditViewButtons mode={mode} onModeChange={onModeChange} />
        <Button
          className="h-10 lg:hidden text-primary border-secondary hover:bg-light hover:text-primary"
          variant="outline"
          onClick={onToggleMobilePanel}
          disabled={!canEdit}
        >
          Tools
        </Button>
      </div>
    </header>
  );
});

PromptHeader.displayName = 'PromptHeader';
