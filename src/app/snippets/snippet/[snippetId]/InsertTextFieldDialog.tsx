import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface InsertTextFieldDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (label: string, defaultValue: string) => void;
}

export default function InsertTextFieldDialog({ isOpen, onClose, onInsert }: InsertTextFieldDialogProps) {
  const [label, setLabel] = useState('')
  const [defaultValue, setDefaultValue] = useState('')

  const handleInsert = () => {
    onInsert(label, defaultValue)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white shadow-lg p-6 rounded-md">
        <DialogHeader>
          <DialogTitle>Insert text field</DialogTitle>
          <DialogDescription>
            Please provide a label and default value for the text field.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Label (optional)</label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Enter a label..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Default (optional)</label>
            <Input value={defaultValue} onChange={(e) => setDefaultValue(e.target.value)} placeholder="Default value..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleInsert}>Insert</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
