"use client";
import { Button } from '@/components/ui/button';
import { useSnippets } from '@/contexts/SnippetsContext';
import { useState } from 'react';

interface FolderPageProps {
  params: {
    folderId: string;
  };
}

const FolderPage = ({ params }: FolderPageProps) => {
  const { folderId } = params;
  const { folders, updateFolder } = useSnippets();

  const currentFolder = folders.find(folder => folder.id === folderId);

  const [name, setName] = useState(currentFolder ? currentFolder.name : '');
  const [description, setDescription] = useState(currentFolder ? currentFolder.description : '');

  if (!currentFolder) {
    return <p>Folder not found.</p>;
  }

  const handleSave = () => {
    updateFolder(folderId, { name, description });
  };

  return (
    <div className='flex flex-col'>
      <input
        type="text"
        className="text-2xl focus:outline-none mb-2"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <textarea
        value={description}
        rows={4}
        className='focus:outline-gray-500 hover:ring-1 hover:ring-gray-400 p-2 rounded mb-2'
        onChange={(e) => { setDescription(e.target.value) }}
        placeholder="input description"
      />
      <Button className='w-20' onClick={handleSave}>Save</Button>
    </div>
  );
};

export default FolderPage;