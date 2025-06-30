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
    // 注意：不在資料庫層面排序，因為部分資料可能沒有 seqNo 欄位
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

      // 使用交易批次更新所有 prompts 的 seqNo - 確保每個資料夾內部從 1 開始編號
      await adminDb.runTransaction(async (transaction) => {
        for (let i = 0; i < reorderedPrompts.length; i++) {
          const promptRef = adminDb.collection('prompts').doc(reorderedPrompts[i].id);
          transaction.update(promptRef, {
            seqNo: i + 1, // 在此資料夾內從 1 開始編號
            updatedAt: new Date()
          });
          reorderedPrompts[i].seqNo = i + 1; // 更新本地資料
        }
      });

      // 更新 prompts 陣列為重新排序後的結果
      prompts.length = 0;
      prompts.push(...reorderedPrompts);

      console.log(`Lazy Migration 完成，已更新資料夾 ${folderId} 下 ${prompts.length} 筆 prompt 的 seqNo`);
    }

    // 最終按 seqNo 排序回傳（確保穩定排序）
    prompts.sort((a, b) => {
      // 經過 Lazy Migration 後，所有 prompts 都應該有 seqNo
      // 直接按 seqNo 排序
      const aSeqNo = a.seqNo || 0;
      const bSeqNo = b.seqNo || 0;
      return aSeqNo - bSeqNo;
    });

    const result = prompts.map(prompt => ({
      id: prompt.id,
      name: prompt.name,
      content: prompt.content,
      shortcut: prompt.shortcut,
      seqNo: prompt.seqNo
    }));

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
    const { folderId, name, content, shortcut, afterPromptId } = await req.json();

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

    // 如果有指定 afterPromptId，需要觸發批次重寫邏輯
    if (afterPromptId) {
      // 獲取現有的所有 prompts
      const existingPromptsSnapshot = await adminDb
        .collection('prompts')
        .where('folderId', '==', folderId)
        .where('userId', '==', userId)
        .get();

      const existingPrompts = existingPromptsSnapshot.docs.map(doc => {
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

      // 檢查 afterPromptId 是否存在
      const afterPromptExists = existingPrompts.some(p => p.id === afterPromptId);
      if (!afterPromptExists) {
        return NextResponse.json(
          { message: 'afterPromptId not found' },
          { status: 404 }
        );
      }

      // 確保所有現有 prompts 都有 seqNo
      const hasPromptWithoutSeqNo = existingPrompts.some(prompt =>
        prompt.seqNo === undefined || prompt.seqNo === null
      );

      if (hasPromptWithoutSeqNo) {
        // 先按 createdAt 排序並分配 seqNo
        existingPrompts.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          const aTime = a.createdAt.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
          const bTime = b.createdAt.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
          return aTime - bTime;
        });

        existingPrompts.forEach((prompt, index) => {
          prompt.seqNo = index + 1;
        });
      } else {
        // 確保按 seqNo 穩定排序
        existingPrompts.sort((a, b) => {
          const aSeqNo = a.seqNo || 0;
          const bSeqNo = b.seqNo || 0;
          return aSeqNo - bSeqNo;
        });
      }

      // 建立新的 prompt 物件
      const newPrompt = {
        id: 'temp-id', // 臨時 ID，實際 ID 會在交易中產生
        name,
        content: content || '',
        shortcut,
        seqNo: 0, // 臨時 seqNo，會在後面重新分配
        createdAt: null // 臨時值
      };

      // 找到插入位置，並插入新 prompt
      const afterIndex = existingPrompts.findIndex(p => p.id === afterPromptId);
      const updatedPrompts = [
        ...existingPrompts.slice(0, afterIndex + 1),
        newPrompt,
        ...existingPrompts.slice(afterIndex + 1)
      ];

      // 呼叫批次重寫 API 的邏輯（內部處理）
      const result = await adminDb.runTransaction(async (transaction) => {
        // 刪除所有現有的 prompts
        existingPromptsSnapshot.docs.forEach((doc) => {
          transaction.delete(doc.ref);
        });

        // 按照新順序重新建立 prompts
        const now = new Date();
        const createdPrompts = [];

        for (let i = 0; i < updatedPrompts.length; i++) {
          const prompt = updatedPrompts[i];
          const promptRef = adminDb.collection('prompts').doc();

          const promptData = {
            folderId,
            userId,
            name: prompt.name,
            content: prompt.content || '',
            shortcut: prompt.shortcut,
            seqNo: i + 1,
            createdAt: now,
            updatedAt: now
          };

          transaction.set(promptRef, promptData);

          createdPrompts.push({
            id: promptRef.id,
            name: prompt.name,
            content: prompt.content || '',
            shortcut: prompt.shortcut,
            seqNo: i + 1
          });
        }

        return createdPrompts;
      });

      // 回傳新建立的 prompt（在插入位置的那一個）
      const newPromptResult = result[afterIndex + 1];
      return NextResponse.json(newPromptResult, { status: 201 });
    }

    // 沒有指定 afterPromptId 的情況，直接新增到最後
    // 先獲取當前該資料夾下最大的 seqNo
    const maxSeqNoSnapshot = await adminDb
      .collection('prompts')
      .where('folderId', '==', folderId)
      .where('userId', '==', userId)
      .get();

    let nextSeqNo = 1;
    if (!maxSeqNoSnapshot.empty) {
      // 只考慮同一個資料夾內的 seqNo
      const seqNos = maxSeqNoSnapshot.docs
        .map(doc => doc.data().seqNo)
        .filter(seqNo => seqNo !== undefined && seqNo !== null);

      if (seqNos.length > 0) {
        const maxSeqNo = Math.max(...seqNos);
        nextSeqNo = maxSeqNo + 1;
      } else {
        // 如果該資料夾內沒有任何 prompt 有 seqNo，則從 1 開始
        nextSeqNo = 1;
      }
    }

    // 新增 prompt 片段到 prompts 集合
    const now = new Date();
    const promptData = {
      folderId,
      userId,
      name,
      content: content || '',
      shortcut,
      seqNo: nextSeqNo,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await adminDb.collection('prompts').add(promptData);

    const created = {
      id: docRef.id,
      folderId,
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