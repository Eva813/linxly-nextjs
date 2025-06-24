---
tools: ['readFile']
---

請理解閱讀 Untitled-1.prompt
我要你評估 page 頁面的最佳化拆分建議優先順序，並帶領我一步步拆分

> Copilot: 我將先分析附件檔案中的建議，然後為您制定拆分優先順序並逐步執行。 基於對 page.tsx 的分析和附件中的建議，我為您制定以下**拆分優先順序**：
> 
> ## 🎯 拆分優先順序評估
> 
> ### **第一優先級（立即拆分）**
> 1. **自訂 Hook：`usePromptPageLogic`** - 最高優先級
>    - 程式碼量最多，邏輯複雜度最高
>    - 將 15+ 個狀態和多個 `useEffect` 抽離
>    - 提升可測試性和可維護性
> 
> ### **第二優先級（近期拆分）**
> 2. **ShortcutInput 組件** - 包含驗證邏輯和錯誤處理
> 3. **NameInput 組件** - 簡單但獨立的輸入元件
> 
> ### **第三優先級（後續最佳化）**
> 4. **ContentEditorWrapper** - 封裝 TipTap 編輯器
> 5. **TryItOut 相關組件** - Button + Popup 組合
> 6. **EditViewControls** - 工具列組合
> 
> ---
> 
> ## 🚀 開始第一步：建立 `usePromptPageLogic`
> 
> 讓我們先建立 hooks 資料夾和第一個自訂 Hook：
> 
> ````typescript
> import { useState, useEffect, useRef, useCallback } from 'react';
> import { usePromptStore } from "@/stores/prompt";
> import { useCurrentPrompt } from '@/lib/useCurrentPrompt';
> import { useAutoSave } from '@/hooks/useAutoSave';
> import { Folder } from '@/types/prompt';
> import { deepEqual } from '@/lib/utils/deepEqual';
> import { DropdownEditInfo, TextInputEditInfo, EditInfo } from '@/types/prompt';
> import { Editor } from '@tiptap/react';
> 
> interface ShortcutError {
>   conflictingShortcut: string;
>   message: string;
> }
> 
> export const usePromptPageLogic = (promptId: string) => {
>   const { folders, updatePrompt } = usePromptStore();
>   const { prompt: currentPrompt } = useCurrentPrompt(promptId);
> 
>   // 基本狀態
>   const [name, setName] = useState("");
>   const [shortcut, setShortcut] = useState("");
>   const [content, setContent] = useState("");
>   const [shortcutError, setShortcutError] = useState<ShortcutError | null>(null);
>   const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
> 
>   // 編輯器相關狀態
>   const [textInputEditInfo, setTextInputEditInfo] = useState<TextInputEditInfo | null>(null);
>   const [dropdownEditInfo, setDropdownEditInfo] = useState<DropdownEditInfo | null>(null);
>   const [isEditPanelVisible, setIsEditPanelVisible] = useState(false);
> 
>   // 對話框狀態
>   const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);
>   const [isDropdownDialogOpen, setIsDropdownDialogOpen] = useState(false);
> 
>   // UI 狀態
>   const [isPopupVisible, setIsPopupVisible] = useState(false);
>   const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
>   const [isMobilePanelClosing, setIsMobilePanelClosing] = useState(false);
> 
>   // Refs
>   const editorRef = useRef<Editor | null>(null);
>   const tryItOutButtonRef = useRef<HTMLButtonElement>(null);
>   const shortcutInputRef = useRef<HTMLInputElement>(null);
>   const nameInputRef = useRef<HTMLInputElement>(null);
>   const changeDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
> 
>   // 儲存初始值用於比較
>   const [initialValues, setInitialValues] = useState({
>     name: "",
>     shortcut: "",
>     content: ""
>   });
> 
>   // 自動儲存邏輯
>   const autoSaveHandler = useCallback(async () => {
>     if (!currentPrompt) return;
> 
>     const updatedPrompt = {
>       ...currentPrompt,
>       name,
>       shortcut,
>       content,
>     };
> 
>     try {
>       await updatePrompt(promptId, updatedPrompt);
>       
>       setInitialValues({
>         name,
>         shortcut,
>         content
>       });
>       setHasUnsavedChanges(false);
>     } catch (error) {
>       console.error("儲存時發生錯誤:", error);
>       throw error;
>     }
>   }, [currentPrompt, name, shortcut, content, promptId, updatePrompt]);
> 
>   const { triggerAutoSave } = useAutoSave({
>     onSave: autoSaveHandler,
>     delay: 2000,
>     enabled: hasUnsavedChanges,
>     promptId
>   });
> 
>   // 快捷鍵衝突檢查
>   const isConflictingShortcut = useCallback((
>     newShortcut: string,
>     promptId: string,
>     folders: Folder[]
>   ): { conflict: boolean; shortcut?: string } => {
>     const allOtherShortcuts = folders
>       .flatMap(folder => folder.prompts)
>       .filter(p => p.id !== promptId);
> 
>     for (const prompt of allOtherShortcuts) {
>       const existingShortcut = prompt.shortcut ?? "";
>       if (newShortcut === existingShortcut) {
>         return { conflict: true, shortcut: existingShortcut };
>       }
>       if (
>         newShortcut.length > 0 &&
>         existingShortcut.length > 0 &&
>         (existingShortcut.startsWith(newShortcut) || newShortcut.startsWith(existingShortcut))
>       ) {
>         return { conflict: true, shortcut: existingShortcut };
>       }
>     }
> 
>     return { conflict: false };
>   }, []);
> 
>   // 處理快捷鍵變更
>   const handleShortcutChange = useCallback((newShortcut: string) => {
>     setShortcut(newShortcut);
> 
>     const trimmedShortcut = newShortcut.trim();
>     if (!trimmedShortcut) {
>       setShortcutError(null);
>       return;
>     }
> 
>     const { conflict, shortcut } = isConflictingShortcut(trimmedShortcut, promptId, folders);
> 
>     if (conflict && shortcut) {
>       setShortcutError({
>         conflictingShortcut: shortcut,
>         message: "Please choose a unique shortcut."
>       });
>     } else {
>       setShortcutError(null);
>     }
>   }, [promptId, folders, isConflictingShortcut]);
> 
>   // 初始化資料
>   useEffect(() => {
>     if (currentPrompt) {
>       setName(currentPrompt.name);
>       setShortcut(currentPrompt.shortcut || "");
>       setContent(currentPrompt.content);
>       
>       setInitialValues({
>         name: currentPrompt.name,
>         shortcut: currentPrompt.shortcut || "",
>         content: currentPrompt.content
>       });
>       
>       setHasUnsavedChanges(false);
>     }
>   }, [currentPrompt]);
> 
>   // 變更檢測和自動儲存
>   useEffect(() => {
>     if (changeDetectionTimeoutRef.current) {
>       clearTimeout(changeDetectionTimeoutRef.current);
>     }
> 
>     changeDetectionTimeoutRef.current = setTimeout(() => {
>       const currentValues = {
>         name,
>         shortcut,
>         content
>       };
>       
>       const hasChanges = !deepEqual(currentValues, initialValues);
>       
>       if (hasChanges && currentPrompt) {
>         setHasUnsavedChanges(true);
>         triggerAutoSave();
>       } else {
>         setHasUnsavedChanges(false);
>       }
>     }, 300);
> 
>     return () => {
>       if (changeDetectionTimeoutRef.current) {
>         clearTimeout(changeDetectionTimeoutRef.current);
>       }
>     };
>   }, [name, shortcut, content, initialValues, triggerAutoSave, currentPrompt]);
> 
>   return {
>     // 狀態
>     name,
>     setName,
>     shortcut,
>     content,
>     setContent,
>     shortcutError,
>     setShortcutError,
>     hasUnsavedChanges,
>     
>     // 編輯器狀態
>     textInputEditInfo,
>     setTextInputEditInfo,
>     dropdownEditInfo,
>     setDropdownEditInfo,
>     isEditPanelVisible,
>     setIsEditPanelVisible,
>     
>     // 對話框狀態
>     isTextDialogOpen,
>     setIsTextDialogOpen,
>     isDropdownDialogOpen,
>     setIsDropdownDialogOpen,
>     
>     // UI 狀態
>     isPopupVisible,
>     setIsPopupVisible,
>     isMobilePanelOpen,
>     setIsMobilePanelOpen,
>     isMobilePanelClosing,
>     setIsMobilePanelClosing,
>     
>     // Refs
>     editorRef,
>     tryItOutButtonRef,
>     shortcutInputRef,
>     nameInputRef,
>     
>     // 處理函式
>     handleShortcutChange,
>     
>     // 資料
>     currentPrompt,
>     folders
>   };
> };
> ````
> 
> 這是第一步的拆分。接下來我會引導您：
> 
> 1. **確認這個 Hook 的設計是否符合需求**
> 2. **修改 page.tsx 使用這個 Hook**
> 3. **繼續拆分其他組件**
> 
> 您是否要先實作這個 `usePromptPageLogic` Hook？如果需要調整任何邏輯，請告訴我！

我發先你這樣拆分，此檔案還是相當複雜

> Copilot: 您說得對！我剛才的 `usePromptPageLogic` Hook 確實還是太複雜了，把所有邏輯都塞在一個 Hook 裡面，這樣並沒有真正解決問題。
> 
> 讓我重新設計一個更細緻的拆分策略：
> 
> ## 🔧 重新設計：更細緻的拆分策略
> 
> ### **第一階段：按功能領域拆分 Hooks**
> 
> ````typescript
> // 只負責基本資料管理
> import { useState, useEffect } from 'react';
> import { useCurrentPrompt } from '@/lib/useCurrentPrompt';
> 
> export const usePromptData = (promptId: string) => {
>   const { prompt: currentPrompt } = useCurrentPrompt(promptId);
>   const [name, setName] = useState("");
>   const [shortcut, setShortcut] = useState("");
>   const [content, setContent] = useState("");
> 
>   useEffect(() => {
>     if (currentPrompt) {
>       setName(currentPrompt.name);
>       setShortcut(currentPrompt.shortcut || "");
>       setContent(currentPrompt.content);
>     }
>   }, [currentPrompt]);
> 
>   return {
>     name,
>     setName,
>     shortcut,
>     setShortcut,
>     content,
>     setContent,
>     currentPrompt
>   };
> };
> ````
> 
> ````typescript
> // 只負責快捷鍵驗證
> import { useState, useCallback } from 'react';
> import { usePromptStore } from "@/stores/prompt";
> import { Folder } from '@/types/prompt';
> 
> interface ShortcutError {
>   conflictingShortcut: string;
>   message: string;
> }
> 
> export const useShortcutValidation = (promptId: string) => {
>   const { folders } = usePromptStore();
>   const [shortcutError, setShortcutError] = useState<ShortcutError | null>(null);
> 
>   const validateShortcut = useCallback((newShortcut: string) => {
>     const trimmedShortcut = newShortcut.trim();
>     if (!trimmedShortcut) {
>       setShortcutError(null);
>       return;
>     }
> 
>     const allOtherShortcuts = folders
>       .flatMap(folder => folder.prompts)
>       .filter(p => p.id !== promptId);
> 
>     for (const prompt of allOtherShortcuts) {
>       const existingShortcut = prompt.shortcut ?? "";
>       if (trimmedShortcut === existingShortcut || 
>           (trimmedShortcut.length > 0 && existingShortcut.length > 0 &&
>            (existingShortcut.startsWith(trimmedShortcut) || trimmedShortcut.startsWith(existingShortcut)))) {
>         setShortcutError({
>           conflictingShortcut: existingShortcut,
>           message: "Please choose a unique shortcut."
>         });
>         return;
>       }
>     }
>     setShortcutError(null);
>   }, [promptId, folders]);
> 
>   return {
>     shortcutError,
>     setShortcutError,
>     validateShortcut
>   };
> };
> ````
> 
> ````typescript
> // 只負責自動儲存
> import { useState, useEffect, useRef, useCallback } from 'react';
> import { usePromptStore } from "@/stores/prompt";
> import { useAutoSave } from '@/hooks/useAutoSave';
> import { deepEqual } from '@/lib/utils/deepEqual';
> 
> export const useAutoSaveLogic = (
>   promptId: string, 
>   name: string, 
>   shortcut: string, 
>   content: string,
>   currentPrompt: any
> ) => {
>   const { updatePrompt } = usePromptStore();
>   const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
>   const [initialValues, setInitialValues] = useState({
>     name: "",
>     shortcut: "",
>     content: ""
>   });
>   const changeDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
> 
>   const autoSaveHandler = useCallback(async () => {
>     if (!currentPrompt) return;
> 
>     const updatedPrompt = {
>       ...currentPrompt,
>       name,
>       shortcut,
>       content,
>     };
> 
>     try {
>       await updatePrompt(promptId, updatedPrompt);
>       setInitialValues({ name, shortcut, content });
>       setHasUnsavedChanges(false);
>     } catch (error) {
>       console.error("儲存時發生錯誤:", error);
>       throw error;
>     }
>   }, [currentPrompt, name, shortcut, content, promptId, updatePrompt]);
> 
>   const { triggerAutoSave } = useAutoSave({
>     onSave: autoSaveHandler,
>     delay: 2000,
>     enabled: hasUnsavedChanges,
>     promptId
>   });
> 
>   // 初始化
>   useEffect(() => {
>     if (currentPrompt) {
>       setInitialValues({
>         name: currentPrompt.name,
>         shortcut: currentPrompt.shortcut || "",
>         content: currentPrompt.content
>       });
>       setHasUnsavedChanges(false);
>     }
>   }, [currentPrompt]);
> 
>   // 變更檢測
>   useEffect(() => {
>     if (changeDetectionTimeoutRef.current) {
>       clearTimeout(changeDetectionTimeoutRef.current);
>     }
> 
>     changeDetectionTimeoutRef.current = setTimeout(() => {
>       const currentValues = { name, shortcut, content };
>       const hasChanges = !deepEqual(currentValues, initialValues);
>       
>       if (hasChanges && currentPrompt) {
>         setHasUnsavedChanges(true);
>         triggerAutoSave();
>       } else {
>         setHasUnsavedChanges(false);
>       }
>     }, 300);
> 
>     return () => {
>       if (changeDetectionTimeoutRef.current) {
>         clearTimeout(changeDetectionTimeoutRef.current);
>       }
>     };
>   }, [name, shortcut, content, initialValues, triggerAutoSave, currentPrompt]);
> 
>   return {
>     hasUnsavedChanges
>   };
> };
> ````
> 
> ````typescript
> // 只負責編輯器狀態
> import { useState, useRef } from 'react';
> import { Editor } from '@tiptap/react';
> import { DropdownEditInfo, TextInputEditInfo } from '@/types/prompt';
> 
> export const useEditorState = () => {
>   const editorRef = useRef<Editor | null>(null);
>   const [textInputEditInfo, setTextInputEditInfo] = useState<TextInputEditInfo | null>(null);
>   const [dropdownEditInfo, setDropdownEditInfo] = useState<DropdownEditInfo | null>(null);
>   const [isEditPanelVisible, setIsEditPanelVisible] = useState(false);
> 
>   return {
>     editorRef,
>     textInputEditInfo,
>     setTextInputEditInfo,
>     dropdownEditInfo,
>     setDropdownEditInfo,
>     isEditPanelVisible,
>     setIsEditPanelVisible
>   };
> };
> ````
> 
> ````typescript
> // 只負責 UI 狀態
> import { useState, useRef } from 'react';
> 
> export const useUIState = () => {
>   const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);
>   const [isDropdownDialogOpen, setIsDropdownDialogOpen] = useState(false);
>   const [isPopupVisible, setIsPopupVisible] = useState(false);
>   const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
>   const [isMobilePanelClosing, setIsMobilePanelClosing] = useState(false);
>   
>   const tryItOutButtonRef = useRef<HTMLButtonElement>(null);
>   const shortcutInputRef = useRef<HTMLInputElement>(null);
>   const nameInputRef = useRef<HTMLInputElement>(null);
> 
>   return {
>     isTextDialogOpen,
>     setIsTextDialogOpen,
>     isDropdownDialogOpen,
>     setIsDropdownDialogOpen,
>     isPopupVisible,
>     setIsPopupVisible,
>     isMobilePanelOpen,
>     setIsMobilePanelOpen,
>     isMobilePanelClosing,
>     setIsMobilePanelClosing,
>     tryItOutButtonRef,
>     shortcutInputRef,
>     nameInputRef
>   };
> };
> ````
> 
> ### **第二階段：組合 Hook**
> 
> ````typescript
> // 組合各個小 Hook
> import { usePromptData } from './usePromptData';
> import { useShortcutValidation } from './useShortcutValidation';
> import { useAutoSaveLogic } from './useAutoSaveLogic';
> import { useEditorState } from './useEditorState';
> import { useUIState } from './useUIState';
> 
> export const usePromptPage = (promptId: string) => {
>   const promptData = usePromptData(promptId);
>   const shortcutValidation = useShortcutValidation(promptId);
>   const autoSave = useAutoSaveLogic(
>     promptId,
>     promptData.name,
>     promptData.shortcut,
>     promptData.content,
>     promptData.currentPrompt
>   );
>   const editorState = useEditorState();
>   const uiState = useUIState();
> 
>   return {
>     ...promptData,
>     ...shortcutValidation,
>     ...autoSave,
>     ...editorState,
>     ...uiState
>   };
> };
> ````
> 
> 這樣拆分的好處：
> 
> 1. **每個 Hook 職責單一** - 更容易理解和測試
> 2. **可以獨立重用** - 例如 `useShortcutValidation` 可以在其他地方使用
> 3. **更容易維護** - 修改一個功能只需要改對應的 Hook
> 4. **組合彈性** - 可以選擇性使用某些 Hook
> 
> 您覺得這樣的拆分方式如何？要不要先實作其中一個小 Hook 來測試？
