'use client';
import { useSnippetStore } from "@/stores/snippet";
import { Input } from "@/components/ui/input";
import { FaTag } from "react-icons/fa6";
import { FaKeyboard } from "react-icons/fa6";
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import TipTapEditor from '@/app/components/tipTapEditor';
import Sidebar from '@/app/snippets/snippet/[snippetId]/editorSidebar'
import InsertTextFieldDialog from '@/app/snippets/snippet/[snippetId]/InsertTextFieldDialog'
import InsertDropdownMenuDialog from '@/app/snippets/snippet/[snippetId]/InsertDropDownMenuDialog';
import { Editor } from '@tiptap/react'
import { NodeSelection } from 'prosemirror-state'
import EditPanel from './editPanel'
import { formTextSpec } from "@/lib/specs/formTextSpec";
import { formMenuSpec } from "@/lib/specs/formMenuSpec";
import { buildFormData, IBuiltFormData } from '@/lib/buildFormData'
import { Snippet, DropdownEditInfo, TextInputEditInfo, EditInfo } from '@/types/snippets'
import EditViewButtons, { Mode } from "@/app/snippets/components/editViewButtons";
import PreviewSnippet from "@/app/snippets/components/previewSnippet";
import TryItOutPopup from './tryItOutPopup';
import ShortcutErrorAlert  from "@/app/snippets/components/shortcutErrorAlert";  
interface SnippetDataMapping {
  formtext: IBuiltFormData<typeof formTextSpec>;
  formmenu: IBuiltFormData<typeof formMenuSpec>;
}
interface SnippetPageProps {
  params: {
    snippetId: string;
  };
}

interface ShortcutError {
  conflictingShortcut: string;
  message: string;
}


// 使用泛型並依據傳入的 type 取得對應的 snippetData 型別
type UpdateHandler<T extends EditInfo> = {
  getAttributes: (
    editInfo: T,
    key: keyof T,
    newValue: string | boolean | string[] | null
  ) => {
    snippetData: SnippetDataMapping[T["type"]];
  };
  getNodeType: () => T["type"];
};

const SnippetPage = ({ params }: SnippetPageProps) => {
  const { snippetId } = params;
  const { folders, updateSnippet } = useSnippetStore();
  const [name, setName] = useState("");
  const [shortcut, setShortcut] = useState("");
  const [content, setContent] = useState("");
  const [shortcutError, setShortcutError] = useState<ShortcutError | null>(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const tryItOutButtonRef = useRef<HTMLButtonElement>(null);


  // 透過 ref 持有 editor 實例
  const editorRef = useRef<Editor | null>(null);
  // 對話框相關
  const [textInputEditInfo, setTextInputEditInfo] =
    useState<TextInputEditInfo | null>(null);
  const [dropdownEditInfo, setDropdownEditInfo] =
    useState<DropdownEditInfo | null>(null);
  const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);
  const [isDropdownDialogOpen, setIsDropdownDialogOpen] = useState(false);
  const [isEditPanelVisible, setIsEditPanelVisible] = useState(false); // 新增狀態
  const [mode, setMode] = useState<Mode>("edit");

  // 利用 useMemo 依據 folders 與 snippetId 找出對應的 snippet
  const currentSnippet = useMemo(() => {
    for (const folder of folders) {
      const snippet = folder.snippets.find((s: Snippet) => s.id === snippetId);
      if (snippet) {
        return snippet;
      }
    }
    return null;
  }, [folders, snippetId]);

  // 按下 sidebar 的 TextField
  const handleInsertTextFieldClick = useCallback(() => {
    setTextInputEditInfo(null);
    setIsTextDialogOpen(true);
  }, []);
  const handleInsertMenuFieldClick = useCallback(() => {
    setDropdownEditInfo(null); // 清除編輯狀態
    setIsDropdownDialogOpen(true);
  }, []);

  // 取得目前的編輯資訊
  const getActiveEditInfo = (
    textInputEditInfo: TextInputEditInfo | null,
    dropdownEditInfo: DropdownEditInfo | null
  ): EditInfo | null => {
    const editInfoList = [textInputEditInfo, dropdownEditInfo];
    return (
      editInfoList.find(
        (editInfo) =>
          editInfo?.type === "formtext" || editInfo?.type === "formmenu"
      ) || null
    );
  };

  const activeEditInfo = useMemo(
    () => getActiveEditInfo(textInputEditInfo, dropdownEditInfo),
    [textInputEditInfo, dropdownEditInfo]
  );

  useEffect(() => {
    if (currentSnippet) {
      setName(currentSnippet.name);
      setShortcut(currentSnippet.shortcut);
      setContent(currentSnippet.content);
    }
  }, [currentSnippet]);

  if (!currentSnippet) {
    return <p>Snippet not found.</p>;
  }

  const handleSave = () => {
    if (currentSnippet) {
      const updatedSnippet = {
        ...currentSnippet,
        name,
        shortcut,
        content,
      };
      console.log("Updating snippet:", updatedSnippet);
      updateSnippet(snippetId, updatedSnippet);
    }
  };


  // 當用戶在編輯器裡點擊自訂 Node
  const handleFormTextNodeClick = ({
    pos,
    name,
    default: defaultValue,
  }: {
    pos: number;
    name: string;
    default: string;
  }) => {
    setTextInputEditInfo({ type: "formtext", pos, name, default: defaultValue });
    setIsEditPanelVisible(true);
  };

  const handleEditorClick = () => {
    setIsEditPanelVisible(false);
  };

  const handleFormMenuNodeClick = ({
    pos,
    name,
    default: defaultValue,  // 這裡預期收到的是 default（由 FormMenuNode 回呼轉換）
    options,
    multiple,
  }: {
    pos: number;
    name: string;
    default: string | string[];
    options: string[]; // 傳入的是逗號分隔的字串
    multiple: boolean;
  }) => {
    setTextInputEditInfo(null);
    // 將 options 轉成陣列
    setDropdownEditInfo({
      type: "formmenu",
      pos,
      name,
      default: defaultValue,
      options: options,
      multiple,
    });
    setIsEditPanelVisible(true);
  };

  const handleTextFieldInsert = (name: string, defaultValue: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    if (!textInputEditInfo) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "formtext",
          attrs: {
            snippetData: buildFormData(formTextSpec, 'formtext', {
              name: name,
              default: defaultValue,
            }),
          },
        })
        .run();
      setContent(editor.getHTML());
      setIsTextDialogOpen(false);
    }
  };

  const handleDropDownMenuInsert = (
    name: string,
    values: string[],
    selectedValues: string | string[],
    multiple: boolean
  ) => {
    const editor = editorRef.current;
    if (!editor) return;
    if (!dropdownEditInfo) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "formmenu",
          attrs: {
            snippetData: buildFormData(formMenuSpec, 'formmenu', {
              name: name,
              options: values,
              multiple: multiple,
              default: selectedValues,
            }),
          },
        })
        .run();
    }

    setContent(editor.getHTML());
    setIsDropdownDialogOpen(false);
    // setDropdownEditInfo(null);
  };

  const handleShortcutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newShortcut = e.target.value;
    setShortcut(newShortcut);
    const conflictingSnippet = folders
      .flatMap((folder) => folder.snippets)
      .filter((s) => s.id !== snippetId)
      .find(
        (s) =>
          shortcut === s.shortcut ||
          (shortcut.length > 1 &&
            (shortcut.startsWith(s.shortcut) || s.shortcut.startsWith(shortcut)))
      );
    if (conflictingSnippet) {
      setShortcutError({
        conflictingShortcut: conflictingSnippet.shortcut,
        message: "Please choose a unique shortcut."
      });
    } else {
      setShortcutError(null);
    }
  };

  const updateHandlers: {
    formtext: UpdateHandler<TextInputEditInfo>;
    formmenu: UpdateHandler<DropdownEditInfo>;
  } = {
    formtext: {
      getAttributes: (editInfo, key, newValue) => ({
        snippetData: buildFormData(formTextSpec, 'formtext', {
          name: key === "name" ? newValue as string : editInfo.name,
          default: key === "default" ? newValue as string : editInfo.default,
        }),
      }),
      getNodeType: () => "formtext",
    },
    formmenu: {
      getAttributes: (editInfo, key, newValue) => (
        console.log('editInfo change ', key, newValue),
        {
          snippetData: buildFormData(formMenuSpec, 'formmenu', {
            name: key === "name" ? newValue as string : editInfo.name,
            options: key === "options" ? newValue : editInfo.options,
            multiple: editInfo.multiple,
            default: key === "default" ? newValue : editInfo.default,
          }),
        }),
      getNodeType: () => "formmenu",
    },
  };

  const handleTextInputChange = (updates: { [key: string]: string | string[] | boolean | null }) => {
    const editor = editorRef.current;
    if (!editor) return;

    if (textInputEditInfo) {
      const handler = updateHandlers.formtext;
      const updatedEditInfo: TextInputEditInfo = {
        ...textInputEditInfo,
        ...updates,
      };
      setTextInputEditInfo(updatedEditInfo);
      const { pos } = textInputEditInfo;
      const { doc } = editor.state;
      const nodeSelection = NodeSelection.create(doc, pos);
      editor.view.dispatch(editor.state.tr.setSelection(nodeSelection));
      Object.entries(updates).forEach(([key, newValue]) => {
        editor
          .chain()
          .updateAttributes(handler.getNodeType(), handler.getAttributes(updatedEditInfo, key, newValue))
          .run();
      });
    } else if (dropdownEditInfo) {
      const handler = updateHandlers.formmenu;
      const updatedEditInfo = {
        ...dropdownEditInfo,
        ...updates,
      };
      setDropdownEditInfo(updatedEditInfo);
      const { pos } = dropdownEditInfo;
      const { doc } = editor.state;
      const nodeSelection = NodeSelection.create(doc, pos);
      editor.view.dispatch(editor.state.tr.setSelection(nodeSelection));
      Object.entries(updates).forEach(([key, newValue]) => {
        editor
          .chain()
          .updateAttributes(handler.getNodeType(), handler.getAttributes(updatedEditInfo, key, newValue))
          .run();
      });
    }
    setContent(editor.getHTML());
  };

  return (
    <div className="flex flex-col h-full">
      <header className="grid grid-cols-[3fr_1fr] mb-4 pt-4">
        <div className="grid grid-cols-2 gap-x-4 pr-4">
          {/** Snippet 名稱與捷徑 **/}
          <div className="relative">
            <Input className="pl-9 h-12" placeholder="Type snippet name..." value={name} onChange={e => setName(e.target.value)} />
            <FaTag className="absolute left-[10px] top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
          </div>
          {/** Shortcut **/}
          <div className="relative">
            <div className="relative">
              <Input className="pl-9 h-12" placeholder="Add a shortcut..." value={shortcut} onChange={handleShortcutChange} />
              <FaKeyboard className="absolute left-[10px] top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
              <Button
                ref={tryItOutButtonRef}
                className="absolute right-[10px] top-1/2 h-8 px-4 -translate-y-1/2"
                onClick={e => {
                  e.stopPropagation();
                  setIsPopupVisible(prev => !prev);
                }}
              >
                Try it out
              </Button>
            </div>
            {shortcutError && <ShortcutErrorAlert error={shortcutError} onClose={() => setShortcutError(null)} />}
            {isPopupVisible && <TryItOutPopup tryItOutButtonRef={tryItOutButtonRef} shortcut={shortcut} onClose={() => setIsPopupVisible(false)} />}
          </div>
        </div>
        <EditViewButtons mode={mode} onModeChange={setMode} />
      </header>

      <main className="grid grid-cols-[3fr_1fr] flex-1 min-h-0">
        {mode === "edit" ? (
          <><section className="flex flex-col pr-4 py-4 border-r border-gray-200">
            <TipTapEditor
              value={content}
              onChange={setContent}
              onEditorReady={editor => (editorRef.current = editor)}
              onFormTextNodeClick={handleFormTextNodeClick}
              onFormMenuNodeClick={handleFormMenuNodeClick}
              onEditorClick={handleEditorClick}
              maxHeight='calc(100vh - 300px)'
            />
            <Button className="w-20" onClick={handleSave}>Save</Button>
          </section>

            <aside className="min-h-0 overflow-y-auto">
              {isEditPanelVisible && activeEditInfo ? (
                <EditPanel editInfo={activeEditInfo} onChange={handleTextInputChange} />
              ) : (
                <Sidebar
                  onInsertTextFieldClick={handleInsertTextFieldClick}
                  onInsertMenuFieldClick={handleInsertMenuFieldClick}
                />
              )}
            </aside></>)
          : <div className="border-r border-gray-200">
            <PreviewSnippet content={content} shortcut={shortcut} />
          </div>
        }
      </main>

      <InsertTextFieldDialog
        isOpen={isTextDialogOpen}
        onClose={() => setIsTextDialogOpen(false)}
        onInsert={handleTextFieldInsert}
        defaultLabel={textInputEditInfo?.name || ""}
        defaultdefault={textInputEditInfo?.default || ""}
      />
      <InsertDropdownMenuDialog
        isOpen={isDropdownDialogOpen}
        onClose={() => setIsDropdownDialogOpen(false)}
        onInsert={handleDropDownMenuInsert}
        defaultName={dropdownEditInfo?.name}
        defaultOptionValues={dropdownEditInfo?.options}
        defaultMultiple={dropdownEditInfo?.multiple}
        selectedValue={dropdownEditInfo?.default}
      />
    </div>
  );
};

export default SnippetPage;
