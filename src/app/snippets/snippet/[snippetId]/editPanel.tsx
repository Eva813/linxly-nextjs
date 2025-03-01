import React, { useCallback } from 'react'
import EditPanelField from '@/app/snippets/components/editPanelField'
import { formTextSpec } from '@/lib/specs/formTextSpec'

export interface FormFieldSpec {
  priority: number;
  description: string;
  placeholder?: string;
  type: string;
  static?: boolean;
  constant?: boolean;
}

export interface FormTextSpec {
  positional: number[];
  named: Record<string, FormFieldSpec>;
}

export interface InputInfo {
  pos: number;
  name: string;
  defaultValue: string;
  type: string;
  [key: string]: string | number;
}
export interface OrganizedField {
  value: string;
  description: string;
  priority: number;
  placeholder?: string;
  type: string;
  static?: boolean;
  constant?: boolean;
}

// 使用 Omit 排除不需要的欄位，建立一個 CleanedInputInfo 型別
type CleanedInputInfo = Omit<InputInfo, 'type' | 'pos'>;

interface SidebarProps {
  editInfo: InputInfo | null;
  onChange: (key: string, newValue: string) => void;
}

export default function EditPanel({ editInfo, onChange }: SidebarProps) {
  const organizeFormInput = (
    input: CleanedInputInfo,
    spec: FormTextSpec
  ): Record<string, OrganizedField> => {
    const organizedInput: Record<string, OrganizedField> = {};

    // 使用 Object.entries 遍歷 spec.named
    Object.entries(spec.named).forEach(([key, fieldSpec]) => {

      const valueFromInput = input[key] !== undefined ? input[key].toString() : '';
    
      organizedInput[key] = {
        value: valueFromInput,
        description: fieldSpec.description,
        priority: fieldSpec.priority,
        placeholder: fieldSpec.placeholder,
        type: fieldSpec.type,
        ...(fieldSpec.static !== undefined && { static: fieldSpec.static }),
        ...(fieldSpec.constant !== undefined && { constant: fieldSpec.constant })
      }; 
    });

    return organizedInput;
  };

  const organizedEditInfo = organizeFormInput({...editInfo}, formTextSpec);
  const handleChange = useCallback((key: string, newValue: string) => {
    console.log('Updating field:', key, 'with new value:', newValue);
    onChange(key, newValue);
  }, [onChange]);

  return (
    <div>
      <h2 className="font-bold px-4 py-2">Edit Panel</h2>
      <div className='px-4 py-2'>{editInfo?.type}</div>
      {Object.entries(organizedEditInfo).map(([key, { value, description }]) => (
        <EditPanelField
          key={key}
          title={key}
          description={description}
          type={editInfo?.type}
          value={value}
          onChange={handleChange}
        />
      ))}
    </div>
  );
}
