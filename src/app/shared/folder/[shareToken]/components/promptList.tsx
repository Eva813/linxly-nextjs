import { memo } from 'react';

interface Prompt {
  id: string;
  name: string;
  content: string;
  contentJSON?: object | null;
  shortcut?: string;
}

interface PromptListProps {
  prompts: Prompt[];
  selectedPromptId: string | null;
  onPromptSelect: (prompt: Prompt) => void;
}

const PromptList = memo(function PromptList({ 
  prompts, 
  selectedPromptId, 
  onPromptSelect 
}: PromptListProps) {
  return (
    <div className="lg:col-span-2">
      <div className="bg-white rounded-md shadow-sm border h-[400px] lg:h-[600px] flex flex-col">
        <div className="p-4 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            Prompts ({prompts.length})
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {prompts.map((prompt) => (
            <button
              key={prompt.id}
              onClick={() => onPromptSelect(prompt)}
              className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                selectedPromptId === prompt.id 
                  ? 'bg-light' 
                  : ''
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm text-gray-900 truncate">
                    {prompt.name}
                  </h4>
                  {prompt.shortcut && (
                    <span className="inline-block px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-600 ml-2 flex-shrink-0">
                      {prompt.shortcut}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

export default PromptList;