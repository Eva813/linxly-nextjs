// src/api/folders.ts
import request from './client';
import { Folder } from '@/types/prompt';

export function getFolders(promptSpaceId?: string): Promise<Folder[]> {
  const params = promptSpaceId ? `?promptSpaceId=${promptSpaceId}` : '';
  return request<Folder[]>(`/folders${params}`, {
    cache: 'no-store',
  });
}

export function getFolder(folderId: string): Promise<Folder> {
  return request<Folder>(`/folders/${folderId}`, { cache: 'no-store' });
}

export function createFolder(payload: {
  name: string;
  description?: string;
  promptSpaceId?: string;
}): Promise<Folder> {
  return request<Folder>('/folders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateFolder(folderId: string, payload: Partial<Folder>): Promise<Folder> {
  return request<Folder>(`/folders/${folderId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteFolder(folderId: string): Promise<void> {
  return request<void>(`/folders/${folderId}`, {
    method: 'DELETE',
  });
}
