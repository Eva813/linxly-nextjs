import React from 'react';
import { Panel } from '@xyflow/react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { LuText, LuSave, LuFileUp } from "react-icons/lu";
import { GiArtificialHive } from "react-icons/gi";

interface FlowControlPanelProps {
  onAddText: () => void;
  onAddAi: () => void;
  onAddFile: () => void;
  onSave: () => void;
}

const FlowControlPanel: React.FC<FlowControlPanelProps> = React.memo(({ onAddText, onAddAi, onAddFile, onSave }) => {
  return (
    <Panel
      position="top-left"
      className="bg-white p-2 shadow-sm flex flex-col dark:bg-flow-dark"
      style={{ position: 'fixed', top: '120px', left: '10px', zIndex: 100 }}
    >
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={onAddText} className="px-2 py-1 border rounded hover:bg-gray-200 mb-2">
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
          <TooltipTrigger asChild>
            <button onClick={onAddAi} className="px-2 py-1 border rounded hover:bg-gray-200 mb-2">
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
          <TooltipTrigger asChild>
            <button onClick={onAddFile} className="px-2 py-1 border rounded hover:bg-gray-200 mb-2">
              <LuFileUp className="text-black dark:text-white" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" align="center">
            <p>Add File Upload Node</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={onSave} className="px-2 py-1 border rounded hover:bg-gray-200 mb-2">
              <LuSave className="text-black dark:text-white" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" align="center">
            <p>Save Board</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Panel>
  );
});

FlowControlPanel.displayName = 'FlowControlPanel';
export default FlowControlPanel;
