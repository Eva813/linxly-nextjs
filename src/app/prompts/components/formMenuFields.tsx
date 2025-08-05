import React, { useMemo, useRef, useEffect, useCallback } from 'react'
import TextInputField from '@/app/prompts/components/textInputField'
import { BooleanField } from '@/app/prompts/components/booleanField'
import { OptionsField } from '@/app/prompts/components/optionsField'
import { formMenuSpec } from '@/lib/specs/formMenuSpec'
import { FieldGroupProps } from '@/types/fieldGropProps'
import { organizeFormInput } from '@/lib/utils'
import { usePromptStore } from '@/stores/prompt/index'

export const FormMenuFields = ({ editInfo, onChange }: FieldGroupProps) => {
  const organizedFields = organizeFormInput(editInfo, formMenuSpec);
  const focusKey = usePromptStore((state) => state.focusKey);
  
  // 先定義 multipleValue
  const multipleValue = useMemo(() => {
    // 確保 organizedFields.multiple.value 有值且能轉換為布林值
    if (organizedFields.multiple?.value === undefined || organizedFields.multiple?.value === null) {
      return false;
    }

    return typeof organizedFields.multiple.value === 'string'
      ? organizedFields.multiple.value === 'true'
      : Boolean(organizedFields.multiple.value);
  }, [organizedFields.multiple]);

  // 分離選項和選擇的變更處理器
  const handleOptionsChange = useCallback((newOptions: string[]) => {
    onChange({ options: newOptions });
  }, [onChange]);

  const handleSelectionChange = useCallback((newSelection: string[]) => {
    const updatedDefault = multipleValue 
      ? newSelection 
      : (newSelection[0] || '');
    onChange({ default: updatedDefault });
  }, [onChange, multipleValue]);
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


  /**
   * 計算當前選中的選項值
   * 將 editInfo.default 統一轉換為字串陣列格式，供 OptionsField 使用
   * 
   * 處理邏輯：
   * 1. 多選模式 (multipleValue = true)：
   *    - 陣列輸入：過濾空值後直接使用 ["opt1", "opt2"]
   *    - 字串輸入：包裝成陣列 "opt1" → ["opt1"]
   * 
   * 2. 單選模式 (multipleValue = false)：
   *    - 陣列輸入：只取第一個有效值 ["opt1", "opt2"] → ["opt1"]
   *    - 字串輸入：包裝成陣列 "opt1" → ["opt1"]
   * 
   * 3. 空值處理：null/undefined → []
   */
  const selectedValues = useMemo(() => {
    const defaultValue = editInfo.default;
    
    if (multipleValue) {
      // 多選模式：支援多個選項被選中
      if (Array.isArray(defaultValue)) {
        return defaultValue.filter(Boolean); // 移除 null/undefined/""
      }
      return defaultValue ? [String(defaultValue)] : [];
    } else {
      // 單選模式：最多只能選中一個選項
      if (Array.isArray(defaultValue)) {
        return defaultValue.length > 0 ? [String(defaultValue[0])] : [];
      }
      return defaultValue ? [String(defaultValue)] : [];
    }
  }, [editInfo.default, multipleValue]);

  return (
    <>
      {/* 選項管理欄位 */}
      <OptionsField
        title="options"
        description={organizedFields.options?.description || "Options"}
        multiple={multipleValue}
        options={Array.isArray(editInfo.options) ? editInfo.options : []}
        selectedValues={selectedValues}
        onOptionsChange={handleOptionsChange}
        onSelectionChange={handleSelectionChange}
        highlight={fieldKey === 'options'}
        focusPosition={position}
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