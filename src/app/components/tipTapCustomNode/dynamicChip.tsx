"use client"

import React from "react"

interface DynamicChipProps {
  /** 要顯示在最左側的 prefix，例如 "=" */
  prefix?: string
  data: Record<string, string>
  onPrefixClick?: () => void
  /** 點擊資料區塊時的回呼，傳入該區塊的 key 與 value */
  onBlockClick?: (key: string, value: string) => void
}

/** 垂直分隔線 */
function Divider() {
  return <div className="mx-2 h-4 w-px bg-gray-300" />
}

/**
 * DynamicChip 元件
 * 1. 過濾掉 value 為空字串的屬性
 * 2. 顯示格式為 "key value"
 * 3. 多個區塊之間以垂直分隔線隔開
 * 4. 每個區塊皆具 hover (淺藍色) 與 click 效果
 */
export function DynamicChip({
  prefix,
  data,
  onPrefixClick,
  onBlockClick,
}: DynamicChipProps) {
  // 直接取出所有的 key-value，不過濾掉空字串
  const entries = Object.entries(data)
  const isFallback = entries.length === 0
  const fallbackKey = Object.keys(data)[0]

  return (
    <div className="inline-flex items-center rounded-full border border-blue-300 bg-white px-3  text-sm text-gray-700 hover:bg-blue-100">
      {/* prefix 區塊 */}
      {prefix && (
        <div
          onClick={onPrefixClick}
          className="mr-0.5 cursor-pointer rounded px-1"
        >
          {prefix}
        </div>
      )}

      {/* 動態產生每個資料區塊 */}
      {isFallback ? (
        <div className="px-1">{fallbackKey}</div>
      ) : (
        entries.map(([key, value], idx) => (
          <React.Fragment key={key}>
            {idx > 0 && <Divider />}
            <div
              onClick={() => onBlockClick?.(key, value)}
              className="cursor-pointer px-1 hover:bg-blue-200"
            >
              {`${key} ${value}`}
            </div>
          </React.Fragment>
        ))
      )}
    </div>
  )
}
