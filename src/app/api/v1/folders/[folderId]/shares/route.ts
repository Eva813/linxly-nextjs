import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/server/db/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';
import {
  findExistingShare,
  validateFolderOwnership,
} from '@/server/utils/folderAccess';

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

// 生成 ShareToken
function generateShareToken(): string {
  try {
    return randomUUID();
  } catch {
    // Fallback for older Node.js versions
    console.warn('crypto.randomUUID() not available, using fallback');
    return (
      Date.now().toString(36) + Math.random().toString(36).substring(2, 11)
    );
  }
}

// 獲取 Space 成員資訊
async function getSpaceMembers(
  spaceId: string
): Promise<{ count: number; spaceName: string }> {
  try {
    // 獲取 Space 資訊
    const spaceDoc = await adminDb
      .collection('prompt_spaces')
      .doc(spaceId)
      .get();
    if (!spaceDoc.exists) {
      return { count: 0, spaceName: 'Unknown Space' };
    }

    const spaceData = spaceDoc.data();
    const spaceName = spaceData?.name || 'Unnamed Space';

    // 先獲取所有該 space 的分享記錄，然後在程式碼中過濾
    // 因為 Firestore 的 != 查詢會排除 undefined 值
    const allSharesQuery = await adminDb
      .collection('space_shares')
      .where('promptSpaceId', '==', spaceId)
      .get();

    // 在程式碼中過濾掉 universal 分享 (isUniversal === true)
    // 保留 isUniversal === false 和 isUniversal === undefined 的記錄
    const nonUniversalShares = allSharesQuery.docs.filter((doc) => {
      const data = doc.data();
      return data.isUniversal !== true;
    });

    return {
      count: nonUniversalShares.length,
      spaceName,
    };
  } catch (error) {
    console.error('Error getting space members:', error);
    return { count: 0, spaceName: 'Unknown Space' };
  }
}

// 計算總成員數 (Space members + additional emails)
async function calculateTotalMembers(
  folderId: string,
  shareStatus: string,
  additionalEmails: string[] = []
): Promise<number> {
  try {
    // 如果不是 team sharing，只計算 additional emails
    if (shareStatus !== 'team') {
      return additionalEmails.length;
    }

    // 獲取 folder 資訊以取得 promptSpaceId
    const folderDoc = await adminDb.collection('folders').doc(folderId).get();
    if (!folderDoc.exists) {
      return additionalEmails.length;
    }

    const folderData = folderDoc.data();
    const promptSpaceId = folderData?.promptSpaceId;

    if (!promptSpaceId) {
      return additionalEmails.length;
    }

    // 獲取 Space 成員數量
    const spaceMembers = await getSpaceMembers(promptSpaceId);

    // 總數 = Space 成員 + 額外邀請 (去重複)
    return spaceMembers.count + additionalEmails.length;
  } catch (error) {
    console.error('Error calculating total members:', error);
    return additionalEmails.length;
  }
}

// GET - 獲取分享狀態（階層式權限管理）
export async function GET(
  request: NextRequest,
  { params }: { params: { folderId: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const { folderId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User ID is required' },
        { status: 401 }
      );
    }

    // 驗證 folder 擁有權
    const canManage = await validateFolderOwnership(folderId, userId);
    if (!canManage) {
      return NextResponse.json(
        { error: 'Forbidden: You can only manage shares for your own folders' },
        { status: 403 }
      );
    }

    // 查找現有分享記錄
    const existingShare = await findExistingShare(folderId, userId);

    if (!existingShare) {
      // 如果沒有記錄，返回默認狀態
      return NextResponse.json({
        shareStatus: 'none',
        shareToken: null,
        additionalEmails: [],
        spaceMembers: null,
        totalMembers: 0,
      });
    }

    const shareData = existingShare.data() as FolderShareDocument;

    // 獲取階層式權限資訊
    let spaceMembers = null;
    let totalMembers = 0;

    if (shareData.shareStatus === 'team') {
      // 獲取 folder 所屬的 promptSpaceId
      const folderDoc = await adminDb.collection('folders').doc(folderId).get();

      if (folderDoc.exists) {
        const folderData = folderDoc.data();
        const promptSpaceId = folderData?.promptSpaceId;

        if (promptSpaceId) {
          spaceMembers = await getSpaceMembers(promptSpaceId);
        }
      }

      totalMembers = await calculateTotalMembers(
        folderId,
        shareData.shareStatus,
        shareData.additionalEmails || []
      );
    }

    const response = {
      shareStatus: shareData.shareStatus,
      shareToken: shareData.shareToken,
      additionalEmails: shareData.additionalEmails || [],
      spaceMembers,
      totalMembers,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting share status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - 創建/更新分享設定 (階層式權限管理)
export async function POST(
  request: NextRequest,
  { params }: { params: { folderId: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const { folderId } = params;
    const body = await request.json();
    const { shareStatus, additionalEmails = [] } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User ID is required' },
        { status: 401 }
      );
    }

    if (!['public', 'team', 'none'].includes(shareStatus)) {
      return NextResponse.json(
        { error: 'Invalid share status. Must be public, team, or none' },
        { status: 400 }
      );
    }

    // 驗證 additionalEmails 格式
    const isValidEmailFormat = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    if (
      additionalEmails.length > 0 &&
      !additionalEmails.every(isValidEmailFormat)
    ) {
      return NextResponse.json(
        { error: 'Invalid email format in additionalEmails' },
        { status: 400 }
      );
    }

    // 驗證 folder 擁有權
    const canManage = await validateFolderOwnership(folderId, userId);
    if (!canManage) {
      return NextResponse.json(
        { error: 'Forbidden: You can only manage shares for your own folders' },
        { status: 403 }
      );
    }

    // 查找現有分享記錄
    const existingShare = await findExistingShare(folderId, userId);

    let shareToken: string;
    let message: string;

    if (!existingShare) {
      // 首次創建分享記錄
      shareToken = generateShareToken();

      await adminDb.collection('folder_shares').add({
        folderId,
        userId,
        shareToken,
        shareStatus,
        additionalEmails,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      message =
        shareStatus === 'none'
          ? 'Sharing disabled'
          : `Folder sharing set to ${shareStatus}`;
    } else {
      // 更新現有記錄
      const existingData = existingShare.data() as FolderShareDocument;
      shareToken = existingData.shareToken;

      await existingShare.ref.update({
        shareStatus,
        additionalEmails,
        updatedAt: FieldValue.serverTimestamp(),
      });

      message =
        shareStatus === 'none'
          ? 'Sharing disabled'
          : `Folder sharing updated to ${shareStatus}`;
    }

    // 計算總成員數（階層式）
    const totalMembers = await calculateTotalMembers(
      folderId,
      shareStatus,
      additionalEmails
    );

    return NextResponse.json({
      shareToken: shareStatus !== 'none' ? shareToken : undefined,
      shareStatus,
      totalMembers,
      message,
    });
  } catch (error) {
    console.error('Error updating share settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - 停用分享
export async function DELETE(
  request: NextRequest,
  { params }: { params: { folderId: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const { folderId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User ID is required' },
        { status: 401 }
      );
    }

    // 驗證 folder 擁有權
    const canManage = await validateFolderOwnership(folderId, userId);
    if (!canManage) {
      return NextResponse.json(
        { error: 'Forbidden: You can only manage shares for your own folders' },
        { status: 403 }
      );
    }

    // 查找並更新現有分享記錄
    const existingShare = await findExistingShare(folderId, userId);

    if (existingShare) {
      await existingShare.ref.update({
        shareStatus: 'none',
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting share:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
