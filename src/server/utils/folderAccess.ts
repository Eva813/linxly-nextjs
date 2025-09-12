import { adminDb } from '@/server/db/firebase';

interface FolderShareDocument {
  id: string;
  folderId: string;
  userId: string;
  shareToken: string;
  shareStatus: 'public' | 'team' | 'none';
  additionalEmails: string[];
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface FolderAccessResult {
  permission: 'owner' | 'edit' | 'view' | null;
  source: 'ownership' | 'space' | 'additional' | 'public' | null;
}

/**
 * 獲取用戶 email
 */
export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) return null;

    const userData = userDoc.data();
    return userData?.email || null;
  } catch (error) {
    console.error('Error getting user email:', error);
    return null;
  }
}

/**
 * 查找現有的分享記錄
 */
export async function findExistingShare(folderId: string, userId: string) {
  const shareQuery = await adminDb
    .collection('folder_shares')
    .where('folderId', '==', folderId)
    .where('userId', '==', userId)
    .limit(1)
    .get();

  return shareQuery.empty ? null : shareQuery.docs[0];
}

/**
 * 快速權限檢查 - 只檢查是否有任何訪問權限
 * 針對 Prompts GET API 優化，使用早期返回策略
 * 預期查詢次數：1-2 次
 */
export async function hasAnyFolderAccess(
  userId: string,
  folderId: string
): Promise<boolean> {
  try {
    // 1. 獲取 folder 資訊 (必須查詢)
    const folderDoc = await adminDb.collection('folders').doc(folderId).get();
    if (!folderDoc.exists) {
      return false;
    }

    const folderData = folderDoc.data();
    const promptSpaceId = folderData?.promptSpaceId;

    // 2. 檢查直接擁有權
    if (folderData?.userId === userId) {
      return true;
    }

    // 3. 檢查 space 擁有權
    if (promptSpaceId) {
      const spaceDoc = await adminDb
        .collection('prompt_spaces')
        .doc(promptSpaceId)
        .get();
      if (spaceDoc.exists && spaceDoc.data()?.userId === userId) {
        return true;
      }
    }

    // 4. 批量查詢剩餘權限：space sharing + folder sharing
    const queries = [];
    if (promptSpaceId) {
      queries.push(
        adminDb
          .collection('space_shares')
          .where('promptSpaceId', '==', promptSpaceId)
          .where('sharedWithUserId', '==', userId)
          .limit(1)
          .get()
      );
    }
    queries.push(
      adminDb
        .collection('folder_shares')
        .where('folderId', '==', folderId)
        .limit(1)
        .get()
    );

    const results = await Promise.all(queries);
    const [spaceShares, folderShares] = promptSpaceId
      ? results
      : [null, results[0]];

    // 5. 檢查 space 權限
    if (promptSpaceId && spaceShares && !spaceShares.empty) {
      return true; // 有任何 space 權限即可
    }

    // 6. 檢查 folder 級別權限
    if (!folderShares.empty) {
      const shareData = folderShares.docs[0].data();

      // Public 權限
      if (shareData.shareStatus === 'public') {
        return true;
      }

      // Team sharing 需要檢查 additional emails
      if (
        shareData.shareStatus === 'team' &&
        shareData.additionalEmails?.length > 0
      ) {
        const userEmail = await getUserEmail(userId);
        if (userEmail && shareData.additionalEmails.includes(userEmail)) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Error in hasAnyFolderAccess:', error);
    return false;
  }
}

/**
 * 寫入權限檢查 - 檢查是否有編輯權限 (owner/edit)
 * 針對 Prompts PUT/DELETE API 優化
 * 預期查詢次數：2-3 次
 */
export async function canEditFolder(
  userId: string,
  folderId: string
): Promise<boolean> {
  try {
    // 1. 獲取 folder 資訊
    const folderDoc = await adminDb.collection('folders').doc(folderId).get();
    if (!folderDoc.exists) {
      return false;
    }

    const folderData = folderDoc.data();
    const promptSpaceId = folderData?.promptSpaceId;

    // 2. 早期返回：檢查直接擁有權
    if (folderData?.userId === userId) {
      return true;
    }

    // 3. 早期返回：檢查 space 擁有權
    if (promptSpaceId) {
      const spaceDoc = await adminDb
        .collection('prompt_spaces')
        .doc(promptSpaceId)
        .get();
      if (spaceDoc.exists && spaceDoc.data()?.userId === userId) {
        return true;
      }
    }

    // 4. 檢查 space 級別的 edit 權限
    if (promptSpaceId) {
      const spaceSharesQuery = await adminDb
        .collection('space_shares')
        .where('promptSpaceId', '==', promptSpaceId)
        .where('sharedWithUserId', '==', userId)
        .where('permission', '==', 'edit') // 只查詢 edit 權限
        .limit(1)
        .get();

      if (!spaceSharesQuery.empty) {
        return true;
      }
    }

    // 注意：folder sharing 中的 additional emails 只提供 view 權限
    // 所以不需要檢查 folder_shares 的 edit 權限

    return false;
  } catch (error) {
    console.error('Error in canEditFolder:', error);
    return false;
  }
}

/**
 * 統一的 folder 訪問權限檢查 (完整版)
 * 整合所有權限檢查邏輯：Owner、Space、Team、Additional、Public
 * 用於需要詳細權限資訊的場景 (如 Shared Folders API)
 */
export async function checkFolderAccess(
  userId: string,
  folderId: string
): Promise<FolderAccessResult> {
  try {
    // 1. 獲取 folder 資訊
    const folderDoc = await adminDb.collection('folders').doc(folderId).get();
    if (!folderDoc.exists) {
      return { permission: null, source: null };
    }

    const folderData = folderDoc.data();
    const promptSpaceId = folderData?.promptSpaceId;

    // 2. 檢查是否為 folder owner (最高權限)
    if (folderData?.userId === userId) {
      return { permission: 'owner', source: 'ownership' };
    }

    // 3. 檢查是否為 folder 所屬 space 的擁有者
    if (promptSpaceId) {
      const spaceDoc = await adminDb
        .collection('prompt_spaces')
        .doc(promptSpaceId)
        .get();
      if (spaceDoc.exists && spaceDoc.data()?.userId === userId) {
        return { permission: 'owner', source: 'ownership' };
      }
    }

    // 4. 獲取 folder sharing 設定
    const folderShare = await findExistingShare(folderId, folderData?.userId);
    if (!folderShare) {
      // 如果沒有分享設定，檢查是否有直接的 Space 級別權限
      if (promptSpaceId) {
        const spaceSharesQuery = await adminDb
          .collection('space_shares')
          .where('promptSpaceId', '==', promptSpaceId)
          .where('sharedWithUserId', '==', userId)
          .get();

        if (!spaceSharesQuery.empty) {
          const shareData = spaceSharesQuery.docs[0].data();
          const permission = shareData?.permission === 'edit' ? 'edit' : 'view';
          return { permission, source: 'space' };
        }
      }
      return { permission: null, source: null };
    }

    const shareData = folderShare.data() as FolderShareDocument;

    // 5. 檢查 public sharing
    if (shareData.shareStatus === 'public') {
      return { permission: 'view', source: 'public' };
    }

    // 6. 檢查 team sharing (階層式權限核心)
    if (shareData.shareStatus === 'team') {
      if (promptSpaceId) {
        // 6a. 檢查 Space 權限繼承
        const spaceShareQuery = await adminDb
          .collection('space_shares')
          .where('promptSpaceId', '==', promptSpaceId)
          .where('sharedWithUserId', '==', userId)
          .where('isUniversal', '!=', true)
          .limit(1)
          .get();

        if (!spaceShareQuery.empty) {
          const spaceShareData = spaceShareQuery.docs[0].data();
          // Space 權限完全繼承：view -> view, edit -> edit
          return {
            permission: spaceShareData.permission as 'view' | 'edit',
            source: 'space',
          };
        }
      }

      // 6b. 檢查額外邀請 (固定 view 權限)
      const userEmail = await getUserEmail(userId);
      if (userEmail && shareData.additionalEmails?.includes(userEmail)) {
        return { permission: 'view', source: 'additional' };
      }
    }

    // 7. 檢查 Folder 級別的 additional emails (fallback)
    const folderSharesQuery = await adminDb
      .collection('folder_shares')
      .where('folderId', '==', folderId)
      .get();

    if (!folderSharesQuery.empty) {
      const shareDoc = folderSharesQuery.docs[0];
      const shareData = shareDoc.data();
      const additionalEmails = shareData?.additionalEmails || [];

      // 獲取用戶 email
      const userEmail = await getUserEmail(userId);

      if (userEmail && additionalEmails.includes(userEmail)) {
        return { permission: 'view', source: 'additional' };
      }

      // 檢查 public 分享
      if (shareData?.shareStatus === 'public') {
        return { permission: 'view', source: 'public' };
      }
    }

    // 8. 無權限
    return { permission: null, source: null };
  } catch (error) {
    console.error('Error checking folder access:', error);
    return { permission: null, source: null };
  }
}

/**
 * 驗證 folder 擁有權
 */
export async function validateFolderOwnership(
  folderId: string,
  userId: string
): Promise<boolean> {
  try {
    const folderDoc = await adminDb.collection('folders').doc(folderId).get();
    if (!folderDoc.exists) return false;

    return folderDoc.data()?.userId === userId;
  } catch (error) {
    console.error('Error validating folder ownership:', error);
    return false;
  }
}
