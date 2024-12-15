// pages/snippets/snippet/[id].tsx
'use client';
import { useSnippets } from '@/contexts/SnippetsContext';
import { Input } from "@/components/ui/input";
import { FaTag } from "react-icons/fa6";
import { FaKeyboard } from "react-icons/fa6";
import { useState, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea"
import { Button } from '@/components/ui/button';

interface SnippetPageProps {
  params: {
    snippetId: string;
  };
}

const SnippetPage = ({ params }: SnippetPageProps) => {
  const { snippetId } = params;
  const { folders, updateSnippet } = useSnippets();
  const [name, setName] = useState('');
  const [shortcut, setShortcut] = useState('');
  const [content, setContent] = useState('');

  let currentSnippet = null;
  for (const folder of folders) {
    const snippet = folder.snippets.find(s => s.id === snippetId);
    if (snippet) {
      currentSnippet = snippet;
      break;
    }
  }
  useEffect(() => {
    if (currentSnippet) {
      setName(currentSnippet.name);
      setShortcut(currentSnippet.shortcut);
      setContent(currentSnippet.content);
    }
  }, [currentSnippet]);

  if (!currentSnippet) {
    return <p>Snippet not found.</p>;
  }

  const handleSave = () => {
    if (currentSnippet) {
      const updatedSnippet = {
        ...currentSnippet,
        name,
        shortcut,
        content,
      };
      console.log('Updating snippet:', updatedSnippet);
      updateSnippet(snippetId, updatedSnippet);
    }
  }

  return (
    <div>
      <div className='grid grid-cols-2 gap-x-4 mb-4'>
        <div className="relative col-span-1">
          <Input className="pl-9" placeholder="Type snippet name..." value={name}
            onChange={(e) => setName(e.target.value)} />
          <FaTag className="absolute left-0 top-0 m-2.5 h-4 w-4 text-muted-foreground" />
        </div>
        <div className="relative col-span-1">
          <Input className="pl-9" placeholder="Add a shortcut..." value={shortcut} onChange={(e) => setShortcut(e.target.value)} />
          <FaKeyboard className="absolute left-0 top-0 m-2.5 h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <Textarea placeholder="Type your message here." className='hover:ring-1 hover:ring-gray-400 mb-2' rows={6} value={content} onChange={(e) => setContent(e.target.value)} />
      <Button className='w-20' onClick={handleSave}>Save</Button>
    </div>
  );
};

export default SnippetPage;