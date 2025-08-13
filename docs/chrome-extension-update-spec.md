# Chrome Extension 更新規格 - PromptBear 後台整合

## 概述

PromptBear 後台已重構 Extension 整合架構，從複雜的前端 URL 參數處理改為簡潔的 API 端點調用。Chrome Extension 需要更新以使用新的 API 端點。

## 背景

### 舊架構問題
- 複雜的 URL 參數傳遞和前端處理邏輯
- React 重渲染導致的重複執行和重複創建 prompt 問題
- 導航跳轉失敗，特別是在更改 default prompt space 後

### 新架構優勢  
- 直接 API 調用，避免前端複雜邏輯
- 消除重渲染問題
- 統一的錯誤處理和認證機制
- 更可靠的 prompt 創建流程

## API 端點

### POST `/api/v1/extension/create-prompt`

**認證要求:**
- 需要在 request header 中包含 `x-user-id`

**請求參數:**
```json
{
  "content": "string (required) - 頁面內容，最大 10,000 字符",
  "pageTitle": "string (required) - 頁面標題，最大 200 字符", 
  "pageUrl": "string (required) - 頁面 URL，必須是有效的 URL 格式",
  "promptSpaceId": "string (required) - Prompt Space ID",
  "folderId": "string (optional) - 目標 Folder ID，如未指定則使用該 space 的第一個 folder"
}
```

**回應格式:**

成功 (201):
```json
{
  "id": "prompt-uuid",
  "name": "頁面標題",
  "content": "處理後的內容，包含來源資訊",
  "shortcut": "/webPrompt",
  "seqNo": 1
}
```

錯誤回應:
```json
{
  "message": "error description"
}
```

**狀態碼:**
- `201` - 創建成功
- `400` - 參數錯誤
- `401` - 未認證
- `403` - 權限不足
- `404` - Folder 或 Space 不存在
- `500` - 服務器錯誤

## Chrome Extension 需要的更改

### 1. 移除 URL 重定向邏輯

**移除以下功能:**
- URL 參數構建 (`triggerNew`, `content`, `source`, `pageUrl`, `pageTitle`, `spaceId`)
- 重定向到 PromptBear 網站的邏輯
- 複雜的 URL 編碼處理

### 2. 實現 API 調用

**新增功能:**
```javascript
// 示例實現
async function createPrompt(content, pageTitle, pageUrl, promptSpaceId, folderId = null) {
  try {
    const response = await fetch('https://your-domain.com/api/v1/extension/create-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId() // 需要實現獲取用戶 ID 的函數
      },
      body: JSON.stringify({
        content,
        pageTitle,
        pageUrl,
        promptSpaceId,
        folderId
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create prompt');
    }

    const prompt = await response.json();
    return prompt;
  } catch (error) {
    console.error('Error creating prompt:', error);
    throw error;
  }
}
```

### 3. 用戶認證處理

**必須實現:**
- 獲取已登入用戶的 User ID
- 在 API 調用中包含 `x-user-id` header
- 處理未認證狀態 (401 錯誤)

### 4. 錯誤處理

**需要處理的錯誤情況:**
- 用戶未登入 (401)
- 無效的 Space ID 或 Folder ID (404)
- 網絡連接問題
- 服務器錯誤 (500)

### 5. 用戶體驗改進

**建議實現:**
- 成功創建 prompt 後，提供選項跳轉到新創建的 prompt
- 顯示創建進度指示器
- 提供錯誤消息的用戶友好提示

### 6. 跳轉邏輯 (可選)

如需在創建 prompt 後跳轉到 PromptBear:
```javascript
// 創建成功後跳轉
const prompt = await createPrompt(content, title, url, spaceId);
window.open(`https://your-domain.com/prompts/prompt/${prompt.id}`, '_blank');
```

## 測試驗證

### 測試步驟
1. 確保用戶已登入 PromptBear
2. 在任意網頁上觸發 Extension 的 "Add to PromptBear" 功能
3. 驗證 API 調用成功
4. 確認 prompt 已在指定的 Space 和 Folder 中創建
5. 驗證 prompt 內容包含正確的來源資訊

### 測試場景
- 指定 folderId 的情況
- 不指定 folderId，使用 default folder 的情況
- 不同 promptSpaceId 的情況
- 錯誤處理 (無效 ID、網絡錯誤等)

## 內容處理

新 API 會自動處理以下內容格式化:
- 清理 HTML 標籤和危險字符
- 限制內容長度 (10,000 字符)
- 限制標題長度 (200 字符)
- 自動添加來源資訊格式:
```
[用戶內容]

---
來源：頁面標題
網址：頁面URL
```

## 遷移檢查清單

- [ ] 移除舊的 URL 重定向邏輯
- [ ] 實現新的 API 調用函數
- [ ] 實現用戶認證和 User ID 獲取
- [ ] 實現錯誤處理機制
- [ ] 測試各種使用情境
- [ ] 更新 Extension 版本號
- [ ] 準備發布更新

## 注意事項

1. **向後兼容性**: 舊的 URL 參數方式已完全移除，不支援向後兼容
2. **認證要求**: 必須確保用戶已登入才能使用 Extension 功能
3. **Space 管理**: Extension 需要知道用戶的 default prompt space 或讓用戶選擇目標 space
4. **網絡錯誤**: 實現適當的重試機制和錯誤提示

## 支援

如有技術問題，請參考:
- API 端點實現: `/src/app/api/v1/extension/create-prompt/route.ts`
- 相關的 Firestore 操作: `/src/server/utils/promptUtils.ts`