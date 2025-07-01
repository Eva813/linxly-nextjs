import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { 
  handleLazyMigration, 
  formatPromptsForResponse,
  type PromptData 
} from '@/lib/utils/promptMigration';

export async function GET(
  req: Request,
  { params }: { params: { folderId: string } }
) {

  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const folderId = params.folderId;
  if (!folderId) {
    return NextResponse.json({ message: 'folderId required' }, { status: 400 });
  }
  try {
    // 獲取資料夾資訊
    const folderDoc = await adminDb
      .collection('folders')
      .doc(folderId)
      .get();

    if (!folderDoc.exists || folderDoc.data()?.userId !== userId) {
      return NextResponse.json(
        { message: 'folder not found' },
        { status: 404 }
      );
    }

    const folder = folderDoc.data()!;

    // 獲取該資料夾的所有 prompt 片段
    const promptsSnapshot = await adminDb
      .collection('prompts')
      .where('folderId', '==', folderId)
      .where('userId', '==', userId)
      .get();

    // 轉換為 PromptData 格式
    const prompts: PromptData[] = promptsSnapshot.docs.map(doc => {
      const prompt = doc.data();
      return {
        id: doc.id,
        name: prompt.name,
        content: prompt.content,
        shortcut: prompt.shortcut,
        seqNo: prompt.seqNo,
        createdAt: prompt.createdAt
      };
    });

    // 使用共用的 Lazy Migration 邏輯
    const processedPrompts = await handleLazyMigration(prompts, folderId);

    // 格式化回應資料
    const formattedPrompts = formatPromptsForResponse(processedPrompts);

    // 格式化回應資料
    const result = {
      id: folderId,
      name: folder.name,
      description: folder.description || '',
      prompts: formattedPrompts
    };

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

export async function PUT(
  req: Request,
  { params }: { params: { folderId: string } }
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const folderId = params.folderId;
  const { name, description } = await req.json();
  if (!name) {
    return NextResponse.json({ message: 'name required' }, { status: 400 });
  }
  try {
    // 檢查資料夾是否存在
    const folderDoc = await adminDb
      .collection('folders')
      .doc(folderId)
      .get();

    if (!folderDoc.exists || folderDoc.data()?.userId !== userId) {
      return NextResponse.json(
        { message: 'folder not found' },
        { status: 404 }
      );
    }

    // 更新資料夾資訊
    await adminDb.collection('folders').doc(folderId).update({
      name,
      description: description || '',
      updatedAt: new Date()
    });

    // 獲取該資料夾的所有 prompt 片段
    const promptsSnapshot = await adminDb
      .collection('prompts')
      .where('folderId', '==', folderId)
      .where('userId', '==', userId)
      .get();

    // 轉換為 PromptData 格式
    const prompts: PromptData[] = promptsSnapshot.docs.map(doc => {
      const prompt = doc.data();
      return {
        id: doc.id,
        name: prompt.name,
        content: prompt.content,
        shortcut: prompt.shortcut,
        seqNo: prompt.seqNo,
        createdAt: prompt.createdAt
      };
    });

    // 使用共用的 Lazy Migration 邏輯
    const processedPrompts = await handleLazyMigration(prompts, folderId);

    // 格式化回應資料
    const formattedPrompts = formatPromptsForResponse(processedPrompts);

    const result = {
      id: folderId,
      name,
      description: description || '',
      prompts: formattedPrompts
    };

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

export async function DELETE(
  req: Request,
  { params }: { params: { folderId: string } }
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const folderId = params.folderId;
  try {
    // 檢查資料夾是否存在
    const folderDoc = await adminDb
      .collection('folders')
      .doc(folderId)
      .get();

    if (!folderDoc.exists || folderDoc.data()?.userId !== userId) {
      return NextResponse.json(
        { message: 'folder not found' },
        { status: 404 }
      );
    }

    // 查詢該資料夾的所有 prompt 片段
    const promptsSnapshot = await adminDb
      .collection('prompts')
      .where('folderId', '==', folderId)
      .where('userId', '==', userId)
      .get();

    // 使用批次處理刪除所有 prompts
    const batch = adminDb.batch();

    // 添加刪除 prompts 的操作到批次處理中
    promptsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 添加刪除資料夾的操作到批次處理中
    batch.delete(adminDb.collection('folders').doc(folderId));

    // 執行批次處理
    await batch.commit();

    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'unknow error';
    console.error("Firebase 錯誤詳情:", error); // 增加詳細錯誤記錄
    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}