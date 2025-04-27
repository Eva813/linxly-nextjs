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
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  // 嘗試 parse 錯誤訊息
  if (!res.ok) {
    let err: APIError | null = null;
    try { err = await res.json(); } catch { /* ignore */ }
    const message = err?.message || res.statusText;
    throw new Error(message);
  }

  // DELETE 204 會沒有 body
  if (res.status === 204) {
    return undefined as unknown as T;
  }
  return res.json();
}

export default request;
