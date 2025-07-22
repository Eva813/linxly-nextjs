/**
 * 驗證 Email 格式的共用工具函數
 * @param email - 要驗證的 email 地址
 * @returns boolean - email 格式是否有效
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // 標準 RFC 5322 Email 正則表達式（簡化版）
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}


