"use client"

import React from "react"

interface DynamicChipProps {
  icon?: React.ReactNode
  data: Record<string, string>
  onBlockClick?: (key: string, value: string) => void
  fieldStyles?: Record<string, { className?: string }>
}

function Divider() {
  return <div className="h-4 w-px bg-gray-300" />
}

export function DynamicChip({
  data,
  onBlockClick,
  icon,
  fieldStyles,
}: DynamicChipProps) {
  const entries = Object.entries(data)
  const isFallback = entries.length === 0
  const fallbackKey = Object.keys(data)[0]

  // 1. 建立要複製的字串
  const clipboardText = `{${entries.map(([k, v]) => `${k}=${v}`).join(",")}}`

  // 2. 攔截 copy 事件，寫入 custom text
  const handleCopyCapture = (e: React.ClipboardEvent<HTMLDivElement>) => {
     // 1. 寫進 ClipboardEvent
    e.clipboardData.setData("text/plain", clipboardText)
      // 2. fallback：呼叫 Navigator Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(clipboardText).catch(() => {})
      }
      e.preventDefault()
   }

  return (
    <div
      // 3. 在最外層攔截 copy
      onCopyCapture={handleCopyCapture}
      // 4. 讓所有子孫元素都可選字
      className="inline-flex items-center rounded-full border border-secondary bg-white px-1 text-sm text-gray-700 hover:bg-light select-text"
    >
      <div className="rounded pl-2">
        {icon ?? <span className="text-gray-500">{'='}</span>}
      </div>

      {isFallback ? (
        <div className="px-2">{fallbackKey}</div>
      ) : (
        entries.map(([key, value], idx) => {
          const extraClass = fieldStyles?.[key]?.className ?? ""
          return (
            <React.Fragment key={key}>
              {idx > 0 && <Divider />}
              <span
                role="button"
                onClick={() => onBlockClick?.(key, value)}
                // 讓 button 內文字也可被選
                className="cursor-pointer px-2 hover:bg-[#c9d5e8] flex items-center gap-1 select-text"
              >
                <span>{`${key}=`}</span>
                <span className={extraClass}>{value}</span>
              </span>
            </React.Fragment>
          )
        })
      )}
    </div>
  )
}
