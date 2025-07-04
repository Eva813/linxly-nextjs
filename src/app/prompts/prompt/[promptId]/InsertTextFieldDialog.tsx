'use client';
import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface InsertTextFieldDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (label: string, defaultValue: string) => void;
  // 如果是編輯，會帶入既有數值
  defaultLabel?: string
  defaultdefault?: string
}

export default function InsertTextFieldDialog({ isOpen, onClose, onInsert, defaultLabel = '',
  defaultdefault = '', }: InsertTextFieldDialogProps) {
  const [label, setLabel] = useState(defaultLabel)
  const [defaultValue, setdefault] = useState('')

  // Dialog 每次打開時，重設 state
  useEffect(() => {
    if (isOpen) {
      setLabel(defaultLabel)
      setdefault(defaultdefault)
    }
  }, [isOpen, defaultLabel, defaultdefault])

  const handleInsert = () => {
    onInsert(label, defaultValue)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white shadow-lg p-6 rounded-md dark:text-black dark:bg-white-800">
        <DialogTitle>Insert text field</DialogTitle>
        <DialogDescription>
          Please provide a label and default value for the text field.
        </DialogDescription>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Enter a label..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Default (optional)</label>
            <Input value={defaultValue} onChange={(e) => setdefault(e.target.value)} placeholder="Default value..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleInsert}>Insert</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
