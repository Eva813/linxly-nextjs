import React, { useCallback } from 'react';
import dynamic from 'next/dynamic';
import TipTapEditor from '@/app/components/tipTapEditor';
import Sidebar from '@/app/prompts/prompt/[promptId]/editorSidebar';
import LoadingSpinner from '@/app/components/loadingSpinner';
import { Mode } from "@/app/prompts/components/editViewButtons";

// 動態載入 PreviewPrompt 組件，只在預覽模式時載入
const PreviewPrompt = dynamic(() => import("@/app/prompts/components/previewPrompt"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <LoadingSpinner />
    </div>
  )
});

// 動態載入 EditPanel 組件，只在點擊編輯節點時載入
const EditPanel = dynamic(() => import('../editPanel'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-4">
      <LoadingSpinner size="w-6 h-6" />
    </div>
  )
});
import { Editor } from '@tiptap/react';
import { DropdownEditInfo, TextInputEditInfo } from '@/types/prompt';
import { useEditableState } from '@/hooks/useEditableState';

type EditInfo = TextInputEditInfo | DropdownEditInfo;

interface EditorSectionProps {
  mode: Mode;
  content: string;
  shortcut: string;
  isEditPanelVisible: boolean;
  activeEditInfo: EditInfo | null;
  editorRef: React.MutableRefObject<Editor | null>;
  isMobilePanelOpen: boolean;
  isMobilePanelClosing: boolean;
  onContentChange: (content: string) => void;
  onEditorReady: (editor: Editor) => void;
  onFormTextNodeClick: (params: { pos: number; name: string; default: string }) => void;
  onFormMenuNodeClick: (params: { pos: number; name: string; default: string | string[]; options: string[]; multiple: boolean }) => void;
  onEditorClick: () => void;
  onInsertTextFieldClick: () => void;
  onInsertMenuFieldClick: () => void;
  onTextInputChange: (updates: { [key: string]: string | string[] | boolean | null }) => void;
  onMobilePanelToggle: () => void;
  isExternalUpdate?: () => boolean;
}

export const EditorSection = React.memo(({
  mode,
  content,
  shortcut,
  isEditPanelVisible,
  activeEditInfo,
  editorRef,
  isMobilePanelOpen,
  isMobilePanelClosing,
  onContentChange,
  onEditorReady,
  onFormTextNodeClick,
  onFormMenuNodeClick,
  onEditorClick,
  onInsertTextFieldClick,
  onInsertMenuFieldClick,
  onTextInputChange,
  onMobilePanelToggle,
  isExternalUpdate,
}: EditorSectionProps) => {
  const { canEdit } = useEditableState();

  const handleEditorReady = useCallback((editor: Editor) => {
    editorRef.current = editor;
    onEditorReady(editor);
  }, [onEditorReady, editorRef]);
  if (mode === "preview") {
    return (
      <div className="border-r border-gray-200 min-w-0 overflow-hidden">
        <PreviewPrompt content={content} shortcut={shortcut} />
      </div>
    );
  }

  return (
    <>
      <section className="flex flex-col lg:pr-4 py-4 lg:border-r lg:border-gray-200 overflow-y-auto">
        <TipTapEditor
          value={content}
          disabled={!canEdit}
          onChange={onContentChange}
          onEditorReady={handleEditorReady}
          onFormTextNodeClick={onFormTextNodeClick}
          onFormMenuNodeClick={onFormMenuNodeClick}
          onEditorClick={onEditorClick}
          isExternalUpdate={isExternalUpdate}
        />
      </section>

      {/* 桌面版側邊欄 */}
      {canEdit && (
        <div className="hidden lg:block">
          <aside className="min-h-0 overflow-y-auto">
            {isEditPanelVisible && activeEditInfo ? (
              <EditPanel editInfo={activeEditInfo} onChange={onTextInputChange} />
            ) : (
              <Sidebar
                onInsertTextFieldClick={onInsertTextFieldClick}
                onInsertMenuFieldClick={onInsertMenuFieldClick}
              />
            )}
          </aside>
        </div>
      )}
      
      {/* 手機版覆蓋面板 */}
      {canEdit && (isMobilePanelOpen || isMobilePanelClosing) && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black opacity-50"
            onClick={onMobilePanelToggle}
          />
          <aside className={`relative md:w-1/4 max-w-xs bg-white overflow-y-auto ${isMobilePanelClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}>
            {isEditPanelVisible && activeEditInfo ? (
              <EditPanel editInfo={activeEditInfo} onChange={onTextInputChange} />
            ) : (
              <Sidebar
                onInsertTextFieldClick={onInsertTextFieldClick}
                onInsertMenuFieldClick={onInsertMenuFieldClick}
              />
            )}
          </aside>
        </div>
      )}
    </>
  );
});

EditorSection.displayName = 'EditorSection';
