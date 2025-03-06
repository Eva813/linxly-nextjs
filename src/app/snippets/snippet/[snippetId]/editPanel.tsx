import React, { useCallback } from 'react'
import EditPanelField from '@/app/snippets/components/editPanelField'
import { formTextSpec } from '@/lib/specs/formTextSpec'
import { formMenuSpec } from '@/lib/specs/formMenuSpec'
import { InputInfo, EditInfo } from '@/types/snippets'

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

export interface OrganizedField {
  value: string;
  description: string;
  priority: number;
  placeholder?: string;
  type: string;
  static?: boolean;
  constant?: boolean;
}

// 排除 type 與 pos，建立 CleanedInputInfo
type CleanedInputInfo = Omit<InputInfo, 'type' | 'pos'>;

interface SidebarProps {
  editInfo: EditInfo;
  onChange: (key: string, newValue: string) => void;
}

/**
 * 透過 mapping 可以彈性新增其他 type 與 Spec 的對應關係
 * 如果某個 type 需要轉換傳入的資料(例如將 options 陣列轉為字串存入 spec 定義的欄位)，
 * 就在 transform 裡進行處理
 */
type SpecMapping = {
  [key: string]: {
    spec: FormTextSpec;
    transform?: (input: InputInfo) => InputInfo;
  }
};

const specMapping: SpecMapping = {
  formtext: { spec: formTextSpec },
  formmenu: {
    spec: formMenuSpec,
    transform: (input: InputInfo) => {
      // 將傳入的 options 陣列轉換成逗號分隔的字串，對應 spec 中定義的 "option" 欄位
      if (input.options) {
        return { ...input, options: Array.isArray(input.options) ? input.options.join(",") : input.options };
      }
      return input;
    }
  },
  // 未來可加入其他 type 的 mapping
};

export default function EditPanel({ editInfo, onChange }: SidebarProps) {
  console.log('edit', editInfo)
  // 先定義所有的 Hook（這裡 useCallback 必定會被呼叫）
  const handleChange = useCallback((key: string, newValue: string) => {
    console.log('Updating field:', key, 'with new value:', newValue);
    onChange(key, newValue);
  }, [onChange]);

  // 定義一個輔助函式，依據 Spec 與 input 數據建立 OrganizedField 物件
  const organizeFormInput = (
    input: CleanedInputInfo,
    spec: FormTextSpec
  ): Record<string, OrganizedField> => {
    const organizedInput: Record<string, OrganizedField> = {};

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

  // 若 editInfo 為 null，就顯示一個空內容或提示，而不提前 return 前就停止 Hook 呼叫
  if (!editInfo) {
    return <div>No edit info available.</div>;
  }

  // 根據傳入的 type 取得對應的 spec 與轉換函式（若沒有則預設為 formtext）
  const mapping = specMapping[editInfo.type] || { spec: formTextSpec };
  const transformedInput = mapping.transform ? mapping.transform(editInfo) : editInfo;
  const currentSpec = mapping.spec;

  const organizedEditInfo = organizeFormInput({ ...transformedInput } as CleanedInputInfo, currentSpec);
  // formmnue 組合更新會有錯誤
  console.log('organizedEditInfo', organizedEditInfo);

  return (
    <div>
      <h2 className="font-bold px-4 py-2">Edit Panel</h2>
      <div className='px-4 py-2'>{editInfo.type}</div>
      {Object.entries(organizedEditInfo).map(([key, { value, description }]) => (
        <EditPanelField
          key={key}
          title={key}
          description={description}
          type={editInfo.type}
          value={value}
          onChange={handleChange}
        />
      ))}
    </div>
  );
}