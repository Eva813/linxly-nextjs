'use client';
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { ReactNode } from 'react';

const STORAGE_KEY = 'my_snippets';

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
  addFolder: (folder: Omit<Folder, 'id'>) => void;
  deleteFolder: (id: string) => void;
  addSnippetToFolder: (folderId: string, snippet: Omit<Snippet, 'id'>) => void;
  deleteSnippetFromFolder: (folderId: string, snippetId: string) => void;
  updateSnippet: (snippetId: string, updatedSnippet: Partial<Snippet>) => void;
  // Add these new properties
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  matchedSnippet: {
    content: string;
    targetElement: HTMLInputElement | null;
  };
  setMatchedSnippet: (snippet: { content: string; targetElement: HTMLInputElement | null }) => void;
}

const SnippetsContext = createContext<SnippetsContextType | undefined>(undefined);

export function SnippetsProvider({ children }: { children: ReactNode }) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const hasInitialized = useRef(false); // 初始化旗標
  // Add these new states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [matchedSnippet, setMatchedSnippet] = useState<{
    content: string;
    targetElement: HTMLInputElement | null;
  }>({
    content: '',
    targetElement: null
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && !hasInitialized.current) {
      const storedFolders = localStorage.getItem(STORAGE_KEY);
      if (storedFolders) {
        try {
          setFolders(JSON.parse(storedFolders));
        } catch (error) {
          console.error('Failed to parse folders from localStorage:', error);
        }
      } else {
        const defaultFolders: Folder[] = [
          {
            id: 'HplOMyf2mDqvVMdphJbt',
            name: 'My Sample Snippets',
            description: 'This is a sample folder',
            snippets: [
              {
                id: '5mJw031VPo2WxNIQyeXN',
                name: 'Demo - Plain text',
                content: 'be a software engineer',
                shortcut: '/do',
              },
              {
                id: '6mJw031VPo2WxNIQyeYN',
                name: 'Demo - Styled Text',
                content:
                  'be a translate expert, I will give you a sentence and help me translate to english',
                shortcut: '/doT',
              },
            ],
          },
        ];
        setFolders(defaultFolders);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultFolders));
      }
      hasInitialized.current = true; // 標記已初始化
    }
  }, []);

  // Add new useEffect for shortcut detection
  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      const target = e.target as HTMLInputElement;

      // 只處理 input 和 textarea，且必須有值
      if ((target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && target.value) {
        const currentValue = target.value;

        // 只在輸入 "/" 時才進行檢查
        if (e.key === '/' || currentValue.includes('/')) {
          let matchedSnippetData: Snippet | null = null;

          folders.forEach(folder => {
            folder.snippets.forEach(snippet => {
              // 確保 shortcut 是以 "/" 開頭
              if (snippet.shortcut.startsWith('/') &&
                currentValue.endsWith(snippet.shortcut)) {
                if (!matchedSnippetData ||
                  snippet.shortcut.length > matchedSnippetData.shortcut.length) {
                  matchedSnippetData = snippet;
                }
              }
            });
          });

          if (matchedSnippetData) {
            console.log('Found matching snippet:', matchedSnippetData);
            setMatchedSnippet({
              content: matchedSnippetData.content,
              targetElement: target
            });
            setIsDialogOpen(true);

            // 移除 shortcut
            const newValue = currentValue.slice(
              0,
              currentValue.length - matchedSnippetData.shortcut.length
            );
            target.value = newValue;
          }
        }
      }
    };

    document.addEventListener('keyup', handleKeyUp);
    return () => document.removeEventListener('keyup', handleKeyUp);
  }, [folders]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('Saving to localStorage:', folders);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
    }
  }, [folders]);

  // const updateFolder = (id: string, updates: Partial<Folder>) => {
  //   setFolders((prevFolders) =>
  //     prevFolders.map((folder) =>
  //       folder.id === id ? { ...folder, ...updates } : folder
  //     )
  //   );
  // };
  const updateFolder = (id: string, updates: Partial<Folder>) => {
    setFolders((prevFolders) => {
      const updatedFolders = prevFolders.map((folder) =>
        folder.id === id ? { ...folder, ...updates } : folder
      );
      console.log('Updated folders:', updatedFolders);
      return updatedFolders;
    });
  };

  const addFolder = (folder: Omit<Folder, 'id'>) => {
    const newFolder = { ...folder, id: Date.now().toString() };
    setFolders((prevFolders) => [...prevFolders, newFolder]);
  };

  const deleteFolder = (id: string) => {
    setFolders((prevFolders) =>
      prevFolders.filter((folder) => folder.id !== id)
    );
  };

  const addSnippetToFolder = (folderId: string, snippet: Omit<Snippet, 'id'>) => {
    const newSnippet = { ...snippet, id: Date.now().toString() };
    setFolders((prevFolders) =>
      prevFolders.map((folder) =>
        folder.id === folderId
          ? { ...folder, snippets: [...folder.snippets, newSnippet] }
          : folder
      )
    );
  };

  const deleteSnippetFromFolder = (folderId: string, snippetId: string) => {
    setFolders((prevFolders) =>
      prevFolders.map((folder) =>
        folder.id === folderId
          ? {
            ...folder,
            snippets: folder.snippets.filter(
              (snippet) => snippet.id !== snippetId
            ),
          }
          : folder
      )
    );
  };

  const updateSnippet = (snippetId: string, updatedSnippet: Partial<Snippet>) => {
    setFolders(prevFolders =>
      prevFolders.map(folder => ({
        ...folder,
        snippets: folder.snippets.map(snippet =>
          snippet.id === snippetId ? { ...snippet, ...updatedSnippet } : snippet
        ),
      }))
    );
  };

  return (
    <SnippetsContext.Provider
      value={{
        folders,
        setFolders,
        updateFolder,
        addFolder,
        deleteFolder,
        addSnippetToFolder,
        deleteSnippetFromFolder,
        updateSnippet,
        // Add these new values
        isDialogOpen,
        setIsDialogOpen,
        matchedSnippet,
        setMatchedSnippet
      }}
    >
      {children}
    </SnippetsContext.Provider>
  );
}

export const useSnippets = () => {
  const context = useContext(SnippetsContext);
  if (!context) {
    throw new Error('useSnippets must be used within a SnippetsProvider');
  }
  return context;
};
