import { Handle, Position } from '@xyflow/react';
import { useState } from 'react';
import { MdSend } from "react-icons/md";
interface CustomNodeData {
  data: {
    id: string;
    label?: string;
    systemPrompt?: string;
    userPrompt?: string;
  };
}

export default function CustomNode({ data }: CustomNodeData) {
  const [systemPrompt, setSystemPrompt] = useState(data.systemPrompt || '');
  const [userPrompt, setUserPrompt] = useState(data.userPrompt || '');
  // const [inputValue, setInputValue] = useState(data.label || '');
  const [result, setResult] = useState('(尚未輸出)');
  const [quantity, setQuantity] = useState(1);


  return (
    <div className="p-2 bg-white rounded-md border border-gray-300">
      <Handle type="target" position={Position.Top} />
      {/* 標題 */}
      <div className="mb-2 font-bold text-gray-500">未命名 AI Card</div>
      {/* System Prompt */}
      <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt</label>
      <textarea
        className="border border-gray-300 p-1 rounded w-full resize nodrag focus:outline-none focus:border-gray-600 focus:ring-0.5 focus:ring-gray-600"
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
        rows={2}
      />
      {/* User Prompt */}
      <label className="block text-sm font-medium text-gray-700 mb-1">User Prompt</label>
      <textarea
        className="border border-gray-300 p-1 rounded w-full resize nodrag focus:outline-none focus:border-gray-600 focus:ring-0.5 focus:ring-gray-600"
        value={userPrompt}
        onChange={(e) => setUserPrompt(e.target.value)}
        rows={2}
      />


      {/* 不用模型選擇和數量選擇 */}
      <div className="flex items-center justify-between mb-2">
        {/* <span className="text-sm text-gray-500">gpt-4-mini</span> */}
        {/* <div className="flex items-center">
          <button
            className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
            onClick={() => setQuantity(quantity > 1 ? quantity - 1 : 1)}
          >
            -
          </button>
          <span className="px-3">{quantity}</span>
          <button
            className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
            onClick={() => setQuantity(quantity + 1)}
          >
            +
          </button>
        </div> */}


        <button className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 flex  items-center justify-center ml-auto">
          <MdSend className="text-black text-lg ml-1" />
        </button>
      </div>

      {/* 結果輸出 */}
      <div className="mt-2 border-t border-gray-200 pt-2 text-gray-500 text-sm">{result}</div>

      <Handle type="source" position={Position.Bottom} />

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
