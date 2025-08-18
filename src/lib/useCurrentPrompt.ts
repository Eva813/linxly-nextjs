import { useMemo, useState, useEffect } from 'react';
import { usePromptStore } from "@/stores/prompt";
import { Prompt } from '@/types/prompt';

export function useCurrentPrompt(promptId: string) {
  const folders = usePromptStore(state => state.folders);
  const [directPrompt, setDirectPrompt] = useState<Prompt | null>(null);
  const [directLoading, setDirectLoading] = useState(false);
  
  // 從 folders 中尋找 prompt 的原始邏輯
  const folderPrompt = useMemo(() => {
    if (!folders.length) {
      return null;
    }
    
    for (const folder of folders) {
      const prompt = folder.prompts.find((s: Prompt) => s.id === promptId);
      if (prompt) {
        return prompt;
      }
    }
    
    return null;
  }, [folders, promptId]);
  
  // 只有當兩種格式都沒有內容時才需要直接調用 API
  useEffect(() => {
    if (folderPrompt && 
        (!folderPrompt.contentJSON || Object.keys(folderPrompt.contentJSON || {}).length === 0) && 
        (!folderPrompt.content || folderPrompt.content.trim() === '') &&
        !directLoading && 
        !directPrompt) { // 重要：如果已經有 directPrompt 就不再調用 API
      setDirectLoading(true);
      
      fetch(`/api/v1/prompts/${promptId}`, {
        headers: { 'x-user-id': 'NmNvktyVdOsz01qFQFNJ' } // TODO: 改為動態取得
      })
      .then(res => res.json())
      .then((data: Prompt) => {
        setDirectPrompt(data);
        setDirectLoading(false);
      })
      .catch(err => {
        console.error('直接 API 調用失敗:', err);
        setDirectLoading(false);
      });
    }
  }, [folderPrompt, promptId, directLoading, directPrompt]);
  
  return useMemo(() => {
    // 優先使用直接 API 取得的完整資料
    if (directPrompt) {
      return { prompt: directPrompt, loading: false, error: null };
    }
    
    // 如果正在直接載入
    if (directLoading) {
      return { prompt: folderPrompt, loading: true, error: null };
    }
    
    // 只有當 folders 為空時才認為是載入中
    if (!folders.length) {
      return { prompt: null, loading: true, error: null };
    }
    
    // 使用 folder 中的 prompt
    if (folderPrompt) {
      return { prompt: folderPrompt, loading: false, error: null };
    }
    
    // 找不到 prompt
    return { prompt: null, loading: false, error: 'Prompt not found' };
  }, [directPrompt, directLoading, folderPrompt, folders.length]);
}