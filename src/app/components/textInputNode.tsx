import { Handle, Position, useReactFlow } from '@xyflow/react';
import { useState } from 'react';

interface CustomNodeData {
  data: {
    id: string;
    label?: string;
  };
}
const handleStyle = {
  // background: '#555', // Custom color for the handle
  width: 10,          // Custom width
  height: 10,         // Custom height
};


export default function CustomNode({ data }: CustomNodeData) {
  const [inputValue, setInputValue] = useState(data.label || '');
  const { setNodes } = useReactFlow();
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    // 新增：更新節點數據
    setNodes((nodes) => {
      return nodes.map((node) => {
        if (node.id === data.id) {
          return {
            ...node,
            data: {
              ...node.data,
              id: node.data.id,
              label: node.data.label,
              inputContent: e.target.value,  // 將輸入內容保存到節點數據中
            },
          };
        }
        return node;
      });
    });
  };

  return (
    <div className="p-2 bg-white rounded-md border border-gray-300 w-[16rem] dark:bg-flow-darker">
      <Handle type="target" position={Position.Left} style={handleStyle} className="bg-[#555] dark:bg-white" />
      <div className="mb-2 font-bold">Text Input Node {data.id}</div>
      <textarea
        className="border border-gray-300 p-1 rounded w-full resize-y focus:outline-none focus:border-gray-600 focus:ring-0.5 focus:ring-gray-600 nowheel nodrag dark:bg-flow-darker"
        value={inputValue}
        onMouseDown={handleMouseDown}
        onChange={handleChange}
      />
      <Handle type="source" id={`source-${data.id}`} position={Position.Right} style={handleStyle} className="bg-[#555] dark:bg-white" />
    </div>
  );
}
