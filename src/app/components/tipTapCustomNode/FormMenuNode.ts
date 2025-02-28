// FormMenuNode.ts
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import FormMenuView from './formMenuView'

interface FormMenuOptions {
  onFormMenuClick?: (data: {
    pos: number
    name: string
    defaultValue: string
    options: string
    multiple: boolean
  }) => void
}

export const FormMenuNode = Node.create<FormMenuOptions>({
  name: 'formMenu',

  group: 'inline',
  inline: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      onFormMenuClick: undefined,
    }
  },

  addAttributes() {
    return {
      name: {
        default: 'menu',
      },
      defaultValue: {
        default: '',
      },
      options: {
        default: '',
      },
      multiple: {
        // 預設為 'no'，當值為 'yes' 表示可以多選
        default: false,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="formmenu"]',
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const { name, defaultValue, options, multiple } = node.attrs
    // 若只用文字呈現，可用簡單文本組合（通常在非 NodeView 模式下會用到）
    let textContent = `name: ${name}`
    if (defaultValue) {
      textContent += `, default: ${defaultValue}`
    }
    if (options) {
      textContent += `, options: ${options}`
    }
    if (multiple) {
      textContent += `, multiple: ${multiple}`
    }
    return [
      'span',
      mergeAttributes(
        {
          'data-type': 'formmenu',
          class: 'form-menu-field',
          contenteditable: 'false',
          role: 'button',
        },
        HTMLAttributes,
      ),
      textContent,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(FormMenuView)
  },
})
