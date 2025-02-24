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
  type: 'text';
  pos: number;
  label: string;
  defaultValue: string;
  attrs?: {
    name?: string;
    required?: string;
  };
}

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
    label,
    defaultValue,
  }: {
    pos: number
    label: string
    defaultValue: string
  }) => {
    setTextInputEditInfo({ type: 'text',  pos, label, defaultValue })
    setIsTextDialogOpen(true)
  }

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
    multiple: string
  }) => {
    console.log('傳入',pos,'and',name,'default',defaultValue,'options',options,'and',multiple)
    // 對應 dialog 中的變數名稱傳入
    const optionsArray = options.split(',').map(opt => opt.trim());
    // 設定 selectedValue 為陣列或字串
    const processedDefaultValue = multiple 
      ? defaultValue.split(',').map(val => val.trim())
      : defaultValue;
      console.log('傳入2',pos,'and',name,'and',processedDefaultValue,'and',optionsArray,'and',multiple)
    setDropdownEditInfo({ 
      type: 'dropdown', 
      pos,
      name, 
      defaultOptionValues: optionsArray,       
      selectedValue: processedDefaultValue,
      multiple: multiple === 'true' ? true : false,
    });
    setIsDropdownDialogOpen(true);
  }

  // 對話框點擊「確認」時，將資料 insert
  const handleTextFieldInsert = (label: string, defaultValue: string) => {
    const editor = editorRef.current
    if (!editor) return

    if (!textInputEditInfo) {
      // === 新增 ===
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'formTextField',
          attrs: {
            label,
            defaultValue,
          },
        })
        .run()
    } else {
      // === 編輯 ===
      const { pos } = textInputEditInfo
      const { doc } = editor.state
      const nodeSelection = NodeSelection.create(doc, pos)
      const tr = editor.state.tr.setSelection(nodeSelection)
      editor.view.dispatch(tr)

      editor.chain().focus().updateAttributes('formTextField', {
        label,
        defaultValue,
      }).run()
    }

    // 立即更新 content 狀態
    setContent(editor.getHTML())
    setIsTextDialogOpen(false)
  }

const handleDropDownMenuInsert = (name: string, values: string[], selectedValues:string | string[], multiple: boolean) => {
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
          multiple: multiple === true ? 'true' : 'false',
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
    console.log('傳入Editt',name,'option',values,selectedValues, 'multiple',multiple)
    editor
      .chain()
      .focus()
      .updateAttributes('formMenu', {
        name,
        options: values.join(','),
        // 傳給 editor 的 extension
        multiple: multiple === true ? 'true' : 'false',
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
        />
        <Button className='w-20' onClick={handleSave}>Save</Button>
      </div>
      <div className="flex-1 border-l pl-4">
        <Sidebar 
        onInsertTextFieldClick={handleInsertTextFieldClick} 
        onInsertMenuFieldClick={handleInsertMenuFieldClick} />
      </div>
      <InsertTextFieldDialog
        isOpen={isTextDialogOpen}
        onClose={() => setIsTextDialogOpen(false)}
        onInsert={handleTextFieldInsert}
        // 帶入目前要編輯的資料；若是 null 就表示新增
        defaultLabel={textInputEditInfo?.label || ''}
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
