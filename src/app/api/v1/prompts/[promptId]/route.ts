import { NextResponse } from 'next/server';
import { adminDb } from '@/server/db/firebase';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(
  req: Request,
  { params }: { params: { promptId: string } }
) {

  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const promptId = params.promptId;

  if (!promptId) {
    return NextResponse.json({ message: 'promptId required' }, { status: 400 });
  }
  try {
    // 獲取程式碼片段資訊
    const promptDoc = await adminDb
      .collection('prompts')
      .doc(promptId)
      .get();

    if (!promptDoc.exists || promptDoc.data()?.userId !== userId) {
      return NextResponse.json(
        { message: 'prompt not found' },
        { status: 404 }
      );
    }

    const prompt = promptDoc.data()!;

    // 格式化回應資料
    const result = {
      id: promptId,
      folderId: prompt.folderId,
      name: prompt.name,
      content: prompt.content,
      shortcut: prompt.shortcut,
      seqNo: prompt.seqNo
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
  { params }: { params: { promptId: string } }
) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const promptId = params.promptId;
  const { name, content, shortcut } = await req.json();
  if (!name && content === undefined && !shortcut) {
    return NextResponse.json(
      { message: 'at least one field is required for update' },
      { status: 400 }
    );
  }

  try {
    // 檢查 prompt 是否存在
    const promptDoc = await adminDb
      .collection('prompts')
      .doc(promptId)
      .get();

    if (!promptDoc.exists || promptDoc.data()?.userId !== userId) {
      return NextResponse.json({ message: 'prompt not found' }, { status: 404 });
    }

    // 準備更新資料
    const updateData: { updatedAt: FirebaseFirestore.FieldValue; name?: string; content?: string; shortcut?: string } = { updatedAt: FieldValue.serverTimestamp() };
    if (name) updateData.name = name;
    if (content !== undefined) updateData.content = content;
    if (shortcut) updateData.shortcut = shortcut;

    // 更新文件
    await adminDb
      .collection('prompts')
      .doc(promptId)
      .update(updateData);

    // 獲取更新後的文件
    const updatedDoc = await adminDb
      .collection('prompts')
      .doc(promptId)
      .get();

    const updated = updatedDoc.data()!;

    return NextResponse.json({
      id: promptId,
      folderId: updated.folderId,
      name: updated.name,
      content: updated.content,
      shortcut: updated.shortcut,
      seqNo: updated.seqNo
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'unknown error';
    console.error("Firebase 錯誤詳情:", err); // 增加詳細錯誤記錄
    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { promptId: string } }
) {

  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const promptId = params.promptId;

  try {
    // 檢查 prompt 是否存在並屬於當前使用者
    const promptDoc = await adminDb
      .collection('prompts')
      .doc(promptId)
      .get();

    if (!promptDoc.exists || promptDoc.data()?.userId !== userId) {
      // 不存在或不屬於這個 user
      return NextResponse.json({ message: 'prompt not found' }, { status: 404 });
    }

    // 刪除文件
    await adminDb
      .collection('prompts')
      .doc(promptId)
      .delete();

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