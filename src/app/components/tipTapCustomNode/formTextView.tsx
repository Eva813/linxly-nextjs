// FormTextView.tsx
import React, { useCallback, MouseEvent } from 'react'
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { DynamicChip } from './dynamicChip'

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

    const chipData = (snippetData.attributes as Array<{ name: string; value: string }>).reduce<Record<string, string>>((acc, cur) => {
      acc[cur.name] = cur.value;
      return acc;
    }, {});

    // 從 attributes 陣列中找出對應的欄位
    const nameAttr = snippetData.attributes.find((attr: {name: string}) => attr.name === 'name')
    const defaultAttr = snippetData.attributes.find((attr: {name: string}) => attr.name === 'default')
  
    const name = nameAttr ? nameAttr.value : ''
    const defaultValue = defaultAttr ? defaultAttr.value : ''
  
    const handleClick = useCallback(
      (event: MouseEvent<HTMLSpanElement>) => {
        event.preventDefault()
        event.stopPropagation()
  
        if (!getPos) return
        const pos = getPos()
  
        if (extension?.options?.onFormTextClick) {
          extension.options.onFormTextClick({
            pos,
            name,
            default: defaultValue,
          })
        }
      },
      [extension, getPos, name, defaultValue],
    )

    return (
        <NodeViewWrapper
            as="span"
            className=" text-sm"
            data-type="formtext"
            role="button"
            contentEditable={false}
            onClick={handleClick}
            data-snippet={JSON.stringify(node.attrs.snippetData)}
        >
            {/* {textContent} */}
            <DynamicChip
                prefix="="
                data={chipData}
                // onPrefixClick={() => alert("點擊了 prefix")}
                onBlockClick={(key, value) =>
                    alert(`點擊了區塊：${key} ${value}`)
                }
            />
        </NodeViewWrapper>
    )
}
