import React, { useMemo } from 'react';
import { FaTag } from "react-icons/fa6";
import SaveStatusIndicator from '@/components/ui/saveStatusIndicator';
import SecureInput from '@/components/ui/secureInput';
import { useEditableState } from '@/hooks/useEditableState';
import { useLocalInputWithDebounce } from '@/hooks/useLocalInputWithDebounce';

interface NameInputProps {
  name: string;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const NameInputComponent = ({
  name,
  onNameChange,
}: NameInputProps) => {
  const { canEdit } = useEditableState();
  
  // 使用自定義 hook 處理本地狀態和 debounce 邏輯
  const { localValue: localName, handleLocalChange: handleLocalNameChange } = useLocalInputWithDebounce({
    initialValue: name,
    onValueChange: onNameChange,
    delay: 800
  });

  // 使用 useMemo 穩定化 styleConfig 物件
  const nameInputStyleConfig = useMemo(() => ({
    paddingLeft: '2.25rem',
    paddingRight: '0.75rem',
    height: '3rem'
  }), []);

  return (
    <div className="relative">
      <SaveStatusIndicator className="absolute -top-8 left-0 z-10 sm:-top-7 md:-top-6" />
      <SecureInput
        className="h-12"
        placeholder="Type prompt name..."
        value={localName}
        onChange={handleLocalNameChange}
        variant="default"
        disabled={!canEdit}
        styleConfig={nameInputStyleConfig}
      />
      <FaTag className="absolute left-[10px] top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
    </div>
  );
};

export const NameInput = React.memo(NameInputComponent);

NameInput.displayName = 'NameInput';