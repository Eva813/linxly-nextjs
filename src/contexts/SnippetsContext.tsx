'use client';
import { createContext, useContext, useState } from 'react';
import { ReactNode } from 'react';

interface Snippet {
  id: string;
  name: string;
  content: string;
  shortcut: string;
}

interface Folder {
  id: string;
  name: string;
  description: string;
  snippets: Snippet[];
}

interface SnippetsContextType {
  folders: Folder[];
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
}

const SnippetsContext = createContext<SnippetsContextType>({
  folders: [],
  setFolders: () => { },
  updateFolder: () => { }
});


export function SnippetsProvider({ children }: { children: ReactNode }) {
  const [folders, setFolders] = useState([
    {
      id: 'HplOMyf2mDqvVMdphJbt',
      name: 'My Sample Snippets',
      description: 'This is a sample folder',
      snippets: [
        { id: '5mJw031VPo2WxNIQyeXN', name: 'Demo - Plain text', content: 'be a software egineer', shortcut: '/do' },
        { id: '6mJw031VPo2WxNIQyeYN', name: 'Demo - Styled Text', content: 'be a translate expert, I will give you a sentence and help me translate to english', shortcut: '/doT' },
      ],
    },
  ]);

  const updateFolder = (id: string, updates: Partial<Folder>) => {
    setFolders(prevFolders =>
      prevFolders.map(folder =>
        folder.id === id ? { ...folder, ...updates } : folder
      )
    );
  };


  return (
    <SnippetsContext.Provider value={{ folders, setFolders, updateFolder }}>
      {children}
    </SnippetsContext.Provider>
  );
}

export const useSnippets = () => {
  return useContext(SnippetsContext);
};