# Folder API 設計與效能優化

## 1. 核心問題

舊版的 `GET /api/v1/folders` API 存在嚴重的 **N+1 查詢問題**，導致前端在讀取資料夾列表時效能低下。

- **N+1 問題**：1 次查詢獲取所有 `folders`，接著為每個 `folder` 執行 1 次查詢來獲取其對應的 `prompts`，總共 `1 + N` 次資料庫讀取。
- **職責混亂**：資料處理、排序和懶人遷移（Lazy Migration）的邏輯散落在各處，難以維護。

## 2. 優化策略

### 2.1. 解決 N+1 問題

我們將查詢邏輯從「循序執行」改為「平行批次處理」，大幅減少了資料庫的讀取次數。

#### **改進前（N+1 問題）**
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

#### **改進後（2 次平行查詢）**
```typescript
// 在 src/app/api/v1/folders/route.ts 中

// 1. 權限驗證 (約 1-2 次查詢)
// ... 檢查使用者對 promptSpace 的存取權限 ...

// 2. 平行獲取主要資料 (2 次查詢)
const [foldersSnapshot, promptsSnapshot] = await Promise.all([
  adminDb.collection('folders').where('userId', '==', spaceOwnerId).get(),
  adminDb.collection('prompts').where('userId', '==', spaceOwnerId).get()
]);

// 3. 在記憶體中進行資料分組和處理
const promptsMap = groupPromptsByFolderId(promptsSnapshot.docs);
// ... 後續處理 ...
```

#### **效能提升**
- **查詢次數**：從 `1 + N` 次顯著減少到固定的 `~4` 次（權限驗證 + 主要資料）。
- **延遲降低**：大幅減少網路往返時間，提升 API 回應速度。
- **費用節省**：Firestore 讀取成本顯著降低。

### 2.2. 建立共用工具函式

為了提高程式碼的重用性和可維護性，我們將所有與 Prompt 相關的資料處理邏輯集中到 `src/server/utils/promptUtils.ts`。

#### **核心函式**
- `groupPromptsByFolderId()`: 將 `prompts` 陣列轉換為以 `folderId` 為鍵的 Map，方便在記憶體中快速查找。
- `performLazyMigration()`: 處理 `prompts` 的 `seqNo` 懶人遷移邏輯，確保資料排序的正確性。
- `formatPromptsForResponse()`: 格式化 API 回應中的 `prompts` 資料結構。

#### **優點**
- **DRY 原則**：消除重複程式碼，集中管理資料處理邏輯。
- **單一職責**：每個函式只負責一個特定任務，易於理解和測試。
- **型別安全**：利用 TypeScript 確保資料在處理過程中的一致性。

## 3. API 端點說明

### `GET /api/v1/folders`
- **功能**：根據傳入的 `promptSpaceId`，獲取該空間下所有的資料夾及其包含的 prompts。
- **優化**：已採用上述的平行查詢策略，解決了 N+1 問題。
- **權限**：會驗證使用者是否為 `promptSpace` 的擁有者或被分享者。

### `POST /api/v1/folders`
- **功能**：在指定的 `promptSpaceId` 下建立一個新的資料夾。
- **權限**：會驗證使用者是否擁有該 `promptSpace` 的編輯權限。

**注意**：原有的 `GET /api/v1/folders/[folderId]` 端點已被移除。前端現在透過一次性獲取所有資料夾的方式來取得單一資料夾的資訊，以簡化流程並提升效能。

## 4. 向後相容性

✅ **完全向後相容**
- API 的公開合約（Request & Response）保持不變。
- 前端程式碼無需進行任何修改。

## 5. 後續建議

- **監控與警報**：在生產環境中持續監控此 API 的響應時間和錯誤率。
- **快取機制**：對於不常變動的 `promptSpace`，可以考慮在 API 層加入快取（如 Redis）以進一步提升效能。
- **單元測試**：為 `promptUtils.ts` 中的共用函式撰寫單元測試，確保其穩定性。

這次重構不僅解決了當前的效能瓶頸，也為未來的功能擴展（如更複雜的權限管理）奠定了清晰、可維護的程式碼基礎。