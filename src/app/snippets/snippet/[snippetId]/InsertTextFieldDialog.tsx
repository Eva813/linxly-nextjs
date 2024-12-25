'use client';
import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface InsertTextFieldDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (label: string, defaultValue: string) => void;
    // 如果是編輯，會帶入既有數值
    defaultLabel?: string
    defaultDefaultValue?: string
}

export default function InsertTextFieldDialog({ isOpen, onClose, onInsert,   defaultLabel = '',
  defaultDefaultValue = '', }: InsertTextFieldDialogProps) {
  const [label, setLabel] = useState(defaultLabel)
  const [defaultValue, setDefaultValue] = useState('')

  // Dialog 每次打開時，重設 state
  useEffect(() => {
    if (isOpen) {
      setLabel(defaultLabel)
      setDefaultValue(defaultDefaultValue)
    }
  }, [isOpen, defaultLabel, defaultDefaultValue])

  const handleInsert = () => {
    onInsert(label, defaultValue)
    // onClose()
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
            <label className="block text-sm font-medium mb-1">Name</label>
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
