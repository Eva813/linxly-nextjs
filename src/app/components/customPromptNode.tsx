import React, { useState, useEffect, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { parseHtml } from '@/lib/utils/parseHtml';
import { renderCustomElement } from '@/app/prompts/components/renderers/renderCustomElement';

interface CustomPromptNodeData {
  html: string;
  title: string;
}

const CustomPromptNode: React.FC<{ data: CustomPromptNodeData }> = ({ data }) => {
  const [elements, setElements] = useState<React.ReactNode[]>([]);

  const renderNode = useCallback((node: ChildNode, key: string): React.ReactNode => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      if (el.tagName === 'SPAN' && el.hasAttribute('data-type')) {
        return renderCustomElement(el, key);
      }
      const children = Array.from(el.childNodes).map((child, i) =>
        renderNode(child, `${key}-${i}`)
      );
      return React.createElement(tag, { key, className: 'inline-block' }, children);
    }
    return null;
  }, []);

  useEffect(() => {
    const root = parseHtml(data.html);
    if (!root) return;
    const arr = Array.from(root.childNodes).map((child, i) =>
      renderNode(child, `custom-${i}`)
    );
    setElements(arr);
  }, [data.html, renderNode]);

  return (
    <div className="relative p-2 bg-white rounded-md border border-gray-300 w-[16rem] dark:bg-flow-darker">
      <Handle type="target" position={Position.Left} style={{ width: 10, height: 10 }} />
      <div className="font-bold mb-1">{data.title}</div>
      <div className="space-y-1 border border-gray-300 p-1 rounded max-h-[22rem] overflow-y-auto">{elements}</div>
      <Handle type="source" position={Position.Right} style={{ width: 10, height: 10 }} />
    </div>
  );
};

export default CustomPromptNode;
