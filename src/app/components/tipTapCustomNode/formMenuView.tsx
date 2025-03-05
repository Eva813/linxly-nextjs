// FormMenuView.tsx
import React, { useCallback, MouseEvent } from 'react'
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { DynamicChip } from './dynamicChip'

interface FormMenuNodeOptions {
  onFormMenuClick?: (data: {
    pos: number
    name: string
    default: string | string[]
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
  const snippetData = node.attrs.snippetData || {}
  const { name, default: defaultValue,options, multiple } = snippetData

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
          default: defaultValue,
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
      className=" text-sm"
      data-type="formtext"
      role="button"
      contentEditable={false}
      onClick={handleClick}
    >
      {/* {textContent} */}
      <DynamicChip
        prefix="="
        data={snippetData}
        // onPrefixClick={() => alert("點擊了 prefix")}
        onBlockClick={(key, value) =>
          alert(`點擊了區塊：${key} ${value}`)
        }
      />
    </NodeViewWrapper>
  )
}
