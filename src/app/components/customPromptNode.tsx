import React, { useState, useEffect, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { parseHtml } from '@/lib/utils/parseHtml';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { renderCustomElement } from '@/app/prompts/components/renderers/renderCustomElement';

interface CustomPromptNodeData {
  html: string;
  title: string;
}
const VOID_TAGS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "source", "track", "wbr"
]);

const CustomPromptNode: React.FC<{ id: string; data: CustomPromptNodeData }> = ({ id, data }) => {
  const [elements, setElements] = useState<React.ReactNode[]>([]);
  const { deleteElements } = useReactFlow();

  const renderNode = useCallback((node: ChildNode, key: string): React.ReactNode => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      // void tag，不含 children
      if (VOID_TAGS.has(tag)) {
        return React.createElement(tag, { key });
      }

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

  const handleDeleteNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  };

  return (
    <div className="relative p-2 bg-white rounded-md border border-gray-300 w-[16rem] dark:bg-flow-darker">
      <Handle type="target" position={Position.Left} style={{ width: 10, height: 10 }} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            ⋮
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" sideOffset={15} alignOffset={-5} className="w-28 dark:bg-flow-darker">
          <DropdownMenuItem 
            onClick={handleDeleteNode} 
            className="text-red-500 dark:text-red-400 hover:!bg-light hover:!text-red-500 dark:hover:!bg-gray-700"
          >
            <span className="font-medium">Delete</span> Card
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="font-bold mb-1">{data.title}</div>
      <div className="space-y-1 border border-gray-300 p-2 rounded max-h-[22rem] overflow-y-auto">{elements}</div>
      <Handle type="source" position={Position.Right} style={{ width: 10, height: 10 }} />
    </div>
  );
};

export default CustomPromptNode;
