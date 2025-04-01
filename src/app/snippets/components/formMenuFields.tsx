import React, { useMemo } from 'react'
import TextInputField from '@/app/snippets/components/textInputField'
import { BooleanField } from '@/app/snippets/components/booleanField'
import { OptionsField } from '@/app/snippets/components/optionsField'
import { formMenuSpec } from '@/lib/specs/formMenuSpec'
import { FieldGroupProps } from '@/types/fieldGropProps'
import { organizeFormInput, createOptionsChangeHandler } from '@/lib/utils'

export const FormMenuFields = ({ editInfo, onChange }: FieldGroupProps) => {
  const organizedFields = organizeFormInput(editInfo, formMenuSpec);
  const handleOptionsChange = createOptionsChangeHandler(editInfo, onChange);
  console.log('FormMenuFields rendering with editInfo:', organizedFields);

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
      {/* 基本屬性欄位 */}
      {Object.entries(organizedFields)
        .filter(([key]) => !['options', 'default', 'multiple'].includes(key))
        .map(([key, field]) => (
          <TextInputField
            key={key}
            title={key}
            description={field.description}
            type={editInfo.type}
            value={field.value}
            onChange={(_, newValue) => onChange({ [key]: newValue })}
          />
        ))}

      {/* 多選開關 */}
      <BooleanField
        title="multiple"
        description={organizedFields.multiple?.description || "是否允許多選項目"}
        value={multipleValue}
        onChange={(newValue) => {
          console.log('布林切換:', newValue);
          // 明確指示型別轉換
          onChange({ multiple: newValue });
        }}
      />
      {/* 選項管理欄位 */}
      <OptionsField
        title="options"
        description={organizedFields.options?.description || "選項"}
        multiple={multipleValue}
        values={Array.isArray(editInfo.options) ? editInfo.options : []}
        defaultValue={editInfo.default}
        onChange={handleOptionsChange}
      />
    </>
  );
};