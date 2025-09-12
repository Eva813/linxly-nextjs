// src/api/folderShares.ts
import request from './client';
import { ShareStatus, SpaceMembers } from '@/hooks/folder/useFolderSharing';

/**
 * API response types for folder sharing
 */
export interface FolderShareResponse {
  shareStatus: ShareStatus;
  shareToken?: string;
  additionalEmails?: string[];
  spaceMembers?: SpaceMembers;
  totalMembers?: number;
}

/**
 * Load current folder sharing status
 */
export function getFolderShareStatus(
  folderId: string
): Promise<FolderShareResponse> {
  return request<FolderShareResponse>(`/folders/${folderId}/shares`, {
    method: 'GET',
  });
}

/**
 * Update folder sharing settings
 */
export function updateFolderSharing(
  folderId: string,
  shareStatus: ShareStatus,
  additionalEmails: string[] = []
): Promise<FolderShareResponse> {
  return request<FolderShareResponse>(`/folders/${folderId}/shares`, {
    method: 'POST',
    body: JSON.stringify({
      shareStatus,
      additionalEmails,
    }),
  });
}
