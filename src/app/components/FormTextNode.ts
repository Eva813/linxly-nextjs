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

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(
      {
        'data-type': 'formtext',
        'class': 'form-text-field',
        'contenteditable': 'false',
        style: 'background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px; margin: 0 2px;'
      },
      HTMLAttributes
    ), `{{${HTMLAttributes.label || 'field'}}}`]
  },

  addNodeView() {
    return ({ node }) => {
      const span = document.createElement('span')
      span.setAttribute('data-type', 'formtext')
      span.setAttribute('class', 'form-text-field')
      span.setAttribute('contenteditable', 'false')
      span.style.backgroundColor = '#e2e8f0'
      span.style.padding = '2px 6px'
      span.style.borderRadius = '4px'
      span.style.margin = '0 2px'
      span.textContent = `{{${node.attrs.label || 'field'}}}`

      return {
        dom: span
      }
    }
  }
})
