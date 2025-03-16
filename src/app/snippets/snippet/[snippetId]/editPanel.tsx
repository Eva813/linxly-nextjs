import React, { useCallback } from 'react'
import EditPanelField from '@/app/snippets/components/editPanelField'
import { formTextSpec } from '@/lib/specs/formTextSpec'
import { formMenuSpec } from '@/lib/specs/formMenuSpec'
import { InputInfo, EditInfo } from '@/types/snippets'
import { BooleanField } from '@/app/snippets/components/booleanField'
import { OptionsField } from '@/app/snippets/components/optionsField'

export interface FormFieldSpec {
  priority: number;
  description: string;
  placeholder?: string;
  type: string;
  static?: boolean;
  constant?: boolean;
}

// export interface FormTextSpec {
//   positional: number[];
//   named: Record<string, FormFieldSpec>;
// }

// 基礎規格介面
export interface BaseFormSpec {
  positional: number[];
  named: Record<string, FormFieldSpec>;
}

// // 讓特定規格型別擴展基礎介面
// export interface FormTextSpec extends BaseFormSpec {
//   // 特定於 FormTextSpec 的屬性（如果有的話）
// }

// export interface FormMenuSpec extends BaseFormSpec {
//   // 特定於 FormMenuSpec 的屬性（如果有的話）
// }

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
  onChange: (updates: { [key: string]: string | string[] }) => void;
}

/**
 * 透過 mapping 可以彈性新增其他 type 與 Spec 的對應關係
 * 如果某個 type 需要轉換傳入的資料(例如將 options 陣列轉為字串存入 spec 定義的欄位)，
 * 就在 transform 裡進行處理
 */
type SpecMapping = {
  [key: string]: {
    spec: BaseFormSpec;  // 使用基礎規格介面
    transform?: (input: InputInfo) => InputInfo;
  }
};

const specMapping: SpecMapping = {
  formtext: { spec: formTextSpec },
  formmenu: { spec: formMenuSpec },
  // 未來可加入其他 type 的 mapping
};

export default function EditPanel({ editInfo, onChange }: SidebarProps) {
  console.log('edit', editInfo)
  // 先定義所有的 Hook（這裡 useCallback 必定會被呼叫）
  const handleChange = useCallback((updates: { [key: string]: string | string[] }) => {
    console.log('批次更新:', updates);
    onChange(updates);
  }, [onChange]);

  // 處理 OptionsField 的值變更
  const handleOptionsChange = useCallback((newValue: {
    values: string[];
    defaultValue: string | string[];
  }) => {
    console.log('newValue', newValue);

    // 組合更新物件，保留 options 為陣列型態
    const updatedFields: { [key: string]: string | string[] } = {};

    // 保持 options 為陣列
    const newOptionsValue = newValue.values || [];
    if (JSON.stringify(newOptionsValue) !== JSON.stringify(editInfo.options)) {
      updatedFields.options = newOptionsValue;
    }

    // 處理 default 欄位：多選時回傳陣列，單選時轉成字串
    if (newValue.defaultValue !== undefined) {
      if (editInfo.multiple) {
        // 多選模式，直接比對陣列內容
        if (JSON.stringify(newValue.defaultValue) !== JSON.stringify(editInfo.default)) {
          updatedFields.default = newValue.defaultValue;
        }
      } else {
        // 單選模式，轉為字串後比對
        const newDefaultString = newValue.defaultValue.toString();
        const currentDefaultString =
          typeof editInfo.default === 'string'
            ? editInfo.default
            : JSON.stringify(editInfo.default);
        if (newDefaultString !== currentDefaultString) {
          updatedFields.default = newDefaultString;
        }
      }
    }

    if (Object.keys(updatedFields).length > 0) {
      console.log('進行批次更新:', updatedFields);
      handleChange(updatedFields);
    }
  }, [editInfo.default, editInfo.multiple, editInfo.options, handleChange]);

  // 定義一個輔助函式，依據 Spec 與 input 數據建立 OrganizedField 物件
  const organizeFormInput = <T extends BaseFormSpec>(
    input: CleanedInputInfo,
    spec: T
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
      {/* {Object.entries(organizedEditInfo).map(([key, { value, description }]) => (
        <EditPanelField
          key={key}
          title={key}
          description={description}
          type={editInfo.type}
          value={value}
          onChange={(key, newValue) => {
            handleChange({ [key]: newValue });
          }}
        />
      ))} */}
      {/* {Object.entries(organizedEditInfo).map(([key, { value, description }]) => {
        if (editInfo.options) {
          return null;
        }
        return (
          <EditPanelField
            key={key}
            title={key}
            description={description}
            type={editInfo.type}
            value={value}
            onChange={handleChange}
          />
        );
      })} */}
      {/* <BooleanField
        title="multiple"
        description="Whether the user can select multiple items"
        value={editInfo.multiple}
        onChange={(newValue) => handleChange('static', newValue.toString())}
      /> */}

      <OptionsField
        label="Values"
        multiple={editInfo.multiple ?? false}
        values={Array.isArray(editInfo.options) ? editInfo.options : []}
        defaultValue={editInfo.default}
        onChange={handleOptionsChange}
      />
    </div>
  );
}
