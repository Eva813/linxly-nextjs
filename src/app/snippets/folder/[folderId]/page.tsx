"use client";
import { Button } from '@/components/ui/button';
import { useSnippetStore } from "@/stores/snippet";
import { useState, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import EditorSkeleton from '@/app/snippets/components/editorSkeleton';
import { useLoadingStore } from '@/stores/loading';
import { getFolderShares } from '@/api/folders';
import { useSession } from 'next-auth/react';

interface FolderPageProps {
  params: {
    folderId: string;
  };
}

const FolderPage = ({ params }: FolderPageProps) => {
  const { folderId } = params;
  const { folders, updateFolder } = useSnippetStore();

  const currentFolder = folders.find(folder => folder.id === folderId);
  const { setLoading } = useLoadingStore();

    // 新增：分享清單與權限判斷
  const [shares, setShares] = useState<{ email: string; permission: string; _id: string }[]>([]);
  const { data: session } = useSession();
  const userPermission = shares.find(s => s.email === session?.user?.email)?.permission;
  const canEdit = userPermission !== 'viewer';

  useEffect(() => {
    if (session?.user?.email) {
      getFolderShares(folderId)
        .then(list => setShares(list))
        .catch(err => console.error("取得分享清單失敗", err));
    }
  }, [folderId, session?.user?.email]);
  

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
    return <EditorSkeleton />;
  }

  const handleSave = async () => {
    setLoading(true); 

    try {
      await Promise.all([
        updateFolder(folderId, { name, description }), 
        new Promise(resolve => setTimeout(resolve, 300)), 
      ]);
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
        disabled={!canEdit}
      />
      <Textarea
        value={description}
        rows={4}
        className='hover:ring-1 hover:ring-gray-400 p-2 rounded mb-2 dark:border-gray-200'
        onChange={(e) => setDescription(e.target.value)}
        placeholder="input description"
        disabled={!canEdit}
      />
      <Button className='w-20' onClick={handleSave} disabled={!canEdit}>Save</Button>
    </div>
  );
};

export default FolderPage;