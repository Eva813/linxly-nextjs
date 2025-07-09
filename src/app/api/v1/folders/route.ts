import { NextResponse } from 'next/server';
import { adminDb } from '@/server/db/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { 
  performLazyMigration, 
  groupPromptsByFolderId, 
  formatPromptsForResponse 
} from '@/server/utils/promptUtils';

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

    // 優化：同時獲取所有相關的 prompts，避免 N+1 查詢問題
    const folderIds = uniqueFolders.map(folder => folder.id);
    const allPromptsSnapshot = await adminDb
      .collection('prompts')
      .where('folderId', 'in', folderIds.slice(0, 10)) // Firebase 限制 in 查詢最多 10 個值
      .get();

    // 如果有超過 10 個資料夾，需要分批查詢
    let allPrompts = allPromptsSnapshot.docs;
    if (folderIds.length > 10) {
      const batchSize = 10;
      for (let i = 10; i < folderIds.length; i += batchSize) {
        const batch = folderIds.slice(i, i + batchSize);
        const batchSnapshot = await adminDb
          .collection('prompts')
          .where('folderId', 'in', batch)
          .get();
        allPrompts = [...allPrompts, ...batchSnapshot.docs];
      }
    }

    // 將 prompts 按 folderId 分組
    const promptsMap = groupPromptsByFolderId(allPrompts);

    const result = await Promise.all(uniqueFolders.map(async (folderDoc) => {
      const folder = folderDoc.data();
      const folderId = folderDoc.id;

      // 檢查是否為分享的資料夾
      const isSharedFolder = folder.shares && folder.shares.some(
        (share: { userId: string; status: string; }) => share.userId === userId && share.status === 'accepted'
      );

      // 從分組的 Map 中獲取該資料夾的 prompts
      let folderPrompts = promptsMap.get(folderId) || [];

      // 如果不是分享的資料夾，額外過濾 userId
      if (!isSharedFolder) {
        folderPrompts = folderPrompts.filter(prompt => prompt.userId === userId);
      }

      // 處理 Lazy Migration（如果需要）
      const processedPrompts = await performLazyMigration(folderPrompts, {
        mode: 'batch',
        folderId,
        userId
      });

      // 格式化程式碼片段資料
      const formattedPrompts = formatPromptsForResponse(processedPrompts);

      const createdAt = folder.createdAt?.toDate?.() || new Date();
      const updatedAt = folder.updatedAt?.toDate?.() || createdAt;

      return {
        id: folderId,
        name: folder.name,
        description: folder.description || '',
        prompts: formattedPrompts,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        promptCount: formattedPrompts.length,
        isShared: isSharedFolder
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