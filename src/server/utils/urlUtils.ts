/**
 * 動態產生應用程式的基礎 URL
 * Vercel 部署最佳化
 */
export function getBaseUrl(req: Request): string {
  // 從請求標頭動態產生 URL - 這是最可靠的方式
  const host = req.headers.get('host');
  if (!host) {
    // 如果無法取得 host，使用環境變數作為最後備用方案
    const fallbackUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
    if (fallbackUrl) {
      // 如果是 VERCEL_URL，需要加上 https://
      return fallbackUrl.startsWith('http') ? fallbackUrl : `https://${fallbackUrl}`;
    }
    throw new Error('無法取得主機資訊且無環境變數備用方案');
  }

  // Vercel 專用協定判斷 - 優先順序：
  // 1. x-forwarded-proto (Vercel 標準標頭)
  // 2. x-forwarded-ssl (備用)
  // 3. 根據主機名稱判斷 (localhost 用 http，其他用 https)
  const forwardedProto = req.headers.get('x-forwarded-proto');
  const forwardedSsl = req.headers.get('x-forwarded-ssl');
  
  let protocol: string;
  if (forwardedProto) {
    protocol = forwardedProto;
  } else if (forwardedSsl === 'on') {
    protocol = 'https';
  } else {
    // Vercel 預設所有非 localhost 都是 HTTPS
    protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  }

  return `${protocol}://${host}`;
}

/**
 * 產生邀請連結
 */
export function generateInviteLink(req: Request, shareId: string): string {
  const baseUrl = getBaseUrl(req);
  return `${baseUrl}/invite/${shareId}`;
}
