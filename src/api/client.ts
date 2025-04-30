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
  const token = localStorage.getItem('token');
  
  // 確保 options.headers 存在，並使用正確的合併方式
  const requestOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  };
  
  const res = await fetch(`${BASE_URL}${path}`, requestOptions);
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
