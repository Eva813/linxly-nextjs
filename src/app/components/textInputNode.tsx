import { Handle, Position } from '@xyflow/react';
import { useState } from 'react';

interface CustomNodeData {
  data: {
    id: string;
    label?: string;
  };
}

export default function CustomNode({ data }: CustomNodeData) {
  const [inputValue, setInputValue] = useState(data.label || '');
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="p-2 bg-white rounded-md border border-gray-300">
      <Handle type="target" position={Position.Top} />
      <div className="mb-2 font-bold">Text Input Node {data.id}</div>
      <textarea
        className="border border-gray-300 p-1 rounded w-full resize nodrag focus:outline-none focus:border-gray-600 focus:ring-0.5 focus:ring-gray-600"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onMouseDown={handleMouseDown}
      />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
