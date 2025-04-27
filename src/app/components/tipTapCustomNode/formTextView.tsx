// FormTextView.tsx
import React, { useCallback, MouseEvent, useState, useEffect } from 'react'
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
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
  const { node, getPos, extension, editor } = props
  const snippetData = node.attrs.snippetData
  const attributesArray = (snippetData.attributes as Array<{ name: string; value: string }>) || []
  const [isSelected, setIsSelected] = useState(false)

  // 監聽 TipTap 選取狀態變化
  useEffect(() => {
    if (!getPos) return

    const updateSelection = () => {
      const { state } = editor
      const currentPos = getPos()
      const nodeSize = node.nodeSize

      // 檢查目前的選取是否包含這個節點
      const { from, to } = state.selection
      const isNodeSelected = from <= currentPos && to >= currentPos + nodeSize

      setIsSelected(isNodeSelected)
    }

    // 初始檢查
    updateSelection()

    // 訂閱選取變化
    editor.on('selectionUpdate', updateSelection)

    return () => {
      editor.off('selectionUpdate', updateSelection)
    }
  }, [editor, getPos, node])

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
      className="text-sm mr-1 ml-1 bg-white focus:outline-none focus:ring-0 select-all inline-block collapsed-command"
      data-type="formtext"
      role="button"
      onClick={handleClick}
      data-snippet={JSON.stringify(node.attrs.snippetData)}
      tabIndex={-1}
      data-selected={isSelected}
    >
      <DynamicChip
        icon={<MdOutlineShortText className="h-4 w-4" />}
        data={isEmptyChip ? fallbackChipData : chipData}
        onBlockClick={(key) => {
          setFocusKey(`${position}:${key}`);
        }}
        isSelected={isSelected}
      />
    </NodeViewWrapper>
  )
}
