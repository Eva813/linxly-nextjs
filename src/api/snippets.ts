import request from './client';
import { Snippet } from '@/types/snippets';


// 取得特定資料夾的程式碼片段
export function getSnippets(folderId: string): Promise<Snippet[]> {
  return request<Snippet[]>(`/snippets?folderId=${folderId}`);
}

// 建立新的程式碼片段
export function createSnippet(
  data: { folderId: string } & Omit<Snippet, 'id'>
): Promise<Snippet> {
  return request<Snippet>('/snippets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// 更新程式碼片段
export function updateSnippet(
  snippetId: string, 
  data: Partial<Omit<Snippet, 'id'>>
): Promise<Snippet> {
  return request<Snippet>(`/snippets/${snippetId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// 刪除程式碼片段
export function deleteSnippet(snippetId: string): Promise<void> {
  return request<void>(`/snippets/${snippetId}`, {
    method: 'DELETE',
  });
}