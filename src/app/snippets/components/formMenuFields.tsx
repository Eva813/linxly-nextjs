import React, { useMemo } from 'react'
import EditPanelField from '@/app/snippets/components/editPanelField'
import { BooleanField } from '@/app/snippets/components/booleanField'
import { OptionsField } from '@/app/snippets/components/optionsField'
import { formMenuSpec } from '@/lib/specs/formMenuSpec'
import { FieldGroupProps } from '@/types/fieldGropProps'
import { organizeFormInput, createOptionsChangeHandler } from '@/lib/utils'

export const FormMenuFields = ({ editInfo, onChange }: FieldGroupProps) => {
  const organizedFields = organizeFormInput(editInfo, formMenuSpec);
  const handleOptionsChange = createOptionsChangeHandler(editInfo, onChange);

  const multipleValue = useMemo(() => {
    // 確保 editInfo.multiple 有值且能轉換為布林值
    if (editInfo.multiple === undefined || editInfo.multiple === null) {
      return false;
    }

    return typeof editInfo.multiple === 'string'
      ? editInfo.multiple === 'true'
      : Boolean(editInfo.multiple);
  }, [editInfo.multiple]);

  return (
    <>
      {/* 基本屬性欄位 */}
      {Object.entries(organizedFields)
        .filter(([key]) => !['options', 'default', 'multiple'].includes(key))
        .map(([key, field]) => (
          <EditPanelField
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
        description="是否允許多選項目"
        value={multipleValue}
        onChange={(newValue) => {
          console.log('布林切換:', newValue);
          // 明確指示型別轉換
          onChange({ multiple: newValue });
        }}
      />
      {/* 選項管理欄位 */}
      <OptionsField
        label="Values"
        multiple={multipleValue}
        values={Array.isArray(editInfo.options) ? editInfo.options : []}
        defaultValue={editInfo.default}
        onChange={handleOptionsChange}
      />
    </>
  );
};