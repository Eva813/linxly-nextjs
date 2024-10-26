import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { useState, useEffect } from 'react';
import { MdSend } from "react-icons/md";
import TextContentDialog from './UI/dialog'; // 引入 CustomDialog 組件
// import { callAiApi } from '../api/aiApi';
import ReactMarkdown from 'react-markdown';
interface CustomNodeData {
  data: {
    id: string;
    label?: string;
    systemPrompt?: string;
    userPrompt?: string;
  };
}
const handleStyle = {
  background: '#555', // Custom color for the handle
  width: 10,          // Custom width
  height: 10,         // Custom height
};

export default function CustomNode({ data }: CustomNodeData) {
  const [systemPrompt, setSystemPrompt] = useState(data.systemPrompt || '');
  const [userPrompt, setUserPrompt] = useState(data.userPrompt || '');
  // const [inputValue, setInputValue] = useState(data.label || '');
  const [result, setResult] = useState('(尚未輸出)');
  // const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const updateNodeInternals = useUpdateNodeInternals();
  const [handles, setHandles] = useState<{ id: string; label: string }[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);


  useEffect(() => {
    // 匹配 userPrompt 中所有的 `[:label:]` 模式
    const regex = /\[:(.*?)\]/g;
    const matches = Array.from(userPrompt.matchAll(regex));

    // 根據匹配結果創建新的 handles 陣列
    const newHandles = matches.map((match, index) => ({
      id: `handle-${index}`,
      label: match[1],
    }));
    console.log('newHandles:', newHandles);
    setHandles(newHandles);

    // 更新節點內部，以確保渲染新 handle
    updateNodeInternals(data.id);
  }, [userPrompt, data.id, updateNodeInternals]);

  // const handleSendClick = async () => {
  //   setLoading(true);
  //   try {
  //     console.log('systemPrompt:', systemPrompt);
  //     const response = await callAiApi(`${systemPrompt}\n${userPrompt}`);
  //     setResult(response.choices[0].text);
  //   } catch (error) {
  //     console.error(error);
  //     setResult('Error retrieving response');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSendClick = async () => {
    setLoading(true);
    try {
      // 發送 POST 請求到 /api/chat 後端 API 路由

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `${systemPrompt}${userPrompt}` }],
        }),
      });

      // 解析 API 的 JSON 回應
      const data = await response.json();
      // const assistantMessage = data.choices[0].message;
      console.log('assistantMessage:', data);
      // 回傳的值，會是 markdown 格式的文字，要轉換一下
      // 產出的寬度要有所限制？不然會太寬
      setResult(data.choices[0].message.content);  // 假設回應結構有 message
    } catch (error) {
      console.error('Error calling AI API:', error);
      setResult('Error retrieving response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-2 bg-white rounded-md border border-gray-300 w-md max-w-md">
      {/* <Handle type="target" position={Position.Left} style={handleStyle} /> */}
      {/* 動態渲染左側的 handle */}

      {/* {handles.map((handle) => (
        <Handle
          key={handle.id}
          type="target"
          position={Position.Left}
          id={handle.id}
          style={handleStyle}
          title={handle.label}
        />
      ))} */}
      {handles.map((handle, index) => (
        <Handle
          key={handle.id}
          type="target"
          position={Position.Left}
          id={handle.id}
          style={{
            ...handleStyle,
            top: `calc(50% + ${index * 20}px)`  // 逐一遞減位置
          }}
          title={handle.label}
        />
      ))}
      {/* 標題 */}
      <div className="mb-2 font-bold text-gray-500">未命名 AI Card</div>
      {/* System Prompt */}
      <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt</label>
      <textarea
        className="border border-gray-300 p-1 rounded w-full resize-y nodrag focus:outline-none focus:border-gray-600 focus:ring-0.5 focus:ring-gray-600"
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
        rows={2}
      />
      {/* User Prompt */}
      <label className="block text-sm font-medium text-gray-700 mb-1">User Prompt</label>
      <textarea
        className="border border-gray-300 p-1 rounded w-full resize-y nodrag focus:outline-none focus:border-gray-600 focus:ring-0.5 focus:ring-gray-600"
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
        <button className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 flex  items-center justify-center ml-auto" onClick={handleSendClick} disabled={loading}>
          <MdSend className="text-black text-lg ml-1" />
          {loading ? 'Loading...' : 'Send'}
        </button>
      </div>

      {/* 結果輸出 */}
      <div className="mt-2 p-2 border rounded border-gray-200 pt-2 text-gray-500 text-sm" onClick={() => setIsDialogOpen(true)}><ReactMarkdown>{result}</ReactMarkdown></div>
      <Handle type="source" position={Position.Right} style={handleStyle} />
      <TextContentDialog message={result} isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </div>
  );
}
