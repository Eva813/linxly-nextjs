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


export type InputInfo = Record<string, string>;


export interface OrganizedField {
  value: string ;
  description: string;
  priority: number;
  placeholder?: string;
  type: string;
  static?: boolean;
  constant?: boolean;
}

interface SidebarProps {
  onInsertTextFieldClick: () => void;
  onInsertMenuFieldClick: () => void;
  editInfo: InputInfo;
  onChange: (key: string, newValue: string) => void;
}


export default function EditPanel({ editInfo, onChange }: SidebarProps) {

  console.log('editInfo', editInfo)
  // 通用整理输入对象的函数
  const organizeFormInput = (
    input: InputInfo,
    spec: FormTextSpec
  ): Record<string, OrganizedField> => {
    const organizedInput: Record<string, OrganizedField> = {};

    // 遍历规格中的每个字段
    for (const key in spec.named) {
      if (spec.named.hasOwnProperty(key)) {
        const fieldSpec = spec.named[key];
        organizedInput[key] = {
          value: input[key] || '', // 使用输入对象中的值，默认为空字符串
          description: fieldSpec.description,
          priority: fieldSpec.priority,
          placeholder: fieldSpec.placeholder,
          type: fieldSpec.type,
          ...(fieldSpec.static !== undefined && { static: fieldSpec.static }), // 仅在存在时添加
          ...(fieldSpec.constant !== undefined && { constant: fieldSpec.constant }) // 仅在存在时添加
        };
      }
      if (key === 'default') {
        organizedInput[key].value = input.defaultValue || ''; // 使用 defaultValue 的值
      }
    }

    return organizedInput;
  };
  // 整理 editInfo
  const cleanedEditInfo = { ...editInfo };
  delete cleanedEditInfo.type; // 去除 type
  delete cleanedEditInfo.pos;   // 去除 pos
  if (cleanedEditInfo.label) {
    cleanedEditInfo.name = cleanedEditInfo.label; // 将 label 改为 name
    delete cleanedEditInfo.label; // 去除原来的 label
  }

  // 使用 organizeFormInput 函数整理 editInfo
  const organizedEditInfo = organizeFormInput(cleanedEditInfo, formTextSpec);
  console.log('data', organizedEditInfo)

  const handleChange = useCallback((key: string, newValue: string) => {
    console.log('Updating field:', key, 'with new value:', newValue);
    onChange(key, newValue); // 傳遞 key 和新值
  }, [onChange]);

  return (
    <div>
      <h2 className="font-bold px-4 py-2">Edit Panel</h2>
      <div className='px-4 py-2'>{editInfo.type}</div>
      {/* <EditPanelField /> */}
      {Object.entries(organizedEditInfo).map(([key, { value, description }]) => {
        return (
          <EditPanelField
            key={key} // Ensure a unique key for each EditPanelField
            title={key}
            description={description}
            type={editInfo.type}
            value={value} // 使用整理后的 value
            onChange={handleChange}
          />
        );
      })}
    </div>
  )
}
