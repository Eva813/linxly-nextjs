// FormTextNode.ts
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import FormCalcView from './formCalcView'

export const FormCalcNode = Node.create({
  name: 'calc',

  group: 'inline',
  inline: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      promptData: {
        default: {}, // 預設是空物件
        parseHTML: (element: HTMLElement) => {
          // 假設我們把 data-prompt 存在 DOM attribute
          const data = element.getAttribute('data-prompt')
          if (!data) return {}

          try {
            // 假設 data 是字串化後的 JSON
            return JSON.parse(data)
          } catch (error) {
            console.error('parse promptData error:', error)
            return {}
          }
        },
        renderHTML: (attributes: { promptData?: { type?: string } }) => {
          if (!attributes.promptData) return {}
          // 將物件序列化為字串
          return {
            'data-prompt': JSON.stringify(attributes.promptData),
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="calc"]',
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
          'data-type': 'calc',
        },
        HTMLAttributes,
      ),
    ]
  },

  /**
   * 使用 React NodeView 來渲染
   */
  addNodeView() {
    return ReactNodeViewRenderer(FormCalcView)
  },
})
