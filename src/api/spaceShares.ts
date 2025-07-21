// Frontend API functions for space sharing functionality
import {
  ShareItem,
  CreateSharesResponse,
  GetSharesResponse,
  UpdateSharesResponse,
  DeleteSharesResponse,
  InviteInfo,
  AcceptInviteResponse,
  CreateInviteLinkResponse,
  GetInviteLinksResponse
} from '@/shared/types/spaceSharing';

// Base API function with error handling
const apiCall = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API call failed: ${response.statusText}`);
  }

  return response.json();
};

// Space Shares API Functions

/**
 * Get all shares for a space (owner only)
 */
export const getSpaceShares = async (spaceId: string): Promise<GetSharesResponse> => {
  return apiCall<GetSharesResponse>(`/api/v1/prompt-spaces/${spaceId}/shares`);
};

/**
 * Create new shares for a space (batch processing)
 */
export const createSpaceShares = async (
  spaceId: string, 
  shares: ShareItem[]
): Promise<CreateSharesResponse> => {
  return apiCall<CreateSharesResponse>(`/api/v1/prompt-spaces/${spaceId}/shares`, {
    method: 'POST',
    body: JSON.stringify({ shares }),
  });
};

/**
 * Update permissions for existing shares
 */
export const updateSpaceShares = async (
  spaceId: string, 
  shares: ShareItem[]
): Promise<UpdateSharesResponse> => {
  return apiCall<UpdateSharesResponse>(`/api/v1/prompt-spaces/${spaceId}/shares`, {
    method: 'PUT',
    body: JSON.stringify({ shares }),
  });
};

/**
 * Delete shares (batch processing)
 */
export const deleteSpaceShares = async (
  spaceId: string, 
  emails: string[]
): Promise<DeleteSharesResponse> => {
  return apiCall<DeleteSharesResponse>(`/api/v1/prompt-spaces/${spaceId}/shares`, {
    method: 'DELETE',
    body: JSON.stringify({ emails }),
  });
};

// Invitation API Functions

/**
 * Get invitation information
 */
export const getInviteInfo = async (shareId: string): Promise<InviteInfo> => {
  return apiCall<InviteInfo>(`/api/v1/invites/${shareId}`);
};

/**
 * Accept an invitation (after registration)
 */
export const acceptInvite = async (
  shareId: string, 
  userId: string
): Promise<AcceptInviteResponse> => {
  return apiCall<AcceptInviteResponse>(`/api/v1/invites/${shareId}/accept`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
};

/**
 * Get existing invite links for a space (owner only)
 */
export const getInviteLinks = async (
  spaceId: string
): Promise<GetInviteLinksResponse> => {
  const url = `/api/v1/prompt-spaces/${spaceId}/invite-links`;
  return apiCall<GetInviteLinksResponse>(url);
};

/**
 * Create a universal invite link for a space (owner only)
 */
export const createInviteLink = async (
  spaceId: string,
  permission: 'view' | 'edit' = 'view'
): Promise<CreateInviteLinkResponse> => {
  return apiCall<CreateInviteLinkResponse>(`/api/v1/prompt-spaces/${spaceId}/invite`, {
    method: 'POST',
    body: JSON.stringify({ permission }),
  });
};

// Helper Functions

/**
 * Chunk array for batch processing
 */
export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Batch create shares with progress tracking
 */
export const batchCreateShares = async (
  spaceId: string,
  shares: ShareItem[],
  onProgress?: (completed: number, total: number) => void
): Promise<CreateSharesResponse> => {
  const BATCH_SIZE = 50;
  const batches = chunkArray(shares, BATCH_SIZE);
  
  const aggregatedResults: CreateSharesResponse = {
    success: [],
    failed: [],
    summary: { total: shares.length, successful: 0, failed: 0 }
  };

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    
    try {
      const batchResult = await createSpaceShares(spaceId, batch);
      
      // Aggregate results
      aggregatedResults.success.push(...batchResult.success);
      aggregatedResults.failed.push(...batchResult.failed);
      
      // Update progress
      const completed = (i + 1) * BATCH_SIZE;
      onProgress?.(Math.min(completed, shares.length), shares.length);
      
      // Rate limiting
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
    } catch (error) {
      // Handle batch failure
      batch.forEach(share => {
        aggregatedResults.failed.push({
          email: share.email,
          reason: error instanceof Error ? error.message : 'Batch processing failed'
        });
      });
    }
  }

  // Update final summary
  aggregatedResults.summary.successful = aggregatedResults.success.length;
  aggregatedResults.summary.failed = aggregatedResults.failed.length;

  return aggregatedResults;
};

/**
 * Batch update shares with progress tracking
 */
export const batchUpdateShares = async (
  spaceId: string,
  shares: ShareItem[],
  onProgress?: (completed: number, total: number) => void
): Promise<UpdateSharesResponse> => {
  const BATCH_SIZE = 30;
  const batches = chunkArray(shares, BATCH_SIZE);
  
  const aggregatedResults: UpdateSharesResponse = {
    updated: [],
    failed: []
  };

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    
    try {
      const batchResult = await updateSpaceShares(spaceId, batch);
      
      // Aggregate results
      aggregatedResults.updated.push(...batchResult.updated);
      aggregatedResults.failed.push(...batchResult.failed);
      
      // Update progress
      const completed = (i + 1) * BATCH_SIZE;
      onProgress?.(Math.min(completed, shares.length), shares.length);
      
      // Rate limiting
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
    } catch (error) {
      // Handle batch failure
      batch.forEach(share => {
        aggregatedResults.failed.push({
          email: share.email,
          reason: error instanceof Error ? error.message : 'Batch processing failed'
        });
      });
    }
  }

  return aggregatedResults;
};

/**
 * Batch delete shares with progress tracking
 */
export const batchDeleteShares = async (
  spaceId: string,
  emails: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<DeleteSharesResponse> => {
  const BATCH_SIZE = 50;
  const batches = chunkArray(emails, BATCH_SIZE);
  
  const aggregatedResults: DeleteSharesResponse = {
    deleted: [],
    failed: []
  };

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    
    try {
      const batchResult = await deleteSpaceShares(spaceId, batch);
      
      // Aggregate results
      aggregatedResults.deleted.push(...batchResult.deleted);
      aggregatedResults.failed.push(...batchResult.failed);
      
      // Update progress
      const completed = (i + 1) * BATCH_SIZE;
      onProgress?.(Math.min(completed, emails.length), emails.length);
      
      // Rate limiting
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
    } catch (error) {
      // Handle batch failure
      batch.forEach(email => {
        aggregatedResults.failed.push({
          email,
          reason: error instanceof Error ? error.message : 'Batch processing failed'
        });
      });
    }
  }

  return aggregatedResults;
};