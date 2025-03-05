// "use client";
// import React, { createContext, useContext, useState } from 'react';

// interface NodeData {
//   [nodeId: string]: string; // nodeId 與文字內容的對應
// }

// interface NodeContextProps {
//   nodeData: NodeData;
//   setNodeData: (nodeId: string, content: string) => void;
// }

// const NodeContext = createContext<NodeContextProps | undefined>(undefined);

// interface NodeProviderProps {
//   children: React.ReactNode;
// }

// export const NodeProvider: React.FC<NodeProviderProps> = ({ children }) => {
//   const [nodeData, setNodeDataState] = useState<NodeData>({});

//   const setNodeData = (nodeId: string, content: string) => {
//     setNodeDataState((prev) => ({ ...prev, [nodeId]: content }));
//   };

//   return (
//     <NodeContext.Provider value={{ nodeData, setNodeData }}>
//       {children}
//     </NodeContext.Provider>
//   );
// };

// export const useNodeData = () => {
//   const context = useContext(NodeContext);
//   if (!context) {
//     throw new Error('useNodeData 必須在 NodeProvider 中使用');
//   }
//   return context;
// };
