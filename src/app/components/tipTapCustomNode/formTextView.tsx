// FormTextView.tsx
import React, { useCallback, MouseEvent } from 'react'
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { DynamicChip } from './dynamicChip'

// 我們再擴充一下 options 裡可能用到的 onFormTextClick
interface FormTextNodeOptions {
    onFormTextClick?: (data: {
        pos: number
        name: string
        defaultValue: string
    }) => void
}

/**
 * Tiptap 會把 node, editor, extension, getPos 等都注入進來
 * - node.attrs 會是我們的 { name, defaultValue }
 * - extension.options 會是 { onFormTextClick: ... }
 */
type FormTextViewProps = NodeViewProps & {
    extension: {
        options?: FormTextNodeOptions
    }
}

export default function FormTextView(props: FormTextViewProps) {
    const { node, getPos, extension } = props
    const snippetData = node.attrs.snippetData || {}
    const { name, default: defaultValue } = snippetData


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
                    defaultValue,
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
