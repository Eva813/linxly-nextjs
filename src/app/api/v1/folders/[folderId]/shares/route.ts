import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/server/db/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';

interface FolderShareDocument {
  id: string;
  folderId: string;
  userId: string;
  shareToken: string;
  shareStatus: 'public' | 'team' | 'none';
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
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
}

// 驗證 folder 擁有權
async function validateFolderOwnership(folderId: string, userId: string): Promise<boolean> {
  try {
    const folderDoc = await adminDb.collection('folders').doc(folderId).get();
    if (!folderDoc.exists) return false;
    
    return folderDoc.data()?.userId === userId;
  } catch (error) {
    console.error('Error validating folder ownership:', error);
    return false;
  }
}

// 查找現有的分享記錄
async function findExistingShare(folderId: string, userId: string) {
  const shareQuery = await adminDb
    .collection('folder_shares')
    .where('folderId', '==', folderId)
    .where('userId', '==', userId)
    .limit(1)
    .get();
    
  return shareQuery.empty ? null : shareQuery.docs[0];
}

// GET - 獲取分享狀態
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
        shareToken: null
      });
    }

    const shareData = existingShare.data() as FolderShareDocument;
    
    return NextResponse.json({
      shareStatus: shareData.shareStatus,
      shareToken: shareData.shareToken
    });

  } catch (error) {
    console.error('Error getting share status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - 創建/更新分享設定
export async function POST(
  request: NextRequest,
  { params }: { params: { folderId: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const { folderId } = params;
    const body = await request.json();
    const { shareStatus } = body;

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
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });

      message = shareStatus === 'none' 
        ? 'Sharing disabled' 
        : `Folder sharing set to ${shareStatus}`;
    } else {
      // 更新現有記錄
      const existingData = existingShare.data() as FolderShareDocument;
      shareToken = existingData.shareToken;

      await existingShare.ref.update({
        shareStatus,
        updatedAt: FieldValue.serverTimestamp()
      });

      message = shareStatus === 'none' 
        ? 'Sharing disabled' 
        : `Folder sharing updated to ${shareStatus}`;
    }

    return NextResponse.json({
      shareToken: shareStatus !== 'none' ? shareToken : undefined,
      shareStatus,
      message
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
        updatedAt: FieldValue.serverTimestamp()
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