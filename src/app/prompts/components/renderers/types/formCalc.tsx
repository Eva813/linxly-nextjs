import React from "react";

interface FormCalcOptions {
  name: string;
  defaultValue?: string;
  key: string;
  isControlled?: boolean;
  values?: Record<string, string | string[]>;
  setValues?: (updater: (prev: Record<string, string | string[]>) => Record<string, string | string[]>) => void;
}

/**
 * FormCalc 是一個計算/引用欄位，用於顯示其他表單欄位的當前值
 * 主要用途：
 * 1. 在預覽模式中，動態顯示被引用欄位的值
 * 2. 支援引用 formtext（文字輸入）和 formmenu（選單/多選）欄位
 * 3. 會隨著被引用欄位的值變化而更新顯示
 */

export function renderFormCalc({ 
  name,
  defaultValue,
  key, 
  isControlled = false, 
  values
}: FormCalcOptions) {

  if (isControlled && values) {
    // name 是要引用的欄位名稱，從 values 中取得該欄位的當前值
    const referencedValue = values[name];
    
    let displayVal: string;
    
    if (referencedValue !== undefined && referencedValue !== null) {
      // 如果找到引用的欄位值
      if (Array.isArray(referencedValue)) {
        displayVal = referencedValue.length >= 2
          ? referencedValue.join(", ")
          : referencedValue[0] || '';
      } else {
        displayVal = String(referencedValue);
      }
    } else {
      // 如果沒有找到引用的欄位值，顯示預設值或欄位名稱
      displayVal = defaultValue || `[${name}]`;
    }
    
    return (
      <span 
        key={key} 
        className='bg-light px-2 py-1 text-sm rounded inline-block text-blue-800'
        title={`Referenced field: ${name}`}
      >
        {displayVal}
      </span>
    );
  }

  return (
    <span 
      key={key} 
      className='bg-ligh px-2 py-1  text-sm inline-block text-gray-600'
      title={`Calculation field: ${name}`}
    >
      {defaultValue || `[${name}]`}
    </span>
  );
}

// 保持向後相容性的輔助函式
export function createControlledFormCalc(
  name: string,
  defaultValue: string | undefined,
  key: string,
  values: Record<string, string | string[]>,
  setValues: (updater: (prev: Record<string, string | string[]>) => Record<string, string | string[]>) => void
) {
  return renderFormCalc({ name, defaultValue, key, isControlled: true, values, setValues });
}
