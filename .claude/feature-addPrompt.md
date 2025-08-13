Chrome Extension "Add to PromptBear" 功能開發文檔     │ │
│ │                                                       │ │
│ │ 功能概述                                              │ │
│ │                                                       │ │
│ │ 業務需求                                              │ │
│ │                                                       │ │
│ │ 用戶在瀏覽網頁時，可以選取任何文字片段，通過右鍵選單  │ │
│ │ 的「Add to PromptBear」功能，直接將該文字儲存到       │ │
│ │ PromptBear 系統中，並自動包含來源頁面資訊。           │ │
│ │                                                       │ │
│ │ 用戶流程                                              │ │
│ │                                                       │ │
│ │ 1. 用戶在任何網頁選取文字                             │ │
│ │ 2. 右鍵點擊選取的文字，選擇「Add to PromptBear」      │ │
│ │ 3. 系統自動跳轉到 PromptBear 後台                     │ │
│ │ 4. 選取的文字和來源資訊已預填在新增 Prompt 表單中     │ │
│ │ 5. 用戶可編輯內容後儲存                               │ │
│ │                                                       │ │
│ │ Chrome Extension 已完成的功能                         │ │
│ │                                                       │ │
│ │ 1. 資料收集                                           │ │
│ │                                                       │ │
│ │ - ✅ 選取的文字內容                                    │ │
│ │ - ✅ 來源頁面 URL                                      │ │
│ │ - ✅ 來源頁面標題                                      │ │
│ │ - ✅ 用戶登入狀態驗證                                  │ │
│ │                                                       │ │
│ │ 2. 智能目標選擇                                       │ │
│ │                                                       │ │
│ │ - ✅ 自動選擇用戶的預設 Space                          │ │
│ │ - ✅ 自動選擇該 Space 的第一個 Folder                  │ │
│ │ - ✅ 錯誤時回退到 folders/all 頁面                     │ │
│ │                                                       │ │
│ │ 3. URL 跳轉格式                                       │ │
│ │                                                       │ │
│ │ 成功案例：                                            │ │
│ │ https://your-domain.com/folders/{folderId}?triggerNew │ │
│ │ =true&content={encodedContent}&source=extension&pageU │ │
│ │ rl={encodedPageUrl}&pageTitle={encodedPageTitle}      │ │
│ │                                                       │ │
│ │ 回退案例：                                            │ │
│ │ https://your-domain.com/folders/all?triggerNew=true&c │ │
│ │ ontent={encodedContent}&source=extension&pageUrl={enc │ │
│ │ odedPageUrl}&pageTitle={encodedPageTitle}             │ │
│ │                                                       │ │
│ │ 後台需要實作的功能規格                                │ │
│ │                                                       │ │
│ │ 1. 路由參數處理                                       │ │
│ │                                                       │ │
│ │ 1.1 URL 參數識別                                      │ │
│ │                                                       │ │
│ │ 位置： /folders/[folderId] 和 /folders/all 頁面       │ │
│ │                                                       │ │
│ │ 需要處理的參數：                                      │ │
│ │ - triggerNew=true - 觸發新增模式                      │ │
│ │ - content - URL編碼的選取文字內容                     │ │
│ │ - source=extension - 來源標識                         │ │
│ │ - pageUrl - URL編碼的來源頁面網址                     │ │
│ │ - pageTitle - URL編碼的來源頁面標題                   │ │
│ │                                                       │ │
│ │ 1.2 參數解碼                                          │ │
│ │                                                       │ │
│ │ // 示例實作                                           │ │
│ │ const searchParams = new                              │ │
│ │ URLSearchParams(window.location.search);              │ │
│ │ const triggerNew = searchParams.get('triggerNew') === │ │
│ │  'true';                                              │ │
│ │ const content =                                       │ │
│ │ decodeURIComponent(searchParams.get('content') ||     │ │
│ │ '');                                                  │ │
│ │ const pageUrl =                                       │ │
│ │ decodeURIComponent(searchParams.get('pageUrl') ||     │ │
│ │ '');                                                  │ │
│ │ const pageTitle =                                     │ │
│ │ decodeURIComponent(searchParams.get('pageTitle') ||   │ │
│ │ '');                                                  │ │
│ │ const source = searchParams.get('source');            │ │
│ │                                                       │ │
│ │ 2. UI/UX 功能                                         │ │
│ │                                                       │ │
│ │ 2.1 自動觸發新增表單                                  │ │
│ │                                                       │ │
│ │ 條件： 當檢測到 triggerNew=true 參數時                │ │
│ │ 行為：                                                │ │
│ │ - 自動顯示新增 Prompt 的表單或模態框                  │ │
│ │ - 不需要用戶額外點擊「新增」按鈕                      │ │
│ │                                                       │ │
│ │ 2.2 表單預填邏輯                                      │ │
│ │                                                       │ │
│ │ 內容欄位預填：                                        │ │
│ │ 選取的文字內容                                        │ │
│ │                                                       │ │
│ │ ---                                                   │ │
│ │ 來源：{pageTitle}                                     │ │
│ │ 網址：{pageUrl}                                       │ │
│ │                                                       │ │
│ │ 標題欄位建議：                                        │ │
│ │ - 自動生成基於內容的標題（可選）                      │ │
│ │ - 或使用來源頁面標題作為預設                          │ │
│ │                                                       │ │
│ │ 2.3 來源標識顯示                                      │ │
│ │                                                       │ │
│ │ UI 提示： 顯示此 Prompt 來自 Chrome Extension         │ │
│ │ 可能的實作方式：                                      │ │
│ │ - 標籤標示「來自網頁」                                │ │
│ │ - 圖標指示器                                          │ │
│ │ - 不同的表單樣式                                      │ │
│ │                                                       │ │
│ │ 3. 技術實作規格                                       │ │
│ │                                                       │ │
│ │ 3.1 前端路由處理                                      │ │
│ │                                                       │ │
│ │ 框架： Next.js (假設)                                 │ │
│ │ 位置：                                                │ │
│ │ - pages/folders/[folderId].tsx 或                     │ │
│ │ app/folders/[folderId]/page.tsx                       │ │
│ │ - pages/folders/all.tsx 或 app/folders/all/page.tsx   │ │
│ │                                                       │ │
│ │ 實作要點：                                            │ │
│ │ // 在頁面組件中                                       │ │
│ │ useEffect(() => {                                     │ │
│ │   const urlParams = new                               │ │
│ │ URLSearchParams(window.location.search);              │ │
│ │   if (urlParams.get('triggerNew') === 'true') {       │ │
│ │     // 觸發新增模式                                   │ │
│ │     const promptData = {                              │ │
│ │       content:                                        │ │
│ │ decodeURIComponent(urlParams.get('content') || ''),   │ │
│ │       source: urlParams.get('source'),                │ │
│ │       sourceUrl:                                      │ │
│ │ decodeURIComponent(urlParams.get('pageUrl') || ''),   │ │
│ │       sourceTitle:                                    │ │
│ │ decodeURIComponent(urlParams.get('pageTitle') || '')  │ │
│ │     };                                                │ │
│ │                                                       │ │
│ │     // 顯示新增表單並預填資料                         │ │
│ │     setShowNewPromptForm(true);                       │ │
│ │     setPromptFormData(promptData);                    │ │
│ │   }                                                   │ │
│ │ }, []);                                               │ │
│ │                                                       │ │
│ │ 3.2 API 端點（如需要）                                │ │
│ │                                                       │ │
│ │ 如果需要特殊處理來自 Extension 的 Prompt：            │ │
│ │                                                       │ │
│ │ 端點： POST /api/v1/prompts/from-extension            │ │
│ │ 請求格式：                                            │ │
│ │ {                                                     │ │
│ │   "folderId": "string",                               │ │
│ │   "name": "string",                                   │ │
│ │   "content": "string",                                │ │
│ │   "sourceUrl": "string",                              │ │
│ │   "sourceTitle": "string",                            │ │
│ │   "promptSpaceId": "string"                           │ │
│ │ }                                                     │ │
│ │                                                       │ │
│ │ 4. 用戶體驗優化                                       │ │
│ │                                                       │ │
│ │ 4.1 視覺回饋                                          │ │
│ │                                                       │ │
│ │ - 頁面載入時顯示「正在處理來自瀏覽器的內容...」       │ │
│ │ - 表單出現時的平滑動畫                                │ │
│ │ - 清楚的來源資訊顯示                                  │ │
│ │                                                       │ │
│ │ 4.2 錯誤處理                                          │ │
│ │                                                       │ │
│ │ - URL 參數格式錯誤時的降級處理                        │ │
│ │ - 用戶未登入時的重導向                                │ │
│ │ - Folder 不存在時的錯誤提示                           │ │
│ │                                                       │ │
│ │ 4.3 URL 清理（可選）                                  │ │
│ │                                                       │ │
│ │ 在處理完參數後，可以清理 URL 以提升用戶體驗：         │ │
│ │ // 移除 URL 參數，保持乾淨的網址                      │ │
│ │ window.history.replaceState({}, document.title,       │ │
│ │ window.location.pathname);                            │ │
│ │                                                       │ │
│ │ 測試案例                                              │ │
│ │                                                       │ │
│ │ 5.1 正常流程測試                                      │ │
│ │                                                       │ │
│ │ 1. 確保帶有完整參數的 URL 能正確觸發新增表單          │ │
│ │ 2. 驗證所有內容正確預填                               │ │
│ │ 3. 確認儲存功能正常運作                               │ │
│ │                                                       │ │
│ │ 5.2 邊界情況測試                                      │ │
│ │                                                       │ │
│ │ 1. 缺少參數時的處理                                   │ │
│ │ 2. 極長內容的處理                                     │ │
│ │ 3. 特殊字符和編碼的處理                               │ │
│ │ 4. 無效 folderId 的處理                               │ │
│ │                                                       │ │
│ │ 實作優先級                                            │ │
│ │                                                       │ │
│ │ P0 (必須)                                             │ │
│ │                                                       │ │
│ │ - 參數識別和解碼                                      │ │
│ │ - 自動觸發新增表單                                    │ │
│ │ - 基本的內容預填                                      │ │
│ │                                                       │ │
│ │ P1 (重要)                                             │ │
│ │                                                       │ │
│ │ - 來源資訊格式化                                      │ │
│ │ - 錯誤處理                                            │ │
│ │ - 視覺回饋                                            │ │
│ │                                                       │ │
│ │ P2 (可選)                                             │ │
│ │                                                       │ │
│ │ - 來源標識顯示                                        │ │
│ │ - URL 清理                                            │ │
│ │ - 特殊 API 端點                                       │ │
│ │                                                       │ │
│ │ 這份文檔提供給後端開發者，讓他們了解需要實作的完整功  │ │
│ │ 能和技術規格。 