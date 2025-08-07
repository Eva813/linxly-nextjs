import React, { useRef, useEffect, useMemo, memo, useCallback } from 'react'
import TextInputField from '@/app/prompts/components/textInputField'
import { formTextSpec } from '@/lib/specs/formTextSpec'
import { FieldGroupProps } from '@/types/fieldGropProps'
import { organizeFormInput } from '@/lib/utils'
import { usePromptStore } from '@/stores/prompt/index'

const FormTextFieldsComponent = ({ editInfo, onChange }: FieldGroupProps) => {
  // 使用 useMemo 緩存 organizeFormInput 的結果，避免重複計算
  const organizedFields = useMemo(() => 
    organizeFormInput(editInfo, formTextSpec), 
    [editInfo]
  );

  const nameRef = useRef<HTMLInputElement>(null);
  const defaultRef = useRef<HTMLInputElement>(null);

  const inputRefs = useMemo(() => ({
    name: nameRef,
    default: defaultRef,
  } as { [key: string]: React.RefObject<HTMLInputElement> }), []);

  // 穩定的 onChange 處理器
  const handleFieldChange = useCallback((key: string, newValue: string | null) => {
    onChange({ [key]: newValue });
  }, [onChange]);

  const focusKey = usePromptStore((state) => state.focusKey);

  // 解析 focusKey 獲取位置和字段
  const getFocusInfo = (focusKey: string | null) => {
    if (!focusKey) return { position: null, fieldKey: null };
    const [position, fieldKey] = focusKey.split(':');
    return { position, fieldKey };
  };

  const { position, fieldKey } = getFocusInfo(focusKey);

  useEffect(() => {
    if (fieldKey && inputRefs[fieldKey]?.current) {
      inputRefs[fieldKey].current.focus();
    }
  }, [fieldKey, inputRefs]);

  return (
    <>
      {Object.entries(organizedFields).map(([key, field]) => (
        <TextInputField
          ref={inputRefs[key]}
          key={key}
          title={key}
          description={field.description}
          type={editInfo.type}
          value={field.value}
          highlight={fieldKey === key}
          focusPosition={position}
          onChange={handleFieldChange}
        />
      ))}
    </>
  );
};

export const FormTextFields = memo(FormTextFieldsComponent);