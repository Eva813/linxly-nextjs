import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/server/db/firebase';
import { getUserEmail } from '@/server/utils/folderAccess';
import { memoryCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

interface SharedFolderItem {
  id: string;
  name: string;
  description?: string;
  permission: 'view' | 'edit';
  shareType: 'space' | 'additional' | 'public';
  promptCount: number;
  sharedFrom: string;
  shareEmail?: string;
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

    // 檢查記憶體快取
    const cacheKey = `shared-folders:${userId}`;
    const cached = memoryCache.get<{
      folders: SharedFolderItem[];
      total: number;
    }>(cacheKey);
    if (cached) {
      console.log(`Cache hit for shared folders: ${userId}`);
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300',
          'X-Cache': 'HIT',
        },
      });
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
    const spaceOwners = new Map<string, string>(); // spaceId -> ownerUserId

    spaceSharesQuery.docs.forEach((doc) => {
      const data = doc.data();
      spacePermissions.set(data.promptSpaceId, data.permission);
      spaceOwners.set(data.promptSpaceId, data.ownerUserId);
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
    const folderOwners = new Map<string, string>(); // folderId -> ownerUserId

    folderSharesQuery.docs.forEach((doc) => {
      const data = doc.data();
      folderOwners.set(data.folderId, data.userId);
    });

    // 2. 批量獲取所有相關用戶資訊
    const allOwnerIds = new Set<string>();
    spaceOwners.forEach((ownerId) => allOwnerIds.add(ownerId));
    folderOwners.forEach((ownerId) => allOwnerIds.add(ownerId));

    const ownersMap = new Map<
      string,
      { name?: string; displayName?: string; email?: string }
    >();
    if (allOwnerIds.size > 0) {
      const ownerDocs = await Promise.all(
        Array.from(allOwnerIds).map((ownerId) =>
          adminDb.collection('users').doc(ownerId).get()
        )
      );

      Array.from(allOwnerIds).forEach((ownerId, index) => {
        if (ownerDocs[index].exists) {
          const userData = ownerDocs[index].data();
          if (userData) {
            ownersMap.set(ownerId, {
              name: userData.name,
              displayName: userData.displayName,
              email: userData.email,
            });
          }
        }
      });
    }

    // 3. 獲取所有相關的 folders 和 spaces 資訊
    const sharedFolders: SharedFolderItem[] = [];

    // 3a. 處理 Space 分享的 folders
    if (spaceIds.length > 0) {
      // 批量獲取所有 spaces 和相關 folders
      const spaceResults = await Promise.all(
        spaceIds.map(async (spaceId) => {
          const [spaceDoc, foldersInSpace] = await Promise.all([
            adminDb.collection('prompt_spaces').doc(spaceId).get(),
            adminDb
              .collection('folders')
              .where('promptSpaceId', '==', spaceId)
              .get(),
          ]);

          return { spaceId, spaceDoc, foldersInSpace };
        })
      );

      // 收集所有需要查詢 prompt count 的 folder IDs
      const allSpaceFolderIds: string[] = [];
      const folderSpaceMap = new Map<string, string>();

      for (const { spaceId, spaceDoc, foldersInSpace } of spaceResults) {
        if (spaceDoc.exists) {
          for (const folderDoc of foldersInSpace.docs) {
            allSpaceFolderIds.push(folderDoc.id);
            folderSpaceMap.set(folderDoc.id, spaceId);
          }
        }
      }

      // 批量查詢所有 prompt counts
      const promptCounts = await Promise.all(
        allSpaceFolderIds.map((folderId) =>
          adminDb
            .collection('prompts')
            .where('folderId', '==', folderId)
            .count()
            .get()
        )
      );

      const promptCountMap = new Map<string, number>();
      allSpaceFolderIds.forEach((folderId, index) => {
        promptCountMap.set(folderId, promptCounts[index].data().count);
      });

      // 組裝結果
      for (const { spaceId, spaceDoc, foldersInSpace } of spaceResults) {
        if (spaceDoc.exists) {
          const permission = spacePermissions.get(spaceId) as 'view' | 'edit';

          for (const folderDoc of foldersInSpace.docs) {
            const folderData = folderDoc.data();
            const promptCount = promptCountMap.get(folderDoc.id) || 0;

            // 獲取分享者資訊
            const ownerId = spaceOwners.get(spaceId);
            const ownerData = ownerId ? ownersMap.get(ownerId) : null;
            const sharerName =
              ownerData?.name || ownerData?.displayName || 'Unknown User';

            sharedFolders.push({
              id: folderDoc.id,
              name: folderData.name,
              description: folderData.description,
              permission,
              shareType: 'space',
              promptCount,
              sharedFrom: sharerName,
              shareEmail: ownerData?.email,
            });
          }
        }
      }
    }

    // 3b. 處理 Additional emails 分享的 folders
    if (additionalFolderIds.length > 0) {
      // 批量獲取 folder 文件
      const additionalFolderDocs = await Promise.all(
        additionalFolderIds.map((folderId) =>
          adminDb.collection('folders').doc(folderId).get()
        )
      );

      // 批量獲取 prompt counts
      const additionalPromptCounts = await Promise.all(
        additionalFolderIds.map((folderId) =>
          adminDb
            .collection('prompts')
            .where('folderId', '==', folderId)
            .count()
            .get()
        )
      );

      // 組裝結果
      additionalFolderIds.forEach((folderId, index) => {
        const folderDoc = additionalFolderDocs[index];
        const promptCount = additionalPromptCounts[index].data().count;

        if (folderDoc.exists) {
          const folderData = folderDoc.data();

          // 獲取分享者資訊
          const ownerId = folderOwners.get(folderId);
          const ownerData = ownerId ? ownersMap.get(ownerId) : null;
          const sharerName =
            ownerData?.name || ownerData?.displayName || 'Unknown User';

          sharedFolders.push({
            id: folderId,
            name: folderData?.name || 'Unknown Folder',
            description: folderData?.description,
            permission: 'view', // Additional emails 固定為 view 權限
            shareType: 'additional',
            promptCount,
            sharedFrom: sharerName,
            shareEmail: ownerData?.email,
          });
        }
      });
    }

    // 4. 去重複（同一個 folder 可能同時通過 Space 和 Additional 方式分享）
    const uniqueFolders = new Map<string, SharedFolderItem>();

    sharedFolders.forEach((folder) => {
      const existing = uniqueFolders.get(folder.id);
      if (
        !existing ||
        (folder.shareType === 'space' && existing.shareType === 'additional')
      ) {
        // 優先保留 Space 權限（通常權限更高）
        uniqueFolders.set(folder.id, folder);
      }
    });

    const finalFolders = Array.from(uniqueFolders.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    console.log(
      `API: Found ${finalFolders.length} shared folders for user ${userId}`
    );

    const result = {
      folders: finalFolders,
      total: finalFolders.length,
    };

    // 存入記憶體快取 (10分鐘)
    memoryCache.set(cacheKey, result, 10 * 60 * 1000);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Error getting shared folders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
