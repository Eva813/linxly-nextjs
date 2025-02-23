// FormMenuView.tsx
import React, { useCallback, MouseEvent } from 'react'
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'

interface FormMenuNodeOptions {
  onFormMenuClick?: (data: {
    pos: number
    name: string
    defaultValue: string | string[]
    options: string
    multiple: boolean
  }) => void
}

type FormMenuViewProps = NodeViewProps & {
  extension: {
    options?: FormMenuNodeOptions
  }
}

export default function FormMenuView(props: FormMenuViewProps) {
  const { node, getPos, extension } = props
  const { name, defaultValue, options, multiple } = node.attrs

  const handleClick = useCallback(
    (event: MouseEvent<HTMLSpanElement>) => {
      event.preventDefault()
      event.stopPropagation()

      if (!getPos) return
      const pos = getPos()

      if (extension?.options?.onFormMenuClick) {
        extension.options.onFormMenuClick({
          pos,
          name,
          defaultValue,
          options,
          multiple,
        })
      }
    },
    [getPos, extension, name, defaultValue, options, multiple],
  )

  return (
    <NodeViewWrapper
      as="span"
      // 使用 Tailwind CSS 調整樣式，模擬 chip 外觀
      className="inline-flex items-center p-2 border border-gray-300 rounded bg-white cursor-pointer select-none"
      data-type="formmenu"
      role="button"
      contentEditable={false}
      onClick={handleClick}
    >
      <div className="flex items-center space-x-2">
        {/* 圖標區塊 */}
        <div className="flex-shrink-0">
          <svg
            className="w-6 h-6 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 18h13v-2H3zm0-5h10v-2H3zm0-7v2h13V6zm18 9.59L17.42 12 21 8.41 19.59 7l-5 5 5 5z"
            />
          </svg>
        </div>
        {/* 內容區塊：options, name 與 multiple */}
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">
            Options: <b>{options}</b>
          </span>
          <span className="text-sm font-medium text-gray-700">
            Name: <b>{name}</b>
          </span>
          <span className="text-sm font-medium text-gray-700">
            Multiple: <b>{multiple}</b>
          </span>
          <span>
            defaultValue: <b>{defaultValue}</b>
          </span>
        </div>
      </div>
    </NodeViewWrapper>
  )
}
