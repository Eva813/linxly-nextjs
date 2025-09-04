'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SharedFolderData } from '@/shared/types/sharedFolder';
import FolderHeader from './folderHeader';
import PromptList from './promptList';
import PromptContent from './promptContent';
import CTASection from './ctaSection';

interface SharedFolderViewProps {
  data: SharedFolderData;
}

export default function SharedFolderView({ data }: SharedFolderViewProps) {
  const { folder, prompts } = data;
  const [selectedPrompt, setSelectedPrompt] = useState(prompts.length > 0 ? prompts[0] : null);
  
  const handlePromptSelect = useCallback((prompt: typeof prompts[0]) => {
    setSelectedPrompt(prompt);
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-12">
        <FolderHeader 
          folderName={folder.name}
          folderDescription={folder.description}
        />
        
        {prompts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">
                This folder doesn&apos;t contain any prompts yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col lg:grid lg:grid-cols-5 gap-8 min-h-[600px]">
            <PromptList 
              prompts={prompts}
              selectedPromptId={selectedPrompt?.id || null}
              onPromptSelect={handlePromptSelect}
            />
            <PromptContent selectedPrompt={selectedPrompt} />
          </div>
        )}
        
      </div>
      
      <CTASection />
    </div>
  );
}