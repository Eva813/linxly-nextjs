import { Handle, Position, useUpdateNodeInternals, useStore, useReactFlow } from '@xyflow/react';
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { MdSend } from "react-icons/md";
import TextContentDialog from './UI/textContentDialog'; // 引入 CustomDialog 組件
import ReactMarkdown from 'react-markdown';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePromptInsertion } from '@/lib/usePromptInsertion'

interface CustomNodeData {
  data: {
    id: string;
    label?: string;
    systemPrompt?: string;
    userPrompt?: string;
    userPromptNodeId?: string;
    result?: string; 
    title?: string;
  };
}
const handleStyle = {
  width: 10, 
  height: 10,     
};

const AIPromptNode = ({ data }: CustomNodeData)  => {
  const { setNodes, deleteElements, getNodes, addNodes } = useReactFlow();
  const [systemPrompt, setSystemPrompt] = useState(data.systemPrompt ?? '');
  const [userPrompt, setUserPrompt] = useState(data.userPrompt ?? '');
  const [result, setResult] = useState(data.result ?? '(Not yet output.)');
  // const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const updateNodeInternals = useUpdateNodeInternals();
  const [handles, setHandles] = useState<{ id: string; label: string }[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [edgeCount, setEdgeCount] = useState(0);
  const systemPromptRef = useRef<HTMLTextAreaElement>(null);
  const userPromptRef = useRef<HTMLTextAreaElement>(null);
  const systemPromptId = `system-prompt-${data.id}`;
  const userPromptId   = `user-prompt-${data.id}`;

  // 獲取所有連接到這個節點的邊
  const edges = useStore((s) => s.edges.filter((e) => e.target === data.id));
  // 更新節點並處理連線變化
  useEffect(() => {
    if (edges.length !== edgeCount) {
      setEdgeCount(edges.length);
      updateNodeInternals(data.id);
    }
  }, [edges.length, edgeCount, data.id, updateNodeInternals]);

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

  const { getNode, getEdges } = useReactFlow();

  const getConnectedContent = () => {
    const edges = getEdges();
    const incomingEdges = edges.filter(edge => edge.target === data.id);
    const contentMap = new Map();

    incomingEdges.forEach(edge => {
      const sourceNode = getNode(edge.source);
      console.log('source', sourceNode)
      let content: string = '';
      if (sourceNode?.type === 'fileUploadNode') {
        content = String(sourceNode.data?.fileContent || '');
      } else if (sourceNode?.type === 'textInputNode') {
        content = String(sourceNode.data?.inputContent || '');
      } else if (sourceNode?.type === 'aiPromptNode') {
        content = String(sourceNode.data?.result || '');
      }

      const handleId = edge.targetHandle;
      const handle = handles.find(h => h.id === handleId);
      if (handle) {
        contentMap.set(handle.label, content);
      }
    });

    console.log('contentMap:', contentMap);
    console.log('userPrompt', userPrompt)

    // Add this return statement
    // return Array.from(contentMap.entries())
    //   .map(([label, content]) => `${label}: ${content}`)
    //   .join('\n');
    const combinedContent = Array.from(contentMap.entries())
      .map(([label, content]) => `${label}: ${content}`)
      .join('\n');

    console.log('ALL', `${userPrompt}\n${combinedContent}`)

    // Include userPrompt in the final output
    return `${userPrompt}\n${combinedContent}`;
  };

  // 更新 systemPrompt 的處理函數
  // const handleSystemPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  //   const newValue = e.target.value;
  //   setSystemPrompt(newValue);

  //   // 更新節點數據
  //   setNodes((nodes) => {
  //     return nodes.map((node) => {
  //       if (node.id === data.id) {
  //         return {
  //           ...node,
  //           data: {
  //             ...node.data,
  //             systemPrompt: newValue,
  //           },
  //         };
  //       }
  //       return node;
  //     });
  //   });
  // };

  // 更新 userPrompt 的處理函數
  // const handleUserPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  //   const newValue = e.target.value;
  //   setUserPrompt(newValue);

  //   // 更新節點數據
  //   setNodes((nodes) => {
  //     return nodes.map((node) => {
  //       if (node.id === data.id) {
  //         return {
  //           ...node,
  //           data: {
  //             ...node.data,
  //             userPrompt: newValue,
  //           },
  //         };
  //       }
  //       return node;
  //     });
  //   });
  // };

  // 添加 result 的處理函數
  const handleResultChange = (newResult: string) => {
    setResult(newResult);

    // 更新節點數據
    setNodes((nodes) => {
      return nodes.map((node) => {
        if (node.id === data.id) {
          return {
            ...node,
            data: {
              ...node.data,
              result: newResult,
            },
          };
        }
        return node;
      });
    });
  };

  const handleSendClick = async () => {
    setLoading(true);
    const connectedContent = getConnectedContent();
    console.log('Connected content:', connectedContent);

    try {
      // 發送 POST 請求到 /api/chat 後端 API 路由
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user', content: `{ role: 'situation', content: ${systemPrompt} }, { role: 'user', content: ${connectedContent}}`
          }]
        }),
      });

      // 解析 API 的 JSON 回應
      const data = await response.json();
      const newResult = data.choices[0].message.content;
      setResult(newResult);
      console.log('newResult:', newResult);
      // 使用新的處理函數來更新 result
      handleResultChange(newResult);
    } catch (error) {
      console.error('Error calling AI API:', error);
      setResult('Error retrieving response');
    } finally {
      setLoading(false);
    }
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
          systemPrompt: systemPrompt,
          userPrompt: userPrompt,
          result: result,
        },
      };
      addNodes(newNode);
    }
  };
  // 更新 systemPrompt 的處理函數
  const handleSystemPromptUpdate = useCallback((newValue: string) => {
    setSystemPrompt(newValue);
    setNodes((nodes) => {
      return nodes.map((node) => {
        if (node.id === data.id) {
          return {
            ...node,
            data: {
              ...node.data,
              systemPrompt: newValue,
            },
          };
        }
        return node;
      });
    });
  }, [data.id, setNodes]);
  const handleUserPromptUpdate = useCallback((newValue: string) => {
    setUserPrompt(newValue);
    setNodes((nodes) => {
      return nodes.map((node) => {
        if (node.id === data.id) {
          return {
            ...node,
            data: {
              ...node.data,
              userPrompt: newValue,
            },
          };
        }
        return node;
      });
    });
  }, [data.id, setNodes]);
  // 為兩個 textarea 添加 prompt 功能
  usePromptInsertion({
    inputRef: systemPromptRef,
    onInsert: handleSystemPromptUpdate
  });

  usePromptInsertion({
    inputRef: userPromptRef,
    onInsert: handleUserPromptUpdate
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === data.id) {
          return {
            ...node,
            data: {
              ...node.data,
              title: newTitle,
            },
          };
        }
        return node;
      })
    );
  };

  return (
    <div className="p-2 bg-white rounded-md border border-gray-300 w-[16rem] dark:bg-flow-darker">
      {/* 動態渲染左側的 handle */}
      {handles.map((handle, index) => (
        <Handle
          key={handle.id}
          type="target"
          position={Position.Left}
          id={handle.id}
          style={{
            ...handleStyle,
            top: `calc(50% + ${index * 20}px)` 
          }}
          title={handle.label}
          className="bg-[#555] dark:bg-white"
        />
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            ⋮
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" sideOffset={15} alignOffset={-5} className="w-28 dark:bg-flow-darker">
          <DropdownMenuItem onClick={handleCopyNode} className="text-gray-700 dark:!text-gray-200 hover:!bg-light dark:hover:!bg-gray-700">
            <span className="font-medium">Copy</span> Card
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDeleteNode} className="text-red-500 dark:text-red-400 hover:!bg-light hover:!text-red-500 dark:hover:!bg-gray-700">
            <span className="font-medium">Delete</span> Card
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="mb-2 font-bold">
        <input
          type="text"
          value={data?.title || `AI Prompt ${data.id}`}
          onMouseDownCapture={(e) => e.stopPropagation()}
          onChange={handleTitleChange}
          className="p-1 bg-transparent border-0 focus:border focus:border-gray-600 focus:outline-none rounded"
        />
      </div>
      {/* System Prompt */}
      <label  htmlFor={systemPromptId}  className="block text-md text-gray-700 mb-1 dark:text-white">System Prompt</label>
      <textarea
        ref={systemPromptRef}
        id={systemPromptId}
        name="systemPrompt"
        className="border border-gray-300 p-1 rounded w-full resize-y nodrag nowheel focus:outline-none focus:border-gray-600 focus:ring-0.5 focus:ring-gray-600 dark:bg-flow-darker"
        value={systemPrompt}
        onChange={(e) => handleSystemPromptUpdate(e.target.value)}
        rows={2}
      />
      {/* User Prompt */}
      <label htmlFor={userPromptId} className="block text-md text-gray-700 mb-1 dark:text-white">User Prompt</label>
      <span className="text-sm text-gray-500 mb-1 dark:text-gray-400">Use [:label:] to insert content from connected nodes.</span>
      <textarea
        ref={userPromptRef}
        id={userPromptId}
        name="userPrompt"
        className="border border-gray-300 p-1 rounded w-full resize-y nodrag nowheel focus:outline-none focus:border-gray-600 focus:ring-0.5 focus:ring-gray-600 dark:bg-flow-darker"
        value={userPrompt}
        onChange={(e) => handleUserPromptUpdate(e.target.value)}
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
        <button className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 flex  items-center justify-center ml-auto dark:bg-flow-darker dark:border dark:border-white" onClick={handleSendClick} disabled={loading}>
          <MdSend className="text-black text-lg ml-1 dark:text-white" />
          {loading ? 'Loading...' : 'Send'}
        </button>
      </div>

      {/* 結果輸出 */}
      <div className="mt-2 p-2 border rounded border-gray-200 pt-2 text-gray-500 text-sm max-h-[300px] overflow-y-auto nodrag nowheel" onClick={() => setIsDialogOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsDialogOpen(true);
          }
        }}>
        <ReactMarkdown>{result.length > 300 ? result.substring(0, 300) + '...' : result}</ReactMarkdown>
      </div>
      <Handle type="source" position={Position.Right} style={handleStyle} id="source" className="bg-[#555] dark:bg-white" />
      <TextContentDialog message={result} isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </div>
  );
}
AIPromptNode.displayName = 'AIPromptNode';

export default memo(AIPromptNode);