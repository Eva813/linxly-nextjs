// FormMenuView.tsx
import React, { useCallback, MouseEvent, useMemo } from 'react'
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { DynamicChip } from './dynamicChip'
import { FormMenuClickHandler } from '@/types/snippets'
import { useSnippetStore } from '@/stores/snippet/index'
import { MdMenuOpen } from "react-icons/md";

type FormMenuViewProps = NodeViewProps & {
  extension: {
    options?: FormMenuClickHandler
  }
}

export default function FormMenuView(props: FormMenuViewProps) {
  const { node, getPos, extension } = props
  const snippetData = node.attrs.snippetData
  const setFocusKey = useSnippetStore((state) => state.setFocusKey);
  const position = getPos ? String(getPos()) : '';

  // 將 attributes 陣列轉為 Map，方便取得欄位值
  // 這會影響傳入 EditPanel 的資料
  const attrMap = useMemo(() => {
    return new Map(
      (snippetData.attributes as Array<{ name: string; value: string }>).map(attr => [attr.name, attr.value])
    );
  }, [snippetData.attributes]);
  // 取得重要欄位資料
  const name = attrMap.get('name') ?? '';
  const defaultValue = attrMap.get('default') ?? '';
  const multiple = Boolean(attrMap.get('multiple'));
  const optionAttr = attrMap.get('options');
  // 將 defaultValue 處理成陣列形式（for 傳入 EditPanel）
  const resolvedDefaultValue = useMemo(() => {
    if (multiple) {
      return Array.isArray(defaultValue) ? defaultValue : [defaultValue]
    } else {
      return [defaultValue]
    }
  }, [defaultValue, multiple]);
  // 處理 options 欄位（目前只支援 array）
  const options = useMemo(() => {
    if (!optionAttr) return [];
    return Array.isArray(optionAttr) ? optionAttr : [];
  }, [optionAttr]);


  // 組合顯示用資料（chipData）+ 處理 multiple 的 Yes / No 顯示
  const chipData = useMemo(() => {
    // 轉換 attributes 陣列成物件形式
    const attributesArray = snippetData.attributes as Array<{ name: string; value: string }>;
    const map = attributesArray
      .filter(({ name, value }) => value !== null && name !== 'multiple')
      .reduce<Record<string, string>>((acc, { name, value }) => {
        acc[name] = value;
        return acc;
      }, {});

    // multiple 特別處理（顯示 Yes / No）
    map['multiple'] = multiple ? 'Yes' : 'No';

    return map;
  }, [multiple, snippetData.attributes]);

  // 樣式對應設定
  const fieldStyles = useMemo(() => ({
    options: { className: 'font-black' },
    multiple: { className: 'font-black' },
  }), []);


  const handleClick = useCallback(
    (event: MouseEvent<HTMLSpanElement>) => {
      event.preventDefault()
      event.stopPropagation()

      if (!getPos) return
      const pos = getPos()
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
    [getPos, options, extension.options, name, resolvedDefaultValue, multiple],
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
        icon={<MdMenuOpen className="h-4 w-4" />}
        data={chipData}
        fieldStyles={fieldStyles}
        onBlockClick={(key) => {
          setFocusKey(`${position}:${key}`);
        }}
      />
    </NodeViewWrapper>
  )
}
