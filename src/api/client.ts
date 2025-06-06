
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
  
  // 確保 options.headers 存在
  const requestOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
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
