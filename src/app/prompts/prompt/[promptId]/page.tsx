'use client';
import React, { useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Editor } from '@tiptap/react';
import { PromptHeader, EditorSection } from './components';
import { usePromptPageLogic, useEditorLogic, useViewAndPanel } from './hooks';

// 懶載入 Dialog 組件 (只在用戶點擊插入時才需要)
const InsertTextFieldDialog = dynamic(() => import('./InsertTextFieldDialog'), {
  ssr: false,
});

const InsertDropdownMenuDialog = dynamic(() => import('./InsertDropDownMenuDialog'), {
  ssr: false,
});

interface PromptPageProps {
  params: {
    promptId: string;
  };
}

const PromptPage = ({ params }: PromptPageProps) => {
  const { promptId } = params;
  
  // 業務邏輯
  const {
    name,
    shortcut,
    content,
    shortcutError,
    handleNameChange,
    handleShortcutChange,
    updateContent,
    clearShortcutError,
  } = usePromptPageLogic({ promptId });

  const {
    editorRef,
    textInputEditInfo,
    dropdownEditInfo,
    isTextDialogOpen,
    isDropdownDialogOpen,
    isEditPanelVisible,
    activeEditInfo,
    setIsTextDialogOpen,
    setIsDropdownDialogOpen,
    handleInsertTextFieldClick,
    handleInsertMenuFieldClick,
    handleFormTextNodeClick,
    handleFormMenuNodeClick,
    handleEditorClick,
    handleTextFieldInsert,
    handleDropDownMenuInsert,
    handleTextInputChange,
  } = useEditorLogic();

  const {
    mode,
    isMobilePanelOpen,
    isMobilePanelClosing,
    setMode,
    toggleMobilePanel,
  } = useViewAndPanel();

  // 事件處理器 - 使用 useCallback 穩定化
  const handleEditorReady = useCallback((editor: Editor) => {
    editorRef.current = editor;
  }, [editorRef]);

  // 對話框關閉函數 - 使用 useMemo 穩定化
  const dialogHandlers = useMemo(() => ({
    handleTextDialogClose: () => setIsTextDialogOpen(false),
    handleDropdownDialogClose: () => setIsDropdownDialogOpen(false),
  }), [setIsTextDialogOpen, setIsDropdownDialogOpen]);

  // 文本輸入變更處理器
  const handleTextInputChangeWrapper = useCallback((updates: { [key: string]: string | string[] | boolean | null }) => {
    const newContent = handleTextInputChange(updates);
    if (newContent) updateContent(newContent);
  }, [handleTextInputChange, updateContent]);

  // 文本欄位插入處理器
  const handleTextFieldInsertWrapper = useCallback((name: string, defaultValue: string) => {
    const newContent = handleTextFieldInsert(name, defaultValue);
    if (newContent) updateContent(newContent);
  }, [handleTextFieldInsert, updateContent]);

  // 下拉選單插入處理器
  const handleDropdownInsertWrapper = useCallback((name: string, values: string[], selectedValues: string | string[], multiple: boolean) => {
    const newContent = handleDropDownMenuInsert(name, values, selectedValues, multiple);
    if (newContent) updateContent(newContent);
  }, [handleDropDownMenuInsert, updateContent]);

  return (
    <div className="flex flex-col h-full">
      <PromptHeader
        name={name}
        shortcut={shortcut}
        shortcutError={shortcutError}
        mode={mode}
        onNameChange={handleNameChange}
        onShortcutChange={handleShortcutChange}
        onModeChange={setMode}
        onClearShortcutError={clearShortcutError}
        onToggleMobilePanel={toggleMobilePanel}
      />

      <main className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] flex-1 min-h-0">
        <EditorSection
          mode={mode}
          content={content}
          shortcut={shortcut}
          isEditPanelVisible={isEditPanelVisible}
          activeEditInfo={activeEditInfo}
          editorRef={editorRef}
          isMobilePanelOpen={isMobilePanelOpen}
          isMobilePanelClosing={isMobilePanelClosing}
          onContentChange={updateContent}
          onEditorReady={handleEditorReady}
          onFormTextNodeClick={handleFormTextNodeClick}
          onFormMenuNodeClick={handleFormMenuNodeClick}
          onEditorClick={handleEditorClick}
          onInsertTextFieldClick={handleInsertTextFieldClick}
          onInsertMenuFieldClick={handleInsertMenuFieldClick}
          onTextInputChange={handleTextInputChangeWrapper}
          onMobilePanelToggle={toggleMobilePanel}
        />
      </main>

      <InsertTextFieldDialog
        isOpen={isTextDialogOpen}
        onClose={dialogHandlers.handleTextDialogClose}
        onInsert={handleTextFieldInsertWrapper}
        defaultLabel={textInputEditInfo?.name || ""}
        defaultdefault={textInputEditInfo?.default || ""}
      />
      
      <InsertDropdownMenuDialog
        isOpen={isDropdownDialogOpen}
        onClose={dialogHandlers.handleDropdownDialogClose}
        onInsert={handleDropdownInsertWrapper}
        defaultName={dropdownEditInfo?.name}
        defaultOptionValues={dropdownEditInfo?.options}
        defaultMultiple={dropdownEditInfo?.multiple}
        selectedValue={dropdownEditInfo?.default}
      />
    </div>
  );
};

export default PromptPage;