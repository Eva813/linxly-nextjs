/**
 * SeqNo 管理工具
 * 處理 Prompt 順序相關的邏輯，提升可維護性和效能
 */

import { adminDb } from '@/lib/firebaseAdmin';
import type { Transaction } from 'firebase-admin/firestore';

export interface PromptData {
  id: string;
  name: string;
  content: string;
  shortcut: string;
  seqNo?: number | null;
  createdAt?: Date | { seconds: number; nanoseconds?: number } | null;
  folderId: string;
  userId: string;
}

export interface SeqNoOperation {
  type: 'add' | 'update' | 'delete';
  promptId?: string;
  data?: Partial<PromptData>;
  seqNo: number;
}

/**
 * 確保 prompts 都有正確的 seqNo，並按順序排列
 */
export function normalizePromptSequence(prompts: PromptData[]): PromptData[] {
  // 檢查是否有缺少 seqNo 的 prompt
  const hasPromptWithoutSeqNo = prompts.some(p => 
    p.seqNo === undefined || p.seqNo === null
  );

  if (hasPromptWithoutSeqNo) {
    // 按 createdAt 排序並重新分配 seqNo
    const sorted = [...prompts].sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      
      const getTime = (timestamp: Date | { seconds: number; nanoseconds?: number }) => {
        if (timestamp instanceof Date) {
          return timestamp.getTime();
        }
        return timestamp.seconds * 1000;
      };
      
      const aTime = getTime(a.createdAt);
      const bTime = getTime(b.createdAt);
      return aTime - bTime;
    });

    // 重新分配 seqNo
    return sorted.map((prompt, index) => ({
      ...prompt,
      seqNo: index + 1
    }));
  }

  // 所有 prompt 都有 seqNo，按 seqNo 排序
  return [...prompts].sort((a, b) => {
    const aSeqNo = a.seqNo || 0;
    const bSeqNo = b.seqNo || 0;
    return aSeqNo - bSeqNo;
  });
}

/**
 * 計算插入位置後的 seqNo 調整策略
 */
export function calculateInsertStrategy(
  existingPrompts: PromptData[],
  afterPromptId: string
): {
  operations: SeqNoOperation[];
  insertSeqNo: number;
  affectedPrompts: PromptData[];
} {
  const normalizedPrompts = normalizePromptSequence(existingPrompts);
  const afterIndex = normalizedPrompts.findIndex(p => p.id === afterPromptId);
  
  if (afterIndex === -1) {
    throw new Error('afterPromptId not found');
  }

  const insertSeqNo = normalizedPrompts[afterIndex].seqNo! + 1;
  
  // 找出需要調整 seqNo 的 prompts（插入點之後的所有 prompt）
  const affectedPrompts = normalizedPrompts.slice(afterIndex + 1);
  
  const operations: SeqNoOperation[] = affectedPrompts.map(prompt => ({
    type: 'update',
    promptId: prompt.id,
    seqNo: prompt.seqNo! + 1
  }));

  return {
    operations,
    insertSeqNo,
    affectedPrompts
  };
}

/**
 * 取得資料夾中的最大 seqNo
 */
export async function getMaxSeqNo(folderId: string, userId: string): Promise<number> {
  const snapshot = await adminDb
    .collection('prompts')
    .where('folderId', '==', folderId)
    .where('userId', '==', userId)
    .get();

  if (snapshot.empty) return 0;

  const seqNos = snapshot.docs
    .map(doc => doc.data().seqNo)
    .filter(seqNo => seqNo !== undefined && seqNo !== null);

  return seqNos.length > 0 ? Math.max(...seqNos) : 0;
}

/**
 * 執行 seqNo 批次更新（只更新affected prompts）
 */
export async function executeSeqNoUpdates(
  transaction: Transaction,
  operations: SeqNoOperation[]
): Promise<void> {
  for (const operation of operations) {
    if (operation.type === 'update' && operation.promptId) {
      const promptRef = adminDb.collection('prompts').doc(operation.promptId);
      transaction.update(promptRef, { 
        seqNo: operation.seqNo,
        updatedAt: new Date()
      });
    }
  }
}

/**
 * 執行 Lazy Migration（用於 GET 操作）
 */
export async function performLazyMigration(
  folderId: string,
  userId: string,
  prompts: PromptData[]
): Promise<PromptData[]> {
  const hasPromptWithoutSeqNo = prompts.some(p => 
    p.seqNo === undefined || p.seqNo === null
  );

  if (!hasPromptWithoutSeqNo) {
    // 不需要遷移，只需要排序
    return prompts.sort((a, b) => {
      const aSeqNo = a.seqNo || 0;
      const bSeqNo = b.seqNo || 0;
      return aSeqNo - bSeqNo;
    });
  }

  // 需要進行 Lazy Migration
  const normalizedPrompts = normalizePromptSequence(prompts);
  
  // 批次更新所有缺少 seqNo 的 prompts
  const batch = adminDb.batch();
  let hasUpdates = false;

  normalizedPrompts.forEach((prompt, index) => {
    const originalPrompt = prompts.find(p => p.id === prompt.id);
    if (originalPrompt && (originalPrompt.seqNo === undefined || originalPrompt.seqNo === null)) {
      const promptRef = adminDb.collection('prompts').doc(prompt.id);
      batch.update(promptRef, { 
        seqNo: index + 1,
        updatedAt: new Date()
      });
      hasUpdates = true;
    }
  });

  if (hasUpdates) {
    await batch.commit();
  }

  return normalizedPrompts;
}
