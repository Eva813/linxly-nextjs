# Folder API 重構總結

## 重構目標

本次重構主要解決了以下問題：
1. **N+1 查詢問題**：`folders/route.ts` 中的效能瓶頸
2. **程式碼重複**：Lazy Migration 邏輯在兩個檔案中重複
3. **職責混亂**：讀取和寫入操作混合在同一個函式中

## 重構成果

### 1. 建立共用工具函式 (`src/lib/utils/promptMigration.ts`)

#### 核心函式：
- `handleLazyMigration()`: 處理 seqNo 的懶人遷移邏輯
- `sortPromptsBySeqNo()`: 根據 seqNo 排序 prompts
- `formatPromptsForResponse()`: 格式化 API 回應資料
- `groupPromptsByFolderId()`: 將 prompts 按 folderId 分組

#### 優點：
- **DRY 原則**：消除重複程式碼
- **單一職責**：每個函式只負責一個特定任務
- **型別安全**：使用 TypeScript 介面確保資料一致性
- **錯誤處理**：集中化的錯誤處理邏輯

### 2. 最佳化 `folders/route.ts` 

#### 改進前（N+1 問題）：
```typescript
// 1 次查詢獲取 folders
const foldersSnapshot = await query.get();

// N 次查詢獲取每個 folder 的 prompts（N = folder 數量）
const result = await Promise.all(foldersSnapshot.docs.map(async (folderDoc) => {
  const promptsSnapshot = await adminDb
    .collection('prompts')
    .where('folderId', '==', folderId)
    .get(); // 這裡會執行 N 次
}));
```

#### 改進後（最佳化查詢）：
```typescript
// 同時執行 2 次查詢：folders + 所有 prompts
const [foldersSnapshot, promptsSnapshot] = await Promise.all([
  adminDb.collection('folders').where('userId', '==', userId).get(),
  adminDb.collection('prompts').where('userId', '==', userId).get()
]);

// 在記憶體中分組和組合資料
const promptsMap = groupPromptsByFolderId(promptsSnapshot.docs);
```

#### 效能提升：
- **查詢次數**：從 `1 + N` 次減少到 `2` 次
- **延遲降低**：大幅減少網路往返時間
- **費用節省**：Firestore 讀取次數顯著減少

### 3. 簡化 `folders/[folderId]/route.ts`

#### 改進：
- 移除重複的 Lazy Migration 邏輯
- 使用共用的工具函式
- 改善程式碼可讀性和維護性

## 使用範例

### 獲取所有資料夾（已最佳化）
```typescript
// GET /api/v1/folders
// 現在只需要 2 次資料庫查詢，無論有多少個資料夾
```

### 獲取單一資料夾
```typescript
// GET /api/v1/folders/{folderId}
// 使用共用的 Lazy Migration 邏輯
```

## 向後相容性

✅ **完全向後相容**
- API 回應格式保持不變
- 前端程式碼無需修改
- 資料庫結構無需變更

## 效能預估

假設一個使用者有 20 個資料夾：

### 改進前：
- **資料庫查詢**：21 次（1 + 20）
- **網路延遲**：~2.1 秒（假設每次查詢 100ms）
- **Firestore 費用**：21 次讀取

### 改進後：
- **資料庫查詢**：2 次
- **網路延遲**：~200ms（2 次並行查詢）
- **Firestore 費用**：2 次讀取

**改善比例**：
- 查詢次數：**減少 90.5%**
- 響應時間：**減少 90%**
- 成本：**減少 90.5%**

## 程式碼品質提升

1. **可維護性**：集中化的邏輯更容易維護和更新
2. **可測試性**：獨立的工具函式更容易進行單元測試
3. **可讀性**：清晰的函式命名和職責分離
4. **擴展性**：新的功能可以輕鬆重用現有的工具函式

## 後續建議

### 1. 監控和測試
- 在生產環境中監控 API 響應時間
- 比較重構前後的效能指標
- 建立自動化測試來驗證功能正確性

### 2. 進一步最佳化機會
- 考慮實作快取機制（Redis）
- 使用 Firestore 的 `orderBy` 查詢來減少記憶體排序
- 實作分頁機制處理大量資料

### 3. 錯誤處理改進
- 增加更詳細的錯誤記錄
- 實作重試機制處理暫時性失敗
- 增加資料驗證邏輯

這次重構不僅解決了當前的效能問題，也為未來的功能擴展奠定了良好的基礎。
