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
        tag: 'span[data-type="formmenu"]',
      },
    ]
  },

  /**
   * 產出完整的 HTML 結構，包含 data-prompt 屬性和顯示文字
   * 這個 HTML 會被用於 generateSafeHTML 的輸出
   */
  renderHTML({ HTMLAttributes, node }) {
    const promptData = node.attrs.promptData || {};
    const defaultValue = Array.isArray(promptData.default) 
      ? promptData.default.join(', ') 
      : (promptData.default || '');
    const displayText = `[${promptData.name || 'menu'}:${defaultValue}]`;
    
    return [
      'span',
      mergeAttributes(
        {
          'data-type': 'formmenu',
        },
        HTMLAttributes,
      ),
      displayText
    ]
  },

  /**
   * 使用 React NodeView 來渲染
   */
  addNodeView() {
    return ReactNodeViewRenderer(FormMenuView)
  },
})
