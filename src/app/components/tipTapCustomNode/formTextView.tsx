// FormTextView.tsx
import React, { useCallback, MouseEvent } from 'react'
import { NodeViewWrapper, NodeViewProps, NodeViewContent } from '@tiptap/react'
import { DynamicChip } from './dynamicChip'
import { useSnippetStore } from '@/stores/snippet/index'
import { MdOutlineShortText } from "react-icons/md";

// 我們再擴充一下 options 裡可能用到的 onFormTextClick
interface FormTextNodeOptions {
  onFormTextClick?: (data: {
    pos: number
    name: string
    default: string
  }) => void
}

/**
 * Tiptap 會把 node, editor, extension, getPos 等都注入進來
 * - node.attrs 會是我們的 { name, default }
 * - extension.options 會是 { onFormTextClick: ... }
 */
type FormTextViewProps = NodeViewProps & {
  extension: {
    options?: FormTextNodeOptions
  }
}

export default function FormTextView(props: FormTextViewProps) {
  const { node, getPos, extension } = props
  const snippetData = node.attrs.snippetData
  const attributesArray = (snippetData.attributes as Array<{ name: string; value: string }>) || []
  // 只將 value 不為 null 的欄位加入 chipData
  const chipData = attributesArray.reduce<Record<string, string>>((acc, cur) => {
    if (cur.value !== null) {
      acc[cur.name] = cur.value
    }
    return acc
  }, {})

  const name = chipData['name'] || ''
  const defaultValue = chipData['default'] || ''
  // Use store’s setFocusKey to update focus state from a chip click event
  const setFocusKey = useSnippetStore((state) => state.setFocusKey);

  // 獲取當前位置作為唯一識別符
  const position = getPos ? String(getPos()) : '';

  const handleClick = useCallback(
    (event: MouseEvent<HTMLSpanElement>) => {
      event.preventDefault()
      event.stopPropagation()

      if (!getPos) return
      const pos = getPos()

      extension?.options?.onFormTextClick?.({
        pos,
        name,
        default: defaultValue,
      })
    },
    [extension, getPos, name, defaultValue],
  )

  const isEmptyChip = !name && !defaultValue

  // 定義 fallback chip data
  const fallbackChipData = { formtext: '' }

  return (
    <NodeViewWrapper
      as="span"
      className="text-sm focus:outline-none focus:ring-0 select-text inline"
      data-type="formtext"
      role="button"
      onClick={handleClick}
      data-snippet={JSON.stringify(node.attrs.snippetData)}
    >
      <NodeViewContent contentEditable={true} as="span" className="inline-block focus:outline-none focus:ring-0 select-text">
        <DynamicChip
          icon={<MdOutlineShortText className="h-4 w-4" />}
          data={isEmptyChip ? fallbackChipData : chipData}
          onBlockClick={(key) => {
            setFocusKey(`${position}:${key}`);
          }}
        />
      </NodeViewContent>
    </NodeViewWrapper>
  )
}
