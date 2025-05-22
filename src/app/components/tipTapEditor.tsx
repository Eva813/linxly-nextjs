'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
// import { Color } from '@tiptap/extension-color';
import { FontSize } from './fontSizeExtension';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { FaBold, FaItalic, FaList, FaListOl, FaAlignCenter, FaAlignLeft, FaAlignRight } from "react-icons/fa6";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { ImFontSize } from "react-icons/im";
import { FormTextNode } from './tipTapCustomNode/FormTextNode'
import { FormMenuNode } from './tipTapCustomNode/FormMenuNode'
import { FormMenuClickHandler, FormMenuData } from '@/types/prompt'
interface TipTapEditorProps {
  value: string;
  minHeight?: string;
  maxHeight?: string;
  isRequired?: boolean;
  onChange: (value: string) => void;
  onEditorReady: (editor: Editor) => void;
  // 當用戶點擊自訂 Node 時的回呼
  onFormTextNodeClick?: (params: {
    pos: number
    name: string
    default: string
  }) => void;
  onFormMenuNodeClick?: FormMenuClickHandler;
  onEditorClick?: () => void;
}
const TipTapEditor = ({
  value,
  minHeight = '12rem',
  maxHeight = '20rem',
  isRequired = false,
  onChange,
  onEditorReady,
  onFormTextNodeClick,
  onFormMenuNodeClick,
  onEditorClick
}: TipTapEditorProps) => {
  const [hasError, setHasError] = useState(false);
  // const [currentColor, setCurrentColor] = useState('');
  const [currentFontSize, setCurrentFontSize] = useState('');
  const fontSizes = ['12', '14', '16', '18', '20', '24'];
  // const textColors = ['#F44336', '#2196F3', '#FFC107', '#757575', '#BF360C', '#FF9800'];

  const editor = useEditor({
    content: value,
    onUpdate: ({ editor }) => {
      const updatedValue = editor.getHTML();
      onChange(updatedValue);
      validateContent(updatedValue);
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

      // Color,
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

  // const setColor = (color) => {
  //   setCurrentColor(color);
  //   editor?.chain().focus().setColor(color).run();
  // };

  // const unsetColor = () => {
  //   setCurrentColor('');
  //   editor?.chain().focus().unsetColor().run();
  // };

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);
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
            <Button onClick={unsetFontSize}>Default</Button>
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

        {/* Text Color */}
        {/* <Popover>
          <PopoverTrigger>
            <Button
              style={{ backgroundColor: currentColor }}
              variant={currentColor ? 'solid' : 'ghost'}
            >
              Text Color
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <Button onClick={unsetColor}>Default</Button>
            {textColors.map((color) => (
              <Button
                key={color}
                onClick={() => setColor(color)}
                style={{ backgroundColor: color }}
                variant={currentColor === color ? 'solid' : 'ghost'}
              />
            ))}
          </PopoverContent>
        </Popover> */}
      </div>

      <EditorContent
        editor={editor}
        className={`border tiptap-container overflow-y-scroll ${hasError ? 'border-red-500' : 'border-gray-300'}`}
        style={{ minHeight, maxHeight }}
        onClick={onEditorClick}
      />
      {hasError && <div className="text-red-500 text-sm">This field is required.</div>}
    </div>
  );
};

export default TipTapEditor;
