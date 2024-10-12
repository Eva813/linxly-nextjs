import { useState, useCallback, useEffect } from 'react';
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
  type NodeTypes
} from '@xyflow/react';
// import CustomNode from './textInputNode' // 導入自定義的 Node
import TextInputNode from './textInputNode'; // 導入 TextInputNode
import AiPromptNode from './aiPromptNode';  // 導入 AiPromptNode
// https://reactflow.dev/learn/getting-started/adding-interactivity
// https://reactflow.dev/learn/advanced-use/typescript
// 有不同的 custom node 類型，可以在 nodeTypes 中設定
// 例如: 一個輸入框的、或是2個輸入框的
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    style: { stroke: '#93c5fd' },
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    animated: true,
    style: { stroke: '#86efac' },
  },
];

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
  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  // 自定義節點類型
  const nodeTypes: NodeTypes = { textInputNode: TextInputNode, aiPromptNode: AiPromptNode };
  // 當頁面加載時，自動添加兩個節點
  useEffect(() => {
    const initialNodes = [
      {
        id: '1',
        type: 'textInputNode', // 指定節點類型為 textInputNode
        data: { label: 'Text Input 1', id: '1' },
        position: { x: 100, y: 100 },
      },
      {
        id: '2',
        type: 'aiPromptNode', // 指定節點類型為 aiPromptNode
        data: { label: 'AI Prompt 2', id: '2' },
        position: { x: 400, y: 100 },
      },
    ];
    setNodes(initialNodes);
  }, []);

  return (
    <div style={{ width: '100%', height: '800px' }}>
      <ReactFlow
        nodes={nodes}
        nodeTypes={nodeTypes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
        {/* <MiniMap /> */}
        <Panel position="top-right" className="bg-white p-4 rounded-lg shadow-lg">
          <h3 className="font-bold mb-2">Flow Controls</h3>
          {/* 按鈕 1: 增加文字輸入框的節點 */}
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 mb-2"
            onClick={() => {
              const id = `${nodes.length + 1}`;
              const newNode = {
                id,
                type: 'textInputNode', // 指定節點類型為 textInputNode
                data: { label: `Text Input ${id}`, id },
                position: {
                  x: Math.random() * 500,
                  y: Math.random() * 500,
                },
              };
              setNodes([...nodes, newNode]);
            }}
          >
            Add Text Input Node
          </button>

          {/* 按鈕 2: 增加 AI prompt 節點 */}
          <button
            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            onClick={() => {
              const id = `${nodes.length + 1}`;
              const newNode = {
                id,
                type: 'aiPromptNode', // 指定節點類型為 aiPromptNode
                data: { label: `AI Prompt ${id}`, id },
                position: {
                  x: Math.random() * 500,
                  y: Math.random() * 500,
                },
              };
              setNodes([...nodes, newNode]);
            }}
          >
            Add AI Prompt Node
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}