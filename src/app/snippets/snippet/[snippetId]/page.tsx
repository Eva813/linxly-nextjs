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
  const editorRef = useRef(null);

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
    if (editor) {
      const formtext = `(formtext: name=${label || 'field'}; default=${defaultValue || ''})`;
      const selectedText = editor.getSelectedText();
      console.log('selectedText:', selectedText);

      if (selectedText) {
        // 替換選取的文字
        editor.chain().focus().replaceSelection(formtext).run();
      } else {
        // 在當前光標位置插入文字
        editor.chain().focus().insertContent(formtext).run();
      }

      // 更新 content 狀態
      const newContent = editor.getHTML();
      setContent(newContent);
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