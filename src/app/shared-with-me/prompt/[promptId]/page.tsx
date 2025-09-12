'use client';
import React, { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Editor } from '@tiptap/react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';

// Import existing prompt components
import {
  PromptHeader,
  EditorSection,
} from '@/app/prompts/prompt/[promptId]/components';
import {
  usePromptPageLogic,
  useEditorLogic,
  useViewAndPanel,
} from '@/app/prompts/prompt/[promptId]/hooks';

// 懶載入 Dialog 組件 (只在用戶點擊插入時才需要)
const InsertTextFieldDialog = dynamic(
  () => import('@/app/prompts/prompt/[promptId]/InsertTextFieldDialog'),
  {
    ssr: false,
  }
);

const InsertDropdownMenuDialog = dynamic(
  () => import('@/app/prompts/prompt/[promptId]/InsertDropDownMenuDialog'),
  {
    ssr: false,
  }
);

interface SharedPromptPageProps {
  params: {
    promptId: string;
  };
}

const SharedPromptPage = ({ params }: SharedPromptPageProps) => {
  const { promptId } = params;
  const searchParams = useSearchParams();

  // Get context from search params for breadcrumb
  const folderId = searchParams?.get('folderId');
  const folderName = searchParams?.get('folderName');

  // 業務邏輯 - 重用現有邏輯
  const {
    name,
    shortcut,
    content,
    contentJSON,
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
  const handleEditorReady = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;
    },
    [editorRef]
  );

  // 對話框關閉函數 - 使用 useMemo 穩定化
  const dialogHandlers = useMemo(
    () => ({
      handleTextDialogClose: () => setIsTextDialogOpen(false),
      handleDropdownDialogClose: () => setIsDropdownDialogOpen(false),
    }),
    [setIsTextDialogOpen, setIsDropdownDialogOpen]
  );

  // 文本輸入變更處理器
  const handleTextInputChangeWrapper = useCallback(
    (updates: { [key: string]: string | string[] | boolean | null }) => {
      const newContent = handleTextInputChange(updates);
      if (newContent) updateContent(newContent);
    },
    [handleTextInputChange, updateContent]
  );

  // 文本欄位插入處理器
  const handleTextFieldInsertWrapper = useCallback(
    (name: string, defaultValue: string) => {
      const newContent = handleTextFieldInsert(name, defaultValue);
      if (newContent) updateContent(newContent);
    },
    [handleTextFieldInsert, updateContent]
  );

  // 下拉選單插入處理器
  const handleDropdownInsertWrapper = useCallback(
    (
      name: string,
      values: string[],
      selectedValues: string | string[],
      multiple: boolean
    ) => {
      const newContent = handleDropDownMenuInsert(
        name,
        values,
        selectedValues,
        multiple
      );
      if (newContent) updateContent(newContent);
    },
    [handleDropDownMenuInsert, updateContent]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Shared 專用的導航區 */}
      <div className="flex-shrink-0 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        {/* 麵包屑導航 */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/shared-with-me">Shared with Me</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {folderId && folderName && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={`/shared-with-me/${folderId}`}>
                      {folderName}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{name || 'Loading...'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* 重用現有的 PromptHeader */}
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

      {/* 重用現有的 EditorSection */}
      <main className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] flex-1 min-h-0">
        <EditorSection
          mode={mode}
          content={content}
          contentJSON={contentJSON}
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

      {/* 重用現有的對話框 */}
      <InsertTextFieldDialog
        isOpen={isTextDialogOpen}
        onClose={dialogHandlers.handleTextDialogClose}
        onInsert={handleTextFieldInsertWrapper}
        defaultLabel={textInputEditInfo?.name || ''}
        defaultdefault={textInputEditInfo?.default || ''}
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

export default SharedPromptPage;
