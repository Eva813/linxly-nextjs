import { useMemo } from 'react';
import { usePromptStore } from "@/stores/prompt";
import { Prompt } from '@/types/prompt';

export function useCurrentPrompt(promptId: string) {
  const folders = usePromptStore(state => state.folders);
  
  return useMemo(() => {
    // 只有當 folders 為空時才認為是載入中
    if (!folders.length) {
      return { prompt: null, loading: true, error: null };
    }
    
    // 搜尋指定的 prompt
    for (const folder of folders) {
      const prompt = folder.prompts.find((s: Prompt) => s.id === promptId);
      if (prompt) {
        return { prompt, loading: false, error: null };
      }
    }
    
    // 找不到 prompt
    return { prompt: null, loading: false, error: 'Prompt not found' };
  }, [folders, promptId]);
}