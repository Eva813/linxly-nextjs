/**
 * Prompt 後端工具函式集合
 * 統一處理 prompt 相關的資料操作、排序、遷移等邏輯
 */

import { adminDb } from '../db/firebase';
import type { Transaction } from '../db/firebase';
import type { PromptData, PromptApiResponse } from '@/shared/types/prompt';

// Update 操作類型
export interface UpdateOperation {
  type: 'batch' | 'transaction';
  executor: (updates: Array<{ ref: FirebaseFirestore.DocumentReference; data: Record<string, unknown> }>) => Promise<void>;
}

/**
 * 核心排序函式 - 所有排序邏輯的基礎
 */
export function sortPromptsBySeqNo(prompts: PromptData[]): PromptData[] {
  return [...prompts].sort((a, b) => {
    const aSeqNo = a.seqNo || 0;
    const bSeqNo = b.seqNo || 0;
    return aSeqNo - bSeqNo;
  });
}


/**
 * 計算插入位置的策略
 */
export function calculateInsertStrategy(
  existingPrompts: PromptData[],
  afterPromptId: string
): {
  insertSeqNo: number;
  affectedPrompts: PromptData[];
  updateOperations: Array<{ promptId: string; newSeqNo: number }>;
} {
  const sortedPrompts = sortPromptsBySeqNo(existingPrompts);
  const afterIndex = sortedPrompts.findIndex((p: PromptData) => p.id === afterPromptId);
  
  if (afterIndex === -1) {
    throw new Error('afterPromptId not found');
  }

  const insertSeqNo = sortedPrompts[afterIndex].seqNo! + 1;
  const affectedPrompts = sortedPrompts.slice(afterIndex + 1);
  
  const updateOperations = affectedPrompts.map((prompt: PromptData) => ({
    promptId: prompt.id,
    newSeqNo: prompt.seqNo! + 1
  }));

  return {
    insertSeqNo,
    affectedPrompts,
    updateOperations
  };
}

/**
 * 執行 seqNo 更新操作
 */
export async function executeSeqNoUpdates(
  transaction: Transaction,
  operations: Array<{ promptId: string; newSeqNo: number }>
): Promise<void> {
  for (const operation of operations) {
    const promptRef = adminDb.collection('prompts').doc(operation.promptId);
    transaction.update(promptRef, { 
      seqNo: operation.newSeqNo,
      updatedAt: new Date()
    });
  }
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

// === 以下為資料處理相關的工具函式，與 seqNo 邏輯解耦 ===

/**
 * 將 prompts 按 folderId 進行分組
 */
export function groupPromptsByFolderId(
  prompts: FirebaseFirestore.QueryDocumentSnapshot[]
): Map<string, PromptData[]> {
  const promptsMap = new Map<string, PromptData[]>();
  
  for (const doc of prompts) {
    const prompt = doc.data();
    const promptData: PromptData = {
      id: doc.id,
      name: prompt.name,
      content: prompt.content,
      shortcut: prompt.shortcut,
      seqNo: prompt.seqNo,
      createdAt: prompt.createdAt,
      folderId: prompt.folderId,
      userId: prompt.userId
    };
    
    const folderId = prompt.folderId;
    if (!promptsMap.has(folderId)) {
      promptsMap.set(folderId, []);
    }
    promptsMap.get(folderId)!.push(promptData);
  }
  
  return promptsMap;
}

/**
 * 格式化 prompt 資料用於 API 回應
 */
export function formatPromptsForResponse(prompts: PromptData[]): PromptApiResponse[] {
  return prompts.map(prompt => ({
    id: prompt.id,
    name: prompt.name,
    content: prompt.content,
    shortcut: prompt.shortcut,
    seqNo: prompt.seqNo || undefined
  }));
}

/**
 * 將 Firestore 文件轉換為 PromptData
 */
export function mapFirestoreDocToPromptData(doc: FirebaseFirestore.DocumentSnapshot): PromptData {
  const data = doc.data();
  if (!data) {
    throw new Error(`Document ${doc.id} has no data`);
  }
  
  return {
    id: doc.id,
    name: data.name,
    content: data.content,
    shortcut: data.shortcut,
    seqNo: data.seqNo,
    createdAt: data.createdAt,
    folderId: data.folderId,
    userId: data.userId
  };
}
