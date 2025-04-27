import { useEffect, useState } from 'react';
import { useSnippetStore } from "@/stores/snippet";
import { useLoadingStore } from '@/stores/loading';
import { Snippet } from '@/types/snippets';

export function useCurrentSnippet(snippetId: string) {
  const { folders } = useSnippetStore();
  const { setLoading } = useLoadingStore();
  const [state, setState] = useState({
    snippet: null as Snippet | null,
    loading: true,
    error: null as string | null
  });

  useEffect(() => {
    // 初始設定載入狀態
    setLoading(true);
    setState(prevState => ({ ...prevState, loading: true }));
    
    // 尋找程式碼片段
    let found = false;
    for (const folder of folders) {
      const foundSnippet = folder.snippets.find((s: Snippet) => s.id === snippetId);
      if (foundSnippet) {
        setState({
          snippet: foundSnippet,
          loading: false,
          error: null
        });
        setLoading(false);
        found = true;
        break;
      }
    }
    
    // 若沒找到程式碼片段
    if (!found) {
      setState({
        snippet: null,
        loading: false, // 修改為 false，與全域狀態保持一致
        error: '找不到程式碼片段'
      });
      setLoading(false);
    }
    
    // 元件卸載時清除載入狀態
    return () => {
      setLoading(false);
    };
  }, [folders, snippetId, setLoading]);
  
  return state;
}