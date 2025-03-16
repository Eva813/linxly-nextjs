import React from 'react'
import EditPanelField from '@/app/snippets/components/editPanelField'
import { formTextSpec } from '@/lib/specs/formTextSpec'
import { FieldGroupProps } from '@/types/fieldGropProps'
import { organizeFormInput } from '@/lib/utils'

export const FormTextFields = ({ editInfo, onChange }: FieldGroupProps) => {
  console.log('FormTextFields rendered', editInfo);
  const organizedFields = organizeFormInput(editInfo, formTextSpec);

  return (
    <>
      {Object.entries(organizedFields).map(([key, field]) => (
        <EditPanelField
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