---
tools: ['listDirectory', 'codebase', 'readFile']
---

請參閱我的附件，扮演資深前端工程師，協助我保有可讀性，有效拆分 page 頁面

> Copilot: 我來協助您有效拆分這個複雜的 page 頁面。基於您的程式碼分析，我建議採用更細緻的拆分策略來保持可讀性。
> 
> 讓我先搜尋相關的檔案結構來了解現有的組件： 基於您的程式碼分析，我建議按照以下優先順序進行拆分：
> 
> ## 🎯 拆分優先順序評估
> 
> ### **第一優先級（立即拆分）**
> 
> #### 1. 建立 hooks 資料夾並拆分邏輯
> 
> ````typescript
> import { useState, useEffect } from 'react';
> import { useCurrentPrompt } from '@/lib/useCurrentPrompt';
> 
> export const usePromptData = (promptId: string) => {
>   const { prompt: currentPrompt } = useCurrentPrompt(promptId);
>   const [name, setName] = useState("");
>   const [shortcut, setShortcut] = useState("");
>   const [content, setContent] = useState("");
> 
>   // 初始化資料
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
>     return { conflict: false };
>   }, []);
> 
>   const validateShortcut = useCallback((newShortcut: string) => {
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
>   return {
>     shortcutError,
>     setShortcutError,
>     validateShortcut
>   };
> };
> ````
> 
> ````typescript
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
>   // 自動儲存處理函式
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
>   // 初始化初始值
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
>   // 變更檢測和自動儲存
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
> ### **第二優先級（近期拆分）**
> 
> #### 2. 建立輸入組件
> 
> ````typescript
> import { forwardRef } from 'react';
> import { Input } from "@/components/ui/input";
> import { FaTag } from "react-icons/fa6";
> import SaveStatusIndicator from '@/components/ui/saveStatusIndicator';
> 
> interface NameInputProps {
>   value: string;
>   onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
> }
> 
> const NameInput = forwardRef<HTMLInputElement, NameInputProps>(
>   ({ value, onChange }, ref) => {
>     return (
>       <div className="relative">
>         <SaveStatusIndicator className="absolute -top-8 left-0 z-10 sm:-top-7 md:-top-6" />
>         <Input 
>           ref={ref}
>           className="pl-9 h-12" 
>           placeholder="Type prompt name..." 
>           value={value} 
>           onChange={onChange}
>           data-no-extension="true"
>           data-exclude-extension="true"
>           autoComplete="off"
>           autoCorrect="off"
>           spellCheck="false"
>         />
>         <FaTag className="absolute left-[10px] top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
>       </div>
>     );
>   }
> );
> 
> NameInput.displayName = 'NameInput';
> 
> export default NameInput;
> ````
> 
> ````typescript
> import { forwardRef } from 'react';
> import { Input } from "@/components/ui/input";
> import { Button } from '@/components/ui/button';
> import { FaKeyboard } from "react-icons/fa6";
> import ShortcutErrorAlert from "@/app/prompts/components/shortcutErrorAlert";
> import TryItOutPopup from '../tryItOutPopup';
> 
> interface ShortcutError {
>   conflictingShortcut: string;
>   message: string;
> }
> 
> interface ShortcutInputProps {
>   value: string;
>   onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
>   error: ShortcutError | null;
>   onErrorClose: () => void;
>   isPopupVisible: boolean;
>   onPopupToggle: () => void;
>   onPopupClose: () => void;
>   tryItOutButtonRef: React.RefObject<HTMLButtonElement>;
> }
> 
> const ShortcutInput = forwardRef<HTMLInputElement, ShortcutInputProps>(
>   ({ 
>     value, 
>     onChange, 
>     error, 
>     onErrorClose, 
>     isPopupVisible, 
>     onPopupToggle, 
>     onPopupClose,
>     tryItOutButtonRef 
>   }, ref) => {
>     return (
>       <div className="relative">
>         <div className="relative">
>           <Input 
>             ref={ref}
>             className="pl-9 pr-24 h-12" 
>             placeholder="Add a shortcut..." 
>             value={value} 
>             onChange={onChange}
>             data-no-extension="true"
>             data-exclude-extension="true"
>             autoComplete="off"
>             autoCorrect="off"
>             spellCheck="false"
>           />
>           <FaKeyboard className="absolute left-[10px] top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
>           <Button
>             ref={tryItOutButtonRef}
>             className="absolute right-[10px] top-1/2 h-8 px-2 text-xs sm:text-sm -translate-y-1/2"
>             onClick={e => {
>               e.stopPropagation();
>               onPopupToggle();
>             }}
>           >
>             Try it out
>           </Button>
>         </div>
>         {error && (
>           <ShortcutErrorAlert 
>             error={error} 
>             onClose={onErrorClose} 
>           />
>         )}
>         {isPopupVisible && (
>           <TryItOutPopup 
>             tryItOutButtonRef={tryItOutButtonRef} 
>             shortcut={value} 
>             onClose={onPopupClose} 
>           />
>         )}
>       </div>
>     );
>   }
> );
> 
> ShortcutInput.displayName = 'ShortcutInput';
> 
> export default ShortcutInput;
> ````
> 
> ### **第三優先級（後續最佳化）**
> 
> #### 3. 組合 Hook 和主頁面重構
> 
> ````typescript
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
>   // 其他 hooks...
> 
>   // 處理快捷鍵變更（結合邏輯）
>   const handleShortcutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
>     const newShortcut = e.target.value;
>     promptData.setShortcut(newShortcut);
>     shortcutValidation.validateShortcut(newShortcut);
>   };
> 
>   return {
>     ...promptData,
>     ...shortcutValidation,
>     ...autoSave,
>     handleShortcutChange,
>     // ...其他返回值
>   };
> };
> ````
> 
> ## 📋 實作建議步驟
> 
> 1. **先建立 hooks 資料夾和第一個 Hook** - `usePromptData`
> 2. **測試並確認 Hook 正常運作**
> 3. **逐步加入其他 hooks** - `useShortcutValidation`、`useAutoSaveLogic`
> 4. **建立組件資料夾並拆分輸入組件**
> 5. **重構主頁面使用新的 hooks 和組件**
> 
> ## 🎯 拆分後的效益
> 
> - **可讀性提升**：每個 Hook 和組件職責單一
> - **可測試性**：邏輯分離後更容易撰寫單元測試
> - **可重用性**：Hook 可以在其他頁面重複使用
> - **維護性**：修改功能時只需要改對應的模組
> 
> 您要先從哪個 Hook 開始實作？我建議從 `usePromptData` 開始，因為它是最基礎的資料管理層。

你這樣的拆分有符合專業前端工程師，在專案內常使用的處理方式嗎？

> Copilot: 您問得很好！讓我重新評估這個拆分策略是否符合專業前端工程師的實際做法。 您問得非常好！讓我重新審視我的拆分建議。看了您的專案結構後，我發現我的拆分確實**不夠符合專業前端工程師的實際做法**。
> 
> ## 🔍 問題分析
> 
> 從您專案中的現有模式，我發現：
> 
> 1. **您已經有很好的資料夾結構** - sidebar、`src/stores/`、組件按功能分組
> 2. **您已在使用 Zustand store slices** - 職責分明的 store 設計
> 3. **您有明確的組件層級** - `components/sidebar/` 下的子組件都很專一
> 4. **您使用 custom hooks 但很克制** - 如 `useAutoSave`、`useSidebarActions`
> 
> ## ❌ 我的拆分問題
> 
> 我的建議有以下問題：
> 1. **過度拆分 hooks** - 建立太多微小 hooks，增加複雜性
> 2. **不符合專案現有模式** - 您的專案偏向較大的 hooks + 細粒度組件
> 3. **忽略了 Zustand store 的作用** - 很多狀態應該在 store 中管理
> 
> ## ✅ 基於您專案的實際拆分建議 基於您專案的實際模式，這是更合適的拆分：
> 
> ### **第一優先級：建立 `usePromptPageState` Hook**
> 
> ````typescript
> import { useState, useEffect, useRef, useCallback } from 'react';
> import { usePromptStore } from "@/stores/prompt";
> import { useCurrentPrompt } from '@/lib/useCurrentPrompt';
> import { useAutoSave } from '@/hooks/useAutoSave';
> import { Editor } from '@tiptap/react';
> import { DropdownEditInfo, TextInputEditInfo } from '@/types/prompt';
> import { deepEqual } from '@/lib/utils/deepEqual';
> 
> interface ShortcutError {
>   conflictingShortcut: string;
>   message: string;
> }
> 
> export function usePromptPageState(promptId: string) {
>   const { folders, updatePrompt } = usePromptStore();
>   const { prompt: currentPrompt } = useCurrentPrompt(promptId);
> 
>   // 基本表單狀態
>   const [name, setName] = useState("");
>   const [shortcut, setShortcut] = useState("");
>   const [content, setContent] = useState("");
>   const [shortcutError, setShortcutError] = useState<ShortcutError | null>(null);
> 
>   // 編輯器狀態
>   const [textInputEditInfo, setTextInputEditInfo] = useState<TextInputEditInfo | null>(null);
>   const [dropdownEditInfo, setDropdownEditInfo] = useState<DropdownEditInfo | null>(null);
>   const [isEditPanelVisible, setIsEditPanelVisible] = useState(false);
> 
>   // UI 狀態
>   const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);
>   const [isDropdownDialogOpen, setIsDropdownDialogOpen] = useState(false);
>   const [isPopupVisible, setIsPopupVisible] = useState(false);
>   const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
>   const [isMobilePanelClosing, setIsMobilePanelClosing] = useState(false);
> 
>   // Refs
>   const editorRef = useRef<Editor | null>(null);
>   const tryItOutButtonRef = useRef<HTMLButtonElement>(null);
>   const shortcutInputRef = useRef<HTMLInputElement>(null);
>   const nameInputRef = useRef<HTMLInputElement>(null);
> 
>   // 自動儲存邏輯 (簡化版，維持原有邏輯)
>   const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
>   const [initialValues, setInitialValues] = useState({
>     name: "", shortcut: "", content: ""
>   });
>   const changeDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
> 
>   const autoSaveHandler = useCallback(async () => {
>     if (!currentPrompt) return;
>     const updatedPrompt = { ...currentPrompt, name, shortcut, content };
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
>   // 初始化和變更檢測邏輯保持不變...
> 
>   return {
>     // 資料狀態
>     name, setName,
>     shortcut, setShortcut,
>     content, setContent,
>     currentPrompt,
>     folders,
>     
>     // 錯誤狀態
>     shortcutError, setShortcutError,
>     
>     // 編輯器狀態
>     textInputEditInfo, setTextInputEditInfo,
>     dropdownEditInfo, setDropdownEditInfo,
>     isEditPanelVisible, setIsEditPanelVisible,
>     
>     // UI 狀態
>     isTextDialogOpen, setIsTextDialogOpen,
>     isDropdownDialogOpen, setIsDropdownDialogOpen,
>     isPopupVisible, setIsPopupVisible,
>     isMobilePanelOpen, setIsMobilePanelOpen,
>     isMobilePanelClosing, setIsMobilePanelClosing,
>     
>     // Refs
>     editorRef, tryItOutButtonRef, shortcutInputRef, nameInputRef,
>     
>     // 自動儲存
>     hasUnsavedChanges
>   };
> }
> ````
> 
> ### **第二優先級：拆分 UI 組件（保持現有模式）**
> 
> ````typescript
> import { forwardRef } from 'react';
> import { Input } from "@/components/ui/input";
> import { Button } from '@/components/ui/button';
> import { FaTag, FaKeyboard } from "react-icons/fa6";
> import SaveStatusIndicator from '@/components/ui/saveStatusIndicator';
> import ShortcutErrorAlert from "@/app/prompts/components/shortcutErrorAlert";
> import TryItOutPopup from '../tryItOutPopup';
> 
> interface PromptHeaderProps {
>   name: string;
>   shortcut: string;
>   shortcutError: any;
>   isPopupVisible: boolean;
>   onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
>   onShortcutChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
>   onShortcutErrorClose: () => void;
>   onPopupToggle: () => void;
>   onPopupClose: () => void;
>   nameInputRef: React.RefObject<HTMLInputElement>;
>   shortcutInputRef: React.RefObject<HTMLInputElement>;
>   tryItOutButtonRef: React.RefObject<HTMLButtonElement>;
> }
> 
> export const PromptHeader = ({
>   name, shortcut, shortcutError, isPopupVisible,
>   onNameChange, onShortcutChange, onShortcutErrorClose,
>   onPopupToggle, onPopupClose,
>   nameInputRef, shortcutInputRef, tryItOutButtonRef
> }: PromptHeaderProps) => {
>   return (
>     <div className="grid grid-cols-2 gap-x-4 lg:pr-4">
>       {/* Name Input */}
>       <div className="relative">
>         <SaveStatusIndicator className="absolute -top-8 left-0 z-10 sm:-top-7 md:-top-6" />
>         <Input 
>           ref={nameInputRef}
>           className="pl-9 h-12" 
>           placeholder="Type prompt name..." 
>           value={name} 
>           onChange={onNameChange}
>           data-no-extension="true"
>           data-exclude-extension="true"
>           autoComplete="off"
>           autoCorrect="off"
>           spellCheck="false"
>         />
>         <FaTag className="absolute left-[10px] top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
>       </div>
> 
>       {/* Shortcut Input */}
>       <div className="relative">
>         <div className="relative">
>           <Input 
>             ref={shortcutInputRef}
>             className="pl-9 pr-24 h-12" 
>             placeholder="Add a shortcut..." 
>             value={shortcut} 
>             onChange={onShortcutChange}
>             data-no-extension="true"
>             data-exclude-extension="true"
>             autoComplete="off"
>             autoCorrect="off"
>             spellCheck="false"
>           />
>           <FaKeyboard className="absolute left-[10px] top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
>           <Button
>             ref={tryItOutButtonRef}
>             className="absolute right-[10px] top-1/2 h-8 px-2 text-xs sm:text-sm -translate-y-1/2"
>             onClick={e => {
>               e.stopPropagation();
>               onPopupToggle();
>             }}
>           >
>             Try it out
>           </Button>
>         </div>
>         {shortcutError && (
>           <ShortcutErrorAlert 
>             error={shortcutError} 
>             onClose={onShortcutErrorClose} 
>           />
>         )}
>         {isPopupVisible && (
>           <TryItOutPopup 
>             tryItOutButtonRef={tryItOutButtonRef} 
>             shortcut={shortcut} 
>             onClose={onPopupClose} 
>           />
>         )}
>       </div>
>     </div>
>   );
> };
> ````
> 
> ### **第三優先級：重構主頁面使用新結構**
> 
> ````typescript
> 'use client';
> import { usePromptPageState } from './hooks/usePromptPageState';
> import { usePromptPageLogic } from './hooks/usePromptPageLogic';
> import { PromptHeader } from './components/PromptHeader';
> // ... 其他現有組件
> 
> const PromptPage = ({ params }: PromptPageProps) => {
>   const { promptId } = params;
>   const state = usePromptPageState(promptId);
>   const logic = usePromptPageLogic(state); // 傳入 state，處理業務邏輯
> 
>   return (
>     <div className="flex flex-col h-full">
>       <header className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] mb-4 pt-4 sm:pt-6 md:pt-4 gap-y-4 lg:gap-y-0 justify-items-start sm:justify-items-stretch">
>         <PromptHeader
>           name={state.name}
>           shortcut={state.shortcut}
>           shortcutError={state.shortcutError}
>           isPopupVisible={state.isPopupVisible}
>           onNameChange={logic.handleNameChange}
>           onShortcutChange={logic.handleShortcutChange}
>           onShortcutErrorClose={() => state.setShortcutError(null)}
>           onPopupToggle={() => state.setIsPopupVisible(prev => !prev)}
>           onPopupClose={() => state.setIsPopupVisible(false)}
>           nameInputRef={state.nameInputRef}
>           shortcutInputRef={state.shortcutInputRef}
>           tryItOutButtonRef={state.tryItOutButtonRef}
>         />
>         {/* 其他現有組件保持不變 */}
>       </header>
>       {/* main 部分保持不變 */}
>     </div>
>   );
> };
> ````
> 
> ## 🎯 這種拆分的優勢
> 
> 1. **符合您的專案模式** - 一個較大的 hook + 細粒度組件
> 2. **維持現有架構** - 不破壞 Zustand store 和現有組件結構
> 3. **漸進式重構** - 可以一步步拆分，不需要大改
> 4. **實用性優先** - 不過度抽象，保持程式碼的可讀性
> 
> 這樣的拆分更符合專業前端工程師在實際專案中的做法，您覺得如何？
