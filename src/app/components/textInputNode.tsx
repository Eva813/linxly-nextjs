import { Handle, Position, useReactFlow } from '@xyflow/react';
import { useState, memo, useRef, useCallback } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSnippetInsertion } from '@/lib/useSnippetInsertion'

interface CustomNodeData {
  data: {
    id: string;
    label?: string;
    inputContent?: string;
  };
}

const handleStyle = {
  width: 10,          // Custom width
  height: 10,
};

const TextInputNode = ({ data }: CustomNodeData) => {
  const [inputValue, setInputValue] = useState(data.label || '');
  const { setNodes, deleteElements, getNodes, addNodes } = useReactFlow();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateNodeData = useCallback((newValue: string) => {
    setInputValue(newValue);
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === data.id) {
          return {
            ...node,
            data: {
              ...node.data,
              label: newValue,
              inputContent: newValue,
            },
          };
        }
        return node;
      })
    );
  }, [data.id, setNodes]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(e.target.value);
    const newValue = e.target.value;
    setInputValue(newValue);

    setNodes((nodes) => {
      return nodes.map((node) => {
        if (node.id === data.id) {
          return {
            ...node,
            data: {
              ...node.data,
              label: newValue,
              inputContent: newValue,
            },
          };
        }
        return node;
      });
    });
  };


  const handleDeleteNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id: data.id }] });
  };

  const handleCopyNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nodes = getNodes();
    const currentNode = nodes.find(node => node.id === data.id);

    if (currentNode) {
      const newId = `${Date.now()}`;
      const newNode = {
        ...currentNode,
        id: newId,
        position: {
          x: currentNode.position.x + 250,
          y: currentNode.position.y + 50
        },
        data: {
          ...currentNode.data,
          id: newId,
          label: inputValue,
          inputContent: inputValue,
        },
      };
      addNodes(newNode);
    }
  };

  useSnippetInsertion({
    inputRef: textareaRef,
    onInsert: updateNodeData
  });

  return (
    <div className="relative p-2 bg-white rounded-md border border-gray-300 w-[16rem] dark:bg-flow-darker">
      <Handle type="target" position={Position.Left} style={handleStyle} className="bg-[#555] dark:bg-white" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            ⋮
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" sideOffset={15} alignOffset={-5} className="w-28 dark:bg-flow-darker">
          <DropdownMenuItem onClick={handleCopyNode} className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
            <span className="font-medium">複製</span> Card
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDeleteNode} className="text-red-500 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            <span className="font-medium">刪除</span> Card
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="mb-2 font-bold">Text Input Node {data.id}</div>

      <textarea
        ref={textareaRef}
        className="border border-gray-300 p-1 rounded w-full resize-y focus:outline-none focus:border-gray-600 focus:ring-0.5 focus:ring-gray-600 nowheel nodrag dark:bg-flow-darker"
        value={inputValue}
        onChange={handleChange}
        onClick={(e) => e.stopPropagation()}
      />

      <Handle type="source" id={`source-${data.id}`} position={Position.Right} style={handleStyle} className="bg-[#555] dark:bg-white" />
    </div>
  );
};

TextInputNode.displayName = 'TextInputNode';

export default memo(TextInputNode);
