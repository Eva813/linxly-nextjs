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

const SnippetPage = ({ params }: SnippetPageProps) => {
  const { snippetId } = params
  const { folders, updateSnippet } = useSnippets()
  const [name, setName] = useState('')
  const [shortcut, setShortcut] = useState('')
  const [content, setContent] = useState('')

  // 透過 ref 持有 editor 實例
  const editorRef = useRef<Editor | null>(null)

  // 對話框相關
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  // 若 editNodeInfo 為 null，就代表是「新增」；若有值，就代表「編輯」
  const [editNodeInfo, setEditNodeInfo] = useState<{
    pos: number
    label: string
    defaultValue: string
  } | null>(null)

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

  // 按下 sidebar 的「新增欄位」按鈕
  const handleInsertTextFieldClick = () => {
    setEditNodeInfo(null) // 表示「插入」模式
    setIsDialogOpen(true)
  }

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
    setEditNodeInfo({ pos, label, defaultValue }) // 進入「編輯」模式
    setIsDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
  }

  // 對話框點擊「確認」時
  const handleInsert = (label: string, defaultValue: string) => {
    const editor = editorRef.current
    if (!editor) return

    if (!editNodeInfo) {
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
      const { pos } = editNodeInfo
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
    setIsDialogOpen(false)
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
            <Input className="pl-9" placeholder="Add a shortcut..." value={shortcut} onChange={(e) => setShortcut(e.target.value)} />
            <FaKeyboard className="absolute left-0 top-0 m-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <TipTapEditor
          value={content}
          onChange={setContent}
          onEditorReady={(editorInstance) => { editorRef.current = editorInstance; }}
          // 註冊 Node 點擊事件
          onFormTextNodeClick={handleFormTextNodeClick}
        />
        <Button className='w-20' onClick={handleSave}>Save</Button>
      </div>
      <div className="flex-1 border-l pl-4">
        <Sidebar onInsertTextFieldClick={handleInsertTextFieldClick} />
      </div>
      <InsertTextFieldDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onInsert={handleInsert}
         // 帶入目前要編輯的資料；若是 null 就表示新增
         defaultLabel={editNodeInfo?.label || ''}
         defaultDefaultValue={editNodeInfo?.defaultValue || ''}
      />
    </div>
  );
};

export default SnippetPage;
