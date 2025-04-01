// FormTextView.tsx
import React, { useCallback, MouseEvent } from 'react'
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { DynamicChip } from './dynamicChip'
import { useSnippetStore } from '@/stores/snippet/index'

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
      className="text-sm"
      data-type="formtext"
      role="button"
      contentEditable={false}
      onClick={handleClick}
      data-snippet={JSON.stringify(node.attrs.snippetData)}
    >
      <DynamicChip
        prefix="="
        data={isEmptyChip ? fallbackChipData : chipData}
        onBlockClick={(key, value) => {
          console.log(`點擊了區塊：${key} ${value}`);
          setFocusKey(key);
        }}
      />
    </NodeViewWrapper>
  )
}
