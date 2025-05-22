import React, { useMemo, useRef, useEffect, useCallback } from 'react'
import TextInputField from '@/app/prompts/components/textInputField'
import { BooleanField } from '@/app/prompts/components/booleanField'
import { OptionsField } from '@/app/prompts/components/optionsField'
import { formMenuSpec } from '@/lib/specs/formMenuSpec'
import { FieldGroupProps } from '@/types/fieldGropProps'
import { organizeFormInput, createOptionsChangeHandler } from '@/lib/utils'
import { usePromptStore } from '@/stores/prompt/index'

export const FormMenuFields = ({ editInfo, onChange }: FieldGroupProps) => {
  const organizedFields = organizeFormInput(editInfo, formMenuSpec);
  // const handleOptionsChange = createOptionsChangeHandler(editInfo, onChange);
  // 使用 useCallback 包裝 handleOptionsChange 函式
  const handleOptionsChange = useCallback((options: { values: string[]; defaultValue: string | string[] }) => {
    // 呼叫 createOptionsChangeHandler 建立的函式處理邏輯
    const handler = createOptionsChangeHandler(editInfo, onChange);
    handler(options);
  }, [editInfo, onChange]);

  const focusKey = usePromptStore((state) => state.focusKey);
  // 目前在 formmnue 的編輯，只有 name 欄位需要 focus
  const nameRef = useRef<HTMLInputElement>(null);

  const inputRefs = useMemo(() => ({
    name: nameRef
  } as { [key: string]: React.RefObject<HTMLInputElement> }), [nameRef]);

  // 解析 focusKey 獲取位置和欄位名稱
  const getFocusInfo = (focusKey: string | null) => {
    if (!focusKey) return { position: null, fieldKey: null };
    const [position, fieldKey] = focusKey.split(':');
    return { position, fieldKey };
  };

  const { position, fieldKey } = getFocusInfo(focusKey);

  // 處理焦點設定
  useEffect(() => {
    if (fieldKey && inputRefs[fieldKey]?.current) {
      inputRefs[fieldKey].current.focus();
    }
  }, [fieldKey, inputRefs]);


  const multipleValue = useMemo(() => {
    // 確保 organizedFields.multiple.value 有值且能轉換為布林值
    if (organizedFields.multiple?.value === undefined || organizedFields.multiple?.value === null) {
      return false;
    }

    return typeof organizedFields.multiple.value === 'string'
      ? organizedFields.multiple.value === 'true'
      : Boolean(organizedFields.multiple.value);
  }, [organizedFields.multiple]);

  return (
    <>
      {/* 選項管理欄位 */}
      <OptionsField
        title="options"
        description={organizedFields.options?.description || "Options"}
        multiple={multipleValue}
        values={Array.isArray(editInfo.options) ? editInfo.options : []}
        defaultValue={editInfo.default}
        highlight={fieldKey === 'options'}
        focusPosition={position}
        onChange={handleOptionsChange}
      />
      {/* 基本屬性欄位 */}
      {Object.entries(organizedFields)
        .filter(([key]) => !['options', 'default', 'multiple'].includes(key))
        .map(([key, field]) => (
          <TextInputField
            key={key}
            title={key}
            ref={inputRefs[key]}
            description={field.description}
            type={editInfo.type}
            value={field.value}
            highlight={fieldKey === key}
            focusPosition={position}
            onChange={(_, newValue) => onChange({ [key]: newValue })}
          />
        ))}

      {/* 多選開關 */}
      <BooleanField
        title="multiple"
        description={organizedFields.multiple?.description || "是否允許多選項目"}
        value={multipleValue}
        highlight={fieldKey === 'multiple'}
        focusPosition={position}
        onChange={(newValue) => {
          // 明確指示型別轉換
          onChange({ multiple: newValue });
        }}
      />
    </>
  );
};