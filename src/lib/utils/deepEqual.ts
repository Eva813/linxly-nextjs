/**
 * 深層比較兩個值是否相等
 * 支援原始型別、陣列、物件的深層比較
 * @param obj1 第一個值
 * @param obj2 第二個值
 * @returns 是否相等
 */
export const deepEqual = (obj1: unknown, obj2: unknown): boolean => {
  // 相同參照或相同原始值
  if (obj1 === obj2) return true;
  
  // null 或 undefined 處理
  if (obj1 == null || obj2 == null) return obj1 === obj2;
  
  // 型別不同
  if (typeof obj1 !== typeof obj2) return false;
  
  // 原始型別處理
  if (typeof obj1 !== 'object') return obj1 === obj2;
  
  // 陣列檢查
  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
  
  // 陣列比較
  if (Array.isArray(obj1)) {
    if (obj1.length !== (obj2 as unknown[]).length) return false;
    for (let i = 0; i < obj1.length; i++) {
      if (!deepEqual(obj1[i], (obj2 as unknown[])[i])) return false;
    }
    return true;
  }
  
  // 物件比較
  const keys1 = Object.keys(obj1 as Record<string, unknown>);
  const keys2 = Object.keys(obj2 as Record<string, unknown>);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(
      (obj1 as Record<string, unknown>)[key], 
      (obj2 as Record<string, unknown>)[key]
    )) return false;
  }
  
  return true;
};

/**
 * 檢查物件是否有變更（相對於初始值）
 * @param currentValues 當前值
 * @param initialValues 初始值
 * @returns 是否有變更
 */
export const hasChanges = (currentValues: Record<string, unknown>, initialValues: Record<string, unknown>): boolean => {
  return !deepEqual(currentValues, initialValues);
};
