'use client';
import { useSnippets } from '@/contexts/SnippetsContext';
import { Input } from "@/components/ui/input";
import { FaTag } from "react-icons/fa6";
import { FaKeyboard } from "react-icons/fa6";
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import TipTapEditor from '@/app/components/tipTapEditor';
import Sidebar from '@/app/snippets/snippet/[snippetId]/editorSidebar'
import InsertTextFieldDialog from '@/app/snippets/snippet/[snippetId]/InsertTextFieldDialog'
import InsertDropdownMenuDialog from '@/app/snippets/snippet/[snippetId]/InsertDropDownMenuDialog';
import { Editor } from '@tiptap/react'
import { NodeSelection } from 'prosemirror-state'
import EditPanel from './editPanel'

interface SnippetPageProps {
  params: {
    snippetId: string;
  };
}
interface Snippet {
  id: string
  name: string
  shortcut: string
  content: string
}

// 1. 定義個別的編輯狀態介面
interface TextInputEditInfo {
  type: 'formtext';
  pos: number;
  name: string;
  defaultValue: string;
  [key: string]: string | number;
}
// export type TextInputEditInfo = Record<string, string>;


interface DropdownEditInfo {
  type: 'dropdown'
  pos: number;
  name: string;
  defaultValues?: string[];
  defaultOptionValues: string[];
  selectedValue: string | string[];
  multiple: boolean;
}
const SnippetPage = ({ params }: SnippetPageProps) => {
  const { snippetId } = params
  const { folders, updateSnippet } = useSnippets()
  const [name, setName] = useState('')
  const [shortcut, setShortcut] = useState('')
  const [content, setContent] = useState('')
  const [shortcutError, setShortcutError] = useState<string | null>(null);

  // 透過 ref 持有 editor 實例
  const editorRef = useRef<Editor | null>(null)
  // 對話框相關
  const [textInputEditInfo, setTextInputEditInfo] = useState<TextInputEditInfo | null>(null);
  const [dropdownEditInfo, setDropdownEditInfo] = useState<DropdownEditInfo | null>(null);
  const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);
  const [isDropdownDialogOpen, setIsDropdownDialogOpen] = useState(false);
  const [isEditPanelVisible, setIsEditPanelVisible] = useState(false); // 新增狀態


  // 查找對應的 snippet
  let currentSnippet: Snippet | null = null
  for (const folder of folders) {
    const snippet = folder.snippets.find((s: Snippet) => s.id === snippetId)
    if (snippet) {
      currentSnippet = snippet
      break
    }
  }

  useEffect(() => {
    if (currentSnippet) {
      setName(currentSnippet.name)
      setShortcut(currentSnippet.shortcut)
      setContent(currentSnippet.content)
    }
  }, [currentSnippet])

  if (!currentSnippet) {
    return <p>Snippet not found.</p>
  }

  const handleSave = () => {
    if (currentSnippet) {
      const updatedSnippet = {
        ...currentSnippet,
        name,
        shortcut,
        content,
      }
      console.log('Updating snippet:', updatedSnippet)
      updateSnippet(snippetId, updatedSnippet)
    }
  }

  // 按下 sidebar 的 TextField
  const handleInsertTextFieldClick = () => {
    setTextInputEditInfo(null)
    setIsTextDialogOpen(true)
  }
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
    pos: number
    name: string
    defaultValue: string
  }) => {
    console.log('fix 修改')
    setTextInputEditInfo({ type: 'formtext', pos, name, defaultValue })
    setIsEditPanelVisible(true);
  }

  const handleEditorClick = () => {
    setIsEditPanelVisible(false);
  };


  const handleFormMenuNodeClick = ({
    pos,
    name,
    defaultValue, // 會是呈現預選好的選項
    options,
    multiple,
  }: {
    pos: number
    name: string
    defaultValue: string
    options: string
    multiple: boolean
  }) => {
    console.log('傳入', pos, 'and', name, 'default', defaultValue, 'options', options, 'and', multiple)
    // 對應 dialog 中的變數名稱傳入
    const optionsArray = options.split(',').map(opt => opt.trim());
    // 設定 selectedValue 為陣列或字串
    const processedDefaultValue = multiple
      ? defaultValue.split(',').map(val => val.trim())
      : defaultValue;
    console.log('傳入2', pos, 'and', name, 'and', processedDefaultValue, 'and', optionsArray, 'and', multiple)
    setDropdownEditInfo({
      type: 'dropdown',
      pos,
      name,
      defaultOptionValues: optionsArray,
      selectedValue: processedDefaultValue,
      multiple
    });
    setIsDropdownDialogOpen(true);
  }

  // 對話框點擊「確認」時，將資料 insert
  const handleTextFieldInsert = (name: string, defaultValue: string) => {
    const editor = editorRef.current
    if (!editor) return

    if (!textInputEditInfo) {
      // === 新增 ===
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'formtext',
          attrs: {
            snippetData: {
              name: name,         // 使用者輸入的 label
              default: defaultValue, // 使用者輸入的 defaultValue
            },
          },
        })
        .run()
      // 立即更新 content 狀態
      setContent(editor.getHTML())
      setIsTextDialogOpen(false)
    }
  }

  const handleDropDownMenuInsert = (name: string, values: string[], selectedValues: string | string[], multiple: boolean) => {
    const editor = editorRef.current;
    if (!editor) return;
    console.log(values, 'and', selectedValues)
    if (!dropdownEditInfo) {
      // === 新增 ===
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'formMenu',
          attrs: {
            name,
            options: values.join(','),
            // 傳給 editor 的 extension
            multiple: multiple,
            defaultValue: Array.isArray(selectedValues)
              ? selectedValues.join(',')
              : selectedValues
          },
        })
        .run();
    } else {
      // === 編輯 === 
      const { pos } = dropdownEditInfo;
      const { doc } = editor.state;
      const nodeSelection = NodeSelection.create(doc, pos);
      const tr = editor.state.tr.setSelection(nodeSelection);
      editor.view.dispatch(tr);
      console.log('傳入Editt', name, 'option', values, selectedValues, 'multiple', multiple)
      editor
        .chain()
        .focus()
        .updateAttributes('formMenu', {
          name,
          options: values.join(','),
          // 傳給 editor 的 extension
          multiple: multiple,
          defaultValue: Array.isArray(selectedValues)
            ? selectedValues.join(',')
            : selectedValues
        })
        .run();
    }

    // 立即更新 content 狀態
    setContent(editor.getHTML());
    setIsDropdownDialogOpen(false);
    setDropdownEditInfo(null); // 重要：清除編輯狀態
  };


  const handleShortcutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newShortcut = e.target.value;
    setShortcut(newShortcut);
    // 檢查是否與現有的 shortcut 發生衝突
    const conflictingSnippet = folders.flatMap(folder => folder.snippets)
      .filter(s => s.id !== snippetId)
      .find(s =>
        shortcut === s.shortcut || // 完全相同才算衝突
        (shortcut.length > 1 && // 長度大於1才檢查
          (shortcut.startsWith(s.shortcut) || s.shortcut.startsWith(shortcut)))
      );
    console.log('Conflicting snippet:', conflictingSnippet);
    if (conflictingSnippet) {
      setShortcutError(`Conflicting shortcut with ${conflictingSnippet.shortcut}. Please choose a unique shortcut.`);
    } else {
      setShortcutError(null); // 清除錯誤信息
    }

  }

  const handleTextInputChange = (key: string, newValue: string) => {
    console.log('Field:', key, 'New Value:', newValue);
    if (textInputEditInfo) {
      const updatedEditInfo = {
        ...textInputEditInfo,
        [key]: newValue, // Update the specific field based on the key
      };

      setTextInputEditInfo(updatedEditInfo);
      console.log('updatedEditInfo', updatedEditInfo)

      const editor = editorRef.current;
      if (!editor) return;

      const { pos } = textInputEditInfo;
      const { doc } = editor.state;
      const nodeSelection = NodeSelection.create(doc, pos);
      const tr = editor.state.tr.setSelection(nodeSelection);
      editor.view.dispatch(tr);

      // Update the editor attributes based on the updated edit info
      editor.chain().updateAttributes('formtext', {
        snippetData: {
          name: updatedEditInfo.name, 
          default: updatedEditInfo.defaultValue, 
        }

      }).run();

      setContent(editor.getHTML());
    }
  };

  return (
    <div className='flex'>
      <div className='flex-[3] pr-4'>
        <div className='grid grid-cols-2 gap-x-4 mb-4'>
          <div className="relative col-span-1">
            <Input className="pl-9" placeholder="Type snippet name..." value={name}
              onChange={(e) => setName(e.target.value)} />
            <FaTag className="absolute left-0 top-0 m-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          <div className="relative col-span-1">
            <Input className="pl-9" placeholder="Add a shortcut..." value={shortcut} onChange={handleShortcutChange} />
            <FaKeyboard className="absolute left-0 top-0 m-2.5 h-4 w-4 text-muted-foreground" />
            {shortcutError && <p className="text-red-500">{shortcutError}</p>} {/* 顯示錯誤信息 */}
          </div>
        </div>
        <TipTapEditor
          value={content}
          onChange={setContent}
          onEditorReady={(editorInstance) => { editorRef.current = editorInstance; }}
          // 註冊 Node 點擊事件
          onFormTextNodeClick={handleFormTextNodeClick}
          onFormMenuNodeClick={handleFormMenuNodeClick}
          onEditorClick={handleEditorClick}
        />
        <Button className='w-20' onClick={handleSave}>Save</Button>
      </div>
      {/* 右側編輯欄位 */}
      <div className="flex-1 border-l">
        {isEditPanelVisible ? ( // 根據狀態顯示不同的面板
          <EditPanel editInfo={textInputEditInfo} onChange={handleTextInputChange} />
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
        // 帶入目前要編輯的資料；若是 null 就表示新增
        defaultLabel={textInputEditInfo?.name || ''}
        defaultDefaultValue={textInputEditInfo?.defaultValue || ''}
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
