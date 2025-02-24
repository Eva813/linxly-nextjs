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
      // 移除原本的 CSS，直接改用 Tailwind
      className="form-menu-field"
      data-type="formmenu"
      role="button"
      contentEditable={false}
      onClick={handleClick}
    >
      <svg
        className="w-5 h-5 text-gray-400 mr-2"
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

      <span className="text-sm font-medium text-gray-700">
        Options: <b>{options}</b>
      </span>
      <span className="text-sm font-medium text-gray-700 ml-2">
        Name: <b>{name}</b>
      </span>
      <span className="text-sm font-medium text-gray-700 ml-2">
        Multiple: <b>{multiple.toString()}</b>
      </span>
      <span className="text-sm font-medium text-gray-700 ml-2">
        defaultValue: <b>{defaultValue}</b>
      </span>
    </NodeViewWrapper>
  )
}
