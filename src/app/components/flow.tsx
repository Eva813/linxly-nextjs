import { useState, useCallback } from 'react';
import { ReactFlow, Background, Controls, Panel } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  type Node,
  type Edge
} from '@xyflow/react';

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Input Node' },
    position: { x: 250, y: 25 },
    style: {
      background: '#f0f9ff',
      border: '1px solid #93c5fd',
      borderRadius: '8px',
      padding: '10px',
    },
  },
  {
    id: '2',
    data: { label: 'Default Node' },
    position: { x: 100, y: 125 },
    style: {
      background: '#f0fdf4',
      border: '1px solid #86efac',
      borderRadius: '8px',
      padding: '10px',
    },
  },
  {
    id: '3',
    type: 'output',
    data: { label: 'Output Node' },
    position: { x: 250, y: 250 },
    style: {
      background: '#fef2f2',
      border: '1px solid #fca5a5',
      borderRadius: '8px',
      padding: '10px',
    },
  },
];

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

  const onNodesChange = useCallback((changes: any) => {
    setNodes((nds) => {
      return [...nds];
    });
  }, []);

  const onEdgesChange = useCallback((changes: any) => {
    setEdges((eds) => {
      return [...eds];
    });
  }, []);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => {
        const newEdge: Edge = {
          ...params,
          id: `e${params.source}-${params.target}`,
        };
        return [...eds, newEdge];
      });
    },
    []
  );

  return (
    <div style={{ width: '100%', height: '800px' }}>
      <ReactFlow
        nodes={nodes}
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
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => {
              const id = `${nodes.length + 1}`;
              const newNode = {
                id,
                data: { label: `Node ${id}` },
                position: {
                  x: Math.random() * 500,
                  y: Math.random() * 500,
                },
              };
              setNodes([...nodes, newNode]);
            }}
          >
            Add Node
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}