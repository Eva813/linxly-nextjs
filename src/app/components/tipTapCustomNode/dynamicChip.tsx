"use client"

import React, { useRef } from "react"

interface DynamicChipProps {
  icon?: React.ReactNode
  data: Record<string, string>
  onBlockClick?: (key: string, value: string) => void
  fieldStyles?: Record<string, { className?: string }>
  isSelected?: boolean
}

function Divider() {
  return <div className="h-4 w-px bg-gray-300" />
}

export function DynamicChip({
  data,
  onBlockClick,
  icon,
  fieldStyles,
  isSelected = false,
}: DynamicChipProps) {
  const entries = Object.entries(data)
  const isFallback = entries.length === 0 || (entries.length === 1 && entries[0][0] === "formtext")
  const fallbackKey = Object.keys(data)[0]
  const chipRef = useRef<HTMLSpanElement>(null)


  return (
    // 將整個元件設為可選取的文字區塊
    <span
      ref={chipRef}
      className="inline-block rounded-full border border-secondary  px-1 text-sm text-gray-700 select-all"
      data-selected={isSelected}
    >
      {/* 內部容器設為統一整體 */}
      <span className="flex items-center whitespace-nowrap">
        {/* 圖示部分 - 移除多餘的 select-all */}
        <span className="pl-2">
          {icon || <span className="text-gray-500">{'='}</span>}
        </span>

        {/* 內容部分 */}
        {isFallback ? (
          <span className="px-2">{fallbackKey}</span>
        ) : (
          entries.map(([key, value], idx) => {
            const extraClass = fieldStyles?.[key]?.className ?? ""
            return (
              <React.Fragment key={key}>
                {idx > 0 && <Divider />}
                <span
                  className="cursor-pointer px-2 hover:bg-[#c9d5e8] flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBlockClick?.(key, value);
                  }}
                >
                  <span>{`${key}=`}</span>
                  <span className={extraClass}>{value}</span>
                </span>
              </React.Fragment>
            )
          })
        )}
      </span>
    </span>
  )
}