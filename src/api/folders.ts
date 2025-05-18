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

export function shareFolder(
  folderId: string,
  emails: string[],
  permission: string,
): Promise<void> {
  return request<void>(`/folders/${folderId}/share`, {
    method: 'POST',
    body: JSON.stringify({ emails, permission }),
  });
}


export interface Share {
  email: string;
  permission: string;
}
export function getFolderShares(folderId: string): Promise<Share[]> {
  return request<Share[]>(`/folders/${folderId}/share`, {
    cache: 'no-store',
  });
}

export function deleteShareFolder(
  folderId: string,
  // emails: string[],
  // permission: string,
  shareId: string
): Promise<void> {
  return request<void>(`/folders/${folderId}/share`, {
    method: 'DELETE',
    body: JSON.stringify({ shareId }),
  });
}