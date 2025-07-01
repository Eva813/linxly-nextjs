# Prompt 工具函式重構說明

## 重構目標

將原本分散在 `promptMigration.ts` 和 `seqNoManager.ts` 的程式碼統一整合，消除重複邏輯，提升可維護性。

## 重構前問題分析

### 1. 程式碼重複
- `sortPromptsBySeqNo` 與 `performLazyMigration` 內的排序邏輯重複
- `handleLazyMigration` 與 `performLazyMigration` 功能高度重疊
- 多處都有相同的 seqNo 檢查邏輯

### 2. 型別不一致
- 兩個檔案的 `PromptData` 介面定義不同
- 缺乏統一的 API 回應型別

### 3. 功能混雜
- seqNo 管理邏輯與資料處理邏輯混合在一起
- 缺乏清晰的職責分離

## 重構後架構

### 核心檔案：`promptUtils.ts`

#### 1. 統一型別定義
```typescript
// 統一的 PromptData 介面
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

// API 回應格式
export interface PromptApiResponse {
  id: string;
  name: string;
  content: string;
  shortcut: string;
  seqNo?: number;
}
```

#### 2. 核心功能函式

##### SeqNo 管理相關
- `sortPromptsBySeqNo()` - 基礎排序函式
- `hasPromptsWithoutSeqNo()` - 檢查是否需要遷移
- `normalizePromptSequence()` - 正規化序列
- `performLazyMigration()` - 統一的 Lazy Migration（支援 batch/transaction）
- `calculateInsertStrategy()` - 計算插入策略
- `executeSeqNoUpdates()` - 執行更新操作
- `getMaxSeqNo()` - 取得最大序號

##### 資料處理相關
- `groupPromptsByFolderId()` - 按資料夾分組
- `formatPromptsForResponse()` - 格式化 API 回應
- `mapFirestoreDocToPromptData()` - Firestore 文件轉換

## 主要改進

### 1. 消除重複程式碼
- 所有排序邏輯統一使用 `sortPromptsBySeqNo()`
- Lazy Migration 合併為單一函式，支援兩種模式

### 2. 提升靈活性
```typescript
// 支援 batch 和 transaction 兩種模式
await performLazyMigration(prompts, {
  mode: 'batch', // 或 'transaction'
  folderId,
  userId,
  transaction // transaction 模式時提供
});
```

### 3. 清晰的職責分離
- **SeqNo 管理**：處理順序相關邏輯
- **資料處理**：處理格式轉換、分組等
- **API 支援**：提供 API 層所需的工具

### 4. 型別安全
- 統一的型別定義
- 嚴格的 TypeScript 型別檢查
- 清晰的 API 契約

## 使用指南

### GET API 中使用 Lazy Migration
```typescript
const sortedPrompts = await performLazyMigration(prompts, {
  mode: 'batch',
  folderId,
  userId
});

return formatPromptsForResponse(sortedPrompts);
```

### POST API 中插入 Prompt
```typescript
// 計算插入策略
const { updateOperations, insertSeqNo } = calculateInsertStrategy(existingPrompts, afterPromptId);

// 執行交易
await adminDb.runTransaction(async (transaction) => {
  await executeSeqNoUpdates(transaction, updateOperations);
  // ... 新增新 prompt
});
```

### 批次處理多個資料夾
```typescript
const promptsByFolder = groupPromptsByFolderId(allPromptsSnapshot.docs);

for (const [folderId, prompts] of promptsByFolder) {
  const sorted = await performLazyMigration(prompts, {
    mode: 'batch',
    folderId,
    userId
  });
}
```

## 效能優化

1. **最小化資料庫操作**：只更新真正需要的 prompts
2. **智慧排序**：先檢查是否需要遷移，避免不必要的操作
3. **批次處理**：支援 batch 和 transaction 兩種高效模式
4. **記憶體優化**：避免不必要的陣列複製

## 測試建議

1. **單元測試**：每個函式都應有對應的單元測試
2. **整合測試**：測試 API 端點的完整流程
3. **效能測試**：測試大量資料的處理效能
4. **邊界測試**：測試空陣列、缺失 seqNo 等邊界情況

## 遷移步驟

1. ✅ 建立新的 `promptUtils.ts` 檔案
2. ✅ 更新 API 路由檔案的匯入
3. ⏳ 更新其他使用舊函式的檔案
4. ⏳ 移除舊的 `promptMigration.ts` 和 `seqNoManager.ts`
5. ⏳ 新增測試案例
6. ⏳ 更新相關文件

## 向後相容性

目前的 API 回應格式保持不變，確保前端程式碼無需修改。
