import React from 'react'
import { ToolFieldItem } from "@/app/prompts/components/toolFieldItem"
import { MdOutlineShortText } from "react-icons/md";
import { MdMenuOpen } from "react-icons/md";

interface SidebarProps {
  onInsertTextFieldClick: () => void;
  onInsertMenuFieldClick: () => void;
}

const textFieldIcon = <MdOutlineShortText className="h-8 w-8 text-grey-500" />;
const menuIcon = <MdMenuOpen className="h-8 w-8 text-grey-500" />;

const EditorSidebar: React.FC<SidebarProps> = React.memo(({ onInsertTextFieldClick, onInsertMenuFieldClick }) => {
  return (
    <>
      <h2 className="font-bold px-4 pt-4 pb-2">Tools</h2>
      <ToolFieldItem
        icon={textFieldIcon}
        title="Text field"
        description="Single line Text Field"
        pro={false}
        onClick={onInsertTextFieldClick}
      />
      <ToolFieldItem
        icon={menuIcon}
        title="Dropdown Menu"
        description="Options in a menu"
        pro={false}
        onClick={onInsertMenuFieldClick}
      />
    </>
  )
})

EditorSidebar.displayName = 'EditorSidebar';
export default EditorSidebar;
