'use client';

import React, { memo } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from "@/components/ui/button"
import { FaBold, FaItalic, FaList, FaListOl, FaAlignCenter, FaAlignLeft, FaAlignRight } from "react-icons/fa6";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { ImFontSize } from "react-icons/im";

interface TipTapToolbarProps {
  editor: Editor | null;
  disabled?: boolean;
  currentFontSize: string;
  onSetFontSize: (size: string) => void;
  onUnsetFontSize: () => void;
}

const TipTapToolbar = memo(({
  editor,
  disabled = false,
  currentFontSize,
  onSetFontSize,
  onUnsetFontSize
}: TipTapToolbarProps) => {
  const fontSizes = ['12', '14', '16', '18', '20', '24'];

  if (!editor) return null;

  return (
    <div className={`toolbar flex flex-wrap items-center py-2 px-1 ${disabled ? 'pointer-events-none' : ''}`}>
      {/* Font Size */}
      <Popover>
        <PopoverTrigger>
          <div className='mx-1 px-2'>
            <ImFontSize />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-35 flex flex-col gap-2 p-2">
          <Button onClick={onUnsetFontSize}>Default</Button>
          {fontSizes.map((size) => (
            <Button
              key={size}
              onClick={() => onSetFontSize(`${size}px`)}
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
        variant={editor.isActive('bold') ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <FaBold />
      </Button>

      {/* Italic */}
      <Button
        className='mx-1 px-2'
        variant={editor.isActive('italic') ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <FaItalic />
      </Button>

      {/* Bullet List */}
      <Button
        className='mx-1 px-2'
        variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <FaList />
      </Button>

      {/* Ordered List */}
      <Button
        className='mx-1 px-2'
        variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <FaListOl />
      </Button>

      {/* Text Align */}
      <Button
        className='mx-1 px-2'
        variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
      >
        <FaAlignLeft />
      </Button>
      <Button
        className='mx-1 px-2'
        variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
      >
        <FaAlignCenter />
      </Button>
      <Button
        variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
      >
        <FaAlignRight />
      </Button>
    </div>
  );
});

TipTapToolbar.displayName = 'TipTapToolbar';

export default TipTapToolbar;