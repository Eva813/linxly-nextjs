import { Node, mergeAttributes } from '@tiptap/core'

export const FormTextNode = Node.create({
  name: 'formTextField',

  group: 'inline',
  inline: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      label: {
        default: 'field'
      },
      defaultValue: {
        default: ''
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="formtext"]',
      }
    ]
  },

  // renderHTML({ HTMLAttributes }) {
  //   return ['span', mergeAttributes(
  //     {
  //       'data-type': 'formtext',
  //       'class': 'form-text-field',
  //       'contenteditable': 'false',
  //       // style: 'background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px; margin: 0 2px;'
  //     },
  //     HTMLAttributes
  //   ), `{{ default: ${HTMLAttributes.defaultValue || ''}, name: ${HTMLAttributes.label || 'field'} }}`]
  // },

  // 編輯器將文件輸出為 HTML 
  renderHTML({ node, HTMLAttributes }) {
    const { label, defaultValue } = node.attrs

    // 判斷 defaultValue 是否存在
    let textContent = `name: ${label}`
    if (defaultValue) {
      textContent = `name: ${label}, default: ${defaultValue}`
    }

    return [
      'span',
      mergeAttributes(
        {
          'data-type': 'formtext',
          'class': 'form-text-field',
          'contenteditable': 'false',
          'role': 'button'
        },
        HTMLAttributes
      ),
      textContent
    ]
  },

  addNodeView() {
    return ({ node }) => {
      const span = document.createElement('span')
      span.setAttribute('data-type', 'formtext')
      span.setAttribute('class', 'form-text-field')
      span.setAttribute('contenteditable', 'false')

      const { label, defaultValue } = node.attrs

      // 判斷 defaultValue 是否存在
      if (defaultValue) {
        span.textContent = `name: ${label}, default: ${defaultValue} `
      } else {
        span.textContent = `name: ${label}`
      }
      return {
        dom: span
      }
    }
  }
})
