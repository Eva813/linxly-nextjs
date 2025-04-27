import { useState, useCallback, useEffect, useMemo } from 'react';
import '@xyflow/react/dist/style.css';
import {
  ReactFlow, Background, Controls, applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
  addEdge,
  type ColorMode,
  type ReactFlowInstance
} from '@xyflow/react';
// import CustomNode from './textInputNode' // 導入自定義的 Node
import TextInputNode from './textInputNode'; // 導入 TextInputNode
import AiPromptNode from './aiPromptNode';  // 導入 AiPromptNode
import FileUploadNode from './FileUploadNode'; // 導入 FileUploadNode
import { useTheme } from 'next-themes'
import { useLocalFlowData } from '@/lib/useLocalFlowData';
import FlowControlPanel from './flowControlPanel';
// https://reactflow.dev/learn/getting-started/adding-interactivity
// https://reactflow.dev/learn/advanced-use/typescript
// 有不同的 custom node 類型，可以在 nodeTypes 中設定
// 例如: 一個輸入框的、或是2個輸入框的
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export default function Flow({ boardId }: { boardId: string; }) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const { theme } = useTheme()
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null); // 用於儲存 ReactFlow 實例
  // 引入 useLocalFlowData
  const { getFlowData, saveFlowData } = useLocalFlowData(boardId);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes],
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges],
  );
  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

    // 自定義節點類型
    const nodeTypes = useMemo(() => ({
      textInputNode: TextInputNode,
      aiPromptNode: AiPromptNode,
      fileUploadNode: FileUploadNode
    }), []);
  
  // 用 useMemo 預先解析，避免多次讀取 localStorage
  const savedFlowData = useMemo(() => getFlowData(), [getFlowData]);

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
        data: {
          label: `AI Prompt ${newId}`, id: newId, systemPrompt: '',
          userPrompt: '',
          result: '', // 添加初始 result 
        },
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

  // onSave 函數，用於儲存流程圖
  const onSave = useCallback(async () => {
    if (rfInstance) {
      // 取得流程圖的物件表示
      const flowData = rfInstance.toObject();

      // 儲存到 localStorage（或發送至後端 API）
      saveFlowData(flowData);

      // 假設要發送至後端 API
      // try {
      //   const response = await fetch('/api/saveFlow', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({
      //       userId: 'user123', // 假設的用戶 ID
      //       flowKey: 'myFlowKey', // 流程圖的唯一鍵值
      //       flowData: flowData
      //     })
      //   });

      //   if (response.ok) {
      //     alert('流程圖已成功儲存到伺服器');
      //   } else {
      //     alert('儲存失敗');
      //   }
      // } catch (error) {
      //   console.error('儲存流程圖時發生錯誤:', error);
      //   alert('儲存過程中出現錯誤');
      // }
    }
  }, [rfInstance, saveFlowData]);

  // 定義 onRestore 函數，用於恢復已保存的流程圖
  const onRestore = useCallback(() => {
    const savedFlowData = getFlowData();;
    console.log('savedFlowData', savedFlowData);

    if (savedFlowData.nodes?.length || savedFlowData.edges?.length) {
      const { nodes = [], edges = [], viewport } = savedFlowData;
      setNodes(nodes);
      setEdges(edges);
      if (viewport && rfInstance) {
        rfInstance.setViewport(viewport);
      }
    } else {
      console.log('No saved flow data found, skipping restore.');
    }
  }, [rfInstance, getFlowData]);
  
  
  // 頁面加載
  useEffect(() => {
    if (!rfInstance) return; // 确保 ReactFlow 实例存在
    console.log('savedFlowData', savedFlowData);
    // 區分保存的空數據和完全沒有數據的情況
    if (savedFlowData.nodes?.length || savedFlowData.edges?.length) {
      // user 保存了流程（包括空節點和edge）
      console.log('Restoring saved flow data...');
      setNodes(savedFlowData.nodes || []);
      setEdges(savedFlowData.edges || []);

      if (savedFlowData.viewport) {
        rfInstance.setViewport(savedFlowData.viewport);
      }
    } else {
      // 沒有保存的數據，初始化默認節點
      console.log('Initializing Flow with default nodes...');
      const initialDefaultNodes = [
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
        },
      ];
      setNodes(initialDefaultNodes);
    }
  }, [rfInstance, boardId, onRestore, savedFlowData]);


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
        onInit={setRfInstance}  // 設定 ReactFlow 實例
      >
        <Background />
        <Controls />
        {/* <MiniMap /> */}
        <FlowControlPanel 
          onAddText={addTextInputNode}
          onAddAi={addAiPromptNode}
          onAddFile={addFileUploadNode}
          onSave={onSave}
          />
      </ReactFlow>
    </div >
  );
}
