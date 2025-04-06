"use client"

import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
  values: string[];
  defaultValue: string | string[];
  highlight?: boolean;
  focusPosition?: string | null;
  onChange: (update: {
    values: string[];
    defaultValue: string | string[];
  }) => void;
}

export function OptionsField({
  title,
  description,
  multiple,
  values,
  defaultValue,
  onChange,
  highlight,
  focusPosition
}: OptionsFieldProps) {
  const [localOptions, setLocalOptions] = useState<string[]>(values);
  const [selectedOptions, setSelectedOptions] = useState<string[]>(() => {
    if (multiple) {
      return Array.isArray(defaultValue)
        ? defaultValue.filter(Boolean)
        : defaultValue ? [defaultValue] : [];
    } else {
      if (Array.isArray(defaultValue)) {
        return defaultValue.length > 0 && defaultValue[0] ? [defaultValue[0]] : [];
      }
      return defaultValue ? [defaultValue] : [];
    }
  });

  const containerRef = useForceRerender(highlight, focusPosition);

  // 先建立一個深層複製的輔助函式
  const deepClone = <T,>(data: T): T => JSON.parse(JSON.stringify(data));

  // 使用 useMemo 建立一個 debounce 包裝的 函式
  const debouncedChangeHandler = useMemo(() => {
    return debounce(function (options: string[], selected: string[]) {
      // 深層複製所有資料
      const clonedOptions = deepClone(options);
      const clonedSelected = deepClone(selected);

      // 處理預設值
      const updatedDefault = multiple
        ? clonedSelected
        : (clonedSelected[0] || "");

      // 呼叫父元件的 onChange
      onChange({
        values: clonedOptions,
        defaultValue: updatedDefault,
      });
    } as (...args: unknown[]) => void, 500);
  }, [onChange, multiple]);

  // 使用 useCallback 建立呼叫 debounced 函式的包裝器
  const debouncedOnChange = useCallback((options: string[], selected: string[]) => {
    debouncedChangeHandler(options, selected);
  }, [debouncedChangeHandler]);

  // 當父層傳入的值改變時，同步更新 localOptions 與 selectedOptions
  useEffect(() => {
    setLocalOptions(values);
  }, [values]);

  useEffect(() => {
    let normalized: string[] = [];
    if (multiple) {
      normalized = Array.isArray(defaultValue)
        ? defaultValue.filter(Boolean)
        : defaultValue ? [defaultValue] : [];
    } else {
      normalized = Array.isArray(defaultValue)
        ? (defaultValue.length > 0 ? [defaultValue[0]] : [])
        : defaultValue ? [defaultValue] : [];
    }
    normalized = normalized.filter(val => values.includes(val));
    setSelectedOptions(normalized);
  }, [defaultValue, multiple, values]);

  // 新增選項：更新 localOptions 與 choiceCounter，並呼叫 debouncedOnChange
  const addOption = () => {
    const newLocalOptions = [...localOptions, ""];
    setLocalOptions(newLocalOptions);
    debouncedOnChange(newLocalOptions, selectedOptions);
  };

  // 移除選項：更新 localOptions 與 selectedOptions，並呼叫 debouncedOnChange
  const removeOption = (index: number) => {
    const newLocalOptions = localOptions.filter((_, i) => i !== index);
    const newSelectedOptions = selectedOptions.filter(v => newLocalOptions.includes(v));
    setLocalOptions(newLocalOptions);
    setSelectedOptions(newSelectedOptions);
    debouncedOnChange(newLocalOptions, newSelectedOptions);
  };

  // 更新選項：更新 localOptions，若該選項在 selectedOptions 內則同步更新，並呼叫 debouncedOnChange
  const updateOption = (index: number, value: string) => {
    if (localOptions[index] === value) return;
    const newLocalOptions = [...localOptions];
    const oldValue = newLocalOptions[index];
    newLocalOptions[index] = value;
    let newSelectedOptions = selectedOptions;
    if (selectedOptions.includes(oldValue)) {
      newSelectedOptions = selectedOptions.map(opt => opt === oldValue ? value : opt);
      setSelectedOptions(newSelectedOptions);
    }
    setLocalOptions(newLocalOptions);
    debouncedOnChange(newLocalOptions, newSelectedOptions);
  };

  // 根據 multiple 決定處理邏輯
  const normalizeDefaultValue = useCallback(() => {
    if (multiple) {
      return Array.isArray(defaultValue)
        ? defaultValue
        : [defaultValue].filter(Boolean);
    }
    if (Array.isArray(defaultValue) && defaultValue.length > 0) {
      return [defaultValue[0]];
    }
    if (typeof defaultValue === 'string') {
      return [defaultValue];
    }
    return [""];
  }, [multiple, defaultValue]);

  // 只在 multiple 或 defaultValue 變化時更新選中值
  useEffect(() => {
    const newSelectedValues = normalizeDefaultValue();
    setSelectedOptions(newSelectedValues);
    debouncedOnChange(localOptions, newSelectedValues);
  }, [normalizeDefaultValue, localOptions, debouncedOnChange]);


  // 單選處理：更新 selectedOptions 並呼叫 debouncedOnChange
  const handleSingleSelect = (value: string) => {
    const newSelectedOptions = [value];
    setSelectedOptions(newSelectedOptions);
    debouncedOnChange(localOptions, newSelectedOptions);
  };

  // 多選切換：更新 selectedOptions 並呼叫 debouncedOnChange
  const toggleMultiSelect = (value: string) => {
    console.log('toggleMultiSelect', value);
    const newSelectedOptions = selectedOptions.includes(value)
      ? selectedOptions.filter(v => v !== value)
      : [...selectedOptions, value];
    setSelectedOptions(newSelectedOptions);
    debouncedOnChange(localOptions, newSelectedOptions);
  };

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

      {localOptions.length === 0 ? (
        <p className="text-sm text-red-500 pb-4 flex items-start gap-1">
          <FiAlertCircle className="w-4 h-4 mt-0.5 text-red-500" />
          At least one menu option is required
        </p>
      ) : description && (
        <p className="text-sm text-gray-500 pb-4">{description}</p>
      )}

      <div className="space-y-2">
        {multiple ? (
          localOptions.map((value, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Checkbox
                checked={selectedOptions.includes(value)}
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
            value={selectedOptions[0]}
            onValueChange={handleSingleSelect}
          >
            {localOptions.map((value, index) => (
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