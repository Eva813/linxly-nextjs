// src/lib/utils/promptMigration.ts
import { adminDb } from '@/lib/firebaseAdmin';

export interface PromptData {
  id: string;
  name: string;
  content: string;
  shortcut?: string;
  seqNo?: number | null;
  createdAt?: { seconds: number; nanoseconds: number } | null;
}

/**
 * 處理 prompts 的 Lazy Migration 邏輯
 * 檢查並修正缺少 seqNo 的 prompt 記錄
 * 
 * @param prompts - 要處理的 prompt 陣列
 * @param folderId - 資料夾 ID（用於日誌記錄）
 * @returns 處理後並已排序的 prompts 陣列
 */
export async function handleLazyMigration(
  prompts: PromptData[], 
  folderId: string
): Promise<PromptData[]> {
  // 檢查是否有任一筆缺少 seqNo
  const hasPromptWithoutSeqNo = prompts.some(prompt =>
    prompt.seqNo === undefined || prompt.seqNo === null
  );

  if (!hasPromptWithoutSeqNo || prompts.length === 0) {
    // 如果沒有需要遷移的資料，直接排序回傳
    return sortPromptsBySeqNo(prompts);
  }

  console.log(`資料夾 ${folderId} 偵測到缺少 seqNo，開始進行 Lazy Migration`);

  // 分組：有 seqNo 的和沒有 seqNo 的
  const promptsWithSeqNo = prompts.filter(p => 
    p.seqNo !== undefined && p.seqNo !== null
  );
  const promptsWithoutSeqNo = prompts.filter(p => 
    p.seqNo === undefined || p.seqNo === null
  );

  // 有 seqNo 的按 seqNo 排序
  promptsWithSeqNo.sort((a, b) => (a.seqNo || 0) - (b.seqNo || 0));

  // 沒有 seqNo 的按 createdAt 排序
  promptsWithoutSeqNo.sort((a, b) => {
    if (!a.createdAt || !b.createdAt) return 0;
    return new Date(a.createdAt.seconds * 1000).getTime() - 
           new Date(b.createdAt.seconds * 1000).getTime();
  });

  // 重新組合：有 seqNo 的在前，沒有的在後
  const reorderedPrompts = [...promptsWithSeqNo, ...promptsWithoutSeqNo];

  try {
    // 使用交易批次更新所有 prompts 的 seqNo
    await adminDb.runTransaction(async (transaction) => {
      for (let i = 0; i < reorderedPrompts.length; i++) {
        const promptRef = adminDb.collection('prompts').doc(reorderedPrompts[i].id);
        transaction.update(promptRef, {
          seqNo: i + 1,
          updatedAt: new Date()
        });
        // 同步更新本地陣列
        reorderedPrompts[i].seqNo = i + 1;
      }
    });

    console.log(`Lazy Migration 完成，已更新資料夾 ${folderId} 下 ${reorderedPrompts.length} 筆 prompt 的 seqNo`);
    
    return sortPromptsBySeqNo(reorderedPrompts);
  } catch (error) {
    console.error(`Lazy Migration 失敗，資料夾 ${folderId}:`, error);
    // 如果更新失敗，至少回傳排序後的原始資料
    return sortPromptsBySeqNo(prompts);
  }
}

/**
 * 根據 seqNo 對 prompts 進行排序
 * 
 * @param prompts - 要排序的 prompt 陣列
 * @returns 排序後的 prompts 陣列
 */
export function sortPromptsBySeqNo(prompts: PromptData[]): PromptData[] {
  return [...prompts].sort((a, b) => {
    const aSeqNo = a.seqNo || 0;
    const bSeqNo = b.seqNo || 0;
    return aSeqNo - bSeqNo;
  });
}

/**
 * 將 prompts 按 folderId 進行分組
 * 
 * @param prompts - 所有 prompts 文件陣列
 * @returns 按 folderId 分組的 Map
 */
export function groupPromptsByFolderId(prompts: FirebaseFirestore.QueryDocumentSnapshot[]): Map<string, PromptData[]> {
  const promptsMap = new Map<string, PromptData[]>();
  
  for (const doc of prompts) {
    const prompt = doc.data();
    const promptData: PromptData = {
      id: doc.id,
      name: prompt.name,
      content: prompt.content,
      shortcut: prompt.shortcut,
      seqNo: prompt.seqNo,
      createdAt: prompt.createdAt
    };
    
    const folderId = prompt.folderId;
    if (!promptsMap.has(folderId)) {
      promptsMap.set(folderId, []);
    }
    const list = promptsMap.get(folderId);
    if (list) {
      list.push(promptData);
    }
  }
  
  return promptsMap;
}

/**
 * 格式化 prompt 資料用於 API 回應
 * 
 * @param prompts - 要格式化的 prompt 陣列
 * @returns 格式化後的 prompt 陣列
 */
export function formatPromptsForResponse(prompts: PromptData[]) {
  return prompts.map(prompt => ({
    id: prompt.id,
    name: prompt.name,
    content: prompt.content,
    shortcut: prompt.shortcut
  }));
}
