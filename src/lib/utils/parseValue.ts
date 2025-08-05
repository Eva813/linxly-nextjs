/**
 * 統一處理表單屬性值的解析工具
 */

/**
 * 解析 boolean 值，正確處理字串 'true'/'false' 和實際 boolean 值
 * @param value - 待解析的值
 * @returns 解析後的 boolean 值
 */
export function parseBooleanValue(value: unknown): boolean {
  return value === 'true' || (typeof value === 'boolean' && value);
}

/**
 * 確保返回字串值
 * @param value - 待解析的值
 * @returns 字串值
 */
export function parseStringValue(value: unknown): string {
  return String(value || '');
}

/**
 * 確保返回字串陣列
 * @param value - 待解析的值
 * @returns 字串陣列
 */
export function parseStringArrayValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(item => String(item));
  }
  return [];
}