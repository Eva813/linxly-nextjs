import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/server/db/firebase';

export async function GET(
  request: NextRequest,
  { params }: { params: { spaceId: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { spaceId } = params;

    // 1. 取得 prompt space 資訊
    const spaceDoc = await adminDb.collection('prompt_spaces').doc(spaceId).get();
    if (!spaceDoc.exists) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    const spaceData = spaceDoc.data()!;
    
    // 2. 檢查用戶權限
    let userRole: 'owner' | 'edit' | 'view' | null = null;
    
    if (spaceData.userId === userId) {
      userRole = 'owner';
    } else {
      // 檢查是否有分享權限
      const sharesSnapshot = await adminDb
        .collection('space_shares')
        .where('promptSpaceId', '==', spaceId)
        .where('sharedWithUserId', '==', userId)
        .get();
      
      if (!sharesSnapshot.empty) {
        const shareData = sharesSnapshot.docs[0].data();
        userRole = shareData.permission as 'edit' | 'view';
      }
    }

    if (!userRole) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // 3. 計算權限
    const permissions = {
      canEdit: userRole === 'owner' || userRole === 'edit',
      canDelete: userRole === 'owner' || userRole === 'edit',
      canShare: userRole === 'owner',
      canManageMembers: userRole === 'owner'
    };

    // 4. 取得 folders 概要（不載入 prompts）
    const foldersSnapshot = await adminDb
      .collection('folders')
      .where('promptSpaceId', '==', spaceId)
      .get();
    // 注意：暫時移除 orderBy 以避免需要 Firebase 索引

    const foldersWithCounts = await Promise.all(
      foldersSnapshot.docs.map(async (folderDoc) => {
        const folderData = folderDoc.data();
        
        // 取得每個 folder 的 prompt 數量
        const promptsSnapshot = await adminDb
          .collection('prompts')
          .where('folderId', '==', folderDoc.id)
          .get();
        
        const lastUpdated = folderData.updatedAt || folderData.createdAt;
        
        return {
          id: folderDoc.id,
          name: folderData.name,
          description: folderData.description,
          promptCount: promptsSnapshot.docs.length,
          lastUpdated: lastUpdated?.toDate ? lastUpdated.toDate().toISOString() : new Date().toISOString(),
          readOnly: !permissions.canEdit // 基於權限設定 readOnly
        };
      })
    );

    // 5. 組合回應
    const response = {
      space: {
        id: spaceId,
        name: spaceData.name,
        userRole,
        permissions,
        createdAt: spaceData.createdAt,
        updatedAt: spaceData.updatedAt
      },
      folders: foldersWithCounts,
      stats: {
        totalFolders: foldersWithCounts.length,
        totalPrompts: foldersWithCounts.reduce((sum, folder) => sum + folder.promptCount, 0)
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching prompt space overview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}