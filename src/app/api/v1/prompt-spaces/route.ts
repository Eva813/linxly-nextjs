import { NextResponse } from 'next/server';
import { adminDb } from '@/server/db/firebase';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(req: Request) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const promptSpacesSnapshot = await adminDb
      .collection('promptSpaces')
      .where('userId', '==', userId)
      .get();

    const result = promptSpacesSnapshot.docs.map(doc => {
      const promptSpace = doc.data();
      return {
        id: doc.id,
        name: promptSpace.name,
      };
    });

    // 如果沒有 promptSpace，建立預設的 workspace-default
    if (result.length === 0) {
      const defaultPromptSpace = await createDefaultPromptSpace(userId);
      result.push(defaultPromptSpace);
    }

    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error("GET prompt spaces 錯誤:", error);
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

    // 取得目前最大的 id 數字來生成下一個 id
    const existingSpacesSnapshot = await adminDb
      .collection('promptSpaces')
      .where('userId', '==', userId)
      .get();

    let maxId = 0;
    existingSpacesSnapshot.docs.forEach(doc => {
      const id = parseInt(doc.id);
      if (!isNaN(id) && id > maxId) {
        maxId = id;
      }
    });

    const newId = (maxId + 1).toString();
    const now = FieldValue.serverTimestamp();

    const promptSpaceData = {
      userId: userId,
      name: body.name,
      createdAt: now,
    };

    // 使用指定的 ID 建立文件
    await adminDb.collection('promptSpaces').doc(newId).set(promptSpaceData);

    const created = {
      id: newId,
      name: body.name,
    };

    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    console.error("POST prompt space 錯誤:", error);
    const errorMessage = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json(
      { message: 'server error', error: errorMessage },
      { status: 500 }
    );
  }
}

// 建立預設的 workspace-default
async function createDefaultPromptSpace(userId: string) {
  const now = FieldValue.serverTimestamp();

  const defaultPromptSpaceData = {
    userId: userId,
    name: 'workspace-default',
    createdAt: now,
  };

  await adminDb.collection('promptSpaces').doc('1').set(defaultPromptSpaceData);

  return {
    id: '1',
    name: 'workspace-default',
  };
}
