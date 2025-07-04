// app/api/v1/folders/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(req: Request) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // 取得擁有的資料夾
    const ownedFoldersQuery = adminDb
      .collection('folders')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'asc');

    const ownedFoldersSnapshot = await ownedFoldersQuery.get();

    // 取得已接受分享的資料夾（需要手動篩選，因為 Firebase 不支援複雜的 array-contains 查詢）
    const allFoldersSnapshot = await adminDb
      .collection('folders')
      .get();

    const sharedFolders = allFoldersSnapshot.docs.filter(doc => {
      const folder = doc.data();
      return folder.shares && folder.shares.some(
        (share: { userId: string; status: string; }) => 
          share.userId === userId && share.status === 'accepted' && folder.userId !== userId
      );
    });

    // 合併所有資料夾
    const allFolders = [...ownedFoldersSnapshot.docs, ...sharedFolders];
    
    // 去除重複的資料夾（可能同時擁有且被分享）
    const uniqueFolders = allFolders.filter((folder, index, self) => 
      self.findIndex(f => f.id === folder.id) === index
    );

    const result = await Promise.all(uniqueFolders.map(async (folderDoc) => {
      const folder = folderDoc.data();
      const folderId = folderDoc.id;

      // 檢查是否為分享的資料夾
      const isSharedFolder = folder.shares && folder.shares.some(
        (share: { userId: string; status: string; }) => share.userId === userId && share.status === 'accepted'
      );

      // 從 prompts 集合獲取該資料夾的 prompts
      const promptsQuery = adminDb
        .collection('prompts')
        .where('folderId', '==', folderId);

      // 如果不是分享的資料夾，則額外過濾 userId
      const promptsSnapshot = isSharedFolder 
        ? await promptsQuery.get()
        : await promptsQuery.where('userId', '==', userId).get();
      // 格式化程式碼片段資料
      const formattedPrompts = promptsSnapshot.docs.map(promptDoc => {
        const prompt = promptDoc.data();
        return {
          id: promptDoc.id,
          name: prompt.name,
          content: prompt.content,
          shortcut: prompt.shortcut
        };
      });

      const createdAt = folder.createdAt?.toDate?.() || new Date();
      const updatedAt = folder.updatedAt?.toDate?.() || createdAt;

      return {
        id: folderId,
        name: folder.name,
        description: folder.description || '',
        prompts: formattedPrompts,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        promptCount: formattedPrompts.length
      };
    }));

    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error("GET folders 錯誤:", error);
    const errorMessage = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json();
    if (!body.name) {
      return NextResponse.json(
        { message: 'name required' },
        { status: 400 }
      );
    }

    // 獲取使用者資訊以取得 email
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    const userData = userDoc.data();
    const userEmail = userData?.email;
    
    if (!userEmail) {
      return NextResponse.json({ message: 'User email not found' }, { status: 404 });
    }

    const now = FieldValue.serverTimestamp();

    // 初始化 shares，包含創建者的資訊
    const ownerShare = {
      userId: userId,
      email: userEmail,
      permission: 'owner',
      status: 'accepted',
      invitedAt: now,
    };

    const folderData = {
      userId: userId,
      name: body.name,
      description: body.description || '',
      shares: [ownerShare], // 初始化 shares 陣列
      ownerEmail: userEmail,
      createdAt: now,
      updatedAt: now
    };

    // 使用 Admin SDK 的方式建立文件
    const folderRef = await adminDb.collection('folders').add(folderData);

    const created = {
      id: folderRef.id,
      name: body.name,
      description: body.description || '',
      shares: [ownerShare], // 返回 shares
      prompts: [] // 新資料夾初始沒有 prompts
    };

    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    console.error("POST folder 錯誤:", error);
    const errorMessage = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}