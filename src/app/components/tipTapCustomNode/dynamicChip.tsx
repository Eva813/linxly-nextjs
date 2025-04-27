"use client"

import React from "react"

interface DynamicChipProps {
  icon?: React.ReactNode
  data: Record<string, string>
  // onIconClick?: () => void
  /** 點擊資料區塊時的回呼，傳入該區塊的 key 與 value */
  onBlockClick?: (key: string, value: string) => void
  fieldStyles?: Record<string, FieldStyle>

}
interface FieldStyle {
  className?: string;
}

/** 垂直分隔線 */
function Divider() {
  return <div className="h-4 w-px bg-gray-300" />
}

/**
 * DynamicChip 元件
 * 2. 顯示格式為 "key value"
 * 3. 多個區塊之間以垂直分隔線隔開
 * 4. 每個區塊皆具 hover (淺藍色) 與 click 效果
 */
export function DynamicChip({
  data,
  onBlockClick,
  icon,
  fieldStyles,
}: DynamicChipProps) {
  // 直接取出所有的 key-value，不過濾掉空字串
  const entries = Object.entries(data)
  const isFallback = entries.length === 0
  const fallbackKey = Object.keys(data)[0]

  return (
    <div className="inline-flex items-center rounded-full border border-secondary bg-white px-1 text-sm text-gray-700 hover:bg-light">
      {/* icon 區塊 */}
      <div className="rounded pl-2">
        {icon ?? <span className="text-gray-500">{'='}</span>}
      </div>

      {/* 動態產生每個資料區塊 */}
      {isFallback ? (
        <div className="px-2">{fallbackKey}</div>
      ) : (
        entries.map(([key, value], idx) => {
          const extraClass = fieldStyles?.[key]?.className ?? '';
          return (
            <React.Fragment key={key}>
              {idx > 0 && <Divider />}
              <button
                type="button"
                onClick={() => onBlockClick?.(key, value)}
                role="presentation"
                className={`cursor-pointer px-2 hover:bg-[#c9d5e8] flex items-center gap-1`}
              >
                {`${key}: `}<div className={`${extraClass}`}>{`${value}`}</div>
              </button>
            </React.Fragment>
          )
        })
      )}
    </div>
  )
}
