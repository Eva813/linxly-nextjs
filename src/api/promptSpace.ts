import request from './client';
import { 
  PromptSpaceApiResponse, 
  PromptSpaceListResponse, 
  CreatePromptSpaceRequest,
  UpdatePromptSpaceRequest 
} from '@/shared/types/promptSpace';

/**
 * 取得所有 Prompt Spaces（包含擁有的和分享的）
 */
export function getAllPromptSpaces(): Promise<PromptSpaceListResponse> {
  return request<PromptSpaceListResponse>('/prompt-spaces');
}

/**
 * 建立新的 Prompt Space
 */
export function createPromptSpace(data: CreatePromptSpaceRequest): Promise<PromptSpaceApiResponse> {
  return request<PromptSpaceApiResponse>('/prompt-spaces', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * 更新 Prompt Space
 */
export function updatePromptSpace(spaceId: string, data: UpdatePromptSpaceRequest): Promise<PromptSpaceApiResponse> {
  return request<PromptSpaceApiResponse>(`/prompt-spaces/${spaceId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

/**
 * 刪除 Prompt Space
 */
export function deletePromptSpace(spaceId: string): Promise<void> {
  return request<void>(`/prompt-spaces/${spaceId}`, {
    method: 'DELETE'
  });
}

/**
 * 設置默認 Prompt Space
 */
export function setDefaultSpace(spaceId: string): Promise<PromptSpaceApiResponse> {
  return request<PromptSpaceApiResponse>(`/prompt-spaces/${spaceId}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'setDefault' })
  });
}
