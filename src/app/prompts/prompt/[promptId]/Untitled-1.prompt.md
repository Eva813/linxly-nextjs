---
tools: ['readFile']
---

扮演專業資深前端工程師給予附件頁面，最佳化整理建議
以 React 拆分準則與使用給予調整建議

> Copilot: 根據目前的程式碼結構與 React 的最佳實踐，以下是一些拆分與最佳化的建議：
> 
> ### 1. **拆分邏輯與 UI**
> 目前的 `PromptPage` 組件包含了大量的邏輯與狀態管理，建議將邏輯與 UI 分離，提升可讀性與可維護性：
> - **邏輯部分**：將狀態管理與副作用（如 `useEffect` 和 `useCallback`）移至自定義 Hook，例如 `usePromptPageLogic`。
> - **UI 部分**：將表單、按鈕、彈窗等 UI 元素拆分為獨立的子組件。
> 
> ### 2. **狀態管理**
> - 使用 `Zustand` 的 store 來管理全域狀態，例如 `hasUnsavedChanges`，避免在組件內部管理過多狀態。
> - 將 `autoSaveHandler` 等函式移至 store 或自定義 Hook，減少組件內的程式碼量。
> 
> ### 3. **拆分子組件**
> 以下是可以拆分的子組件建議：
> - **ShortcutInput**：處理快捷鍵輸入的邏輯與 UI。
> - **NameInput**：處理名稱輸入的邏輯與 UI。
> - **ContentEditor**：封裝 `TipTapEditor` 並處理內容編輯的邏輯。
> - **SaveStatusIndicator**：目前已經是獨立組件，保持現狀。
> 
> ### 4. **最佳化效能**
> - 使用 `useMemo` 和 `useCallback` 優化函式與計算的重複呼叫。
> - 確保 `useEffect` 的依賴陣列正確，避免不必要的重複執行。
> 
> ### 5. **錯誤處理**
> - 將錯誤處理邏輯（如 `setShortcutError`）抽象到一個錯誤處理模組，統一管理錯誤訊息。
> 
> ### 6. **測試策略**
> - 撰寫單元測試覆蓋每個子組件的行為。
> - 使用整合測試驗證 `PromptPage` 的整體功能，例如自動儲存與錯誤提示。
> 
> ### 7. **程式碼範例**
> 以下是將 `ShortcutInput` 抽離為子組件的範例：
> 
> ```tsx
> // ShortcutInput.tsx
> import { Input } from "@/components/ui/input";
> 
> interface ShortcutInputProps {
>   value: string;
>   onChange: (value: string) => void;
>   error: string | null;
> }
> 
> const ShortcutInput = ({ value, onChange, error }: ShortcutInputProps) => {
>   return (
>     <div>
>       <Input
>         value={value}
>         onChange={(e) => onChange(e.target.value)}
>         placeholder="Enter shortcut"
>       />
>       {error && <p className="text-red-500">{error}</p>}
>     </div>
>   );
> };
> 
> export default ShortcutInput;
> ```
> 
> 在 `PromptPage` 中使用：
> 
> ```tsx
> import ShortcutInput from './ShortcutInput';
> 
> <ShortcutInput
>   value={shortcut}
>   onChange={setShortcut}
>   error={shortcutError?.message}
> />
> ```
> 
> ### 8. **檔案結構建議**
> 將拆分的子組件放置於 `src/app/prompts/prompt/[promptId]/components/` 資料夾中，保持結構清晰。
> 
> 是否需要我進一步協助拆分具體的邏輯或 UI？

請將對必要拆分先說明清楚，我來評估是否要實作

> Copilot: 以下是建議先行拆分的模組與其職責，你可以先評估再決定要不要實作：
> 
> 1. 自訂 Hook：usePromptPageLogic  
>    - 職責：  
>      • 管理「輸入狀態」（name / shortcut / content）  
>      • 處理自動儲存、變更偵測（hasUnsavedChanges）  
>      • 處理錯誤（shortcutError）與各類副作用（useEffect）  
>    - 好處：將所有商業邏輯從頁面組件抽離，Page.tsx 只負責 UI 排版
> 
> 2. NameInput  
>    - Props：value, onChange, inputRef  
>    - 職責：  
>      • Render `<Input>` 和 label  
>      • 顯示 validation 或儲存狀態提示  
> 
> 3. ShortcutInput  
>    - Props：value, onChange, inputRef, error  
>    - 職責：  
>      • Render `<Input>` + 快捷鍵 icon  
>      • 顯示 shortcutError  
> 
> 4. ContentEditorWrapper  
>    - Props：content, onUpdate, editorRef  
>    - 職責：  
>      • 封裝 TipTapEditor  
>      • 提供 buildFormData／EditInfo 更新 callback  
> 
> 5. AutoSaveIndicator  
>    - （已存在 `SaveStatusIndicator`）  
>    - 負責顯示正在儲存、成功、失敗狀態  
> 
> 6. TryItOutButton + TryItOutPopup  
>    - Props：onOpen, isVisible, buttonRef  
>    - 職責：  
>      • Button click 控制 popup  
>      • Popup 內容與行為  
> 
> 7. EditViewControls  
>    - 包含 `EditViewButtons`、`PreviewPrompt`、`ShortcutErrorAlert`  
>    - Props：mode, onModeChange, errorInfo  
> 
> 8. 側邊欄相關  
>    - `Sidebar`、`InsertTextFieldDialog`、`InsertDropdownMenuDialog`、`EditPanel`  
>    - 已各自獨立檔案，可視狀況再拆更細的子元件（如欄位列表、按鈕群組）
> 
> ———
> 
> 整體結構示例：
> 
> src/app/prompts/prompt/[promptId]/  
> ├─ hooks/  
> │  └─ usePromptPageLogic.ts  
> ├─ components/  
> │  ├─ NameInput.tsx  
> │  ├─ ShortcutInput.tsx  
> │  ├─ ContentEditorWrapper.tsx  
> │  ├─ TryItOut.tsx        （含 button + popup）  
> │  └─ EditViewControls.tsx  
> └─ page.tsx               （只負責 import & 組合上面元件）
> 
> 這樣能讓每個元件職責單一、Page.tsx 更清爽，你覺得哪幾個要先做？
