import React from 'react'
import { FormField } from "@/app/snippets/components/formField"
import { MdOutlineShortText } from "react-icons/md";
import { MdMenuOpen } from "react-icons/md";

interface SidebarProps {
  onInsertTextFieldClick: () => void;
  onInsertMenuFieldClick: () => void;
}

export default function EditorSidebar({ onInsertTextFieldClick, onInsertMenuFieldClick }: SidebarProps) {
  return (
    <div>
      <h2 className="font-bold px-2 py-2">Tools</h2>
      <FormField
        icon={<MdOutlineShortText className="h-8 w-8 text-grey-500" />}
        title="Text field"
        description="Single line Text Field"
        pro={false} // 不顯示 PRO 狀態
        onClick={onInsertTextFieldClick}
      />
      <FormField
        icon={<MdMenuOpen className="h-8 w-8 text-grey-500" />}
        title="Dropdown Menu"
        description="Options in a menu"
        pro={false} // 不顯示 PRO 狀態
        onClick={onInsertMenuFieldClick}
      />
    </div>
  )
}
