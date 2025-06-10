import React from 'react'
import { ToolFieldItem } from "@/app/prompts/components/toolSidebar/toolFieldItem"
import { MdOutlineShortText } from "react-icons/md";
import { MdMenuOpen } from "react-icons/md";
import SigmaTags from '@/app/prompts/components/toolSidebar/sigmaTags';
import { MdOutlineNewLabel } from "react-icons/md";
import { Editor } from '@tiptap/react';

interface SidebarProps {
  onInsertTextFieldClick: () => void;
  onInsertMenuFieldClick: () => void;
  editor: Editor | null; // 新增 editor prop
}

const EditorSidebar: React.FC<SidebarProps> = React.memo(({ onInsertTextFieldClick, onInsertMenuFieldClick, editor }) => {
  return (
    <>
      <h2 className="font-bold px-4 pt-4 pb-2">Tools</h2>
      <ToolFieldItem
        icon={<MdOutlineShortText className="h-8 w-8 text-grey-500" />}
        title="Text field"
        description="Single line Text Field"
        pro={false} // 不顯示 PRO 狀態
        onClick={onInsertTextFieldClick}
      />
      <ToolFieldItem
        icon={<MdMenuOpen className="h-8 w-8 text-grey-500" />}
        title="Dropdown Menu"
        description="Options in a menu"
        pro={false} // 不顯示 PRO 狀態
        onClick={onInsertMenuFieldClick}
      />
      <SigmaTags icon={<MdOutlineNewLabel className="h-8 w-8 text-grey-500" />} editor={editor} />
    </>
  )
})
EditorSidebar.displayName = 'EditorSidebar';
export default EditorSidebar;
