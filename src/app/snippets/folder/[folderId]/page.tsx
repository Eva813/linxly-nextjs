"use client";
import { Button } from '@/components/ui/button';
import { useSnippets } from '@/contexts/SnippetsContext';
import { useState, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea"

interface FolderPageProps {
  params: {
    folderId: string;
  };
}

const FolderPage = ({ params }: FolderPageProps) => {
  const { folderId } = params;
  const { folders, updateFolder } = useSnippets();

  const currentFolder = folders.find(folder => folder.id === folderId);

  // 本地狀態，用於雙向綁定
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // 監聽 currentFolder 的變化，並更新本地狀態
  useEffect(() => {
    if (currentFolder) {
      setName(currentFolder.name);
      setDescription(currentFolder.description);
    }
  }, [currentFolder]);

  if (!currentFolder) {
    return <p>Folder not found.</p>;
  }

  const handleSave = () => {
    if (currentFolder) {
      const updatedFolder = {
        ...currentFolder,
        name,
        description,
      };
      console.log('Updating folder:', updatedFolder);
      updateFolder(folderId, updatedFolder);
    }
  };

  return (
    <div className='flex flex-col'>
      <input
        type="text"
        className="text-2xl focus:outline-none mb-2"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Textarea
        value={description}
        rows={4}
        className=' hover:ring-1 hover:ring-gray-400 p-2 rounded mb-2'
        onChange={(e) => { setDescription(e.target.value) }}
        placeholder="input description"
      />
      <Button className='w-20' onClick={handleSave}>Save</Button>
    </div>
  );
};

export default FolderPage;