// app/api/v1/folders/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { 
  handleLazyMigration, 
  groupPromptsByFolderId, 
  formatPromptsForResponse 
} from '@/lib/utils/promptMigration';

export async function GET(req: Request) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // 優化：同時獲取所有資料夾和所有 prompts，避免 N+1 查詢問題
    const [foldersSnapshot, promptsSnapshot] = await Promise.all([
      adminDb
        .collection('folders')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'asc')
        .get(),
      adminDb
        .collection('prompts')
        .where('userId', '==', userId)
        .get()
    ]);

    // 將 prompts 按 folderId 分組
    const promptsMap = groupPromptsByFolderId(promptsSnapshot.docs);

    // 處理每個資料夾並組合資料
    const result = await Promise.all(foldersSnapshot.docs.map(async (folderDoc) => {
      const folder = folderDoc.data();
      const folderId = folderDoc.id;

      // 從分組的 Map 中獲取該資料夾的 prompts
      const folderPrompts = promptsMap.get(folderId) || [];

      // 處理 Lazy Migration（如果需要）
      const processedPrompts = await handleLazyMigration(folderPrompts, folderId);

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

    const now = FieldValue.serverTimestamp();

    const folderData = {
      userId: userId,
      name: body.name,
      description: body.description || '',
      createdAt: now,
      updatedAt: now
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
    console.error("POST folder 錯誤:", error);
    const errorMessage = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}