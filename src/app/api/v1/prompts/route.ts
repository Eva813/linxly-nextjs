import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(req: Request) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get('folderId');

    if (!folderId) {
      return NextResponse.json(
        { message: 'folderId required' },
        { status: 400 }
      );
    }
    
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
    
    // 獲取此資料夾的所有 prompt
    const promptsSnapshot = await adminDb
      .collection('prompts')
      .where('folderId', '==', folderId)
      .where('userId', '==', userId)
      .get();

    const result = promptsSnapshot.docs.map(doc => {
      const prompt = doc.data();
      return {
        id: doc.id,
        name: prompt.name,
        content: prompt.content,
        shortcut: prompt.shortcut
      };
    });

    return NextResponse.json(result, { status: 200 });
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
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { folderId, name, content, shortcut } = await req.json();

    if (!folderId || !name || !shortcut) {
      return NextResponse.json(
        { message: 'folderId, name and shortcut required' },
        { status: 400 }
      );
    }

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

    // 新增 prompt 片段到 prompts 集合
    const now = new Date();
    const promptData = {
      folderId,
      userId,
      name,
      content: content || '',
      shortcut,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await adminDb.collection('prompts').add(promptData);

    const created = {
      id: docRef.id,
      folderId,
      name,
      content: content || '',
      shortcut
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