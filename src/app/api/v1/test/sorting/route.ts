import { NextRequest, NextResponse } from 'next/server';

/**
 * 測試排序功能的 API 端點
 * 用於驗證 seqNo 排序是否正常運作
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const testType = searchParams.get('type');

  switch (testType) {
    case 'sort-validation':
      return validateSortingLogic();
    case 'seqno-generation':
      return testSeqNoGeneration();
    default:
      return NextResponse.json({
        message: '可用的測試類型',
        types: [
          'sort-validation - 驗證排序邏輯',
          'seqno-generation - 測試 seqNo 產生'
        ]
      });
  }
}

/**
 * 驗證排序邏輯
 */
function validateSortingLogic() {
  // 模擬各種排序情境的測試資料
  const testData = [
    // 情境 1: 正常有 seqNo 的資料
    { id: '1', name: 'Prompt 1', seqNo: 3, createdAt: null },
    { id: '2', name: 'Prompt 2', seqNo: 1, createdAt: null },
    { id: '3', name: 'Prompt 3', seqNo: 2, createdAt: null },

    // 情境 2: 混合有無 seqNo 的資料
    { id: '4', name: 'Prompt 4', seqNo: undefined, createdAt: 1609459200000 }, // 2021-01-01 時間戳
    { id: '5', name: 'Prompt 5', seqNo: 4, createdAt: null },
    { id: '6', name: 'Prompt 6', seqNo: null, createdAt: 1609545600000 }, // 2021-01-02 時間戳
  ];

  // 套用我們的排序邏輯
  const sorted = [...testData].sort((a, b) => {
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
    return a.createdAt - b.createdAt;
  });

  return NextResponse.json({
    message: '排序邏輯驗證',
    original: testData,
    sorted: sorted,
    expectedOrder: ['Prompt 2 (seqNo: 1)', 'Prompt 3 (seqNo: 2)', 'Prompt 1 (seqNo: 3)', 'Prompt 5 (seqNo: 4)', 'Prompt 4 (oldest)', 'Prompt 6 (newest)'],
    isCorrect: sorted[0].name === 'Prompt 2' && sorted[1].name === 'Prompt 3'
  });
}

/**
 * 測試 seqNo 產生邏輯
 */
function testSeqNoGeneration() {
  // 模擬現有 prompts 的 seqNo
  const existingSeqNos = [1, 2, 4, 5]; // 注意 seqNo 3 缺失

  // 計算下一個 seqNo
  const maxSeqNo = Math.max(...existingSeqNos);
  const nextSeqNo = maxSeqNo + 1;

  // 測試插入邏輯：在 seqNo 2 後面插入
  const insertAfterSeqNo = 2;
  const newSequence = [];

  for (let i = 1; i <= maxSeqNo + 1; i++) {
    if (i <= insertAfterSeqNo) {
      if (existingSeqNos.includes(i)) {
        newSequence.push({ seqNo: i, type: 'existing' });
      }
    } else if (i === insertAfterSeqNo + 1) {
      newSequence.push({ seqNo: i, type: 'new' });
    } else {
      if (existingSeqNos.includes(i - 1)) {
        newSequence.push({ seqNo: i, type: 'existing', originalSeqNo: i - 1 });
      }
    }
  }

  return NextResponse.json({
    message: 'seqNo 產生邏輯測試',
    existingSeqNos,
    nextSeqNo,
    insertAfterSeqNo,
    newSequence,
    explanation: '插入新 prompt 後，所有後續 prompt 的 seqNo 都需要 +1'
  });
}
