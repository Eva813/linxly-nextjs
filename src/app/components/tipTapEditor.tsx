'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import { FontSize } from './fontSizeExtension';
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button"
import { FaBold, FaItalic, FaList, FaListOl, FaAlignCenter, FaAlignLeft, FaAlignRight } from "react-icons/fa6";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { ImFontSize } from "react-icons/im";
import { FormTextNode } from './tipTapCustomNode/FormTextNode'
import { FormMenuNode } from './tipTapCustomNode/FormMenuNode'
import { FormMenuClickHandler, FormMenuData } from '@/types/prompt'
interface TipTapEditorProps {
  value: string;
  isRequired?: boolean;
  onChange: (value: string) => void;
  onEditorReady: (editor: Editor) => void;
  onStartEditing?: () => void; // 開始編輯的回調
  // 當用戶點擊自訂 Node 時的回呼
  onFormTextNodeClick?: (params: {
    pos: number
    name: string
    default: string
  }) => void;
  onFormMenuNodeClick?: FormMenuClickHandler;
  onEditorClick?: () => void;
  // 檢查是否為外部更新
  isExternalUpdate?: () => boolean;
}
const TipTapEditor = ({
  value,
  isRequired = false,
  onChange,
  onEditorReady,
  onStartEditing,
  onFormTextNodeClick,
  onFormMenuNodeClick,
  onEditorClick,
  isExternalUpdate
}: TipTapEditorProps) => {
  const [hasError, setHasError] = useState(false);
  const [currentFontSize, setCurrentFontSize] = useState('');
  const fontSizes = ['12', '14', '16', '18', '20', '24'];
  
  // 追蹤編輯器內容，避免循環更新
  const editorContentRef = useRef<string>("");
  const isUserEditingRef = useRef(false);
  const resetEditingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    content: value,
    onUpdate: ({ editor }) => {
      const currentContent = editor.getHTML();
      
      // 避免重複觸發 onChange
      if (editorContentRef.current === currentContent) {
        return;
      }
      
      // 更新內容參考並標記用戶正在編輯
      editorContentRef.current = currentContent;
      isUserEditingRef.current = true;
      
      // 清除之前的重置定時器
      if (resetEditingTimeoutRef.current) {
        clearTimeout(resetEditingTimeoutRef.current);
      }
      
      // 設定新的重置定時器
      resetEditingTimeoutRef.current = setTimeout(() => {
        isUserEditingRef.current = false;
      }, 1000);
      
      // 觸發編輯開始回調
      onStartEditing?.();
      
      // 立即觸發 onChange，讓上層處理 debounce
      onChange(currentContent);
      validateContent(currentContent);
    },
    onBlur: ({ editor }) => {
      const updatedValue = editor.getHTML();
      if (!updatedValue && isRequired) {
        validateContent(updatedValue);
      }
    },
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextStyle,
      FontSize.configure({ types: ['textStyle'] }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      // 在這裡將 FormTextNode 配置 onFormTextClick
      FormTextNode.configure({
        onFormTextClick: (params: { pos: number; name: string; default: string }) => {
          onFormTextNodeClick?.(params)
        },
      }),
      FormMenuNode.configure({
        onFormMenuClick: (params: FormMenuData) => {
          onFormMenuNodeClick?.(params)
        },
      }),
    ],
  });

  const validateContent = (content: string) => {
    setHasError(!content);
  };

  const setFontSize = (size: string) => {
    setCurrentFontSize(size);
    editor?.chain().focus().setFontSize(size).run();
  };

  const unsetFontSize = () => {
    setCurrentFontSize('');
    editor?.chain().focus().unsetFontSize().run();
  };

  useEffect(() => {
    if (!editor) return;
    
    // 如果用戶正在編輯，延遲外部更新
    if (isUserEditingRef.current) {
      return;
    }
    
    // 如果編輯器內容和 props value 相同，不需要更新
    const currentEditorContent = editor.getHTML();
    if (currentEditorContent === value) {
      return;
    }
    
    // 檢查是否為外部更新（例如初始化載入）
    const isExternal = isExternalUpdate?.() || false;
    
    // 更新內容參考
    editorContentRef.current = value;
    
    if (isExternal) {
      // 外部更新：直接設定內容，不保存游標位置
      editor.commands.setContent(value || '', false);
    } else {
      // 非外部更新但需要同步：謹慎處理游標位置
      const { from, to } = editor.state.selection;
      const wasEmpty = currentEditorContent === '<p></p>' || currentEditorContent === '';
      
      editor.commands.setContent(value || '', false);
      
      // 只有在編輯器原本為空時才不恢復游標位置
      if (!wasEmpty) {
        setTimeout(() => {
          try {
            const docSize = editor.state.doc.content.size;
            const newFrom = Math.min(from, docSize);
            const newTo = Math.min(to, docSize);
            editor.commands.setTextSelection({ from: newFrom, to: newTo });
          } catch (error) {
            console.warn('無法恢復游標位置:', error);
          }
        }, 0);
      }
    }
  }, [value, editor, isExternalUpdate]);
  
  // 清理定時器
  useEffect(() => {
    return () => {
      if (resetEditingTimeoutRef.current) {
        clearTimeout(resetEditingTimeoutRef.current);
      }
    };
  }, []);
  // 當 editor 實例創建完成時，通過 onEditorReady 傳遞給父組件
  useEffect(() => {
    if (editor) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  return (
    <div className="editor-container flex flex-col mb-4">
      <div className="toolbar flex flex-wrap items-center py-2 px-1">
        {/* Font Size */}
        <Popover>
          <PopoverTrigger>
            <div className='mx-1 px-2'>
              <ImFontSize />
            </div> 
          </PopoverTrigger>
          <PopoverContent className="w-35 flex flex-col gap-2 p-2">
            <Button onClick={unsetFontSize} >Default</Button>
            {fontSizes.map((size) => (
              <Button
                key={size}
                onClick={() => setFontSize(`${size}px`)}
                variant={currentFontSize === `${size}px` ? 'default' : 'ghost'}
      
              >
                {size}
              </Button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Bold */}
        <Button
          className='mx-1 px-2'
          variant={editor?.isActive('bold') ? 'default' : 'ghost'}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <FaBold />
        </Button>

        {/* Italic */}
        <Button
          className='mx-1 px-2'
          variant={editor?.isActive('italic') ? 'default' : 'ghost'}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <FaItalic />
        </Button>

        {/* Bullet List */}
        <Button
          className='mx-1 px-2'
          variant={editor?.isActive('bulletList') ? 'default' : 'ghost'}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}

        >
          <FaList />
        </Button>

        {/* Ordered List */}
        <Button
          className='mx-1 px-2'
          variant={editor?.isActive('orderedList') ? 'default' : 'ghost'}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}

        >
          <FaListOl />
        </Button>

        {/* Text Align */}
        <Button
          className='mx-1 px-2'
          variant={editor?.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
          onClick={() => editor?.chain().focus().setTextAlign('left').run()}
        >
          <FaAlignLeft />
        </Button>
        <Button
          className='mx-1 px-2'
          variant={editor?.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
          onClick={() => editor?.chain().focus().setTextAlign('center').run()}
        >
          <FaAlignCenter />
        </Button>
        <Button
          variant={editor?.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
          onClick={() => editor?.chain().focus().setTextAlign('right').run()}
        >
          <FaAlignRight />
        </Button>
      </div>

      <EditorContent
        editor={editor}
        className={`border tiptap-container overflow-y-scroll ${hasError ? 'border-red-500' : 'border-gray-300'}`}
        onClick={onEditorClick}
      />
      {hasError && <div className="text-red-500 text-sm">This field is required.</div>}
    </div>
  );
};

export default TipTapEditor;
