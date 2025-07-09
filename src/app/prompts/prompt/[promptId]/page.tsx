'use client';
import React, { useEffect, useState } from 'react';
import { PromptHeader, EditorSection } from './components';
import InsertTextFieldDialog from './InsertTextFieldDialog';
import InsertDropdownMenuDialog from './InsertDropDownMenuDialog';
import { usePromptPageLogic, useEditorLogic, useViewAndPanel } from './hooks';
// 權限判斷用
import { getFolderShares } from '@/api/folders';
import { useSession } from 'next-auth/react';
import { useCurrentPrompt } from '@/lib/useCurrentPrompt';
import EditorSkeleton from '@/app/prompts/components/editorSkeleton';
import { usePromptStore } from '@/stores/prompt';

interface PromptPageProps {
  params: {
    promptId: string;
  };
}

const PromptPage = ({ params }: PromptPageProps) => {
  const { promptId } = params;

  // 權限判斷邏輯
  const { folders } = usePromptStore();
  const { prompt: currentPrompt, loading } = useCurrentPrompt(promptId);
  const { data: session } = useSession();
  const [canEdit, setCanEdit] = useState<boolean | null>(null);


  
  // 業務邏輯
  const {
    name,
    shortcut,
    content,
    shortcutError,
    handleNameChange,
    handleShortcutChange,
    updateContent,
    clearShortcutError
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


  useEffect(() => {
    if (currentPrompt && session?.user?.email) {
      const parent = folders.find(f => f.prompts.some(s => s.id === currentPrompt.id));
      if (!parent) return;
      getFolderShares(parent.id)
        .then(list => {
          const permission = list.find(s => s.email === session.user.email)?.permission;
          const editable = permission !== 'viewer';
          setCanEdit(editable);
        })
        .catch(err => console.error("取得分享清單失敗:", err));
    }
  }, [currentPrompt, session?.user?.email, folders]);

  if (loading || canEdit === null) {
    return <EditorSkeleton />;
  }

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
          // editable={canEdit}
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