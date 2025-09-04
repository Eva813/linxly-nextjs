import { memo } from 'react';
import { usePromptRenderer } from '@/hooks/usePromptRenderer';
import type { JSONContent } from '@tiptap/react';

interface Prompt {
  id: string;
  name: string;
  content: string;
  contentJSON?: JSONContent | null;
  shortcut?: string;
}

interface PromptContentProps {
  selectedPrompt: Prompt | null;
}

const PromptContent = memo(function PromptContent({ selectedPrompt }: PromptContentProps) {
  const renderedContent = usePromptRenderer(
    selectedPrompt?.content,
    selectedPrompt?.contentJSON
  );

  return (
    <div className="lg:col-span-3 mt-4 lg:mt-0">
      <div className="bg-white rounded-md shadow-sm border h-[400px] lg:h-[600px] flex flex-col">
        {selectedPrompt ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b gap-2 flex-shrink-0">
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900">
                {selectedPrompt.name}
              </h3>
              {selectedPrompt.shortcut && (
                <span className="inline-block px-3 py-1 border-2 border-secondary text-sm rounded-full w-fit">
                  {selectedPrompt.shortcut}
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 lg:p-6">
              {renderedContent}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 p-4">
            <p className="text-center">Select a prompt to view its content</p>
          </div>
        )}
      </div>
    </div>
  );
});

export default PromptContent;