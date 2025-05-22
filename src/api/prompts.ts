import request from './client';
import { Prompt } from '@/types/prompt';


// 取得特定資料夾的prompt片段
export function getPrompts(folderId: string): Promise<Prompt[]> {
  return request<Prompt[]>(`/prompts?folderId=${folderId}`);
}

// 建立新的prompt片段
export function createPrompt(
  data: { folderId: string } & Omit<Prompt, 'id'>
): Promise<Prompt> {
  return request<Prompt>('/prompts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// 更新prompt片段
export function updatePrompt(
  promptId: string, 
  data: Partial<Omit<Prompt, 'id'>>
): Promise<Prompt> {
  return request<Prompt>(`/prompts/${promptId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// 刪除prompt片段
export function deletePrompt(promptId: string): Promise<void> {
  return request<void>(`/prompts/${promptId}`, {
    method: 'DELETE',
  });
}