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

interface SnippetPageProps {
  params: {
    snippetId: string;
  };
}

const SnippetPage = ({ params }: SnippetPageProps) => {
  const { snippetId } = params;
  const { folders, updateSnippet } = useSnippets();
  const [name, setName] = useState('');
  const [shortcut, setShortcut] = useState('');
  const [content, setContent] = useState('');

  // 用於控制 Dialog 的顯示
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 假設 TipTapEditor 提供一個 ref 或透過 onEditorReady 拿到 editor 實例
  const editorRef = useRef<Editor | null>(null);

  let currentSnippet = null;
  for (const folder of folders) {
    const snippet = folder.snippets.find(s => s.id === snippetId);
    if (snippet) {
      currentSnippet = snippet;
      break;
    }
  }

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
      console.log('Updating snippet:', updatedSnippet);
      updateSnippet(snippetId, updatedSnippet);
    }
  }

  const handleInsertTextFieldClick = () => {
    setIsDialogOpen(true);
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  }

  const handleInsert = (label: string, defaultValue: string) => {
    const editor = editorRef.current;
    console.log('ddd', editor)
    console.log('Current content:', editor?.getHTML());
    if (editor) {
      // 創建要插入的節點
      // const textField = {
      //   type: 'formTextField',
      //   attrs: {
      //     label,
      //     defaultValue
      //   }
      // };
      editor.chain()
        .focus()
        .insertContent({
          type: 'formTextField',
          attrs: {
            label,
            defaultValue
          }
        })
        .run();

      // 使用 commands 來插入內容
      // editor.commands.insertContent(textField);
      console.log('inset', editor.getHTML)

      // 更新content狀態
      setContent(editor.getHTML());
    }
  }

  // const handleInsert = (label: string, defaultValue: string) => {
  //   const editor = editorRef.current;
  //   console.log('ee', editor)
  //   if (editor) {
  //     const nodeData = {
  //       type: 'formTextField',  // 確保這個 type 與你在 TipTap extension 中定義的名稱一致
  //       attrs: {
  //         label: label || 'field',
  //         defaultValue: defaultValue || ''
  //       },
  //       content: defaultValue || ''  // 可選：如果需要顯示預設值
  //     };
  //     console.log('ddd', nodeData)

  //     if (editor.state.selection.empty) {
  //       // 沒有選取文字，直接在游標處插入
  //       editor.chain().focus().insertContent(nodeData).run();
  //     } else {
  //       // 有選取文字，先刪除選取範圍再插入
  //       editor.chain()
  //         .focus()
  //         .deleteSelection()
  //         .insertContent(nodeData)
  //         .run();
  //     }
  //     setContent(editor.getHTML());
  //   }
  // }

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
      />
    </div>
  );
};

export default SnippetPage;
