import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { InputInfo, EditInfo } from '@/types/snippets'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/// types 需整理 ///
export interface FormFieldSpec {
  priority: number;
  description: string;
  placeholder?: string;
  type: string;
  static?: boolean;
  constant?: boolean;
}
export interface BaseFormSpec {
  positional: number[];
  named: Record<string, FormFieldSpec>;
}
// 排除 type 與 pos，建立 CleanedInputInfo
type CleanedInputInfo = Omit<InputInfo, 'type' | 'pos'>;
export interface OrganizedField {
  value: string;
  description: string;
  priority: number;
  placeholder?: string;
  type: string;
  static?: boolean;
  constant?: boolean;
}
/// 需整理 ///


export function organizeFormInput<T extends BaseFormSpec>(
  input: CleanedInputInfo,
  spec: T
): Record<string, OrganizedField> {
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

// 建立 options 變更處理函式
export function createOptionsChangeHandler(
  editInfo: EditInfo,
  onChange: (updates: { [key: string]: string | string[] }) => void
) {
  return (newValue: { values: string[]; defaultValue: string | string[] }) => {
    const updatedFields: { [key: string]: string | string[] } = {};

    // 保持 options 為陣列
    const newOptionsValue = newValue.values || [];
    if (JSON.stringify(newOptionsValue) !== JSON.stringify(editInfo.options)) {
      updatedFields.options = newOptionsValue;
    }

    // 處理 default 欄位
    if (newValue.defaultValue !== undefined) {
      if (editInfo.multiple) {
        if (JSON.stringify(newValue.defaultValue) !== JSON.stringify(editInfo.default)) {
          updatedFields.default = newValue.defaultValue;
        }
      } else {
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
      onChange(updatedFields);
    }
  };
}