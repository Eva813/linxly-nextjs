# SeqNo 最佳化重構總結

## 🎯 問題分析

原本的 `seqNo` 處理邏輯存在以下問題：

1. **重複程式碼**：排序與 seqNo 分配邏輯在多處重複
2. **效能問題**：插入時使用「刪除全部再重建」的低效方式
3. **交易過重**：不必要的全量操作增加失敗風險
4. **程式碼複雜**：主流程與 seqNo 管理邏輯混雜

## 🚀 最佳化方案

### 1. 建立專用工具 (`seqNoManager.ts`)

抽出 seqNo 相關的所有邏輯到專用模組：

```typescript
// 核心函式
- normalizePromptSequence()  // 正規化 prompt 順序
- calculateInsertStrategy()  // 計算插入策略
- executeSeqNoUpdates()      // 執行 seqNo 更新
- getMaxSeqNo()             // 取得最大 seqNo
- performLazyMigration()    // 執行延遲遷移
```

### 2. 最佳化插入邏輯

**舊方案（插入時）：**
```
❌ 刪除所有現有 prompts (N 個 delete)
❌ 重新建立所有 prompts (N+1 個 create)
❌ 高交易失敗風險
```

**新方案（插入時）：**
```
✅ 只更新插入點之後的 prompts (M 個 update, M < N)
✅ 新增 1 個新 prompt (1 個 create)
✅ 低交易失敗風險
```

### 3. 簡化 Append 流程

**舊方案：**
```typescript
// 查詢所有 prompts → 計算最大 seqNo → 新增
const snapshot = await adminDb.collection('prompts')...get();
const seqNos = snapshot.docs.map(doc => doc.data().seqNo)...
```

**新方案：**
```typescript
// 直接取得最大 seqNo → 新增
const nextSeqNo = await getMaxSeqNo(folderId, userId) + 1;
```

## 📊 效能提升

### 插入操作效能對比

| 場景 | 舊方案操作數 | 新方案操作數 | 效能提升 |
|------|-------------|-------------|----------|
| 插入到第1個位置後 | 2N+1 | N+1 | ~50% |
| 插入到中間位置 | 2N+1 | N/2+1 | ~75% |
| 插入到最後位置 | 2N+1 | 1 | ~99% |
| Append 到最後 | 無變化 | 無變化 | 一致 |

### 記憶體與網路使用

- **減少資料傳輸**：不需要重新傳輸所有 prompt 資料
- **降低記憶體使用**：不需要在記憶體中重建所有物件
- **減少鎖定時間**：交易執行時間更短

## 🛡️ 安全性與穩定性提升

### 1. 降低 Race Condition
- 更少的交易操作減少衝突機會
- 縮短交易時間降低併發風險

### 2. 錯誤處理改善
```typescript
// 精確的錯誤處理
try {
  const { operations, insertSeqNo } = calculateInsertStrategy(existingPrompts, afterPromptId);
} catch (error) {
  if (error.message === 'afterPromptId not found') {
    return NextResponse.json({ message: 'afterPromptId not found' }, { status: 404 });
  }
}
```

### 3. 資料一致性
- 所有 seqNo 操作都在交易內執行
- 確保原子性操作

## 📁 檔案結構

```
src/
├── lib/utils/
│   └── seqNoManager.ts          # 新增：SeqNo 管理工具
├── app/api/v1/prompts/
│   ├── route.ts                 # 重構：使用新工具
│   └── batch/
│       └── route.ts             # 新增：批次重寫 API
├── test/
│   └── seqno-optimization-test.ts # 新增：最佳化測試
└── app/test-seqno-optimization/
    └── page.tsx                 # 新增：測試展示頁面
```

## 🧪 測試覆蓋

1. **單元測試**：seqNo 管理函式
2. **整合測試**：API 端點行為
3. **效能測試**：大量資料插入效能
4. **邊界測試**：錯誤處理與邊界情況

## 🔄 向後相容性

- ✅ 現有 API 介面不變
- ✅ 前端程式碼無需修改
- ✅ 資料庫結構不變
- ✅ 支援漸進式遷移

## 🎉 總結

這次重構達成了以下目標：

1. **提升效能**：插入操作效能提升 50-99%
2. **提高可維護性**：程式碼結構更清晰
3. **增強穩定性**：降低交易失敗機率
4. **改善可測試性**：邏輯分離便於測試
5. **保持相容性**：不影響現有功能

新的 seqNo 管理系統為未來的擴展（如拖拽排序、批次操作等）奠定了堅實的基礎。
