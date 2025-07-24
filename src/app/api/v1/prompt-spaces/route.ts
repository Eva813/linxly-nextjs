import { NextResponse } from 'next/server';
import { adminDb } from '@/server/db/firebase';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { 
  PromptSpaceData, 
  PromptSpaceApiResponse, 
  CreatePromptSpaceRequest 
} from '@/shared/types/promptSpace';

function convertTimestampToDate(timestamp: Date | { seconds: number; nanoseconds?: number } | undefined): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  return new Timestamp(timestamp.seconds, timestamp.nanoseconds || 0).toDate();
}

export async function GET(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get owned spaces
    const spacesSnapshot = await adminDb
      .collection('prompt_spaces')
      .where('userId', '==', userId)
      .get();

    const ownedSpaces: PromptSpaceApiResponse[] = spacesSnapshot.docs
      .map((doc) => {
        const data = doc.data() as PromptSpaceData;
        const createdAt = convertTimestampToDate(data.createdAt);
        const updatedAt = convertTimestampToDate(data.updatedAt) || createdAt;

        return {
          id: doc.id,
          name: data.name,
          userId: data.userId,
          defaultSpace: data.defaultSpace || false,
          createdAt: createdAt.toISOString(),
          updatedAt: updatedAt.toISOString()
        };
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // 如果用戶沒有任何 space，自動創建默認 space
    if (ownedSpaces.length === 0) {
      const defaultSpaceData = {
        userId: userId,
        name: 'promptSpace-default',
        defaultSpace: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };

      const defaultSpaceRef = await adminDb.collection('prompt_spaces').add(defaultSpaceData);
      const defaultSpace: PromptSpaceApiResponse = {
        id: defaultSpaceRef.id,
        name: 'promptSpace-default',
        userId: userId,
        defaultSpace: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      ownedSpaces.push(defaultSpace);

      // 將所有現有的 folders 和 prompts 關聯到默認 space
      await migrateExistingDataToDefaultSpace(userId, defaultSpaceRef.id);
    } else {
      // 檢查現有用戶是否有默認 space，如沒有則設置第一個為默認
      await ensureDefaultSpace(userId, ownedSpaces);
    }

    // Get shared spaces - 優化：避免 N+1 查詢
    const sharedSpacesSnapshot = await adminDb
      .collection('space_shares')
      .where('sharedWithUserId', '==', userId)
      .get();

    const sharedSpaces: Array<{
      space: PromptSpaceApiResponse;
      permission: string;
      sharedBy: string;
      sharedAt: string;
    }> = [];
    
    if (sharedSpacesSnapshot.docs.length > 0) {
      // 收集所有需要查詢的 spaceIds 和 userIds
      const spaceIds: string[] = [];
      const userIds: string[] = [];
      const shareDataMap = new Map();

      sharedSpacesSnapshot.docs.forEach(shareDoc => {
        const shareData = shareDoc.data();
        const spaceId = shareData.promptSpaceId;
        const userId = shareData.ownerUserId;
        
        spaceIds.push(spaceId);
        userIds.push(userId);
        shareDataMap.set(spaceId, shareData);
      });

      // 批量查詢所有 spaces 和 users，避免 N+1 查詢
      const [spacesResults, usersResults] = await Promise.all([
        // 批量查詢 spaces
        Promise.all(spaceIds.map(spaceId => 
          adminDb.collection('prompt_spaces').doc(spaceId).get()
        )),
        // 批量查詢 users
        Promise.all(userIds.map(userId => 
          adminDb.collection('users').doc(userId).get()
        ))
      ]);

      // 建立查詢結果的映射
      const spacesMap = new Map();
      const usersMap = new Map();

      spacesResults.forEach((spaceDoc, index) => {
        if (spaceDoc.exists) {
          spacesMap.set(spaceIds[index], spaceDoc);
        }
      });

      usersResults.forEach((userDoc, index) => {
        if (userDoc.exists) {
          usersMap.set(userIds[index], userDoc);
        }
      });

      // 組合結果
      spaceIds.forEach(spaceId => {
        const spaceDoc = spacesMap.get(spaceId);
        const shareData = shareDataMap.get(spaceId);
        
        if (spaceDoc && shareData) {
          const spaceData = spaceDoc.data() as PromptSpaceData;
          const createdAt = convertTimestampToDate(spaceData.createdAt);
          const updatedAt = convertTimestampToDate(spaceData.updatedAt) || createdAt;

          const ownerDoc = usersMap.get(shareData.ownerUserId);
          const ownerData = ownerDoc?.data();

          sharedSpaces.push({
            space: {
              id: spaceDoc.id,
              name: spaceData.name,
              userId: spaceData.userId,
              defaultSpace: spaceData.defaultSpace || false,
              createdAt: createdAt.toISOString(),
              updatedAt: updatedAt.toISOString()
            },
            permission: shareData.permission,
            sharedBy: ownerData?.name || 'Unknown User',
            sharedAt: shareData.createdAt?.toDate?.()?.toISOString() || shareData.createdAt
          });
        }
      });
    }

    return NextResponse.json({ 
      ownedSpaces,
      sharedSpaces 
    });

  } catch (error: unknown) {
    console.error("GET prompt-spaces 錯誤:", error);
    const errorMessage = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body: CreatePromptSpaceRequest = await req.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { message: 'name required' },
        { status: 400 }
      );
    }

    // 檢查是否已存在相同名稱的 space
    const existingSpace = await adminDb
      .collection('prompt_spaces')
      .where('userId', '==', userId)
      .where('name', '==', body.name.trim())
      .limit(1)
      .get();

    if (!existingSpace.empty) {
      return NextResponse.json(
        { message: 'Space with this name already exists' },
        { status: 409 }
      );
    }

    // 檢查用戶是否已有其他 space
    const userSpacesCount = await adminDb
      .collection('prompt_spaces')
      .where('userId', '==', userId)
      .get();

    const now = FieldValue.serverTimestamp();
    const spaceData = {
      userId: userId,
      name: body.name.trim(),
      defaultSpace: userSpacesCount.empty, // 如果是第一個 space 則設為默認
      createdAt: now,
      updatedAt: now
    };

    const spaceRef = await adminDb.collection('prompt_spaces').add(spaceData);

    const created: PromptSpaceApiResponse = {
      id: spaceRef.id,
      name: body.name.trim(),
      userId: userId,
      defaultSpace: userSpacesCount.empty,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(created, { status: 201 });

  } catch (error: unknown) {
    console.error("POST prompt-spaces 錯誤:", error);
    const errorMessage = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}

// 輔助函數：將現有數據遷移到默認 space
async function migrateExistingDataToDefaultSpace(userId: string, defaultSpaceId: string) {
  try {
    const batch = adminDb.batch();

    // 更新所有現有的 folders
    const foldersSnapshot = await adminDb
      .collection('folders')
      .where('userId', '==', userId)
      .get();

    foldersSnapshot.docs.forEach((doc) => {
      const folderRef = adminDb.collection('folders').doc(doc.id);
      batch.update(folderRef, { 
        promptSpaceId: defaultSpaceId,
        updatedAt: FieldValue.serverTimestamp()
      });
    });

    // 更新所有現有的 prompts
    const promptsSnapshot = await adminDb
      .collection('prompts')
      .where('userId', '==', userId)
      .get();

    promptsSnapshot.docs.forEach((doc) => {
      const promptRef = adminDb.collection('prompts').doc(doc.id);
      batch.update(promptRef, { 
        promptSpaceId: defaultSpaceId,
        updatedAt: FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
    console.log(`Migrated ${foldersSnapshot.size} folders and ${promptsSnapshot.size} prompts to default space for user ${userId}`);

  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  }
}

// 輔助函數：確保用戶有默認 space，如果沒有則設置第一個為默認
async function ensureDefaultSpace(userId: string, ownedSpaces: PromptSpaceApiResponse[]) {
  try {
    // 檢查是否已有默認 space
    const hasDefaultSpace = ownedSpaces.some(space => space.defaultSpace === true);
    
    if (!hasDefaultSpace && ownedSpaces.length > 0) {
      // 設置第一個 space 為默認 space
      const firstSpaceId = ownedSpaces[0].id;
      
      await adminDb.collection('prompt_spaces').doc(firstSpaceId).update({
        defaultSpace: true,
        updatedAt: FieldValue.serverTimestamp()
      });
      
      // 更新本地數據
      ownedSpaces[0].defaultSpace = true;
      
      console.log(`Set first space ${firstSpaceId} as default for user ${userId}`);
    }
  } catch (error) {
    console.error("Error ensuring default space:", error);
    throw error;
  }
}