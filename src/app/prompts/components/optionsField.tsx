"use client"

import React, { useCallback, useMemo } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash, Check } from "lucide-react";
import { useForceRerender } from '@/lib/useForceRepaint';
import { FiAlertCircle } from "react-icons/fi";
import debounce from "@/lib/utils/debounce";

interface OptionsFieldProps {
  title: string;
  description?: string;
  multiple: boolean;
  options: string[];              // 改名：values → options
  selectedValues: string[];       // 新增：明確的選中值
  onOptionsChange: (options: string[]) => void;       // 選項變更
  onSelectionChange: (selected: string[]) => void;    // 選擇變更
  highlight?: boolean;
  focusPosition?: string | null;
}

export function OptionsField({
  title,
  description,
  multiple,
  options,
  selectedValues,
  onOptionsChange,
  onSelectionChange,
  highlight,
  focusPosition
}: OptionsFieldProps) {
  // 移除內部狀態，改為使用 props
  const containerRef = useForceRerender(highlight, focusPosition);

  // 只對 input 輸入使用短延遲 debounce
  const debouncedInputChange = useMemo(() => {
    const handler = (newOptions: string[]) => {
      onOptionsChange([...newOptions]);
    };
    return debounce(handler as (...args: unknown[]) => void, 50);
  }, [onOptionsChange]);

  // 立即執行的選項變更（用於新增/刪除）
  const immediateOptionsChange = useCallback((newOptions: string[]) => {
    onOptionsChange([...newOptions]);
  }, [onOptionsChange]);

  // 立即通知選擇變更，但 debounce 選項變更
  const handleImmediateSelectionChange = useCallback((newSelection: string[]) => {
    onSelectionChange(newSelection);
  }, [onSelectionChange]);

  // 新增選項（立即執行）
  const addOption = useCallback(() => {
    const newOptions = [...options, ""];
    immediateOptionsChange(newOptions);
  }, [options, immediateOptionsChange]);

  // 移除選項（立即執行）
  const removeOption = useCallback((index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    const newSelection = selectedValues.filter(v => newOptions.includes(v));
    
    // 立即更新選擇和選項
    handleImmediateSelectionChange(newSelection);
    immediateOptionsChange(newOptions);
  }, [options, selectedValues, handleImmediateSelectionChange, immediateOptionsChange]);

  // 更新選項值（使用 debounce 避免輸入時頑頓）
  const updateOption = useCallback((index: number, value: string) => {
    if (options[index] === value) return;
    
    const newOptions = [...options];
    newOptions[index] = value;
    
    debouncedInputChange(newOptions);
  }, [options, debouncedInputChange]);

  // 單選處理
  const handleSingleSelect = useCallback((value: string) => {
    handleImmediateSelectionChange([value]);
  }, [handleImmediateSelectionChange]);

  // 多選切換
  const toggleMultiSelect = useCallback((value: string) => {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    handleImmediateSelectionChange(newSelection);
  }, [selectedValues, handleImmediateSelectionChange]);

  return (
    <div
      ref={containerRef}
      className={`w-full max-w-sm bg-white px-4 pt-2 pb-4 border-b border-gray-200 relative ${highlight ? 'animate-highlight' : ''}`}
      data-position={focusPosition}
    >
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center space-x-2">
          <Check className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-800">{title}</span>
        </div>
      </div>

      {options.length === 0 ? (
        <p className="text-sm text-red-500 pb-4 flex items-start gap-1">
          <FiAlertCircle className="w-4 h-4 mt-0.5 text-red-500" />
          At least one menu option is required
        </p>
      ) : description && (
        <p className="text-sm text-gray-500 pb-4">{description}</p>
      )}

      <div className="space-y-2">
        {multiple ? (
          options.map((value, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Checkbox
                checked={selectedValues.includes(value)}
                onCheckedChange={() => toggleMultiSelect(value)}
              />
              <Input
                value={value}
                onChange={(e) => updateOption(index, e.target.value)}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeOption(index)}
              >
                <Trash className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          ))
        ) : (
          <RadioGroup
            value={selectedValues[0] || ''}
            onValueChange={handleSingleSelect}
          >
            {options.map((value, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={value} />
                <Input
                  value={value}
                  onChange={(e) => updateOption(index, e.target.value)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOption(index)}
                >
                  <Trash className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </RadioGroup>
        )}

        <Button
          variant="outline"
          className="w-30 ml-auto mt-2 flex items-center justify-center"
          onClick={addOption}
        >
          <Plus className="w-2 h-2" />
          Add
        </Button>
      </div>
    </div>
  );
}