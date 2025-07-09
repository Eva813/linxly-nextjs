import { NextResponse } from 'next/server';
import { adminDb } from '@/server/db/firebase';
import {
  performLazyMigration,
  calculateInsertStrategy,
  executeSeqNoUpdates,
  getMaxSeqNo
} from '@/server/utils/promptUtils';
import type { PromptData } from '@/shared/types/prompt';

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

    const prompts: PromptData[] = promptsSnapshot.docs.map(doc => {
      const prompt = doc.data();
      return {
        id: doc.id,
        name: prompt.name,
        content: prompt.content,
        shortcut: prompt.shortcut,
        seqNo: prompt.seqNo,
        createdAt: prompt.createdAt,
        folderId: prompt.folderId,
        userId: prompt.userId,
        promptSpaceId: prompt.promptSpaceId || '1' // 為舊資料提供預設值
      };
    });

    // 使用 performLazyMigration 處理排序和遷移
    const sortedPrompts = await performLazyMigration(prompts, {
      mode: 'batch',
      folderId,
      userId
    });

    const result = sortedPrompts.map(prompt => ({
      id: prompt.id,
      name: prompt.name,
      content: prompt.content,
      shortcut: prompt.shortcut,
      seqNo: prompt.seqNo
    }));

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'unknown error';
    console.error("Firebase 錯誤詳情:", error);
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
    const { folderId, name, content, shortcut, afterPromptId, promptSpaceId } = await req.json();

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

    // 如果有指定 afterPromptId，使用最佳化的插入邏輯
    if (afterPromptId) {
      // 獲取現有的所有 prompts
      const existingPromptsSnapshot = await adminDb
        .collection('prompts')
        .where('folderId', '==', folderId)
        .where('userId', '==', userId)
        .get();

      const existingPrompts: PromptData[] = existingPromptsSnapshot.docs.map(doc => {
        const prompt = doc.data();
        return {
          id: doc.id,
          name: prompt.name,
          content: prompt.content,
          shortcut: prompt.shortcut,
          seqNo: prompt.seqNo,
          createdAt: prompt.createdAt,
          folderId: prompt.folderId,
          userId: prompt.userId,
          promptSpaceId: prompt.promptSpaceId || '1' // 為舊資料提供預設值
        };
      });

      try {
        // 計算插入策略（只影響必要的 prompts）
        const { updateOperations, insertSeqNo } = calculateInsertStrategy(existingPrompts, afterPromptId);

        // 執行交易：只更新受影響的 prompts + 新增新 prompt
        const result = await adminDb.runTransaction(async (transaction) => {
          // 1. 更新受影響的 prompts 的 seqNo
          await executeSeqNoUpdates(transaction, updateOperations);

          // 2. 新增新 prompt
          const promptRef = adminDb.collection('prompts').doc();
          const now = new Date();
          const newPromptData = {
            folderId,
            userId,
            name,
            content: content || '',
            shortcut,
            promptSpaceId: promptSpaceId || '1', // 預設為 workspace-default
            seqNo: insertSeqNo,
            createdAt: now,
            updatedAt: now
          };

          transaction.set(promptRef, newPromptData);

          return {
            id: promptRef.id,
            name,
            content: content || '',
            shortcut,
            seqNo: insertSeqNo
          };
        });

        return NextResponse.json(result, { status: 201 });
      } catch (error) {
        if (error instanceof Error && error.message === 'afterPromptId not found') {
          return NextResponse.json(
            { message: 'afterPromptId not found' },
            { status: 404 }
          );
        }
        throw error;
      }
    }

    // 沒有指定 afterPromptId 的情況，直接 append 到最後
    const nextSeqNo = await getMaxSeqNo(folderId, userId) + 1;

    // 新增 prompt 到 prompts 集合
    const now = new Date();
    const promptData = {
      folderId,
      userId,
      name,
      content: content || '',
      shortcut,
      promptSpaceId: promptSpaceId || '1', // 預設為 workspace-default
      seqNo: nextSeqNo,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await adminDb.collection('prompts').add(promptData);

    const created = {
      id: docRef.id,
      name,
      content: content || '',
      shortcut,
      seqNo: nextSeqNo
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