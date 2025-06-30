/**
 * 排序功能檢查器
 * 檢查目前的排序邏輯是否正確運作
 */

// 模擬 Firestore 時間戳格式
interface FirestoreTimestamp {
  seconds: number;
  nanoseconds?: number;
}

interface TestPrompt {
  id: string;
  name: string;
  seqNo?: number | null;
  createdAt?: FirestoreTimestamp | Date | null;
}

/**
 * 我們在 API 中使用的排序函式
 */
function sortPrompts(prompts: TestPrompt[]): TestPrompt[] {
  return prompts.sort((a, b) => {
    // 如果兩個都有 seqNo，按 seqNo 排序
    if (a.seqNo !== undefined && a.seqNo !== null &&
      b.seqNo !== undefined && b.seqNo !== null) {
      return a.seqNo - b.seqNo;
    }

    // 有 seqNo 的排在前面
    if (a.seqNo !== undefined && a.seqNo !== null) return -1;
    if (b.seqNo !== undefined && b.seqNo !== null) return 1;

    // 都沒有 seqNo 時按 createdAt 排序（備用方案）
    if (!a.createdAt || !b.createdAt) return 0;

    const aTime = (a.createdAt as FirestoreTimestamp).seconds
      ? (a.createdAt as FirestoreTimestamp).seconds * 1000
      : new Date(a.createdAt as Date).getTime();
    const bTime = (b.createdAt as FirestoreTimestamp).seconds
      ? (b.createdAt as FirestoreTimestamp).seconds * 1000
      : new Date(b.createdAt as Date).getTime();

    return aTime - bTime;
  });
}

/**
 * 測試案例
 */
export function runSortingTests() {
  console.log('🧪 開始排序功能測試\n');

  // 測試案例 1: 全部都有 seqNo
  const test1Data: TestPrompt[] = [
    { id: '1', name: 'Prompt C', seqNo: 3 },
    { id: '2', name: 'Prompt A', seqNo: 1 },
    { id: '3', name: 'Prompt B', seqNo: 2 },
  ];

  const sorted1 = sortPrompts([...test1Data]);
  console.log('📋 測試 1: 全部都有 seqNo');
  console.log('輸入:', test1Data.map(p => `${p.name}(${p.seqNo})`));
  console.log('結果:', sorted1.map(p => `${p.name}(${p.seqNo})`));
  console.log('✅ 預期: Prompt A(1), Prompt B(2), Prompt C(3)');
  console.log('');

  // 測試案例 2: 混合有無 seqNo
  const test2Data: TestPrompt[] = [
    { id: '1', name: 'No SeqNo Old', seqNo: null, createdAt: { seconds: 1609459200 } }, // 2021-01-01
    { id: '2', name: 'Has SeqNo 2', seqNo: 2 },
    { id: '3', name: 'Has SeqNo 1', seqNo: 1 },
    { id: '4', name: 'No SeqNo New', seqNo: undefined, createdAt: { seconds: 1609545600 } }, // 2021-01-02
  ];

  const sorted2 = sortPrompts([...test2Data]);
  console.log('📋 測試 2: 混合有無 seqNo');
  console.log('輸入:', test2Data.map(p => `${p.name}(${p.seqNo || 'null'})`));
  console.log('結果:', sorted2.map(p => `${p.name}(${p.seqNo || 'null'})`));
  console.log('✅ 預期: Has SeqNo 1, Has SeqNo 2, No SeqNo Old, No SeqNo New');
  console.log('');

  // 測試案例 3: 全部都沒有 seqNo
  const test3Data: TestPrompt[] = [
    { id: '1', name: 'Third', seqNo: null, createdAt: { seconds: 1609632000 } }, // 2021-01-03
    { id: '2', name: 'First', seqNo: undefined, createdAt: { seconds: 1609459200 } }, // 2021-01-01
    { id: '3', name: 'Second', seqNo: null, createdAt: { seconds: 1609545600 } }, // 2021-01-02
  ];

  const sorted3 = sortPrompts([...test3Data]);
  console.log('📋 測試 3: 全部都沒有 seqNo');
  console.log('輸入:', test3Data.map(p => p.name));
  console.log('結果:', sorted3.map(p => p.name));
  console.log('✅ 預期: First, Second, Third (按時間排序)');
  console.log('');

  // 測試案例 4: 邊界案例
  const test4Data: TestPrompt[] = [
    { id: '1', name: 'Zero SeqNo', seqNo: 0 },
    { id: '2', name: 'Negative SeqNo', seqNo: -1 },
    { id: '3', name: 'Large SeqNo', seqNo: 999 },
    { id: '4', name: 'Normal SeqNo', seqNo: 5 },
  ];

  const sorted4 = sortPrompts([...test4Data]);
  console.log('📋 測試 4: 邊界案例');
  console.log('輸入:', test4Data.map(p => `${p.name}(${p.seqNo})`));
  console.log('結果:', sorted4.map(p => `${p.name}(${p.seqNo})`));
  console.log('✅ 預期: Negative SeqNo(-1), Zero SeqNo(0), Normal SeqNo(5), Large SeqNo(999)');
  console.log('');

  console.log('🎉 排序測試完成！');

  return {
    test1: { input: test1Data, output: sorted1 },
    test2: { input: test2Data, output: sorted2 },
    test3: { input: test3Data, output: sorted3 },
    test4: { input: test4Data, output: sorted4 },
  };
}
