"use client"

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Trash, Check } from "lucide-react"
import { useForceRerender } from '@/lib/useForceRepaint';

interface OptionsFieldProps {
  title: string
  description?: string
  multiple: boolean
  values: string[]
  defaultValue: string | string[]
  highlight?: boolean
  focusPosition?: string | null
  onChange: (update: {
    values: string[]
    defaultValue: string | string[]
  }) => void
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
  console.log('OptionsField rendering with values:', values, 'defaultValue:', defaultValue)
  const [localValues, setLocalValues] = useState<string[]>(values)
  const [counter, setCounter] = useState(values.length);
  const containerRef = useForceRerender(highlight, focusPosition);


  const initSelected = useMemo(() => {
    if (multiple) {
      return Array.isArray(defaultValue) ? defaultValue : [defaultValue]
    } else {
      return Array.isArray(defaultValue) ? defaultValue[0] || "" : defaultValue
    }
  }, [defaultValue, multiple])

  const [selectedValues, setSelectedValues] = useState<string[]>(
    multiple ? (initSelected as string[]) : [initSelected as string]
  )

  // 根據 multiple 決定處理邏輯
  const normalizeDefaultValue = useCallback(() => {
    if (multiple) {
      // 如果 defaultValue 是陣列就直接使用，否則包成陣列（並過濾掉 falsy 值，如 null/undefined/空字串）
      return Array.isArray(defaultValue)
        ? defaultValue
        : [defaultValue].filter(Boolean);
    }
    // 若 defaultValue 為非空陣列，取第一個值作為預設
    if (Array.isArray(defaultValue) && defaultValue.length > 0) {
      return [defaultValue[0]];
    }

    if (typeof defaultValue === 'string') {
      return [defaultValue];
    }

    return [""];
  }, [multiple, defaultValue]);

  // 監聽 multiple 屬性的變化
  useEffect(() => {
    const newSelectedValues = normalizeDefaultValue();
    setSelectedValues(newSelectedValues);

    const updatedDefaultValue = multiple
      ? newSelectedValues
      : newSelectedValues[0] || "";

    onChange({ values: localValues, defaultValue: updatedDefaultValue });
  }, [normalizeDefaultValue, localValues, onChange, multiple]);

  const handleAddValue = () => {
    const newCounter = counter + 1;
    setCounter(newCounter);
    const newValues = [...localValues, `Choice ${newCounter}`];
    setLocalValues(newValues);
    onChange({ values: newValues, defaultValue: selectedValues })
  }

  const handleRemoveValue = (index: number) => {
    const newValues = localValues.filter((_, i) => i !== index);
    const newSelectedValues = selectedValues.filter((value) => newValues.includes(value));

    setLocalValues(newValues);
    setSelectedValues(newSelectedValues);
    // 根據 multiple 屬性決定如何傳遞 defaultValue
    const updatedDefaultValue = multiple
      ? newSelectedValues
      : (newSelectedValues.length > 0 ? newSelectedValues[0] : "");

    onChange({ values: newValues, defaultValue: updatedDefaultValue });
  }

  const handleChangeValue = (index: number, newVal: string) => {
    console.log('Changing value at index:', index, 'to:', newVal);
    const newValues = [...localValues]
    newValues[index] = newVal
    setLocalValues(newValues)
    onChange({ defaultValue: selectedValues, values: newValues })
  }

  const handleSelectSingle = (value: string) => {
    setSelectedValues([value])
    onChange({ defaultValue: value, values: localValues })
  }

  const handleToggleMultiple = (value: string) => {
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value]
    setSelectedValues(newSelectedValues)
    onChange({ values: localValues, defaultValue: newSelectedValues })
  }

  return (
    <div ref={containerRef} className={`w-full max-w-sm bg-white px-4 pt-2 pb-4 border-b border-gray-200 ${highlight ? 'animate-highlight' : ''
      }`}
      data-position={focusPosition}>
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center space-x-2">
          <Check className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-800">{title}</span>
        </div>
      </div>

      {/* 描述文字 */}
      {description && (
        <p className="text-sm text-gray-500 pb-4">{description}</p>
      )}

      <div className="space-y-2">
        {multiple ? (
          localValues.map((value, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Checkbox
                checked={selectedValues.includes(value)}
                onCheckedChange={() => handleToggleMultiple(value)}
              />
              <Input
                value={value}
                onChange={(e) => handleChangeValue(index, e.target.value)}
                placeholder={`Choice ${index + 1}`}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveValue(index)}
              >
                <Trash className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          ))
        ) : (
          <RadioGroup
            value={selectedValues[0]}
            onValueChange={handleSelectSingle}
          >
            {localValues.map((value, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={value} />
                <Input
                  value={value}
                  onChange={(e) => handleChangeValue(index, e.target.value)}
                  placeholder={`Choice ${index + 1}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveValue(index)}
                >
                  <Trash className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </RadioGroup>
        )}

        <Button
          variant="outline"
          className="w-full mt-2 flex items-center justify-center"
          onClick={handleAddValue}
        >
          <Plus className="mr-2 w-4 h-4" />
          Add
        </Button>
      </div>
    </div>
  )
}
