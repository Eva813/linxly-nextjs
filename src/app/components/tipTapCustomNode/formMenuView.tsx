// FormMenuView.tsx
import React, { useCallback, MouseEvent, useMemo } from 'react'
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { DynamicChip } from './dynamicChip'
import { FormMenuClickHandler } from '@/types/snippets'


type FormMenuViewProps = NodeViewProps & {
  extension: {
    options?: FormMenuClickHandler
  }
}

export default function FormMenuView(props: FormMenuViewProps) {
  const { node, getPos, extension } = props
  const snippetData = node.attrs.snippetData
  console.log('FormMenuView rendering with snippetData:', snippetData);
  // 轉換 attributes 陣列成物件形式
  const chipData = (snippetData.attributes as Array<{ name: string; value: string }>).reduce<Record<string, string>>((acc, cur) => {
    acc[cur.name] = cur.value
    return acc
  }, {})

  // 從 attributes 陣列中找出對應的欄位，這會影響傳入 EditPanel 的資料
  const nameAttr = snippetData.attributes.find((attr: { name: string }) => attr.name === 'name')
  const defaultAttr = snippetData.attributes.find((attr: { name: string }) => attr.name === 'default')
  const multipleAttr = snippetData.attributes.find(
    (attr: { name: string }) => attr.name === 'multiple'
  )
  const optionAttr = snippetData.attributes.find((attr: { name: string }) => attr.name === 'options')


  const name = nameAttr ? nameAttr.value : ''
  const defaultValue = defaultAttr ? defaultAttr.value : ''
  // 這邊做個保護，如果沒找到 multipleAttr，就預設 false
  const multiple = multipleAttr ? Boolean(multipleAttr.value) : false
  const options = useMemo(() => {
    if (!optionAttr) return [];

    // 如果 value 已經是陣列，直接使用
    if (Array.isArray(optionAttr.value)) {
      return optionAttr.value;
    }
  }, [optionAttr]);

  const resolvedDefaultValue = useMemo(() => {
    if (multiple) {
      return Array.isArray(defaultValue) ? defaultValue : [defaultValue]
    } else {
      return [defaultValue]
    }
  }, [defaultValue, multiple]);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLSpanElement>) => {
      event.preventDefault()
      event.stopPropagation()

      if (!getPos) return
      const pos = getPos()
      console.log('在 formMenuView: nameAttr', nameAttr, 'defaultAttr', defaultAttr, 'multipleAttr', multipleAttr, ' optionAttr', options)
      if (extension?.options?.onFormMenuClick) {
        extension.options.onFormMenuClick({
          pos,
          name,
          default: resolvedDefaultValue,
          multiple,
          options: options,
        })
      }
    },
    [getPos, nameAttr, defaultAttr, multipleAttr, options, extension.options, name, resolvedDefaultValue, multiple],
  )

  return (
    <NodeViewWrapper
      as="span"
      className="text-sm"
      data-type="formmenu"
      role="button"
      contentEditable={false}
      onClick={handleClick}
      data-snippet={JSON.stringify(node.attrs.snippetData)}
    >
      <DynamicChip
        prefix="="
        data={chipData}
        onBlockClick={(key, value) => alert(`點擊了區塊：${key} ${value}`)}
      />
    </NodeViewWrapper>
  )
}
