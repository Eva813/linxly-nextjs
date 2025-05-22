'use client';
import { usePromptStore } from "@/stores/prompt";
import { Input } from "@/components/ui/input";
import { FaTag } from "react-icons/fa6";
import { FaKeyboard } from "react-icons/fa6";
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import TipTapEditor from '@/app/components/tipTapEditor';
import Sidebar from '@/app/prompts/prompt/[promptId]/editorSidebar'
import InsertTextFieldDialog from '@/app/prompts/prompt/[promptId]/InsertTextFieldDialog'
import InsertDropdownMenuDialog from '@/app/prompts/prompt/[promptId]/InsertDropDownMenuDialog';
import { Editor } from '@tiptap/react'
import { NodeSelection } from 'prosemirror-state'
import EditPanel from './editPanel'
import { formTextSpec } from "@/lib/specs/formTextSpec";
import { formMenuSpec } from "@/lib/specs/formMenuSpec";
import { buildFormData, IBuiltFormData } from '@/lib/buildFormData'
import { DropdownEditInfo, TextInputEditInfo, EditInfo } from '@/types/prompt'
import EditViewButtons, { Mode } from "@/app/prompts/components/editViewButtons";
import PreviewPrompt from "@/app/prompts/components/previewPrompt";
import TryItOutPopup from './tryItOutPopup';
import ShortcutErrorAlert  from "@/app/prompts/components/shortcutErrorAlert";
import { useLoadingStore } from '@/stores/loading';
// 權限判斷用
import { getFolderShares } from '@/api/folders';
import { useSession } from 'next-auth/react';
import { useCurrentPrompt } from '@/lib/useCurrentPrompt';
import EditorSkeleton from '@/app/prompts/components/editorSkeleton';

interface PromptDataMapping {
  formtext: IBuiltFormData<typeof formTextSpec>;
  formmenu: IBuiltFormData<typeof formMenuSpec>;
}
interface PromptPageProps {
  params: {
    promptId: string;
  };
}

interface ShortcutError {
  conflictingShortcut: string;
  message: string;
}


// 使用泛型並依據傳入的 type 取得對應的 promptData 型別
type UpdateHandler<T extends EditInfo> = {
  getAttributes: (
    editInfo: T,
    key: keyof T,
    newValue: string | boolean | string[] | null
  ) => {
    promptData: PromptDataMapping[T["type"]];
  };
  getNodeType: () => T["type"];
};

const PromptPage = ({ params }: PromptPageProps) => {
  const { promptId } = params;
  const { folders, updatePrompt } = usePromptStore();
  const { prompt: currentPrompt, loading } = useCurrentPrompt(promptId);

  const [name, setName] = useState("");
  const [shortcut, setShortcut] = useState("");
  const [content, setContent] = useState("");
  const [shortcutError, setShortcutError] = useState<ShortcutError | null>(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const tryItOutButtonRef = useRef<HTMLButtonElement>(null);

  const { setLoading } = useLoadingStore();


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
    if (currentPrompt) {
      setName(currentPrompt.name);
      setShortcut(currentPrompt.shortcut);
      setContent(currentPrompt.content);
    }
  }, [currentPrompt]);

  // 根據 snippet 所屬 folder 拿分享清單，設定 canEdit
  const { data: session } = useSession();
  const [canEdit, setCanEdit] = useState<boolean | null>(null);
  useEffect(() => {
    if (currentPrompt && session?.user?.email) {
      // 找到此 prompt 所屬 folder
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
  // if (loading) {
  //   return <EditorSkeleton />;
  // }

  const handleSave = async () => {
    if (currentPrompt) {
      setLoading(true); // 設定全域載入狀態

      const updatedPrompt = {
        ...currentPrompt,
        name,
        shortcut,
        content,
      };
      
      console.log("Updating prompt:", updatedPrompt);

      try {
        await Promise.all([
          updatePrompt(promptId, updatedPrompt),
          new Promise(resolve => setTimeout(resolve, 300)),
        ]);
      } catch (error) {
        console.error("儲存時發生錯誤:", error);
      } finally {
        setLoading(false); 
      }
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
            promptData: buildFormData(formTextSpec, 'formtext', {
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
            promptData: buildFormData(formMenuSpec, 'formmenu', {
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
    const conflictingPrompt = folders
      .flatMap((folder) => folder.prompts)
      .filter((s) => s.id !== promptId)
      .find(
        (s) =>
          shortcut === s.shortcut ||
          (shortcut.length > 1 &&
            (shortcut.startsWith(s.shortcut) || s.shortcut.startsWith(shortcut)))
      );
    if (conflictingPrompt) {
      setShortcutError({
        conflictingShortcut: conflictingPrompt.shortcut,
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
        promptData: buildFormData(formTextSpec, 'formtext', {
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
          promptData: buildFormData(formMenuSpec, 'formmenu', {
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
          {/** Prompt 名稱與捷徑 **/}
          <div className="relative">
            <Input className="pl-9 h-12" placeholder="Type prompt name..." value={name} onChange={e => setName(e.target.value)} />
            <FaTag className="absolute left-[10px] top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
          </div>
          {/** Shortcut **/}
          <div className="relative">
            <div className="relative">
              <Input className="pl-9 h-12" placeholder="Add a shortcut..." value={shortcut} onChange={handleShortcutChange} disabled={!canEdit} />
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
              maxHeight="calc(100vh - 300px)"
              editable={canEdit}
            />
            <Button className="w-20" onClick={handleSave} disabled={!canEdit}>Save</Button>
          </section>
            {canEdit && (
            <aside className="min-h-0 overflow-y-auto">
              {isEditPanelVisible && activeEditInfo ? (
                // 編輯，textInputEditInfo 或 dropdownEditInfo
                <EditPanel editInfo={activeEditInfo} onChange={handleTextInputChange} />
              ) : (
                <Sidebar
                  onInsertTextFieldClick={handleInsertTextFieldClick}
                  onInsertMenuFieldClick={handleInsertMenuFieldClick}
                />
              )}
            </aside>)} </>)
          : <div className="border-r border-gray-200">
            <PreviewPrompt content={content} shortcut={shortcut} />
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

export default PromptPage;
