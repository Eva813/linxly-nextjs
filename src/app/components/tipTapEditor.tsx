'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
// import TextStyle from '@tiptap/extension-text-style';
// import TextAlign from '@tiptap/extension-text-align';
// import { Color } from '@tiptap/extension-color';
// import { FontSize } from './fontSizeExtension';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
// import '@/app/styles/tiptap.css';
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover"

interface TipTapEditorProps {
  value: string;
  height?: string;
  isRequired?: boolean;
  onChange: (value: string) => void;
}
const TipTapEditor = ({
  value,
  height = '12rem',
  isRequired = false,
  onChange,
}: TipTapEditorProps) => {
  const [hasError, setHasError] = useState(false);
  // const [currentColor, setCurrentColor] = useState('');
  // const [currentFontSize, setCurrentFontSize] = useState('');
  // const fontSizes = ['12', '14', '16', '18', '20', '24'];
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
      // TextStyle,
      // FontSize.configure({ types: ['textStyle'] }),
      // TextAlign.configure({ types: ['heading', 'paragraph'] }),
      // Color,
    ],
  });

  const validateContent = (content: string) => {
    setHasError(!content);
  };

  // const setFontSize = (size: string) => {
  //   setCurrentFontSize(size);
  //   editor?.chain().focus().setFontSize(size).run();
  // };

  // const unsetFontSize = () => {
  //   setCurrentFontSize('');
  //   editor?.chain().focus().unsetFontSize().run();
  // };

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

  return (
    <div className="editor-container flex flex-col mb-4">
      <div className="toolbar flex flex-wrap items-center py-2 px-1">
        {/* Font Size */}
        {/* <Popover>
          <PopoverTrigger>
            <Button variant={currentFontSize ? 'solid' : 'ghost'}>Font Size</Button>
          </PopoverTrigger>
          <PopoverContent>
            <Button onClick={unsetFontSize}>Default</Button>
            {fontSizes.map((size) => (
              <Button
                key={size}
                onClick={() => setFontSize(`${size}px`)}
                variant={currentFontSize === `${size}px` ? 'solid' : 'ghost'}
              >
                {size}
              </Button>
            ))}
          </PopoverContent>
        </Popover> */}

        {/* Bold */}
        <Button
          variant={editor?.isActive('bold') ? 'default' : 'ghost'}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          Bold
        </Button>

        {/* Italic */}
        <Button
          variant={editor?.isActive('italic') ? 'default' : 'ghost'}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          Italic
        </Button>

        {/* Bullet List */}
        <Button
          variant={editor?.isActive('bulletList') ? 'default' : 'ghost'}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          Bullet List
        </Button>

        {/* Ordered List */}
        <Button
          variant={editor?.isActive('orderedList') ? 'default' : 'ghost'}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          Ordered List
        </Button>

        {/* Text Align */}
        {/* <Button
          variant={editor?.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
          onClick={() => editor?.chain().focus().setTextAlign('left').run()}
        >
          Left
        </Button>
        <Button
          variant={editor?.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
          onClick={() => editor?.chain().focus().setTextAlign('center').run()}
        >
          Center
        </Button>
        <Button
          variant={editor?.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
          onClick={() => editor?.chain().focus().setTextAlign('right').run()}
        >
          Right
        </Button> */}

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
        className={`border tiptap-container ${hasError ? 'border-red-500' : 'border-gray-300'}`}
        style={{ height }}
      />
      {hasError && <div className="text-red-500 text-sm">This field is required.</div>}
    </div>
  );
};

export default TipTapEditor;
