// app/api/v1/folders/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// 後端會從資料庫中取得所有資料夾，並且對每個資料夾進行處理，將其關聯的（程式碼片段）一併查詢並格式化後返回
export async function GET(req: Request) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // 查詢資料夾
    const foldersSnapshot = await adminDb
      .collection('folders')
      .where('userId', '==', userId)
      .get();
    
    // 處理每個資料夾，並獲取其關聯的程式碼片段
    const result = await Promise.all(foldersSnapshot.docs.map(async (folderDoc) => {
      const folder = folderDoc.data();
      const folderId = folderDoc.id;
      
      // 從 prompts 集合獲取該資料夾的 prompts
      const promptsSnapshot = await adminDb
        .collection('prompts')
        .where('folderId', '==', folderId)
        .where('userId', '==', userId)
        .get();
      
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
      
      // 返回完整的資料夾物件，包含 prompts
      return {
        id: folderId,
        name: folder.name,
        description: folder.description || '',
        prompts: formattedPrompts
      };
    }));

    return NextResponse.json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'unknow error';
    console.error("Firebase 錯誤詳情:", error); // 增加詳細錯誤記錄
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

    // 在 Firestore 中建立新的資料夾
    const folderData = {
      userId: userId,
      name: body.name,
      description: body.description || '',
      createdAt: new Date(), // Admin SDK 使用 JavaScript Date 物件
      updatedAt: new Date()
    };
    
    // 使用 Admin SDK 的方式建立文件
    const folderRef = await adminDb.collection('folders').add(folderData);
    
    const created = {
      id: folderRef.id,
      name: body.name,
      description: body.description || '',
      prompts: [] // 新資料夾初始沒有 prompts
    };

    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'unknow error';
    console.error("Firebase 錯誤詳情:", error); // 增加詳細錯誤記錄
    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}