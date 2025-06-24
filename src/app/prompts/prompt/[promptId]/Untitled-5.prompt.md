---
tools: ['readFile', 'listDirectory', 'codebase', 'textSearch']
---

請評估目前這樣的拆分是否合適？

> Copilot: 我來評估一下目前的程式碼拆分狀況。讓我先檢查一下相關的檔案結構和內容。 基於我對程式碼的分析，我來評估目前的拆分狀況：
> 
> ## 🟢 **拆分的優點**
> 
> ### 1. **關注點分離良好**
> - `usePromptPageLogic` 專注於狀態管理和業務邏輯
> - page.tsx 專注於 UI 渲染和使用者互動
> - 符合 React 最佳實踐的 "邏輯與展示分離" 原則
> 
> ### 2. **職責清晰**
> ```typescript
> // Hook 負責：
> - 表單資料狀態 (name, shortcut, content)
> - 自動儲存邏輯
> - 快捷鍵衝突檢查
> - 變更檢測
> 
> // Component 負責：
> - UI 狀態 (對話框、面板顯示)
> - 編輯器互動邏輯
> - 事件處理和使用者互動
> ```
> 
> ### 3. **可測試性提升**
> - 業務邏輯獨立，可以單獨測試
> - UI 組件的測試更專注於渲染和互動
> 
> ## 🟡 **需要改善的地方**
> 
> ### 1. **Hook 職責過於複雜**
> `usePromptPageLogic` 目前包含了多個不同的職責： 建議進一步拆分成更小的 Hooks：
> 
> ````typescript
> // 專門處理表單狀態
> export const usePromptForm = (promptId: string) => {
>   // 表單相關邏輯
> };
> 
> // filepath: /Users/black-star-point-frontend/linxly-nextjs/src/app/prompts/prompt/[promptId]/hooks/useShortcutValidation.ts  
> // 專門處理快捷鍵驗證
> export const useShortcutValidation = (promptId: string) => {
>   // 快捷鍵驗證邏輯
> };
> 
> // filepath: /Users/black-star-point-frontend/linxly-nextjs/src/app/prompts/prompt/[promptId]/hooks/usePromptPageLogic.ts
> // 組合所有邏輯
> export const usePromptPageLogic = ({ promptId }: UsePromptPageLogicProps) => {
>   const formLogic = usePromptForm(promptId);
>   const shortcutLogic = useShortcutValidation(promptId);
>   
>   return {
>     ...formLogic,
>     ...shortcutLogic,
>   };
> };
> ````
> 
> ### 2. **Component 仍然過於複雜**
> page.tsx 仍有 450 行，包含太多不同的關注點： 建議進一步拆分組件：
> 
> ````typescript
> // 專門處理頭部區域（名稱、快捷鍵、按鈕）
> export const PromptHeader = ({ ... }) => {
>   // 頭部相關邏輯
> };
> 
> // filepath: /Users/black-star-point-frontend/linxly-nextjs/src/app/prompts/prompt/[promptId]/components/EditorSection.tsx
> // 專門處理編輯器部分
> export const EditorSection = ({ ... }) => {
>   // 編輯器相關邏輯
> };
> 
> // filepath: /Users/black-star-point-frontend/linxly-nextjs/src/app/prompts/prompt/[promptId]/hooks/useEditorLogic.ts
> // 編輯器專用的 Hook
> export const useEditorLogic = () => {
>   // 編輯器互動邏輯
> };
> ````
> 
> ## 🔴 **潛在問題**
> 
> ### 1. **Hook 與 Component 耦合度過高**
> Hook 返回了 UI 相關的 refs，這打破了邏輯與 UI 的分離：
> 
> ````typescript
> // 目前的做法 - 耦合度過高
> const {
>   shortcutInputRef,  // UI ref 不應該在邏輯 Hook 中
>   nameInputRef,      // UI ref 不應該在邏輯 Hook 中
>   // ...
> } = usePromptPageLogic({ promptId });
> 
> // 建議的做法 - 分離 UI 與邏輯
> const formLogic = usePromptForm(promptId);
> const shortcutInputRef = useRef<HTMLInputElement>(null);
> const nameInputRef = useRef<HTMLInputElement>(null);
> ````
> 
> ### 2. **型別定義分散**
> 相關的型別散佈在不同檔案中，建議集中管理。
> 
> ## 📝 **改善建議**
> 
> ### 1. **進一步拆分 Hook**
> ````typescript
> export { usePromptForm } from './usePromptForm';
> export { useShortcutValidation } from './useShortcutValidation';  
> export { useEditorLogic } from './useEditorLogic';
> export { usePromptPageLogic } from './usePromptPageLogic';
> ````
> 
> ### 2. **拆分 Component**
> ````typescript
> const PromptPage = ({ params }: PromptPageProps) => {
>   const formLogic = usePromptForm(params.promptId);
>   const editorLogic = useEditorLogic();
>   
>   return (
>     <div className="flex flex-col h-full">
>       <PromptHeader {...formLogic} />
>       <EditorSection {...editorLogic} content={formLogic.content} />
>     </div>
>   );
> };
> ````
> 
> ### 3. **改善型別管理**
> ````typescript
> export interface PromptFormState {
>   name: string;
>   shortcut: string; 
>   content: string;
> }
> 
> export interface EditorState {
>   mode: Mode;
>   isEditPanelVisible: boolean;
>   // ...
> }
> ````
> 
> ## 🎯 **結論**
> 
> 目前的拆分**方向正確**，但還可以更進一步：
> 
> **優點：**
> - ✅ 邏輯與 UI 分離的思路正確
> - ✅ Hook 的職責相對明確
> - ✅ 可測試性有所提升
> 
> **建議改善：**
> - 🔧 將 `usePromptPageLogic` 進一步拆分成更小的 Hooks
> - 🔧 將 page.tsx 拆分成更小的組件
> - 🔧 移除 Hook 中的 UI refs，保持純邏輯
> - 🔧 統一型別定義管理
> 
> 整體而言，這是一個**良好的開始**，建議繼續沿著這個方向深化拆分！

在資深前端工程師，在撰寫前端專案，要如何有效來處理這樣的狀況。
請協助我逐步拆解

> Copilot: 作為資深前端工程師，我來協助你逐步拆解這個複雜的組件。讓我們採用漸進式重構的方式，確保每一步都是可測試和可維護的。
> 
> ## 🎯 **拆解策略**
> 
> ### 階段一：建立更細緻的 Hook 架構
> 
> 首先，我們需要將 `usePromptPageLogic` 拆分成職責更單一的 Hooks： 讓我們開始逐步拆解：
> 
> ### 1. 建立表單狀態管理 Hook
> 
> ````typescript
> import { useState, useEffect, useCallback } from 'react';
> import { useCurrentPrompt } from '@/lib/useCurrentPrompt';
> import { deepEqual } from '@/lib/utils/deepEqual';
> 
> interface PromptFormState {
>   name: string;
>   shortcut: string;
>   content: string;
> }
> 
> export const usePromptForm = (promptId: string) => {
>   const { prompt: currentPrompt } = useCurrentPrompt(promptId);
>   
>   // 表單狀態
>   const [formState, setFormState] = useState<PromptFormState>({
>     name: "",
>     shortcut: "",
>     content: ""
>   });
>   
>   // 初始值（用於比較變更）
>   const [initialValues, setInitialValues] = useState<PromptFormState>({
>     name: "",
>     shortcut: "",
>     content: ""
>   });
>   
>   // 是否有未儲存變更
>   const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
> 
>   // 載入初始值
>   useEffect(() => {
>     if (currentPrompt) {
>       const newFormState = {
>         name: currentPrompt.name,
>         shortcut: currentPrompt.shortcut || "",
>         content: currentPrompt.content
>       };
>       
>       setFormState(newFormState);
>       setInitialValues(newFormState);
>       setHasUnsavedChanges(false);
>     }
>   }, [currentPrompt]);
> 
>   // 檢查變更
>   useEffect(() => {
>     const hasChanges = !deepEqual(formState, initialValues);
>     setHasUnsavedChanges(hasChanges && !!currentPrompt);
>   }, [formState, initialValues, currentPrompt]);
> 
>   // 更新表單欄位
>   const updateField = useCallback(<K extends keyof PromptFormState>(
>     field: K, 
>     value: PromptFormState[K]
>   ) => {
>     setFormState(prev => ({ ...prev, [field]: value }));
>   }, []);
> 
>   // 重置為初始值
>   const resetForm = useCallback(() => {
>     setFormState(initialValues);
>     setHasUnsavedChanges(false);
>   }, [initialValues]);
> 
>   // 標記為已儲存
>   const markAsSaved = useCallback(() => {
>     setInitialValues(formState);
>     setHasUnsavedChanges(false);
>   }, [formState]);
> 
>   return {
>     // 狀態
>     ...formState,
>     hasUnsavedChanges,
>     currentPrompt,
>     
>     // 方法
>     updateField,
>     resetForm,
>     markAsSaved,
>     
>     // 便利的更新方法
>     setName: (name: string) => updateField('name', name),
>     setShortcut: (shortcut: string) => updateField('shortcut', shortcut),
>     setContent: (content: string) => updateField('content', content),
>   };
> };
> ````
> 
> ### 2. 建立快捷鍵驗證 Hook
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
>   // 檢查快捷鍵衝突
>   const validateShortcut = useCallback((
>     newShortcut: string
>   ): { isValid: boolean; error?: ShortcutError } => {
>     const trimmedShortcut = newShortcut.trim();
>     
>     if (!trimmedShortcut) {
>       return { isValid: true };
>     }
> 
>     const allOtherPrompts = folders
>       .flatMap(folder => folder.prompts)
>       .filter(p => p.id !== promptId);
> 
>     for (const prompt of allOtherPrompts) {
>       const existingShortcut = prompt.shortcut ?? "";
>       
>       // 完全相符
>       if (trimmedShortcut === existingShortcut) {
>         return {
>           isValid: false,
>           error: {
>             conflictingShortcut: existingShortcut,
>             message: "請選擇一個唯一的快捷鍵。"
>           }
>         };
>       }
>       
>       // 部分重疊 (prefix)
>       if (
>         trimmedShortcut.length > 0 &&
>         existingShortcut.length > 0 &&
>         (existingShortcut.startsWith(trimmedShortcut) || 
>          trimmedShortcut.startsWith(existingShortcut))
>       ) {
>         return {
>           isValid: false,
>           error: {
>             conflictingShortcut: existingShortcut,
>             message: "快捷鍵不能與現有快捷鍵重疊。"
>           }
>         };
>       }
>     }
> 
>     return { isValid: true };
>   }, [folders, promptId]);
> 
>   // 設定快捷鍵並驗證
>   const setShortcutWithValidation = useCallback((shortcut: string) => {
>     const validation = validateShortcut(shortcut);
>     
>     if (validation.isValid) {
>       setShortcutError(null);
>     } else {
>       setShortcutError(validation.error || null);
>     }
>     
>     return validation.isValid;
>   }, [validateShortcut]);
> 
>   // 清除錯誤
>   const clearError = useCallback(() => {
>     setShortcutError(null);
>   }, []);
> 
>   return {
>     shortcutError,
>     validateShortcut,
>     setShortcutWithValidation,
>     clearError,
>   };
> };
> ````
> 
> ### 3. 建立自動儲存 Hook
> 
> ````typescript
> import { useCallback } from 'react';
> import { usePromptStore } from "@/stores/prompt";
> import { useAutoSave } from '@/hooks/useAutoSave';
> 
> interface UsePromptAutoSaveProps {
>   promptId: string;
>   formData: {
>     name: string;
>     shortcut: string;
>     content: string;
>   };
>   currentPrompt: any;
>   hasUnsavedChanges: boolean;
>   onSaveSuccess: () => void;
> }
> 
> export const usePromptAutoSave = ({
>   promptId,
>   formData,
>   currentPrompt,
>   hasUnsavedChanges,
>   onSaveSuccess
> }: UsePromptAutoSaveProps) => {
>   const { updatePrompt } = usePromptStore();
> 
>   const autoSaveHandler = useCallback(async () => {
>     if (!currentPrompt) return;
> 
>     const updatedPrompt = {
>       ...currentPrompt,
>       ...formData,
>     };
> 
>     try {
>       await updatePrompt(promptId, updatedPrompt);
>       onSaveSuccess();
>     } catch (error) {
>       console.error("儲存時發生錯誤:", error);
>       throw error;
>     }
>   }, [currentPrompt, formData, promptId, updatePrompt, onSaveSuccess]);
> 
>   const { triggerAutoSave } = useAutoSave({
>     onSave: autoSaveHandler,
>     delay: 2000,
>     enabled: hasUnsavedChanges,
>     promptId
>   });
> 
>   return {
>     triggerAutoSave,
>     saveNow: autoSaveHandler,
>   };
> };
> ````
> 
> ### 4. 重構後的主 Hook
> 
> ````typescript
> import { useCallback, useEffect } from 'react';
> import { usePromptForm } from './usePromptForm';
> import { useShortcutValidation } from './useShortcutValidation';
> import { usePromptAutoSave } from './usePromptAutoSave';
> 
> interface UsePromptPageLogicProps {
>   promptId: string;
> }
> 
> export const usePromptPageLogic = ({ promptId }: UsePromptPageLogicProps) => {
>   // 表單狀態管理
>   const formLogic = usePromptForm(promptId);
>   
>   // 快捷鍵驗證
>   const shortcutLogic = useShortcutValidation(promptId);
>   
>   // 自動儲存
>   const autoSaveLogic = usePromptAutoSave({
>     promptId,
>     formData: {
>       name: formLogic.name,
>       shortcut: formLogic.shortcut,
>       content: formLogic.content,
>     },
>     currentPrompt: formLogic.currentPrompt,
>     hasUnsavedChanges: formLogic.hasUnsavedChanges,
>     onSaveSuccess: formLogic.markAsSaved,
>   });
> 
>   // 觸發自動儲存當有變更時
>   useEffect(() => {
>     if (formLogic.hasUnsavedChanges) {
>       autoSaveLogic.triggerAutoSave();
>     }
>   }, [formLogic.hasUnsavedChanges, autoSaveLogic.triggerAutoSave]);
> 
>   // 處理名稱變更
>   const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
>     formLogic.setName(e.target.value);
>   }, [formLogic.setName]);
> 
>   // 處理快捷鍵變更
>   const handleShortcutChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
>     const newShortcut = e.target.value;
>     formLogic.setShortcut(newShortcut);
>     shortcutLogic.setShortcutWithValidation(newShortcut);
>   }, [formLogic.setShortcut, shortcutLogic.setShortcutWithValidation]);
> 
>   return {
>     // 表單狀態
>     name: formLogic.name,
>     shortcut: formLogic.shortcut,
>     content: formLogic.content,
>     hasUnsavedChanges: formLogic.hasUnsavedChanges,
>     currentPrompt: formLogic.currentPrompt,
>     
>     // 快捷鍵驗證
>     shortcutError: shortcutLogic.shortcutError,
>     
>     // 事件處理器
>     handleNameChange,
>     handleShortcutChange,
>     updateContent: formLogic.setContent,
>     clearShortcutError: shortcutLogic.clearError,
>     
>     // 進階操作
>     saveNow: autoSaveLogic.saveNow,
>     resetForm: formLogic.resetForm,
>   };
> };
> ````
> 
> ### 階段二：拆分 UI 組件
> 
> 現在讓我們拆分 page.tsx 中的 UI 組件：
> 
> ### 1. 頭部組件
> 
> ````typescript
> import React, { useRef, useState } from 'react';
> import { Input } from "@/components/ui/input";
> import { Button } from '@/components/ui/button';
> import { FaTag, FaKeyboard } from "react-icons/fa6";
> import SaveStatusIndicator from '@/components/ui/saveStatusIndicator';
> import ShortcutErrorAlert from "@/app/prompts/components/shortcutErrorAlert";
> import EditViewButtons, { Mode } from "@/app/prompts/components/editViewButtons";
> import TryItOutPopup from '../tryItOutPopup';
> 
> interface PromptHeaderProps {
>   name: string;
>   shortcut: string;
>   shortcutError: any;
>   mode: Mode;
>   onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
>   onShortcutChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
>   onModeChange: (mode: Mode) => void;
>   onClearShortcutError: () => void;
>   onToggleMobilePanel: () => void;
> }
> 
> export const PromptHeader = ({
>   name,
>   shortcut,
>   shortcutError,
>   mode,
>   onNameChange,
>   onShortcutChange,
>   onModeChange,
>   onClearShortcutError,
>   onToggleMobilePanel,
> }: PromptHeaderProps) => {
>   const [isPopupVisible, setIsPopupVisible] = useState(false);
>   const tryItOutButtonRef = useRef<HTMLButtonElement>(null);
> 
>   return (
>     <header className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] mb-4 pt-4 sm:pt-6 md:pt-4 gap-y-4 lg:gap-y-0 justify-items-start sm:justify-items-stretch">
>       <div className="grid grid-cols-2 gap-x-4 lg:pr-4">
>         {/* Prompt 名稱 */}
>         <div className="relative">
>           <SaveStatusIndicator className="absolute -top-8 left-0 z-10 sm:-top-7 md:-top-6" />
>           <Input 
>             className="pl-9 h-12" 
>             placeholder="Type prompt name..." 
>             value={name} 
>             onChange={onNameChange}
>             data-no-extension="true"
>             data-exclude-extension="true"
>             autoComplete="off"
>             autoCorrect="off"
>             spellCheck="false"
>           />
>           <FaTag className="absolute left-[10px] top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
>         </div>
>         
>         {/* 快捷鍵 */}
>         <div className="relative">
>           <div className="relative">
>             <Input 
>               className="pl-9 pr-24 h-12" 
>               placeholder="Add a shortcut..." 
>               value={shortcut} 
>               onChange={onShortcutChange}
>               data-no-extension="true"
>               data-exclude-extension="true"
>               autoComplete="off"
>               autoCorrect="off"
>               spellCheck="false"
>             />
>             <FaKeyboard className="absolute left-[10px] top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
>             <Button
>               ref={tryItOutButtonRef}
>               className="absolute right-[10px] top-1/2 h-8 px-2 text-xs sm:text-sm -translate-y-1/2"
>               onClick={e => {
>                 e.stopPropagation();
>                 setIsPopupVisible(prev => !prev);
>               }}
>             >
>               Try it out
>             </Button>
>           </div>
>           {shortcutError && (
>             <ShortcutErrorAlert 
>               error={shortcutError} 
>               onClose={onClearShortcutError} 
>             />
>           )}
>           {isPopupVisible && (
>             <TryItOutPopup 
>               tryItOutButtonRef={tryItOutButtonRef} 
>               shortcut={shortcut} 
>               onClose={() => setIsPopupVisible(false)} 
>             />
>           )}
>         </div>
>       </div>
>       
>       <div className="flex items-center justify-between lg:justify-end space-x-2">
>         <EditViewButtons mode={mode} onModeChange={onModeChange} />
>         <Button
>           className="h-10 lg:hidden text-primary border-secondary hover:bg-light hover:text-primary"
>           variant="outline"
>           onClick={onToggleMobilePanel}
>         >
>           Tools
>         </Button>
>       </div>
>     </header>
>   );
> };
> ````
> 
> ### 2. 編輯器組件邏輯 Hook
> 
> ````typescript
> import { useState, useRef, useMemo, useCallback } from 'react';
> import { Editor } from '@tiptap/react';
> import { NodeSelection } from 'prosemirror-state';
> import { DropdownEditInfo, TextInputEditInfo, EditInfo } from '@/types/prompt';
> import { formTextSpec } from "@/lib/specs/formTextSpec";
> import { formMenuSpec } from "@/lib/specs/formMenuSpec";
> import { buildFormData } from '@/lib/buildFormData';
> 
> export const useEditorLogic = () => {
>   // Editor 實例
>   const editorRef = useRef<Editor | null>(null);
>   
>   // 對話框狀態
>   const [textInputEditInfo, setTextInputEditInfo] = useState<TextInputEditInfo | null>(null);
>   const [dropdownEditInfo, setDropdownEditInfo] = useState<DropdownEditInfo | null>(null);
>   const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);
>   const [isDropdownDialogOpen, setIsDropdownDialogOpen] = useState(false);
>   const [isEditPanelVisible, setIsEditPanelVisible] = useState(false);
> 
>   // 取得目前的編輯資訊
>   const activeEditInfo = useMemo(() => {
>     const editInfoList = [textInputEditInfo, dropdownEditInfo];
>     return editInfoList.find(
>       (editInfo) => editInfo?.type === "formtext" || editInfo?.type === "formmenu"
>     ) || null;
>   }, [textInputEditInfo, dropdownEditInfo]);
> 
>   // 插入文字欄位
>   const handleInsertTextFieldClick = useCallback(() => {
>     setTextInputEditInfo(null);
>     setIsTextDialogOpen(true);
>   }, []);
> 
>   // 插入選單欄位
>   const handleInsertMenuFieldClick = useCallback(() => {
>     setDropdownEditInfo(null);
>     setIsDropdownDialogOpen(true);
>   }, []);
> 
>   // 處理文字欄位點擊
>   const handleFormTextNodeClick = useCallback(({
>     pos,
>     name,
>     default: defaultValue,
>   }: {
>     pos: number;
>     name: string;
>     default: string;
>   }) => {
>     setTextInputEditInfo({ type: "formtext", pos, name, default: defaultValue });
>     setIsEditPanelVisible(true);
>   }, []);
> 
>   // 處理選單欄位點擊
>   const handleFormMenuNodeClick = useCallback(({
>     pos,
>     name,
>     default: defaultValue,
>     options,
>     multiple,
>   }: {
>     pos: number;
>     name: string;
>     default: string | string[];
>     options: string[];
>     multiple: boolean;
>   }) => {
>     setTextInputEditInfo(null);
>     setDropdownEditInfo({
>       type: "formmenu",
>       pos,
>       name,
>       default: defaultValue,
>       options: options,
>       multiple,
>     });
>     setIsEditPanelVisible(true);
>   }, []);
> 
>   // 編輯器點擊
>   const handleEditorClick = useCallback(() => {
>     setIsEditPanelVisible(false);
>   }, []);
> 
>   // 插入文字欄位
>   const handleTextFieldInsert = useCallback((name: string, defaultValue: string) => {
>     const editor = editorRef.current;
>     if (!editor || textInputEditInfo) return;
> 
>     editor
>       .chain()
>       .focus()
>       .insertContent({
>         type: "formtext",
>         attrs: {
>           promptData: buildFormData(formTextSpec, 'formtext', {
>             name: name,
>             default: defaultValue,
>           }),
>         },
>       })
>       .run();
>     
>     setIsTextDialogOpen(false);
>     return editor.getHTML();
>   }, [textInputEditInfo]);
> 
>   // 插入下拉選單
>   const handleDropDownMenuInsert = useCallback((
>     name: string,
>     values: string[],
>     selectedValues: string | string[],
>     multiple: boolean
>   ) => {
>     const editor = editorRef.current;
>     if (!editor || dropdownEditInfo) return;
> 
>     editor
>       .chain()
>       .focus()
>       .insertContent({
>         type: "formmenu",
>         attrs: {
>           promptData: buildFormData(formMenuSpec, 'formmenu', {
>             name: name,
>             options: values,
>             multiple: multiple,
>             default: selectedValues,
>           }),
>         },
>       })
>       .run();
> 
>     setIsDropdownDialogOpen(false);
>     return editor.getHTML();
>   }, [dropdownEditInfo]);
> 
>   // 更新節點屬性
>   const updateNodeAttributes = useCallback((
>     updates: { [key: string]: string | string[] | boolean | null },
>     onContentChange: (content: string) => void
>   ) => {
>     const editor = editorRef.current;
>     if (!editor) return;
> 
>     // 處理文字輸入
>     if (textInputEditInfo) {
>       const updatedEditInfo: TextInputEditInfo = {
>         ...textInputEditInfo,
>         ...updates,
>       };
>       setTextInputEditInfo(updatedEditInfo);
>       
>       const { pos } = textInputEditInfo;
>       const { doc } = editor.state;
>       const nodeSelection = NodeSelection.create(doc, pos);
>       editor.view.dispatch(editor.state.tr.setSelection(nodeSelection));
>       
>       Object.entries(updates).forEach(([key, newValue]) => {
>         editor
>           .chain()
>           .updateAttributes("formtext", {
>             promptData: buildFormData(formTextSpec, 'formtext', {
>               name: key === "name" ? newValue as string : updatedEditInfo.name,
>               default: key === "default" ? newValue as string : updatedEditInfo.default,
>             }),
>           })
>           .run();
>       });
>     }
>     
>     // 處理下拉選單
>     else if (dropdownEditInfo) {
>       const updatedEditInfo = {
>         ...dropdownEditInfo,
>         ...updates,
>       };
>       setDropdownEditInfo(updatedEditInfo);
>       
>       const { pos } = dropdownEditInfo;
>       const { doc } = editor.state;
>       const nodeSelection = NodeSelection.create(doc, pos);
>       editor.view.dispatch(editor.state.tr.setSelection(nodeSelection));
>       
>       Object.entries(updates).forEach(([key, newValue]) => {
>         editor
>           .chain()
>           .updateAttributes("formmenu", {
>             promptData: buildFormData(formMenuSpec, 'formmenu', {
>               name: key === "name" ? newValue as string : updatedEditInfo.name,
>               options: key === "options" ? newValue : updatedEditInfo.options,
>               multiple: updatedEditInfo.multiple,
>               default: key === "default" ? newValue : updatedEditInfo.default,
>             }),
>           })
>           .run();
>       });
>     }
> 
>     // 觸發內容變更
>     onContentChange(editor.getHTML());
>   }, [textInputEditInfo, dropdownEditInfo]);
> 
>   return {
>     // Refs
>     editorRef,
>     
>     // 狀態
>     textInputEditInfo,
>     dropdownEditInfo,
>     isTextDialogOpen,
>     isDropdownDialogOpen,
>     isEditPanelVisible,
>     activeEditInfo,
>     
>     // 方法
>     handleInsertTextFieldClick,
>     handleInsertMenuFieldClick,
>     handleFormTextNodeClick,
>     handleFormMenuNodeClick,
>     handleEditorClick,
>     handleTextFieldInsert,
>     handleDropDownMenuInsert,
>     updateNodeAttributes,
>     
>     // 狀態設定器
>     setIsTextDialogOpen,
>     setIsDropdownDialogOpen,
>   };
> };
> ````
> 
> ### 3. 重構後的主頁面
> 
> ````typescript
> 'use client';
> import { useState } from 'react';
> import TipTapEditor from '@/app/components/tipTapEditor';
> import Sidebar from './editorSidebar';
> import InsertTextFieldDialog from './InsertTextFieldDialog';
> import InsertDropdownMenuDialog from './InsertDropDownMenuDialog';
> import EditPanel from './editPanel';
> import { Mode } from "@/app/prompts/components/editViewButtons";
> import PreviewPrompt from "@/app/prompts/components/previewPrompt";
> import { PromptHeader } from './components/PromptHeader';
> import { usePromptPageLogic } from './hooks/usePromptPageLogic';
> import { useEditorLogic } from './hooks/useEditorLogic';
> import { useMobilePanel } from './hooks/useMobilePanel';
> 
> interface PromptPageProps {
>   params: {
>     promptId: string;
>   };
> }
> 
> const PromptPage = ({ params }: PromptPageProps) => {
>   const { promptId } = params;
>   const [mode, setMode] = useState<Mode>("edit");
>   
>   // 主要邏輯
>   const promptLogic = usePromptPageLogic({ promptId });
>   const editorLogic = useEditorLogic();
>   const mobilePanel = useMobilePanel();
> 
>   // 處理編輯器內容變更
>   const handleEditorContentChange = (newContent: string) => {
>     promptLogic.updateContent(newContent);
>   };
> 
>   // 處理文字欄位插入
>   const handleTextFieldInsert = (name: string, defaultValue: string) => {
>     const newContent = editorLogic.handleTextFieldInsert(name, defaultValue);
>     if (newContent) {
>       handleEditorContentChange(newContent);
>     }
>   };
> 
>   // 處理下拉選單插入
>   const handleDropDownMenuInsert = (
>     name: string,
>     values: string[],
>     selectedValues: string | string[],
>     multiple: boolean
>   ) => {
>     const newContent = editorLogic.handleDropDownMenuInsert(name, values, selectedValues, multiple);
>     if (newContent) {
>       handleEditorContentChange(newContent);
>     }
>   };
> 
>   // 處理節點屬性更新
>   const handleNodeAttributeUpdate = (updates: { [key: string]: string | string[] | boolean | null }) => {
>     editorLogic.updateNodeAttributes(updates, handleEditorContentChange);
>   };
> 
>   return (
>     <div className="flex flex-col h-full">
>       {/* 頭部 */}
>       <PromptHeader
>         name={promptLogic.name}
>         shortcut={promptLogic.shortcut}
>         shortcutError={promptLogic.shortcutError}
>         mode={mode}
>         onNameChange={promptLogic.handleNameChange}
>         onShortcutChange={promptLogic.handleShortcutChange}
>         onModeChange={setMode}
>         onClearShortcutError={promptLogic.clearShortcutError}
>         onToggleMobilePanel={mobilePanel.toggle}
>       />
> 
>       {/* 主要內容 */}
>       <main className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] flex-1 min-h-0">
>         {mode === "edit" ? (
>           <>
>             {/* 編輯器區域 */}
>             <section className="flex flex-col lg:pr-4 py-4 lg:border-r lg:border-gray-200 overflow-y-auto">
>               <TipTapEditor
>                 value={promptLogic.content}
>                 onChange={handleEditorContentChange}
>                 onEditorReady={editor => (editorLogic.editorRef.current = editor)}
>                 onFormTextNodeClick={editorLogic.handleFormTextNodeClick}
>                 onFormMenuNodeClick={editorLogic.handleFormMenuNodeClick}
>                 onEditorClick={editorLogic.handleEditorClick}
>               />
>             </section>
> 
>             {/* 桌面版側邊欄 */}
>             <div className="hidden lg:block">
>               <aside className="min-h-0 overflow-y-auto">
>                 {editorLogic.isEditPanelVisible && editorLogic.activeEditInfo ? (
>                   <EditPanel 
>                     editInfo={editorLogic.activeEditInfo} 
>                     onChange={handleNodeAttributeUpdate} 
>                   />
>                 ) : (
>                   <Sidebar
>                     onInsertTextFieldClick={editorLogic.handleInsertTextFieldClick}
>                     onInsertMenuFieldClick={editorLogic.handleInsertMenuFieldClick}
>                   />
>                 )}
>               </aside>
>             </div>
>             
>             {/* 手機版覆蓋面板 */}
>             {mobilePanel.isVisible && (
>               <div className="fixed inset-0 z-50 flex justify-end">
>                 <div
>                   className="fixed inset-0 bg-black opacity-50"
>                   onClick={mobilePanel.close}
>                 />
>                 <aside className={`relative md:w-1/4 max-w-xs bg-white overflow-y-auto ${mobilePanel.closingClass}`}>
>                   {editorLogic.isEditPanelVisible && editorLogic.activeEditInfo ? (
>                     <EditPanel 
>                       editInfo={editorLogic.activeEditInfo} 
>                       onChange={handleNodeAttributeUpdate} 
>                     />
>                   ) : (
>                     <Sidebar
>                       onInsertTextFieldClick={editorLogic.handleInsertTextFieldClick}
>                       onInsertMenuFieldClick={editorLogic.handleInsertMenuFieldClick}
>                     />
>                   )}
>                 </aside>
>               </div>
>             )}
>           </>
>         ) : (
>           <div className="border-r border-gray-200">
>             <PreviewPrompt content={promptLogic.content} shortcut={promptLogic.shortcut} />
>           </div>
>         )}
>       </main>
> 
>       {/* 對話框 */}
>       <InsertTextFieldDialog
>         isOpen={editorLogic.isTextDialogOpen}
>         onClose={() => editorLogic.setIsTextDialogOpen(false)}
>         onInsert={handleTextFieldInsert}
>         defaultLabel={editorLogic.textInputEditInfo?.name || ""}
>         defaultdefault={editorLogic.textInputEditInfo?.default || ""}
>       />
>       <InsertDropdownMenuDialog
>         isOpen={editorLogic.isDropdownDialogOpen}
>         onClose={() => editorLogic.setIsDropdownDialogOpen(false)}
>         onInsert={handleDropDownMenuInsert}
>         defaultName={editorLogic.dropdownEditInfo?.name}
>         defaultOptionValues={editorLogic.dropdownEditInfo?.options}
>         defaultMultiple={editorLogic.dropdownEditInfo?.multiple}
>         selectedValue={editorLogic.dropdownEditInfo?.default}
>       />
>     </div>
>   );
> };
> 
> export default PromptPage;
> ````
> 
> ### 4. 手機版面板 Hook
> 
> ````typescript
> import { useState, useCallback } from 'react';
> 
> export const useMobilePanel = () => {
>   const [isOpen, setIsOpen] = useState(false);
>   const [isClosing, setIsClosing] = useState(false);
> 
>   const open = useCallback(() => {
>     setIsOpen(true);
>     setIsClosing(false);
>   }, []);
> 
>   const close = useCallback(() => {
>     setIsClosing(true);
>     setTimeout(() => {
>       setIsClosing(false);
>       setIsOpen(false);
>     }, 300);
>   }, []);
> 
>   const toggle = useCallback(() => {
>     if (isOpen) {
>       close();
>     } else {
>       open();
>     }
>   }, [isOpen, close, open]);
> 
>   return {
>     isVisible: isOpen || isClosing,
>     isOpen,
>     isClosing,
>     closingClass: isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right',
>     open,
>     close,
>     toggle,
>   };
> };
> ````
> 
> ## 🎯 **拆解的效益**
> 
> ### ✅ **單一職責原則**
> - 每個 Hook 只負責一個特定功能
> - 每個組件只處理特定的 UI 區域
> 
> ### ✅ **可測試性**
> - 邏輯 Hook 可以獨立測試
> - UI 組件測試更專注
> 
> ### ✅ **可重用性**
> - `usePromptForm` 可在其他表單中重用
> - `useShortcutValidation` 可在其他地方使用
> 
> ### ✅ **維護性**
> - 清晰的檔案結構和命名
> - 容易找到和修改特定功能
> 
> ### ✅ **型別安全**
> - 每個 Hook 都有明確的型別定義
> - 介面清晰明確
> 
> 這樣的拆解讓程式碼更加模組化、可測試且易於維護，符合現代 React 開發的最佳實踐！
