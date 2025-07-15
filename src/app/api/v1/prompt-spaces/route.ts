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
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };

      const defaultSpaceRef = await adminDb.collection('prompt_spaces').add(defaultSpaceData);
      const defaultSpace: PromptSpaceApiResponse = {
        id: defaultSpaceRef.id,
        name: 'promptSpace-default',
        userId: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      ownedSpaces.push(defaultSpace);

      // 將所有現有的 folders 和 prompts 關聯到默認 space
      await migrateExistingDataToDefaultSpace(userId, defaultSpaceRef.id);
    }

    // Get shared spaces
    const sharedSpacesSnapshot = await adminDb
      .collection('space_shares')
      .where('sharedWithUserId', '==', userId)
      .where('status', '==', 'active')
      .get();

    const sharedSpaces = [];
    for (const shareDoc of sharedSpacesSnapshot.docs) {
      const shareData = shareDoc.data();
      
      // Get space details
      const spaceDoc = await adminDb.collection('prompt_spaces').doc(shareData.spaceId).get();
      if (spaceDoc.exists) {
        const spaceData = spaceDoc.data() as PromptSpaceData;
        const createdAt = convertTimestampToDate(spaceData.createdAt);
        const updatedAt = convertTimestampToDate(spaceData.updatedAt) || createdAt;

        // Get owner details
        const ownerDoc = await adminDb.collection('users').doc(shareData.ownerUserId).get();
        const ownerData = ownerDoc.data();

        sharedSpaces.push({
          space: {
            id: spaceDoc.id,
            name: spaceData.name,
            userId: spaceData.userId,
            createdAt: createdAt.toISOString(),
            updatedAt: updatedAt.toISOString()
          },
          permission: shareData.permission,
          sharedBy: ownerData?.name || 'Unknown User',
          sharedAt: shareData.createdAt?.toDate?.()?.toISOString() || shareData.createdAt
        });
      }
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

    const now = FieldValue.serverTimestamp();
    const spaceData = {
      userId: userId,
      name: body.name.trim(),
      createdAt: now,
      updatedAt: now
    };

    const spaceRef = await adminDb.collection('prompt_spaces').add(spaceData);

    const created: PromptSpaceApiResponse = {
      id: spaceRef.id,
      name: body.name.trim(),
      userId: userId,
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