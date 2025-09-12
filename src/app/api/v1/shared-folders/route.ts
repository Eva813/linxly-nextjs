import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/server/db/firebase';
import { getUserEmail } from '@/server/utils/folderAccess';

interface SharedFolderItem {
  id: string;
  name: string;
  description?: string;
  promptSpaceId: string;
  spaceName: string;
  ownerEmail?: string;
  permission: 'view' | 'edit';
  source: 'space' | 'additional' | 'public';
  sharedAt: string;
  totalPrompts: number;
}

// 獲取用戶有權限的所有 shared folders
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User ID is required' },
        { status: 401 }
      );
    }

    const userEmail = await getUserEmail(userId);
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 404 }
      );
    }

    // 1. 查詢所有可能的 shared folders
    // 1a. 通過 Space 分享的 folders
    const spaceSharesQuery = await adminDb
      .collection('space_shares')
      .where('sharedWithUserId', '==', userId)
      .where('isUniversal', '!=', true)
      .get();

    const spaceIds = spaceSharesQuery.docs.map(
      (doc) => doc.data().promptSpaceId
    );
    const spacePermissions = new Map<string, string>();

    spaceSharesQuery.docs.forEach((doc) => {
      const data = doc.data();
      spacePermissions.set(data.promptSpaceId, data.permission);
    });

    // 1b. 通過 Additional emails 分享的 folders
    const folderSharesQuery = await adminDb
      .collection('folder_shares')
      .where('shareStatus', '==', 'team')
      .where('additionalEmails', 'array-contains', userEmail)
      .get();

    const additionalFolderIds = folderSharesQuery.docs.map(
      (doc) => doc.data().folderId
    );

    // 2. 獲取所有相關的 folders 和 spaces 資訊
    const sharedFolders: SharedFolderItem[] = [];

    // 2a. 處理 Space 分享的 folders
    if (spaceIds.length > 0) {
      for (const spaceId of spaceIds) {
        const [spaceDoc, foldersInSpace] = await Promise.all([
          adminDb.collection('prompt_spaces').doc(spaceId).get(),
          adminDb
            .collection('folders')
            .where('promptSpaceId', '==', spaceId)
            .get(),
        ]);

        if (spaceDoc.exists) {
          const spaceData = spaceDoc.data();
          const permission = spacePermissions.get(spaceId) as 'view' | 'edit';

          for (const folderDoc of foldersInSpace.docs) {
            const folderData = folderDoc.data();

            // 計算 folder 內的 prompt 數量
            const promptsCount = await adminDb
              .collection('prompts')
              .where('folderId', '==', folderDoc.id)
              .select()
              .get();

            sharedFolders.push({
              id: folderDoc.id,
              name: folderData.name,
              description: folderData.description,
              promptSpaceId: spaceId,
              spaceName: spaceData?.name || 'Unknown Space',
              permission,
              source: 'space',
              sharedAt:
                folderData.createdAt?.toDate?.()?.toISOString() ||
                new Date().toISOString(),
              totalPrompts: promptsCount.size,
            });
          }
        }
      }
    }

    // 2b. 處理 Additional emails 分享的 folders
    if (additionalFolderIds.length > 0) {
      for (const folderId of additionalFolderIds) {
        const folderDoc = await adminDb
          .collection('folders')
          .doc(folderId)
          .get();

        if (folderDoc.exists) {
          const folderData = folderDoc.data();

          // 獲取 Space 資訊
          let spaceName = 'Unknown Space';
          if (folderData?.promptSpaceId) {
            const spaceDoc = await adminDb
              .collection('prompt_spaces')
              .doc(folderData.promptSpaceId)
              .get();
            if (spaceDoc.exists) {
              spaceName = spaceDoc.data()?.name || 'Unknown Space';
            }
          }

          // 計算 folder 內的 prompt 數量
          const promptsCount = await adminDb
            .collection('prompts')
            .where('folderId', '==', folderId)
            .select()
            .get();

          // 獲取分享時間
          const shareDoc = folderSharesQuery.docs.find(
            (doc) => doc.data().folderId === folderId
          );
          const sharedAt =
            shareDoc?.data()?.createdAt?.toDate?.()?.toISOString() ||
            new Date().toISOString();

          sharedFolders.push({
            id: folderId,
            name: folderData?.name || 'Unknown Folder',
            description: folderData?.description,
            promptSpaceId: folderData?.promptSpaceId,
            spaceName,
            permission: 'view', // Additional emails 固定為 view 權限
            source: 'additional',
            sharedAt,
            totalPrompts: promptsCount.size,
          });
        }
      }
    }

    // 3. 去重複（同一個 folder 可能同時通過 Space 和 Additional 方式分享）
    const uniqueFolders = new Map<string, SharedFolderItem>();

    sharedFolders.forEach((folder) => {
      const existing = uniqueFolders.get(folder.id);
      if (
        !existing ||
        (folder.source === 'space' && existing.source === 'additional')
      ) {
        // 優先保留 Space 權限（通常權限更高）
        uniqueFolders.set(folder.id, folder);
      }
    });

    const finalFolders = Array.from(uniqueFolders.values()).sort(
      (a, b) => new Date(b.sharedAt).getTime() - new Date(a.sharedAt).getTime()
    );

    console.log(
      `API: Found ${finalFolders.length} shared folders for user ${userId}`
    );

    return NextResponse.json({
      folders: finalFolders,
      total: finalFolders.length,
    });
  } catch (error) {
    console.error('Error getting shared folders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
