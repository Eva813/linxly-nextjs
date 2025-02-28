import React from 'react'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  onInsertTextFieldClick: () => void;
  onInsertMenuFieldClick: () => void;
}

export default function EditorSidebar({ onInsertTextFieldClick, onInsertMenuFieldClick }: SidebarProps) {
  return (
    <div className="pl-2">
      <h2 className="font-bold mb-2">Tools</h2>
      <Button className='mb-2' onClick={onInsertTextFieldClick}>Insert text field</Button>
      <Button onClick={onInsertMenuFieldClick}>Insert DropDown Menu field</Button>
    </div>
  )
}
