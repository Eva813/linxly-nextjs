// src/api/promptSpaces.ts
import request from './client';
import { PromptSpace } from '@/types/prompt';

export function getPromptSpaces(): Promise<PromptSpace[]> {
  return request<PromptSpace[]>('/prompt-spaces', {
    cache: 'no-store',
  });
}

export function createPromptSpace(payload: {
  name: string;
}): Promise<PromptSpace> {
  return request<PromptSpace>('/prompt-spaces', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updatePromptSpace(promptSpaceId: string, payload: Partial<PromptSpace>): Promise<PromptSpace> {
  return request<PromptSpace>(`/prompt-spaces/${promptSpaceId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deletePromptSpace(promptSpaceId: string): Promise<void> {
  return request<void>(`/prompt-spaces/${promptSpaceId}`, {
    method: 'DELETE',
  });
}
