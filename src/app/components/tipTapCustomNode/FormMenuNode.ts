// FormTextNode.ts
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import FormMenuView from './formMenuView'

export const FormMenuNode = Node.create({
  name: 'formmenu',

  group: 'inline',
  inline: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      snippetData: {
        default: {}, // 預設是空物件
        parseHTML: (element: HTMLElement) => {
          // 假設我們把 data-snippet 存在 DOM attribute
          const data = element.getAttribute('data-snippet')
          if (!data) return {}

          try {
            // 假設 data 是字串化後的 JSON
            return JSON.parse(data)
          } catch (error) {
            console.error('parse snippetData error:', error)
            return {}
          }
        },
        renderHTML: (attributes: { snippetData?: { type?: string } }) => {
          // if (attributes.snippetData && attributes.snippetData.type === 'formmenu') {
            console.log('attributes Menu:', attributes);
          // }
          if (!attributes.snippetData) return {}
          // 將物件序列化為字串
          return {
            'data-snippet': JSON.stringify(attributes.snippetData),
          }
        },
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

  /**
   * 這裡只負責產出最外層 <span>，真正在 React 中如何顯示 chip 交給 NodeView
   */
  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        {
          'data-type': 'formmenu',
        },
        HTMLAttributes,
      ),
    ]
  },

  /**
   * 使用 React NodeView 來渲染
   */
  addNodeView() {
    return ReactNodeViewRenderer(FormMenuView)
  },
})
