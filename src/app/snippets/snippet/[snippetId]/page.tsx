'use client';
import { useSnippetStore } from "@/stores/snippet";
import { Input } from "@/components/ui/input";
import { FaTag } from "react-icons/fa6";
import { FaKeyboard } from "react-icons/fa6";
import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import TipTapEditor from '@/app/components/tipTapEditor';
import Sidebar from '@/app/snippets/snippet/[snippetId]/editorSidebar'
import InsertTextFieldDialog from '@/app/snippets/snippet/[snippetId]/InsertTextFieldDialog'
import InsertDropdownMenuDialog from '@/app/snippets/snippet/[snippetId]/InsertDropDownMenuDialog';
import { Editor } from '@tiptap/react'
import { NodeSelection } from 'prosemirror-state'
import EditPanel from './editPanel'
import { Snippet } from '@/types/snippets'

interface SnippetPageProps {
  params: {
    snippetId: string;
  };
}

// 1. 定義個別的編輯狀態介面
interface TextInputEditInfo {
  type: "formtext";
  pos: number;
  name: string;
  defaultValue: string;
  [key: string]: string | number;
}
interface DropdownEditInfo {
  type: "formmenu";
  pos: number;
  name: string;
  defaultValue: string | string[];
  defaultOptionValues: string[];
  selectedValue: string | string[];
  multiple: boolean;
}
type UpdateHandler = {
  getAttributes: (
    editInfo: any,
    key: string,
    newValue: string | string[]
  ) => any;
  getNodeType: () => string;
};
type EditInfo = TextInputEditInfo | DropdownEditInfo;

const SnippetPage = ({ params }: SnippetPageProps) => {
  const { snippetId } = params;
  // 改用 useSnippetStore 取得 folders 與更新函式
  const { folders, updateSnippet } = useSnippetStore();
  const [name, setName] = useState("");
  const [shortcut, setShortcut] = useState("");
  const [content, setContent] = useState("");
  const [shortcutError, setShortcutError] = useState<string | null>(null);

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

  // 按下 sidebar 的 TextField
  const handleInsertTextFieldClick = () => {
    setTextInputEditInfo(null);
    setIsTextDialogOpen(true);
  };
  const handleInsertMenuFieldClick = () => {
    setDropdownEditInfo(null); // 清除編輯狀態
    setIsDropdownDialogOpen(true);
  };

  // 當用戶在編輯器裡點擊自訂 Node
  const handleFormTextNodeClick = ({
    pos,
    name,
    defaultValue,
  }: {
    pos: number;
    name: string;
    defaultValue: string;
  }) => {
    console.log("fix 修改");
    setTextInputEditInfo({ type: "formtext", pos, name, defaultValue });
    setIsEditPanelVisible(true);
  };

  const handleEditorClick = () => {
    setIsEditPanelVisible(false);
  };

  const handleFormMenuNodeClick = ({
    pos,
    name,
    defaultValue,
    options,
    multiple,
  }: {
    pos: number;
    name: string;
    defaultValue: string;
    options: string;
    multiple: boolean;
  }) => {
    setTextInputEditInfo(null);
    const optionsArray = options.split(",").map((opt) => opt.trim());
    const processedDefaultValue = multiple
      ? defaultValue.split(",").map((val) => val.trim())
      : defaultValue;
    console.log("傳入2", pos, "and", name, "and", processedDefaultValue, "and", optionsArray, "and", multiple);
    setDropdownEditInfo({
      type: "formmenu",
      pos,
      name,
      defaultValue: processedDefaultValue,
      defaultOptionValues: optionsArray,
      selectedValue: processedDefaultValue,
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
            snippetData: {
              name: name,
              default: defaultValue,
            },
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
    console.log(values, "and", selectedValues);
    if (!dropdownEditInfo) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "formmenu",
          attrs: {
            snippetData: {
              name: name,
              options: values.join(","),
              multiple: multiple,
              defaultValue: Array.isArray(selectedValues)
                ? selectedValues.join(",")
                : selectedValues,
            },
          },
        })
        .run();
    } else {
      const { pos } = dropdownEditInfo;
      const { doc } = editor.state;
      const nodeSelection = NodeSelection.create(doc, pos);
      const tr = editor.state.tr.setSelection(nodeSelection);
      editor.view.dispatch(tr);
      editor
        .chain()
        .focus()
        .updateAttributes("formmenu", {
          name,
          options: values.join(","),
          multiple: multiple,
          defaultValue: Array.isArray(selectedValues)
            ? selectedValues.join(",")
            : selectedValues,
        })
        .run();
    }
    setContent(editor.getHTML());
    setIsDropdownDialogOpen(false);
    setDropdownEditInfo(null);
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
    console.log("Conflicting snippet:", conflictingSnippet);
    if (conflictingSnippet) {
      setShortcutError(
        `Conflicting shortcut with ${conflictingSnippet.shortcut}. Please choose a unique shortcut.`
      );
    } else {
      setShortcutError(null);
    }
  };

  const updateHandlers: Record<string, UpdateHandler> = {
    formtext: {
      getAttributes: (editInfo, key, newValue) => ({
        snippetData: {
          name: key === "name" ? newValue : editInfo.name,
          default: key === "defaultValue" ? newValue : editInfo.defaultValue,
        },
      }),
      getNodeType: () => "formtext",
    },
    formmenu: {
      getAttributes: (editInfo, key, newValue) => ({
        snippetData: {
          name: key === "name" ? newValue : editInfo.name,
          options:
            key === "defaultOptionValues"
              ? Array.isArray(newValue)
                ? newValue.join(",")
                : newValue
              : Array.isArray(editInfo.defaultOptionValues)
              ? editInfo.defaultOptionValues.join(",")
              : editInfo.defaultOptionValues,
          multiple: editInfo.multiple,
          defaultValue:
            key === "selectedValue"
              ? Array.isArray(newValue)
                ? newValue.join(",")
                : newValue
              : Array.isArray(editInfo.selectedValue)
              ? editInfo.selectedValue.join(",")
              : editInfo.selectedValue,
        },
      }),
      getNodeType: () => "formmenu",
    },
  };

  const handleTextInputChange = (key: string, newValue: string | string[]) => {
    const editor = editorRef.current;
    if (!editor) return;
    if (textInputEditInfo) {
      const handler = updateHandlers.formtext;
      const processedValue = Array.isArray(newValue)
        ? newValue.join(",")
        : newValue;
      const updatedEditInfo: TextInputEditInfo = {
        ...textInputEditInfo,
        [key]: processedValue,
      };
      setTextInputEditInfo(updatedEditInfo);
      const { pos } = textInputEditInfo;
      const { doc } = editor.state;
      const nodeSelection = NodeSelection.create(doc, pos);
      editor.view.dispatch(editor.state.tr.setSelection(nodeSelection));
      editor
        .chain()
        .updateAttributes(handler.getNodeType(), handler.getAttributes(updatedEditInfo, key, newValue))
        .run();
    } else if (dropdownEditInfo) {
      const handler = updateHandlers.formmenu;
      const updatedEditInfo = {
        ...dropdownEditInfo,
        [key]: newValue,
      };
      setDropdownEditInfo(updatedEditInfo);
      const { pos } = dropdownEditInfo;
      const { doc } = editor.state;
      const nodeSelection = NodeSelection.create(doc, pos);
      editor.view.dispatch(editor.state.tr.setSelection(nodeSelection));
      editor
        .chain()
        .updateAttributes(handler.getNodeType(), handler.getAttributes(updatedEditInfo, key, newValue))
        .run();
    }
    setContent(editor.getHTML());
  };

  return (
    <div className="flex">
      <div className="flex-[3] pr-4">
        <div className="grid grid-cols-2 gap-x-4 mb-4">
          <div className="relative col-span-1">
            <Input
              className="pl-9"
              placeholder="Type snippet name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <FaTag className="absolute left-0 top-0 m-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          <div className="relative col-span-1">
            <Input
              className="pl-9"
              placeholder="Add a shortcut..."
              value={shortcut}
              onChange={handleShortcutChange}
            />
            <FaKeyboard className="absolute left-0 top-0 m-2.5 h-4 w-4 text-muted-foreground" />
            {shortcutError && <p className="text-red-500">{shortcutError}</p>}
          </div>
        </div>
        <TipTapEditor
          value={content}
          onChange={setContent}
          onEditorReady={(editorInstance) => {
            editorRef.current = editorInstance;
          }}
          onFormTextNodeClick={handleFormTextNodeClick}
          onFormMenuNodeClick={handleFormMenuNodeClick}
          onEditorClick={handleEditorClick}
        />
        <Button className="w-20" onClick={handleSave}>
          Save
        </Button>
      </div>
      <div className="flex-1 border-l">
        {isEditPanelVisible ? (
          <EditPanel editInfo={activeEditInfo} onChange={handleTextInputChange} />
        ) : (
          <Sidebar
            onInsertTextFieldClick={handleInsertTextFieldClick}
            onInsertMenuFieldClick={handleInsertMenuFieldClick}
          />
        )}
      </div>
      <InsertTextFieldDialog
        isOpen={isTextDialogOpen}
        onClose={() => setIsTextDialogOpen(false)}
        onInsert={handleTextFieldInsert}
        defaultLabel={textInputEditInfo?.name || ""}
        defaultDefaultValue={textInputEditInfo?.defaultValue || ""}
      />
      <InsertDropdownMenuDialog
        isOpen={isDropdownDialogOpen}
        onClose={() => setIsDropdownDialogOpen(false)}
        onInsert={handleDropDownMenuInsert}
        defaultName={dropdownEditInfo?.name}
        defaultOptionValues={dropdownEditInfo?.defaultOptionValues}
        defaultMultiple={dropdownEditInfo?.multiple}
        selectedValue={dropdownEditInfo?.selectedValue}
      />
    </div>
  );
};

export default SnippetPage;