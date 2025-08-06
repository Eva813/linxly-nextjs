'use client';
import React, { useState, useEffect, useCallback, memo } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
// GripVertical
import { Plus, Trash } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface InsertDropdownMenuDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (name: string, values: string[], defaultValue: string | string[], multiple: boolean) => void;
  defaultName?: string;
  defaultOptionValues?: string[]; //option Value
  defaultMultiple?: boolean;
  selectedValue?: string | string[]; // 預設選中的值
}

function InsertDropdownMenuDialog({
  isOpen,
  onClose,
  onInsert
}: InsertDropdownMenuDialogProps) {
  const [name, setName] = useState('');
  const [values, setValues] = useState<string[]>([]);
  const [multiple, setMultiple] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string | string[]>(multiple ? [] : '');


    useEffect(() => {
      if (!isOpen) return;
      
      // 直接設置為空值或預設值
      setName('');
      setValues([]);
      setMultiple(false);
      setSelectedValues('');
      
    }, [isOpen]);
  

  // 使用 useCallback 穩定事件處理器
  const handleAddValue = useCallback(() => {
    setValues(prev => [...prev, `Choice ${prev.length + 1}`]);
  }, []);

  const handleRemoveValue = useCallback((index: number) => {
    setValues(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleChangeValue = useCallback((index: number, newValue: string) => {
    setValues(prev => {
      const updatedValues = [...prev];
      updatedValues[index] = newValue;
      return updatedValues;
    });
  }, []);

  const handleSelectSingle = useCallback((value: string) => {
    setSelectedValues(value);
  }, []);

  const handleToggleMultiple = useCallback((value: string) => {
    setSelectedValues(prev => {
      if (Array.isArray(prev)) {
        return prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value];
      }
      return prev;
    });
  }, []);

  const handleInsert = useCallback(() => {
    onInsert(name, values, selectedValues, multiple);
    onClose();
  }, [onInsert, onClose, name, values, selectedValues, multiple]);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  }, []);

  const handleMultipleToggle = useCallback((checked: boolean) => {
    setMultiple(checked);
    setSelectedValues(checked ? [] : '');
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white shadow-lg p-6 rounded-md dark:text-black dark:bg-white-800 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogTitle>Insert Dropdown Menu Field</DialogTitle>
        <DialogDescription>
          Configure the dropdown menu options, name, and selection mode.
        </DialogDescription>

        {/* 可滾動區域 */}
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-4 mx-2">
            {/* Values Section */}
            <div>
              <label className="block text-sm font-medium mb-1">Values</label>
              <div className="border rounded-md p-2 space-y-2">
                {multiple ? (
                  // 如果是 Multiple，使用 Checkbox
                  values.map((value, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        checked={Array.isArray(selectedValues) && selectedValues.includes(value)}
                        onCheckedChange={() => handleToggleMultiple(value)}
                      />
                      <Input
                        value={value}
                        onChange={(e) => handleChangeValue(index, e.target.value)}
                        placeholder={`Choice ${index + 1}`}
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveValue(index)}>
                        <Trash className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))
                ) : (
                  // 如果是 Single，使用 RadioGroup
                  <RadioGroup value={selectedValues as string} onValueChange={handleSelectSingle}>
                    {values.map((value, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={value} />
                        <Input
                          value={value}
                          onChange={(e) => handleChangeValue(index, e.target.value)}
                          placeholder={`Choice ${index + 1}`}
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveValue(index)}>
                          <Trash className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </RadioGroup>
                )}
                <Button variant="outline" className="w-full mt-2 flex items-center" onClick={handleAddValue}>
                  <Plus className="mr-2 w-4 h-4" /> Add
                </Button>
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium mb-1">Name (optional)</label>
              <Input value={name} onChange={handleNameChange} placeholder="Enter a field name..." />
            </div>

            {/* Multiple Switch */}
            <div className="flex items-center space-x-2">
              <Switch
                checked={multiple}
                onCheckedChange={handleMultipleToggle}
              />
              <span className="text-sm font-medium">Multiple (optional)</span>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleInsert}>Insert</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default memo(InsertDropdownMenuDialog);
