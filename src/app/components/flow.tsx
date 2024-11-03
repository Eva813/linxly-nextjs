import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow, Background, Controls, Panel, applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  type Node,
  type Edge,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
  addEdge,
  type NodeTypes,
  type ColorMode
} from '@xyflow/react';
// import CustomNode from './textInputNode' // 導入自定義的 Node
import TextInputNode from './textInputNode'; // 導入 TextInputNode
import AiPromptNode from './aiPromptNode';  // 導入 AiPromptNode
import FileUploadNode from './FileUploadNode'; // 導入 FileUploadNode
import { LuText } from "react-icons/lu";
import { GiArtificialHive } from "react-icons/gi";
import { LuFileUp } from "react-icons/lu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTheme } from 'next-themes'
// https://reactflow.dev/learn/getting-started/adding-interactivity
// https://reactflow.dev/learn/advanced-use/typescript
// 有不同的 custom node 類型，可以在 nodeTypes 中設定
// 例如: 一個輸入框的、或是2個輸入框的
const initialNodes: Node[] = [];
// const initialEdges: Edge[] = [
//   {
//     id: 'e1-2',
//     source: '1',
//     target: '2',
//     style: { stroke: '#93c5fd' },
//   },
//   {
//     id: 'e2-3',
//     source: '2',
//     target: '3',
//     animated: true,
//     style: { stroke: '#86efac' },
//   },
// ];
const initialEdges: Edge[] = [];

export default function Flow() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes],
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges],
  );
  const { theme } = useTheme()

  // const onConnect: OnConnect = useCallback(
  //   (connection) => {
  //     // Check if the connection is valid
  //     if (connection.source && connection.target) {
  //       // setEdges((eds) => addEdge({
  //       //   ...connection,
  //       //   // Use the full handle IDs
  //       //   sourceHandle: `source-${connection.source}`,
  //       //   targetHandle: connection.targetHandle,
  //       // }, eds));
  //       setEdges((eds) => {
  //         const newEdge = addEdge(connection, eds);
  //         console.log('New edge created:', newEdge);
  //         return newEdge;
  //       });
  //     } else {
  //       console.log('Invalid connection:', connection);
  //     }
  //   },
  //   [setEdges],
  // );
  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  //  const onConnect: OnConnect = useCallback(
  //   (connection) => {
  //     setEdges((eds) => addEdge({
  //       ...connection,
  //       sourceHandle: 'text-output', // 確保來源 handle 固定
  //       // 讓目標 handle 保持動態，使用 connection.targetHandle
  //       targetHandle: connection.targetHandle,
  //     }, eds));
  //   },
  //   [setEdges],
  // );

  // 自定義節點類型
  const nodeTypes = useMemo(() => ({
    textInputNode: TextInputNode,
    aiPromptNode: AiPromptNode,
    fileUploadNode: FileUploadNode
  }), []);
  // 當頁面加載時，自動添加兩個節點
  useEffect(() => {
    const initialNodes = [
      {
        id: '1',
        type: 'textInputNode', // 指定節點類型為 textInputNode
        data: { label: 'Text Input 1', id: '1' },
        position: { x: 400, y: 100 },
      },
      {
        id: '2',
        type: 'aiPromptNode', // 指定節點類型為 aiPromptNode
        data: { label: 'AI Prompt 2', id: '2' },
        position: { x: 700, y: 100 },
      }
    ];
    setNodes(initialNodes);
  }, []);

  // 找到最後一個 textInputNode 的位置
  const getNewNodePosition = useCallback(() => {
    const textNodes = nodes.filter(node => node.type === 'textInputNode');
    if (textNodes.length === 0) {
      // 如果沒有現有的 textInputNode，返回預設位置
      return { x: 100, y: 100 };
    }

    // 找到最下方的節點
    const lastNode = textNodes.reduce((lowest, current) => {
      return (current.position.y > lowest.position.y) ? current : lowest;
    }, textNodes[0]);

    // 在最後一個節點下方 150 像素的位置新增節點
    return {
      x: lastNode.position.x,
      y: lastNode.position.y + 150
    };
  }, [nodes]);
  // 修改新增文字輸入框節點的處理函數
  const addTextInputNode = useCallback(() => {
    setNodes((currentNodes) => {
      const newId = `${Date.now()}`; // 使用時間戳作為唯一ID
      // 取得新的節點位置
      const position = getNewNodePosition();
      const newNode = {
        id: newId,
        type: 'textInputNode',
        data: { label: `Text Input ${newId}`, id: newId },
        position: position,
      };
      return [...currentNodes, newNode];
    });
  }, [getNewNodePosition]);

  // 修改新增AI prompt節點的處理函數
  const addAiPromptNode = useCallback(() => {
    setNodes((currentNodes) => {
      const newId = `${Date.now()}`;
      const newNode = {
        id: newId,
        type: 'aiPromptNode',
        data: { label: `AI Prompt ${newId}`, id: newId },
        position: {
          x: Math.random() * 500,
          y: Math.random() * 500,
        },
      };
      return [...currentNodes, newNode];
    });
  }, []);

  // 修改新增檔案上傳節點的處理函數
  const addFileUploadNode = useCallback(() => {
    setNodes((currentNodes) => {
      const newId = `${Date.now()}`;
      const newNode = {
        id: newId,
        type: 'fileUploadNode',
        data: { label: `File Upload ${newId}`, id: newId },
        position: {
          x: Math.random() * 500,
          y: Math.random() * 500,
        },
      };
      return [...currentNodes, newNode];
    });
  }, []);

  return (
    <div className='h-[calc(100vh-64px)] w-full' >
      <ReactFlow
        nodes={nodes}
        nodeTypes={nodeTypes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        panOnScroll
        selectionOnDrag
        preventScrolling={false}
        colorMode={theme as ColorMode}
      >
        <Background />
        <Controls />
        {/* <MiniMap /> */}
        <Panel position="top-left" className="bg-white p-2 shadow-sm flex flex-col dark:bg-flow-dark" style={{ position: 'fixed', top: '80px', left: '40px', zIndex: 100 }} >
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              {/* 按鈕 1: 增加文字輸入框的節點 */}
              <TooltipTrigger asChild>
                <button
                  className="px-2 py-1 border border-gray-300 rounded p-1 hover:bg-gray-200 mb-2  hover:border-gray-200 transition-colors dark:hover:bg-flow-dark-hover"
                  onClick={addTextInputNode}
                >
                  <LuText className="text-black dark:text-white" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" align="center">
                <p>Add Text Input Node</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              {/* 按鈕 2: 增加 AI prompt 節點 */}
              <TooltipTrigger asChild>
                <button
                  className="px-2 py-1 border border-gray-300 rounded p-1 hover:bg-gray-200 mb-2  hover:border-gray-200 transition-colors dark:hover:bg-flow-dark-hover"
                  onClick={addAiPromptNode}
                >
                  <GiArtificialHive className="text-black dark:text-white" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" align="center">
                <p>Add AI Prompt Node</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              {/* 按鈕 3: 增加 上傳 txt 檔案 節點 */}
              <TooltipTrigger asChild>
                <button
                  className="px-2 py-1 border border-gray-300 rounded p-1 hover:bg-gray-200 mb-2 hover:border-gray-200 transition-colors dark:hover:bg-flow-dark-hover"
                  onClick={addFileUploadNode}
                >
                  <LuFileUp className="text-black dark:text-white" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" align="center">
                <p>Add File Upload Node</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Panel>
      </ReactFlow>
    </div >
  );
}
