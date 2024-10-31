import { useState, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { MdUploadFile } from "react-icons/md";

const handleStyle = {
  background: '#555', // Custom color for the handle
  width: 10,          // Custom width
  height: 10,         // Custom height
};

function FileUploadNode({ data, id }: NodeProps) {
  const [fileName, setFileName] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const { setNodes } = useReactFlow();
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/plain') {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFileContent(content);

        setNodes((nodes) => {
          return nodes.map((node) => {
            if (node.id === id) {
              // 創建一個全新的 data 對象
              const newData = {
                ...node.data,
                id: node.data.id,
                label: node.data.label,
                fileContent: content,
              };

              // 返回一個新的節點對象
              return {
                ...node,
                data: newData
              };
            }
            return node;
          });
        });

        console.log('File uploaded and node updated');
      };
      reader.readAsText(file);
    } else {
      alert('請上傳 .txt 文件');
    }
  }, [id, setNodes]);

  return (
    <div className="px-4 py-2 rounded-md bg-white border border-gray-300 w-[16rem]">
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-bold mb-2">File Upload</h3>
        <div className="flex flex-col items-center mb-2">
          {fileName ? (
            <>
              <span className="text-sm mt-1 text-bold">{fileName}</span>
            </>
          ) : (
            <label className="cursor-pointer">
              <div className="border-2 border-dashed border-gray-200 rounded-lg flex flex-col gap-1 p-6 items-center hover:bg-gray-50">
                <MdUploadFile className="w-12 h-12" />
                <span className="text-sm font-medium text-gray-500">click to upload</span>
                <span className="text-xs text-gray-500">txt file</span>
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </label>
          )}
        </div>
        {fileContent && (
          <div className="mt-4 w-full overflow-y-auto min-h-[250px] ">
            <textarea
              className="w-full p-2 border rounded resize-y overflow-y-auto nodrag nowheel min-h-[250px]"
              value={fileContent}
              readOnly
            />
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} style={handleStyle} />
    </div>
  );
}

export default FileUploadNode;
