import request from './client';
import { Prompt } from '@/types/prompt';


// 取得特定資料夾的prompt片段
export function getPrompts(folderId: string): Promise<Prompt[]> {
  return request<Prompt[]>(`/prompts?folderId=${folderId}`);
}

// 建立新的prompt片段
/**
 * 建立新的 prompt 片段，支援插入位置 afterPromptId
 */
export function createPrompt(
  data: { folderId: string; afterPromptId?: string } & Omit<Prompt, 'id'>
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