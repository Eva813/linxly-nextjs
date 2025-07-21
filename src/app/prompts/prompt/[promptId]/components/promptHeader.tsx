import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FaTag, FaKeyboard } from "react-icons/fa6";
import SaveStatusIndicator from '@/components/ui/saveStatusIndicator';
import ShortcutErrorAlert from "@/app/prompts/components/shortcutErrorAlert";
import EditViewButtons, { Mode } from "@/app/prompts/components/editViewButtons";
import TryItOutPopup from '../tryItOutPopup';
import SecureInput from '@/components/ui/secureInput';
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
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onShortcutChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onModeChange: (mode: Mode) => void;
  onClearShortcutError: () => void;
  onToggleMobilePanel: () => void;
}

export const PromptHeader = ({
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
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const tryItOutButtonRef = useRef<HTMLButtonElement>(null);
  const { canEdit } = useEditableState();

  return (
    <header className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] mb-4 pt-4 sm:pt-6 md:pt-4 gap-y-4 lg:gap-y-0 justify-items-start sm:justify-items-stretch">
      <div className="grid grid-cols-2 gap-x-4 lg:pr-4">
        {/* Prompt 名稱 */}
        <div className="relative">
          <SaveStatusIndicator className="absolute -top-8 left-0 z-10 sm:-top-7 md:-top-6" />
          <SecureInput
            className="h-12"
            placeholder="Type prompt name..."
            value={name}
            onChange={onNameChange}
            variant="default"
            disabled={!canEdit}
            styleConfig={{
              paddingLeft: '2.25rem',
              paddingRight: '0.75rem',
              height: '3rem'
            }}
          />
          <FaTag className="absolute left-[10px] top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
        </div>

        {/* 快捷鍵 */}
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
            <Button
              ref={tryItOutButtonRef}
              className="absolute right-[10px] top-1/2 h-8 px-2 text-xs sm:text-sm -translate-y-1/2"
              onClick={e => {
                e.stopPropagation();
                setIsPopupVisible(prev => !prev);
              }}
            >
              Try it out
            </Button>
          </div>
          {shortcutError && (
            <ShortcutErrorAlert
              error={shortcutError}
              onClose={onClearShortcutError}
            />
          )}
          {isPopupVisible && (
            <TryItOutPopup
              tryItOutButtonRef={tryItOutButtonRef}
              shortcut={shortcut}
              onClose={() => setIsPopupVisible(false)}
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between lg:justify-end space-x-2">
        <EditViewButtons mode={mode} onModeChange={onModeChange} />
        <Button
          className="h-10 lg:hidden text-primary border-secondary hover:bg-light hover:text-primary"
          variant="outline"
          onClick={onToggleMobilePanel}
        >
          Tools
        </Button>
      </div>
    </header>
  );
};
