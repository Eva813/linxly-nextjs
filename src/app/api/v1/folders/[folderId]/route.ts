import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

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

    const prompts = promptsSnapshot.docs.map(doc => {
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

    // Lazy Migration: 檢查是否有任一筆缺少 seqNo
    const hasPromptWithoutSeqNo = prompts.some(prompt =>
      prompt.seqNo === undefined || prompt.seqNo === null
    );

    if (hasPromptWithoutSeqNo && prompts.length > 0) {
      console.log(`資料夾 ${folderId} 偵測到缺少 seqNo，開始進行 Lazy Migration`);

      // 先將有 seqNo 的 prompt 按 seqNo 排序，沒有的按 createdAt 排序
      const promptsWithSeqNo = prompts.filter(p => p.seqNo !== undefined && p.seqNo !== null);
      const promptsWithoutSeqNo = prompts.filter(p => p.seqNo === undefined || p.seqNo === null);

      // 有 seqNo 的按 seqNo 排序
      promptsWithSeqNo.sort((a, b) => (a.seqNo || 0) - (b.seqNo || 0));

      // 沒有 seqNo 的按 createdAt 排序
      promptsWithoutSeqNo.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(a.createdAt.seconds * 1000).getTime() - new Date(b.createdAt.seconds * 1000).getTime();
      });

      // 重新組合：有 seqNo 的在前，沒有的在後
      const reorderedPrompts = [...promptsWithSeqNo, ...promptsWithoutSeqNo];

      // 使用交易批次更新所有 prompts 的 seqNo
      await adminDb.runTransaction(async (transaction) => {
        for (let i = 0; i < reorderedPrompts.length; i++) {
          const promptRef = adminDb.collection('prompts').doc(reorderedPrompts[i].id);
          transaction.update(promptRef, {
            seqNo: i + 1,
            updatedAt: new Date()
          });
          reorderedPrompts[i].seqNo = i + 1;
        }
      });

      // 更新 prompts 陣列為重新排序後的結果
      prompts.length = 0;
      prompts.push(...reorderedPrompts);

      console.log(`Lazy Migration 完成，已更新資料夾 ${folderId} 下 ${prompts.length} 筆 prompt 的 seqNo`);
    }

    // 最終按 seqNo 排序回傳
    prompts.sort((a, b) => {
      const aSeqNo = a.seqNo || 0;
      const bSeqNo = b.seqNo || 0;
      return aSeqNo - bSeqNo;
    });

    // 格式化回應資料
    const formattedPrompts = prompts.map(prompt => ({
      id: prompt.id,
      name: prompt.name,
      content: prompt.content,
      shortcut: prompt.shortcut
    }));

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

    const prompts = promptsSnapshot.docs.map(doc => {
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

    // Lazy Migration: 檢查是否有任一筆缺少 seqNo
    const hasPromptWithoutSeqNo = prompts.some(prompt =>
      prompt.seqNo === undefined || prompt.seqNo === null
    );

    if (hasPromptWithoutSeqNo && prompts.length > 0) {
      console.log(`資料夾 ${folderId} 偵測到缺少 seqNo，開始進行 Lazy Migration`);

      // 先將有 seqNo 的 prompt 按 seqNo 排序，沒有的按 createdAt 排序
      const promptsWithSeqNo = prompts.filter(p => p.seqNo !== undefined && p.seqNo !== null);
      const promptsWithoutSeqNo = prompts.filter(p => p.seqNo === undefined || p.seqNo === null);

      // 有 seqNo 的按 seqNo 排序
      promptsWithSeqNo.sort((a, b) => (a.seqNo || 0) - (b.seqNo || 0));

      // 沒有 seqNo 的按 createdAt 排序
      promptsWithoutSeqNo.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(a.createdAt.seconds * 1000).getTime() - new Date(b.createdAt.seconds * 1000).getTime();
      });

      // 重新組合：有 seqNo 的在前，沒有的在後
      const reorderedPrompts = [...promptsWithSeqNo, ...promptsWithoutSeqNo];

      // 使用交易批次更新所有 prompts 的 seqNo
      await adminDb.runTransaction(async (transaction) => {
        for (let i = 0; i < reorderedPrompts.length; i++) {
          const promptRef = adminDb.collection('prompts').doc(reorderedPrompts[i].id);
          transaction.update(promptRef, {
            seqNo: i + 1,
            updatedAt: new Date()
          });
          reorderedPrompts[i].seqNo = i + 1;
        }
      });

      // 更新 prompts 陣列為重新排序後的結果
      prompts.length = 0;
      prompts.push(...reorderedPrompts);

      console.log(`Lazy Migration 完成，已更新資料夾 ${folderId} 下 ${prompts.length} 筆 prompt 的 seqNo`);
    }

    // 最終按 seqNo 排序回傳
    prompts.sort((a, b) => {
      const aSeqNo = a.seqNo || 0;
      const bSeqNo = b.seqNo || 0;
      return aSeqNo - bSeqNo;
    });

    const formattedPrompts = prompts.map(prompt => ({
      id: prompt.id,
      name: prompt.name,
      content: prompt.content,
      shortcut: prompt.shortcut
    }));

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