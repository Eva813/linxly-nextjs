'use client';
import React from 'react';
import dynamic from 'next/dynamic';
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
          onEditorReady={(editor) => {
            editorRef.current = editor;
          }}
          onFormTextNodeClick={handleFormTextNodeClick}
          onFormMenuNodeClick={handleFormMenuNodeClick}
          onEditorClick={handleEditorClick}
          onInsertTextFieldClick={handleInsertTextFieldClick}
          onInsertMenuFieldClick={handleInsertMenuFieldClick}
          onTextInputChange={(updates) => {
            const newContent = handleTextInputChange(updates);
            if (newContent) updateContent(newContent);
          }}
          onMobilePanelToggle={toggleMobilePanel}
        />
      </main>

      <InsertTextFieldDialog
        isOpen={isTextDialogOpen}
        onClose={() => setIsTextDialogOpen(false)}
        onInsert={(name, defaultValue) => {
          const newContent = handleTextFieldInsert(name, defaultValue);
          if (newContent) updateContent(newContent);
        }}
        defaultLabel={textInputEditInfo?.name || ""}
        defaultdefault={textInputEditInfo?.default || ""}
      />
      
      <InsertDropdownMenuDialog
        isOpen={isDropdownDialogOpen}
        onClose={() => setIsDropdownDialogOpen(false)}
        onInsert={(name, values, selectedValues, multiple) => {
          const newContent = handleDropDownMenuInsert(name, values, selectedValues, multiple);
          if (newContent) updateContent(newContent);
        }}
        defaultName={dropdownEditInfo?.name}
        defaultOptionValues={dropdownEditInfo?.options}
        defaultMultiple={dropdownEditInfo?.multiple}
        selectedValue={dropdownEditInfo?.default}
      />
    </div>
  );
};

export default PromptPage;