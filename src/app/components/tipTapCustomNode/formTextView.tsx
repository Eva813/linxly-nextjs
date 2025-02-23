// FormTextView.tsx
import React, { useCallback, MouseEvent } from 'react'
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'

// 我們再擴充一下 options 裡可能用到的 onFormTextClick
interface FormTextNodeOptions {
    onFormTextClick?: (data: {
        pos: number
        label: string
        defaultValue: string
    }) => void
}

/**
 * Tiptap 會把 node, editor, extension, getPos 等都注入進來
 * - node.attrs 會是我們的 { label, defaultValue }
 * - extension.options 會是 { onFormTextClick: ... }
 */
type FormTextViewProps = NodeViewProps & {
    extension: {
        options?: FormTextNodeOptions
    }
}

export default function FormTextView(props: FormTextViewProps) {
    const { node, getPos, extension } = props
    const { label, defaultValue } = node.attrs

    const handleClick = useCallback(
        (event: MouseEvent<HTMLSpanElement>) => {
            event.preventDefault()
            event.stopPropagation()

            if (!getPos) return
            const pos = getPos()

            if (extension?.options?.onFormTextClick) {
                extension.options.onFormTextClick({
                    pos,
                    label,
                    defaultValue,
                })
            }
        },
        [extension, getPos, label, defaultValue],
    )

    let textContent = `name: ${label}`
    if (defaultValue) {
        textContent = `name: ${label}, default: ${defaultValue}`
    }

    return (
        <NodeViewWrapper
            as="span"
            className="form-text-field"
            data-type="formtext"
            role="button"
            contentEditable={false}
            onClick={handleClick}
        >
            {textContent}
        </NodeViewWrapper>
    )
}
