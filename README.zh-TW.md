# PromptBear - Prompt 管理平台

正體中文 | [English](./README.md)  

## 介紹

PromptBear 是一款專為管理 Prompt 而設計的平台，讓使用者能夠高效地建立、編輯與組織各類 Prompt。透過整合 Chrome 擴充功能，使用者可隨時隨地快速存取並應用 Prompt，提升效率。

## 核心功能

### Prompt 管理功能

- **結構化 Prompt 資料夾**：透過資料夾系統組織大量 prompt，方便快速查找和管理。
- **快速鍵支援**：為常用 prompt 設定快速鍵，加速工作流程。
- **Prompt 模板**：內建可複用模板與自訂欄位，快速套用常用提示結構。

### 互動式編輯功能

- **參數化 Prompt**：支援挖空填充功能，使用者可在提示中定義變數，並透過下拉選項或輸入框快速填入，提升 prompt 客製化效率。
- **多樣參數選項**：提供下拉選單、單選/多選按鈕與開關切換，讓提示參數化，更靈活地根據不同情境調整設定。
- **Rich Text 編輯**：支援格式化文字、清單、程式碼區塊等多種格式，讓 prompt 編輯更加靈活。


### 其他應用

- **Chrome 擴充功能整合**：支援與 Chrome 擴充功能連動，可在任何網站上快速存取和應用您的 prompt。

## 技術架構

PromptBear 主要使用以下技術：

- **前端框架**：使用 Next.js 建構應用程式，結合 React 提供高效能的使用者介面。
- **類型安全**：使用 TypeScript 增強程式碼的可維護性和可靠性。
- **UI 元件**：採用 Shadcn UI 元件庫，提供現代化且一致的使用者介面。
- **身份驗證**：使用 NextAuth.js 實現安全的用戶登入與驗證系統。

## 開始使用

### 安裝

1. 複製專案儲存庫：

```bash
git clone https://github.com/yourusername/..
cd promptbear
```

2. 安裝相關依賴套件：

```bash
npm install
```

3. 建立 `.env.local` 檔案，並設定必要環境變數：

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

4. 啟動開發伺服器：

```bash
npm run dev
```

5. 開啟瀏覽器並造訪 http://localhost:3000，開始使用 PromptBear。

### 新手指南

1. **建立帳號**：首次使用時，請點擊「註冊」建立您的帳號。
2. **建立資料夾**：在「Prompts」頁面中建立新資料夾，用於組織您的 prompt。
3. **建立 Prompt**：在資料夾中建立新的 prompt，可以使用自訂的模板或從頭開始編寫。
5. **參數化**：在 prompt 中加入變數欄位，讓您的 prompt 更加靈活與可重用。

## 持續更新

PromptBear 團隊持續開發新功能與改進，未來將推出：

- AI 輔助 prompt 優化建議
  - 擴充第三方 AI 模型整合
- 團隊協作功能
- 更多客製化模板
- **提示分享**：透過連結或匯出功能與團隊成員分享有效的 prompt。
- 視覺化流程編輯:
- **流程圖編輯器**：使用拖拉方式建立節點與連線，視覺化 prompt 之間的關係與流程。
- **多種節點類型**：
  - 文字輸入節點：用於建立基本的文字型 prompt。
  - AI 提示節點：包含預設的 AI 提示模板，可快速套用。
  - 檔案上傳節點：支援從檔案讀取文字內容作為 prompt 的一部分。


## 部署

推薦使用 [Vercel 平台](https://vercel.com/) 部署此 Next.js 應用程式：

1. 在 Vercel 上導入您的 GitHub 項目。
2. 設定所需的環境變數。
3. 部署


## 授權

MIT License