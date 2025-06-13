"use client";
import { Button } from '@/components/ui/button';
import { usePromptStore } from "@/stores/prompt";
import { useState, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import EditorSkeleton from '@/app/prompts/components/editorSkeleton';
import { useLoadingStore } from '@/stores/loading';
import { deepEqual } from '@/lib/utils/deepEqual';

interface FolderPageProps {
  params: {
    folderId: string;
  };
}

const FolderPage = ({ params }: FolderPageProps) => {
  const { folderId } = params;
  const { folders, updateFolder } = usePromptStore();

  const currentFolder = folders.find(folder => folder.id === folderId);
  const { setLoading } = useLoadingStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialValues, setInitialValues] = useState({
    name: '',
    description: ''
  });

  // 監聽 currentFolder 的變化，並更新本地狀態
  useEffect(() => {
    if (currentFolder) {
      setName(currentFolder.name);
      setDescription(currentFolder.description);
      
      setInitialValues({
        name: currentFolder.name,
        description: currentFolder.description
      });
      
      setHasUnsavedChanges(false);
    }
  }, [currentFolder]);

  useEffect(() => {
    const currentValues = {
      name,
      description
    };
    
    const hasChanges = !deepEqual(currentValues, initialValues);
    
    setHasUnsavedChanges(hasChanges);
  }, [name, description, initialValues]);

  if (!currentFolder) {
    return <EditorSkeleton />;
  }

  const handleSave = async () => {
    setLoading(true); 

    try {
      await Promise.all([
        updateFolder(folderId, { name, description }), 
        new Promise(resolve => setTimeout(resolve, 300)), 
      ]);
      
      setInitialValues({
        name,
        description
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving folder:", error);
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className='flex flex-col'>
      <input
        type="text"
        className="text-2xl focus:outline-none mb-2 dark:bg-black"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Textarea
        value={description}
        rows={4}
        className='hover:ring-1 hover:ring-gray-400 p-2 rounded mb-2 dark:border-gray-200 resize-y max-h-64'
        onChange={(e) => setDescription(e.target.value)}
        placeholder="input description"
      />
      <Button 
        className='w-20' 
        onClick={handleSave}
        disabled={!hasUnsavedChanges}
      >
        Save
      </Button>
    </div>
  );
};

export default FolderPage;