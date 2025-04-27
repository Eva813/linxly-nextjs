// src/api/folders.ts
import request from './client';
import { Folder } from '@/types/snippets';

export function getFolders(): Promise<Folder[]> {
  return request<Folder[]>('/folders', {
    cache: 'no-store',
  });
}

export function getFolder(folderId: string): Promise<Folder> {
  return request<Folder>(`/folders/${folderId}`, { cache: 'no-store' });
}

export function createFolder(payload: {
  name: string;
  description?: string;
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
