import React from 'react'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  onInsertTextFieldClick: () => void;
}

export default function EditorSidebar({ onInsertTextFieldClick }: SidebarProps) {
  return (
    <div className="pl-2">
      <h2 className="font-bold mb-2">Tools</h2>
      <Button onClick={onInsertTextFieldClick}>Insert text field</Button>
    </div>
  )
}
