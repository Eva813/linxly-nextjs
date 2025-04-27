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
          if (!attributes.snippetData) return {}
          // 將物件序列化為字串
          return {
            'data-snippet': JSON.stringify(attributes.snippetData),
          }
        },
      },
    }
  },
  // 新增：定義節點複製為純文字時的內容
  renderText({ node }) {
    const snippetData = node.attrs.snippetData;
    const attributesArray = (snippetData?.attributes as Array<{ name: string; value: string | null }>) || [];
    const chipData = attributesArray.reduce<Record<string, string>>((acc, cur) => {
      if (cur.value !== null) {
        acc[cur.name] = cur.value;
      }
      return acc;
    }, {});
    const entries = Object.entries(chipData);

    if (entries.length === 0 && snippetData?.attributes?.length > 0) {
      // 處理 fallback 情況，如果 chipData 為空但原始 attributes 有資料
      // 這裡假設 fallback 顯示第一個 key，如果沒有則為空字串
      const fallbackKey = snippetData.attributes[0]?.name ?? 'formtext';
      return `{${fallbackKey}=}`; // 或者返回您希望的 fallback 文字
    } else if (entries.length === 0) {
      // 如果完全沒有資料
      return '{formtext=}'; // 或者其他預設空值表示
    }

    // 產生與之前 handleCopyCapture 相同的字串格式
    return `{${entries.map(([k, v]) => `${k}=${v}`).join(",")}}`;
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
    ]
  },

  /**
   * 使用 React NodeView 來渲染
   */
  addNodeView() {
    return ReactNodeViewRenderer(FormTextView, {
      stopEvent: (props: { event: Event }) => {
        // 這些事件讓它們通過，不要在 NodeView 裡攔截
        const passThrough = [
          'mousedown',
          'mouseup',
          'mousemove',
          'click',
          'dblclick',
          // 'keydown',
          // 'keyup',
          'copy',
          // 'cut',
          // 'paste',
          'selectstart',
          'mouseenter',
          'mouseleave',
          'focusin',
          'focusout'
        ]
        return !passThrough.includes(props.event.type)
      },
    })
  },
})
