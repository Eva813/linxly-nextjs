import React from 'react';
import TipTapEditor from '@/app/components/tipTapEditor';
import Sidebar from '@/app/prompts/prompt/[promptId]/editorSidebar';
import EditPanel from '../editPanel';
import PreviewPrompt from "@/app/prompts/components/previewPrompt";
import { Mode } from "@/app/prompts/components/editViewButtons";
import { Editor } from '@tiptap/react';
import { DropdownEditInfo, TextInputEditInfo } from '@/types/prompt';

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
}

export const EditorSection = ({
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
}: EditorSectionProps) => {
  if (mode === "preview") {
    return (
      <div className="border-r border-gray-200">
        <PreviewPrompt content={content} shortcut={shortcut} />
      </div>
    );
  }

  return (
    <>
      <section className="flex flex-col lg:pr-4 py-4 lg:border-r lg:border-gray-200 overflow-y-auto">
        <TipTapEditor
          value={content}
          onChange={onContentChange}
          onEditorReady={(editor) => {
            editorRef.current = editor;
            onEditorReady(editor);
          }}
          onFormTextNodeClick={onFormTextNodeClick}
          onFormMenuNodeClick={onFormMenuNodeClick}
          onEditorClick={onEditorClick}
        />
      </section>

      {/* 桌面版側邊欄 */}
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
      
      {/* 手機版覆蓋面板 */}
      {(isMobilePanelOpen || isMobilePanelClosing) && (
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
};
