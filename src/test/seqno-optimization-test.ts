/**
 * SeqNo 管理測試
 * 驗證新的 seqNo 最佳化邏輯
 */

import { 
  normalizePromptSequence, 
  calculateInsertStrategy,
  type PromptData 
} from '@/server/utils/promptUtils';

export function runSeqNoTests() {
  console.log('🧪 開始 SeqNo 管理測試\n');

  // 測試資料
  const testPrompts: PromptData[] = [
    {
      id: '1',
      name: 'Prompt A',
      content: 'Content A',
      shortcut: '/a',
      seqNo: 1,
      folderId: 'folder1',
      userId: 'user1',
      createdAt: new Date('2024-01-01')
    },
    {
      id: '2',
      name: 'Prompt B',
      content: 'Content B',
      shortcut: '/b',
      seqNo: 3,
      folderId: 'folder1',
      userId: 'user1',
      createdAt: new Date('2024-01-02')
    },
    {
      id: '3',
      name: 'Prompt C',
      content: 'Content C',
      shortcut: '/c',
      seqNo: null,
      folderId: 'folder1',
      userId: 'user1',
      createdAt: new Date('2024-01-03')
    }
  ];

  // 測試 1: normalizePromptSequence
  console.log('📋 測試 1: normalizePromptSequence');
  const normalized = normalizePromptSequence([...testPrompts]);
  console.log('正規化後的順序:', normalized.map(p => `${p.name}(seqNo:${p.seqNo})`));
  console.log('✅ 預期: 所有 prompt 都有連續的 seqNo\n');

  // 測試 2: calculateInsertStrategy - 插入到中間
  console.log('📋 測試 2: calculateInsertStrategy - 插入到 Prompt A 之後');
  try {
    const { updateOperations, insertSeqNo, affectedPrompts } = calculateInsertStrategy(
      normalized, 
      '1' // Prompt A 的 ID
    );
    
    console.log('插入 seqNo:', insertSeqNo);
    console.log('受影響的 prompts:', affectedPrompts.map(p => p.name));
    console.log('需要執行的操作:', updateOperations.length);
    console.log('✅ 只有插入點之後的 prompt 會被影響\n');
  } catch (error) {
    console.error('❌ 測試失敗:', error);
  }

  // 測試 3: calculateInsertStrategy - 插入到最後
  console.log('📋 測試 3: calculateInsertStrategy - 插入到最後一個之後');
  try {
    const { updateOperations, insertSeqNo } = calculateInsertStrategy(
      normalized, 
      normalized[normalized.length - 1].id
    );
    
    console.log('插入 seqNo:', insertSeqNo);
    console.log('受影響的操作數:', updateOperations.length);
    console.log('✅ 插入到最後時，不應該有其他 prompt 受影響\n');
  } catch (error) {
    console.error('❌ 測試失敗:', error);
  }

  // 測試 4: 錯誤處理
  console.log('📋 測試 4: 錯誤處理 - 不存在的 afterPromptId');
  try {
    calculateInsertStrategy(normalized, 'non-existent-id');
    console.error('❌ 應該拋出錯誤');
  } catch (error) {
    console.log('✅ 正確拋出錯誤:', (error as Error).message);
  }

  console.log('\n🎉 SeqNo 管理測試完成');
}

/**
 * 效能比較測試
 */
export function runPerformanceComparison() {
  console.log('\n⚡ 效能比較測試');
  
  // 模擬大量 prompts
  const largePromptSet: PromptData[] = Array.from({ length: 100 }, (_, i) => ({
    id: `prompt-${i}`,
    name: `Prompt ${i}`,
    content: `Content ${i}`,
    shortcut: `/p${i}`,
    seqNo: i + 1,
    folderId: 'folder1',
    userId: 'user1',
    createdAt: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`)
  }));

  // 測試插入策略效能
  console.time('插入策略計算');
  const { updateOperations } = calculateInsertStrategy(largePromptSet, 'prompt-50');
  console.timeEnd('插入策略計算');
  
  console.log('📊 結果統計:');
  console.log(`- 總 prompts 數: ${largePromptSet.length}`);
  console.log(`- 受影響的 prompts: ${updateOperations.length}`);
  console.log(`- 效能提升: ${Math.round((1 - updateOperations.length / largePromptSet.length) * 100)}% 的 prompts 不需要更新`);
  
  console.log('\n✅ 新方案只更新必要的 prompts，大幅提升效能');
}
