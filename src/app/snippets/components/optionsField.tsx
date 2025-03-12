"use client"

import React, { useMemo, useState, useCallback } from 'react';
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Trash } from "lucide-react"

interface OptionsFieldProps {
  label?: string
  multiple: boolean
  values: string[]
  defaultValue: string | string[]
  onChange: (update: {
    values: string[]
    defaultValue: string | string[]
  }) => void
}

export function OptionsField({
  label = "Values",
  multiple,
  values,
  defaultValue,
  onChange,
}: OptionsFieldProps) {
  const [localValues, setLocalValues] = useState<string[]>(values)
  const [counter, setCounter] = useState(values.length);

  const initSelected = useMemo(() => {
    console.log('defaultValue', defaultValue)
    if (multiple) {
      return Array.isArray(defaultValue) ? defaultValue : [defaultValue]
    } else {
      return Array.isArray(defaultValue) ? defaultValue[0] || "" : defaultValue
    }
  }, [defaultValue, multiple])

  const [selectedValues, setSelectedValues] = useState<string[]>(
    multiple ? (initSelected as string[]) : [initSelected as string]
  )

  const handleAddValue = () => {
    const newCounter = counter + 1;
    setCounter(newCounter);
    const newValues = [...localValues, `Choice ${newCounter}`];
    setLocalValues(newValues);
    onChange({ values: newValues })
  }

  const handleRemoveValue = (index: number) => {
    const newValues = localValues.filter((_, i) => i !== index);
    const newSelectedValues = selectedValues.filter((value) => newValues.includes(value));
    setLocalValues(newValues);
    setSelectedValues(newSelectedValues);
    console.log('newValues', newValues, 'newSelectedValues', newSelectedValues)
    onChange({ values: newValues });
  }

  const handleChangeValue = (index: number, newVal: string) => {
    const newValues = [...localValues]
    newValues[index] = newVal
    setLocalValues(newValues)
    onChange({ defaultValue: selectedValues })
  }

  const handleSelectSingle = (value: string) => {
    setSelectedValues([value])
    onChange({ defaultValue: value })
  }

  const handleToggleMultiple = (value: string) => {
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value]
    setSelectedValues(newSelectedValues)
    onChange({ values: localValues, defaultValue: newSelectedValues })
  }

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium">{label}</label>}

      <div className="border rounded-md p-2 space-y-2">
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
