import React, { useRef, useEffect, useMemo } from 'react'
import TextInputField from '@/app/snippets/components/textInputField'
import { formTextSpec } from '@/lib/specs/formTextSpec'
import { FieldGroupProps } from '@/types/fieldGropProps'
import { organizeFormInput } from '@/lib/utils'
import { useSnippetStore } from '@/stores/snippet/index'

export const FormTextFields = ({ editInfo, onChange }: FieldGroupProps) => {
  const organizedFields = organizeFormInput(editInfo, formTextSpec);

  const nameRef = useRef<HTMLInputElement>(null);
  const defaultRef = useRef<HTMLInputElement>(null);

  const inputRefs = useMemo(() => ({
    name: nameRef,
    default: defaultRef,
  } as { [key: string]: React.RefObject<HTMLInputElement> }), [nameRef, defaultRef]);

  const focusKey = useSnippetStore((state) => state.focusKey);

  // 解析 focusKey 獲取位置和字段
  const getFocusInfo = (focusKey: string | null) => {
    if (!focusKey) return { position: null, fieldKey: null };
    const [position, fieldKey] = focusKey.split(':');
    return { position, fieldKey };
  };

  const { position, fieldKey } = getFocusInfo(focusKey);

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
          onChange={(_, newValue) => {
            onChange({ [key]: newValue });
          }}
        />
      ))}
    </>
  );
};