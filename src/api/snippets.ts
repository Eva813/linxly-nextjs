// import request from './client';
import { Snippet } from '@/types/snippets';


// export function getSnippets(folderId: string): Promise<Snippet[]> {
//   return request<Snippet[]>(`/snippets?folderId=${folderId}`, {
//     cache: 'no-store',
//   });
// }


// export function createSnippet(payload: {
//   folderId: string;
//   name: string;
//   content?: string;
//   shortcut: string;
// }): Promise<Snippet> {
//   return request<Snippet>('/snippets', {
//     method: 'POST',
//     body: JSON.stringify(payload),
//   });
// }

// 取得特定資料夾的程式碼片段
export async function getSnippets(folderId: string): Promise<Snippet[]> {
  const response = await fetch(`/api/v1/snippets?folderId=${folderId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '取得程式碼片段失敗');
  }
  
  return response.json();
}

// 建立新的程式碼片段
export async function createSnippet(
  data: { folderId: string } & Omit<Snippet, 'id'>
): Promise<Snippet> {
  const response = await fetch('/api/v1/snippets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '建立程式碼片段失敗');
  }
  
  return response.json();
}

// 更新程式碼片段
export async function updateSnippet(
  snippetId: string, 
  data: Partial<Omit<Snippet, 'id'>>
): Promise<Snippet> {
  const response = await fetch(`/api/v1/snippets/${snippetId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '更新程式碼片段失敗');
  }
  
  return response.json();
}

// 刪除程式碼片段
export async function deleteSnippet(snippetId: string): Promise<void> {
  const response = await fetch(`/api/v1/snippets/${snippetId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok && response.status !== 204) {
    const error = await response.json();
    throw new Error(error.message || '刪除程式碼片段失敗');
  }
  
  return;
}