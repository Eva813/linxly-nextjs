// FormTextNode.ts
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import FormTextView from './formTextView'

export const FormTextNode = Node.create({
  name: 'formtext',

  group: 'inline',
  inline: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      /**
       * 用來存放像 {{ default: ddd, name: HJ, cols: 10 }} 這種結構
       * 也可以是單純一個物件 { default: 'ddd', name: 'HJ', cols: 10 }
       */
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
          console.log('attributes Form1:', attributes)
          // 只處理 formtext 類型的節點
          // if (!attributes.snippetData || attributes.snippetData.type !== 'formtext') {
          //   return {}
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
        tag: 'span[data-type="formtext"]',
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
          'data-type': 'formtext',
        },
        HTMLAttributes,
      ),
      // 0, // 讓子節點可以繼續渲染 (inline node 內容)
    ]
  },

  /**
   * 使用 React NodeView 來渲染
   */
  addNodeView() {
    return ReactNodeViewRenderer(FormTextView)
  },
})
