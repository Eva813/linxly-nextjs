import { getSession } from "next-auth/react";
const BASE_URL = '/api/v1';

interface APIError {
  message: string;
  error?: string;
  statusCode?: number;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // const token = localStorage.getItem('token');
  const session = await getSession();
  const token = session?.user?.token;
  const userId = session?.user?.id; // 取得使用者 ID
  
  // 確保 options.headers 存在，並使用正確的合併方式
  const requestOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(userId    ? { 'x-user-id': userId } : {}),
      ...(options.headers || {})
    }
  };
  
  const res = await fetch(`${BASE_URL}${path}`, requestOptions);
  // 嘗試 parse 錯誤訊息
  if (!res.ok) {
    let errPayload: APIError | null = null;
    try { errPayload = await res.json(); } catch { /* ignore */ }
    const msg = errPayload?.message || res.statusText;
    const errorWithStatus = new Error(msg) as Error & { status: number };
    errorWithStatus.status = res.status;
    throw errorWithStatus;
  }

  // DELETE 204 會沒有 body
  if (res.status === 204) {
    return undefined as unknown as T;
  }
  return res.json();
}

export default request;
