"use client"

import React from 'react';
import { Check } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useForceRerender } from '@/lib/useForceRepaint';

interface BooleanFieldProps {
  title: string
  description?: string
  value: boolean
  highlight?: boolean
  focusPosition?: string | null
  onChange: (newValue: boolean) => void
}

export function BooleanField({
  title,
  description,
  value,
  onChange,
  highlight,
  focusPosition
}: BooleanFieldProps) {
  const containerRef = useForceRerender(highlight, focusPosition);

  return (
    <div ref={containerRef} className={`w-full max-w-sm bg-white px-4 pt-2 pb-4 border-b border-gray-200 ${highlight ? 'animate-highlight' : ''
      }`}
      data-position={focusPosition}>
      {/* 頂部標題區 */}
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

      {/* Switch 切換區塊 */}
      <div className="flex items-center space-x-2">
        <Label className="text-gray-500">No</Label>
        <Switch
          checked={value}
          onCheckedChange={(checked) => onChange(checked)}
        />
        <Label className="text-gray-500">Yes</Label>
      </div>
    </div>
  )
}
