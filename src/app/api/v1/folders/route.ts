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

    const query = adminDb
      .collection('folders')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'asc');

    const foldersSnapshot = await query.get();

    const result = await Promise.all(foldersSnapshot.docs.map(async (folderDoc) => {
      const folder = folderDoc.data();
      const folderId = folderDoc.id;

      // 從 prompts 集合獲取該資料夾的 prompts
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

      // 格式化程式碼片段資料
      const formattedPrompts = prompts.map(prompt => ({
        id: prompt.id,
        name: prompt.name,
        content: prompt.content,
        shortcut: prompt.shortcut
      }));

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