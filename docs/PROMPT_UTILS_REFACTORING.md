# Prompt 工具函式庫 (`promptUtils.ts`) 設計與重構

## 1. 重構目標

將原先分散在 `promptMigration.ts` 和 `seqNoManager.ts` 的程式碼統一整合至 `src/server/utils/promptUtils.ts`，旨在解決以下核心問題：

- **效能瓶頸**：在插入新的 Prompt 時，採用「刪除所有 -> 重新建立所有」的低效策略。
- **程式碼重複**：排序邏輯、`seqNo` 檢查邏輯在多處重複。
- **職責混亂**：`seqNo` 的順序管理與通用的資料處理（如格式化、分組）邏輯混雜。
- **型別不一致**：缺乏統一的 `PromptData` 介面和 API 回應型別。

## 2. 核心函式與職責劃分

重構後，`promptUtils.ts` 內部職責清晰，主要分為兩大類：

#### **SeqNo 管理相關**
- `sortPromptsBySeqNo()`: 基礎排序函式。
- `hasPromptsWithoutSeqNo()`: 檢查是否需要執行懶人遷移。
- `normalizePromptSequence()`: 對 `prompts` 進行排序並補全 `seqNo`。
- `performLazyMigration()`: 統一的懶人遷移函式，支援 `batch` 和 `transaction` 兩種模式。
- `calculateInsertStrategy()`: **[效能關鍵]** 計算插入新 Prompt 時，需要更新的最小集。
- `executeSeqNoUpdates()`: 在資料庫交易中執行 `seqNo` 的更新操作。
- `getMaxSeqNo()`: 高效獲取指定資料夾中最大的 `seqNo`。

#### **資料處理相關**
- `groupPromptsByFolderId()`: 將 `prompts` 陣列按 `folderId` 分組為 Map。
- `formatPromptsForResponse()`: 將後端資料格式化為前端需要的 API 回應格式。
- `mapFirestoreDocToPromptData()`: 將 Firestore 文件安全地轉換為 `PromptData` 型別。

## 3. 主要改進與效能提升

### 3.1. 插入操作的根本性優化

這是本次重構的核心效能提升點，我們將其從「推倒重建」的蠻力方法，進化為「精準位移」的方法。

- **舊方案**：插入一個 Prompt 需要 `2N+1` 次資料庫操作（N 次刪除 + N+1 次建立），交易失敗風險極高。
- **新方案**：利用 `calculateInsertStrategy`，只更新插入點之後的 `M` 個 Prompts (`M < N`)，加上 1 次建立操作。

| 插入位置 | 舊方案操作數 | 新方案操作數 | 效能提升 |
| :--- | :--- | :--- | :--- |
| 列表頭部 | `2N+1` | `N+1` | ~50% |
| 列表中間 | `2N+1` | `~N/2+1` | ~75% |
| 列表尾部 | `2N+1` | **`1`** | **~99%** |

#### 3.1.1. 範例：在列表中間插入

場景設定
  假設在資料庫中，我們有一個資料夾，裡面有 5 個 Prompt，它們的順序由 seqNo (sequence
  number) 決定：
  ┌─────────────┬───────┐
  │ Prompt 名稱  │ seqNo │
  ├─────────────┼───────┤
  │ Prompt A    │ 1     │
  │ Prompt B    │ 2     │
  │ Prompt C    │ 3     │
  │ Prompt D    │ 4     │
  │ Prompt E    │ 5     │
  └─────────────┴───────┘
現在，我們的目標是在 "Prompt B" 和 "Prompt C" 之間，插入一個新的 "Prompt X"。
  理想的最終結果應該是：

  ┌─────────────┬───────┐
  │ Prompt 名稱 │ seqNo │
  ├─────────────┼───────┤
  │ Prompt A    │ 1     │
  │ Prompt B    │ 2     │
  │ Prompt X    │ 3     │
  │ Prompt C    │ 4     │
  │ Prompt D    │ 5     │
  │ Prompt E    │ 6     │
  └─────────────┴───────┘

**舊方案 (推倒重建):**
  舊的邏輯非常簡單粗暴，它會這樣做：

   1. 刪除操作 (5 次)：為了避免 seqNo 衝突，系統會先將資料庫中從 C 到 E 的所有
      Prompts 全部刪除。在某些更極端的實作中，甚至會刪除 A 到 E 的全部 5 個
      Prompts。
   2. 建立操作 **重新建立**  (4 次)：然後，系統會重新建立 Prompt X, C, D, E，並賦予它們新的 seqNo
      (3, 4, 5, 6)。

  總操作數：在這個例子中，至少是 3 次刪除 + 4 次建立 = 7 次
  資料庫操作。如果實作是刪除全部，那就是 5 次刪除 + 6 次建立 = 11 次 操作。文件的
  2N+1 是對這種最壞情況的估算。

  缺點：
   * 極度低效：資料庫操作非常多，網路延遲高。
   * 風險極高：這麼多操作需要放在一個「交易
     (Transaction)」中，只要其中一步失敗，整個操作都要復原，交易失敗的機率大增。

3.  這會導致大量的資料庫刪除和建立操作，效能低且風險高。

**新方案 (精準位移):**
做絕對必要的操作。這完全依賴 `calculateInsertStrategy` 這個函式。
當我們告訴 API「我要在 Prompt B 之後插入 Prompt X」時，後端會這樣做：

   1. 第一步：計算策略 (在記憶體中完成，0 次資料庫操作)
       * API 會呼叫 calculateInsertStrategy 函式，並傳入目前的 Prompts 列表和
         afterPromptId: "Prompt B 的 ID"。
       * 函式內部邏輯：
           * 它找到 Prompt B，看到它的 seqNo 是 2。
           * 它立刻確定，新的 Prompt X 的 `seqNo` 應該是 `3`。
           * 接著，它找出所有 seqNo >= 3 的 Prompts，也就是 Prompt C, D, 
             E。這些是唯一需要被「往後推」的項目。
           * 它產生一個「更新計畫」：
               * Prompt C: seqNo 從 3 -> 4
               * Prompt D: seqNo 從 4 -> 5
               * Prompt E: seqNo 從 5 -> 6
       * 函式回傳這個「更新計畫」和新 Prompt X 的 seqNo。

   2. 第二步：執行交易 (4 次資料庫操作)
       * API 啟動一個資料庫交易。
       * 在交易中，它只執行剛剛計算出的最小化操作：
           * 更新 Prompt C 的 seqNo 為 4。(1 次 update)
           * 更新 Prompt D 的 seqNo 為 5。(1 次 update)
           * 更新 Prompt E 的 seqNo 為 6。(1 次 update)
           * 建立 新的 Prompt X，seqNo 為 3。(1 次 create)
       * 提交交易。

  總操作數：3 次更新 + 1 次建立 = 4 次 資料庫操作。

  結論與對照表格

  現在我們來對照文件中的表格：


  ┌────────────────┬─────────────────────┬──────────────┬──────────┐
  │ 插入位置         │ 舊方案操作數 (2N+1)   │ 新方案操作數  │ 效能提升     │
  ├────────────────┼─────────────────────┼──────────────┼──────────┤
  │ 列表中間 (N=5)   │ 11                  │ 4            │ ~75%      │
  └────────────────┴─────────────────────┴──────────────┴──────────┘


  你看，這就是優化的魔力所在。我們把一個與列表總長度 N
  相關的複雜操作，變成了一個只與「插入點之後的項目數量」相關的簡單操作。

   - 如果插入到列表尾部，後面沒有任何項目需要移動，所以新方案只需要 1 次 create
     操作，效能提升達到極致的 ~99%。
   - 如果插入到列表頭部，所有現有項目都需要向後移動，新方案需要 N 次 update 和 1 次
     create，總共 N+1 次操作，相比舊的 2N+1 次，效能也提升了將近 50%。

### 操作流程
1.  **計算 (記憶體中)**: `calculateInsertStrategy` 被呼叫，它會：
    -   確定新項目的 `seqNo` 應為 `3`。
    -   找出所有 `seqNo >= 3` 的項目 (C, D, E...)。
    -   產生一個「更新計畫」：將這些找出的項目 `seqNo` 各加 `1`。
2.  **執行 (資料庫中)**: 在一個交易內，執行最小化的操作：
    -   **更新** C, D, E 的 `seqNo`。
    -   **建立** 新的 Prompt X，`seqNo` 為 `3`。

這個方法將一個與列表總長度 `N` 相關的複雜操作，優化為一個只與「插入點之後的項目數量」相關的簡單操作，極大地提升了效能和穩定性。

#### 3.1.2. 範例：在列表尾部新增 (Append)                               
這是效能最佳的情況。當我們要在列表最後新增一個項目時：

1.  **計算**：`calculateInsertStrategy`
    發現插入點之後**沒有任何現有項目**。
2.  **執行**：因此，「更新計畫」是空的，資料庫**只需要執行 1 次 `create` 操作**來新增項目。這解釋了為何效能提升能達到~99%。

#### 3.1.3. 範例：在列表頭部新增                                        

這是對新方案壓力最大的測試，但效能依然遠超舊方案：

1.  **計算**：`calculateInsertStrategy`發現**所有現有項目**都需要被移動。
2.  **執行**：「更新計畫」會包含對所有 `N` 個現有項目的 `update` 操作，再加上 1 次 `create` 操作，總共 `N+1` 次操作。相比舊方案的 `2N+1` 次，操作數幾乎減半。


### 3.2. 穩定性與安全性提升

- **降低 Race Condition**：交易範圍更小、執行時間更短，顯著降低了併發寫入時的衝突機率。
- **精準的錯誤處理**：`calculateInsertStrategy` 能夠在傳入無效的 `afterPromptId` 時拋出特定錯誤，讓 API 層可以進行精準的 `404` 回應。
- **原子性操作**：所有 `seqNo` 的變更都在一個資料庫交易中完成，確保了資料的最終一致性。

### 3.3. 靈活性與可維護性

- **模式切換**：`performLazyMigration` 支援 `batch`（用於讀取）和 `transaction`（用於寫入）兩種模式，提高了函式的重用性。
- **職責清晰**：`seqNo` 管理和資料處理的邏輯分離，讓程式碼更容易理解、測試和擴展。

## 4. 使用指南

### **讀取 API (`GET`)**
在 `GET` 請求中，主要使用 `performLazyMigration` 進行資料的懶人遷移和排序。

```typescript
// src/app/api/v1/folders/route.ts
const sortedPrompts = await performLazyMigration(prompts, {
  mode: 'batch', // 讀取操作使用 batch 模式
  folderId,
  userId
});
return formatPromptsForResponse(sortedPrompts);
```

### **寫入 API (`POST`, `PUT`)**
在 `POST`（建立）請求中，組合使用 `calculateInsertStrategy` 和 `executeSeqNoUpdates` 來實現高效插入。

```typescript
// src/app/api/v1/prompts/route.ts
await adminDb.runTransaction(async (transaction) => {
  // 1. 計算最小更新策略
  const { updateOperations, insertSeqNo } = calculateInsertStrategy(existingPrompts, afterPromptId);
  
  // 2. 在交易中執行更新
  await executeSeqNoUpdates(transaction, updateOperations);
  
  // 3. 插入新文件
  transaction.create(newPromptRef, { ...newPromptData, seqNo: insertSeqNo });
});
```

## 5. 遷移狀態

- ✅ **已完成**: `promptUtils.ts` 已建立，並整合了所有相關邏輯。
- ✅ **已完成**: 所有 API 路由（`folders`, `prompts`）都已更新，並使用 `promptUtils.ts`。
- ✅ **已完成**: 舊的 `promptMigration.ts` 和 `seqNoManager.ts` 檔案已被移除。
- ✅ **已完成**: `src/test/seqno-optimization-test.ts` 中已包含對核心邏輯的單元測試。

**結論**：本次重構已全面完成，API 回應格式保持向後相容，前端程式碼無需修改。
