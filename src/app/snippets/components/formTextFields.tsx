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
  const setFocusKey = useSnippetStore((state) => state.setFocusKey);

  useEffect(() => {
    if (focusKey && inputRefs[focusKey]?.current) {
      inputRefs[focusKey].current.focus();
      // Clear the focusKey after handling
      setFocusKey(null);
    }
  }, [focusKey, inputRefs, setFocusKey]);

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
          onChange={(_, newValue) => {
            // 使用我們已知的 key
            onChange({ [key]: newValue });
          }}
        />
      ))}
    </>
  );
};