// FormTextNode.ts
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import FormTextView from './formTextView'

/**
 * 第 1 個泛型參數：Options
 * 第 2 個泛型參數：Storage (若你用不到 Storage，可直接用空物件)
 * 第 3 個泛型參數：Attrs (在 Tiptap v2/v3，語法可能略有差異)
 *
 * 但在 Tiptap v2/v3，官方通常把 "attrs" 放在第 2 或第 3 個泛型裡。
 * 這裡假設 Tiptap v2/v3，基本概念相同：要讓 Tiptap 知道你的 Node 有哪些 attrs。
 */
interface FormTextOptions {
  onFormTextClick?: (data: { pos: number; label: string; defaultValue: string }) => void
}

// 這裡假設 Tiptap v2/v3 的寫法，attrs 型別放在第 2 或第 3 參數
export const FormTextNode = Node.create<FormTextOptions>({
  name: 'formTextField',

  group: 'inline',
  inline: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      onFormTextClick: undefined,
    }
  },

  addAttributes() {
    return {
      label: {
        default: 'field',
      },
      defaultValue: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="formtext"]',
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const { label, defaultValue } = node.attrs
    let textContent = `name: ${label}`
    if (defaultValue) {
      textContent = `name: ${label}, default: ${defaultValue}`
    }

    return [
      'span',
      mergeAttributes(
        {
          'data-type': 'formtext',
          class: 'form-text-field',
          contenteditable: 'false',
          role: 'button',
        },
        HTMLAttributes,
      ),
      textContent,
    ]
  },

  addNodeView() {
    // 可以在這裡指定泛型，例如: ReactNodeViewRenderer<MyNodeViewProps>(FormTextView)
    // 但最常見的情況下，只要你的 React component 有宣告 NodeViewProps<...> 就行
    return ReactNodeViewRenderer(FormTextView)
  },
})
