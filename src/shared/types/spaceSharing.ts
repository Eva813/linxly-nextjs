/**
 * Space Sharing 類型定義
 * 用於前端和後端的空間分享資料結構
 */

export interface ShareItem {
  email: string;
  permission: 'view' | 'edit';
}

export interface ShareRecord {
  id: string;
  email: string;
  userId?: string;
  permission: 'view' | 'edit';
  createdAt: string;
  updatedAt: string;
}

export interface CreateSharesResponse {
  success: {
    email: string;
    shareId: string;
    inviteLink: string;
  }[];
  failed: {
    email: string;
    reason: string;
  }[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export interface GetSharesResponse {
  shares: ShareRecord[];
  total: number;
}

export interface UpdateSharesResponse {
  updated: string[];
  failed: {
    email: string;
    reason: string;
  }[];
}

export interface DeleteSharesResponse {
  deleted: string[];
  failed: {
    email: string;
    reason: string;
  }[];
}

export interface InviteInfo {
  spaceId: string;
  spaceName: string;
  ownerName: string;
  permission: 'view' | 'edit';
  needsRegistration: boolean;
  isValid: boolean;
  isUniversal: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface AcceptInviteResponse {
  success: boolean;
  spaceId: string;
  permission: 'view' | 'edit';
  redirectUrl: string;
}

export interface CreateInviteLinkResponse {
  inviteLink: string;
  shareId: string;
  permission: 'view' | 'edit';
  expiresAt: string;
}

export interface GetInviteLinksResponse {
  inviteLinks: {
    view?: { link: string; shareId: string; expiresAt: string };
    edit?: { link: string; shareId: string; expiresAt: string };
  };
  success: boolean;
}

/**
 * 批次處理選項
 */
export interface BatchProcessingOptions {
  batchSize?: number;
  rateLimit?: number; // 批次間的延遲時間（毫秒）
  onProgress?: (completed: number, total: number) => void;
}

/**
 * 空間權限類型
 */
export type SpacePermission = 'view' | 'edit' | 'owner';

/**
 * 分享狀態
 */
export type ShareStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

/**
 * 擴展的分享記錄（包含狀態資訊）
 */
export interface ExtendedShareRecord extends ShareRecord {
  status: ShareStatus;
  inviteLink?: string;
  expiresAt?: string;
  acceptedAt?: string;
}
