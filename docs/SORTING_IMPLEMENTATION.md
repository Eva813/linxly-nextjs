# Prompt 排序功能實作總結

## 🎯 解決的問題

✅ **穩定排序**: 解決重新整理後 Prompt 順序錯亂的問題  
✅ **Lazy Migration**: 自動為舊資料補上 seqNo 欄位  
✅ **智能插入**: 支援在任意位置插入新 Prompt  
✅ **批次重寫**: 提供完整重新排序功能  
✅ **效能最佳化**: 使用 Firestore 交易和索引提升效能  

## 📁 檔案修改清單

### 後端 API 更新
- ✅ `/src/types/prompt.ts` - 新增 `seqNo?` 欄位
- ✅ `/src/app/api/v1/prompts/route.ts` - 實作 Lazy Migration 和插入邏輯
- ✅ `/src/app/api/v1/prompts/[promptId]/route.ts` - 支援 seqNo 回傳
- ✅ `/src/app/api/v1/prompts/batch/route.ts` - 新建批次重寫端點

### 前端 Store 更新
- ✅ `/src/api/prompts.ts` - 新增 `batchRewritePrompts` API 函式
- ✅ `/src/stores/prompt/slices/promptSlice.ts` - 新增 `reorderPrompts` 方法

### 測試和工具
- ✅ `/src/test/sorting-test.ts` - API 測試腳本
- ✅ `/src/test/sort-validation.ts` - 排序邏輯驗證
- ✅ `/src/app/test-sorting/page.tsx` - 測試展示頁面
- ✅ `/src/app/api/v1/test/sorting/route.ts` - 測試 API 端點

### 設定檔案
- ✅ `/firestore.indexes.json` - Firestore 索引設定
- ✅ `/docs/firestore-indexes.md` - 索引設定說明

## 🔧 核心功能詳解

### 1. Lazy Migration（自動升級）
```typescript
// 當使用者 GET prompts 時，自動檢查並補齊 seqNo
if (hasPromptWithoutSeqNo && prompts.length > 0) {
  // 按 createdAt 排序後補上 seqNo
  await transaction.update(promptRef, { seqNo: i + 1 });
}
```

### 2. 智能插入邏輯
```typescript
// 支援 afterPromptId 參數，後端自動處理排序
POST /api/v1/prompts
{
  "folderId": "folder-123",
  "afterPromptId": "prompt-456", // 插入位置
  "name": "新提示",
  "content": "內容",
  "shortcut": "/new"
}
```

### 3. 穩定排序算法
```typescript
prompts.sort((a, b) => {
  // 1. 優先按 seqNo 排序
  if (a.seqNo !== null && b.seqNo !== null) {
    return a.seqNo - b.seqNo;
  }
  // 2. 有 seqNo 的排在前面
  if (a.seqNo !== null) return -1;
  if (b.seqNo !== null) return 1;
  // 3. 都沒有時按 createdAt 排序
  return aTime - bTime;
});
```

### 4. 批次重寫策略
```typescript
// 當需要插入或重新排序時，採用批次重寫
// 1. 刪除所有現有 prompts
// 2. 按新順序重新建立，分配連續的 seqNo
await batchRewritePrompts(folderId, reorderedPrompts);
```

## 🚀 使用方式

### 前端呼叫（無需修改現有程式碼）
```typescript
// 新增 prompt（自動處理排序）
const newPrompt = await addPromptToFolder(
  targetFolderId,
  promptData,
  afterPromptId // 可選的插入位置
);

// 手動重新排序
await reorderPrompts(folderId, newOrder);
```

### API 端點
```bash
# 獲取排序後的 prompts（自動 Lazy Migration）
GET /api/v1/prompts?folderId=xxx

# 新增 prompt（支援插入位置）
POST /api/v1/prompts
{
  "folderId": "xxx",
  "afterPromptId": "yyy", // 可選
  "name": "...",
  "content": "...",
  "shortcut": "..."
}

# 批次重寫排序
POST /api/v1/prompts/batch
{
  "folderId": "xxx",
  "prompts": [...]
}
```

## 📊 測試

### 本地測試
訪問 `/test-sorting` 頁面進行功能測試：
- 🧪 **排序邏輯驗證**: 測試各種排序情境
- 🌐 **API 測試**: 測試實際 API 呼叫

### 測試覆蓋範圍
- ✅ 全部有 seqNo 的資料排序
- ✅ 混合有無 seqNo 的資料排序
- ✅ 全部沒有 seqNo 的備用排序
- ✅ 邊界案例（0, 負數, 大數值）
- ✅ Lazy Migration 自動升級
- ✅ 插入位置計算
- ✅ 批次重寫功能

## ⚡ 效能考量

### 資料庫最佳化
- 🔍 **複合索引**: `folderId + userId + seqNo`
- 🔄 **交易處理**: 確保資料一致性
- 📦 **批次操作**: 減少網路請求

### 前端最佳化
- 🎯 **智能刷新**: 只在必要時重新獲取資料
- 💾 **本地狀態**: 利用 Zustand store 快取
- 🔄 **樂觀更新**: 立即更新 UI，背景同步

## 🛡️ 錯誤處理

- ✅ 驗證資料夾存在性
- ✅ 檢查 afterPromptId 有效性
- ✅ 交易失敗自動回滾
- ✅ 詳細錯誤記錄和回饋
- ✅ 優雅降級（createdAt 備用排序）

## 🔮 未來擴充

### 可能的改進方向
1. **拖拽排序**: 前端拖拽介面
2. **批次選取**: 多選移動功能
3. **資料夾間移動**: 跨資料夾 prompt 移動
4. **歷史記錄**: 排序變更歷史追蹤
5. **效能監控**: 排序操作效能追蹤

### 架構考量
- 🏗️ **微服務化**: 將排序邏輯抽離為獨立服務
- 📈 **擴展性**: 支援更大規模的資料量
- 🔒 **權限控制**: 細粒度的排序權限管理

---

## 🎉 完成狀態

所有核心功能已實作完成，目前系統具備：
- **穩定可靠的排序機制**
- **向後相容的自動升級**
- **高效能的批次處理**
- **完整的測試覆蓋**

現在您可以享受一致且穩定的 Prompt 排序體驗！ 🚀
