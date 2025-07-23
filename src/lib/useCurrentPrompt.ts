import { useEffect, useState } from 'react';
import { usePromptStore } from "@/stores/prompt";
import { useLoadingStore } from '@/stores/loading';
import { Prompt } from '@/types/prompt';

export function useCurrentPrompt(promptId: string) {
  const folders = usePromptStore(state => state.folders);
  const setLoading = useLoadingStore(state => state.setLoading);
  const [state, setState] = useState({
    prompt: null as Prompt | null,
    loading: true,
    error: null as string | null
  });

  useEffect(() => {
    // 初始設定載入狀態
    setLoading(true);
    setState(prevState => ({ ...prevState, loading: true }));

    // 尋找提示
    let found = false;
    for (const folder of folders) {
      const foundPrompt = folder.prompts.find((s: Prompt) => s.id === promptId);
      if (foundPrompt) {
        setState({
          prompt: foundPrompt,
          loading: false,
          error: null
        });
        setLoading(false);
        found = true;
        break;
      }
    }

    // 若沒找到提示
    if (!found) {
      setState({
        prompt: null,
        loading: false, // 修改為 false，與全域狀態保持一致
        error: '找不到提示'
      });
      setLoading(false);
    }
    
    // 元件卸載時清除載入狀態
    return () => {
      setLoading(false);
    };
  }, [folders, promptId, setLoading]);

  return state;
}